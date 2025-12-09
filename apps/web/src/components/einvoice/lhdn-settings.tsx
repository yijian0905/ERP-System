/**
 * LHDN Settings Component
 * Manage LHDN credentials and connection settings
 */

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

interface LhdnSettingsProps {
  credential?: LhdnCredential | null;
  onSave: (data: {
    clientId: string;
    clientSecret: string;
    tin: string;
    brn?: string;
    idType: string;
    idValue: string;
    environment: 'SANDBOX' | 'PRODUCTION';
  }) => Promise<void>;
  onTest: () => Promise<{ connected: boolean; message: string }>;
  onDelete: () => Promise<void>;
  className?: string;
}

export function LhdnSettings({
  credential,
  onSave,
  onTest,
  onDelete,
  className,
}: LhdnSettingsProps) {
  // Form state
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tin, setTin] = useState('');
  const [brn, setBrn] = useState('');
  const [idType, setIdType] = useState<string>('BRN');
  const [idValue, setIdValue] = useState('');
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');

  // UI state
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load existing credential
  useEffect(() => {
    if (credential) {
      setClientId(credential.clientId);
      setTin(credential.tin);
      setBrn(credential.brn || '');
      setIdType(credential.idType);
      setIdValue(credential.idValue);
      setEnvironment(credential.environment);
    }
  }, [credential]);

  const handleSave = async () => {
    if (!clientId || (!credential && !clientSecret) || !tin || !idType || !idValue) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        clientId,
        clientSecret,
        tin,
        brn: brn || undefined,
        idType,
        idValue,
        environment,
      });
      setClientSecret(''); // Clear secret after save
      setTestResult(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        connected: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
      // Reset form
      setClientId('');
      setClientSecret('');
      setTin('');
      setBrn('');
      setIdType('BRN');
      setIdValue('');
      setEnvironment('SANDBOX');
    } finally {
      setIsDeleting(false);
    }
  };

  const isValid = clientId && (credential || clientSecret) && tin && idType && idValue;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">LHDN MyInvois API Settings</h3>
        </div>
        {credential && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                credential.environment === 'PRODUCTION'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              )}
            >
              {credential.environment}
            </span>
            {credential.isActive && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Active
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Client ID */}
        <div className="space-y-2">
          <Label htmlFor="clientId">
            Client ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter your LHDN Client ID"
          />
        </div>

        {/* Client Secret */}
        <div className="space-y-2">
          <Label htmlFor="clientSecret">
            Client Secret{' '}
            {!credential && <span className="text-destructive">*</span>}
          </Label>
          <div className="relative">
            <Input
              id="clientSecret"
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={
                credential ? 'Leave blank to keep existing' : 'Enter your Client Secret'
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* TIN */}
        <div className="space-y-2">
          <Label htmlFor="tin">
            Tax Identification Number (TIN) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tin"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
            placeholder="C1234567890"
          />
        </div>

        {/* BRN */}
        <div className="space-y-2">
          <Label htmlFor="brn">Business Registration Number (BRN)</Label>
          <Input
            id="brn"
            value={brn}
            onChange={(e) => setBrn(e.target.value)}
            placeholder="202001234567"
          />
        </div>

        {/* ID Type */}
        <div className="space-y-2">
          <Label htmlFor="idType">
            ID Type <span className="text-destructive">*</span>
          </Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRN">Business Registration Number</SelectItem>
              <SelectItem value="NRIC">NRIC</SelectItem>
              <SelectItem value="PASSPORT">Passport</SelectItem>
              <SelectItem value="ARMY">Army ID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Value */}
        <div className="space-y-2">
          <Label htmlFor="idValue">
            ID Value <span className="text-destructive">*</span>
          </Label>
          <Input
            id="idValue"
            value={idValue}
            onChange={(e) => setIdValue(e.target.value)}
            placeholder="Enter your ID number"
          />
        </div>

        {/* Environment */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={environment}
            onValueChange={(v) => setEnvironment(v as 'SANDBOX' | 'PRODUCTION')}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SANDBOX">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Sandbox (Testing)
                </span>
              </SelectItem>
              <SelectItem value="PRODUCTION">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Production (Live)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {environment === 'PRODUCTION'
              ? 'Live environment - e-Invoices will be submitted to LHDN'
              : 'Test environment - use for development and testing'}
          </p>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border p-4',
            testResult.connected
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          {testResult.connected ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {credential && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Credentials
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !credential}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            {credential ? 'Update Settings' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete LHDN Credentials
            </DialogTitle>
            <DialogDescription>
              This will remove your LHDN API credentials. You will not be able to
              submit e-Invoices until you configure new credentials.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
