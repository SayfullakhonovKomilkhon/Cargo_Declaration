/**
 * Re-export all GTD reference data
 */
export * from './gtd-reference';

/**
 * Application name
 */
export const APP_NAME = 'ГТД УЗ';

/**
 * Application version
 */
export const APP_VERSION = '0.1.0';

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum file upload size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file types for document upload
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

/**
 * Declaration statuses
 */
export const DECLARATION_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DeclarationStatus = (typeof DECLARATION_STATUS)[keyof typeof DECLARATION_STATUS];

/**
 * Document types
 */
export const DOCUMENT_TYPE = {
  INVOICE: 'invoice',
  CONTRACT: 'contract',
  PACKING_LIST: 'packing_list',
  CERTIFICATE: 'certificate',
  OTHER: 'other',
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DECLARATIONS: '/declarations',
  DOCUMENTS: '/documents',
  REFERENCES: '/references',
} as const;
