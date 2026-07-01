import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: useAuthStore.getState().refreshToken,
        }, { withCredentials: true });

        const newAccessToken = data.data.accessToken;
        useAuthStore.getState().setTokens(newAccessToken, data.data.refreshToken);

        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  clienteId?: string;
  proveedorId?: string;
  empleadoId?: string;
  itinerarioId?: string;
  tipo?: string;
  reservaId?: string;
}

export const buildQueryString = (params: PaginationParams): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// Auth endpoints (unwrap Axios response)
export const authApi = {
  register: (data: { nombre: string; email: string; password: string; rol?: string }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; usuario: any }>>('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; usuario: any }>>('/auth/login', data).then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken }).then(r => r.data),
  logout: (refreshToken: string) =>
    api.post<ApiResponse<null>>('/auth/logout', { refreshToken }).then(r => r.data),
  verifyEmail: (token: string) =>
    api.get<ApiResponse<null>>(`/auth/verify-email?token=${token}`).then(r => r.data),
  resendVerification: (email: string) =>
    api.post<ApiResponse<null>>('/auth/resend-verification', { email }).then(r => r.data),
  get2faStatus: () => api.get<ApiResponse<{ enabled: boolean }>>('/auth/2fa/status').then(r => r.data),
  enable2fa: () => api.post<ApiResponse<{ secret: string }>>('/auth/2fa/enable').then(r => r.data),
  verify2fa: (code: string) => api.post<ApiResponse<null>>('/auth/2fa/verify', { code }).then(r => r.data),
  disable2fa: () => api.post<ApiResponse<null>>('/auth/2fa/disable').then(r => r.data),
};

// Generic CRUD helper (unwrap Axios response -> return ApiResponse directly)
export function createCrudApi<T, TCreate, TUpdate>(endpoint: string) {
  return {
    list: (params?: PaginationParams) =>
      api.get<ApiResponse<T[]>>(endpoint, { params }).then(r => r.data),
    get: (id: string) =>
      api.get<ApiResponse<T>>(`${endpoint}/${id}`).then(r => r.data),
    create: (data: TCreate) =>
      api.post<ApiResponse<T>>(endpoint, data).then(r => r.data),
    update: (id: string, data: TUpdate) =>
      api.put<ApiResponse<T>>(`${endpoint}/${id}`, data).then(r => r.data),
    delete: (id: string) =>
      api.delete<ApiResponse<null>>(`${endpoint}/${id}`).then(r => r.data),
  };
}

// Specific APIs
export const clientesApi = createCrudApi<any, any, any>('/clientes');
export const proveedoresApi = createCrudApi<any, any, any>('/proveedores');
export const itinerariosApi = createCrudApi<any, any, any>('/itinerarios');
export const reservasApi = createCrudApi<any, any, any>('/reservas');
export const transaccionesApi = createCrudApi<any, any, any>('/transacciones');
export const facturasApi = createCrudApi<any, any, any>('/facturas');