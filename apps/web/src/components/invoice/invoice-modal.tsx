import { Loader2, Printer, Save, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { useCompanyForInvoice } from '@/stores/company';

import { InvoiceForm } from './invoice-form';
import { InvoicePreview } from './invoice-preview';
import { InvoicePrintLayout } from './invoice-print-layout';
import { usePrintService } from './use-print-service';
import {
  calculateInvoiceTotals,
  type CompanyInfo,
  getDefaultInvoiceFormData,
  type InvoiceFormData,
} from './types';

// Generate a mock invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `INV-${year}${month}-${random}`;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: InvoiceFormData) => Promise<void>;
  onPrintComplete?: (data: InvoiceFormData) => Promise<void>;
  initialData?: Partial<InvoiceFormData>;
  mode?: 'create' | 'edit';
}

export function InvoiceModal({
  open,
  onOpenChange,
  onSave,
  onPrintComplete,
  initialData,
  mode = 'create',
}: InvoiceModalProps) {
  // Get company info from store
  const companyInfo = useCompanyForInvoice() as CompanyInfo;

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>(
    getDefaultInvoiceFormData()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Invoice number (generated once on open)
  const [invoiceNumber] = useState(generateInvoiceNumber());

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        ...getDefaultInvoiceFormData(),
        ...initialData,
      });
      setErrors({});
      setPrintSuccess(false);
    }
  }, [open, initialData]);

  // Update totals when items change
  useEffect(() => {
    const totals = calculateInvoiceTotals(formData.items);
    setFormData((prev) => ({
      ...prev,
      ...totals,
    }));
  }, [formData.items]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item';
    }

    const hasEmptyProduct = formData.items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      newErrors.items = 'Please select a product for all items';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form change with debounce effect for preview
  const handleFormChange = useCallback((data: InvoiceFormData) => {
    setFormData(data);
    // Clear errors for changed fields
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (data.customerId) delete newErrors.customerId;
      if (data.invoiceDate) delete newErrors.invoiceDate;
      if (data.dueDate) delete newErrors.dueDate;
      if (data.items.length > 0) delete newErrors.items;
      return newErrors;
    });
  }, []);

  // Handle save (draft)
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave?.(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, onOpenChange, validateForm]);

  // Handle print with inventory deduction using PDF-based workflow
  // @see spec.md §7 Invoice Printing & Preview System
  const { print: printPdf } = usePrintService({
    onPrintStart: () => {
      setIsPrinting(true);
    },
    onPrintComplete: async () => {
      setIsPrinting(false);
      setPrintSuccess(true);

      // Trigger inventory deduction after successful print
      try {
        console.log('📦 Deducting inventory for items:', formData.items);
        await onPrintComplete?.(formData);

        // Show success message briefly, then close
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } catch (error) {
        console.error('Failed to deduct inventory:', error);
      }
    },
    onPrintError: (error: Error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    },
  });

  // Handle print button click
  const handlePrint = useCallback(async () => {
    if (!validateForm()) return;

    // Use PDF-based printing workflow
    // 1. Captures immutable data snapshot
    // 2. Generates PDF from dedicated print layout
    // 3. Triggers download
    await printPdf(
      formData,
      invoiceNumber,
      companyInfo,
      InvoicePrintLayout
    );
  }, [validateForm, printPdf, formData, invoiceNumber, companyInfo]);

  // Calculate if form is valid for preview
  const isFormValid = useMemo(() => {
    return (
      formData.customerId &&
      formData.invoiceDate &&
      formData.dueDate &&
      formData.items.length > 0 &&
      formData.items.every((item) => item.productId)
    );
  }, [formData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Invoice #{invoiceNumber}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left column - Form */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="px-6 py-4 bg-muted/30 border-b shrink-0">
              <h2 className="font-semibold">Invoice Details</h2>
              <p className="text-sm text-muted-foreground">
                Fill in the invoice information
              </p>
            </div>
            <div className="flex-1 p-6 min-h-0">
              <InvoiceForm
                formData={formData}
                onChange={handleFormChange}
                errors={errors}
              />
            </div>
          </div>

          {/* Right column - Preview */}
          <div className="w-1/2 flex flex-col bg-gray-100">
            <div className="px-6 py-4 bg-muted/30 border-b shrink-0">
              <h2 className="font-semibold">Preview</h2>
              <p className="text-sm text-muted-foreground">
                Live preview of your invoice
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* Live Preview - for visual confirmation only (spec §7.2) */}
                  {/* NOT used as print source - PDF is generated from InvoicePrintLayout */}
                  <InvoicePreview
                    formData={formData}
                    invoiceNumber={invoiceNumber}
                    companyInfo={companyInfo}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            {/* Totals summary */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Subtotal:</span>{' '}
                <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tax:</span>{' '}
                <span className="font-medium">${formData.taxAmount.toFixed(2)}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-bold text-lg text-primary">
                  ${formData.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {printSuccess && (
                <div className="flex items-center gap-2 text-success text-sm font-medium animate-fade-in">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Invoice printed & inventory updated!
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || isPrinting}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save as Draft
              </Button>

              <Button
                onClick={() => handlePrint()}
                disabled={isPrinting || !isFormValid}
                className={cn(
                  'min-w-[140px]',
                  !isFormValid && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                {isPrinting ? 'Printing...' : 'Print Invoice'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

