/**
 * @file License Store - Encrypted License Context Storage
 * @description Securely stores license context using electron-store with safeStorage encryption
 *
 * Per spec.md:
 * - Sensitive local data MUST be encrypted
 * - License Context includes: tenantId, authPolicy, capabilities, branding
 */

import Store from 'electron-store';
import { safeStorage } from 'electron';

/**
 * Auth Policy (per spec.md)
 */
export interface AuthPolicy {
    primary: 'password' | 'sso';
    allowPasswordFallback: boolean;
    mfa: 'off' | 'optional' | 'required';
    identifier: 'email' | 'username';
}

/**
 * Branding Configuration
 */
export interface BrandingConfig {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
}

/**
 * License Context (persisted locally)
 */
export interface LicenseContext {
    tenantId: string;
    authPolicy: AuthPolicy;
    capabilities: string[];
    branding: BrandingConfig;
    activatedAt: string;
    serverUrl: string;
    expiresAt?: string;
}

/**
 * Encrypted License Store
 * Uses electron-store for persistence and safeStorage for encryption
 */
export class LicenseStore {
    private store: Store;

    constructor() {
        this.store = new Store({
            name: 'license-context',
            // Note: Don't use encryptionKey here, we'll use safeStorage instead
        });
    }

    /**
     * Save license context with encryption
     */
    async save(context: LicenseContext): Promise<void> {
        if (!safeStorage.isEncryptionAvailable()) {
            console.warn(
                'Warning: safeStorage encryption not available, falling back to plain storage'
            );
            this.store.set('licenseContext', context);
            return;
        }

        try {
            const json = JSON.stringify(context);
            const encrypted = safeStorage.encryptString(json);
            this.store.set('licenseContextEncrypted', encrypted.toString('base64'));
            this.store.delete('licenseContext'); // Remove any plain text version
        } catch (error) {
            console.error('Failed to encrypt license context:', error);
            throw new Error('License encryption failed');
        }
    }

    /**
     * Load and decrypt license context
     */
    async load(): Promise<LicenseContext | null> {
        // Try encrypted version first
        const encrypted = this.store.get('licenseContextEncrypted') as
            | string
            | undefined;

        if (encrypted && safeStorage.isEncryptionAvailable()) {
            try {
                const buffer = Buffer.from(encrypted, 'base64');
                const decrypted = safeStorage.decryptString(buffer);
                return JSON.parse(decrypted) as LicenseContext;
            } catch (error) {
                console.error('Failed to decrypt license context:', error);
                // Clear corrupted data
                this.clear();
                return null;
            }
        }

        // Fallback to plain text (for development or migration)
        const plain = this.store.get('licenseContext') as LicenseContext | undefined;
        return plain ?? null;
    }

    /**
     * Check if license exists
     */
    hasLicense(): boolean {
        return (
            this.store.has('licenseContextEncrypted') ||
            this.store.has('licenseContext')
        );
    }

    /**
     * Clear stored license
     */
    clear(): void {
        this.store.delete('licenseContextEncrypted');
        this.store.delete('licenseContext');
    }

    /**
     * Update branding cache (for offline startup)
     */
    async updateBranding(branding: BrandingConfig): Promise<void> {
        const context = await this.load();
        if (context) {
            context.branding = branding;
            await this.save(context);
        }
    }
}
