/**
 * ProductTable Component
 * Displays product list with actions
 */

import { Package, Edit, Trash2, MoreHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Product, ProductStatus } from './types';
import { statusConfig } from './types';
import { formatCurrency, calculateMargin, isLowStock, isOutOfStock } from './utils';

interface ProductTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onSetStatus: (id: string, status: ProductStatus) => void;
}

export function ProductTable({ products, onEdit, onDelete, onSetStatus }: ProductTableProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or filter
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Product</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium text-right">Price</th>
                        <th className="pb-3 font-medium text-right">Cost</th>
                        <th className="pb-3 font-medium text-right pr-6">Stock</th>
                        <th className="pb-3 font-medium pl-4 w-[140px]">Status</th>
                        <th className="pb-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => {
                        const statusStyle = statusConfig[product.status];
                        const lowStock = isLowStock(product);
                        const outOfStock = isOutOfStock(product);
                        const margin = calculateMargin(product.price, product.cost);

                        return (
                            <tr key={product.id} className="border-b last:border-0 table-row-hover">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{product.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                                    {product.sku}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                                                {product.description}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                        {product.category}
                                    </span>
                                </td>
                                <td className="py-4 text-right font-medium">{formatCurrency(product.price)}</td>
                                <td className="py-4 text-right text-muted-foreground">
                                    {formatCurrency(product.cost)}
                                    <span className="ml-1 text-xs text-muted-foreground">({margin}%)</span>
                                </td>
                                <td className="py-4 text-right pr-6">
                                    <span className={cn(
                                        'font-medium',
                                        outOfStock && 'text-destructive',
                                        lowStock && 'text-warning'
                                    )}>
                                        {product.stock}
                                    </span>
                                    {lowStock && (
                                        <span className="ml-1 text-xs text-warning">Low</span>
                                    )}
                                    {outOfStock && (
                                        <span className="ml-1 text-xs text-destructive">Out</span>
                                    )}
                                </td>
                                <td className="py-4 pl-4 w-[140px]">
                                    <StatusDropdown
                                        currentStatus={product.status}
                                        onStatusChange={(status) => onSetStatus(product.id, status)}
                                    />
                                </td>
                                <td className="py-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon-sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(product)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this product?')) {
                                                        onDelete(product.id);
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

interface StatusDropdownProps {
    currentStatus: ProductStatus;
    onStatusChange: (status: ProductStatus) => void;
}

function StatusDropdown({ currentStatus, onStatusChange }: StatusDropdownProps) {
    const statusStyle = statusConfig[currentStatus];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity',
                        statusStyle.color
                    )}
                >
                    {statusStyle.label}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {currentStatus !== 'ACTIVE' && (
                    <DropdownMenuItem onClick={() => onStatusChange('ACTIVE')}>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Active
                    </DropdownMenuItem>
                )}
                {currentStatus !== 'INACTIVE' && (
                    <DropdownMenuItem onClick={() => onStatusChange('INACTIVE')}>
                        <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-gray-500">○</span>
                        Inactive
                    </DropdownMenuItem>
                )}
                {currentStatus !== 'DISCONTINUED' && (
                    <DropdownMenuItem onClick={() => onStatusChange('DISCONTINUED')}>
                        <span className="mr-2 h-4 w-4 inline-flex items-center justify-center text-red-500">✕</span>
                        Discontinued
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
