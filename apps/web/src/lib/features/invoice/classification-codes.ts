/**
 * E-Invoice Classification Codes
 * Based on Malaysia LHDN E-Invoice specification
 * Full list: https://sdk.myinvois.hasil.gov.my/codes/
 */

export type ClassificationCategory = 'Goods' | 'Services' | 'Expense' | 'Self-Billed' | 'Other';

export interface ClassificationCode {
    code: string;
    description: string;
    descriptionZh: string;
    category: ClassificationCategory;
}

// Common classification codes (based on E-Invoice spec)
export const CLASSIFICATION_CODES: ClassificationCode[] = [
    // General
    { code: '001', description: 'General Expenses', descriptionZh: '一般開支', category: 'Expense' },
    { code: '002', description: 'Raw Materials', descriptionZh: '原物料', category: 'Goods' },
    { code: '003', description: 'Services', descriptionZh: '服務', category: 'Services' },

    // Self-Billed scenarios
    { code: '004', description: 'Self-Billed - Foreign Supplier', descriptionZh: '自開發票-外國供應商', category: 'Self-Billed' },
    { code: '005', description: 'Self-Billed - Agent Commission', descriptionZh: '自開發票-代理佣金', category: 'Self-Billed' },

    // Specific categories
    { code: '006', description: 'Medical Expenses', descriptionZh: '醫療費用', category: 'Expense' },
    { code: '007', description: 'Donations', descriptionZh: '捐款', category: 'Other' },
    { code: '008', description: 'Insurance Premium', descriptionZh: '保險費', category: 'Expense' },
    { code: '009', description: 'Professional Fees', descriptionZh: '專業服務費', category: 'Services' },
    { code: '010', description: 'Rental', descriptionZh: '租金', category: 'Expense' },

    // Products
    { code: '011', description: 'Electronic Equipment', descriptionZh: '電子設備', category: 'Goods' },
    { code: '012', description: 'Office Supplies', descriptionZh: '辦公用品', category: 'Goods' },
    { code: '013', description: 'Furniture & Fixtures', descriptionZh: '傢俱及設備', category: 'Goods' },
    { code: '014', description: 'Machinery & Equipment', descriptionZh: '機械及設備', category: 'Goods' },
    { code: '015', description: 'Vehicle Parts', descriptionZh: '汽車零件', category: 'Goods' },

    // Services
    { code: '016', description: 'Consulting Services', descriptionZh: '諮詢服務', category: 'Services' },
    { code: '017', description: 'Maintenance & Repair', descriptionZh: '維護及維修', category: 'Services' },
    { code: '018', description: 'Training & Education', descriptionZh: '培訓及教育', category: 'Services' },
    { code: '019', description: 'IT Services', descriptionZh: '資訊科技服務', category: 'Services' },
    { code: '020', description: 'Marketing & Advertising', descriptionZh: '行銷及廣告', category: 'Services' },
];

// Get classification code by code string
export function getClassificationCode(code: string): ClassificationCode | undefined {
    return CLASSIFICATION_CODES.find((c) => c.code === code);
}

// Get codes by category
export function getCodesByCategory(category: ClassificationCategory): ClassificationCode[] {
    return CLASSIFICATION_CODES.filter((c) => c.category === category);
}

// Default classification code for products/services
export const DEFAULT_PRODUCT_CODE = '002'; // Raw Materials
export const DEFAULT_SERVICE_CODE = '003'; // Services
