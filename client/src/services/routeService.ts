/**
 * Route Service Layer
 * 
 * Backend endpoint'lerine istek atacak merkezi servis fonksiyonlarını içerir.
 * Tüm HTTP işlemleri burada yönetilir.
 * 
 * Kullanılan Teknoloji: Axios (HTTP Client)
 * Base URL: http://localhost:3000/api (veya environment variable'dan okunur)
 * 
 * Avantajları:
 * - Merkezi yönetim: Tüm API çağrıları bir yerden yönetilir
 * - Type-Safe: TypeScript interface'leri ile strict typing
 * - Error Handling: Merkezi hata yönetimi
 * - Interceptor'lar: Authorization headers vb. otomatik olarak eklenir
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  IRoute,
  IStop,
  CreateRouteRequest,
  UpdateRouteNameRequest,
  ApiError,
} from '../types/index.js';

/**
 * Axios instance'ı oluştur
 * Backend server'ının çalıştığı URL'yi kullan
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Request timeout'ı 30 saniye olarak ayarla
  timeout: 30000,
});

/**
 * Request Interceptor
 * Her request'ten önce çalışır
 * Authorization token'ı header'a ekle (gelecek için hazır)
 */
apiClient.interceptors.request.use(
  (config) => {
    // Gelecekte auth token'ı buradan ekleriz
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Her response'dan sonra çalışır
 * Hataları merkezi şekilde işle
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Hata mesajını düzenle
    const message = error.response?.data?.message || error.message || 'Bir hata oluştu';
    console.error('API Error:', message);
    return Promise.reject({
      message,
      status: error.response?.status,
      code: error.code,
    } as ApiError);
  }
);

// ============================================================
// API SERVICE FUNCTIONS
// ============================================================

/**
 * Yeni bir rota oluştur
 * 
 * @param routeData - Rota oluşturma bilgileri
 * @returns Oluşturulan rota
 * 
 * @example
 * const newRoute = await routeService.createRoute({
 *   title: "İstanbul Turu",
 *   city: "İstanbul",
 *   startDate: "2026-05-20",
 *   endDate: "2026-05-27",
 *   budgetType: BudgetType.MODERATE,
 * });
 */
export const createRoute = async (routeData: CreateRouteRequest): Promise<IRoute> => {
  try {
    const response = await apiClient.post<IRoute>('/routes/generate', routeData);
    return response.data;
  } catch (error) {
    console.error('Error creating route:', error);
    throw error;
  }
};

/**
 * Kullanıcının tüm rotalarını getir
 * 
 * @param userId - Kullanıcı ID'si
 * @returns Kullanıcının rotalarının listesi
 * 
 * @example
 * const routes = await routeService.getUserRoutes('user-123');
 */
export const getUserRoutes = async (userId: string): Promise<IRoute[]> => {
  try {
    const response = await apiClient.get<IRoute[]>(
      `/routes/user/${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user routes:', error);
    throw error;
  }
};

/**
 * Belirli bir rotanın detaylarını getir (stops dahil)
 * 
 * @param routeId - Rota ID'si
 * @returns Rota bilgileri ve onun duraklarının listesi
 * 
 * @example
 * const routeDetails = await routeService.getRouteDetails('route-456');
 */
export const getRouteDetails = async (routeId: string): Promise<IRoute & { stops: IStop[] }> => {
  try {
    const response = await apiClient.get<IRoute & { stops: IStop[] }>(
      `/routes/${routeId}`
    );
    // Tarihleri Date objesine dönüştür
    return {
      ...response.data,
      startDate: new Date(response.data.startDate),
      endDate: new Date(response.data.endDate),
    };
  } catch (error) {
    console.error('Error fetching route details:', error);
    throw error;
  }
};

/**
 * Bir rotayı sil
 * 
 * İlişkili tüm Stop'lar da silinir (Cascade Delete)
 * 
 * @param routeId - Silinecek rota ID'si
 * @returns Silinen rota bilgileri
 * 
 * @example
 * await routeService.deleteRoute('route-456');
 */
export const deleteRoute = async (routeId: string): Promise<IRoute> => {
  try {
    const response = await apiClient.delete<IRoute>(`/routes/${routeId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting route:', error);
    throw error;
  }
};

/**
 * Bir rotanın adını (title) güncelle
 * 
 * Sadece title alanı güncellenir
 * 
 * @param routeId - Güncellenecek rota ID'si
 * @param updateData - Güncellenecek veriler
 * @returns Güncellenmiş rota bilgileri
 * 
 * @example
 * const updated = await routeService.renameRoute('route-456', {
 *   title: "Yeni Rota Adı"
 * });
 */
export const renameRoute = async (
  routeId: string,
  updateData: UpdateRouteNameRequest
): Promise<IRoute> => {
  try {
    const response = await apiClient.patch<IRoute>(
      `/routes/${routeId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating route name:', error);
    throw error;
  }
};

/**
 * Belirli bir durağın detaylarını getir
 * 
 * @param stopId - Durak ID'si
 * @returns Durak bilgileri
 * 
 * @example
 * const stop = await routeService.getStopDetails('stop-789');
 */
export const getStopDetails = async (stopId: string): Promise<IStop> => {
  try {
    const response = await apiClient.get<IStop>(`/stops/${stopId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stop details:', error);
    throw error;
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Hata mesajını düzenle ve göster
 * 
 * @param error - Hata objesi
 * @returns Kullanıcı dostu hata mesajı
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as ApiError).message;
  }
  return 'Bilinmeyen bir hata oluştu';
};

/**
 * API Base URL'sini döndür (debug için)
 */
export const getApiBaseUrl = (): string => API_BASE_URL;

// Default export
export default {
  createRoute,
  getUserRoutes,
  getRouteDetails,
  deleteRoute,
  renameRoute,
  getStopDetails,
  getErrorMessage,
  getApiBaseUrl,
};
