/**
 * ============================================
 * ADVENTURER - ROUTE API KULLANIM KILAVUZU
 * DeleteRoute & UpdateRouteName Özellikleri
 * ============================================
 * 
 * Son Güncelleme: 2026-05-18
 * Yapılan Eklemeler: DeleteRoute ve UpdateRouteName use cases
 * Clean Architecture: ✅ Uyumlu
 * TypeScript: ✅ Type-safe
 * 
 */

// ============================================
// 1. DELETE ROUTE - Rotayı Silme
// ============================================

/**
 * ENDPOINT: DELETE /routes/:routeId
 * 
 * AÇIKLAMA:
 * Belirli bir rotayı ve ona bağlı tüm durakları siler.
 * 
 * PARAMETRELER:
 * - routeId (URL Parameter): Silinecek rotanın ID'si
 * 
 * BAŞARILI YANIT:
 * HTTP Status: 204 No Content
 * Response Body: BOŞ (JSON yok)
 * 
 * HATA YANITI 1 - Rota Bulunamadı:
 * HTTP Status: 404 Not Found
 * Response Body:
 * {
 *   "error": "Rota bulunamadı. Rota ID: clh456def789"
 * }
 * 
 * HATA YANITI 2 - Geçersiz routeId:
 * HTTP Status: 400 Bad Request
 * Response Body:
 * {
 *   "error": "Rota ID parametresi gerekli ve boş olmayan bir metin olmalıdır."
 * }
 * 
 * ÖRNEK İSTEK (cURL):
 * -----
 * curl -X DELETE http://localhost:3000/api/routes/clh456def789 \
 *   -H "Content-Type: application/json"
 * 
 * ÖRNEK İSTEK (JavaScript/Fetch):
 * -----
 * fetch('http://localhost:3000/api/routes/clh456def789', {
 *   method: 'DELETE',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   }
 * })
 * .then(response => {
 *   if (response.status === 204) {
 *     console.log('Rota başarıyla silindi');
 *   } else if (response.status === 404) {
 *     console.error('Rota bulunamadı');
 *   } else if (response.status === 400) {
 *     return response.json().then(data => {
 *       console.error('Hata:', data.error);
 *     });
 *   }
 * })
 * .catch(error => console.error('Network error:', error));
 * 
 * ÖRNEK İSTEK (Axios - TypeScript):
 * -----
 * import axios from 'axios';
 * 
 * try {
 *   const response = await axios.delete(
 *     `http://localhost:3000/api/routes/${routeId}`,
 *     {
 *       headers: {
 *         'Content-Type': 'application/json'
 *       }
 *     }
 *   );
 *   
 *   // 204 No Content başarılı silme anlamına gelir
 *   console.log('Rota başarıyla silindi');
 * } catch (error) {
 *   if (error.response?.status === 404) {
 *     console.error('Rota bulunamadı');
 *   } else if (error.response?.status === 400) {
 *     console.error('Hata:', error.response.data.error);
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * 
 * İŞ MANTIKI - ARKADA NELER OLUYOR:
 * -------
 * 1. deleteRoute HTTP endpoint çağrılıyor
 * 2. DeleteRouteUseCase.execute(routeId) tetikleniyor
 * 3. Rota var mı kontrol edilyor
 *    - Yoksa: RouteNotFoundError fırlatılıyor → 404 dönüyor
 *    - Varsa: Silme işlemine devam ediliyor
 * 4. Route silinirken:
 *    - Schema'daki Cascade Delete kuralı devreye giriyor
 *    - Stop tablosundaki ilişkili tüm kayıtlar otomatik silinir
 *    - Route kaydı silinir
 * 5. İşlem transaction'da gerçekleşiyor (atomicity)
 * 6. 204 No Content döndürülüyor
 * 
 * CASCADE DELETE AÇIKLAMASI:
 * -------
 * schema.prisma'da Stop model'inde:
 * 
 *   route Route @relation(..., onDelete: Cascade)
 * 
 * Bu ayar, Route silinince ilişkili Stop'ları otomatik siler.
 * Örnek:
 * - Route silinmek üzere: id='route-123'
 * - Stop'lar: [{ id: 'stop-1', routeId: 'route-123' }, { id: 'stop-2', routeId: 'route-123' }]
 * - Sonuç: Stop-1 ve Stop-2 otomatik silinir
 * - Orphan (sahipsiz) Stop kalması OLMAZ
 */

// ============================================
// 2. UPDATE ROUTE NAME - Rotanın Adını Değiştirme
// ============================================

/**
 * ENDPOINT: PATCH /routes/:routeId/rename
 * 
 * AÇIKLAMA:
 * Belirli bir rotanın başlığını (title) günceller.
 * Sadece title alanı değiştirilir, diğer alanlar korunur.
 * 
 * PARAMETRELER:
 * - routeId (URL Parameter): Güncellenecek rotanın ID'si
 * 
 * REQUEST BODY (JSON):
 * {
 *   "newTitle": "Yeni Rota Başlığı"
 * }
 * 
 * VALIDASYON KURALARI - newTitle:
 * ✅ String tipinde olmalı
 * ✅ Boş olmamalı (empty string '')
 * ✅ null veya undefined olmamalı
 * ✅ Sadece space'lerden oluşmamalı (trim sonrası)
 * 
 * BAŞARILI YANIT:
 * HTTP Status: 200 OK
 * Response Body: Güncellenmiş Rota Objesi
 * {
 *   "id": "clh456def789",
 *   "userId": "user-123",
 *   "title": "Yeni Rota Başlığı",        ← Güncellenmiş
 *   "city": "İstanbul",
 *   "description": "Tarihî yarımada turunu içeren 3 günlük rota",
 *   "startDate": "2026-05-12T00:00:00Z",
 *   "endDate": "2026-05-14T23:59:59Z",
 *   "budgetType": "MODERATE",
 *   "createdAt": "2026-05-10T10:20:30Z",
 *   "updatedAt": "2026-05-18T15:30:00Z"  ← Otomatik güncellendi
 * }
 * 
 * HATA YANITI 1 - Validasyon Hatası (newTitle boş):
 * HTTP Status: 400 Bad Request
 * Response Body:
 * {
 *   "error": "Yeni rota başlığı boş olmamalı ve sadece space karakterlerinden oluşmamalıdır."
 * }
 * 
 * HATA YANITI 2 - Validasyon Hatası (newTitle null/undefined):
 * HTTP Status: 400 Bad Request
 * Response Body:
 * {
 *   "error": "Yeni rota başlığı gereklidir (newTitle alanı zorunludur)."
 * }
 * 
 * HATA YANITI 3 - Validasyon Hatası (Tip mismatch):
 * HTTP Status: 400 Bad Request
 * Response Body:
 * {
 *   "error": "Yeni rota başlığı string tipinde olmalıdır. Gelen tip: number"
 * }
 * 
 * HATA YANITI 4 - Rota Bulunamadı:
 * HTTP Status: 404 Not Found
 * Response Body:
 * {
 *   "error": "Rota bulunamadı. Rota ID: clh456def789"
 * }
 * 
 * HATA YANITI 5 - Geçersiz routeId:
 * HTTP Status: 400 Bad Request
 * Response Body:
 * {
 *   "error": "Rota ID parametresi gerekli ve boş olmayan bir metin olmalıdır."
 * }
 * 
 * ÖRNEK İSTEK (cURL):
 * -----
 * curl -X PATCH http://localhost:3000/api/routes/clh456def789/rename \
 *   -H "Content-Type: application/json" \
 *   -d '{"newTitle": "Yeni İstanbul Rotası"}'
 * 
 * ÖRNEK İSTEK (JavaScript/Fetch):
 * -----
 * fetch('http://localhost:3000/api/routes/clh456def789/rename', {
 *   method: 'PATCH',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     newTitle: 'Yeni İstanbul Rotası'
 *   })
 * })
 * .then(response => response.json())
 * .then(data => {
 *   if (data.error) {
 *     console.error('Hata:', data.error);
 *   } else {
 *     console.log('Rota başarıyla güncellendi:', data);
 *     console.log('Yeni başlık:', data.title);
 *   }
 * })
 * .catch(error => console.error('Network error:', error));
 * 
 * ÖRNEK İSTEK (Axios - TypeScript):
 * -----
 * import axios from 'axios';
 * 
 * interface UpdateRouteNameRequest {
 *   newTitle: string;
 * }
 * 
 * try {
 *   const response = await axios.patch(
 *     `http://localhost:3000/api/routes/${routeId}/rename`,
 *     {
 *       newTitle: 'Yeni Başlık'
 *     } as UpdateRouteNameRequest,
 *     {
 *       headers: {
 *         'Content-Type': 'application/json'
 *       }
 *     }
 *   );
 *   
 *   console.log('Rota başarıyla güncellendi');
 *   console.log('Yeni başlık:', response.data.title);
 * } catch (error) {
 *   if (error.response?.status === 404) {
 *     console.error('Rota bulunamadı');
 *   } else if (error.response?.status === 400) {
 *     console.error('Hata:', error.response.data.error);
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * 
 * İŞ MANTIKI - ARKADA NELER OLUYOR:
 * -------
 * 1. updateRouteName HTTP endpoint çağrılıyor
 * 2. Request body'den newTitle alınıyor
 * 3. routeId ve newTitle validasyonu yapılıyor
 *    - routeId boş mu? → Hata
 *    - newTitle boş mu? → Hata
 *    - newTitle null/undefined mi? → Hata
 *    - newTitle sadece space'ler mi? → Hata
 * 4. UpdateRouteNameUseCase.execute(routeId, newTitle) tetikleniyor
 * 5. Rota var mı kontrol ediliyor
 *    - Yoksa: RouteNotFoundError fırlatılıyor → 404 dönüyor
 *    - Varsa: Güncelleme işlemine devam ediliyor
 * 6. Rota güncelleniyor:
 *    - Sadece title alanı yeni değerle güncellenir
 *    - updatedAt alanı Prisma tarafından otomatik güncellenir
 *    - Diğer tüm alanlar (city, description, startDate, etc.) değişmez
 * 7. Güncellenmiş rota tüm bilgileri ile döndürülüyor
 * 8. 200 OK + rota JSON döndürülüyor
 * 
 * PARTIAL UPDATE AÇIKLAMASI:
 * -------
 * Bu endpoint, PATCH metodu kullanır çünkü:
 * - Sadece title alanı güncellenmesi hedeflenir
 * - Diğer alanlar gönderilmese bile korunur
 * 
 * PUT vs PATCH karşılaştırması:
 * - PUT /routes/:id      → Tüm rota değiştirilir (tüm alanlar yeniden gönderilmeli)
 * - PATCH /routes/:id    → Sadece verilen alanlar güncellenir
 * - PATCH /routes/:id/rename → Özel: Sadece title güncelleme operasyonu
 */

// ============================================
// 3. CLEAN ARCHITECTURE YAPISININ ÖZETİ
// ============================================

/**
 * LAYER STRUCTURE:
 * 
 * ┌─────────────────────────────────────────────────┐
 * │                   HTTP LAYER                     │
 * │      (Express Routes & Controllers)              │
 * │  - route.ts: Endpoint tanımlamaları              │
 * │  - RouteController: HTTP isteklerini işleme      │
 * └──────────────────────┬──────────────────────────┘
 *                        │
 * ┌──────────────────────▼──────────────────────────┐
 * │              APPLICATION LAYER                  │
 * │         (Use Cases - Business Logic)             │
 * │  - CreateRouteUseCase                            │
 * │  - GetRoutesByUserIdUseCase                      │
 * │  - GetRouteDetailsUseCase                        │
 * │  - DeleteRouteUseCase (YENİ)                    │
 * │  - UpdateRouteNameUseCase (YENİ)                │
 * └──────────────────────┬──────────────────────────┘
 *                        │
 * ┌──────────────────────▼──────────────────────────┐
 * │              DOMAIN LAYER                       │
 * │        (Entities & Business Rules)               │
 * │  - Route.ts (IRoute interface)                   │
 * │  - Stop.ts (IStop interface)                     │
 * │  - Custom Errors (RouteNotFoundError, etc.)      │
 * └──────────────────────┬──────────────────────────┘
 *                        │
 * ┌──────────────────────▼──────────────────────────┐
 * │           INFRASTRUCTURE LAYER                  │
 * │    (Prisma, External Services)                   │
 * │  - PrismaClient (Database)                       │
 * │  - GeminiAIService (AI Service)                  │
 * └─────────────────────────────────────────────────┘
 * 
 * 
 * DEPENDENCY INJECTION (DI) FLOW:
 * 
 * Infrastructure → Application → Presentation
 * 
 * PrismaClient
 *     │
 *     ├─→ DeleteRouteUseCase (constructor injection)
 *     ├─→ UpdateRouteNameUseCase (constructor injection)
 *     │
 *     └─→ RouteController
 *           │
 *           ├─ deleteRoute (method)
 *           └─ updateRouteName (method)
 *                 │
 *                 └─→ Express Routes
 *                       ├─ DELETE /routes/:routeId
 *                       └─ PATCH /routes/:routeId/rename
 */

// ============================================
// 4. YENİ DOSYALAR
// ============================================

/**
 * OLUŞTURULAN DOSYALAR:
 * 
 * 1. server/src/application/use-cases/DeleteRouteUseCase.ts
 *    - DeleteRouteUseCase sınıfı (rota silme iş mantığı)
 *    - RouteNotFoundError exception
 *    - Cascade delete mekanizması
 *    - Type-safe, JSDoc açıklamalı
 * 
 * 2. server/src/application/use-cases/UpdateRouteNameUseCase.ts
 *    - UpdateRouteNameUseCase sınıfı (title güncelleme iş mantığı)
 *    - RouteNotFoundError exception
 *    - ValidationError exception
 *    - Strict input validation
 *    - Type-safe, JSDoc açıklamalı
 * 
 * GÜNCELLENEN DOSYALAR:
 * 
 * 3. server/src/presentation/controllers/RouteController.ts
 *    + DeleteRouteUseCase import
 *    + UpdateRouteNameUseCase import
 *    + Constructor'a yeni parameters
 *    + deleteRoute() arrow function metodu
 *    + updateRouteName() arrow function metodu
 * 
 * 4. server/src/presentation/routes/route.ts
 *    + DeleteRouteUseCase import
 *    + UpdateRouteNameUseCase import
 *    + Singleton factory functions
 *    + getDeleteRouteUseCase() function
 *    + getUpdateRouteNameUseCase() function
 *    + getRouteController() güncelleme
 *    + DELETE /routes/:routeId endpoint
 *    + PATCH /routes/:routeId/rename endpoint
 */

// ============================================
// 5. TESTING ÖRNEKLERI (TypeScript)
// ============================================

/**
 * TEST KODU - Delete Route
 * 
 * import axios from 'axios';
 * 
 * async function testDeleteRoute() {
 *   const routeId = 'clh456def789';
 *   
 *   try {
 *     // Rota silme isteği
 *     const response = await axios.delete(
 *       `http://localhost:3000/api/routes/${routeId}`
 *     );
 *     
 *     // 204 No Content = Başarılı
 *     if (response.status === 204) {
 *       console.log('✅ Rota başarıyla silindi');
 *     }
 *   } catch (error: any) {
 *     if (error.response?.status === 404) {
 *       console.error('❌ Rota bulunamadı:', error.response.data);
 *     } else if (error.response?.status === 400) {
 *       console.error('❌ Hata:', error.response.data);
 *     }
 *   }
 * }
 * 
 * TEST KODU - Update Route Name
 * 
 * import axios from 'axios';
 * 
 * async function testUpdateRouteName() {
 *   const routeId = 'clh456def789';
 *   
 *   try {
 *     // Rota adı güncelleme isteği
 *     const response = await axios.patch(
 *       `http://localhost:3000/api/routes/${routeId}/rename`,
 *       {
 *         newTitle: 'Güncellenmiş Rota Adı'
 *       }
 *     );
 *     
 *     // 200 OK = Başarılı
 *     if (response.status === 200) {
 *       console.log('✅ Rota adı başarıyla güncellendi');
 *       console.log('📝 Yeni başlık:', response.data.title);
 *       console.log('🕐 Güncelleme tarihi:', response.data.updatedAt);
 *     }
 *   } catch (error: any) {
 *     if (error.response?.status === 404) {
 *       console.error('❌ Rota bulunamadı:', error.response.data);
 *     } else if (error.response?.status === 400) {
 *       console.error('❌ Validasyon hatası:', error.response.data);
 *     }
 *   }
 * }
 */

// ============================================
// 6. BAŞARILI DURUMLAR ÖZETI
// ============================================

/**
 * ✅ DELETE /routes/:routeId
 * - HTTP 204 No Content
 * - Response body: BOŞ
 * - Rota ve ilişkili Stop'lar silinir
 * - Cascade delete mekanizması aktif
 * 
 * ❌ DELETE /routes/:routeId (Hata)
 * - HTTP 404: Rota bulunamadı
 * - HTTP 400: Geçersiz parametreler
 * 
 * ✅ PATCH /routes/:routeId/rename
 * - HTTP 200 OK
 * - Response body: Güncellenmiş rota JSON'ı
 * - Sadece title alanı güncellenir
 * - updatedAt otomatik güncellenir
 * 
 * ❌ PATCH /routes/:routeId/rename (Hata)
 * - HTTP 400: Validasyon hatası (newTitle boş/null/sadece space'ler)
 * - HTTP 404: Rota bulunamadı
 * - HTTP 400: Geçersiz parametreler
 */
