import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Company information interface
 */
export interface CompanyInfo {
  name: string;
  legalName?: string;
  taxId?: string;
  email: string;
  phone: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  logo: string | null;
}

interface CompanyState {
  company: CompanyInfo;
}

interface CompanyActions {
  updateCompany: (company: Partial<CompanyInfo>) => void;
  setCompany: (company: CompanyInfo) => void;
  resetCompany: () => void;
}

type CompanyStore = CompanyState & CompanyActions;

const defaultCompany: CompanyInfo = {
  name: 'Demo Company Inc.',
  legalName: 'Demo Company Incorporated',
  taxId: '12-3456789',
  email: 'contact@democompany.com',
  phone: '+1 (555) 123-4567',
  website: 'https://democompany.com',
  address: {
    street: '123 Business Avenue',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'United States',
  },
  logo: null,
};

/**
 * Format company address as a single string for invoices
 */
export function formatCompanyAddress(company: CompanyInfo): string {
  const { address } = company;
  const parts = [
    address.street,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country,
  ].filter(Boolean);
  return parts.join('\n');
}

/**
 * Get company info formatted for invoice display
 */
export function getCompanyInfoForInvoice(company: CompanyInfo) {
  return {
    name: company.name,
    address: formatCompanyAddress(company),
    phone: company.phone,
    email: company.email,
    website: company.website,
    taxId: company.taxId,
    logo: company.logo,
  };
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: defaultCompany,

      updateCompany: (updates) => set((state) => ({
        company: { ...state.company, ...updates },
      })),

      setCompany: (company) => set({ company }),

      resetCompany: () => set({ company: defaultCompany }),
    }),
    {
      name: 'erp-company',
    }
  )
);

// Convenience hooks
export function useCompany() {
  return useCompanyStore((state) => state.company);
}

export function useCompanyForInvoice() {
  const company = useCompany();
  return getCompanyInfoForInvoice(company);
}

