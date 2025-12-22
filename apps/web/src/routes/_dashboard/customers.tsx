import { createFileRoute } from '@tanstack/react-router';
import {
  Building2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Printer,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterSelect } from '@/components/ui/filter-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { customersApi, type Customer as ApiCustomer } from '@/lib/api';

export const Route = createFileRoute('/_dashboard/customers')({
  component: CustomersPage,
});

// Types
type CustomerType = 'INDIVIDUAL' | 'COMPANY';

interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  address: string;
  email: string | null;
  phone: string | null;
  fax: string | null;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
}

const typeStyles: Record<CustomerType, string> = {
  INDIVIDUAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPANY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const typeIcons: Record<CustomerType, typeof User> = {
  INDIVIDUAL: User,
  COMPANY: Building2,
};

const typeLabels: Record<CustomerType, string> = {
  INDIVIDUAL: 'Individual',
  COMPANY: 'Company',
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMPANY' as CustomerType,
    address: '',
    email: '',
    phone: '',
    fax: '',
    creditLimit: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch customers from API
  useEffect(() => {
    async function fetchCustomers() {
      setIsLoading(true);
      try {
        const response = await customersApi.list();
        if (response.success && response.data) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || customer.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        type: customer.type,
        address: customer.address,
        email: customer.email || '',
        phone: customer.phone || '',
        fax: customer.fax || '',
        creditLimit: customer.creditLimit.toString(),
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        type: 'COMPANY',
        address: '',
        email: '',
        phone: '',
        fax: '',
        creditLimit: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (editingCustomer) {
      // Update existing customer
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
              ...c,
              name: formData.name,
              type: formData.type,
              address: formData.address,
              email: formData.email || null,
              phone: formData.phone || null,
              fax: formData.type === 'COMPANY' ? formData.fax || null : null,
              creditLimit: parseFloat(formData.creditLimit) || 0,
            }
            : c
        )
      );
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: String(customers.length + 1),
        code: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        name: formData.name,
        type: formData.type,
        address: formData.address,
        email: formData.email || null,
        phone: formData.phone || null,
        fax: formData.type === 'COMPANY' ? formData.fax || null : null,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        currentBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setCustomers((prev) => [newCustomer, ...prev]);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Check if form is valid
  const isFormValid = formData.name.trim() && formData.address.trim();

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {/* Search and filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={typeFilter || 'all'}
              onChange={(val) => setTypeFilter(val === 'all' ? '' : val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'COMPANY', label: 'Company' },
                { value: 'INDIVIDUAL', label: 'Individual' },
              ]}
              placeholder="All Types"
              className="w-auto"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Customers table */}
      <DashboardCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Contact</th>
                <th className="pb-3 font-medium text-right">Credit Limit</th>
                <th className="pb-3 font-medium text-right">Balance</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => {
                const TypeIcon = typeIcons[customer.type];
                return (
                  <tr key={customer.id} className="border-b last:border-0 table-row-hover">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <TypeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">{customer.name}</span>
                          {!customer.isActive && (
                            <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{customer.code}</td>
                    <td className="py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          typeStyles[customer.type]
                        )}
                      >
                        {typeLabels[customer.type]}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        {customer.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.fax && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Printer className="h-3 w-3" />
                            {customer.fax}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      ${customer.creditLimit.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={cn(
                          customer.currentBalance > 0 ? 'text-warning font-medium' : ''
                        )}
                      >
                        ${customer.currentBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenModal(customer)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Orders</DropdownMenuItem>
                          <DropdownMenuItem>View Invoices</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(customer.id)}
                          >
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

        {filteredCustomers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm || typeFilter
                ? 'Try adjusting your search or filter'
                : 'Get started by adding your first customer'}
            </p>
            {!searchTerm && !typeFilter && (
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Add/Edit Customer Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update customer information'
                : 'Enter the details for the new customer'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Customer Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Customer Type</Label>
              <FilterSelect
                value={formData.type}
                onChange={(val) =>
                  setFormData((f) => ({ ...f, type: val as CustomerType, fax: val === 'INDIVIDUAL' ? '' : f.fax }))
                }
                options={[
                  { value: 'COMPANY', label: 'Company' },
                  { value: 'INDIVIDUAL', label: 'Individual' },
                ]}
                placeholder="Select type"
                className="w-full"
              />
            </div>

            {/* Customer Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder={formData.type === 'COMPANY' ? 'Enter company name' : 'Enter customer name'}
              />
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                placeholder="Enter full address"
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* FAX - Only for Company */}
            {formData.type === 'COMPANY' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fax">FAX</Label>
                  <Input
                    id="fax"
                    type="tel"
                    value={formData.fax}
                    onChange={(e) => setFormData((f) => ({ ...f, fax: e.target.value }))}
                    placeholder="FAX"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData((f) => ({ ...f, creditLimit: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {/* Credit Limit - For Individual (full width) */}
            {formData.type === 'INDIVIDUAL' && (
              <div className="grid gap-2">
                <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setFormData((f) => ({ ...f, creditLimit: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
              {isSaving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
