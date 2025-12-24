/**
 * E-Invoice (LHDN MyInvois) Type Definitions
 * Based on Malaysia LHDN e-Invoice requirements
 */

// ============================================
// ENUMS
// ============================================

export type EInvoiceType =
  | 'INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'REFUND_NOTE'
  | 'SELF_BILLED'
  | 'SELF_BILLED_CREDIT_NOTE'
  | 'SELF_BILLED_DEBIT_NOTE'
  | 'SELF_BILLED_REFUND_NOTE';

export type EInvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SUBMITTED'
  | 'VALID'
  | 'INVALID'
  | 'CANCELLED'
  | 'REJECTED'
  | 'ERROR';

export type LhdnEnvironment = 'SANDBOX' | 'PRODUCTION';

// LHDN Document Type Codes
export const LHDN_DOCUMENT_TYPE_CODES = {
  INVOICE: '01',
  CREDIT_NOTE: '02',
  DEBIT_NOTE: '03',
  REFUND_NOTE: '04',
  SELF_BILLED: '11',
  SELF_BILLED_CREDIT_NOTE: '12',
  SELF_BILLED_DEBIT_NOTE: '13',
  SELF_BILLED_REFUND_NOTE: '14',
} as const;

// Tax Type Codes
export const TAX_TYPE_CODES = {
  SST: '01', // Sales and Service Tax
  SERVICE_TAX: '02',
  TOURISM_TAX: '03',
  HIGH_VALUE_GOODS_TAX: '04',
  SALES_TAX_LOW_VALUE: '05',
  EXEMPT: '06',
  NOT_APPLICABLE: 'E',
} as const;

// ID Type Codes
export const ID_TYPE_CODES = {
  NRIC: 'NRIC',
  PASSPORT: 'PASSPORT',
  BRN: 'BRN', // Business Registration Number
  ARMY: 'ARMY',
} as const;

// Malaysia State Codes (per spec §6.5)
export const MALAYSIA_STATE_CODES = {
  JOHOR: '01',
  KEDAH: '02',
  KELANTAN: '03',
  MELAKA: '04',
  NEGERI_SEMBILAN: '05',
  PAHANG: '06',
  PULAU_PINANG: '07',
  PERAK: '08',
  PERLIS: '09',
  SELANGOR: '10',
  TERENGGANU: '11',
  SABAH: '12',
  SARAWAK: '13',
  WP_KUALA_LUMPUR: '14',
  WP_LABUAN: '15',
  WP_PUTRAJAYA: '16',
  NOT_APPLICABLE: '17',
} as const;

// Special TINs for specific scenarios (per spec §5.3)
export const SPECIAL_TINS = {
  MY_INDIVIDUAL_NO_TIN: 'EI00000000010', // Malaysian individual buyer without TIN
  FOREIGN_BUYER_NO_TIN: 'EI00000000020', // Foreign buyer without TIN
  FOREIGN_SUPPLIER: 'EI00000000030', // Foreign supplier (for self-billing)
  GOVERNMENT_BODY: 'EI00000000040', // Governmental bodies/local authorities
} as const;

// Payment Mode Codes (per spec §6.4)
export const PAYMENT_MODE_CODES = {
  CASH: '01',
  CHEQUE: '02',
  BANK_TRANSFER: '03',
  CREDIT_CARD: '04',
  DEBIT_CARD: '05',
  E_WALLET: '06',
  OTHERS: '07',
} as const;

// E-Invoice document version
export const EINVOICE_DOCUMENT_VERSION = '1.1' as const;

// 72-hour cancellation window in milliseconds
export const CANCELLATION_WINDOW_MS = 72 * 60 * 60 * 1000;

// ============================================
// BASE INTERFACES
// ============================================

export interface EInvoice {
  id: string;
  tenantId: string;
  invoiceId: string;
  type: EInvoiceType;
  status: EInvoiceStatus;
  lhdnUuid?: string | null;
  longId?: string | null;
  lhdnSubmissionUid?: string | null;
  submittedAt?: string | null;
  validatedAt?: string | null;
  cancelledAt?: string | null;
  rejectedAt?: string | null;
  requestJson?: Record<string, unknown> | null;
  responseJson?: Record<string, unknown> | null;
  documentHash?: string | null;
  rejectReason?: string | null;
  validationErrors?: ValidationError[] | null;
  retryCount: number;
  lastRetryAt?: string | null;
  originalEInvoiceId?: string | null;
  cancellationDeadline?: string | null; // 72 hours from validatedAt
  createdAt: string;
  updatedAt: string;
  items?: EInvoiceItem[];
  logs?: EInvoiceLog[];
}

export interface EInvoiceItem {
  id: string;
  eInvoiceId: string;
  invoiceItemId?: string | null;
  classificationCode: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  taxType: string;
  taxRate: number;
  taxAmount: number;
  taxExemptReason?: string | null;
  subtotal: number;
  discountAmount: number;
  discountRate: number;
  totalAmount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EInvoiceLog {
  id: string;
  eInvoiceId: string;
  action: string;
  status: EInvoiceStatus;
  message?: string | null;
  requestData?: Record<string, unknown> | null;
  responseData?: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface LhdnCredential {
  id: string;
  tenantId: string;
  clientId: string;
  tin: string;
  brn?: string | null;
  idType: string;
  idValue: string;
  environment: LhdnEnvironment;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LhdnToken {
  id: string;
  tenantId: string;
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  scope?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SUPPLIER & BUYER INFO (55 Required Fields)
// ============================================

/**
 * Address structure for supplier/buyer (per spec §5.2, fields 14-15)
 */
export interface AddressInfo {
  addressLine1: string; // Mandatory
  addressLine2?: string;
  addressLine3?: string;
  postalZone: string; // Mandatory
  cityName: string; // Mandatory
  state: string; // Mandatory: 01-17 state codes
  country: string; // Mandatory: ISO 3166-1 alpha-3 (e.g., MYS)
}

/**
 * Supplier details required for e-Invoice (per spec §5.2, fields 1-9, 14, 16)
 */
export interface SupplierInfo {
  name: string; // Mandatory: Field 1
  tin: string; // Mandatory: Field 3
  brn?: string; // Mandatory: Field 4 (BRN/MyKad/Passport)
  sstNo?: string; // Conditional: Field 5 (if SST registered)
  tourismTaxNo?: string; // Conditional: Field 6 (if tourism tax registered)
  email?: string; // Optional: Field 7
  msicCode: string; // Mandatory: Field 8
  businessActivityDescription: string; // Mandatory: Field 9
  address: AddressInfo; // Mandatory: Field 14
  phone: string; // Mandatory: Field 16
}

/**
 * Buyer details required for e-Invoice (per spec §5.2, fields 2, 10-13, 15, 17)
 */
export interface BuyerInfo {
  name: string; // Mandatory: Field 2
  tin: string; // Mandatory: Field 10 (or use SPECIAL_TINS)
  brn?: string; // Mandatory: Field 11 (BRN/MyKad/Passport)
  sstNo?: string; // Conditional: Field 12 (if SST registered)
  email?: string; // Optional: Field 13
  address: AddressInfo; // Mandatory: Field 15
  phone: string; // Mandatory: Field 17
}

/**
 * Payment information (per spec §5.2, fields 49-55)
 */
export interface PaymentInfo {
  paymentMode?: string; // Optional: Field 49 (use PAYMENT_MODE_CODES)
  bankAccountNumber?: string; // Optional: Field 50
  paymentTerms?: string; // Optional: Field 51
  prepaymentAmount?: number; // Optional: Field 52
  prepaymentDate?: string; // Optional: Field 53
  prepaymentReferenceNumber?: string; // Optional: Field 54
  billReferenceNumber?: string; // Optional: Field 55
}

/**
 * Billing period for recurring invoices (per spec §5.2, fields 26-27)
 */
export interface BillingPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  frequency?: string; // e.g., "Daily", "Weekly", "Monthly"
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  target?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================
// LHDN API REQUEST/RESPONSE TYPES
// ============================================

// Authentication
export interface LhdnLoginRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'client_credentials';
  scope?: string;
}

export interface LhdnLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// Document Submission
export interface LhdnSubmitDocumentRequest {
  documents: LhdnDocument[];
}

export interface LhdnDocument {
  format: 'JSON' | 'XML';
  document: string; // Base64 encoded
  documentHash: string; // SHA-256 hash
  codeNumber: string; // Internal invoice number
}

export interface LhdnSubmitDocumentResponse {
  submissionUid: string;
  acceptedDocuments: AcceptedDocument[];
  rejectedDocuments: RejectedDocument[];
}

export interface AcceptedDocument {
  uuid: string;
  invoiceCodeNumber: string;
}

export interface RejectedDocument {
  invoiceCodeNumber: string;
  error: LhdnError;
}

export interface LhdnError {
  code: string;
  message: string;
  target?: string;
  details?: LhdnError[];
}

// Get Submission
export interface LhdnGetSubmissionResponse {
  submissionUid: string;
  documentCount: number;
  dateTimeReceived: string;
  overallStatus: 'in progress' | 'valid' | 'invalid' | 'partially valid';
  documentSummary: DocumentSummary[];
}

export interface DocumentSummary {
  uuid: string;
  submissionUid: string;
  longId: string;
  internalId: string;
  typeName: string;
  typeVersionName: string;
  issuerTin: string;
  issuerName: string;
  receiverId?: string;
  receiverName?: string;
  dateTimeIssued: string;
  dateTimeReceived: string;
  dateTimeValidated?: string;
  totalSales: number;
  totalDiscount: number;
  netAmount: number;
  total: number;
  status: 'Valid' | 'Invalid' | 'Submitted' | 'Cancelled';
  cancelDateTime?: string;
  rejectRequestDateTime?: string;
}

// Get Document Details
export interface LhdnDocumentDetails {
  uuid: string;
  submissionUid: string;
  longId: string;
  internalId: string;
  typeName: string;
  typeVersionName: string;
  issuerTin: string;
  issuerName: string;
  receiverId?: string;
  receiverName?: string;
  dateTimeIssued: string;
  dateTimeReceived: string;
  dateTimeValidated?: string;
  totalExcludingTax: number;
  totalDiscount: number;
  totalNetAmount: number;
  totalPayableAmount: number;
  status: 'Valid' | 'Invalid' | 'Submitted' | 'Cancelled';
  validationResults?: ValidationResult;
  document?: string; // Raw JSON/XML
}

// Cancel Document
export interface LhdnCancelDocumentRequest {
  status: 'cancelled';
  reason: string;
}

export interface LhdnCancelDocumentResponse {
  uuid: string;
  status: string;
}

// Search Documents
export interface LhdnSearchDocumentsRequest {
  uuid?: string;
  submissionDateFrom?: string;
  submissionDateTo?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  invoiceDirection?: 'Sent' | 'Received';
  status?: string;
  documentType?: string;
  searchQuery?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface LhdnSearchDocumentsResponse {
  result: DocumentSummary[];
  metadata: {
    totalPages: number;
    totalCount: number;
  };
}

// ============================================
// LHDN DOCUMENT STRUCTURE (UBL 2.1)
// ============================================

export interface LhdnInvoiceDocument {
  _D: string; // Document namespace
  _A: string; // Additional namespace
  Invoice: LhdnInvoiceContent[];
}

export interface LhdnInvoiceContent {
  ID: TextValue[];
  IssueDate: TextValue[];
  IssueTime: TextValue[];
  InvoiceTypeCode: CodeValue[];
  DocumentCurrencyCode: TextValue[];
  InvoicePeriod?: InvoicePeriod[];
  BillingReference?: BillingReference[];
  AccountingSupplierParty: Party[];
  AccountingCustomerParty: Party[];
  Delivery?: Delivery[];
  PaymentMeans?: PaymentMeans[];
  PaymentTerms?: PaymentTerms[];
  AllowanceCharge?: AllowanceCharge[];
  TaxTotal: TaxTotal[];
  LegalMonetaryTotal: LegalMonetaryTotal[];
  InvoiceLine: InvoiceLine[];
}

export interface TextValue {
  _: string;
}

export interface CodeValue {
  _: string;
  listVersionID?: string;
}

export interface AmountValue {
  _: number;
  currencyID: string;
}

export interface InvoicePeriod {
  StartDate: TextValue[];
  EndDate: TextValue[];
  Description?: TextValue[];
}

export interface BillingReference {
  InvoiceDocumentReference: {
    ID: TextValue[];
    UUID?: TextValue[];
  }[];
}

export interface Party {
  Party: {
    IndustryClassificationCode?: CodeValue[];
    PartyIdentification: {
      ID: {
        _: string;
        schemeID: string;
      }[];
    }[];
    PostalAddress: PostalAddress[];
    PartyLegalEntity: {
      RegistrationName: TextValue[];
    }[];
    Contact?: {
      Telephone?: TextValue[];
      ElectronicMail?: TextValue[];
    }[];
  }[];
}

export interface PostalAddress {
  CityName?: TextValue[];
  PostalZone?: TextValue[];
  CountrySubentityCode?: TextValue[];
  AddressLine?: {
    Line: TextValue[];
  }[];
  Country: {
    IdentificationCode: {
      _: string;
      listID: string;
      listAgencyID: string;
    }[];
  }[];
}

export interface Delivery {
  DeliveryParty?: Party[];
  Shipment?: {
    ID: TextValue[];
    FreightAllowanceCharge?: AllowanceCharge[];
  }[];
}

export interface PaymentMeans {
  PaymentMeansCode: TextValue[];
  PayeeFinancialAccount?: {
    ID: TextValue[];
  }[];
}

export interface PaymentTerms {
  Note: TextValue[];
}

export interface AllowanceCharge {
  ChargeIndicator: TextValue[];
  AllowanceChargeReason?: TextValue[];
  MultiplierFactorNumeric?: TextValue[];
  Amount: AmountValue[];
}

export interface TaxTotal {
  TaxAmount: AmountValue[];
  TaxSubtotal?: {
    TaxableAmount: AmountValue[];
    TaxAmount: AmountValue[];
    TaxCategory: {
      ID: TextValue[];
      Percent: TextValue[];
      TaxScheme: {
        ID: {
          _: string;
          schemeID: string;
          schemeAgencyID: string;
        }[];
      }[];
    }[];
  }[];
}

export interface LegalMonetaryTotal {
  LineExtensionAmount: AmountValue[];
  TaxExclusiveAmount: AmountValue[];
  TaxInclusiveAmount: AmountValue[];
  AllowanceTotalAmount?: AmountValue[];
  ChargeTotalAmount?: AmountValue[];
  PayableRoundingAmount?: AmountValue[];
  PayableAmount: AmountValue[];
}

export interface InvoiceLine {
  ID: TextValue[];
  InvoicedQuantity: {
    _: number;
    unitCode: string;
  }[];
  LineExtensionAmount: AmountValue[];
  AllowanceCharge?: AllowanceCharge[];
  TaxTotal: TaxTotal[];
  Item: {
    Description?: TextValue[];
    CommodityClassification?: {
      ItemClassificationCode: {
        _: string;
        listID: string;
      }[];
    }[];
  }[];
  Price: {
    PriceAmount: AmountValue[];
  }[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateEInvoiceRequest {
  invoiceId: string;
  invoiceType?: EInvoiceType;
}

export interface UpdateEInvoiceRequest {
  status?: EInvoiceStatus;
  rejectReason?: string;
}

export interface SubmitEInvoiceRequest {
  eInvoiceId: string;
}

export interface CancelEInvoiceRequest {
  eInvoiceId: string;
  reason: string;
}

export interface GetEInvoiceStatusRequest {
  eInvoiceId: string;
}

export interface EInvoiceResponse {
  eInvoice: EInvoice;
}

export interface EInvoiceListResponse {
  eInvoices: EInvoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EInvoiceSubmissionResult {
  success: boolean;
  eInvoiceId: string;
  lhdnUuid?: string;
  lhdnSubmissionUid?: string;
  status: EInvoiceStatus;
  errors?: ValidationError[];
}

// ============================================
// CREDENTIAL MANAGEMENT
// ============================================

export interface CreateLhdnCredentialRequest {
  clientId: string;
  clientSecret: string;
  tin: string;
  brn?: string;
  idType: string;
  idValue: string;
  environment: LhdnEnvironment;
}

export interface UpdateLhdnCredentialRequest {
  clientId?: string;
  clientSecret?: string;
  tin?: string;
  brn?: string;
  idType?: string;
  idValue?: string;
  environment?: LhdnEnvironment;
  isActive?: boolean;
}

// ============================================
// HELPER TYPES
// ============================================

export interface EInvoiceFilter {
  status?: EInvoiceStatus;
  invoiceType?: EInvoiceType;
  startDate?: string;
  endDate?: string;
  invoiceId?: string;
  lhdnUuid?: string;
}

export interface EInvoiceSummary {
  totalDraft: number;
  totalPending: number;
  totalSubmitted: number;
  totalValid: number;
  totalInvalid: number;
  totalCancelled: number;
  totalRejected: number;
  totalError: number;
}
