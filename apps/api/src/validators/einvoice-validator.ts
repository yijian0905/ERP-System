/**
 * E-Invoice Validator
 * Validates invoice data against the 55 required fields per MyInvois specification
 * Based on LHDN E-Invoice Guideline v4.6 & MyInvois SDK
 */

import { MALAYSIA_STATE_CODES } from '@erp/shared-types';

// Special TINs per MyInvois spec for buyers without standard TIN
const SPECIAL_TINS = {
    MY_INDIVIDUAL_NO_TIN: 'EI00000000010',
    FOREIGN_BUYER_NO_TIN: 'EI00000000020',
    FOREIGN_SUPPLIER: 'EI00000000030',
    FINAL_CONSUMER: 'EI00000000040',
};

// Field length limits per spec §5.2
const FIELD_LIMITS = {
    name: 300,
    tin: 14,
    brn: 20,
    sstNo: 17,
    tourismTaxNo: 17,
    email: 320,
    msicCode: 5,
    businessActivity: 300,
    phone: 20,
    invoiceNumber: 50,
    addressLine: 150,
    postalCode: 50,
    cityName: 50,
};

// ISO 3166-1 alpha-3 country codes (common ones)
const COUNTRY_CODES = [
    'MYS', 'SGP', 'IDN', 'THA', 'PHL', 'VNM', 'MMR', 'KHM', 'LAO', 'BRN',
    'USA', 'GBR', 'DEU', 'FRA', 'JPN', 'KOR', 'CHN', 'HKG', 'TWN', 'AUS',
    'NZL', 'IND', 'ARE', 'SAU', 'PAK', 'BGD', 'LKA', 'NPL', 'CAN', 'NLD',
];

// Tax type codes per spec §6.1
const TAX_TYPE_CODES = ['01', '02', '03', '04', '05', '06', 'E'];

// Payment mode codes per spec §6.4
const PAYMENT_MODE_CODES = ['01', '02', '03', '04', '05', '06', '07'];

// Unit codes per spec (common UOM)
const UNIT_CODES = [
    'C62', 'KGM', 'GRM', 'LTR', 'MTR', 'MTK', 'MTQ', 'KMT', 'CMT', 'MMT',
    'BX', 'PA', 'SET', 'HUR', 'DAY', 'MON', 'PCS', 'EA', 'DZN', 'ROL',
];

export interface ValidationError {
    field: string;
    code: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

interface SupplierData {
    name?: string;
    tin?: string;
    brn?: string;
    sstNo?: string;
    tourismTaxNo?: string;
    email?: string;
    msicCode?: string;
    businessActivity?: string;
    phone?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
        addressLine3?: string;
        cityName?: string;
        postalZone?: string;
        stateCode?: string;
        countryCode?: string;
    };
}

interface BuyerData {
    name?: string;
    tin?: string;
    brn?: string;
    sstNo?: string;
    email?: string;
    phone?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
        addressLine3?: string;
        cityName?: string;
        postalZone?: string;
        stateCode?: string;
        countryCode?: string;
    };
}

interface InvoiceLineData {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
    taxAmount?: number;
    total?: number;
    classificationCode?: string;
    unitCode?: string;
    taxTypeCode?: string;
}

interface InvoiceData {
    invoiceNumber?: string;
    typeCode?: string;
    issueDate?: string;
    currency?: string;
    exchangeRate?: number;
    supplier?: SupplierData;
    buyer?: BuyerData;
    lines?: InvoiceLineData[];
    subtotal?: number;
    taxTotal?: number;
    discount?: number;
    total?: number;
    paymentMode?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
}

/**
 * Validates that a string is not empty and within length limit
 */
function validateString(
    value: string | undefined | null,
    fieldName: string,
    maxLength: number,
    required: boolean = true
): ValidationError | null {
    if (!value || value.trim() === '') {
        if (required) {
            return {
                field: fieldName,
                code: 'REQUIRED_FIELD',
                message: `${fieldName} is required`,
                severity: 'error',
            };
        }
        return null;
    }

    if (value.length > maxLength) {
        return {
            field: fieldName,
            code: 'MAX_LENGTH_EXCEEDED',
            message: `${fieldName} exceeds maximum length of ${maxLength} characters`,
            severity: 'error',
        };
    }

    return null;
}

/**
 * Validates TIN format (C followed by 10 digits, or special TINs)
 */
function validateTin(tin: string | undefined | null, fieldName: string, required: boolean = true): ValidationError | null {
    if (!tin || tin.trim() === '') {
        if (required) {
            return {
                field: fieldName,
                code: 'REQUIRED_FIELD',
                message: `${fieldName} (TIN) is required`,
                severity: 'error',
            };
        }
        return null;
    }

    // Check for special TINs
    const specialTins = Object.values(SPECIAL_TINS);
    if (specialTins.includes(tin)) {
        return null; // Valid special TIN
    }

    // Standard TIN format: C + 10 digits or IG + digits
    const tinPattern = /^(C|IG)\d{10,12}$/;
    if (!tinPattern.test(tin)) {
        return {
            field: fieldName,
            code: 'INVALID_TIN_FORMAT',
            message: `${fieldName} has invalid format. Expected: C followed by 10-12 digits, or IG followed by digits`,
            severity: 'error',
        };
    }

    return null;
}

/**
 * Validates Malaysia state code (01-17)
 */
function validateStateCode(code: string | undefined | null, fieldName: string, required: boolean = true): ValidationError | null {
    if (!code || code.trim() === '') {
        if (required) {
            return {
                field: fieldName,
                code: 'REQUIRED_FIELD',
                message: `${fieldName} (State Code) is required`,
                severity: 'error',
            };
        }
        return null;
    }

    const validCodes = Object.values(MALAYSIA_STATE_CODES) as string[];
    if (!validCodes.includes(code)) {
        return {
            field: fieldName,
            code: 'INVALID_STATE_CODE',
            message: `${fieldName} has invalid state code. Valid codes: 01-17`,
            severity: 'error',
        };
    }

    return null;
}

/**
 * Validates country code (ISO 3166-1 alpha-3)
 */
function validateCountryCode(code: string | undefined | null, fieldName: string, required: boolean = true): ValidationError | null {
    if (!code || code.trim() === '') {
        if (required) {
            return {
                field: fieldName,
                code: 'REQUIRED_FIELD',
                message: `${fieldName} (Country Code) is required`,
                severity: 'error',
            };
        }
        return null;
    }

    if (!COUNTRY_CODES.includes(code.toUpperCase())) {
        return {
            field: fieldName,
            code: 'INVALID_COUNTRY_CODE',
            message: `${fieldName} has invalid country code. Must be ISO 3166-1 alpha-3 format`,
            severity: 'warning', // Warning because list might be incomplete
        };
    }

    return null;
}

/**
 * Validates phone number format
 */
function validatePhone(phone: string | undefined | null, fieldName: string, required: boolean = true): ValidationError | null {
    if (!phone || phone.trim() === '') {
        if (required) {
            return {
                field: fieldName,
                code: 'REQUIRED_FIELD',
                message: `${fieldName} (Phone) is required`,
                severity: 'error',
            };
        }
        return null;
    }

    // Basic phone validation - must start with + and contain only digits, spaces, hyphens
    const phonePattern = /^\+?[\d\s\-()]{8,20}$/;
    if (!phonePattern.test(phone)) {
        return {
            field: fieldName,
            code: 'INVALID_PHONE_FORMAT',
            message: `${fieldName} has invalid format. Include country code (e.g., +60123456789)`,
            severity: 'warning',
        };
    }

    return null;
}

/**
 * Validates supplier data (Fields 1, 3-9, 14, 16)
 */
function validateSupplier(supplier: SupplierData | undefined): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!supplier) {
        errors.push({
            field: 'Supplier',
            code: 'REQUIRED_FIELD',
            message: 'Supplier information is required',
            severity: 'error',
        });
        return errors;
    }

    // Field 1: Supplier Name (mandatory)
    const nameErr = validateString(supplier.name, 'Supplier.Name', FIELD_LIMITS.name);
    if (nameErr) errors.push(nameErr);

    // Field 3: Supplier TIN (mandatory)
    const tinErr = validateTin(supplier.tin, 'Supplier.TIN');
    if (tinErr) errors.push(tinErr);

    // Field 4: Supplier BRN (mandatory)
    const brnErr = validateString(supplier.brn, 'Supplier.BRN', FIELD_LIMITS.brn);
    if (brnErr) errors.push(brnErr);

    // Field 5: Supplier SST No (conditional - warning if missing)
    // Field 6: Supplier Tourism Tax No (conditional)
    // These are conditional based on registration status

    // Field 7: Supplier Email (optional)
    if (supplier.email) {
        const emailErr = validateString(supplier.email, 'Supplier.Email', FIELD_LIMITS.email, false);
        if (emailErr) errors.push(emailErr);
    }

    // Field 8: Supplier MSIC Code (mandatory)
    const msicErr = validateString(supplier.msicCode, 'Supplier.MSICCode', FIELD_LIMITS.msicCode);
    if (msicErr) errors.push(msicErr);

    // Field 9: Supplier Business Activity (mandatory)
    const bizErr = validateString(supplier.businessActivity, 'Supplier.BusinessActivity', FIELD_LIMITS.businessActivity);
    if (bizErr) errors.push(bizErr);

    // Field 14: Supplier Address (mandatory)
    if (!supplier.address) {
        errors.push({
            field: 'Supplier.Address',
            code: 'REQUIRED_FIELD',
            message: 'Supplier address is required',
            severity: 'error',
        });
    } else {
        const addr1Err = validateString(supplier.address.addressLine1, 'Supplier.Address.Line1', FIELD_LIMITS.addressLine);
        if (addr1Err) errors.push(addr1Err);

        const cityErr = validateString(supplier.address.cityName, 'Supplier.Address.City', FIELD_LIMITS.cityName);
        if (cityErr) errors.push(cityErr);

        const postalErr = validateString(supplier.address.postalZone, 'Supplier.Address.PostalCode', FIELD_LIMITS.postalCode);
        if (postalErr) errors.push(postalErr);

        const stateErr = validateStateCode(supplier.address.stateCode, 'Supplier.Address.StateCode');
        if (stateErr) errors.push(stateErr);

        const countryErr = validateCountryCode(supplier.address.countryCode, 'Supplier.Address.CountryCode');
        if (countryErr) errors.push(countryErr);
    }

    // Field 16: Supplier Contact Number (mandatory)
    const phoneErr = validatePhone(supplier.phone, 'Supplier.Phone');
    if (phoneErr) errors.push(phoneErr);

    return errors;
}

/**
 * Validates buyer data (Fields 2, 10-13, 15, 17)
 */
function validateBuyer(buyer: BuyerData | undefined): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!buyer) {
        errors.push({
            field: 'Buyer',
            code: 'REQUIRED_FIELD',
            message: 'Buyer information is required',
            severity: 'error',
        });
        return errors;
    }

    // Field 2: Buyer Name (mandatory)
    const nameErr = validateString(buyer.name, 'Buyer.Name', FIELD_LIMITS.name);
    if (nameErr) errors.push(nameErr);

    // Field 10: Buyer TIN (mandatory - can use special TIN EI00000000010)
    const tinErr = validateTin(buyer.tin, 'Buyer.TIN');
    if (tinErr) errors.push(tinErr);

    // Field 11: Buyer BRN (mandatory)
    const brnErr = validateString(buyer.brn, 'Buyer.BRN', FIELD_LIMITS.brn);
    if (brnErr) errors.push(brnErr);

    // Field 12: Buyer SST No (conditional)
    // Field 13: Buyer Email (optional)

    // Field 15: Buyer Address (mandatory)
    if (!buyer.address) {
        errors.push({
            field: 'Buyer.Address',
            code: 'REQUIRED_FIELD',
            message: 'Buyer address is required',
            severity: 'error',
        });
    } else {
        const addr1Err = validateString(buyer.address.addressLine1, 'Buyer.Address.Line1', FIELD_LIMITS.addressLine);
        if (addr1Err) errors.push(addr1Err);

        const cityErr = validateString(buyer.address.cityName, 'Buyer.Address.City', FIELD_LIMITS.cityName);
        if (cityErr) errors.push(cityErr);

        const postalErr = validateString(buyer.address.postalZone, 'Buyer.Address.PostalCode', FIELD_LIMITS.postalCode);
        if (postalErr) errors.push(postalErr);

        const stateErr = validateStateCode(buyer.address.stateCode, 'Buyer.Address.StateCode');
        if (stateErr) errors.push(stateErr);

        const countryErr = validateCountryCode(buyer.address.countryCode, 'Buyer.Address.CountryCode');
        if (countryErr) errors.push(countryErr);
    }

    // Field 17: Buyer Contact Number (mandatory)
    const phoneErr = validatePhone(buyer.phone, 'Buyer.Phone');
    if (phoneErr) errors.push(phoneErr);

    return errors;
}

/**
 * Validates invoice line items (Fields 30-48)
 */
function validateInvoiceLines(lines: InvoiceLineData[] | undefined): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!lines || lines.length === 0) {
        errors.push({
            field: 'Invoice.Lines',
            code: 'REQUIRED_FIELD',
            message: 'At least one invoice line item is required',
            severity: 'error',
        });
        return errors;
    }

    lines.forEach((line, index) => {
        const prefix = `Invoice.Lines[${index}]`;

        // Field 32: Classification code (mandatory)
        if (!line.classificationCode) {
            errors.push({
                field: `${prefix}.ClassificationCode`,
                code: 'REQUIRED_FIELD',
                message: `Line ${index + 1}: Classification code is required`,
                severity: 'warning', // Warning because we can use default
            });
        }

        // Field 33: Description (mandatory)
        if (!line.description || line.description.trim() === '') {
            errors.push({
                field: `${prefix}.Description`,
                code: 'REQUIRED_FIELD',
                message: `Line ${index + 1}: Description is required`,
                severity: 'error',
            });
        }

        // Field 34: Unit Price (mandatory)
        if (line.unitPrice === undefined || line.unitPrice === null) {
            errors.push({
                field: `${prefix}.UnitPrice`,
                code: 'REQUIRED_FIELD',
                message: `Line ${index + 1}: Unit price is required`,
                severity: 'error',
            });
        }

        // Field 39: Quantity (mandatory)
        if (line.quantity === undefined || line.quantity === null || line.quantity <= 0) {
            errors.push({
                field: `${prefix}.Quantity`,
                code: 'INVALID_VALUE',
                message: `Line ${index + 1}: Quantity must be greater than 0`,
                severity: 'error',
            });
        }

        // Field 40: Unit code validation
        if (line.unitCode && !UNIT_CODES.includes(line.unitCode)) {
            errors.push({
                field: `${prefix}.UnitCode`,
                code: 'INVALID_UNIT_CODE',
                message: `Line ${index + 1}: Invalid unit code. Common codes: C62 (piece), KGM (kg), LTR (liter)`,
                severity: 'warning',
            });
        }

        // Field 44: Tax type code validation
        if (line.taxTypeCode && !TAX_TYPE_CODES.includes(line.taxTypeCode)) {
            errors.push({
                field: `${prefix}.TaxTypeCode`,
                code: 'INVALID_TAX_TYPE',
                message: `Line ${index + 1}: Invalid tax type code. Valid: 01-06, E`,
                severity: 'error',
            });
        }
    });

    return errors;
}

/**
 * Main validation function for E-Invoice data
 * Validates all 55 required fields per MyInvois specification
 */
export function validateEInvoice(data: InvoiceData): ValidationResult {
    const errors: ValidationError[] = [];

    // Invoice Details Validation (Fields 18-27)

    // Field 20: Invoice Number (mandatory)
    const invNumErr = validateString(data.invoiceNumber, 'Invoice.Number', FIELD_LIMITS.invoiceNumber);
    if (invNumErr) errors.push(invNumErr);

    // Field 22: Issue Date (mandatory)
    if (!data.issueDate) {
        errors.push({
            field: 'Invoice.IssueDate',
            code: 'REQUIRED_FIELD',
            message: 'Invoice issue date is required',
            severity: 'error',
        });
    }

    // Field 24: Currency (mandatory)
    if (!data.currency) {
        errors.push({
            field: 'Invoice.Currency',
            code: 'REQUIRED_FIELD',
            message: 'Currency code is required',
            severity: 'error',
        });
    }

    // Field 25: Exchange Rate (required if not MYR)
    if (data.currency && data.currency !== 'MYR') {
        if (!data.exchangeRate || data.exchangeRate <= 0) {
            errors.push({
                field: 'Invoice.ExchangeRate',
                code: 'REQUIRED_FIELD',
                message: 'Exchange rate is required for non-MYR currencies',
                severity: 'error',
            });
        }
    }

    // Payment Mode validation (Field 49)
    if (data.paymentMode && !PAYMENT_MODE_CODES.includes(data.paymentMode)) {
        errors.push({
            field: 'Invoice.PaymentMode',
            code: 'INVALID_PAYMENT_MODE',
            message: 'Invalid payment mode code. Valid: 01-07',
            severity: 'error',
        });
    }

    // Validate Supplier (Fields 1, 3-9, 14, 16)
    const supplierErrors = validateSupplier(data.supplier);

    // Validate Buyer (Fields 2, 10-13, 15, 17)
    const buyerErrors = validateBuyer(data.buyer);

    // Validate Invoice Lines (Fields 30-48)
    const lineErrors = validateInvoiceLines(data.lines);

    // Monetary Totals Validation (Fields 28-29)
    if (data.total === undefined || data.total === null) {
        errors.push({
            field: 'Invoice.Total',
            code: 'REQUIRED_FIELD',
            message: 'Invoice total amount is required',
            severity: 'error',
        });
    }

    // Combine all errors
    const allErrors = [...errors, ...supplierErrors, ...buyerErrors, ...lineErrors];

    // Separate errors from warnings
    const finalErrors = allErrors.filter(e => e.severity === 'error');
    const finalWarnings = allErrors.filter(e => e.severity === 'warning');

    return {
        isValid: finalErrors.length === 0,
        errors: finalErrors,
        warnings: finalWarnings,
    };
}

/**
 * Quick validation to check if basic E-Invoice requirements are met
 */
export function quickValidateEInvoice(data: InvoiceData): { ready: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!data.supplier?.tin) missingFields.push('Supplier TIN');
    if (!data.supplier?.brn) missingFields.push('Supplier BRN');
    if (!data.supplier?.msicCode) missingFields.push('Supplier MSIC Code');
    if (!data.supplier?.phone) missingFields.push('Supplier Phone');
    if (!data.supplier?.address?.addressLine1) missingFields.push('Supplier Address');

    if (!data.buyer?.tin && !data.buyer?.brn) missingFields.push('Buyer TIN or BRN');
    if (!data.buyer?.phone) missingFields.push('Buyer Phone');
    if (!data.buyer?.address?.addressLine1) missingFields.push('Buyer Address');

    if (!data.lines || data.lines.length === 0) missingFields.push('Invoice Line Items');

    return {
        ready: missingFields.length === 0,
        missingFields,
    };
}

export type { InvoiceData, SupplierData, BuyerData, InvoiceLineData };
