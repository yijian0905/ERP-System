import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  calculateLineTotal,
  type CustomerOption,
  generateLineItemId,
  type InvoiceFormData,
  type InvoiceLineItem,
  type ProductOption,
} from './types';

// Mock data - replace with actual API calls
const mockCustomers: CustomerOption[] = [
  { id: '1', code: 'CUST-001', name: 'Acme Corporation', email: 'purchasing@acme.com', address: '456 Corporate Blvd, Los Angeles, CA 90001', phone: '+1 (555) 234-5678' },
  { id: '2', code: 'CUST-002', name: 'TechStart Inc.', email: 'orders@techstart.io', address: '789 Startup Lane, San Jose, CA 95101', phone: '+1 (555) 345-6789' },
  { id: '3', code: 'CUST-003', name: 'Global Systems', email: 'info@globalsys.com', address: '123 Enterprise Way, Seattle, WA 98101', phone: '+1 (555) 456-7890' },
];

const mockProducts: ProductOption[] = [
  { id: '1', sku: 'ELEC-001', name: 'Wireless Mouse', price: 29.99, stock: 150, taxRate: 8.25 },
  { id: '2', sku: 'ELEC-002', name: 'Mechanical Keyboard', price: 149.99, stock: 75, taxRate: 8.25 },
  { id: '3', sku: 'OFFC-001', name: 'A4 Copy Paper (500 sheets)', price: 8.99, stock: 500, taxRate: 0 },
  { id: '4', sku: 'FURN-001', name: 'Ergonomic Office Chair', price: 299.99, stock: 25, taxRate: 8.25 },
  { id: '5', sku: 'ELEC-003', name: 'USB-C Hub', price: 49.99, stock: 200, taxRate: 8.25 },
];

interface InvoiceFormProps {
  formData: InvoiceFormData;
  onChange: (data: InvoiceFormData) => void;
  errors?: Record<string, string>;
}

export function InvoiceForm({ formData, onChange, errors }: InvoiceFormProps) {
  // Handle customer selection
  const handleCustomerChange = useCallback(
    (customerId: string) => {
      const customer = mockCustomers.find((c) => c.id === customerId);
      if (customer) {
        onChange({
          ...formData,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerAddress: customer.address,
        });
      }
    },
    [formData, onChange]
  );

  // Handle adding a new line item
  const handleAddItem = useCallback(() => {
    const newItem: InvoiceLineItem = {
      id: generateLineItemId(),
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
      total: 0,
    };
    onChange({
      ...formData,
      items: [...formData.items, newItem],
    });
  }, [formData, onChange]);

  // Handle removing a line item
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      onChange({
        ...formData,
        items: formData.items.filter((item) => item.id !== itemId),
      });
    },
    [formData, onChange]
  );

  // Handle product selection for a line item
  const handleProductChange = useCallback(
    (itemId: string, productId: string) => {
      const product = mockProducts.find((p) => p.id === productId);
      if (!product) return;

      onChange({
        ...formData,
        items: formData.items.map((item) => {
          if (item.id !== itemId) return item;
          const updatedItem = {
            ...item,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unitPrice: product.price,
            taxRate: product.taxRate,
          };
          return {
            ...updatedItem,
            total: calculateLineTotal(updatedItem),
          };
        }),
      });
    },
    [formData, onChange]
  );

  // Handle line item field change
  const handleItemFieldChange = useCallback(
    (itemId: string, field: keyof InvoiceLineItem, value: number) => {
      onChange({
        ...formData,
        items: formData.items.map((item) => {
          if (item.id !== itemId) return item;
          const updatedItem = { ...item, [field]: value };
          return {
            ...updatedItem,
            total: calculateLineTotal(updatedItem),
          };
        }),
      });
    },
    [formData, onChange]
  );

  // Available products (not already in invoice)
  const availableProducts = useMemo(() => {
    const usedProductIds = formData.items.map((item) => item.productId);
    return mockProducts.filter((p) => !usedProductIds.includes(p.id));
  }, [formData.items]);

  // Auto-expanding textareas
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const termsTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Adjust textarea height based on content
  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight (with minimum height)
    const minHeight = 60; // Match min-h-[60px] from Textarea component
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }, []);

  // Adjust height when notes value changes (from external updates)
  useEffect(() => {
    if (notesTextareaRef.current) {
      adjustTextareaHeight(notesTextareaRef.current);
    }
  }, [formData.notes, adjustTextareaHeight]);

  // Adjust height when terms value changes (from external updates)
  useEffect(() => {
    if (termsTextareaRef.current) {
      adjustTextareaHeight(termsTextareaRef.current);
    }
  }, [formData.terms, adjustTextareaHeight]);

  // Adjust height on initial mount
  useEffect(() => {
    if (notesTextareaRef.current) {
      adjustTextareaHeight(notesTextareaRef.current);
    }
    if (termsTextareaRef.current) {
      adjustTextareaHeight(termsTextareaRef.current);
    }
  }, [adjustTextareaHeight]);

  // Handle notes change with auto-expand
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      onChange({ ...formData, notes: textarea.value });
      // Adjust height immediately based on current content
      adjustTextareaHeight(textarea);
    },
    [formData, onChange, adjustTextareaHeight]
  );

  // Handle terms change with auto-expand
  const handleTermsChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      onChange({ ...formData, terms: textarea.value });
      // Adjust height immediately based on current content
      adjustTextareaHeight(textarea);
    },
    [formData, onChange, adjustTextareaHeight]
  );

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-4 pr-4 pl-1">
          {/* Customer Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger
                    id="customer"
                    className={cn(errors?.customerId && 'border-destructive')}
                  >
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <span className="font-medium">{customer.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ({customer.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors?.customerId && (
                  <p className="text-sm text-destructive">{errors.customerId}</p>
                )}
              </div>

              {formData.customerId && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">{formData.customerName}</p>
                  <p className="text-muted-foreground">{formData.customerEmail}</p>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {formData.customerAddress}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Invoice Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <DateInput
                    value={formData.invoiceDate}
                  onChange={(value) =>
                    onChange({ ...formData, invoiceDate: value })
                    }
                  error={!!errors?.invoiceDate}
                  />
                {errors?.invoiceDate && (
                  <p className="text-sm text-destructive">{errors.invoiceDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <DateInput
                    value={formData.dueDate}
                  onChange={(value) =>
                    onChange({ ...formData, dueDate: value })
                    }
                  error={!!errors?.dueDate}
                  />
                {errors?.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Line Items
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={availableProducts.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {formData.items.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No items added yet. Click &ldquo;Add Item&rdquo; to add products to this
                  invoice.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Product *</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            handleProductChange(item.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.productId && (
                              <SelectItem value={item.productId}>
                                {item.productName} ({item.sku})
                              </SelectItem>
                            )}
                            {availableProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{product.name}</span>
                                  <span className="text-muted-foreground text-xs ml-2">
                                    ${product.price.toFixed(2)} • {product.stock} in stock
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(
                              item.id,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="border-0 bg-muted/50 focus-visible:ring-0 focus-visible:bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemFieldChange(
                              item.id,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="border-0 bg-muted/50 focus-visible:ring-0 focus-visible:bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemFieldChange(
                              item.id,
                              'discount',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="border-0 bg-muted/50 focus-visible:ring-0 focus-visible:bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="h-9 flex items-center px-3 rounded-md bg-muted font-medium">
                          ${item.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors?.items && (
              <p className="text-sm text-destructive">{errors.items}</p>
            )}
          </div>

          <Separator />

          {/* Notes & Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Additional Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  ref={notesTextareaRef}
                  id="notes"
                  placeholder="Add any notes for the customer..."
                  value={formData.notes}
                  onChange={handleNotesChange}
                  className="resize-none overflow-hidden"
                  rows={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  ref={termsTextareaRef}
                  id="terms"
                  placeholder="Payment terms and conditions..."
                  value={formData.terms}
                  onChange={handleTermsChange}
                  className="resize-none overflow-hidden"
                  rows={1}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

