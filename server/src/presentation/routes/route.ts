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

// GetRoutesByUserIdUseCase, kullanıcının tüm rotalarını getiren use case'dir.
import { GetRoutesByUserIdUseCase } from '../../application/use-cases/GetRoutesByUserIdUseCase.js';

// GetRouteDetailsUseCase, belirli bir rotanın tüm detaylarını (stops ile) getiren use case'dir.
import { GetRouteDetailsUseCase } from '../../application/use-cases/GetRouteDetailsUseCase.js';

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
let geminiAIServiceInstance: GeminiAIService | null = null;

// CreateRouteUseCase singleton'u
let createRouteUseCaseInstance: CreateRouteUseCase | null = null;

// GetRoutesByUserIdUseCase singleton'u
let getRoutesByUserIdUseCaseInstance: GetRoutesByUserIdUseCase | null = null;

// GetRouteDetailsUseCase singleton'u
let getRouteDetailsUseCaseInstance: GetRouteDetailsUseCase | null = null;

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
 * getGetRoutesByUserIdUseCase()
 * ----------------------------
 * GetRoutesByUserIdUseCase singleton'unu döndüren factory fonksiyonu
 * 
 * @returns GetRoutesByUserIdUseCase instance
 * 
 * Bağımlılıklar: 
 * - PrismaClient'i enjekte eder
 * 
 * Neden Singleton?
 * - Veritabanı bağlantısı paylaşılır (PrismaClient singleton)
 * - Her istek için yeni instance oluşturmamız gerekmiyor
 * - Kaynak verimliliği artar
 */
function getGetRoutesByUserIdUseCase(): GetRoutesByUserIdUseCase {
  if (!getRoutesByUserIdUseCaseInstance) {
    // PrismaClient'i getir (database singleton'undan)
    const prismaClient = getPrismaClient();
    getRoutesByUserIdUseCaseInstance = new GetRoutesByUserIdUseCase(prismaClient);
  }
  return getRoutesByUserIdUseCaseInstance;
}

/**
 * getGetRouteDetailsUseCase()
 * ---------------------------
 * GetRouteDetailsUseCase singleton'unu döndüren factory fonksiyonu
 * 
 * @returns GetRouteDetailsUseCase instance
 * 
 * Bağımlılıklar: 
 * - PrismaClient'i enjekte eder
 * 
 * Neden Singleton?
 * - Veritabanı bağlantısı paylaşılır (PrismaClient singleton)
 * - Her istek için yeni instance oluşturmamız gerekmiyor
 * - Kaynak verimliliği artar
 */
function getGetRouteDetailsUseCase(): GetRouteDetailsUseCase {
  if (!getRouteDetailsUseCaseInstance) {
    // PrismaClient'i getir (database singleton'undan)
    const prismaClient = getPrismaClient();
    getRouteDetailsUseCaseInstance = new GetRouteDetailsUseCase(prismaClient);
  }
  return getRouteDetailsUseCaseInstance;
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
 * - GetRoutesByUserIdUseCase'i enjekte eder
 * - GetRouteDetailsUseCase'i enjekte eder
 * - PrismaClient'i enjekte eder
 * 
 * Dependency Chain:
 * getRouteController()
 *   ├─ getCreateRouteUseCase()
 *   │   ├─ getGeminiService()
 *   │   └─ getPrismaClient() (import'ı)
 *   ├─ getGetRoutesByUserIdUseCase()
 *   │   └─ getPrismaClient() (import'ı)
 *   ├─ getGetRouteDetailsUseCase()
 *   │   └─ getPrismaClient() (import'ı)
 *   └─ getPrismaClient() (import'ı)
 */
function getRouteController(): RouteController {
  if (!routeControllerInstance) {
    // CreateRouteUseCase'i getir
    const createRouteUseCase = getCreateRouteUseCase();
    // GetRoutesByUserIdUseCase'i getir
    const getRoutesByUserIdUseCase = getGetRoutesByUserIdUseCase();
    // GetRouteDetailsUseCase'i getir
    const getRouteDetailsUseCase = getGetRouteDetailsUseCase();
    // PrismaClient'i getir (database singleton'undan)
    const prismaClient = getPrismaClient();
    
    // RouteController'ı tüm use case'ler ile oluştur
    routeControllerInstance = new RouteController(
      createRouteUseCase,
      getRoutesByUserIdUseCase,
      getRouteDetailsUseCase,
      prismaClient
    );
  }
  return routeControllerInstance;
}

/**
 * ============================================
 * ADIM 3: ROTA TANIMLAMASI (LAZY INITIALIZATION İLE)
 * ============================================
 */

// Rota 1: POST /generate
// ----------------------
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
// ⚡ LAZY INITIALIZATION HANDLER:
// İlk istek geldiğinde getRouteController() çağrılacak ve
// bağımlılıklar o zaman oluşturulacak (ortam değişkenleri artık yüklü!)
router.post('/generate', async (req, res) => {
  const controller = getRouteController();
  await controller.createRoute(req, res);
});

// Rota 2: GET /user/:userId
// --------------------------
// HTTP Method: GET
// Path: /user/:userId
// Handler: getRouteController().getRoutesByUserId
//
// AÇIKLAMA:
// Verilen kullanıcı ID'sine ait TÜM rotaları listeleyen endpoint
//
// Neden GET metodu kullanıyoruz?
// ------
// 1. RESTful Prensibi: Veri okuma işlemleri GET ile yapılır
// 2. Güvenlik: GET isteği URL parametresindeki userId'yi gösterir (login kontrol edilmesi gerekir)
// 3. Idempotence: GET, aynı istek aynı sonucu vermelidir (side-effect yok)
// 4. Caching: GET isteği cacheable'dir (browser, proxy tarafından)
//
// Örnek İstek: GET /routes/user/clh123abc456
//
// Yanıt: IRoute[] (Stops dahil DEĞIL, sadece rota özeti)
// [
//   { id: "route-1", title: "İstanbul Rotası", city: "İstanbul", ... },
//   { id: "route-2", title: "Antalya Rotası", city: "Antalya", ... }
// ]
//
// ⚡ LAZY INITIALIZATION HANDLER:
router.get('/user/:userId', async (req, res) => {
  const controller = getRouteController();
  await controller.getRoutesByUserId(req, res);
});

// Rota 3: GET /:routeId
// ---------------------
// HTTP Method: GET
// Path: /:routeId
// Handler: getRouteController().getRouteDetails
//
// AÇIKLAMA:
// Verilen rota ID'sine ait rotayı, tüm stops bilgileri ile getiren endpoint
//
// Neden GET metodu kullanıyoruz?
// ------
// 1. RESTful Prensibi: Veri okuma işlemleri GET ile yapılır
// 2. URL Path: Kaynak ID'si URL path'inde yer alır (/routes/:id pattern)
// 3. Idempotence: GET, aynı istek aynı sonucu vermelidir (side-effect yok)
// 4. Caching: GET isteği cacheable'dir
//
// Örnek İstek: GET /routes/clh456def789
//
// Yanıt: IRoute (Stops DAHİL - full details)
// {
//   id: "clh456def789",
//   title: "İstanbul Rotası",
//   city: "İstanbul",
//   stops: [
//     { id: "stop-1", order: 1, name: "Topkapı Sarayı", type: "ATTRACTION", ... },
//     { id: "stop-2", order: 2, name: "Galata Kulesi", type: "ATTRACTION", ... }
//   ],
//   ...
// }
//
// HTTP Yanıt Kodları:
// - 200 OK: Rota bulundu ve başarıyla döndürüldü
// - 404 Not Found: Rota veritabanında bulunamadı (RouteNotFoundError)
// - 400 Bad Request: Hatalı routeId parametresi veya DB hatası
//
// ⚡ LAZY INITIALIZATION HANDLER:
router.get('/:routeId', async (req, res) => {
  const controller = getRouteController();
  await controller.getRouteDetails(req, res);
});

/**
 * ============================================
 * ADIM 4: ROUTER'I DIŞA AKTAR
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
