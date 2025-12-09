import { createFileRoute } from '@tanstack/react-router';
import {
  Building2,
  Globe,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Star,
  Truck,
} from 'lucide-react';
import { useState } from 'react';

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
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/suppliers')({
  component: SuppliersPage,
});

// Types
interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  paymentTerms: number;
  leadTime: number;
  rating: number | null;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
}

// Mock data
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    code: 'SUP-001',
    name: 'Tech Supplies Inc',
    contactPerson: 'John Davis',
    email: 'orders@techsupplies.com',
    phone: '+1 (555) 111-2222',
    website: 'https://techsupplies.com',
    paymentTerms: 30,
    leadTime: 5,
    rating: 5,
    isActive: true,
    totalOrders: 45,
    totalSpent: 125000,
  },
  {
    id: '2',
    code: 'SUP-002',
    name: 'Office Depot',
    contactPerson: 'Sarah Miller',
    email: 'business@officedepot.com',
    phone: '+1 (555) 222-3333',
    website: 'https://officedepot.com',
    paymentTerms: 15,
    leadTime: 3,
    rating: 4,
    isActive: true,
    totalOrders: 32,
    totalSpent: 45000,
  },
  {
    id: '3',
    code: 'SUP-003',
    name: 'Electronics Wholesale',
    contactPerson: 'Mike Chen',
    email: 'sales@elecwholesale.com',
    phone: '+1 (555) 333-4444',
    website: null,
    paymentTerms: 45,
    leadTime: 7,
    rating: 4,
    isActive: true,
    totalOrders: 28,
    totalSpent: 89000,
  },
  {
    id: '4',
    code: 'SUP-004',
    name: 'Furniture World',
    contactPerson: 'Lisa Park',
    email: 'orders@furnitureworld.com',
    phone: '+1 (555) 444-5555',
    website: 'https://furnitureworld.com',
    paymentTerms: 30,
    leadTime: 14,
    rating: 3,
    isActive: true,
    totalOrders: 15,
    totalSpent: 67000,
  },
  {
    id: '5',
    code: 'SUP-005',
    name: 'Global Parts Ltd',
    contactPerson: 'Tom Wilson',
    email: 'contact@globalparts.co',
    phone: '+1 (555) 555-6666',
    website: 'https://globalparts.co',
    paymentTerms: 60,
    leadTime: 10,
    rating: 5,
    isActive: true,
    totalOrders: 20,
    totalSpent: 156000,
  },
];

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    paymentTerms: '30',
    leadTime: '7',
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    return (
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        paymentTerms: supplier.paymentTerms.toString(),
        leadTime: supplier.leadTime.toString(),
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        paymentTerms: '30',
        leadTime: '7',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                name: formData.name,
                contactPerson: formData.contactPerson || null,
                email: formData.email || null,
                phone: formData.phone || null,
                website: formData.website || null,
                paymentTerms: parseInt(formData.paymentTerms),
                leadTime: parseInt(formData.leadTime),
              }
            : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        id: String(suppliers.length + 1),
        code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: formData.name,
        contactPerson: formData.contactPerson || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        paymentTerms: parseInt(formData.paymentTerms),
        leadTime: parseInt(formData.leadTime),
        rating: null,
        isActive: true,
        totalOrders: 0,
        totalSpent: 0,
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        description="Manage your supplier database"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        }
      />

      {/* Search */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
        </div>
      </DashboardCard>

      {/* Suppliers grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSuppliers.map((supplier) => (
          <DashboardCard key={supplier.id} className="relative">
            <div className="absolute right-4 top-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenModal(supplier)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>View Orders</DropdownMenuItem>
                  <DropdownMenuItem>Create PO</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(supplier.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate pr-8">{supplier.name}</h3>
                <p className="text-sm text-muted-foreground">{supplier.code}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {supplier.contactPerson && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{supplier.contactPerson}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-primary"
                  >
                    {supplier.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  {renderStars(supplier.rating)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="font-medium">{supplier.leadTime} days</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {supplier.totalOrders} orders
                </span>
                <span className="font-medium">
                  ${supplier.totalSpent.toLocaleString()} spent
                </span>
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <DashboardCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No suppliers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Get started by adding your first supplier'}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            )}
          </div>
        </DashboardCard>
      )}

      {/* Add/Edit Supplier Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Update supplier information'
                : 'Enter the details for the new supplier'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData((f) => ({ ...f, contactPerson: e.target.value }))}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Input
                  id="paymentTerms"
                  type="number"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData((f) => ({ ...f, paymentTerms: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="leadTime">Lead Time (days)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  value={formData.leadTime}
                  onChange={(e) => setFormData((f) => ({ ...f, leadTime: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name}>
              {isSaving ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
