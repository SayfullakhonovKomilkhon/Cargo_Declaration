import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import {
  getAnthropicService,
  type DocumentTypeForAI,
  type AIExtractedData,
} from '@/server/services/anthropic.service';
import { StorageService } from '@/server/services/storage.service';
import {
  validateAIExtractedData,
  mergeExtractedData,
} from '@/server/utils/ai-data-validator';
import {
  processDocumentForAI,
  validateFileSize,
} from '@/server/utils/document-processor';

interface ProcessResult {
  documentId: string;
  success: boolean;
  data?: AIExtractedData;
  error?: string;
}

/**
 * POST /api/documents/batch-process
 * Process multiple documents in parallel
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать массив ID документов' },
        { status: 400 }
      );
    }

    if (documentIds.length > 10) {
      return NextResponse.json(
        { error: 'Максимум 10 документов за один раз' },
        { status: 400 }
      );
    }

    // Find all documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
      },
    });

    if (documents.length === 0) {
      return NextResponse.json({ error: 'Документы не найдены' }, { status: 404 });
    }

    // Check access rights for all documents
    const unauthorized = documents.filter(
      (doc) => session.user.role !== 'ADMIN' && doc.uploadedById !== session.user.id
    );

    if (unauthorized.length > 0) {
      return NextResponse.json(
        {
          error: 'Нет доступа к некоторым документам',
          unauthorizedIds: unauthorized.map((d) => d.id),
        },
        { status: 403 }
      );
    }

    // Update all documents to PROCESSING status
    await prisma.document.updateMany({
      where: {
        id: { in: documentIds },
        processingStatus: { not: 'COMPLETED' },
      },
      data: { processingStatus: 'PROCESSING' },
    });

    // Process documents in parallel
    const anthropicService = getAnthropicService();

    const processDocument = async (
      doc: (typeof documents)[0]
    ): Promise<ProcessResult> => {
      // Skip already processed documents
      if (doc.processingStatus === 'COMPLETED' && doc.extractedData) {
        return {
          documentId: doc.id,
          success: true,
          data: doc.extractedData as AIExtractedData,
        };
      }

      try {
        // Download file
        const fileBuffer = await StorageService.downloadFile(doc.fileUrl);

        // Validate file size
        if (!validateFileSize(fileBuffer.length, 5)) {
          throw new Error('Файл слишком большой для AI обработки');
        }

        // Process document
        const processed = await processDocumentForAI(fileBuffer, doc.fileType);

        // Analyze with Claude
        const result = await anthropicService.analyzeDocument({
          documentContent: processed.content,
          documentType: doc.documentType as DocumentTypeForAI,
          isImage: processed.isImage,
          mimeType: processed.mimeType,
        });

        // Update document
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            extractedData: result.data,
            processingStatus: 'COMPLETED',
            processedAt: new Date(),
            processingError: null,
          },
        });

        return {
          documentId: doc.id,
          success: true,
          data: result.data,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Неизвестная ошибка';

        // Update document with error
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            processingStatus: 'FAILED',
            processingError: errorMessage,
          },
        });

        return {
          documentId: doc.id,
          success: false,
          error: errorMessage,
        };
      }
    };

    // Process all documents in parallel
    const results = await Promise.all(documents.map(processDocument));

    // Get successful results
    const successfulResults = results.filter(
      (r): r is ProcessResult & { data: AIExtractedData } => r.success && !!r.data
    );
    const failedResults = results.filter((r) => !r.success);

    // Merge extracted data from all successful documents
    let consolidatedData: AIExtractedData | null = null;
    if (successfulResults.length > 0) {
      const dataArray = successfulResults.map((r) => r.data);
      consolidatedData = mergeExtractedData(dataArray);

      // Validate consolidated data
      const validation = validateAIExtractedData(consolidatedData);
      consolidatedData = validation.validatedData;
    }

    return NextResponse.json({
      success: true,
      results: {
        total: results.length,
        successful: successfulResults.length,
        failed: failedResults.length,
        details: results,
      },
      consolidatedData,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Batch process API error:', error);

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          { error: 'AI сервис не настроен. Обратитесь к администратору.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Ошибка пакетной обработки документов' },
      { status: 500 }
    );
  }
}
