import { createFileRoute } from '@tanstack/react-router';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  Computer,
  DollarSign,
  Edit,
  Laptop,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Server,
  Trash2,
  TrendingDown,
  Truck,
  User,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';

import { AssigneeSelector } from '@/components/assignee-selector';
import { CreatableSelect } from '@/components/creatable-select';
import {
  DashboardCard,
  PageContainer,
  PageHeader,
  StatsCard,
} from '@/components/layout/dashboard-layout';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/assets')({
  component: AssetsPage,
});

// Types
type AssetType = 'CURRENT' | 'FIXED';
type AssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED' | 'RESERVED' | 'RETIRED';
type AssetCategory = 'IT_EQUIPMENT' | 'FURNITURE' | 'VEHICLE' | 'MACHINERY' | 'OFFICE_EQUIPMENT' | 'CASH' | 'ACCOUNTS_RECEIVABLE' | 'INVENTORY' | 'INVESTMENTS' | 'OTHER';
type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'NONE';

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  description: string;
  assetType: AssetType;
  category: AssetCategory;
  status: AssetStatus;
  location: string;
  assignedTo: string | null;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: number;
  salvageValue: number;
  warrantyExpiry: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Asset Type configuration
const assetTypeConfig: Record<AssetType, { label: string; color: string }> = {
  CURRENT: { label: 'Current Assets', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  FIXED: { label: 'Fixed Assets', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

// Category configuration
const categoryConfig: Record<AssetCategory, { label: string; icon: typeof Computer; color: string }> = {
  IT_EQUIPMENT: { label: 'IT Equipment', icon: Laptop, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  FURNITURE: { label: 'Furniture', icon: Building2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  VEHICLE: { label: 'Vehicle', icon: Truck, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  MACHINERY: { label: 'Machinery', icon: Server, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  OFFICE_EQUIPMENT: { label: 'Office Equipment', icon: Computer, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  CASH: { label: 'Cash', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ACCOUNTS_RECEIVABLE: { label: 'Accounts Receivable', icon: DollarSign, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  INVENTORY: { label: 'Inventory', icon: Package, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  INVESTMENTS: { label: 'Investments', icon: DollarSign, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  OTHER: { label: 'Other', icon: Package, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const statusConfig: Record<AssetStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  DISPOSED: { label: 'Disposed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  RESERVED: { label: 'Reserved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  RETIRED: { label: 'Retired', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

// Initial locations - can be expanded by admin/manager
const initialLocations = [
  'Main Office - Floor 1',
  'Main Office - Floor 2',
  'Main Office - Floor 3',
  'Warehouse A',
  'Warehouse B',
  'Remote Office - NYC',
  'Remote Office - LA',
];

// Mock employees - can be expanded for testing different UI modes
// N ≤ 20: Simple dropdown
// 21 ≤ N ≤ 100: Searchable dropdown
// 101 ≤ N ≤ 500: Grouped dropdown
// N > 500: People Picker Modal
const employees = [
  { id: 'e1', name: 'John Smith', department: 'Engineering', title: 'Senior Engineer' },
  { id: 'e2', name: 'Sarah Johnson', department: 'Marketing', title: 'Marketing Manager' },
  { id: 'e3', name: 'Mike Chen', department: 'Sales', title: 'Sales Representative' },
  { id: 'e4', name: 'Emily Davis', department: 'HR', title: 'HR Specialist' },
  { id: 'e5', name: 'Alex Wilson', department: 'Finance', title: 'Financial Analyst' },
];

// Mock assets
const mockAssets: Asset[] = [
  {
    id: '1',
    assetTag: 'AST-2024-0001',
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro 16-inch with M3 Pro chip',
    assetType: 'FIXED',
    category: 'IT_EQUIPMENT',
    status: 'ACTIVE',
    location: 'Main Office - Floor 2',
    assignedTo: 'John Smith',
    purchaseDate: '2024-01-15',
    purchaseCost: 2499.00,
    currentValue: 2249.10,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 5,
    salvageValue: 250.00,
    warrantyExpiry: '2027-01-15',
    serialNumber: 'C02ZX1ABCD12',
    manufacturer: 'Apple',
    model: 'MacBook Pro 16" M3 Pro',
    notes: 'Developer laptop',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    assetTag: 'AST-2024-0002',
    name: 'Dell Monitor 27"',
    description: 'Dell UltraSharp 27" 4K USB-C Monitor',
    assetType: 'FIXED',
    category: 'IT_EQUIPMENT',
    status: 'ACTIVE',
    location: 'Main Office - Floor 2',
    assignedTo: 'John Smith',
    purchaseDate: '2024-01-15',
    purchaseCost: 649.00,
    currentValue: 584.10,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 5,
    salvageValue: 65.00,
    warrantyExpiry: '2027-01-15',
    serialNumber: 'DEL12345678',
    manufacturer: 'Dell',
    model: 'U2723QE',
    notes: '',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '3',
    assetTag: 'AST-2023-0015',
    name: 'Executive Office Desk',
    description: 'L-shaped executive desk with drawers',
    assetType: 'FIXED',
    category: 'FURNITURE',
    status: 'ACTIVE',
    location: 'Main Office - Floor 3',
    assignedTo: 'Sarah Johnson',
    purchaseDate: '2023-06-20',
    purchaseCost: 1200.00,
    currentValue: 960.00,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 10,
    salvageValue: 120.00,
    warrantyExpiry: '2028-06-20',
    serialNumber: null,
    manufacturer: 'Herman Miller',
    model: 'Executive L-Desk',
    notes: '',
    createdAt: '2023-06-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '4',
    assetTag: 'AST-2022-0008',
    name: 'Toyota Camry 2022',
    description: 'Company vehicle for sales team',
    assetType: 'FIXED',
    category: 'VEHICLE',
    status: 'ACTIVE',
    location: 'Main Office - Parking',
    assignedTo: 'Mike Chen',
    purchaseDate: '2022-03-15',
    purchaseCost: 28500.00,
    currentValue: 19950.00,
    depreciationMethod: 'DECLINING_BALANCE',
    usefulLifeYears: 7,
    salvageValue: 5000.00,
    warrantyExpiry: '2025-03-15',
    serialNumber: 'VIN123456789',
    manufacturer: 'Toyota',
    model: 'Camry LE 2022',
    notes: 'Mileage: 45,000',
    createdAt: '2022-03-15T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '5',
    assetTag: 'AST-2023-0022',
    name: 'HP LaserJet Pro',
    description: 'Multifunction laser printer',
    assetType: 'FIXED',
    category: 'OFFICE_EQUIPMENT',
    status: 'MAINTENANCE',
    location: 'Main Office - Floor 1',
    assignedTo: null,
    purchaseDate: '2023-09-10',
    purchaseCost: 450.00,
    currentValue: 337.50,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 4,
    salvageValue: 50.00,
    warrantyExpiry: '2024-09-10',
    serialNumber: 'HP987654321',
    manufacturer: 'HP',
    model: 'LaserJet Pro M428fdw',
    notes: 'Paper jam issue - under repair',
    createdAt: '2023-09-10T10:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: '6',
    assetTag: 'AST-2021-0003',
    name: 'Industrial CNC Machine',
    description: 'CNC milling machine for production',
    assetType: 'FIXED',
    category: 'MACHINERY',
    status: 'ACTIVE',
    location: 'Warehouse A',
    assignedTo: null,
    purchaseDate: '2021-05-20',
    purchaseCost: 75000.00,
    currentValue: 52500.00,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 15,
    salvageValue: 7500.00,
    warrantyExpiry: '2026-05-20',
    serialNumber: 'CNC-2021-00123',
    manufacturer: 'Haas',
    model: 'VF-2',
    notes: 'Annual maintenance due in January',
    createdAt: '2021-05-20T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '7',
    assetTag: 'AST-2020-0012',
    name: 'Old Desktop Computer',
    description: 'Legacy desktop system',
    assetType: 'FIXED',
    category: 'IT_EQUIPMENT',
    status: 'RETIRED',
    location: 'Warehouse B',
    assignedTo: null,
    purchaseDate: '2020-02-10',
    purchaseCost: 1200.00,
    currentValue: 0,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 4,
    salvageValue: 100.00,
    warrantyExpiry: null,
    serialNumber: 'DELL-OLD-001',
    manufacturer: 'Dell',
    model: 'OptiPlex 7080',
    notes: 'Fully depreciated, pending disposal',
    createdAt: '2020-02-10T10:00:00Z',
    updatedAt: '2024-11-01T10:00:00Z',
  },
  {
    id: '8',
    assetTag: 'AST-2024-0010',
    name: 'Conference Room Chairs (Set of 12)',
    description: 'Ergonomic mesh conference chairs',
    assetType: 'FIXED',
    category: 'FURNITURE',
    status: 'ACTIVE',
    location: 'Main Office - Floor 1',
    assignedTo: null,
    purchaseDate: '2024-03-01',
    purchaseCost: 3600.00,
    currentValue: 3240.00,
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLifeYears: 10,
    salvageValue: 360.00,
    warrantyExpiry: '2029-03-01',
    serialNumber: null,
    manufacturer: 'Steelcase',
    model: 'Series 1 Chair',
    notes: 'Conference Room A',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '9',
    assetTag: 'AST-2024-0100',
    name: 'Operating Cash Account',
    description: 'Primary business checking account',
    assetType: 'CURRENT',
    category: 'CASH',
    status: 'ACTIVE',
    location: 'Bank Account',
    assignedTo: null,
    purchaseDate: '2024-01-01',
    purchaseCost: 50000.00,
    currentValue: 50000.00,
    depreciationMethod: 'NONE',
    usefulLifeYears: 0,
    salvageValue: 0,
    warrantyExpiry: null,
    serialNumber: null,
    manufacturer: null,
    model: null,
    notes: 'Bank: First National Bank, Account: 123456789',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '10',
    assetTag: 'AST-2024-0101',
    name: 'Accounts Receivable - Q4 2024',
    description: 'Outstanding customer invoices',
    assetType: 'CURRENT',
    category: 'ACCOUNTS_RECEIVABLE',
    status: 'ACTIVE',
    location: 'Accounts Department',
    assignedTo: null,
    purchaseDate: '2024-10-01',
    purchaseCost: 125000.00,
    currentValue: 125000.00,
    depreciationMethod: 'NONE',
    usefulLifeYears: 0,
    salvageValue: 0,
    warrantyExpiry: null,
    serialNumber: null,
    manufacturer: null,
    model: null,
    notes: 'Expected collection within 30-60 days',
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '11',
    assetTag: 'AST-2024-0102',
    name: 'Inventory Stock Value',
    description: 'Total value of inventory on hand',
    assetType: 'CURRENT',
    category: 'INVENTORY',
    status: 'ACTIVE',
    location: 'Warehouse A, Warehouse B',
    assignedTo: null,
    purchaseDate: '2024-01-01',
    purchaseCost: 75000.00,
    currentValue: 75000.00,
    depreciationMethod: 'NONE',
    usefulLifeYears: 0,
    salvageValue: 0,
    warrantyExpiry: null,
    serialNumber: null,
    manufacturer: null,
    model: null,
    notes: 'Based on weighted average cost method',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
];

function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetType: 'FIXED' as AssetType,
    category: 'IT_EQUIPMENT' as AssetCategory,
    status: 'ACTIVE' as AssetStatus,
    location: '',
    assignedTo: '',
    purchaseDate: '',
    purchaseCost: 0,
    depreciationMethod: 'STRAIGHT_LINE' as DepreciationMethod,
    usefulLifeYears: 5,
    salvageValue: 0,
    warrantyExpiry: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    notes: '',
  });

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssetType = !assetTypeFilter || asset.assetType === assetTypeFilter;
    const matchesCategory = !categoryFilter || asset.category === categoryFilter;
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    const matchesLocation = !locationFilter || asset.location === locationFilter;
    return matchesSearch && matchesAssetType && matchesCategory && matchesStatus && matchesLocation;
  });

  // Calculate stats
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalPurchaseCost = assets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalDepreciation = totalPurchaseCost - totalValue;
  const activeAssets = assets.filter((a) => a.status === 'ACTIVE').length;
  const maintenanceAssets = assets.filter((a) => a.status === 'MAINTENANCE').length;
  
  // Asset type stats
  const currentAssets = assets.filter((a) => a.assetType === 'CURRENT');
  const fixedAssets = assets.filter((a) => a.assetType === 'FIXED');
  const currentAssetsValue = currentAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const fixedAssetsValue = fixedAssets.reduce((sum, a) => sum + a.currentValue, 0);

  // Get unique locations from assets
  const usedLocations = [...new Set(assets.map((a) => a.location))];

  // Generate asset tag
  const generateAssetTag = () => {
    const year = new Date().getFullYear();
    const count = assets.length + 1;
    return `AST-${year}-${String(count).padStart(4, '0')}`;
  };

  // Calculate current value based on depreciation
  const calculateCurrentValue = (
    purchaseCost: number,
    purchaseDate: string,
    usefulLifeYears: number,
    salvageValue: number,
    method: DepreciationMethod,
    assetType: AssetType
  ): number => {
    // Current assets don't depreciate - they maintain their purchase cost value
    if (assetType === 'CURRENT' || method === 'NONE') return purchaseCost;
    
    const now = new Date();
    const purchase = new Date(purchaseDate);
    const yearsElapsed = (now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (yearsElapsed >= usefulLifeYears) return salvageValue;
    
    if (method === 'STRAIGHT_LINE') {
      const annualDepreciation = (purchaseCost - salvageValue) / usefulLifeYears;
      return Math.max(salvageValue, purchaseCost - (annualDepreciation * yearsElapsed));
    } else if (method === 'DECLINING_BALANCE') {
      const rate = 2 / usefulLifeYears;
      let value = purchaseCost;
      for (let i = 0; i < Math.floor(yearsElapsed); i++) {
        value = Math.max(salvageValue, value * (1 - rate));
      }
      return value;
    }
    return purchaseCost;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      assetType: 'FIXED',
      category: 'IT_EQUIPMENT',
      status: 'ACTIVE',
      location: '',
      assignedTo: '',
      purchaseDate: '',
      purchaseCost: 0,
      depreciationMethod: 'STRAIGHT_LINE',
      usefulLifeYears: 5,
      salvageValue: 0,
      warrantyExpiry: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      notes: '',
    });
  };

  // Open edit modal
  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      assetType: asset.assetType,
      category: asset.category,
      status: asset.status,
      location: asset.location,
      assignedTo: asset.assignedTo || '',
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      depreciationMethod: asset.depreciationMethod,
      usefulLifeYears: asset.usefulLifeYears,
      salvageValue: asset.salvageValue,
      warrantyExpiry: asset.warrantyExpiry || '',
      serialNumber: asset.serialNumber || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      notes: asset.notes,
    });
    setIsEditModalOpen(true);
  };

  // Save asset
  const handleSaveAsset = async (isNew: boolean) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentValue = calculateCurrentValue(
      formData.purchaseCost,
      formData.purchaseDate,
      formData.usefulLifeYears,
      formData.salvageValue,
      formData.depreciationMethod,
      formData.assetType
    );

    if (isNew) {
      const newAsset: Asset = {
        id: String(assets.length + 1),
        assetTag: generateAssetTag(),
        name: formData.name,
        description: formData.description,
        assetType: formData.assetType,
        category: formData.category,
        status: formData.status,
        location: formData.location,
        assignedTo: formData.assignedTo || null,
        purchaseDate: formData.purchaseDate,
        purchaseCost: formData.purchaseCost,
        currentValue,
        depreciationMethod: formData.depreciationMethod,
        usefulLifeYears: formData.usefulLifeYears,
        salvageValue: formData.salvageValue,
        warrantyExpiry: formData.warrantyExpiry || null,
        serialNumber: formData.serialNumber || null,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssets((prev) => [newAsset, ...prev]);
      setIsAddModalOpen(false);
    } else if (selectedAsset) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === selectedAsset.id
            ? {
                ...a,
                name: formData.name,
                description: formData.description,
                assetType: formData.assetType,
                category: formData.category,
                status: formData.status,
                location: formData.location,
                assignedTo: formData.assignedTo || null,
                purchaseDate: formData.purchaseDate,
                purchaseCost: formData.purchaseCost,
                currentValue,
                depreciationMethod: formData.depreciationMethod,
                usefulLifeYears: formData.usefulLifeYears,
                salvageValue: formData.salvageValue,
                warrantyExpiry: formData.warrantyExpiry || null,
                serialNumber: formData.serialNumber || null,
                manufacturer: formData.manufacturer || null,
                model: formData.model || null,
                notes: formData.notes,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      setIsEditModalOpen(false);
    }

    resetForm();
    setSelectedAsset(null);
    setIsSaving(false);
  };

  // Delete asset
  const handleDelete = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  // Dispose asset
  const handleDispose = (assetId: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, status: 'DISPOSED' as AssetStatus, currentValue: 0 } : a
      )
    );
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Check warranty status
  const isWarrantyExpired = (warrantyExpiry: string | null) => {
    if (!warrantyExpiry) return null;
    return new Date(warrantyExpiry) < new Date();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Asset Management"
        description="Track and manage company assets, equipment, and property"
        actions={
          <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Assets"
          value={totalAssets.toString()}
          change={`${activeAssets} active`}
          changeType="neutral"
          icon={Package}
        />
        <StatsCard
          title="Current Assets"
          value={formatCurrency(currentAssetsValue)}
          change={`${currentAssets.length} items`}
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Fixed Assets"
          value={formatCurrency(fixedAssetsValue)}
          change={`${fixedAssets.length} items`}
          changeType="neutral"
          icon={Building2}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(totalValue)}
          change={`Cost: ${formatCurrency(totalPurchaseCost)}`}
          changeType="neutral"
          icon={DollarSign}
        />
      </div>
      
      {/* Additional Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Depreciation"
          value={formatCurrency(totalDepreciation)}
          change={`${totalPurchaseCost > 0 ? ((totalDepreciation / totalPurchaseCost) * 100).toFixed(1) : 0}% of cost`}
          changeType="negative"
          icon={TrendingDown}
        />
        <StatsCard
          title="Under Maintenance"
          value={maintenanceAssets.toString()}
          change={maintenanceAssets > 0 ? 'Needs attention' : 'All operational'}
          changeType={maintenanceAssets > 0 ? 'negative' : 'positive'}
          icon={Wrench}
        />
        <StatsCard
          title="Active Assets"
          value={activeAssets.toString()}
          change={`${((activeAssets / totalAssets) * 100).toFixed(1)}% of total`}
          changeType="positive"
          icon={Check}
        />
      </div>

      {/* Filters */}
      <DashboardCard className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name, tag, serial, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Asset Types</option>
              {Object.entries(assetTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Locations</option>
              {usedLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </DashboardCard>

      {/* Assets Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => {
          const catConfig = categoryConfig[asset.category];
          const statConfig = statusConfig[asset.status];
          const CategoryIcon = catConfig.icon;
          const warrantyExpired = isWarrantyExpired(asset.warrantyExpiry);
          const depreciationPercent = ((asset.purchaseCost - asset.currentValue) / asset.purchaseCost) * 100;

          return (
            <DashboardCard key={asset.id} className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', catConfig.color)}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-1">{asset.name}</h3>
                    <p className="text-xs text-muted-foreground">{asset.assetTag}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(asset)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {asset.status !== 'DISPOSED' && (
                      <DropdownMenuItem onClick={() => handleDispose(asset.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Mark as Disposed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status & Category */}
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', assetTypeConfig[asset.assetType].color)}>
                  {assetTypeConfig[asset.assetType].label}
                </span>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statConfig.color)}>
                  {statConfig.label}
                </span>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', catConfig.color)}>
                  {catConfig.label}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{asset.location}</span>
                </div>
                {asset.assignedTo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{asset.assignedTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                </div>
                {asset.warrantyExpiry && (
                  <div className={cn(
                    'flex items-center gap-2',
                    warrantyExpired ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {warrantyExpired && <AlertTriangle className="h-3.5 w-3.5" />}
                    <span>
                      Warranty: {new Date(asset.warrantyExpiry).toLocaleDateString()}
                      {warrantyExpired && ' (Expired)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Value & Depreciation */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <span className="font-semibold">{formatCurrency(asset.currentValue)}</span>
                </div>
                {asset.assetType === 'FIXED' && asset.depreciationMethod !== 'NONE' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            depreciationPercent >= 80 ? 'bg-destructive' :
                            depreciationPercent >= 50 ? 'bg-amber-500' :
                            'bg-primary'
                          )}
                          style={{ width: `${100 - depreciationPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {(100 - depreciationPercent).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cost: {formatCurrency(asset.purchaseCost)} • Depreciation: {formatCurrency(asset.purchaseCost - asset.currentValue)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost: {formatCurrency(asset.purchaseCost)}
                    {asset.assetType === 'CURRENT' && ' • No depreciation'}
                  </p>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <DashboardCard>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No assets found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Button className="mt-4" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* Add/Edit Asset Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedAsset(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditModalOpen ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogDescription>
              {isEditModalOpen ? 'Update asset information' : 'Enter the details for the new asset'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., MacBook Pro 16"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assetType">Asset Type *</Label>
                  <select
                    id="assetType"
                    value={formData.assetType}
                    onChange={(e) => {
                      const newType = e.target.value as AssetType;
                      setFormData((f) => ({ 
                        ...f, 
                        assetType: newType,
                        // Auto-adjust category based on asset type
                        category: newType === 'CURRENT' 
                          ? (f.category === 'IT_EQUIPMENT' || f.category === 'FURNITURE' || f.category === 'VEHICLE' || f.category === 'MACHINERY' || f.category === 'OFFICE_EQUIPMENT' 
                              ? 'CASH' 
                              : f.category)
                          : (f.category === 'CASH' || f.category === 'ACCOUNTS_RECEIVABLE' || f.category === 'INVENTORY' || f.category === 'INVESTMENTS'
                              ? 'IT_EQUIPMENT'
                              : f.category),
                        // Current assets don't depreciate
                        depreciationMethod: newType === 'CURRENT' ? 'NONE' as DepreciationMethod : f.depreciationMethod,
                        usefulLifeYears: newType === 'CURRENT' ? 0 : f.usefulLifeYears,
                        salvageValue: newType === 'CURRENT' ? 0 : f.salvageValue,
                      }));
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(assetTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as AssetCategory }))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(categoryConfig)
                      .filter(([key]) => {
                        // Filter categories based on asset type
                        if (formData.assetType === 'CURRENT') {
                          return ['CASH', 'ACCOUNTS_RECEIVABLE', 'INVENTORY', 'INVESTMENTS', 'OTHER'].includes(key);
                        } else {
                          return ['IT_EQUIPMENT', 'FURNITURE', 'VEHICLE', 'MACHINERY', 'OFFICE_EQUIPMENT', 'OTHER'].includes(key);
                        }
                      })
                      .map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as AssetStatus }))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Brief description of the asset"
                />
              </div>

              {/* Location & Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <CreatableSelect
                  label="Location *"
                  options={locations}
                    value={formData.location}
                  onChange={(value) => setFormData((f) => ({ ...f, location: value }))}
                  onCreate={(newLocation) => {
                    setLocations((prev) => [...prev, newLocation]);
                  }}
                  placeholder="Select location"
                />
                <div className="grid gap-2">
                  <AssigneeSelector
                    label="Assigned To"
                    employees={employees}
                    value={
                      formData.assignedTo
                        ? employees.find((e) => e.name === formData.assignedTo)?.id || null
                        : null
                    }
                    onChange={(employeeId) => {
                      const employee = employees.find((e) => e.id === employeeId);
                      setFormData((f) => ({ ...f, assignedTo: employee?.name || '' }));
                    }}
                    placeholder="Unassigned"
                  />
                </div>
              </div>

              {/* Purchase & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <DateInput
                    value={formData.purchaseDate}
                    onChange={(value) => setFormData((f) => ({ ...f, purchaseDate: value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purchaseCost">Purchase Cost ($) *</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchaseCost || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setFormData((f) => ({ ...f, purchaseCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Depreciation - Only for Fixed Assets */}
              {formData.assetType === 'FIXED' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                    <select
                      id="depreciationMethod"
                      value={formData.depreciationMethod}
                      onChange={(e) => setFormData((f) => ({ ...f, depreciationMethod: e.target.value as DepreciationMethod }))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="STRAIGHT_LINE">Straight Line</option>
                      <option value="DECLINING_BALANCE">Declining Balance</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="usefulLifeYears">Useful Life (Years)</Label>
                    <Input
                      id="usefulLifeYears"
                      type="number"
                      min="1"
                      value={formData.usefulLifeYears}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormData((f) => ({ ...f, usefulLifeYears: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="salvageValue">Salvage Value ($)</Label>
                    <Input
                      id="salvageValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salvageValue || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormData((f) => ({ ...f, salvageValue: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData((f) => ({ ...f, manufacturer: e.target.value }))}
                    placeholder="e.g., Apple, Dell"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData((f) => ({ ...f, model: e.target.value }))}
                    placeholder="e.g., MacBook Pro 16"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData((f) => ({ ...f, serialNumber: e.target.value }))}
                    placeholder="Serial/VIN number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <DateInput
                    value={formData.warrantyExpiry}
                    onChange={(value) => setFormData((f) => ({ ...f, warrantyExpiry: value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Additional notes or comments"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedAsset(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveAsset(isAddModalOpen)}
              disabled={isSaving || !formData.name || !formData.location || !formData.purchaseDate || !formData.purchaseCost}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {isSaving ? 'Saving...' : isEditModalOpen ? 'Update Asset' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
