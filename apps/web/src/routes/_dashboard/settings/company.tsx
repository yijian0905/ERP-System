import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Building2, CircleDollarSign, Globe, Mail, MapPin, Palette, Phone, Settings, Shield, Upload, Users, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { patch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useCompany, useCompanyStore } from '@/stores/company';

export const Route = createFileRoute('/_dashboard/settings/company')({
  component: CompanySettingsPage,
});

const settingsTabs = [
  { id: 'general', title: 'General', href: '/settings', icon: Settings },
  { id: 'profile', title: 'Profile', href: '/settings/profile', icon: Users },
  { id: 'notifications', title: 'Notifications', href: '/settings/notifications', icon: Bell },
  { id: 'appearance', title: 'Appearance', href: '/settings/appearance', icon: Palette },
  { id: 'company', title: 'Company', href: '/settings/company', icon: Building2 },
  { id: 'users', title: 'Users', href: '/settings/users', icon: Users },
  { id: 'roles', title: 'Roles & Permissions', href: '/settings/roles', icon: Shield },
  { id: 'localization', title: 'Localization', href: '/settings/localization', icon: Globe },
  { id: 'currencies', title: 'Currencies', href: '/settings/currencies', icon: CircleDollarSign },
];

function CompanySettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const company = useCompany();
  const updateCompany = useCompanyStore((state) => state.updateCompany);

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      updateCompany({
        address: { ...company.address, [addressField]: value },
      });
    } else {
      updateCompany({ [field]: value });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert('File size must be less than 2MB');
      return;
    }

    // Read file and convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateCompany({ logo: base64String });
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateCompany({ logo: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await patch('/v1/company', {
        name: company.name,
        legalName: company.legalName,
        taxId: company.taxId,
        email: company.email,
        phone: company.phone,
        website: company.website,
        address: company.address,
        logo: company.logo,
      });
      // Company data already updated in local store, API call syncs to database
    } catch (error) {
      console.error('Failed to save company settings:', error);
      alert('Failed to save company settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="w-full lg:w-64 flex-shrink-0">
          <div className="rounded-lg border bg-card p-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={tab.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    tab.id === 'company'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Company Logo */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Company Logo</h2>
              <p className="text-sm text-muted-foreground">
                Upload your company logo for invoices and documents
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-6">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                  {company.logo ? (
                    <>
                      <img src={company.logo} alt="Company logo" className="h-full w-full object-contain rounded-lg" />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 transition-colors"
                        aria-label="Remove logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {company.logo ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Recommended: 200x200px, PNG or SVG format (max 2MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <p className="text-sm text-muted-foreground">
                General company details
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={company.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={company.legalName}
                    onChange={(e) => handleChange('legalName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:max-w-xs">
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={company.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <p className="text-sm text-muted-foreground">
                How customers and suppliers can reach you
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={company.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={company.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">
                  <Globe className="inline h-4 w-4 mr-1" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={company.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">
                <MapPin className="inline h-5 w-5 mr-1" />
                Business Address
              </h2>
              <p className="text-sm text-muted-foreground">
                {"Your company's primary address"}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={company.address.street}
                  onChange={(e) => handleChange('address.street', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={company.address.city}
                    onChange={(e) => handleChange('address.city', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={company.address.state}
                    onChange={(e) => handleChange('address.state', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP / Postal Code</Label>
                  <Input
                    id="zip"
                    value={company.address.zip}
                    onChange={(e) => handleChange('address.zip', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    value={company.address.country}
                    onChange={(e) => handleChange('address.country', e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
