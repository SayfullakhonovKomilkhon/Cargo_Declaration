// Components
export {
  DeclarationFormBlocks1To20,
  GTDPaperForm,
  GTDPaperFormBlocks21To30,
  GTDFullForm,
  CommodityItemsManager,
  ContainerInput,
  HSCodeLookup,
  PreviousDocuments,
  AIDocumentProcessor,
  HSCodeAISuggester,
  DeclarationExportActions,
  PDFDownloadButton,
  DeclarationSummary,
  DeclarationWizard,
  CreateDeclarationDialog,
  ExportDeclarationForm,
  BlankDeclarationForm,
} from './components';

// Константы таможенных режимов
export { CUSTOMS_REGIMES, getRegimeByCode, getRegimeByType } from './components/gtd-official-form';

// Hooks
export { useDeclarationForm } from './hooks';

// Actions
export {
  saveDraft,
  updateDeclaration,
  saveAndValidateBlocks1To20,
  getDeclarationForEdit,
} from './actions';

// Schemas
export {
  declarationBlocks1To20Schema,
  declarationDraftSchema,
  DeclarationTypeEnum,
  DeclarantStatusEnum,
  defaultDeclarationFormValues,
} from './schemas';

// Types
export type {
  DeclarationBlocks1To20FormData,
  DeclarationDraftFormData,
  DeclarationTypeValue,
  DeclarantStatusValue,
} from './schemas';

// Re-export existing types
export * from './types';
