/**
 * Invoice line item for the form
 */
export interface InvoiceLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

/**
 * Invoice form data
 */
export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  notes: string;
  terms: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
}

/**
 * Customer for selection
 */
export interface CustomerOption {
  id: string;
  code: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

/**
 * Product for selection
 */
export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  taxRate: number;
}

/**
 * Company info for invoice header
 */
export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

/**
 * Calculate line item total
 */
export function calculateLineTotal(item: Omit<InvoiceLineItem, 'total'>): number {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (item.taxRate / 100);
  return afterDiscount + taxAmount;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(items: InvoiceLineItem[]): {
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
} {
  let subtotal = 0;
  let taxAmount = 0;
  let discount = 0;

  for (const item of items) {
    const lineSubtotal = item.quantity * item.unitPrice;
    const lineDiscount = lineSubtotal * (item.discount / 100);
    const afterDiscount = lineSubtotal - lineDiscount;
    const lineTax = afterDiscount * (item.taxRate / 100);

    subtotal += lineSubtotal;
    discount += lineDiscount;
    taxAmount += lineTax;
  }

  return {
    subtotal,
    taxAmount,
    discount,
    total: subtotal - discount + taxAmount,
  };
}

/**
 * Generate a unique line item ID
 */
export function generateLineItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Default invoice form data
 */
export function getDefaultInvoiceFormData(): InvoiceFormData {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    invoiceDate: today.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    items: [],
    notes: '',
    terms: 'Payment is due within 30 days of invoice date.',
    subtotal: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
  };
}

