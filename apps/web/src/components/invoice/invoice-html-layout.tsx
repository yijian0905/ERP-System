/**
 * Invoice HTML Layout Component
 * Based on 06-INVOICE-PRINT-TEMPLATE.md specification
 * 
 * This is an HTML-based component for:
 * - Print preview in modals
 * - Iframe printing in browser
 * - Electron silent printing
 * 
 * For PDF generation, see invoice-print-layout.tsx which uses @react-pdf/renderer
 */

import { cn } from '@/lib/utils';

// Types based on spec
export type InvoiceType = 'INVOICE' | 'QUOTATION' | 'PROFORMA' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'RECEIPT';
export type InvoiceVariant = 'PRODUCT_SALES' | 'SERVICE' | 'SUBSCRIPTION';
export type InvoiceStatus = 'PAID' | 'OVERDUE' | 'CANCELLED' | undefined;

export interface CompanyInfo {
    name: string;
    nameSecondary?: string;  // Chinese name
    registrationNo?: string;
    address: string;
    phone: string;
    email?: string;
    website?: string;
    sstNo?: string;
    logo?: string;
}

export interface CustomerInfo {
    name: string;
    address: string;
    attn?: string;
    phone?: string;
    email?: string;
}

export interface ShippingInfo {
    address: string;
    deliveryDate?: string;
}

export interface InvoiceItem {
    no: number;
    description: string;
    descriptionSecondary?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    amount: number;
    period?: string;
}

export interface TaxInfo {
    name: string;
    rate: number;
    amount: number;
}

export interface AmountSummary {
    subtotal: number;
    discount?: number;
    taxes?: TaxInfo[];
    total: number;
    currency: string;
}

export interface PaymentInfo {
    bankName: string;
    accountName: string;
    accountNo: string;
    duitnowQR?: string;
}

export interface SubscriptionDetails {
    id: string;
    plan: string;
    billingCycle: string;
    billingPeriod: string;
    nextBillingDate?: string;
}

export interface ReferenceInfo {
    originalInvoiceNo: string;
    originalInvoiceDate: string;
    reason: string;
}

export interface PrintableInvoice {
    type: InvoiceType;
    variant: InvoiceVariant;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    paymentTerms?: string;
    customerRef?: string;
    company: CompanyInfo;
    customer: CustomerInfo;
    shipping?: ShippingInfo;
    items: InvoiceItem[];
    amounts: AmountSummary;
    payment?: PaymentInfo;
    subscription?: SubscriptionDetails;
    reference?: ReferenceInfo;
    notes?: string;
    terms?: string[];
    status?: InvoiceStatus;
}

interface InvoiceHtmlLayoutProps {
    invoice: PrintableInvoice;
    className?: string;
}

// Type titles mapping
const TYPE_TITLES: Record<InvoiceType, { en: string; zh: string }> = {
    INVOICE: { en: 'INVOICE', zh: '發票' },
    QUOTATION: { en: 'QUOTATION', zh: '報價單' },
    PROFORMA: { en: 'PROFORMA INVOICE', zh: '形式發票' },
    CREDIT_NOTE: { en: 'CREDIT NOTE', zh: '貸項通知單' },
    DEBIT_NOTE: { en: 'DEBIT NOTE', zh: '借項通知單' },
    RECEIPT: { en: 'RECEIPT', zh: '收據' },
};

// Status stamp colors
const STATUS_COLORS: Record<string, string> = {
    PAID: 'text-green-600 border-green-600',
    OVERDUE: 'text-red-600 border-red-600',
    CANCELLED: 'text-gray-500 border-gray-500',
};

// Format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Format date
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function InvoiceHtmlLayout({ invoice, className }: InvoiceHtmlLayoutProps) {
    const typeTitle = TYPE_TITLES[invoice.type];
    const showShipping = invoice.variant === 'PRODUCT_SALES' && invoice.shipping;
    const showSubscription = invoice.variant === 'SUBSCRIPTION' && invoice.subscription;
    const showReference = ['CREDIT_NOTE', 'DEBIT_NOTE'].includes(invoice.type) && invoice.reference;

    return (
        <div
            className={cn(
                'bg-white text-[#1A1A1A] p-8',
                'font-sans text-[10pt] leading-[1.5]',
                className
            )}
            style={{
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
            }}
        >
            {/* Status Stamp Overlay */}
            {invoice.status && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] opacity-30 pointer-events-none z-10">
                    <div className={cn(
                        'border-4 rounded px-8 py-4 text-3xl font-bold',
                        STATUS_COLORS[invoice.status]
                    )}>
                        {invoice.status === 'PAID' && '已付款 PAID'}
                        {invoice.status === 'OVERDUE' && '逾期 OVERDUE'}
                        {invoice.status === 'CANCELLED' && '已取消 CANCELLED'}
                    </div>
                </div>
            )}

            {/* A. Header - Logo & Invoice Title */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    {invoice.company.logo ? (
                        <img src={invoice.company.logo} alt="Logo" className="h-14 w-auto" />
                    ) : (
                        <div className="h-14 w-14 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    )}
                    <div>
                        <h2 className="text-[16pt] font-bold text-gray-900">{invoice.company.name}</h2>
                        {invoice.company.nameSecondary && (
                            <p className="text-sm text-gray-600">{invoice.company.nameSecondary}</p>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <h1 className="text-[24pt] font-bold text-gray-900">{typeTitle.en}</h1>
                    <p className="text-lg text-gray-600">{typeTitle.zh}</p>
                </div>
            </div>

            {/* B. Company Info & C. Invoice Info */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="text-sm space-y-1">
                    {invoice.company.registrationNo && (
                        <p className="text-gray-600">({invoice.company.registrationNo})</p>
                    )}
                    <p className="text-gray-600 whitespace-pre-line">{invoice.company.address}</p>
                    <p className="text-gray-600">Tel: {invoice.company.phone}</p>
                    {invoice.company.email && (
                        <p className="text-gray-600">Email: {invoice.company.email}</p>
                    )}
                    {invoice.company.website && (
                        <p className="text-gray-600">Website: {invoice.company.website}</p>
                    )}
                    {invoice.company.sstNo && (
                        <p className="text-gray-600">SST Reg: {invoice.company.sstNo}</p>
                    )}
                </div>

                <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Invoice No / 發票號碼:</span>
                        <span className="font-semibold text-blue-600">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Date / 日期:</span>
                        <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    {invoice.dueDate && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Due Date / 付款期限:</span>
                            <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                        </div>
                    )}
                    {invoice.paymentTerms && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Terms / 付款條件:</span>
                            <span className="font-medium">{invoice.paymentTerms}</span>
                        </div>
                    )}
                    {invoice.customerRef && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Your Ref / 您的參考號:</span>
                            <span className="font-medium">{invoice.customerRef}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* D. Customer Info & E. Shipping Info */}
            <div className={cn('grid gap-8 mb-6', showShipping ? 'grid-cols-2' : 'grid-cols-1')}>
                <div>
                    <h3 className="text-[11pt] font-bold text-gray-700 mb-2">BILL TO / 客戶:</h3>
                    <div className="text-sm space-y-1">
                        <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
                        <p className="text-gray-600 whitespace-pre-line">{invoice.customer.address}</p>
                        {invoice.customer.attn && (
                            <p className="text-gray-600">Attn: {invoice.customer.attn}</p>
                        )}
                        {invoice.customer.phone && (
                            <p className="text-gray-600">Tel: {invoice.customer.phone}</p>
                        )}
                        {invoice.customer.email && (
                            <p className="text-gray-600">Email: {invoice.customer.email}</p>
                        )}
                    </div>
                </div>

                {showShipping && invoice.shipping && (
                    <div>
                        <h3 className="text-[11pt] font-bold text-gray-700 mb-2">SHIP TO / 配送地址:</h3>
                        <div className="text-sm space-y-1">
                            <p className="text-gray-600 whitespace-pre-line">{invoice.shipping.address}</p>
                            {invoice.shipping.deliveryDate && (
                                <p className="text-gray-600">Delivery Date: {formatDate(invoice.shipping.deliveryDate)}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Subscription Details */}
            {showSubscription && invoice.subscription && (
                <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                    <h3 className="text-[11pt] font-bold text-gray-700 mb-2">SUBSCRIPTION DETAILS / 訂閱詳情:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-500">Subscription ID:</span> {invoice.subscription.id}</div>
                        <div><span className="text-gray-500">Plan:</span> {invoice.subscription.plan}</div>
                        <div><span className="text-gray-500">Billing Cycle:</span> {invoice.subscription.billingCycle}</div>
                        <div><span className="text-gray-500">Billing Period:</span> {invoice.subscription.billingPeriod}</div>
                    </div>
                </div>
            )}

            {/* Reference Info (Credit/Debit Note) */}
            {showReference && invoice.reference && (
                <div className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <h3 className="text-[11pt] font-bold text-gray-700 mb-2">REFERENCE / 參考:</h3>
                    <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Original Invoice / 原始發票號碼:</span> {invoice.reference.originalInvoiceNo}</p>
                        <p><span className="text-gray-500">Original Date / 原始發票日期:</span> {formatDate(invoice.reference.originalInvoiceDate)}</p>
                        <p><span className="text-gray-500">Reason / 原因:</span> {invoice.reference.reason}</p>
                    </div>
                </div>
            )}

            {/* F. Line Items Table */}
            <div className="mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-y-2 border-gray-200 bg-[#F5F5F5]">
                            <th className="py-3 px-2 text-center text-[10pt] font-bold text-gray-700 w-[8%]">
                                No.<br /><span className="font-normal text-[#666666]">項次</span>
                            </th>
                            <th className="py-3 px-2 text-left text-[10pt] font-bold text-gray-700 w-[47%]">
                                Description<br /><span className="font-normal text-[#666666]">商品說明</span>
                            </th>
                            <th className="py-3 px-2 text-center text-[10pt] font-bold text-gray-700 w-[10%]">
                                Qty<br /><span className="font-normal text-[#666666]">數量</span>
                            </th>
                            <th className="py-3 px-2 text-right text-[10pt] font-bold text-gray-700 w-[15%]">
                                Unit Price<br /><span className="font-normal text-[#666666]">單價</span>
                            </th>
                            <th className="py-3 px-2 text-right text-[10pt] font-bold text-gray-700 w-[20%]">
                                Amount<br /><span className="font-normal text-[#666666]">金額</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={index} className={cn('border-b border-[#CCCCCC]', index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                                <td className="py-3 px-2 text-center text-[9pt] text-gray-700">{item.no}</td>
                                <td className="py-3 px-2">
                                    <p className="font-medium text-gray-900">{item.description}</p>
                                    {item.descriptionSecondary && (
                                        <p className="text-[9pt] text-[#666666]">{item.descriptionSecondary}</p>
                                    )}
                                    {item.period && (
                                        <p className="text-[9pt] text-[#666666]">{item.period}</p>
                                    )}
                                </td>
                                <td className="py-3 px-2 text-center text-gray-700">
                                    {item.quantity}{item.unit && ` ${item.unit}`}
                                </td>
                                <td className="py-3 px-2 text-right text-gray-700">
                                    {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="py-3 px-2 text-right font-medium text-gray-900">
                                    {formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                        {invoice.items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                                    No items
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* G. Amount Summary */}
            <div className="flex justify-end mb-6">
                <div className="w-80 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-[#666666]">Subtotal / 小計:</span>
                        <span className="text-gray-900">{formatCurrency(invoice.amounts.subtotal)}</span>
                    </div>
                    {invoice.amounts.discount && invoice.amounts.discount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-[#666666]">Discount / 折扣:</span>
                            <span className="text-red-600">-{formatCurrency(invoice.amounts.discount)}</span>
                        </div>
                    )}
                    {invoice.amounts.taxes?.map((tax, index) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span className="text-[#666666]">{tax.name} ({tax.rate}%) / 銷售稅:</span>
                            <span className="text-gray-900">{formatCurrency(tax.amount)}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-300 my-2" />
                    <div className="flex justify-between text-[14pt] font-bold border-t-2 border-black pt-2">
                        <span className="text-gray-900">TOTAL / 總計:</span>
                        <span className="text-blue-600">{invoice.amounts.currency} {formatCurrency(invoice.amounts.total)}</span>
                    </div>
                </div>
            </div>

            {/* H. Payment Information */}
            {invoice.payment && (
                <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                    <h3 className="text-[11pt] font-bold text-gray-700 mb-2">PAYMENT DETAILS / 付款資訊:</h3>
                    <p className="text-sm text-[#666666] mb-2">Please make payment to / 請將款項匯入:</p>
                    <div className="text-sm space-y-1">
                        <p><span className="text-[#666666]">Bank:</span> {invoice.payment.bankName}</p>
                        <p><span className="text-[#666666]">Account Name:</span> {invoice.payment.accountName}</p>
                        <p><span className="text-[#666666]">Account No:</span> {invoice.payment.accountNo}</p>
                    </div>
                    {invoice.payment.duitnowQR && (
                        <div className="mt-3 flex items-center gap-3">
                            <img src={invoice.payment.duitnowQR} alt="DuitNow QR" className="h-24 w-24" />
                            <p className="text-sm text-[#666666]">Or scan to pay / 或掃碼付款</p>
                        </div>
                    )}
                </div>
            )}

            {/* I. Footer */}
            <div className="border-t border-gray-200 pt-4 space-y-4">
                {invoice.notes && (
                    <div>
                        <h3 className="text-[11pt] font-bold text-gray-700 mb-1">NOTES / 備註:</h3>
                        <p className="text-sm text-[#666666] whitespace-pre-line">{invoice.notes}</p>
                    </div>
                )}

                {invoice.terms && invoice.terms.length > 0 && (
                    <div>
                        <h3 className="text-[11pt] font-bold text-gray-700 mb-1">TERMS & CONDITIONS / 條款:</h3>
                        <ol className="text-[9pt] text-[#666666] list-decimal list-inside space-y-0.5">
                            {invoice.terms.map((term, index) => (
                                <li key={index}>{term}</li>
                            ))}
                        </ol>
                    </div>
                )}

                <div className="text-center pt-4 text-[9pt] text-[#666666] space-y-1">
                    <p>This is a computer generated invoice. No signature required.</p>
                    <p>此為電腦生成之發票，無需簽名。</p>
                    <p className="pt-2 text-sm font-medium text-gray-900">
                        Thank you for your business! / 感謝您的惠顧！
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Helper to convert SalesOrder to PrintableInvoice
 */
export function salesOrderToInvoice(
    order: {
        orderNumber: string;
        customer: string;
        customerEmail: string;
        customerAddress: string;
        orderDate: string;
        items: Array<{ id: string; productName: string; sku: string; quantity: number; unitPrice: number; total: number }>;
        subtotal: number;
        tax: number;
        taxRate: number;
        total: number;
        notes?: string;
        terms?: string;
        dueDateDays?: number;
    },
    company: CompanyInfo
): PrintableInvoice {
    const dueDate = order.dueDateDays
        ? new Date(new Date(order.orderDate).getTime() + order.dueDateDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    return {
        type: 'INVOICE',
        variant: 'PRODUCT_SALES',
        invoiceNumber: order.orderNumber,
        invoiceDate: order.orderDate,
        dueDate,
        paymentTerms: order.dueDateDays ? `Net ${order.dueDateDays}` : undefined,
        company,
        customer: {
            name: order.customer,
            address: order.customerAddress,
            email: order.customerEmail,
        },
        items: order.items.map((item, index) => ({
            no: index + 1,
            description: item.productName,
            descriptionSecondary: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.total,
        })),
        amounts: {
            subtotal: order.subtotal,
            taxes: order.taxRate > 0 ? [{ name: 'SST', rate: order.taxRate, amount: order.tax }] : undefined,
            total: order.total,
            currency: 'MYR',
        },
        notes: order.notes,
        terms: order.terms ? [order.terms] : ['Goods sold are not returnable.', 'Interest at 1.5% per month on overdue accounts.'],
    };
}
