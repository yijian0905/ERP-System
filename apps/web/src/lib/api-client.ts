import type { ApiResponse } from '@erp/shared-types';
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    console.log('[API-CLIENT] Request interceptor:', { //debug log
      method: config.method?.toUpperCase(), //debug log
      url: config.url, //debug log
      baseURL: config.baseURL, //debug log
      fullURL: `${config.baseURL || ''}${config.url || ''}`, //debug log
      hasData: !!config.data, //debug log
      data: config.data, //debug log
    }); //debug log

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API-CLIENT] Added auth token to request'); //debug log
    } else { //debug log
      console.log('[API-CLIENT] No access token available'); //debug log
    }
    return config;
  },
  /*(error) => Promise.reject(error) */ //after delete debug log, bring back this line
  (error) => { //debug log
    console.error('[API-CLIENT] Request interceptor error:', error); //debug log
    return Promise.reject(error); //debug log
  } //debug log
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  /*(response) => response,*/ //after delete debug log, bring back this line
  (response) => { //debug log
    console.log('[API-CLIENT] Response received:', { //debug log
      status: response.status, //debug log
      statusText: response.statusText, //debug log
      url: response.config.url,
      hasData: !!response.data, //debug log
      dataPreview: response.data ? JSON.stringify(response.data).substring(0, 200) : null, //debug log
    }); //debug log
    return response; //debug log
  }, //debug log
  async (error: AxiosError<ApiResponse>) => {
    console.error('[API-CLIENT] Response error:', { //debug log 
      status: error.response?.status, //debug log
      statusText: error.response?.statusText, //debug log
      url: error.config?.url, //debug log
      errorMessage: error.message, //debug log
      responseData: error.response?.data, //debug log
      isNetworkError: error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK', //debug log
      errorCode: error.code, //debug log
    }); //debug log

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API-CLIENT] Attempting token refresh...'); //debug log
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            `${API_BASE_URL}/v1/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success && response.data.data) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            setTokens(newAccessToken, newRefreshToken);
            console.log('[API-CLIENT] Token refresh successful, retrying original request'); //debug log

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch /**/(refreshError)/**/ {
          console.error('[API-CLIENT] Token refresh failed:', refreshError); //debug log
          logout();
          window.location.href = '/login';
        }
      } else {
        console.log('[API-CLIENT] No refresh token available, redirecting to login'); //debug log
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for API calls
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  console.log(`[API-CLIENT] GET ${url}`); //debug log
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data;
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  console.log(`[API-CLIENT] POST ${url}`, { hasData: !!data }); //debug log
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  console.log(`[API-CLIENT] PATCH ${url}`, { hasData: !!data }); //debug log
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  console.log(`[API-CLIENT] DELETE ${url}`); //debug log
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data;
}

