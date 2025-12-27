/**
 * RecurringTable Component
 * Displays recurring items list with actions
 */

import {
    Calendar,
    CalendarClock,
    DollarSign,
    Edit,
    Loader2,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { RecurringItem } from './types';
import { statusStyles, billingCycleLabels } from './types';
import { formatDate } from './utils';

interface RecurringTableProps {
    items: RecurringItem[];
    isLoading: boolean;
    onEdit: (item: RecurringItem) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string) => void;
    onGenerateInvoice: (item: RecurringItem) => void;
    onAddNew: () => void;
    hasFilters: boolean;
}

export function RecurringTable({
    items,
    isLoading,
    onEdit,
    onDelete,
    onToggleStatus,
    onGenerateInvoice,
    onAddNew,
    hasFilters,
}: RecurringTableProps) {
    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <h3 className="mt-4 text-lg font-semibold">Loading recurring items...</h3>
            </div>
        );
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No recurring items found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasFilters ? 'Try adjusting your filters' : 'Add your first recurring revenue item'}
                </p>
                {!hasFilters && (
                    <Button className="mt-4" onClick={onAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Recurring Item
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Item / Customer</th>
                        <th className="pb-3 font-medium text-right">Amount</th>
                        <th className="pb-3 font-medium">Cycle</th>
                        <th className="pb-3 font-medium">Next Billing</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Total Revenue</th>
                        <th className="pb-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => {
                        const statusConfig = statusStyles[item.status];
                        return (
                            <tr key={item.id} className="border-b last:border-0 table-row-hover">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <CalendarClock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.customer}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <span className="font-semibold">${item.amount.toLocaleString()}</span>
                                    <span className="text-sm text-muted-foreground">
                                        /{billingCycleLabels[item.billingCycle].toLowerCase().slice(0, -2)}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className="inline-flex items-center gap-1 text-sm">
                                        <RefreshCw className="h-3 w-3" />
                                        {billingCycleLabels[item.billingCycle]}
                                    </span>
                                </td>
                                <td className="py-4 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(item.nextBillingDate)}
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className={cn(
                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                        statusConfig.color
                                    )}>
                                        {statusConfig.label}
                                    </span>
                                </td>
                                <td className="py-4 text-right">
                                    <p className="font-medium">${item.totalRevenue.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{item.invoiceCount} invoices</p>
                                </td>
                                <td className="py-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onGenerateInvoice(item)}>
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                Generate Invoice
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onToggleStatus(item.id)}>
                                                {item.status === 'ACTIVE' ? (
                                                    <>
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Pause
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Resume
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this recurring item?')) {
                                                        onDelete(item.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
