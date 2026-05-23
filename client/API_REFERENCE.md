/**
 * API Service Referans Dokümantasyonu
 * 
 * Bu dosya, routeService'in tüm fonksiyonlarının detaylı dokumentasyonunu içerir.
 */

// ============================================================
// 1. ROTA İŞLEMLERİ
// ============================================================

/**
 * ✅ Yeni Rota Oluştur
 * 
 * POST /api/routes/generate
 * 
 * Açıklama: AI kullanarak yeni bir rota oluşturur
 * 
 * Request Body:
 * {
 *   title: string;        // Rota adı (Ör: "İstanbul Turu")
 *   description?: string; // Opsiyonel açıklama
 *   city: string;         // Şehir adı (Ör: "İstanbul")
 *   startDate: Date|string; // Başlama tarihi (ISO format)
 *   endDate: Date|string;   // Bitiş tarihi (ISO format)
 *   budgetType: "BUDGET" | "MODERATE" | "LUXURY";
 *   userId?: string;      // Opsiyonel kullanıcı ID
 * }
 * 
 * Response (201):
 * {
 *   id: string;
 *   userId: string | null;
 *   title: string;
 *   description: string | null;
 *   city: string;
 *   startDate: Date;
 *   endDate: Date;
 *   budgetType: "BUDGET" | "MODERATE" | "LUXURY";
 *   stops?: IStop[]; // AI tarafından oluşturulan durağlar
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * 
 * Kullanım Örneği:
 * ──────────────
 * const newRoute = await routeService.createRoute({
 *   title: "Türkiye Gezi Rotası",
 *   city: "İstanbul",
 *   startDate: "2026-05-20",
 *   endDate: "2026-05-27",
 *   budgetType: "MODERATE"
 * });
 */
export async function createRoute(routeData: CreateRouteRequest): Promise<IRoute>;

// ────────────────────────────────────────────────────────

/**
 * ✅ Kullanıcının Tüm Rotalarını Getir
 * 
 * GET /api/routes/user/:userId
 * 
 * Açıklama: Belirli bir kullanıcının tüm rotalarını getir
 * 
 * URL Parameters:
 *   userId: string (gerekli) // Kullanıcı ID'si
 * 
 * Response (200):
 * [
 *   {
 *     id: string;
 *     userId: string | null;
 *     title: string;
 *     description: string | null;
 *     city: string;
 *     startDate: Date;
 *     endDate: Date;
 *     budgetType: "BUDGET" | "MODERATE" | "LUXURY";
 *     createdAt: Date;
 *     updatedAt: Date;
 *   },
 *   // ... daha fazla rota
 * ]
 * 
 * Kullanım Örneği:
 * ──────────────
 * const userRoutes = await routeService.getUserRoutes('user-123');
 * console.log(userRoutes); // Array<IRoute>
 */
export async function getUserRoutes(userId: string): Promise<IRoute[]>;

// ────────────────────────────────────────────────────────

/**
 * ✅ Rota Detaylarını Getir (Stops Dahil)
 * 
 * GET /api/routes/:routeId
 * 
 * Açıklama: Belirli bir rotanın tüm detaylarını ve duraklarını getir
 * 
 * URL Parameters:
 *   routeId: string (gerekli) // Rota ID'si
 * 
 * Response (200):
 * {
 *   id: string;
 *   userId: string | null;
 *   title: string;
 *   description: string | null;
 *   city: string;
 *   startDate: Date;
 *   endDate: Date;
 *   budgetType: "BUDGET" | "MODERATE" | "LUXURY";
 *   stops: [
 *     {
 *       id: string;
 *       routeId: string;
 *       order: number;
 *       type: "ACCOMMODATION" | "ATTRACTION" | "RESTAURANT" | ...;
 *       name: string;
 *       description: string | null;
 *       location: string;
 *       latitude: number | null;
 *       longitude: number | null;
 *       duration: number | null;
 *       estimatedCost: number | null;
 *       notes: string | null;
 *       dayNumber: number;
 *       createdAt: Date;
 *       updatedAt: Date;
 *     },
 *     // ... daha fazla durak
 *   ];
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * 
 * Kullanım Örneği:
 * ──────────────
 * const routeDetails = await routeService.getRouteDetails('route-456');
 * console.log(routeDetails.stops); // Array<IStop>
 */
export async function getRouteDetails(routeId: string): Promise<IRoute & { stops: IStop[] }>;

// ────────────────────────────────────────────────────────

/**
 * ✅ Rotayı Sil
 * 
 * DELETE /api/routes/:routeId
 * 
 * Açıklama: Belirli bir rotayı sil (ilişkili tüm durağlar da silinir - CASCADE DELETE)
 * 
 * URL Parameters:
 *   routeId: string (gerekli) // Silinecek rota ID'si
 * 
 * Response (200):
 * {
 *   id: string;
 *   title: string;
 *   // ... rota bilgileri
 *   message: "Route successfully deleted"
 * }
 * 
 * Error Response (404):
 * {
 *   message: "Route not found"
 * }
 * 
 * Kullanım Örneği:
 * ──────────────
 * const deletedRoute = await routeService.deleteRoute('route-456');
 * console.log(deletedRoute.title); // "İstanbul Turu"
 */
export async function deleteRoute(routeId: string): Promise<IRoute>;

// ────────────────────────────────────────────────────────

/**
 * ✅ Rota Adını Güncelle
 * 
 * PATCH /api/routes/:routeId
 * 
 * Açıklama: Belirli bir rotanın adını (title) güncelle
 * 
 * URL Parameters:
 *   routeId: string (gerekli) // Güncellenecek rota ID'si
 * 
 * Request Body:
 * {
 *   title: string; // Yeni rota adı
 * }
 * 
 * Response (200):
 * {
 *   id: string;
 *   title: string; // Güncellenmiş ad
 *   // ... diğer rota bilgileri
 * }
 * 
 * Error Response (404):
 * {
 *   message: "Route not found"
 * }
 * 
 * Kullanım Örneği:
 * ──────────────
 * const updated = await routeService.renameRoute('route-456', {
 *   title: "Yeni Rota Adı"
 * });
 * console.log(updated.title); // "Yeni Rota Adı"
 */
export async function renameRoute(
  routeId: string,
  updateData: UpdateRouteNameRequest
): Promise<IRoute>;

// ============================================================
// 2. DURAK İŞLEMLERİ
// ============================================================

/**
 * ✅ Durak Detaylarını Getir
 * 
 * GET /api/stops/:stopId
 * 
 * Açıklama: Belirli bir durağın detaylarını getir
 * 
 * URL Parameters:
 *   stopId: string (gerekli) // Durak ID'si
 * 
 * Response (200):
 * {
 *   id: string;
 *   routeId: string;
 *   order: number;
 *   type: "ACCOMMODATION" | "ATTRACTION" | "RESTAURANT" | ...;
 *   name: string;
 *   description: string | null;
 *   location: string;
 *   latitude: number | null;
 *   longitude: number | null;
 *   duration: number | null;
 *   estimatedCost: number | null;
 *   notes: string | null;
 *   dayNumber: number;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * 
 * Kullanım Örneği:
 * ──────────────
 * const stop = await routeService.getStopDetails('stop-789');
 * console.log(stop.name); // "Topkapı Sarayı"
 */
export async function getStopDetails(stopId: string): Promise<IStop>;

// ============================================================
// 3. UTILITY FONKSİYONLARI
// ============================================================

/**
 * ✅ Hata Mesajını Al (Kullanıcı Dostu)
 * 
 * Açıklama: Hata objesini string mesaja dönüştür
 * 
 * Parameter:
 *   error: unknown // Herhangi bir hata tipi
 * 
 * Returns: string // Hata mesajı
 * 
 * Kullanım Örneği:
 * ──────────────
 * try {
 *   await routeService.deleteRoute('invalid-id');
 * } catch (error) {
 *   const message = routeService.getErrorMessage(error);
 *   console.error(message);
 * }
 */
export function getErrorMessage(error: unknown): string;

// ────────────────────────────────────────────────────────

/**
 * ✅ API Base URL'sini Döndür
 * 
 * Açıklama: Yapılandırılan API base URL'sini döndür (debug için)
 * 
 * Returns: string // API base URL
 * 
 * Kullanım Örneği:
 * ──────────────
 * console.log(routeService.getApiBaseUrl());
 * // Output: "http://localhost:3000/api"
 */
export function getApiBaseUrl(): string;

// ============================================================
// 4. RESPONSE TIPLERI
// ============================================================

/**
 * IRoute Interface
 * 
 * Bir rotayı temsil eden veri yapısı
 */
interface IRoute {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  city: string;
  startDate: Date;
  endDate: Date;
  budgetType: "BUDGET" | "MODERATE" | "LUXURY";
  stops?: IStop[];
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────

/**
 * IStop Interface
 * 
 * Bir durağı (rota içinde duraklama noktası) temsil eden veri yapısı
 */
interface IStop {
  id: string;
  routeId: string;
  order: number;
  type: "ACCOMMODATION" | "ATTRACTION" | "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "OTHER";
  name: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  duration: number | null; // dakika cinsinden
  estimatedCost: number | null;
  notes: string | null;
  dayNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

// ────────────────────────────────────────────────────────

/**
 * CreateRouteRequest Interface
 * 
 * Yeni rota oluşturma sırasında gönderilen veri yapısı
 */
interface CreateRouteRequest {
  title: string;
  description?: string;
  city: string;
  startDate: Date | string;
  endDate: Date | string;
  budgetType: "BUDGET" | "MODERATE" | "LUXURY";
  userId?: string;
}

// ────────────────────────────────────────────────────────

/**
 * UpdateRouteNameRequest Interface
 * 
 * Rota adı güncelleme sırasında gönderilen veri yapısı
 */
interface UpdateRouteNameRequest {
  title: string;
}

// ────────────────────────────────────────────────────────

/**
 * ApiError Interface
 * 
 * API hatasını temsil eden veri yapısı
 */
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ============================================================
// 5. BÜTÇE VE DURAK TÜPLERİ
// ============================================================

/**
 * BudgetType Enum
 */
enum BudgetType {
  BUDGET = "BUDGET",       // Bütçe dostu, ekonomik
  MODERATE = "MODERATE",   // Orta seviye
  LUXURY = "LUXURY",       // Lüks, premium
}

// ────────────────────────────────────────────────────────

/**
 * StopType Enum
 */
enum StopType {
  ACCOMMODATION = "ACCOMMODATION", // Konaklama (otel, pansiyon vb.)
  ATTRACTION = "ATTRACTION",       // Turist çekicilik merkezi
  RESTAURANT = "RESTAURANT",       // Yemek içme yeri
  ACTIVITY = "ACTIVITY",           // Aktivite ve deneyim
  TRANSPORT = "TRANSPORT",         // Ulaştırma ve geçiş
  OTHER = "OTHER",                 // Diğer
}

// ============================================================
// 6. ÖRNEK SENARYO
// ============================================================

/**
 * Tam Senaryo Örneği
 * ─────────────────
 * 
 * Bir kullanıcının rotalarını listele, birini sil, diğerinin adını değiştir
 */

async function exampleScenario() {
  try {
    const userId = 'user-123';

    // 1️⃣ Kullanıcının tüm rotalarını getir
    console.log('1️⃣ Rotaları getiriyor...');
    const routes = await getUserRoutes(userId);
    console.log(`${routes.length} rota bulundu`);

    // 2️⃣ Birinci rotanın detaylarını getir
    if (routes.length > 0) {
      console.log('\n2️⃣ İlk rotanın detaylarını getiriyor...');
      const firstRoute = routes[0];
      const details = await getRouteDetails(firstRoute.id);
      console.log(`${details.stops?.length || 0} durak bulundu`);

      // 3️⃣ Rotanın adını değiştir
      console.log('\n3️⃣ Rotanın adını değiştiriyor...');
      const updated = await renameRoute(firstRoute.id, {
        title: 'Güncellenmiş Rota Adı',
      });
      console.log(`Yeni ad: ${updated.title}`);
    }

    // 4️⃣ Eğer 2 den fazla rota varsa, birini sil
    if (routes.length > 1) {
      console.log('\n4️⃣ İkinci rotayı siliniyor...');
      const secondRoute = routes[1];
      const deleted = await deleteRoute(secondRoute.id);
      console.log(`${deleted.title} silindi`);
    }

  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Hata:', message);
  }
}

// ============================================================
// 7. HATA HANDLING ÖRNEKLERI
// ============================================================

/**
 * Hata Handling Örnek 1: Try-Catch
 */
async function exampleTryCatch() {
  try {
    const route = await getRouteDetails('invalid-route-id');
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Rota bulunamadı:', message);
    // Error handling...
  }
}

/**
 * Hata Handling Örnek 2: Promise Chain
 */
function examplePromiseChain() {
  getUserRoutes('user-123')
    .then(routes => {
      console.log('Rotalar başarıyla yüklendi:', routes.length);
    })
    .catch(error => {
      const message = getErrorMessage(error);
      console.error('Hata oluştu:', message);
    });
}

// ============================================================
// 8. TIMEOUT VE İLERLEME GÖSTERGESİ
// ============================================================

/**
 * Timeout Ayarı
 * 
 * routeService.ts'de Axios instance'ı için ayarlanmıştır:
 * timeout: 30000 // 30 saniye
 * 
 * Eğer request 30 saniyeden uzun sürerse timeout hatası alırsınız.
 */

/**
 * Loading Göstergesi (React Örneği)
 */
function LoadingExample() {
  // const { isLoading, isPending } = useGetUserRoutes('user-123');
  
  // if (isLoading || isPending) {
  //   return <div>Yükleniyor...</div>;
  // }
}
