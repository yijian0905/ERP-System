/**
 * Tax Engine for Malaysia E-Invoice
 * Based on E-Invoice.md specification
 */

// Tax Type Codes from Malaysia LHDN E-Invoice spec
export type TaxTypeCode = '01' | '02' | '03' | '04' | '05' | '06' | 'E';

export interface TaxType {
    code: TaxTypeCode;
    name: string;
    nameZh: string;
    defaultRate: number;
    description: string;
}

// Tax Types as per E-Invoice specification
export const TAX_TYPES: TaxType[] = [
    { code: '01', name: 'Sales Tax', nameZh: '銷售稅', defaultRate: 10, description: 'SST on goods (5% or 10%)' },
    { code: '02', name: 'Service Tax', nameZh: '服務稅', defaultRate: 6, description: 'Service tax (6% or 8%)' },
    { code: '03', name: 'Tourism Tax', nameZh: '旅遊稅', defaultRate: 10, description: 'RM10 per room per night' },
    { code: '04', name: 'High-Value Goods Tax', nameZh: '高價值商品稅', defaultRate: 10, description: '5%-10% on luxury goods' },
    { code: '05', name: 'Sales Tax on Low Value Goods', nameZh: '低價值商品銷售稅', defaultRate: 10, description: '10% on low value imports' },
    { code: '06', name: 'Not Applicable', nameZh: '不適用', defaultRate: 0, description: 'No tax applicable' },
    { code: 'E', name: 'Tax Exempt', nameZh: '免稅', defaultRate: 0, description: 'Tax exemption applies' },
];

// Tax Exemption Codes
export type TaxExemptionCode = 'EXSST-01' | 'EXSST-02' | 'EXSST-03' | 'EXSVT-01' | 'EXSVT-02' | 'OTHER';

export interface TaxExemption {
    code: TaxExemptionCode;
    name: string;
    nameZh: string;
}

export const TAX_EXEMPTIONS: TaxExemption[] = [
    { code: 'EXSST-01', name: 'Sales Tax Exemption Certificate', nameZh: '銷售稅豁免證書' },
    { code: 'EXSST-02', name: 'Tax-free area exemption', nameZh: '免稅區豁免' },
    { code: 'EXSST-03', name: 'Approved Trader Scheme', nameZh: '核准貿易商計劃' },
    { code: 'EXSVT-01', name: 'Service Tax Exemption', nameZh: '服務稅豁免' },
    { code: 'EXSVT-02', name: 'Group relief', nameZh: '集團減免' },
    { code: 'OTHER', name: 'Other exemption', nameZh: '其他豁免' },
];

// Get tax type by code
export function getTaxType(code: TaxTypeCode): TaxType | undefined {
    return TAX_TYPES.find((t) => t.code === code);
}

// Calculate tax amount
export function calculateTax(
    amount: number,
    taxTypeCode: TaxTypeCode = '06',
    customRate?: number
): number {
    const taxType = getTaxType(taxTypeCode);
    if (!taxType) return 0;

    const rate = customRate ?? taxType.defaultRate;
    if (rate === 0) return 0;

    return Math.round(amount * (rate / 100) * 100) / 100; // Round to 2 decimal places
}

// Line total calculation result
export interface LineTotalResult {
    subtotal: number;
    taxAmount: number;
    total: number;
    taxRate: number;
}

// Calculate line total with tax
export function calculateLineTotal(
    quantity: number,
    unitPrice: number,
    taxTypeCode: TaxTypeCode = '06',
    customRate?: number
): LineTotalResult {
    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const taxType = getTaxType(taxTypeCode);
    const taxRate = customRate ?? taxType?.defaultRate ?? 0;
    const taxAmount = calculateTax(subtotal, taxTypeCode, customRate);
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    return { subtotal, taxAmount, total, taxRate };
}

// Invoice total calculation
export interface InvoiceTotalResult {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    total: number;
    taxBreakdown: { taxType: TaxTypeCode; amount: number; rate: number }[];
}

// Calculate invoice totals from line items
export function calculateInvoiceTotals(
    items: Array<{ subtotal: number; taxTypeCode?: TaxTypeCode; taxAmount?: number; taxRate?: number }>,
    globalDiscount: number = 0
): InvoiceTotalResult {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = items.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0);

    // Build tax breakdown
    const taxMap = new Map<TaxTypeCode, { amount: number; rate: number }>();
    for (const item of items) {
        const code = item.taxTypeCode ?? '06';
        const existing = taxMap.get(code);
        if (existing) {
            existing.amount += item.taxAmount ?? 0;
        } else {
            taxMap.set(code, { amount: item.taxAmount ?? 0, rate: item.taxRate ?? 0 });
        }
    }

    const taxBreakdown = Array.from(taxMap.entries()).map(([taxType, { amount, rate }]) => ({
        taxType,
        amount: Math.round(amount * 100) / 100,
        rate,
    }));

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        totalDiscount: Math.round(globalDiscount * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        total: Math.round((subtotal - globalDiscount + totalTax) * 100) / 100,
        taxBreakdown,
    };
}
