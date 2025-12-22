import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, FileText, Info } from 'lucide-react';

import { LhdnSettings } from '@/components/einvoice';
import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { get, post, del } from '@/lib/api-client';

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

// Simple in-memory cache for credentials
let credentialCache: {
  data: LhdnCredential | null;
  timestamp: number;
  promise: Promise<LhdnCredential | null> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

const CACHE_TTL = 30000; // 30 seconds cache

/**
 * Fetch credentials with caching
 */
async function fetchCredentials(): Promise<LhdnCredential | null> {
  const now = Date.now();

  // Return cached data if still valid
  if (credentialCache.data !== null && now - credentialCache.timestamp < CACHE_TTL) {
    return credentialCache.data;
  }

  // If there's already a request in flight, wait for it
  if (credentialCache.promise) {
    return credentialCache.promise;
  }

  // Start new request
  credentialCache.promise = (async () => {
    try {
      const response = await get<LhdnCredential>('/v1/einvoices/settings/credentials');
      if (response.success && response.data) {
        credentialCache.data = response.data;
        credentialCache.timestamp = Date.now();
        return response.data;
      }
      // Not found is okay - means no credentials configured
      credentialCache.data = null;
      credentialCache.timestamp = Date.now();
      return null;
    } catch {
      // 404 means no credentials configured, which is okay
      credentialCache.data = null;
      credentialCache.timestamp = Date.now();
      return null;
    } finally {
      credentialCache.promise = null;
    }
  })();

  return credentialCache.promise;
}

/**
 * Invalidate credential cache (call after save/delete)
 */
function invalidateCredentialCache() {
  credentialCache.data = null;
  credentialCache.timestamp = 0;
  credentialCache.promise = null;
}

export const Route = createFileRoute('/_dashboard/einvoice')({
  // Prefetch data before navigation completes - this starts loading immediately
  loader: async () => {
    // Start fetching credentials in parallel with route transition
    const credential = await fetchCredentials();
    return { credential };
  },
  component: EInvoicePage,
});

function EInvoicePage() {
  // Get preloaded data from route loader
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
      invalidateCredentialCache(); // Clear cache so next navigation gets fresh data
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
    invalidateCredentialCache(); // Clear cache so next navigation gets fresh data
    setCredential(null);
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="E-Invoice (LHDN)"
        description="Configure LHDN MyInvois API integration for e-Invoice submission"
        actions={
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return
          </Button>
        }
      />

      {/* Status Overview */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            {credential ? (
              <>
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">API Configured</p>
                  <p className="text-xs text-muted-foreground">
                    {credential.environment} environment
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Not Configured</p>
                  <p className="text-xs text-muted-foreground">
                    Set up credentials below
                  </p>
                </div>
              </>
            )}
          </div>
        </DashboardCard>

        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">TIN</p>
              <p className="text-xs text-muted-foreground font-mono">
                {credential?.tin || 'Not set'}
              </p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium">BRN</p>
              <p className="text-xs text-muted-foreground font-mono">
                {credential?.brn || 'Not set'}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Credentials Form */}
      <DashboardCard>
        <LhdnSettings
          credential={credential}
          onSave={handleSave}
          onTest={handleTest}
          onDelete={handleDelete}
        />
      </DashboardCard>

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
    </PageContainer>
  );
}
