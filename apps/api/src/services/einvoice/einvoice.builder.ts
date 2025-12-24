/**
 * E-Invoice Builder
 * Converts internal Invoice data to LHDN e-Invoice JSON format (UBL 2.1)
 * Based on Malaysia E-Invoice (MyInvois) specification
 */

import type {
  EInvoiceType,
  LhdnInvoiceDocument,
  LhdnInvoiceContent,
  ValidationError,
  ValidationResult,
} from '@erp/shared-types';
import {
  LHDN_DOCUMENT_TYPE_CODES,
  EINVOICE_DOCUMENT_VERSION,
} from '@erp/shared-types';
import { prisma } from '../../lib/prisma.js';

// Unit of Measure codes (common ones)
const UOM_CODES: Record<string, string> = {
  pcs: 'C62',
  piece: 'C62',
  unit: 'C62',
  ea: 'C62',
  kg: 'KGM',
  kilogram: 'KGM',
  g: 'GRM',
  gram: 'GRM',
  l: 'LTR',
  liter: 'LTR',
  litre: 'LTR',
  m: 'MTR',
  meter: 'MTR',
  metre: 'MTR',
  box: 'BX',
  pack: 'PA',
  set: 'SET',
  hour: 'HUR',
  hr: 'HUR',
  day: 'DAY',
  month: 'MON',
};

// Classification codes for products
const DEFAULT_CLASSIFICATION_CODE = '001'; // General goods

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  type: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  exchangeRate?: number;           // Exchange rate for non-MYR currencies
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  // E-Invoice specific fields
  billingPeriodStart?: Date | null;   // For recurring invoices
  billingPeriodEnd?: Date | null;     // For recurring invoices
  billingFrequency?: string | null;   // Daily, Weekly, Monthly
  paymentMode?: string | null;        // Payment mode code (01-07)
  paymentBankAccount?: string | null; // Bank account for transfer
  prepaymentAmount?: number | null;   // Prepayment/advance
  prepaymentDate?: Date | null;       // Prepayment date
  prepaymentReference?: string | null;// Prepayment reference number
  billReferenceNumber?: string | null;// Bill reference number
  customer: {
    id: string;
    code: string;
    name: string;
    taxId?: string | null;     // TIN
    tin?: string | null;       // TIN (explicit)
    brn?: string | null;       // Business Registration Number
    email?: string | null;
    phone?: string | null;
    billingAddress?: {
      street?: string;         // addressLine1
      addressLine2?: string;
      addressLine3?: string;
      city?: string;
      state?: string;          // State code 01-17
      postalCode?: string;
      country?: string;        // ISO 3166-1 alpha-3
    } | null;
  };
  items: Array<{
    id: string;
    name: string;
    description?: string | null;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    // E-Invoice specific fields
    classificationCode?: string | null;  // MSIC/product classification
    unitCode?: string | null;            // Unit of measure (C62, KGM, LTR)
    taxTypeCode?: string | null;         // Tax type (01-06, E)
    taxExemptionReason?: string | null;  // If tax exempt
    product?: {
      unit: string;
    } | null;
  }>;
}

interface LocalSupplierInfo {
  tin: string;
  brn?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  sstNo?: string | null; // SST registration number
  tourismTaxNo?: string | null; // Tourism tax registration number
  msicCode?: string | null; // MSIC code (mandatory)
  businessActivityDescription?: string | null; // Business activity (mandatory)
  address: {
    addressLine1?: string;
    addressLine2?: string;
    addressLine3?: string;
    city?: string;
    state?: string; // Use state codes 01-17
    postalCode?: string;
    country: string;
  };
}

interface EInvoiceBuildResult {
  document: LhdnInvoiceDocument;
  jsonString: string;
  base64: string;
  hash: string;
}

/**
 * E-Invoice Builder class
 * Converts internal invoice data to LHDN-compliant JSON format
 */
export class EInvoiceBuilder {
  private tenantId: string;
  private supplierInfo: LocalSupplierInfo | null = null;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Load supplier info from LHDN credentials and tenant settings
   */
  private async loadSupplierInfo(): Promise<LocalSupplierInfo> {
    if (this.supplierInfo) {
      return this.supplierInfo;
    }

    const credential = await prisma.lhdnCredential.findUnique({
      where: { tenantId: this.tenantId },
    });

    if (!credential) {
      throw new Error('LHDN credentials not configured');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: this.tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const settings = tenant.settings as Record<string, unknown> || {};
    const companyInfo = settings.company as Record<string, unknown> || {};

    // Build supplier info from credential and tenant settings
    this.supplierInfo = {
      tin: credential.tin,
      brn: credential.brn,
      name: (companyInfo.name as string) || tenant.name,
      email: companyInfo.email as string | undefined,
      phone: (companyInfo.phone as string) || '+60123456789', // Default phone if not set
      sstNo: companyInfo.sstNo as string | undefined,
      tourismTaxNo: companyInfo.tourismTaxNo as string | undefined,
      msicCode: (companyInfo.msicCode as string) || '00000', // Default MSIC if not set
      businessActivityDescription: (companyInfo.businessActivity as string) || 'General Trading',
      address: {
        addressLine1: companyInfo.address as string | undefined,
        addressLine2: companyInfo.address2 as string | undefined,
        addressLine3: companyInfo.address3 as string | undefined,
        city: companyInfo.city as string | undefined,
        state: companyInfo.state as string || '14', // Default to WP KL
        postalCode: companyInfo.postalCode as string | undefined,
        country: (companyInfo.country as string) || 'MYS',
      },
    };

    return this.supplierInfo;
  }

  /**
   * Build e-Invoice JSON from internal invoice ID
   */
  async build(
    invoiceId: string,
    invoiceType: EInvoiceType = 'INVOICE',
    originalInvoiceUuid?: string
  ): Promise<EInvoiceBuildResult> {
    // Load invoice with customer and items
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: this.tenantId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const supplier = await this.loadSupplierInfo();

    // Build the document
    const document = this.buildDocument(
      invoice as unknown as InvoiceData,
      supplier,
      invoiceType,
      originalInvoiceUuid
    );

    // Serialize to JSON
    const jsonString = JSON.stringify(document);

    // Generate hash and base64
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    const base64 = Buffer.from(jsonString).toString('base64');

    return {
      document,
      jsonString,
      base64,
      hash,
    };
  }

  /**
   * Build LHDN document structure
   */
  private buildDocument(
    invoice: InvoiceData,
    supplier: LocalSupplierInfo,
    invoiceType: EInvoiceType,
    originalInvoiceUuid?: string
  ): LhdnInvoiceDocument {
    const issueDate = new Date(invoice.issueDate);
    const dateStr = issueDate.toISOString().split('T')[0];
    const timeStr = issueDate.toISOString().split('T')[1].split('.')[0] + 'Z';

    const invoiceContent: LhdnInvoiceContent = {
      // Document ID
      ID: [{ _: invoice.invoiceNumber }],

      // Issue date/time
      IssueDate: [{ _: dateStr }],
      IssueTime: [{ _: timeStr }],

      // Invoice type code - using version 1.1 per spec
      InvoiceTypeCode: [{
        _: LHDN_DOCUMENT_TYPE_CODES[invoiceType],
        listVersionID: EINVOICE_DOCUMENT_VERSION,
      }],

      // Currency
      DocumentCurrencyCode: [{ _: invoice.currency }],

      // Billing reference (for credit/debit notes)
      ...(originalInvoiceUuid && ['CREDIT_NOTE', 'DEBIT_NOTE', 'REFUND_NOTE'].includes(invoiceType) ? {
        BillingReference: [{
          InvoiceDocumentReference: [{
            ID: [{ _: invoice.invoiceNumber }],
            UUID: [{ _: originalInvoiceUuid }],
          }],
        }],
      } : {}),

      // Supplier party
      AccountingSupplierParty: [this.buildSupplierParty(supplier)],

      // Customer party
      AccountingCustomerParty: [this.buildCustomerParty(invoice.customer)],

      // Payment means with dynamic code (Fields 49-50)
      PaymentMeans: [this.buildPaymentMeans(invoice)],

      // Tax totals
      TaxTotal: [this.buildTaxTotal(invoice)],

      // Monetary totals
      LegalMonetaryTotal: [this.buildMonetaryTotal(invoice)],

      // Invoice lines
      InvoiceLine: invoice.items.map((item, index) => this.buildInvoiceLine(item, index + 1, invoice.currency)),
    };

    return {
      _D: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      _A: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      Invoice: [invoiceContent],
    };
  }

  /**
   * Build supplier party section with all mandatory fields per spec §5.2
   */
  private buildSupplierParty(supplier: LocalSupplierInfo) {
    // Build party identifications (TIN, BRN, SST)
    const partyIdentifications: { ID: { _: string; schemeID: string }[] }[] = [
      { ID: [{ _: supplier.tin, schemeID: 'TIN' }] },
    ];

    if (supplier.brn) {
      partyIdentifications.push({ ID: [{ _: supplier.brn, schemeID: 'BRN' }] });
    }

    if (supplier.sstNo) {
      partyIdentifications.push({ ID: [{ _: supplier.sstNo, schemeID: 'SST' }] });
    }

    if (supplier.tourismTaxNo) {
      partyIdentifications.push({ ID: [{ _: supplier.tourismTaxNo, schemeID: 'TTX' }] });
    }

    // Build address lines (per spec, need 3 lines)
    const addressLines: { Line: { _: string }[] }[] = [];
    if (supplier.address.addressLine1) {
      addressLines.push({ Line: [{ _: supplier.address.addressLine1 }] });
    }
    if (supplier.address.addressLine2) {
      addressLines.push({ Line: [{ _: supplier.address.addressLine2 }] });
    } else {
      addressLines.push({ Line: [{ _: '' }] });
    }
    if (supplier.address.addressLine3) {
      addressLines.push({ Line: [{ _: supplier.address.addressLine3 }] });
    } else {
      addressLines.push({ Line: [{ _: '' }] });
    }

    return {
      Party: [{
        // MSIC Code with business activity description (mandatory per spec)
        IndustryClassificationCode: [{
          _: supplier.msicCode || '00000',
          name: supplier.businessActivityDescription || 'General Trading',
        }],
        PartyIdentification: partyIdentifications,
        PostalAddress: [{
          CityName: [{ _: supplier.address.city || 'Kuala Lumpur' }],
          PostalZone: [{ _: supplier.address.postalCode || '50000' }],
          CountrySubentityCode: [{ _: supplier.address.state || '14' }],
          AddressLine: addressLines,
          Country: [{
            IdentificationCode: [{
              _: supplier.address.country,
              listID: 'ISO3166-1',
              listAgencyID: '6',
            }],
          }],
        }],
        PartyLegalEntity: [{
          RegistrationName: [{ _: supplier.name }],
        }],
        Contact: [{
          Telephone: [{ _: supplier.phone || '+60123456789' }],
          ElectronicMail: supplier.email ? [{ _: supplier.email }] : undefined,
        }],
      }],
    };
  }

  /**
   * Build customer party section with all mandatory fields per spec §5.2
   */
  private buildCustomerParty(customer: InvoiceData['customer']) {
    // Handle TIN - use special TIN EI00000000010 if customer has no TIN
    const buyerTin = customer.taxId || 'EI00000000010';
    const buyerIdType = customer.taxId ? 'TIN' : 'TIN'; // Special TINs still use TIN scheme

    // Build party identifications
    const partyIdentifications: { ID: { _: string; schemeID: string }[] }[] = [
      { ID: [{ _: buyerTin, schemeID: buyerIdType }] },
    ];

    // Add BRN if available (could be from customer code)
    if (customer.code && customer.code !== customer.taxId) {
      partyIdentifications.push({ ID: [{ _: customer.code, schemeID: 'BRN' }] });
    }

    // Build address lines (per spec, need 3 lines)
    const addressLines: { Line: { _: string }[] }[] = [];
    if (customer.billingAddress?.street) {
      addressLines.push({ Line: [{ _: customer.billingAddress.street }] });
    } else {
      addressLines.push({ Line: [{ _: 'N/A' }] });
    }
    // Line 2 and 3 - empty if not provided
    addressLines.push({ Line: [{ _: '' }] });
    addressLines.push({ Line: [{ _: '' }] });

    return {
      Party: [{
        PartyIdentification: partyIdentifications,
        PostalAddress: [{
          CityName: [{ _: customer.billingAddress?.city || 'N/A' }],
          PostalZone: [{ _: customer.billingAddress?.postalCode || '00000' }],
          CountrySubentityCode: [{ _: customer.billingAddress?.state || '17' }], // 17 = Not applicable
          AddressLine: addressLines,
          Country: [{
            IdentificationCode: [{
              _: customer.billingAddress?.country || 'MYS',
              listID: 'ISO3166-1',
              listAgencyID: '6',
            }],
          }],
        }],
        PartyLegalEntity: [{
          RegistrationName: [{ _: customer.name }],
        }],
        Contact: [{
          Telephone: [{ _: customer.phone || 'NA' }], // Mandatory per spec
          ElectronicMail: customer.email ? [{ _: customer.email }] : undefined,
        }],
      }],
    };
  }

  /**
   * Build tax total section
   */
  private buildTaxTotal(invoice: InvoiceData) {
    // Group items by tax rate
    const taxByRate = new Map<number, { taxable: number; tax: number }>();

    for (const item of invoice.items) {
      const rate = Number(item.taxRate);
      const existing = taxByRate.get(rate) || { taxable: 0, tax: 0 };
      const lineSubtotal = Number(item.quantity) * Number(item.unitPrice) - Number(item.discount);
      existing.taxable += lineSubtotal;
      existing.tax += Number(item.taxAmount);
      taxByRate.set(rate, existing);
    }

    return {
      TaxAmount: [{
        _: Number(invoice.taxAmount),
        currencyID: invoice.currency,
      }],
      TaxSubtotal: Array.from(taxByRate.entries()).map(([rate, amounts]) => ({
        TaxableAmount: [{
          _: amounts.taxable,
          currencyID: invoice.currency,
        }],
        TaxAmount: [{
          _: amounts.tax,
          currencyID: invoice.currency,
        }],
        TaxCategory: [{
          ID: [{ _: rate > 0 ? '01' : 'E' }], // 01 = SST, E = Exempt
          Percent: [{ _: String(rate) }],
          TaxScheme: [{
            ID: [{
              _: 'OTH',
              schemeID: 'UN/ECE 5153',
              schemeAgencyID: '6',
            }],
          }],
        }],
      })),
    };
  }

  /**
   * Build monetary total section
   */
  private buildMonetaryTotal(invoice: InvoiceData) {
    const taxExclusiveAmount = Number(invoice.subtotal) - Number(invoice.discount);

    return {
      LineExtensionAmount: [{
        _: Number(invoice.subtotal),
        currencyID: invoice.currency,
      }],
      TaxExclusiveAmount: [{
        _: taxExclusiveAmount,
        currencyID: invoice.currency,
      }],
      TaxInclusiveAmount: [{
        _: Number(invoice.total),
        currencyID: invoice.currency,
      }],
      AllowanceTotalAmount: Number(invoice.discount) > 0 ? [{
        _: Number(invoice.discount),
        currencyID: invoice.currency,
      }] : undefined,
      PayableAmount: [{
        _: Number(invoice.total),
        currencyID: invoice.currency,
      }],
    };
  }

  /**
   * Build invoice line item
   */
  private buildInvoiceLine(
    item: InvoiceData['items'][0],
    lineNumber: number,
    currency: string
  ) {
    const unitCode = this.getUnitCode(item.product?.unit || 'pcs');
    const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);
    const lineExtension = lineSubtotal - Number(item.discount);

    return {
      ID: [{ _: String(lineNumber) }],
      InvoicedQuantity: [{
        _: Number(item.quantity),
        unitCode,
      }],
      LineExtensionAmount: [{
        _: lineExtension,
        currencyID: currency,
      }],
      AllowanceCharge: Number(item.discount) > 0 ? [{
        ChargeIndicator: [{ _: 'false' }],
        AllowanceChargeReason: [{ _: 'Discount' }],
        Amount: [{
          _: Number(item.discount),
          currencyID: currency,
        }],
      }] : undefined,
      TaxTotal: [{
        TaxAmount: [{
          _: Number(item.taxAmount),
          currencyID: currency,
        }],
        TaxSubtotal: [{
          TaxableAmount: [{
            _: lineExtension,
            currencyID: currency,
          }],
          TaxAmount: [{
            _: Number(item.taxAmount),
            currencyID: currency,
          }],
          TaxCategory: [{
            ID: [{ _: Number(item.taxRate) > 0 ? '01' : 'E' }],
            Percent: [{ _: String(item.taxRate) }],
            TaxScheme: [{
              ID: [{
                _: 'OTH',
                schemeID: 'UN/ECE 5153',
                schemeAgencyID: '6',
              }],
            }],
          }],
        }],
      }],
      Item: [{
        Description: [{ _: item.description || item.name }],
        CommodityClassification: [{
          ItemClassificationCode: [{
            _: DEFAULT_CLASSIFICATION_CODE,
            listID: 'CLASS',
          }],
        }],
      }],
      Price: [{
        PriceAmount: [{
          _: Number(item.unitPrice),
          currencyID: currency,
        }],
      }],
    };
  }

  /**
   * Get UNECE unit code from internal unit
   */
  private getUnitCode(unit: string): string {
    const normalized = unit.toLowerCase().trim();
    return UOM_CODES[normalized] || 'C62'; // Default to pieces
  }

  /**
   * Validate invoice before building e-Invoice
   */
  async validate(invoiceId: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Load invoice with relations
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId: this.tenantId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return {
        isValid: false,
        errors: [{ code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' }],
      };
    }

    // Check supplier credentials
    const credential = await prisma.lhdnCredential.findUnique({
      where: { tenantId: this.tenantId },
    });

    if (!credential) {
      errors.push({
        code: 'NO_CREDENTIALS',
        message: 'LHDN credentials not configured',
        field: 'supplier',
      });
    } else {
      if (!credential.tin) {
        errors.push({
          code: 'MISSING_SUPPLIER_TIN',
          message: 'Supplier TIN is required',
          field: 'supplier.tin',
        });
      }
    }

    // Validate customer
    if (!invoice.customer) {
      errors.push({
        code: 'MISSING_CUSTOMER',
        message: 'Customer is required',
        field: 'customer',
      });
    } else {
      if (!invoice.customer.name) {
        errors.push({
          code: 'MISSING_CUSTOMER_NAME',
          message: 'Customer name is required',
          field: 'customer.name',
        });
      }
    }

    // Validate items
    if (!invoice.items || invoice.items.length === 0) {
      errors.push({
        code: 'NO_ITEMS',
        message: 'At least one item is required',
        field: 'items',
      });
    } else {
      invoice.items.forEach((item, index) => {
        if (!item.name) {
          errors.push({
            code: 'MISSING_ITEM_NAME',
            message: `Item ${index + 1} name is required`,
            field: `items[${index}].name`,
          });
        }
        if (Number(item.quantity) <= 0) {
          errors.push({
            code: 'INVALID_ITEM_QUANTITY',
            message: `Item ${index + 1} quantity must be positive`,
            field: `items[${index}].quantity`,
          });
        }
        if (Number(item.unitPrice) < 0) {
          errors.push({
            code: 'INVALID_ITEM_PRICE',
            message: `Item ${index + 1} price cannot be negative`,
            field: `items[${index}].unitPrice`,
          });
        }
      });
    }

    // Validate totals
    const calculatedSubtotal = invoice.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    const tolerance = 0.01;
    if (Math.abs(calculatedSubtotal - Number(invoice.subtotal)) > tolerance) {
      errors.push({
        code: 'SUBTOTAL_MISMATCH',
        message: 'Subtotal does not match sum of line items',
        field: 'subtotal',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build payment means section (Fields 49-50)
   * 01=Cash, 02=Cheque, 03=Bank Transfer, 04=Credit Card
   * 05=Debit Card, 06=E-Wallet, 07=Digital Bank
   */
  private buildPaymentMeans(invoice: InvoiceData) {
    const paymentCode = invoice.paymentMode || '01'; // Default: Cash

    // Build payment means - always return valid structure
    if (paymentCode === '03' && invoice.paymentBankAccount) {
      return {
        PaymentMeansCode: [{ _: paymentCode }],
        PayeeFinancialAccount: [{
          ID: [{ _: invoice.paymentBankAccount }],
        }],
      };
    }

    return {
      PaymentMeansCode: [{ _: paymentCode }],
    };
  }
}
