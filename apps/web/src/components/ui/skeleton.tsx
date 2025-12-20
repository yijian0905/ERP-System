import { cn } from '@/lib/utils';

/**
 * Skeleton component for loading placeholders
 * Uses a subtle pulse animation to indicate loading state
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-muted',
                className
            )}
            {...props}
        />
    );
}

/**
 * Card skeleton for loading states
 */
function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('rounded-lg border bg-card p-6', className)}>
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

/**
 * Stats card skeleton for loading states
 */
function StatsCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

/**
 * Chart skeleton for loading states
 */
function ChartSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-end gap-2 h-full p-4', className)}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                    <Skeleton
                        className="w-full rounded-t"
                        style={{
                            height: `${30 + Math.random() * 50}%`,
                            animationDelay: `${i * 100}ms`,
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

/**
 * List item skeleton for loading states
 */
function ListItemSkeleton() {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <div className="text-right">
                <Skeleton className="h-5 w-16 mb-1 ml-auto" />
                <Skeleton className="h-3 w-20 ml-auto" />
            </div>
        </div>
    );
}

/**
 * Insight card skeleton for loading states
 */
function InsightCardSkeleton() {
    return (
        <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4 mb-2" />
            <Skeleton className="h-5 w-20 rounded-full" />
        </div>
    );
}

export {
    Skeleton,
    CardSkeleton,
    StatsCardSkeleton,
    ChartSkeleton,
    ListItemSkeleton,
    InsightCardSkeleton,
};
