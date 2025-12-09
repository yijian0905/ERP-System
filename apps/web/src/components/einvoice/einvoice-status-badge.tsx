/**
 * E-Invoice Status Badge Component
 * Displays the current status of an e-Invoice with appropriate styling
 */

import { 
  AlertCircle, 
  Check, 
  Clock, 
  FileX, 
  Loader2, 
  Send, 
  XCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EInvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SUBMITTED'
  | 'VALID'
  | 'INVALID'
  | 'CANCELLED'
  | 'REJECTED'
  | 'ERROR';

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  className: string;
}

const STATUS_CONFIG: Record<EInvoiceStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  PENDING: {
    label: 'Pending',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  SUBMITTED: {
    label: 'Submitted',
    icon: <Send className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  VALID: {
    label: 'Valid',
    icon: <Check className="h-3 w-3" />,
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  INVALID: {
    label: 'Invalid',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="h-3 w-3" />,
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
  REJECTED: {
    label: 'Rejected',
    icon: <FileX className="h-3 w-3" />,
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  ERROR: {
    label: 'Error',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

interface EInvoiceStatusBadgeProps {
  status: EInvoiceStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function EInvoiceStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: EInvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}

/**
 * Simple text status without badge styling
 */
export function EInvoiceStatusText({
  status,
  className,
}: {
  status: EInvoiceStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {config.icon}
      {config.label}
    </span>
  );
}
