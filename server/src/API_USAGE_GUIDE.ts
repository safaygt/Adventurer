/**
 * 📚 ADVENTURER API - USE CASE'LER KULLANIM REHBERİ
 * 
 * Bu dosya, yeni oluşturulan Use Case'lerin API endpoint'leri
 * ve nasıl kullanılacağını gösteren detaylı örneklerdir.
 * 
 * Clean Architecture Mimarisi:
 * ============================
 * 
 * Request → Route → Controller → UseCase → Service/Database
 *
 * ✅ Route: HTTP route tanımlaması (method, path)
 * ✅ Controller: HTTP istek/cevap işleme, validasyon, status code
 * ✅ UseCase: İş mantığı (domain rules)
 * ✅ Service/Database: Dış sistem ile iletişim
 * 
 * ============================================
 * 1. POST /api/routes/generate - ROTA OLUŞTUR
 * ============================================
 * 
 * AMAÇ:
 * AI kullanarak yeni bir gezi rotası oluştur.
 * Giriş yapan kullanıcı ise DB'ye kaydedilir.
 * Misafir ise sadece JSON olarak döndürülür.
 * 
 * USE CASE: CreateRouteUseCase (Mevcut - referans için)
 * 
 * ⬇️ REQUEST
 * ============
 * METHOD: POST
 * URL: http://localhost:3000/api/routes/generate
 * CONTENT-TYPE: application/json
 * 
 * BODY:
 * {
 *   "city": "İstanbul",
 *   "days": 3,
 *   "budget": "MODERATE",
 *   "title": "İstanbul Tarihî Yarımada Turu",
 *   "userId": "clh123abc456"  // (Opsiyonel) Boşsa misafir rotası
 * }
 * 
 * PARAMETRELER:
 * - city (string, zorunlu): Gezilecek şehir adı
 *   Örn: "İstanbul", "Antalya", "Cappadocia"
 * 
 * - days (number, zorunlu): Gezinin kaç gün olacağı
 *   Range: 1-30
 * 
 * - budget (enum, zorunlu): Bütçe seviyesi
 *   Seçenekler: "BUDGET", "MODERATE", "LUXURY"
 * 
 * - title (string, zorunlu): Rotanın başlığı
 *   Örn: "Ramazan Özel Turizm Paketi"
 * 
 * - userId (string, opsiyonel): Kullanıcı ID'si
 *   Boş veya null = Misafir rotası (DB kayıt YOK)
 *   Dolu = Kullanıcı rotası (DB kayıt VAR)
 * 
 * ⬆️ RESPONSE (201 Created - Giriş Yapan Kullanıcı)
 * ===============
 * {
 *   "id": "route_clh789ghi012",
 *   "userId": "clh123abc456",
 *   "title": "İstanbul Tarihî Yarımada Turu",
 *   "description": "Topkapı Sarayı, Ayasofya, Galata Kulesi...",
 *   "city": "İstanbul",
 *   "startDate": "2026-05-15T08:00:00Z",
 *   "endDate": "2026-05-18T22:00:00Z",
 *   "budgetType": "MODERATE",
 *   "stops": [
 *     {
 *       "id": "stop_clh789ghi013",
 *       "routeId": "route_clh789ghi012",
 *       "order": 1,
 *       "type": "ACCOMMODATION",
 *       "name": "Sultanahmet Bölgesi Hotel",
 *       "description": "Tarihi yarımadaya yakın 4 yıldızlı hotel",
 *       "location": "Sultanahmet, İstanbul",
 *       "latitude": 41.0047,
 *       "longitude": 28.9848,
 *       "createdAt": "2026-05-10T10:20:30Z",
 *       "updatedAt": "2026-05-10T10:20:30Z"
 *     },
 *     {
 *       "id": "stop_clh789ghi014",
 *       "routeId": "route_clh789ghi012",
 *       "order": 2,
 *       "type": "ATTRACTION",
 *       "name": "Topkapı Sarayı",
 *       "description": "Osmanlı padişahlarının yaşadığı saray...",
 *       "location": "Cankurtaran, İstanbul",
 *       "latitude": 41.0136,
 *       "longitude": 28.9835
 *     }
 *   ],
 *   "createdAt": "2026-05-10T10:20:30Z",
 *   "updatedAt": "2026-05-10T10:20:30Z"
 * }
 * 
 * ⬆️ RESPONSE (200 OK - Misafir Kullanıcı)
 * ===============
 * Yanıt 201 Created ile aynıdır, ancak:
 * - userId = null
 * - DB'de kayıt YOKTUR
 * - Rota veritabanından değil, sadece AI'den oluşturulmuş
 * - Sayfa yenileniyor veya sekme kapanırsa rota KAYBOLACak
 * 
 * ❌ RESPONSE (400 Bad Request - Hata)
 * ===============
 * {
 *   "error": "Bütçe türü şunlardan biri olmalıdır: BUDGET, MODERATE, LUXURY"
 * }
 * 
 * 
 * ============================================
 * 2. GET /api/routes/user/:userId - ROTALARI LİSTELE
 * ============================================
 * 
 * AMAÇ:
 * Belirli bir kullanıcıya ait TÜM rotaları listele.
 * Performans için STOPS dahil EDILMEZ.
 * Rota özeti bilgilerini döndürür.
 * 
 * USE CASE: GetRoutesByUserIdUseCase
 * 
 * ⬇️ REQUEST
 * ============
 * METHOD: GET
 * URL: http://localhost:3000/api/routes/user/clh123abc456
 * CONTENT-TYPE: application/json
 * 
 * URL PARAMETRELER:
 * - userId (string, zorunlu): Rotaları listelenecek kullanıcının ID'si
 *   Örn: clh123abc456, user_xyz789
 * 
 * QUERY PARAMETRELER (Opsiyonel - future features):
 * Şimdi kullanılmıyor, ileride eklenebilir:
 * - sort=createdAt (Sıralama)
 * - limit=10 (Sayfa başına kaç rota)
 * - page=1 (Hangi sayfa)
 * - city=İstanbul (Şehre göre filtre)
 * 
 * ⬆️ RESPONSE (200 OK)
 * ===============
 * [
 *   {
 *     "id": "route_clh789ghi012",
 *     "userId": "clh123abc456",
 *     "title": "İstanbul Tarihî Yarımada Turu",
 *     "description": null,
 *     "city": "İstanbul",
 *     "startDate": "2026-05-15T08:00:00Z",
 *     "endDate": "2026-05-18T22:00:00Z",
 *     "budgetType": "MODERATE",
 *     "createdAt": "2026-05-10T10:20:30Z",
 *     "updatedAt": "2026-05-10T10:20:30Z"
 *     // ⚠️ NOT: "stops" field'ı YOKTUR (performans için çıkartıldı)
 *   },
 *   {
 *     "id": "route_clh789mno345",
 *     "userId": "clh123abc456",
 *     "title": "Antalya Sahil Turu",
 *     "description": "Türkoit Rivierası'nın en güzel plajları",
 *     "city": "Antalya",
 *     "startDate": "2026-06-01T08:00:00Z",
 *     "endDate": "2026-06-05T22:00:00Z",
 *     "budgetType": "LUXURY",
 *     "createdAt": "2026-05-12T14:30:00Z",
 *     "updatedAt": "2026-05-12T14:30:00Z"
 *   }
 * ]
 * 
 * 💡 EMPTY ARRAY (Rotası Yoksa):
 * [] ← Boş array döner, bu HATA DEĞİL, normal durum
 * 
 * ❌ RESPONSE (400 Bad Request - Hata)
 * ===============
 * {
 *   "error": "Kullanıcı ID gereklidir ve boş olmayan bir metin olmalıdır."
 * }
 * 
 * 
 * ============================================
 * 3. GET /api/routes/:routeId - ROTA DETAYLARINI AL
 * ============================================
 * 
 * AMAÇ:
 * Belirli bir rotanın TÜZEL detaylarını al.
 * Bu endpoint STOPS bilgilerini dahil eder.
 * Rota bulunamazsa 404 Not Found döndürür.
 * 
 * USE CASE: GetRouteDetailsUseCase
 * 
 * ⬇️ REQUEST
 * ============
 * METHOD: GET
 * URL: http://localhost:3000/api/routes/route_clh789ghi012
 * CONTENT-TYPE: application/json
 * 
 * URL PARAMETRELER:
 * - routeId (string, zorunlu): Detayları getirilecek rotanın ID'si
 *   Örn: route_clh789ghi012, route_xyz789
 * 
 * ⬆️ RESPONSE (200 OK - Rota Bulundu)
 * ===============
 * {
 *   "id": "route_clh789ghi012",
 *   "userId": "clh123abc456",
 *   "title": "İstanbul Tarihî Yarımada Turu",
 *   "description": "Topkapı Sarayı, Ayasofya, Galata Kulesi ve daha...",
 *   "city": "İstanbul",
 *   "startDate": "2026-05-15T08:00:00Z",
 *   "endDate": "2026-05-18T22:00:00Z",
 *   "budgetType": "MODERATE",
 *   "stops": [
 *     {
 *       "id": "stop_clh789ghi013",
 *       "routeId": "route_clh789ghi012",
 *       "order": 1,
 *       "type": "ACCOMMODATION",
 *       "name": "Sultanahmet Bölgesi Hotel",
 *       "description": "Tarihi yarımadaya yakın 4 yıldızlı hotel",
 *       "location": "Sultanahmet, İstanbul",
 *       "latitude": 41.0047,
 *       "longitude": 28.9848,
 *       "createdAt": "2026-05-10T10:20:30Z",
 *       "updatedAt": "2026-05-10T10:20:30Z"
 *     },
 *     {
 *       "id": "stop_clh789ghi014",
 *       "routeId": "route_clh789ghi012",
 *       "order": 2,
 *       "type": "ATTRACTION",
 *       "name": "Topkapı Sarayı",
 *       "description": "Osmanlı padişahlarının yaşadığı 400 yıllık saray...",
 *       "location": "Cankurtaran, İstanbul",
 *       "latitude": 41.0136,
 *       "longitude": 28.9835,
 *       "createdAt": "2026-05-10T10:20:30Z",
 *       "updatedAt": "2026-05-10T10:20:30Z"
 *     },
 *     {
 *       "id": "stop_clh789ghi015",
 *       "routeId": "route_clh789ghi012",
 *       "order": 3,
 *       "type": "RESTAURANT",
 *       "name": "Ümit Kebapçısı",
 *       "description": "Ünlü İstanbul kebap restoranı, çok dolu oluyor!",
 *       "location": "Sultanahmet, İstanbul",
 *       "latitude": 41.0055,
 *       "longitude": 28.9860,
 *       "createdAt": "2026-05-10T10:20:30Z",
 *       "updatedAt": "2026-05-10T10:20:30Z"
 *     }
 *   ],
 *   "createdAt": "2026-05-10T10:20:30Z",
 *   "updatedAt": "2026-05-10T10:20:30Z"
 * }
 * 
 * ✨ STOPS ARRAY ÖZELLIKLERI:
 * - Stops order field'ına göre SIRALI (1, 2, 3 şeklinde)
 * - Her stop rota içindeki bir günü veya etkinliği temsil eder
 * - Type field'ı stop kategorisini belirtir
 *   • ACCOMMODATION: Konaklama (otel, pansiyon)
 *   • ATTRACTION: Atraksiyon (müze, anıt)
 *   • RESTAURANT: Restoran (yemek)
 *   • ACTIVITY: Aktivite (suya sporları vb.)
 *   • TRANSPORT: Ulaşım (uçak, otobüs)
 *   • OTHER: Diğer
 * 
 * ❌ RESPONSE (404 Not Found - Rota Bulunamadı)
 * ===============
 * {
 *   "error": "Rota bulunamadı. Rota ID: route_invalid_xyz"
 * }
 * 
 * ❌ RESPONSE (400 Bad Request - Hata)
 * ===============
 * {
 *   "error": "Rota ID gereklidir ve boş olmayan bir metin olmalıdır."
 * }
 * 
 * 
 * ============================================
 * 📊 API KULLANIM ÖRNEĞİ - cURL
 * ============================================
 * 
 * 1️⃣  Rota Oluştur (Giriş Yapan Kullanıcı)
 * ==========================================
 * curl -X POST http://localhost:3000/api/routes/generate \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "city": "İstanbul",
 *     "days": 3,
 *     "budget": "MODERATE",
 *     "title": "İstanbul Tarihî Yarımada Turu",
 *     "userId": "clh123abc456"
 *   }'
 * 
 * 2️⃣  Kullanıcının Rotalarını Listele
 * =====================================
 * curl -X GET http://localhost:3000/api/routes/user/clh123abc456 \
 *   -H "Content-Type: application/json"
 * 
 * 3️⃣  Rota Detaylarını Al
 * ========================
 * curl -X GET http://localhost:3000/api/routes/route_clh789ghi012 \
 *   -H "Content-Type: application/json"
 * 
 * 
 * ============================================
 * 🧪 USE CASE TESTI (TypeScript/Node.js)
 * ============================================
 * 
 * import { GetRoutesByUserIdUseCase } from './application/use-cases/GetRoutesByUserIdUseCase.js';
 * import { GetRouteDetailsUseCase } from './application/use-cases/GetRouteDetailsUseCase.js';
 * import { getPrismaClient } from './infrastructure/database/prisma.js';
 * 
 * async function testGetRoutesByUserId() {
 *   // Setup
 *   const prismaClient = getPrismaClient();
 *   const useCase = new GetRoutesByUserIdUseCase(prismaClient);
 *   
 *   // Execute
 *   const routes = await useCase.execute('clh123abc456');
 *   
 *   // Assert
 *   console.log('User Routes:', routes);
 *   console.log('Route Count:', routes.length);
 * }
 * 
 * async function testGetRouteDetails() {
 *   // Setup
 *   const prismaClient = getPrismaClient();
 *   const useCase = new GetRouteDetailsUseCase(prismaClient);
 *   
 *   // Execute
 *   try {
 *     const route = await useCase.execute('route_clh789ghi012');
 *     console.log('Route Details:', route);
 *     console.log('Stops Count:', route.stops?.length);
 *   } catch (error) {
 *     if (error.name === 'RouteNotFoundError') {
 *       console.log('Rota bulunamadı!');
 *     }
 *   }
 * }
 * 
 * 
 * ============================================
 * 🔍 ERROR HANDLING - HATA YÖNETİMİ
 * ============================================
 * 
 * GetRoutesByUserIdUseCase Hataları:
 * ----------------------------------
 * 1. userId boş veya null
 *    → Error: "Kullanıcı ID gereklidir..."
 * 
 * 2. DB bağlantı hatası
 *    → Error: "Rotaları getirirken bir hata oluştu: [DB error message]"
 * 
 * GetRouteDetailsUseCase Hataları:
 * --------------------------------
 * 1. routeId boş veya null
 *    → Error: "Rota ID gereklidir..."
 * 
 * 2. Rota bulunamadı (RouteNotFoundError)
 *    → HTTP 404 Not Found
 *    → Error: "Rota bulunamadı. Rota ID: [routeId]"
 * 
 * 3. DB bağlantı hatası
 *    → Error: "Rota detaylarını getirirken bir hata oluştu: [DB error message]"
 * 
 * 
 * ============================================
 * 📝 NOTLAR & BEST PRACTICES
 * ============================================
 * 
 * ✅ DO's:
 * - userId ve routeId parametrelerini her zaman validate et
 * - Stops'ları listelerken order field'ına göre sırala
 * - RouteNotFoundError'ü 404 status kodu ile handle et
 * - Sensitive veriler (passwords, API keys) asla döndürme
 * - Veritabanı connection pool'u yönet (getPrismaClient singleton)
 * - TypeScript types kullan (IRoute, IStop, IUser)
 * 
 * ❌ DON'Ts:
 * - Stops'ları list endpoint'inde dahil etme (performans)
 * - Her istek için yeni UseCase instance oluşturma
 * - Hata mesajlarını client'a detaylı teknik bilgi verme
 * - Veritabanı query'sini doğrudan controller'da çalıştırma
 * - Error handling'i skip etme
 * 
 * 🏗️ Clean Architecture İlkeleri:
 * - UseCase'ler HTTP'den bağımsız (pure business logic)
 * - Controller HTTP'ye özgü (status codes, headers)
 * - Service'ler dış sistem iletişimi (Prisma, API calls)
 * - Entity'ler domain models (IRoute, IStop, IUser)
 * 
 * 🧪 Test Yazarken:
 * - Mock PrismaClient kullan
 * - Happy path testleri yaz
 * - Error scenario'larını test et
 * - Edge case'leri düşün (boş array, null values, etc.)
 */

// Bu dosya sadece referans ve dokumentasyon için yazılmıştır.
// Gerçek kodda kullanılmaz, ancak API testleri yapmak için bu örnekleri kullanabilirsiniz.
