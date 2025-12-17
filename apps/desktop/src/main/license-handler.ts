/**
 * @file License Handler - IPC handlers for license operations
 * @description Handles license activation, validation, and retrieval via IPC
 *
 * Per spec.md:
 * - License activation: POST /license/activate
 * - Returns: tenantId, authPolicy, capabilities, branding
 */

import { ipcMain } from 'electron';
import { LicenseStore, LicenseContext, AuthPolicy, BrandingConfig } from './license-store';

/**
 * License Activation Response from server
 */
interface LicenseActivationResponse {
    success: boolean;
    tenantId: string;
    authPolicy: AuthPolicy;
    capabilities: string[];
    branding: BrandingConfig;
    expiresAt?: string;
    error?: string;
}

/**
 * Setup license-related IPC handlers
 */
export function setupLicenseHandlers(licenseStore: LicenseStore): void {
    // Get stored license context
    ipcMain.handle('license:get', async () => {
        try {
            const context = await licenseStore.load();
            return { success: true, context };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    // Check if license exists
    ipcMain.handle('license:exists', () => {
        return licenseStore.hasLicense();
    });

    // Activate license with server
    ipcMain.handle(
        'license:activate',
        async (
            _event,
            licenseKey: string,
            serverUrl: string = 'https://api.your-erp.com'
        ) => {
            try {
                // Call license activation API
                const response = await fetch(`${serverUrl}/api/v1/license/activate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ licenseKey }),
                });

                if (!response.ok) {
                    const error = await response.text();
                    return { success: false, error: `Activation failed: ${error}` };
                }

                const data: LicenseActivationResponse = await response.json();

                if (!data.success) {
                    return { success: false, error: data.error || 'Activation failed' };
                }

                // Store license context
                const context: LicenseContext = {
                    tenantId: data.tenantId,
                    authPolicy: data.authPolicy,
                    capabilities: data.capabilities,
                    branding: data.branding,
                    activatedAt: new Date().toISOString(),
                    serverUrl,
                    expiresAt: data.expiresAt,
                };

                await licenseStore.save(context);

                return { success: true, context };
            } catch (error) {
                console.error('License activation error:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        }
    );

    // Validate license with server (refresh capabilities & branding)
    ipcMain.handle('license:validate', async () => {
        try {
            const context = await licenseStore.load();
            if (!context) {
                return { success: false, error: 'No license found' };
            }

            const response = await fetch(
                `${context.serverUrl}/api/v1/license/validate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-ID': context.tenantId,
                    },
                }
            );

            if (!response.ok) {
                // License might be invalid or expired
                return { success: false, error: 'License validation failed' };
            }

            const data: LicenseActivationResponse = await response.json();

            // Update stored context with latest data
            const updatedContext: LicenseContext = {
                ...context,
                authPolicy: data.authPolicy,
                capabilities: data.capabilities,
                branding: data.branding,
                expiresAt: data.expiresAt,
            };

            await licenseStore.save(updatedContext);

            return { success: true, context: updatedContext };
        } catch (error) {
            console.error('License validation error:', error);
            // Return cached context if server is unreachable
            const context = await licenseStore.load();
            if (context) {
                return { success: true, context, cached: true };
            }
            return { success: false, error: 'Validation failed' };
        }
    });

    // Clear license (for reset/logout)
    ipcMain.handle('license:clear', () => {
        licenseStore.clear();
        return { success: true };
    });

    // Get branding (for immediate desktop startup)
    ipcMain.handle('branding:get', async () => {
        try {
            const context = await licenseStore.load();
            return context?.branding ?? null;
        } catch {
            return null;
        }
    });
}
