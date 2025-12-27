/**
 * RequisitionsTable Component
 * Displays requisitions list with actions
 */

import {
    Check,
    CheckCircle,
    FileText,
    Loader2,
    MoreHorizontal,
    Plus,
    X,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Requisition } from './types';
import { statusConfig, priorityConfig } from './types';
import { formatCurrency, formatDate } from './utils';

interface RequisitionsTableProps {
    requisitions: Requisition[];
    isLoading: boolean;
    onView: (req: Requisition) => void;
    onApprove: (req: Requisition) => void;
    onReject: (req: Requisition) => void;
    onFulfill: (id: string) => void;
    onCancel: (id: string) => void;
    onAddNew: () => void;
    hasFilters: boolean;
}

export function RequisitionsTable({
    requisitions,
    isLoading,
    onView,
    onApprove,
    onReject,
    onFulfill,
    onCancel,
    onAddNew,
    hasFilters,
}: RequisitionsTableProps) {
    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <h3 className="mt-4 text-lg font-semibold">Loading requisitions...</h3>
            </div>
        );
    }

    // Empty state
    if (requisitions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No requisitions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {hasFilters ? 'Try adjusting your search or filter criteria' : 'Create your first requisition'}
                </p>
                {!hasFilters && (
                    <Button className="mt-4" onClick={onAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Requisition
                    </Button>
                )}
            </div>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-420px)]">
            <table className="w-full">
                <thead className="sticky top-0 bg-background border-b">
                    <tr className="text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Requisition #</th>
                        <th className="pb-3 font-medium">Requester</th>
                        <th className="pb-3 font-medium">Cost Center</th>
                        <th className="pb-3 font-medium">Purpose</th>
                        <th className="pb-3 font-medium text-right">Total Cost</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Required By</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {requisitions.map((req) => {
                        const statConfig = statusConfig[req.status];
                        const prioConfig = priorityConfig[req.priority];
                        const StatusIcon = statConfig.icon;

                        return (
                            <tr key={req.id} className="text-sm hover:bg-muted/50">
                                <td className="py-3 font-medium">{req.requisitionNumber}</td>
                                <td className="py-3">
                                    <div>
                                        <p className="font-medium">{req.requestedBy}</p>
                                        <p className="text-xs text-muted-foreground">{req.requestedByDept}</p>
                                    </div>
                                </td>
                                <td className="py-3">{req.costCenterName}</td>
                                <td className="py-3 max-w-[200px] truncate">{req.purpose}</td>
                                <td className="py-3 text-right font-medium">{formatCurrency(req.totalCost)}</td>
                                <td className="py-3">
                                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', prioConfig.color)}>
                                        {prioConfig.label}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statConfig.color)}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statConfig.label}
                                    </span>
                                </td>
                                <td className="py-3">{formatDate(req.requiredDate)}</td>
                                <td className="py-3 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onView(req)}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onApprove(req)}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onReject(req)}>
                                                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onFulfill(req.id)}>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Mark as Fulfilled
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {(req.status === 'DRAFT' || req.status === 'PENDING') && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onCancel(req.id)} className="text-destructive">
                                                        <X className="mr-2 h-4 w-4" />
                                                        Cancel
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </ScrollArea>
    );
}
