import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateInput } from '@/components/ui/date-input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  PAYMENT_MODE_CODES,
  TAX_TYPE_CODES,
} from '@erp/shared-types';

import {
  type InvoiceFormSchema,
} from './schema';
import {
  calculateLineTotal,
  generateLineItemId,
  type CustomerOption,
  type ProductOption,
} from './types';

// Mock data - replace with actual API calls
const mockCustomers: CustomerOption[] = [
  { id: '1', code: 'CUST-001', name: 'Acme Corporation', email: 'purchasing@acme.com', address: '456 Corporate Blvd, Los Angeles, CA 90001', phone: '+1 (555) 234-5678', tin: 'C2345678901', brn: '202301000001', sstNo: 'A12-3456-7890' },
  { id: '2', code: 'CUST-002', name: 'TechStart Inc.', email: 'orders@techstart.io', address: '789 Startup Lane, San Jose, CA 95101', phone: '+1 (555) 345-6789', tin: 'C3456789012', brn: '202301000002' },
  { id: '3', code: 'CUST-003', name: 'Global Systems', email: 'info@globalsys.com', address: '123 Enterprise Way, Seattle, WA 98101', phone: '+1 (555) 456-7890', tin: 'C4567890123' },
];

const mockProducts: ProductOption[] = [
  { id: '1', sku: 'ELEC-001', name: 'Wireless Mouse', price: 29.99, stock: 150, taxRate: 8.25 },
  { id: '2', sku: 'ELEC-002', name: 'Mechanical Keyboard', price: 149.99, stock: 75, taxRate: 8.25 },
  { id: '3', sku: 'OFFC-001', name: 'A4 Copy Paper (500 sheets)', price: 8.99, stock: 500, taxRate: 0 },
  { id: '4', sku: 'FURN-001', name: 'Ergonomic Office Chair', price: 299.99, stock: 25, taxRate: 8.25 },
  { id: '5', sku: 'ELEC-003', name: 'USB-C Hub', price: 49.99, stock: 200, taxRate: 8.25 },
];

export function InvoiceForm() {
  const form = useFormContext<InvoiceFormSchema>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch items to calculate totals
  const items = useWatch({ control: form.control, name: 'items' });

  // Handle customer change
  const handleCustomerChange = useCallback((customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    if (customer) {
      form.setValue('customerId', customer.id);
      form.setValue('customerName', customer.name);
      form.setValue('customerEmail', customer.email);
      form.setValue('customerAddress', customer.address);
      form.setValue('customerTin', customer.tin || '');
      form.setValue('customerBrn', customer.brn || '');
      form.setValue('customerSstNo', customer.sstNo || '');
    }
  }, [form]);

  // Handle product change
  const handleProductChange = useCallback((index: number, productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.sku`, product.sku);
      form.setValue(`items.${index}.unitPrice`, product.price);
      form.setValue(`items.${index}.taxRate`, product.taxRate);

      // Trigger calculation
      const quantity = form.getValues(`items.${index}.quantity`) || 1;
      const discount = form.getValues(`items.${index}.discount`) || 0;

      const total = calculateLineTotal({
        id: '', // Dummy
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
        discount,
        taxRate: product.taxRate,
        classificationCode: '022',
        unitCode: 'C62',
        taxTypeCode: TAX_TYPE_CODES.SST,
      });
      form.setValue(`items.${index}.total`, total);
    }
  }, [form]);

  // Recalculate totals whenever items change
  useEffect(() => {
    if (!items) return;

    let subtotal = 0;
    let taxAmount = 0;
    let discount = 0;

    items.forEach((item) => {
      const lineSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const lineDiscount = lineSubtotal * ((item.discount || 0) / 100);
      const afterDiscount = lineSubtotal - lineDiscount;
      const lineTax = afterDiscount * ((item.taxRate || 0) / 100);

      subtotal += lineSubtotal;
      discount += lineDiscount;
      taxAmount += lineTax;
    });

    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('discount', discount);
    form.setValue('total', subtotal - discount + taxAmount);
  }, [items, form]);

  const validationErrors = form.watch('validationErrors') as unknown as { code: string; message: string; target?: string }[] | undefined;

  return (
    <div className="space-y-6">
      {validationErrors && validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i}>
                  <span className="font-semibold">{err.code}:</span> {err.message}
                  {err.target && <span className="text-xs opacity-80 ml-1">({err.target})</span>}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & E-Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={handleCustomerChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerTin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. C1234567890" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerBrn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BRN</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 202301000001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[80px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Date *</FormLabel>
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    error={!!form.formState.errors.invoiceDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    error={!!form.formState.errors.dueDate}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PAYMENT_MODE_CODES).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key.replace('_', ' ')} ({value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingPeriodStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Period Start (Optional)</FormLabel>
                  <FormControl>
                    <DateInput value={field.value || ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingPeriodEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Period End (Optional)</FormLabel>
                  <FormControl>
                    <DateInput value={field.value || ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({
              id: generateLineItemId(),
              productId: '',
              productName: '',
              sku: '',
              quantity: 1,
              unitPrice: 0,
              discount: 0,
              taxRate: 0,
              total: 0,
              classificationCode: '022',
              unitCode: 'C62',
              taxTypeCode: TAX_TYPE_CODES.SST,
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-card/50">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Product Select */}
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field: itemField }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select
                      onValueChange={(value) => handleProductChange(index, value)}
                      value={itemField.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} (${p.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...itemField}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            itemField.onChange(val);
                            // Recalc handled by useEffect
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...itemField}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            itemField.onChange(val);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.discount`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Disc %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...itemField}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            itemField.onChange(val);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.total`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm flex items-center">
                        {itemField.value?.toFixed(2)}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* E-Invoice Item Fields */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.classificationCode`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Class Code</FormLabel>
                      <FormControl>
                        <Input {...itemField} placeholder="022" className="h-8 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.taxTypeCode`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Tax Type</FormLabel>
                      <Select onValueChange={itemField.onChange} value={itemField.value}>
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Tax" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TAX_TYPE_CODES).map(([k, v]) => (
                            <SelectItem key={v} value={v} className="text-xs">{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.taxExemptionReason`}
                  render={({ field: itemField }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Exemption (if any)</FormLabel>
                      <FormControl>
                        <Input {...itemField} className="h-8 text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              No items added. Click "Add Item" to start.
            </div>
          )}
          <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Add notes..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Payment terms..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
