/**
 * E-Invoice Action Buttons Component
 * Provides actions for submitting, syncing, and cancelling e-Invoices
 */

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import type { EInvoiceStatus } from './einvoice-status-badge';
import { CancellationCountdown } from './cancellation-countdown';

interface EInvoiceActionsProps {
  eInvoiceId?: string;
  invoiceId: string;
  status?: EInvoiceStatus;
  validatedAt?: string | Date | null;
  onCreateAndSubmit?: (invoiceId: string) => Promise<void>;
  onSubmit?: (eInvoiceId: string) => Promise<void>;
  onSync?: (eInvoiceId: string) => Promise<void>;
  onCancel?: (eInvoiceId: string, reason: string) => Promise<void>;
  onRetry?: (eInvoiceId: string) => Promise<void>;
  className?: string;
  showCountdown?: boolean;
}

export function EInvoiceActions({
  eInvoiceId,
  invoiceId,
  status,
  validatedAt,
  onCreateAndSubmit,
  onSubmit,
  onSync,
  onCancel,
  onRetry,
  className,
  showCountdown = true,
}: EInvoiceActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (eInvoiceId && onSubmit) {
        await onSubmit(eInvoiceId);
      } else if (onCreateAndSubmit) {
        await onCreateAndSubmit(invoiceId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (!eInvoiceId || !onSync) return;
    setIsSyncing(true);
    try {
      await onSync(eInvoiceId);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetry = async () => {
    if (!eInvoiceId || !onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry(eInvoiceId);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCancel = async () => {
    if (!eInvoiceId || !onCancel || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await onCancel(eInvoiceId, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
    } finally {
      setIsCancelling(false);
    }
  };

  // No e-Invoice yet - show create button
  if (!eInvoiceId || !status) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit to LHDN
        </Button>
      </div>
    );
  }

  // Based on status, show appropriate actions
  const showSubmit = ['DRAFT'].includes(status);
  const showSync = ['SUBMITTED', 'PENDING'].includes(status);
  const showCancel = ['VALID', 'SUBMITTED'].includes(status);
  const showRetry = ['ERROR', 'INVALID'].includes(status);

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {showSubmit && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </Button>
        )}

        {showSync && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-1.5"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Status
          </Button>
        )}

        {showRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="gap-1.5"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry
          </Button>
        )}

        {showCancel && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            className="gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        )}

        {status === 'VALID' && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            Validated
          </span>
        )}

        {status === 'CANCELLED' && (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <XCircle className="h-4 w-4" />
            Cancelled
          </span>
        )}

        {/* Show cancellation countdown for VALID/SUBMITTED status */}
        {showCountdown && showCancel && validatedAt && (
          <CancellationCountdown
            validatedAt={validatedAt}
            status={status}
          />
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel E-Invoice
            </DialogTitle>
            <DialogDescription>
              This will cancel the e-Invoice in LHDN MyInvois system. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Deadline Warning Banner */}
          {validatedAt && (
            <div className="my-4">
              <CancellationCountdown
                validatedAt={validatedAt}
                status={status}
                className="w-full justify-center"
              />
            </div>
          )}

          <div className="py-4">
            <label className="text-sm font-medium">
              Cancellation Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter the reason for cancellation..."
              className="mt-1.5 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {cancelReason.length}/500 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
            >
              Keep E-Invoice
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel E-Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
