/**
 * ============================================
 * ADVENTURER SUNUCU GİRİŞ NOKTASI (ENTRY POINT)
 * ============================================
 * 
 * Bu dosya, Express sunucusunun başlatılması ve yapılandırılmasından sorumludur.
 * Tüm middleware'ler, rotalar ve HTTP dinleyicisi burada tanımlanır.
 * 
 * Sunucu Başlatma Akışı:
 * 1. Ortam değişkenlerini yükle (.env dosyasından)
 * 2. Express uygulamasını oluştur
 * 3. Middleware'leri ekle (CORS, JSON parser, vb.)
 * 4. Rotaları bağla
 * 5. HTTP sunucusunu başlat ve dinlemeye al
 */

// ============================================
// DIŞ BAĞIMLILIĞA (EXTERNAL DEPENDENCIES)
// ============================================

// Express: Web framework
// Bir HTTP sunucusu oluşturmak ve yönetmek için kullanılır.
// Middleware desteği, routing ve request/response işlemesi sağlar.
import express from 'express';

// CORS (Cross-Origin Resource Sharing)
// Frontend (client) ile backend farklı portta çalışırsa, CORS hatası oluşur.
// cors() middleware'i, client'tan gelen istekleri kabul etmeyi sağlar.
// 
// CORS kullanılmasının sebebi:
// - Client: http://localhost:5173 (Vite dev server)
// - Server: http://localhost:5000 (Bu sunucu)
// - Farklı origin'ler arası iletişim için izin gerekli
import cors from 'cors';

// dotenv: Ortam değişkenlerini yönetir
// .env dosyasında PORT, API_KEY gibi hassas veriler saklanır.
// dotenv.config(), bu değişkenleri process.env'e yükler.
import dotenv from 'dotenv';



/**
 * ============================================
 * ADIM 1: ORTAM DEĞİŞKENLERİNİ YÜKLE
 * ============================================
 * 
 * dotenv.config() çağrısı, proje kökünde bulunan .env dosyasını okur.
 * 
 * .env dosyası örneği:
 * PORT=5000
 * API_KEY=sk-...
 * DATABASE_URL=...
 * 
 * Neden yüklemek gerekir?
 * - Hassas verileri kaynak koddan ayrı tutmak (güvenlik)
 * - Farklı ortamlar için (development, production) farklı konfigurasyonlar
 * - Aynı kod, farklı ayarlar ile çalışabilmesi
 * 
 * Yapmayan şey: process.env değişkenleri tanımlanmadan önce import yapılırsa hata oluşabilir
 * Bu yüzden en başta yapılır.
 */
dotenv.config();



// ============================================
// PRESENTATİON KATMANI (ROUTES)
// ============================================

// routeRouter: Rota tanımlamalarını içeren Express Router
// Bu router, /generate endpoint'ini ve tüm bağımlılıklarını içerir.
// 
// İçerdikleri:
// - POST /generate: Gezi rotası oluşturma endpoint'i
// - RouteController ile tüm route handlerları
// - CreateRouteUseCase ve GeminiAIService enjeksiyonları
import routeRouter from './presentation/routes/route.js';



/**
 * ============================================
 * ADIM 2: EXPRESS UYGULAMASINI OLUŞTUR
 * ============================================
 * 
 * express() fonksiyonu, Express uygulaması oluşturur.
 * Bu uygulamaya:
 * - Middleware'ler ekleyeceğiz
 * - Rotalar bağlayacağız
 * - HTTP dinleyici açacağız
 * 
 * Neden ayrı bir değişken?
 * - Uygulama boyunca referans almak için (middleware ekleme, route bağlama, sunucu başlatma)
 * - Test sırasında mock'lanabilir
 */
const app = express();

/**
 * ============================================
 * ADIM 3: MIDDLEWARE'LERİ EKLE
 * ============================================
 */

// Middleware 1: CORS Konfigürasyonu
// ----------------------------------
// cors() middleware'i, tüm kökenleri (origins) kabul eden konfigürasyon ile başlatılır.
//
// CORS Çalışma Prensibi:
// 1. Client, sunucuya istek gönderir
// 2. Browser, istek öncesinde Origin başlığını ekler (örn: http://localhost:5173)
// 3. Sunucu, bu Origin'in izin listesinde olup olmadığını kontrol eder
// 4. İzin varsa, istek işlenir; yoksa browser tarafından engellenir
//
// Neden cors() kullanıyoruz?
// - Frontend ve backend farklı portlarda çalışıyor
// - Browser, güvenlik nedeniyle cross-origin istekleri engeller
// - cors() middleware'i, this engeli aşmayı sağlar
//
// Production'da neler değişir?
// - cors({ origin: 'https://example.com' }) gibi spesifik origin'ler belirtilmelidir
// - Herkese açık cors() konfigürasyonu güvenlik riski oluşturur
app.use(cors());

// Middleware 2: JSON Gövde Parser'ı
// ----------------------------------
// express.json() middleware'i, gelen HTTP isteklerinin JSON gövdesini (body) parse eder.
//
// İş Akışı:
// 1. Client, JSON data gönderir: { city: "İstanbul", days: 3, budget: "STANDARD" }
// 2. HTTP gövde, raw binary veri olarak sunucuya gelir
// 3. express.json() middleware'i, bunu JavaScript nesnesine çevirir
// 4. req.body, artık { city: "İstanbul", days: 3, budget: "STANDARD" } şeklinde erişilebilir
//
// Neden gerekli?
// - Express, varsayılan olarak HTTP gövdesini parse etmez
// - RouteController.createRoute() metodunun req.body'ye erişmesi gerekli
// - req.body olmadan, gelen veriyi işleyemeyiz
app.use(express.json());

/**
 * ============================================
 * ADIM 4: ROTALARI BAĞLA
 * ============================================
 */

// Route Bağlama
// ----------------------------------
// app.use('/api', routeRouter)
//
// Bu satır ne yapıyor?
// - '/api' path'i ile başlayan tüm istekler routeRouter'a yönlendirilir
// - routeRouter içindeki 'POST /generate' ile birleşir
//
// Sonuç:
// Endpoint: POST /api/generate
//
// İstek örneği:
// POST http://localhost:5000/api/generate
// Body: { city: "İstanbul", days: 3, budget: "STANDARD" }
//
// Neden '/api' prefix'i kullanıyoruz?
// - API versiyonlanması: /api/v1, /api/v2 gibi versiyonlar eklenebilir
// - Klasifikasyon: /api, /static, /admin gibi farklı yollar ayrılabilir
// - Bakım ve ölçeklendirme: API rotaları daha organize olur
app.use('/api', routeRouter);

/**
 * ============================================
 * ADIM 5: SUNUCUYU BAŞLAT
 * ============================================
 */

// Port Ayarı
// ----------------------------------
// process.env.PORT: .env dosyasından okunan PORT değişkeni
// || 5000: Eğer PORT ortam değişkeni tanımlanmamışsa, 5000 kullan (varsayılan)
//
// Neden ortam değişkeni kullanıyoruz?
// - Farklı ortamlarda (production, staging, development) farklı portlar kullanılabilir
// - Birden fazla sunucu örneği aynı anda çalışabilir (farklı portlarda)
// - Kodu değiştirmeden, sadece .env dosyasını güncelleyerek konfigürasyon yapılabilir
const PORT = process.env.PORT || 5000;

// Sunucuyu Başlatma
// ----------------------------------
// app.listen(PORT, callback)
// 
// Bu metod:
// 1. Belirtilen PORT'ta HTTP sunucusu oluşturur
// 2. Gelen istekleri dinlemeye başlar
// 3. Callback fonksiyonu, sunucu başarıyla başlatılınca çalışır
//
// Callback fonksiyonu neden gerekli?
// - Sunucunun başarıyla başlatıldığını doğrulamak
// - Konsole bilgi mesajı yazdırarak operatöre bilgi vermek
// - Hata durumunda (port meşgul, vb.) işlem yapılabilmesi (advanced)
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 ADVENTURER SUNUCUSU BAŞLADI        ║
║  🌍 URL: http://localhost:${PORT}      ║
║  📡 API Path: /api                     ║
║  🛣️  Routes: /api/generate (POST)      ║
╚════════════════════════════════════════╝
  `);
});

/**
 * ============================================
 * SUNUCU ÇALIŞMA ÖZETI
 * ============================================
 * 
 * Şu anda sunucu çalışıyor ve şunları yapabiliyor:
 * 
 * 1. POST http://localhost:5000/api/generate
 *    - Body: { city: string, days: number, budget: BudgetType }
 *    - Response: Array<IStop> (gezi durakları)
 * 
 * 2. CORS aktif: Frontend (herhangi bir origin'den) istek gönderebilir
 * 
 * 3. JSON parser: Gelen veriler otomatik parse edilir
 * 
 * 4. Veri Akışı:
 *    HTTP POST İsteği
 *         ↓
 *    CORS Middleware (origin kontrol)
 *         ↓
 *    JSON Parser (body parse)
 *         ↓
 *    RouteController.createRoute()
 *         ↓
 *    CreateRouteUseCase.execute()
 *         ↓
 *    GeminiAIService.generateRoute()
 *         ↓
 *    AI Response
 *         ↓
 *    HTTP 200 / 400 Yanıtı
 */
