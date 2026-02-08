import type { Prisma } from '@prisma/client';

// Re-export Prisma generated types for convenience
export type {
  User,
  Organization,
  Declaration,
  DeclarationItem,
  Document,
  HSCode,
  Country,
  Currency,
  ExchangeRate,
  CustomsOffice,
  TransportMode,
  UnitOfMeasure,
  DeliveryTerm,
  CustomsProcedure,
  AuditLog,
} from '@prisma/client';

// Re-export enums
export {
  UserRole,
  DeclarationStatus,
  DeclarationType,
  DocumentType,
  DocumentProcessingStatus,
} from '@prisma/client';

// ==========================================
// COMPOSITE TYPES (Составные типы)
// ==========================================

/**
 * Declaration with all related items
 */
export type DeclarationWithItems = Prisma.DeclarationGetPayload<{
  include: {
    items: true;
  };
}>;

/**
 * Declaration with all related documents
 */
export type DeclarationWithDocuments = Prisma.DeclarationGetPayload<{
  include: {
    documents: true;
  };
}>;

/**
 * Declaration with items and documents
 */
export type DeclarationWithItemsAndDocuments = Prisma.DeclarationGetPayload<{
  include: {
    items: true;
    documents: true;
  };
}>;

/**
 * Full declaration with all relations
 */
export type DeclarationFull = Prisma.DeclarationGetPayload<{
  include: {
    items: true;
    documents: true;
    user: true;
    organization: true;
    exporterCountry: true;
    consigneeCountry: true;
    tradingCountry: true;
    departureCountry: true;
    originCountry: true;
    destinationCountry: true;
    invoiceCurrency: true;
    auditLogs: true;
  };
}>;

/**
 * Declaration item with country relation
 */
export type DeclarationItemWithCountry = Prisma.DeclarationItemGetPayload<{
  include: {
    originCountry: true;
  };
}>;

/**
 * User with organization
 */
export type UserWithOrganization = Prisma.UserGetPayload<{
  include: {
    organization: true;
  };
}>;

/**
 * User profile (without password)
 */
export type UserProfile = Omit<Prisma.UserGetPayload<object>, 'passwordHash'>;

/**
 * Document with declaration
 */
export type DocumentWithDeclaration = Prisma.DocumentGetPayload<{
  include: {
    declaration: true;
  };
}>;

// ==========================================
// INPUT TYPES (Типы для ввода данных)
// ==========================================

/**
 * Create declaration input
 */
export type CreateDeclarationInput = Prisma.DeclarationCreateInput;

/**
 * Update declaration input
 */
export type UpdateDeclarationInput = Prisma.DeclarationUpdateInput;

/**
 * Create declaration item input
 */
export type CreateDeclarationItemInput = Prisma.DeclarationItemCreateWithoutDeclarationInput;

/**
 * Update declaration item input
 */
export type UpdateDeclarationItemInput = Prisma.DeclarationItemUpdateInput;

/**
 * Create document input
 */
export type CreateDocumentInput = Prisma.DocumentCreateInput;

/**
 * Create user input
 */
export type CreateUserInput = Omit<Prisma.UserCreateInput, 'passwordHash'> & {
  password: string;
};

// ==========================================
// SELECT TYPES (Типы для выборки)
// ==========================================

/**
 * Declaration list item (for tables)
 */
export type DeclarationListItem = {
  id: string;
  declarationNumber: string | null;
  type: 'IMPORT' | 'EXPORT' | 'TRANSIT';
  status: string;
  exporterName: string | null;
  consigneeName: string | null;
  totalCustomsValue: number | null;
  totalItems: number | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Document list item
 */
export type DocumentListItem = {
  id: string;
  fileName: string;
  documentType: string;
  documentNumber: string | null;
  processingStatus: string;
  createdAt: Date;
};

// ==========================================
// FILTER TYPES (Типы для фильтрации)
// ==========================================

/**
 * Declaration filter options
 */
export interface DeclarationFilters {
  status?: string | string[];
  type?: 'IMPORT' | 'EXPORT' | 'TRANSIT';
  organizationId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

/**
 * Document filter options
 */
export interface DocumentFilters {
  declarationId?: string;
  documentType?: string;
  processingStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Extracted data from AI processing
 */
export interface ExtractedDocumentData {
  invoiceNumber?: string;
  invoiceDate?: string;
  seller?: {
    name?: string;
    address?: string;
    country?: string;
  };
  buyer?: {
    name?: string;
    address?: string;
    inn?: string;
  };
  items?: Array<{
    description?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    totalPrice?: number;
    hsCode?: string;
    countryOfOrigin?: string;
  }>;
  totalAmount?: number;
  currency?: string;
  incoterms?: string;
  deliveryPlace?: string;
  confidence?: number;
}

/**
 * Audit log changes structure
 */
export interface AuditLogChanges {
  [field: string]: {
    old: unknown;
    new: unknown;
  };
}

/**
 * Payment calculation for declaration item
 */
export interface PaymentCalculation {
  customsValue: number;
  dutyRate: number;
  dutyAmount: number;
  vatRate: number;
  vatAmount: number;
  exciseRate?: number;
  exciseAmount?: number;
  feeAmount: number;
  totalPayment: number;
}
