// Блоки 1-20
export {
  declarationBlocks1To20Schema,
  declarationDraftSchema,
  DeclarationTypeEnum,
  DeclarantStatusEnum,
  defaultDeclarationFormValues,
} from './declaration-blocks-1-20.schema';

export type {
  DeclarationBlocks1To20FormData,
  DeclarationDraftFormData,
  DeclarationTypeValue,
  DeclarantStatusValue,
} from './declaration-blocks-1-20.schema';

// Режим ЭКСПОРТ (код 10)
export {
  exportDeclarationSchema,
  exportDeclarationBaseSchema,
  exportDeclarationDraftSchema,
  exportCommodityItemSchema,
  defaultExportDeclarationValues,
  // Схемы отдельных граф
  graph1ExportSchema,
  graph2ExportSchema,
  graph3ExportSchema,
  graph8ExportSchema,
  graph9ExportSchema,
  graph11ExportSchema,
  graph17ExportSchema,
  graph18ExportSchema,
  graph20ExportSchema,
  graph31ExportSchema,
  graph37ExportSchema,
  graph43ExportSchema,
  graph47ExportSchema,
  graph50ExportSchema,
  graph54ExportSchema,
  graphCExportSchema,
  // Вспомогательные схемы
  exportDocumentSchema,
  exportPaymentSchema,
  previousDocumentExportSchema,
  transportVehicleSchema,
  // Enums
  PersonStatusCode,
  PersonType,
  Graph2Scenario,
  TransportTypeCode,
  AutoTransportType,
  PaymentFormCode,
  ShippingFormCode,
  PaymentMethodCode,
  ProductionMethodCode,
  PackageType,
} from './export-10.schema';

export type {
  ExportDeclaration,
  ExportDeclarationDraft,
  ExportCommodityItem,
} from './export-10.schema';

// Блоки 21-30
export {
  declarationBlocks21To30Schema,
  declarationBlocks21To30DraftSchema,
  previousDocumentSchema,
  TransportModeEnum,
  TransactionNatureEnum,
  TRANSPORT_TYPES,
  TRANSACTION_NATURES,
  PREVIOUS_DOCUMENT_TYPES,
  defaultBlocks21To30Values,
} from './declaration-blocks-21-40.schema';

export type {
  DeclarationBlocks21To30FormData,
  DeclarationBlocks21To30DraftFormData,
  PreviousDocument,
  TransportModeValue,
  TransactionNatureValue,
} from './declaration-blocks-21-40.schema';

// Товарные позиции (блоки 31-47)
export {
  commodityItemSchema,
  commodityItemDraftSchema,
  itemDocumentSchema,
  defaultCommodityItemValues,
  PACKAGE_TYPES,
  PROCEDURE_CODES,
  VALUATION_METHODS,
  ITEM_DOCUMENT_TYPES,
} from './commodity-item.schema';

export type {
  CommodityItem,
  CommodityItemDraft,
  ItemDocument,
} from './commodity-item.schema';

// Блоки 48-53
export {
  declarationBlocks48To53Schema,
  declarationBlocks48To53DraftSchema,
  principalDataSchema,
  GuaranteeTypeEnum,
  GUARANTEE_TYPES,
  defaultBlocks48To53Values,
} from './declaration-blocks-48-53.schema';

export type {
  DeclarationBlocks48To53FormData,
  DeclarationBlocks48To53DraftFormData,
  PrincipalData,
  GuaranteeTypeValue,
} from './declaration-blocks-48-53.schema';
