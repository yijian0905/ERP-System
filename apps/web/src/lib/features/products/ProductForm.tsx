/**
 * ProductForm Component
 * Form for creating and editing products
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreatableSelect } from '@/components/creatable-select';
import type { Product, Category, ProductFormData } from './types';

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
    editingProduct: Product | null;
    formData: ProductFormData;
    setFormData: (data: ProductFormData) => void;
    categories: Category[];
    onCreateCategory: (name: string) => void;
    isConsumable?: boolean;
}

export function ProductForm({
    isOpen,
    onClose,
    onSave,
    isSaving,
    editingProduct,
    formData,
    setFormData,
    categories,
    onCreateCategory,
    isConsumable = false,
}: ProductFormProps) {
    // Filter categories based on mode
    const filteredCategories = isConsumable
        ? categories.filter(c => c.isNonSellable)
        : categories.filter(c => !c.isNonSellable);

    const categoryOptions = filteredCategories.map(c => ({
        value: c.id,
        label: c.name,
    }));

    const selectedCategory = categories.find(c => c.id === formData.category);
    const showPrice = !selectedCategory?.isNonSellable;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingProduct
                            ? `Edit ${isConsumable ? 'Consumable' : 'Product'}`
                            : `Add New ${isConsumable ? 'Consumable' : 'Product'}`
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {isConsumable
                            ? 'Operating consumables are for internal use and not for sale.'
                            : 'Fill in the product details below.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={isConsumable ? 'e.g., Printer Paper A4' : 'e.g., Industrial Valve'}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description..."
                            rows={2}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <CreatableSelect
                            options={categoryOptions}
                            value={formData.category}
                            onChange={(value) => setFormData({ ...formData, category: value })}
                            onCreateOption={onCreateCategory}
                            placeholder="Select or create category"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {showPrice && (
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Cost</Label>
                            <Input
                                id="cost"
                                type="number"
                                min={0}
                                step={0.01}
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="minStock">Min Stock</Label>
                            <Input
                                id="minStock"
                                type="number"
                                min={0}
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maxStock">Max Stock</Label>
                            <Input
                                id="maxStock"
                                type="number"
                                min={0}
                                value={formData.maxStock}
                                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reorderPoint">Reorder At</Label>
                            <Input
                                id="reorderPoint"
                                type="number"
                                min={0}
                                value={formData.reorderPoint}
                                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onSave} disabled={isSaving || !formData.name || !formData.category}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingProduct ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
