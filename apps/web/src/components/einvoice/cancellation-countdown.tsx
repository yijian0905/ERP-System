/**
 * Cancellation Countdown Component
 * Shows remaining time for 72-hour cancellation window per MyInvois spec §7.3
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancellationCountdownProps {
    validatedAt?: string | Date | null;
    status?: string;
    className?: string;
}

// 72-hour cancellation window
const CANCELLATION_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * Formats remaining time as human-readable string
 */
function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Expired';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

/**
 * Returns the urgency level based on remaining time
 */
function getUrgencyLevel(ms: number): 'normal' | 'warning' | 'critical' | 'expired' {
    if (ms <= 0) return 'expired';
    if (ms <= 4 * 60 * 60 * 1000) return 'critical'; // < 4 hours
    if (ms <= 24 * 60 * 60 * 1000) return 'warning'; // < 24 hours
    return 'normal';
}

export function CancellationCountdown({
    validatedAt,
    status,
    className,
}: CancellationCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!validatedAt || !['VALID', 'SUBMITTED'].includes(status || '')) {
            setTimeRemaining(null);
            return;
        }

        const validated = new Date(validatedAt).getTime();
        const deadline = validated + CANCELLATION_WINDOW_MS;

        const updateTime = () => {
            const remaining = deadline - Date.now();
            setTimeRemaining(remaining);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [validatedAt, status]);

    // Don't show for non-cancellable statuses
    if (timeRemaining === null) {
        return null;
    }

    const urgency = getUrgencyLevel(timeRemaining);

    const urgencyStyles = {
        normal: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
        warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950',
        critical: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 animate-pulse',
        expired: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
    };

    const Icon = urgency === 'expired' ? XCircle : urgency === 'critical' ? AlertTriangle : Clock;

    return (
        <div
            className={cn(
                'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md',
                urgencyStyles[urgency],
                className
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            {urgency === 'expired' ? (
                <span>Cancellation window closed</span>
            ) : (
                <span>
                    Cancel within: <strong>{formatTimeRemaining(timeRemaining)}</strong>
                </span>
            )}
        </div>
    );
}

/**
 * Compact version for table rows
 */
export function CancellationCountdownCompact({
    validatedAt,
    status,
    className,
}: CancellationCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!validatedAt || !['VALID', 'SUBMITTED'].includes(status || '')) {
            setTimeRemaining(null);
            return;
        }

        const validated = new Date(validatedAt).getTime();
        const deadline = validated + CANCELLATION_WINDOW_MS;

        const updateTime = () => {
            const remaining = deadline - Date.now();
            setTimeRemaining(remaining);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, [validatedAt, status]);

    if (timeRemaining === null) {
        return null;
    }

    const urgency = getUrgencyLevel(timeRemaining);

    const textColors = {
        normal: 'text-green-600 dark:text-green-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        critical: 'text-red-600 dark:text-red-400',
        expired: 'text-gray-500 dark:text-gray-400',
    };

    if (urgency === 'expired') {
        return (
            <span className={cn('text-xs', textColors.expired, className)}>
                Expired
            </span>
        );
    }

    return (
        <span className={cn('text-xs font-medium', textColors[urgency], className)}>
            {formatTimeRemaining(timeRemaining)}
        </span>
    );
}
