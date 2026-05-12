// Router, Express uygulamasında HTTP yönlendirmelerini (route) tanımlamak için kullanılır.
// Router modüler bir yapı sağlar ve route'ları farklı dosyalara bölebilmemizi sağlar.
import { Router } from 'express';


// RouteController, HTTP isteklerini işleyen ve response gönderen sınıftır.
// Bu dosyada RouteController'ın bir örneğini oluşturacak ve route'a bağlayacağız.
import { RouteController } from '../controllers/RouteController.js';


// CreateRouteUseCase, iş mantığını (business logic) içeren sınıftır.
// Şehir, gün, bütçe, title bilgisinden bir gezi rotası oluşturmaktan sorumludur.
// Controller tarafından çağrılacak ve use case tarafından işlenecek.
import { CreateRouteUseCase } from '../../application/use-cases/CreateRouteUseCase.js';


// GeminiAIService, dış sistem (Google Gemini AI) ile iletişim kuran sınıftır.
// Bu servis, AI kullanarak gezi rotasını üretir.
// CreateRouteUseCase tarafından kullanılacaktır.
import { GeminiAIService } from '../../infrastructure/services/GeminiAIService.js';

// Database Connection Manager
// Prisma Client singleton'unu yönetir
import { getPrismaClient } from '../../infrastructure/database/prisma.js';

/**
 
 * Yazılım mimarisinde "Dependency Injection" prensibi uygulanmaktadır.
 * Bu prensip, sınıfların kendi bağımlılıklarını oluşturması yerine,
 * dışarıdan parametre olarak almasını belirtir.
 * 
 * Bağımlılık Hiyerarşisi:
 * 
 *   GeminiAIService
 *          ↓ (enjekte edilir)
 *   CreateRouteUseCase
 *          ↓ (enjekte edilir)
 *   RouteController
 *          ↓ (Express route'a bağlanır)
 *   route.post('/generate', controller.createRoute)
 * 
 * Neden bu sırada enjekte edilir?
 * - GeminiAIService: Hiçbir şeye bağlı değil, en alt seviyede
 * - CreateRouteUseCase: GeminiAIService'i kullanır
 * - RouteController: CreateRouteUseCase'i kullanır
 * - Route: Tüm hepsini bir araya getirerek HTTP isteklerini işler
 * 
 * Avantajları:
 * 1. Test Edilebilirlik: Her katman mock edilebilir
 * 2. Esneklik: Bağımlılıklar değiştirilirse, diğer kodlar etkilenmez
 * 3. Okunabilirlik: Sınıflar arasındaki ilişkiler açıkça görülür
 * 4. Bağımlılık Tersine Çevirme: Üst seviye sınıflar, alt seviye ayrıntılarına bağlı değil
 */

/**
 * ============================================
 * ADIM 1: ROUTER OLUŞTURMA
 * ============================================
 * 
 * express.Router(), Express uygulamasında route'ları tanımlamak için
 * modüler bir yapı sağlayan mini bir uygulama gibi davranır.
 * 
 * Avantajları:
 * - Farklı route dosyalarında tanımlanmış route'ları ana uygulamaya eklenebilir
 * - Route yönetimi daha organize ve ölçeklenebilir hale gelir
 * - Bir router birden fazla yerde kullanılabilir (örn: /api/routes, /routes)
 */
const router = Router();

/**
 * ============================================
 * ADIM 2: LAZY INITIALIZATION (GECIKMELI YÜKLEMİ)
 * ============================================
 * 
 * Neden Lazy Initialization?
 * ===========================
 * 
 * Sorun: Daha önce bağımlılıkları hemen oluşturmaya çalıştığımız için,
 * dotenv.config() çalışmadan GEMINI_API_KEY ortam değişkeni erişilmiş,
 * hata oluşmuştu.
 * 
 * Çözüm: Lazy Initialization - Bağımlılıkları GEREKEN ZAMAN oluşturma
 * 
 * Akış:
 * 1. index.ts çalışır
 * 2. dotenv.config() çalışır (ortam değişkenleri yüklenir)
 * 3. Express uygulaması oluşturulur
 * 4. route.ts yüklenir (bağımlılıklar henüz oluşturulmaz)
 * 5. İlk HTTP istek gelir
 * 6. getRouteController() çağrılır
 * 7. Ancak bu noktada process.env.GEMINI_API_KEY erişilebilir!
 * 8. GeminiAIService başarıyla oluşturulur
 * 
 * Avantajları:
 * ✅ Ortam değişkenleri gerektiğinde erişilebilir
 * ✅ Sunucu başlatılırken hata yok
 * ✅ Maliyetli operasyonlar (API bağlantıları) lazy oluşturulur
 * ✅ Testte mock'lanması kolay (factory fonksiyonlar)
 * 
 * Singleton Pattern:
 * İlk oluşturulduktan sonra, aynı örnek (instance) tekrar kullanılır.
 * Bu, kaynak verimliliği ve performa boosts sağlar.
 */

// Singleton değişkenleri: Ilk oluşturulduktan sonra cache'lenmek için
// ====================================================================

// GeminiAIService singleton'u
// null: Henüz oluşturulmadı
// Ilk getGeminiService() çağrısında oluşturulacak
let geminiAIServiceInstance: GeminiAIService | null = null;

// CreateRouteUseCase singleton'u
let createRouteUseCaseInstance: CreateRouteUseCase | null = null;

// RouteController singleton'u
let routeControllerInstance: RouteController | null = null;

/**
 * getGeminiService()
 * ------------------
 * GeminiAIService singleton'unu döndüren factory fonksiyonu
 * 
 * @returns GeminiAIService instance
 * 
 * Çalışma Mantığı:
 * 1. Eğer geminiAIServiceInstance null ise, yeni instance oluştur
 * 2. Eğer null değilse, var olan instance'ı döndür (singleton pattern)
 * 3. Bu sayede API bağlantısı sadece ilk seferde oluşturulur
 */
function getGeminiService(): GeminiAIService {
  // ❌ PROBLEM: Eğer burada new GeminiAIService() yaparsak, her seferinde
  // çağrılacak ve process.env.GEMINI_API_KEY kontrol edilecek.
  // Ama şu anda ortam değişkenleri henüz yüklenmemişse hata olur!
  
  // ✅ ÇÖZÜM: if (!instance) { new ... } pattern kullan (lazy creation)
  if (!geminiAIServiceInstance) {
    geminiAIServiceInstance = new GeminiAIService();
  }
  return geminiAIServiceInstance;
}

/**
 * getCreateRouteUseCase()
 * -----------------------
 * CreateRouteUseCase singleton'unu döndüren factory fonksiyonu
 * 
 * @returns CreateRouteUseCase instance
 * 
 * Bağımlılıklar: 
 * - GeminiAIService'i enjekte eder
 * - PrismaClient'i enjekte eder
 */
function getCreateRouteUseCase(): CreateRouteUseCase {
  if (!createRouteUseCaseInstance) {
    // GeminiAIService'i getir (eğer yoksa oluştur, varsa return et)
    const geminiService = getGeminiService();
    // PrismaClient'i getir (database singleton'undan)
    const prismaClient = getPrismaClient();
    createRouteUseCaseInstance = new CreateRouteUseCase(geminiService, prismaClient);
  }
  return createRouteUseCaseInstance;
}

/**
 * getRouteController()
 * --------------------
 * RouteController singleton'unu döndüren factory fonksiyonu
 * 
 * @returns RouteController instance
 * 
 * Bağımlılıklar: 
 * - CreateRouteUseCase'i enjekte eder
 * - PrismaClient'i enjekte eder
 * 
 * Dependency Chain:
 * getRouteController()
 *   ├─ getCreateRouteUseCase()
 *   │   ├─ getGeminiService()
 *   │   └─ getPrismaClient() (import'ı)
 *   └─ getPrismaClient() (import'ı)
 */
function getRouteController(): RouteController {
  if (!routeControllerInstance) {
    // CreateRouteUseCase'i getir (eğer yoksa oluştur, varsa return et)
    const useCase = getCreateRouteUseCase();
    // PrismaClient'i getir (database singleton'undan)
    const prismaClient = getPrismaClient();
    routeControllerInstance = new RouteController(useCase, prismaClient);
  }
  return routeControllerInstance;
}

/**
 * ============================================
 * ADIM 3: ROTA TANIMLAMASI (LAZY INITIALIZATION İLE)
 * ============================================
 */

// Rota: POST /generate
// ------------------
// HTTP Method: POST
// Path: /generate
// Handler: getRouteController().createRoute
//
// ÖNEMLI: Handler'da getRouteController() çağrılıyor!
// 
// Neden POST metodu kullanıyoruz?
// --------------------------------
// 1. RESTful Prensibi: Veri oluşturma işlemleri POST ile yapılır (GET değil)
// 2. İstek Gövdesi: POST, request body'de veri göndermesine izin verir
//    - İstek: { city: "İstanbul", days: 3, budget: "STANDARD" }
// 3. Güvenlik: POST, URL'de veri göstermez (logs, browser history'de görünmez)
// 4. Idempotence: POST, her çağrışında yeni bir rota oluşturması doğaldır
//
// GET kullanmamalı mıyız?
// GET yöntemi idempotent olmalıdır (aynı istek aynı sonucu vermelidir)
// Ama burada her istek yeni bir rota oluşturacağından, POST uygun seçimdir.
//
// Alternatifleri neden seçmedik?
// - PUT: Var olan bir kaynağı güncelleme için (burada yeni oluşturuluyor)
// - DELETE: Kaynağı silme için (uygulanabilir değil)
// - PATCH: Kısmi güncelleme için (burada tam yeni oluşturuluyor)
//
// ⚡ LAZY INITIALIZATION HANDLER:
// İlk istek geldiğinde getRouteController() çağrılacak ve
// bağımlılıklar o zaman oluşturulacak (ortam değişkenleri artık yüklü!)
router.post('/generate', async (req, res) => {
  const controller = getRouteController();
  await controller.createRoute(req, res);
});

/**
 * ============================================
 * SONUÇ: ROUTER'I DIŞA AKTAR
 * ============================================
 * 
 * Bu router'ı 'export default' ile dışa aktarıyoruz ki,
 * ana uygulamada (örn: app.ts, server.ts) şöyle kullanılabilsin:
 * 
 *   import routeRouter from './presentation/routes/route.js';
 *   app.use('/api', routeRouter);
 * 
 * Bu durumda endpoint: POST /api/generate
 * 
 * Ya da:
 * 
 *   app.use('/routes', routeRouter);
 * 
 * Bu durumda endpoint: POST /routes/generate
 * 
 * Router'ın modüler olması, farklı yerlerde yeniden kullanımı kolaylaştırır.
 */
export default router;
