import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Printer, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { useCompanyForInvoice } from '@/stores/company';

import { InvoiceForm } from './invoice-form';
import { InvoicePreview } from './invoice-preview';
import { InvoicePrintLayout } from './invoice-print-layout';
import { invoiceFormSchema, type InvoiceFormSchema } from './schema';
import {
  type CompanyInfo,
  getDefaultInvoiceFormData,
  type InvoiceFormData,
} from './types';
import { usePrintService } from './use-print-service';

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

  // Invoice number (generated once on open)
  const [invoiceNumber] = useState(generateInvoiceNumber());

  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Form setup
  const form = useForm<InvoiceFormSchema>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getDefaultInvoiceFormData(),
    mode: 'onChange', // Validate on change for preview validity
  });

  const { reset, watch, handleSubmit } = form;
  const formData = watch(); // Watch all fields for preview

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        ...getDefaultInvoiceFormData(),
        ...initialData,
      });
      setPrintSuccess(false);
    }
  }, [open, initialData, reset]);

  // Handle save (draft)
  const onSaveSubmit = async (data: InvoiceFormSchema) => {
    setIsSaving(true);
    try {
      await onSave?.(data as InvoiceFormData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle print with inventory deduction using PDF-based workflow
  const { print: printPdf } = usePrintService({
    onPrintStart: () => setIsPrinting(true),
    onPrintComplete: async () => {
      setIsPrinting(false);
      setPrintSuccess(true);
      try {
        await onPrintComplete?.(form.getValues() as InvoiceFormData);
        setTimeout(() => onOpenChange(false), 1500);
      } catch (error) {
        console.error('Failed to deduct inventory:', error);
      }
    },
    onPrintError: (error: Error) => {
      console.error('Print failed:', error);
      setIsPrinting(false);
    },
  });

  const handlePrint = async () => {
    const isValid = await form.trigger(); // Trigger validation
    if (!isValid) return;

    await printPdf(
      form.getValues() as InvoiceFormData,
      invoiceNumber,
      companyInfo,
      InvoicePrintLayout
    );
  };

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

        <Form {...form}>
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
              <div className="flex-1 p-6 min-h-0 overflow-y-auto">
                <InvoiceForm />
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
                <div className="p-6 flex justify-center">
                  <div className="inline-block">
                    <InvoicePreview
                      formData={formData as InvoiceFormData}
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
                  <span className="font-medium">${formData.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tax:</span>{' '}
                  <span className="font-medium">${formData.taxAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  <span className="font-bold text-lg text-primary">
                    ${formData.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {printSuccess && (
                  <div className="flex items-center gap-2 text-success text-sm font-medium animate-fade-in">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Invoice printed & inventory updated!
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleSubmit(onSaveSubmit)}
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
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className={cn(
                    'min-w-[140px]',
                    // !isValid && 'opacity-50' // Optional: visually indicate disabled if invalid, but trigger() handles it
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
