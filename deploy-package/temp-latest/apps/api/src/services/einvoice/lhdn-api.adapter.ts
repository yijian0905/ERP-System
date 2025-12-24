/**
 * LHDN MyInvois API Adapter
 * Handles authentication, token management, and API calls to LHDN
 */

import crypto from 'crypto';
import type {
  LhdnLoginResponse,
  LhdnSubmitDocumentRequest,
  LhdnSubmitDocumentResponse,
  LhdnGetSubmissionResponse,
  LhdnDocumentDetails,
  LhdnCancelDocumentRequest,
  LhdnCancelDocumentResponse,
  LhdnSearchDocumentsRequest,
  LhdnSearchDocumentsResponse,
  LhdnEnvironment,
} from '@erp/shared-types';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

// LHDN API Base URLs
const LHDN_URLS = {
  SANDBOX: {
    identity: 'https://preprod-api.myinvois.hasil.gov.my',
    api: 'https://preprod-api.myinvois.hasil.gov.my',
  },
  PRODUCTION: {
    identity: 'https://api.myinvois.hasil.gov.my',
    api: 'https://api.myinvois.hasil.gov.my',
  },
} as const;

// Token expiry buffer (refresh 5 minutes before expiry)
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

interface LhdnApiConfig {
  tenantId: string;
  environment: LhdnEnvironment;
  clientId: string;
  clientSecret: string;
  tin: string;
}

/**
 * LHDN API Adapter class
 * Manages API calls to LHDN MyInvois system with automatic token refresh
 */
export class LhdnApiAdapter {
  private config: LhdnApiConfig;
  private baseUrls: { identity: string; api: string };

  constructor(config: LhdnApiConfig) {
    this.config = config;
    this.baseUrls = LHDN_URLS[config.environment];
  }

  /**
   * Create adapter from tenant credentials
   */
  static async fromTenant(tenantId: string): Promise<LhdnApiAdapter> {
    const credential = await prisma.lhdnCredential.findUnique({
      where: { tenantId },
    });

    if (!credential) {
      throw new Error('LHDN credentials not configured for this tenant');
    }

    if (!credential.isActive) {
      throw new Error('LHDN credentials are disabled');
    }

    // Decrypt client secret
    const clientSecret = decryptSecret(credential.clientSecretEncrypted);

    return new LhdnApiAdapter({
      tenantId,
      environment: credential.environment as LhdnEnvironment,
      clientId: credential.clientId,
      clientSecret,
      tin: credential.tin,
    });
  }

  /**
   * Get valid access token, refreshing if needed
   */
  async getAccessToken(): Promise<string> {
    // Check for existing valid token
    const existingToken = await prisma.lhdnToken.findUnique({
      where: { tenantId: this.config.tenantId },
    });

    if (existingToken) {
      const expiresAt = new Date(existingToken.expiresAt);
      const now = new Date();

      // Token is still valid (with buffer)
      if (expiresAt.getTime() - now.getTime() > TOKEN_EXPIRY_BUFFER_MS) {
        return existingToken.accessToken;
      }
    }

    // Need to get new token
    return this.authenticate();
  }

  /**
   * Authenticate with LHDN and get access token
   */
  private async authenticate(): Promise<string> {
    const url = `${this.baseUrls.identity}/connect/token`;

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
      scope: 'InvoicingAPI',
    });

    logger.info({
      type: 'lhdn_auth',
      tenantId: this.config.tenantId,
      message: 'Authenticating with LHDN',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error({
        type: 'lhdn_auth_error',
        tenantId: this.config.tenantId,
        status: response.status,
        error: errorData,
      });
      throw new Error(`LHDN authentication failed: ${errorData.error_description || response.statusText}`);
    }

    const data: LhdnLoginResponse = await response.json();

    // Store token in database
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.lhdnToken.upsert({
      where: { tenantId: this.config.tenantId },
      create: {
        tenantId: this.config.tenantId,
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresAt,
        scope: data.scope,
      },
      update: {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresAt,
        scope: data.scope,
      },
    });

    logger.info({
      type: 'lhdn_auth_success',
      tenantId: this.config.tenantId,
      expiresIn: data.expires_in,
    });

    return data.access_token;
  }

  /**
   * Submit documents to LHDN
   */
  async submitDocuments(request: LhdnSubmitDocumentRequest): Promise<LhdnSubmitDocumentResponse> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documentsubmissions`;

    logger.info({
      type: 'lhdn_submit',
      tenantId: this.config.tenantId,
      documentCount: request.documents.length,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok && response.status !== 202) {
      logger.error({
        type: 'lhdn_submit_error',
        tenantId: this.config.tenantId,
        status: response.status,
        error: data,
      });
      throw new Error(`Document submission failed: ${data.error?.message || response.statusText}`);
    }

    logger.info({
      type: 'lhdn_submit_success',
      tenantId: this.config.tenantId,
      submissionUid: data.submissionUid,
      acceptedCount: data.acceptedDocuments?.length || 0,
      rejectedCount: data.rejectedDocuments?.length || 0,
    });

    return data;
  }

  /**
   * Get submission status
   */
  async getSubmission(submissionUid: string, pageNo = 1, pageSize = 100): Promise<LhdnGetSubmissionResponse> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documentsubmissions/${submissionUid}?pageNo=${pageNo}&pageSize=${pageSize}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Get submission failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get raw document
   */
  async getDocument(uuid: string): Promise<{ uuid: string; document: string }> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documents/${uuid}/raw`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Get document failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get document details with validation results
   */
  async getDocumentDetails(uuid: string): Promise<LhdnDocumentDetails> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documents/${uuid}/details`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Get document details failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel a document
   */
  async cancelDocument(uuid: string, reason: string): Promise<LhdnCancelDocumentResponse> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documents/state/${uuid}/state`;

    const request: LhdnCancelDocumentRequest = {
      status: 'cancelled',
      reason,
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Cancel document failed: ${errorData.error?.message || response.statusText}`);
    }

    logger.info({
      type: 'lhdn_cancel_success',
      tenantId: this.config.tenantId,
      uuid,
    });

    return response.json();
  }

  /**
   * Search documents
   */
  async searchDocuments(params: LhdnSearchDocumentsRequest): Promise<LhdnSearchDocumentsResponse> {
    const token = await this.getAccessToken();
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const url = `${this.baseUrls.api}/api/v1.0/documents/search?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Search documents failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Validate taxpayer TIN
   */
  async validateTin(tin: string, idType?: string, idValue?: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    let url = `${this.baseUrls.api}/api/v1.0/taxpayer/validate/${tin}`;
    if (idType && idValue) {
      url += `?idType=${idType}&idValue=${idValue}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  }

  /**
   * Get recent documents (last 31 days)
   */
  async getRecentDocuments(
    direction: 'Sent' | 'Received' = 'Sent',
    pageNo = 1,
    pageSize = 100
  ): Promise<LhdnSearchDocumentsResponse> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrls.api}/api/v1.0/documents/recent?invoiceDirection=${direction}&pageNo=${pageNo}&pageSize=${pageSize}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Get recent documents failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Encrypt client secret for storage
 */
export function encryptSecret(secret: string): string {
  const key = process.env.LHDN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('LHDN_ENCRYPTION_KEY not configured');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt client secret from storage
 */
export function decryptSecret(encryptedSecret: string): string {
  const key = process.env.LHDN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('LHDN_ENCRYPTION_KEY not configured');
  }

  const [ivHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Generate SHA-256 hash of document
 */
export function generateDocumentHash(document: string): string {
  return crypto.createHash('sha256').update(document).digest('hex');
}

/**
 * Encode document to Base64
 */
export function encodeDocumentBase64(document: string): string {
  return Buffer.from(document).toString('base64');
}
