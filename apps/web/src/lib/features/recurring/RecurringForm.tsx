/**
 * RecurringForm Component
 * Form for creating and editing recurring items
 */

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
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
import { FilterSelect } from '@/components/ui/filter-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Customer } from '@/lib/api/customers';
import type { RecurringItem, RecurringFormData, BillingCycle } from './types';
import { billingCycleLabels } from './types';

interface RecurringFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
    editingItem: RecurringItem | null;
    formData: RecurringFormData;
    setFormData: (data: RecurringFormData) => void;
    customers: Customer[];
    isLoadingCustomers: boolean;
}

export function RecurringForm({
    isOpen,
    onClose,
    onSave,
    isSaving,
    editingItem,
    formData,
    setFormData,
    customers,
    isLoadingCustomers,
}: RecurringFormProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingItem ? 'Edit Recurring Item' : 'Add Recurring Item'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingItem
                            ? 'Update the recurring billing details'
                            : 'Set up a new recurring revenue item'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Premium Support Plan"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="customer">Customer *</Label>
                        <FilterSelect
                            value={formData.customerId}
                            onChange={(val) => setFormData({ ...formData, customerId: val })}
                            options={customers.map((c) => ({ value: c.id, label: c.name }))}
                            placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"}
                            className="w-full"
                            disabled={isLoadingCustomers}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the service or item"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                min={0}
                                step={0.01}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="billingCycle">Billing Cycle *</Label>
                            <Select
                                value={formData.billingCycle}
                                onValueChange={(val: BillingCycle) => setFormData({ ...formData, billingCycle: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(billingCycleLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <DateInput
                            value={formData.startDate}
                            onChange={(val) => setFormData({ ...formData, startDate: val })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving || !formData.name || !formData.customerId || !formData.amount}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingItem ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
