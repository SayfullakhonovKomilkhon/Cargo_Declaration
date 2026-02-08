import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/server/auth';
import { prisma } from '@/server/db/client';
import {
  getAIDocumentAnalyzer,
  type DocumentTypeForAnalysis,
} from '@/server/services/ai-document-analyzer';
import { StorageService } from '@/server/services/storage.service';
import { getConfidenceLevel } from '@/server/utils/ai-data-validator';
import {
  processDocumentForAI,
  validateFileSize,
} from '@/server/utils/document-processor';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/documents/[id]/process
 * Process a document with AI to extract data
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();

  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }

    // Find document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Check access rights (owner or admin)
    if (session.user.role !== 'ADMIN' && document.uploadedById !== session.user.id) {
      return NextResponse.json({ error: 'Нет доступа к документу' }, { status: 403 });
    }

    // Check if already processed
    if (document.processingStatus === 'COMPLETED' && document.extractedData) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        extractedData: document.extractedData,
        message: 'Документ уже обработан',
      });
    }

    // Update status to PROCESSING
    await prisma.document.update({
      where: { id },
      data: { processingStatus: 'PROCESSING' },
    });

    try {
      // Download file from storage
      const fileBuffer = await StorageService.downloadFile(document.fileUrl);

      // Validate file size (max 10MB)
      if (!validateFileSize(fileBuffer.length, 10)) {
        const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
        throw new Error(`Файл слишком большой для AI обработки: ${fileSizeMB}MB (макс. 10MB)`);
      }

      // Process document for AI (extract text or convert to base64)
      const processed = await processDocumentForAI(fileBuffer, document.fileType);

      // Get AI Document Analyzer (с сопоставлением данных из БД)
      const analyzer = getAIDocumentAnalyzer();

      // Analyze document with AI (с использованием справочников из БД)
      const result = await analyzer.analyzeDocument({
        documentContent: processed.content,
        documentType: document.documentType as DocumentTypeForAnalysis,
        isImage: processed.isImage,
        mimeType: processed.mimeType,
      });

      // Get confidence level
      const confidenceLevel = getConfidenceLevel(result.data.confidence);
      
      // Собираем предупреждения
      const warnings = result.data.warnings || [];

      // Save extracted data and update status
      const updatedDocument = await prisma.document.update({
        where: { id },
        data: {
          extractedData: result.data,
          processingStatus: 'COMPLETED',
          processedAt: new Date(),
          processingError: null,
        },
      });

      // Log AI processing
      try {
        await prisma.aIProcessingLog.create({
          data: {
            documentId: id,
            modelUsed: 'claude-sonnet-4-20250514',
            tokensUsed: result.tokensUsed,
            processingTime: result.processingTime,
            extractedData: result.data,
            confidence: result.data.confidence,
            requestType: 'DOCUMENT_ANALYSIS',
          },
        });
      } catch (logError) {
        // Log error but don't fail the request
        console.error('Failed to log AI processing:', logError);
      }

      return NextResponse.json({
        success: true,
        document: updatedDocument,
        extractedData: result.data,
        matchedReferences: result.matchedReferences,
        warnings,
        confidence: {
          value: result.data.confidence,
          ...confidenceLevel,
        },
        processingTime: Date.now() - startTime,
        tokensUsed: result.tokensUsed,
      });
    } catch (processingError) {
      // Update status to FAILED
      const errorMessage =
        processingError instanceof Error ? processingError.message : 'Неизвестная ошибка';

      await prisma.document.update({
        where: { id },
        data: {
          processingStatus: 'FAILED',
          processingError: errorMessage,
        },
      });

      console.error('Document processing error:', processingError);

      return NextResponse.json(
        {
          error: 'Ошибка обработки документа',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Process document API error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
