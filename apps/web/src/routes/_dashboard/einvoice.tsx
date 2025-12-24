import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';

import { LhdnSettings } from '@/components/einvoice';
import { EInvoiceOverview } from '@/components/einvoice/einvoice-overview';
import { PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { get, post, del } from '@/lib/api-client';

// Reusing existing types and cache logic
export interface LhdnCredential {
  id: string;
  clientId: string;
  tin: string;
  brn?: string;
  idType: string;
  idValue: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  isActive: boolean;
}

let credentialCache: {
  data: LhdnCredential | null;
  timestamp: number;
  promise: Promise<LhdnCredential | null> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

const CACHE_TTL = 30000;

async function fetchCredentials(): Promise<LhdnCredential | null> {
  const now = Date.now();
  if (credentialCache.data !== null && now - credentialCache.timestamp < CACHE_TTL) {
    return credentialCache.data;
  }
  if (credentialCache.promise) {
    return credentialCache.promise;
  }
  credentialCache.promise = (async () => {
    try {
      const response = await get<LhdnCredential>('/v1/einvoices/settings/credentials');
      if (response.success && response.data) {
        credentialCache.data = response.data;
        credentialCache.timestamp = Date.now();
        return response.data;
      }
      credentialCache.data = null;
      credentialCache.timestamp = Date.now();
      return null;
    } catch {
      credentialCache.data = null;
      credentialCache.timestamp = Date.now();
      return null;
    } finally {
      credentialCache.promise = null;
    }
  })();
  return credentialCache.promise;
}

function invalidateCredentialCache() {
  credentialCache.data = null;
  credentialCache.timestamp = 0;
  credentialCache.promise = null;
}

export const Route = createFileRoute('/_dashboard/einvoice')({
  loader: async () => {
    const credential = await fetchCredentials();
    return { credential };
  },
  component: EInvoicePage,
});

function EInvoicePage() {
  const loaderData = Route.useLoaderData();
  const [credential, setCredential] = useState<LhdnCredential | null>(loaderData.credential);

  const handleSave = useCallback(async (data: {
    clientId: string;
    clientSecret: string;
    tin: string;
    brn?: string;
    idType: string;
    idValue: string;
    environment: 'SANDBOX' | 'PRODUCTION';
  }) => {
    console.log('💾 Saving LHDN credentials:', data);
    const response = await post<LhdnCredential>('/v1/einvoices/settings/credentials', data);

    if (response.success && response.data) {
      invalidateCredentialCache();
      setCredential(response.data);
    }
  }, []);

  const handleTest = useCallback(async () => {
    console.log('🔌 Testing LHDN connection...');
    const response = await post<{ connected: boolean; message: string }>('/v1/einvoices/settings/credentials/test', {});

    if (response.success && response.data) {
      return response.data;
    }

    return {
      connected: false,
      message: 'Connection test failed',
    };
  }, []);

  const handleDelete = useCallback(async () => {
    console.log('🗑️ Deleting LHDN credentials...');
    await del('/v1/einvoices/settings/credentials');
    invalidateCredentialCache();
    setCredential(null);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="E-Invoice (LHDN)"
        description="Manage your E-Invoice operations and integrations"
        actions={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EInvoiceOverview />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Credentials Form */}
          {/* We can wrap LhdnSettings in a div or Card if LhdnSettings implies it? 
               LhdnSettings in previous version was inside DashboardCard.
               LlhndSettings component itself might be just form. 
               Looking at Step 793, it was inside DashboardCard.
               But LhdnSettings might handle its own Card?
               I'll wrap it in a div or Card just to be safe layout-wise.
           */}
          <LhdnSettings
            credential={credential}
            onSave={handleSave}
            onTest={handleTest}
            onDelete={handleDelete}
          />

          {/* Help Section */}
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Getting Started with LHDN e-Invoice
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>1. Register at the <a href="https://sdk.myinvois.hasil.gov.my" target="_blank" rel="noopener noreferrer" className="underline">LHDN MyInvois Portal</a></li>
                  <li>2. Obtain your Client ID and Client Secret from the portal</li>
                  <li>3. Start with <strong>Sandbox</strong> environment for testing</li>
                  <li>4. Once validated, switch to <strong>Production</strong> for live submissions</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
