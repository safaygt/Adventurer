/**
 * Frontend Type Definitions
 * 
 * Backend'den gelen veri modellerinin TypeScript interface'leridir.
 * Bu interface'ler, API response'larında type-safety sağlar.
 * Backend ile frontend arasında veri uyumluluğu kontrol edilir.
 */

// ============================================================
// ENUM TANIMALARI (const as patterns)
// ============================================================

/**
 * BudgetType Enum
 * Rotalar için bütçe kategorilerini temsil eder.
 */
export const BudgetType = {
  BUDGET: 'BUDGET',
  MODERATE: 'MODERATE',
  LUXURY: 'LUXURY',
} as const;

export type BudgetType = typeof BudgetType[keyof typeof BudgetType];

/**
 * StopType Enum
 * Rotada ziyaret edilecek durakların türlerini temsil eder.
 */
export const StopType = {
  ACCOMMODATION: 'ACCOMMODATION',
  ATTRACTION: 'ATTRACTION',
  RESTAURANT: 'RESTAURANT',
  ACTIVITY: 'ACTIVITY',
  TRANSPORT: 'TRANSPORT',
  OTHER: 'OTHER',
} as const;

export type StopType = typeof StopType[keyof typeof StopType];

// ============================================================
// TYPE TANIMLARI (interface yerine type)
// ============================================================

/**
 * Stop Type
 * 
 * Bir rota içerisinde ziyaret edilecek durağı temsil eder.
 * Her durak sırayla düzenlenmiştir ve belirli bir güne aittir.
 */
export type IStop = {
  id: string;
  routeId: string;
  
  // Durak sırası (1'den başlar)
  order: number;
  
  // Durak türü (Konaklama, Atraksiyon, Restoran, vb.)
  type: StopType;
  
  // Durak adı ve açıklama
  name: string;
  description: string | null;
  
  // Konum bilgileri
  location: string;
  latitude: number | null;
  longitude: number | null;
  
  // Süre ve maliyet
  duration: number | null; // dakika cinsinden
  estimatedCost: number | null;
  
  // Ek notlar
  notes: string | null;
  
  // Hangi güne ait (1, 2, 3, vb.)
  dayNumber: number;
  
  // Zaman damgaları
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Route Type
 * 
 * Bir seyahat rotasını temsil eder.
 * Her rota bir kullanıcıya ait ve birden fazla duraktan oluşur.
 */
export type IRoute = {
  id: string;
  
  // Kullanıcı bilgisi (null = misafir rotası)
  userId: string | null;
  
  // Rota temel bilgileri
  title: string;
  description: string | null;
  city: string;
  
  // Tarih aralığı
  startDate: Date;
  endDate: Date;
  
  // Bütçe kategorisi
  budgetType: BudgetType;
  
  // Rotaya ait durağlar (isteğe bağlı)
  stops?: IStop[];
  
  // Zaman damgaları
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================
// API REQUEST/RESPONSE TIPLERI
// ============================================================

/**
 * Route oluşturma isteği
 * Frontend'den backend'e gönderilen veri tipi
 */
export type CreateRouteRequest = {
  title: string;
  description?: string;
  city: string;
  startDate: Date | string;
  endDate: Date | string;
  budgetType: BudgetType;
  userId?: string;
};

/**
 * Rota adı güncelleme isteği
 */
export type UpdateRouteNameRequest = {
  title: string;
};

/**
 * API Error Response
 * Backend hata döndüğünde bu formatı kullanır
 */
export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

/**
 * API Response Wrapper
 * Tüm API response'ları bu yapıyı takip eder (opsiyonel)
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

// ============================================================
// UTILITY CONSTANTS (Label ve Renk Eşleştirmeleri)
// ============================================================

/**
 * BudgetType için label ve icon eşleştirmesi
 * UI'de gösterim için kullanılır
 */
export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  [BudgetType.BUDGET]: 'Bütçe Dostu',
  [BudgetType.MODERATE]: 'Orta Seviye',
  [BudgetType.LUXURY]: 'Lüks',
};

export const BUDGET_TYPE_COLORS: Record<BudgetType, string> = {
  [BudgetType.BUDGET]: 'bg-blue-100 text-blue-800',
  [BudgetType.MODERATE]: 'bg-yellow-100 text-yellow-800',
  [BudgetType.LUXURY]: 'bg-purple-100 text-purple-800',
};

/**
 * StopType için label ve icon eşleştirmesi
 * UI'de gösterim için kullanılır
 */
export const STOP_TYPE_LABELS: Record<StopType, string> = {
  [StopType.ACCOMMODATION]: 'Konaklama',
  [StopType.ATTRACTION]: 'Atraksiyon',
  [StopType.RESTAURANT]: 'Restoran',
  [StopType.ACTIVITY]: 'Aktivite',
  [StopType.TRANSPORT]: 'Ulaştırma',
  [StopType.OTHER]: 'Diğer',
};

export const STOP_TYPE_ICONS: Record<StopType, string> = {
  [StopType.ACCOMMODATION]: '🏨',
  [StopType.ATTRACTION]: '🎭',
  [StopType.RESTAURANT]: '🍽️',
  [StopType.ACTIVITY]: '🎪',
  [StopType.TRANSPORT]: '🚗',
  [StopType.OTHER]: '📍',
};
