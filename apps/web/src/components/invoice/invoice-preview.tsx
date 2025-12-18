import { forwardRef } from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { calculateInvoiceTotals, type CompanyInfo, type InvoiceFormData } from './types';

interface InvoicePreviewProps {
  formData: InvoiceFormData;
  invoiceNumber: string;
  companyInfo: CompanyInfo;
  className?: string;
}

/**
 * Printable invoice preview component
 * Uses forwardRef to support react-to-print
 */
export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  function InvoicePreview({ formData, invoiceNumber, companyInfo, className }, ref) {
    const totals = calculateInvoiceTotals(formData.items);
    const hasItems = formData.items.length > 0;

    // A4 dimensions: 210mm x 297mm
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white text-black p-8',
          // A4 paper size simulation
          'w-[210mm] min-h-[297mm]',
          // Paper appearance
          'shadow-lg border border-gray-200',
          // Print styles
          'print:p-0 print:shadow-none print:border-0',
          className
        )}
        style={{
          // Ensure proper box sizing for A4 dimensions
          boxSizing: 'border-box',
        }}
      >
        {/* Print-specific styles */}
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}
        </style>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          {/* Company Info */}
          <div className="space-y-1">
            {companyInfo.logo ? (
              <img
                src={companyInfo.logo}
                alt={companyInfo.name}
                className="h-12 mb-2"
              />
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {companyInfo.name}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-600">{companyInfo.address}</p>
            <p className="text-sm text-gray-600">{companyInfo.phone}</p>
            <p className="text-sm text-gray-600">{companyInfo.email}</p>
            {companyInfo.taxId && (
              <p className="text-sm text-gray-600">Tax ID: {companyInfo.taxId}</p>
            )}
          </div>

          {/* Invoice Title & Number */}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-lg font-semibold text-blue-600">{invoiceNumber}</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Invoice Date:</span>{' '}
                <span className="font-medium">
                  {formData.invoiceDate
                    ? new Date(formData.invoiceDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : '-'}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Due Date:</span>{' '}
                <span className="font-medium">
                  {formData.dueDate
                    ? new Date(formData.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : '-'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-gray-200" />

        {/* Bill To */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Bill To
          </h2>
          {formData.customerId ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {formData.customerName}
              </p>
              <p className="text-sm text-gray-600">{formData.customerEmail}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {formData.customerAddress}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No customer selected</p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="py-3 text-center text-sm font-semibold text-gray-700 w-20">
                  Qty
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                  Unit Price
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700 w-20">
                  Tax
                </th>
                <th className="py-3 text-right text-sm font-semibold text-gray-700 w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {hasItems ? (
                formData.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-gray-100',
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    )}
                  >
                    <td className="py-3">
                      <p className="font-medium text-gray-900">
                        {item.productName || 'Unnamed Product'}
                      </p>
                      <p className="text-sm text-gray-500">{item.sku}</p>
                    </td>
                    <td className="py-3 text-center text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-gray-500 text-sm">
                      {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      ${item.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                    No items added to this invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-900">${totals.taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="my-2 bg-gray-200" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600">${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(formData.notes || formData.terms) && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            {formData.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Notes
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {formData.notes}
                </p>
              </div>
            )}
            {formData.terms && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Terms & Conditions
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {formData.terms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Thank you for your business!
          </p>
          {companyInfo.website && (
            <p className="text-sm text-gray-400 mt-1">{companyInfo.website}</p>
          )}
        </div>
      </div>
    );
  }
);

