import type { ApiResponse } from '@erp/shared-types';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Check if running in Electron environment
 * Per spec.md IPC Architecture: Use IPC in Electron, HTTP in browser
 */
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// ============ Axios-based HTTP Client (for browser/development) ============

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout, user } = useAuthStore.getState();

      // Dev mode bypass - don't logout/redirect for dev users
      if (import.meta.env.DEV && user?.id === 'dev-user-1') {
        console.warn('[Dev Mode] API returned 401, but skipping logout for dev bypass user');
        return Promise.reject(error);
      }

      if (refreshToken) {
        try {
          const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success && response.data.data) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            setTokens(newAccessToken, newRefreshToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============ Dual-Mode API Functions ============

/**
 * GET request - uses IPC in Electron, axios in browser
 */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  if (isElectron() && window.electronAPI) {
    // Convert axios config params to simple record
    const params = config?.params as Record<string, string | number | boolean> | undefined;
    return window.electronAPI.api.get<T>(url, params);
  }
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data;
}

/**
 * POST request - uses IPC in Electron, axios in browser
 */
export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.api.post<T>(url, data);
  }
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

/**
 * PATCH request - uses IPC in Electron, axios in browser
 */
export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.api.patch<T>(url, data);
  }
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

/**
 * DELETE request - uses IPC in Electron, axios in browser
 */
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.api.delete<T>(url);
  }
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data;
}

/**
 * PUT request - uses IPC in Electron, axios in browser
 */
export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.api.put<T>(url, data);
  }
  const response = await apiClient.put<ApiResponse<T>>(url, data, config);
  return response.data;
}

// ============ Auth Token Management for Electron ============

/**
 * Set auth tokens in Electron main process
 * Call this after successful login in Electron environment
 */
export async function setElectronTokens(accessToken: string, refreshToken?: string): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.api.setTokens({ accessToken, refreshToken });
  }
}

/**
 * Clear auth tokens from Electron main process
 * Call this on logout in Electron environment
 */
export async function clearElectronTokens(): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.api.clearTokens();
  }
}

/**
 * Set API base URL in Electron main process
 * Use this to configure the backend API endpoint
 */
export async function setElectronApiBaseUrl(url: string): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.api.setBaseUrl(url);
  }
}

