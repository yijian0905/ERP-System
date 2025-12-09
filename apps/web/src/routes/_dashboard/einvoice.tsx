import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Info } from 'lucide-react';

import { LhdnSettings } from '@/components/einvoice';
import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';

export const Route = createFileRoute('/_dashboard/einvoice')({
  component: EInvoicePage,
});

interface LhdnCredential {
  id: string;
  clientId: string;
  tin: string;
  brn?: string;
  idType: string;
  idValue: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  isActive: boolean;
}

// Mock data - replace with actual API calls
const mockCredential: LhdnCredential = {
  id: 'cred-001',
  clientId: 'my-client-id',
  tin: 'C1234567890',
  brn: '202001234567',
  idType: 'BRN',
  idValue: '202001234567',
  environment: 'SANDBOX',
  isActive: true,
};

function EInvoicePage() {
  const [credential, setCredential] = useState<LhdnCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load credentials on mount
  useEffect(() => {
    const loadCredential = async () => {
      setIsLoading(true);
      try {
        // TODO: Call API to get credentials
        // const response = await api.get('/api/v1/einvoices/settings/credentials');
        // setCredential(response.data.data);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCredential(mockCredential);
      } catch (error) {
        console.error('Failed to load credentials:', error);
        setCredential(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredential();
  }, []);

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
    // TODO: Call API to save credentials
    // await api.post('/api/v1/einvoices/settings/credentials', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setCredential({
      id: 'cred-new',
      clientId: data.clientId,
      tin: data.tin,
      brn: data.brn,
      idType: data.idType,
      idValue: data.idValue,
      environment: data.environment,
      isActive: true,
    });
  }, []);

  const handleTest = useCallback(async () => {
    console.log('🔌 Testing LHDN connection...');
    // TODO: Call API to test connection
    // const response = await api.post('/api/v1/einvoices/settings/credentials/test');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return {
      connected: true,
      message: 'Successfully connected to LHDN MyInvois API',
    };
  }, []);

  const handleDelete = useCallback(async () => {
    console.log('🗑️ Deleting LHDN credentials...');
    // TODO: Call API to delete credentials
    // await api.delete('/api/v1/einvoices/settings/credentials');
    await new Promise((resolve) => setTimeout(resolve, 500));
    setCredential(null);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          title="E-Invoice (LHDN)"
          description="Configure LHDN MyInvois integration"
        />
        <DashboardCard>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="E-Invoice (LHDN)"
        description="Configure LHDN MyInvois API integration for e-Invoice submission"
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
