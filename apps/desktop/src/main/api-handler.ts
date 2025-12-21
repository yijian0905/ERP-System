/**
 * @file API Handler - IPC-based API Bridge
 * @description Handles all API calls from renderer via IPC
 *
 * Per spec.md IPC Architecture:
 * - All API calls flow through: renderer → preload → main → HTTP → backend
 * - Token management is centralized in main process
 * - Zero port exposure to renderer
 */

import { ipcMain, net } from 'electron';

// Configuration - Read from environment variable for production deployment
const DEFAULT_API_URL = process.env.ERP_API_URL || 'http://localhost:3000';

// Auth token storage (secure, not exposed to renderer)
let authToken: string | null = null;
let refreshToken: string | null = null;
let apiBaseUrl: string = DEFAULT_API_URL;

/**
 * API Response type matching @erp/shared-types
 */
interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

/**
 * Make HTTP request using Electron's net module
 * This runs in main process and doesn't expose ports to renderer
 */
async function makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>
): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
        // Build full URL with query params
        let fullUrl = `${apiBaseUrl}${url}`;
        if (params && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            }
            fullUrl += `?${searchParams.toString()}`;
        }

        const request = net.request({
            method,
            url: fullUrl,
        });

        // Set headers
        request.setHeader('Content-Type', 'application/json');
        if (authToken) {
            request.setHeader('Authorization', `Bearer ${authToken}`);
        }

        let responseData = '';

        request.on('response', (response) => {
            response.on('data', (chunk) => {
                responseData += chunk.toString();
            });

            response.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData) as ApiResponse<T>;

                    // Handle 401 - token expired
                    if (response.statusCode === 401) {
                        // Try to refresh token
                        handleTokenRefresh()
                            .then(() => {
                                // Retry original request with new token
                                makeRequest<T>(method, url, data, params)
                                    .then(resolve)
                                    .catch(reject);
                            })
                            .catch(() => {
                                // Refresh failed, clear tokens
                                authToken = null;
                                refreshToken = null;
                                resolve({
                                    success: false,
                                    error: {
                                        code: 'AUTH_EXPIRED',
                                        message: 'Session expired. Please login again.',
                                    },
                                });
                            });
                        return;
                    }

                    resolve(parsed);
                } catch {
                    resolve({
                        success: false,
                        error: {
                            code: 'PARSE_ERROR',
                            message: 'Failed to parse API response',
                        },
                    });
                }
            });

            response.on('error', (error: Error) => {
                reject(error);
            });
        });

        request.on('error', (error) => {
            resolve({
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error.message || 'Network request failed',
                },
            });
        });

        // Send body for POST/PUT/PATCH
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            request.write(JSON.stringify(data));
        }

        request.end();
    });
}

/**
 * Handle token refresh
 */
async function handleTokenRefresh(): Promise<void> {
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await makeRequest<{ accessToken: string; refreshToken: string }>(
        'POST',
        '/auth/refresh',
        { refreshToken }
    );

    if (response.success && response.data) {
        authToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;
    } else {
        throw new Error('Token refresh failed');
    }
}

/**
 * Setup all API IPC handlers
 */
export function setupApiHandlers(): void {
    // ============ Auth Token Management ============

    /**
     * Set auth tokens (called after login)
     */
    ipcMain.handle(
        'api:setTokens',
        (_event, tokens: { accessToken: string; refreshToken?: string }) => {
            authToken = tokens.accessToken;
            if (tokens.refreshToken) {
                refreshToken = tokens.refreshToken;
            }
            return { success: true };
        }
    );

    /**
     * Clear auth tokens (called on logout)
     */
    ipcMain.handle('api:clearTokens', () => {
        authToken = null;
        refreshToken = null;
        return { success: true };
    });

    /**
     * Check if authenticated
     */
    ipcMain.handle('api:isAuthenticated', () => {
        return authToken !== null;
    });

    /**
     * Set API base URL
     */
    ipcMain.handle('api:setBaseUrl', (_event, url: string) => {
        apiBaseUrl = url;
        return { success: true };
    });

    /**
     * Get current API base URL
     */
    ipcMain.handle('api:getBaseUrl', () => {
        return apiBaseUrl;
    });

    // ============ API Request Handlers ============

    /**
     * GET request
     */
    ipcMain.handle(
        'api:get',
        async <T>(_event: Electron.IpcMainInvokeEvent, url: string, params?: Record<string, string | number | boolean>) => {
            return makeRequest<T>('GET', url, undefined, params);
        }
    );

    /**
     * POST request
     */
    ipcMain.handle(
        'api:post',
        async <T>(_event: Electron.IpcMainInvokeEvent, url: string, data?: unknown) => {
            return makeRequest<T>('POST', url, data);
        }
    );

    /**
     * PUT request
     */
    ipcMain.handle(
        'api:put',
        async <T>(_event: Electron.IpcMainInvokeEvent, url: string, data?: unknown) => {
            return makeRequest<T>('PUT', url, data);
        }
    );

    /**
     * PATCH request
     */
    ipcMain.handle(
        'api:patch',
        async <T>(_event: Electron.IpcMainInvokeEvent, url: string, data?: unknown) => {
            return makeRequest<T>('PATCH', url, data);
        }
    );

    /**
     * DELETE request
     */
    ipcMain.handle('api:delete', async <T>(_event: Electron.IpcMainInvokeEvent, url: string) => {
        return makeRequest<T>('DELETE', url);
    });
}
