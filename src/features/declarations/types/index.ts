// Re-export types from database
export type {
  Declaration,
  DeclarationItem,
  Document,
  DeclarationWithItems,
  DeclarationWithDocuments,
  DeclarationWithItemsAndDocuments,
  DeclarationFull,
  DeclarationItemWithCountry,
  DeclarationListItem,
  DeclarationFilters,
  CreateDeclarationInput,
  UpdateDeclarationInput,
  CreateDeclarationItemInput,
  UpdateDeclarationItemInput,
  PaymentCalculation,
} from '@/shared/types/database.types';

export {
  DeclarationStatus,
  DeclarationType,
  DocumentType,
  DocumentProcessingStatus,
} from '@/shared/types/database.types';

/**
 * Form data for creating a new declaration (simplified)
 */
export interface DeclarationFormData {
  // Basic info
  type: 'IMPORT' | 'EXPORT' | 'TRANSIT';

  // Exporter (Block 2)
  exporterName: string;
  exporterAddress: string;
  exporterCountryCode: string;

  // Consignee (Block 8)
  consigneeName: string;
  consigneeAddress: string;
  consigneeInn: string;
  consigneeCountryCode: string;

  // Declarant (Block 14)
  declarantName: string;
  declarantInn: string;
  declarantAddress: string;
  declarantStatus: string;

  // Transport (Blocks 18, 21, 25, 26)
  departureTransportMode: string;
  departureTransportNumber?: string;
  borderTransportMode?: string;
  borderTransportNumber?: string;

  // Delivery (Block 20)
  deliveryTermsCode: string;
  deliveryTermsPlace?: string;

  // Customs (Blocks 29, 30)
  entryCustomsOffice: string;
  goodsLocation?: string;

  // Financial (Blocks 22, 23)
  invoiceCurrencyCode: string;
  totalInvoiceAmount?: number;
  exchangeRate?: number;
}

/**
 * Form data for declaration item
 */
export interface DeclarationItemFormData {
  // Block 31: Description
  goodsDescription: string;
  packagingType?: string;
  packagingQuantity?: number;

  // Block 33: HS Code
  hsCode: string;

  // Block 34: Country of origin
  originCountryCode: string;

  // Block 35, 38: Weights
  grossWeight: number;
  netWeight: number;

  // Block 37: Procedure
  procedureCode: string;
  previousProcedureCode?: string;

  // Block 41: Supplementary units
  supplementaryUnit?: string;
  supplementaryQuantity?: number;

  // Block 42: Item price
  itemPrice: number;
  itemCurrencyCode: string;

  // Block 45: Customs value
  customsValue: number;
}
