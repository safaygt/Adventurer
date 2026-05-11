// Router, Express uygulamasında HTTP yönlendirmelerini (route) tanımlamak için kullanılır.
// Router modüler bir yapı sağlar ve route'ları farklı dosyalara bölebilmemizi sağlar.
import { Router } from 'express';


// RouteController, HTTP isteklerini işleyen ve response gönderen sınıftır.
// Bu dosyada RouteController'ın bir örneğini oluşturacak ve route'a bağlayacağız.
import { RouteController } from '../controllers/RouteController.js';


// CreateRouteUseCase, iş mantığını (business logic) içeren sınıftır.
// Şehir, gün ve bütçe bilgisinden bir gezi rotası oluşturmaktan sorumludur.
// Controller tarafından çağrılacak ve use case tarafından işlenecek.
import { CreateRouteUseCase } from '../../application/use-cases/CreateRouteUseCase.js';


// GeminiAIService, dış sistem (Google Gemini AI) ile iletişim kuran sınıftır.
// Bu servis, AI kullanarak gezi rotasını üretir.
// CreateRouteUseCase tarafından kullanılacaktır.
import { GeminiAIService } from '../../infrastructure/services/GeminiAIService.js';

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
 * ADIM 2: BAĞIMLILIĞIN ENJEKTE EDILMESI
 * ============================================
 */

// Adım 2.1: GeminiAIService Örneğini Oluşturma
// -----------------------------------------
// GeminiAIService sınıfının bir örneğini (instance) oluşturuyoruz.
// Bu örnek, Google Gemini AI API'sine bağlanıp rota oluşturacak.
//
// Neden burada oluşturuyoruz?
// - Route'lar kuruluş (initialization) sırasında yüklenir
// - GeminiAIService'in bağlantısı da bu sırada hazırlanmalı
// - Her route için yeni örnek oluşturmamak, kaynakları tasarruf ediyor
const geminiAIService = new GeminiAIService();

// Adım 2.2: CreateRouteUseCase'e GeminiAIService Enjeksiyonu
// ---------------------------------------------------------
// CreateRouteUseCase, şehir/gün/bütçe bilgisini alıp GeminiAIService'i çağırır.
// GeminiAIService'i constructor'a parametre olarak veriyoruz ki,
// CreateRouteUseCase.execute() içinde this.geminiAIService.generateRoute() kullanabilsin.
//
// Bu enjeksiyonun sebebi:
// - CreateRouteUseCase, bağımlılıklarını kendi oluşturmamalı (testte kolayca mock edilecek)
// - İş mantığı (use case) dış sistem servisleriyle doğrudan bağlı olmamalı
// - Bağımlılık ters yönde akmalı (IoC - Inversion of Control)
const createRouteUseCase = new CreateRouteUseCase(geminiAIService);

// Adım 2.3: RouteController'a CreateRouteUseCase Enjeksiyonu
// ----------------------------------------------------------
// RouteController, HTTP isteklerini işleyip CreateRouteUseCase'i çağırır.
// CreateRouteUseCase'i constructor'a parametre olarak veriyoruz.
//
// Akış:
// HTTP POST /generate → RouteController.createRoute()
//                    → this.createRouteUseCase.execute()
//                    → geminiAIService.generateRoute()
//
// Bu mimari, her katmanın kendi sorumluluğunu yerine getirmesini sağlar:
// - RouteController: HTTP işleri (istek/cevap)
// - CreateRouteUseCase: İş mantığı (validasyon, orchestration)
// - GeminiAIService: Dış sistem entegrasyonu (AI servisi)
const routeController = new RouteController(createRouteUseCase);

/**
 * ============================================
 * ADIM 3: ROTA TANIMLAMASI
 * ============================================
 */

// Rota: POST /generate
// ------------------
// HTTP Method: POST
// Path: /generate
// Handler: routeController.createRoute
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
router.post('/generate', routeController.createRoute);

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
