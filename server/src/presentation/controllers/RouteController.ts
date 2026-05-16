// Express'in Request ve Response türlerini TypeScript ile güvenli kullanmak için import ediyoruz.
// 'type' anahtar kelimesi TypeScript'e bu importunun sadece tür tanımı için olduğunu söyler,
import type { Request, Response } from 'express';
import { CreateRouteUseCase } from '../../application/use-cases/CreateRouteUseCase.js';
import { GetRoutesByUserIdUseCase } from '../../application/use-cases/GetRoutesByUserIdUseCase.js';
import { GetRouteDetailsUseCase, RouteNotFoundError } from '../../application/use-cases/GetRouteDetailsUseCase.js';
import { BudgetType } from '../../domain/enums/BudgetType.js';
import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

/**
 * 🌐 ROUTECONTROLLER - HTTP KATMANI
 * 
 * Sorumlulukları:
 * - HTTP istek/cevap işleme: req.body'den veri al, res ile cevap döndür
 * - İstek parametrelerini validasyon ve normalize etme
 * - CreateRouteUseCase'i çağırarak iş mantığını execute etme
 * - Başarı ve hata senaryolarını uygun HTTP status kodları ile işleme
 * 
 * Tasarım Deseni:
 * - Clean Architecture: Controller → UseCase → Service şeklinde katmanlı mimari
 * - Dependency Injection: CreateRouteUseCase dışarıdan enjekte ediliyor
 * - HTTP Agnostic: Controller HTTP'ye özgü, business logic'i HTTP'den izole eder
 */
export class RouteController {
  /**
   * ⚙️ CONSTRUCTOR - Bağımlılık Enjeksiyonu
   * 
   * @param createRouteUseCase - İş mantığını içeren use case
   * @param prismaClient - Veritabanı client (future use)
   * 
   * Neden DI?
   * - Test sırasında mock CreateRouteUseCase verebiliriz
   * - Gerçek ve test ortamlarında farklı implementations kullanılabilir
   * - Bağımlılıklar açıkça görülür
   */
  constructor(
    private createRouteUseCase: CreateRouteUseCase,
    private getRoutesByUserIdUseCase: GetRoutesByUserIdUseCase,
    private getRouteDetailsUseCase: GetRouteDetailsUseCase,
    private prismaClient: GeneratedPrismaClient
  ) {}

  /**
   * createRoute - Yeni bir gezi rotası oluşturan HTTP endpoint metodu
   * 
   * Arrow function (=>) olarak tanımlanmasının sebebi:
   * - Express route'larında 'this' context'i kaybediliyor
   * - Arrow function, dış kapsamın 'this'ini korur
   * - Böylece this.createRouteUseCase'e erişim sağlanır
   * 
   * Beklenen İstek Format (req.body):
   * {
   *   city: "İstanbul",          // string: Şehir adı (gerekli)
   *   days: 3,                   // number: Gezinin kaç gün olacağı (gerekli)
   *   budget: "MODERATE",        // BudgetType: BUDGET, MODERATE veya LUXURY (gerekli)
   *   title: "İstanbul Gezisi",  // string: Rota başlığı (gerekli)
   *   userId: "user-id-123"      // string: Kullanıcı ID'si (opsiyonel)
   *                              // Boş veya yoksa → Misafir rotası (DB'ye kayıt yapılmaz)
   * }
   * 
   * HTTP Yanıtları:
   * - 201 Created: Rota başarıyla oluşturuldu ve DB'ye kaydedildi (giriş yapan kullanıcı)
   * - 200 OK: Rota başarıyla oluşturuldu ancak DB'ye kaydedilmedi (misafir)
   * - 400 Bad Request: Validation hatası, AI hatası veya DB hatası
   * 
   * Yanıt Body (IRoute):
   * {
   *   id: "route-id-123",        // Rota ID'si (authentic: DB ID, guest: temp ID)
   *   userId: "user-id-123",     // Kullanıcı ID'si (authentic) veya null (guest)
   *   title: "İstanbul Gezisi",
   *   description: null,
   *   city: "İstanbul",
   *   startDate: "2026-05-12T...",
   *   endDate: "2026-05-15T...",
   *   budgetType: "MODERATE",
   *   createdAt: "2026-05-12T...",
   *   updatedAt: "2026-05-12T..."
   * }
   */
  createRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      // İstek gövdesinden (body) gerekli veriler alınıyor.
      // Destructuring, kodun okunabilirliğini artırıyor.
      const { city, days, budget, title, userId } = req.body;

      // Validasyon: Gerekli alanlar var mı?
      if (!city || !days || !budget || !title) {
        res.status(400).json({
          error: 'Gerekli alanlar eksik. city, days, budget ve title alanları gerekli.',
        });
        return;
      }

      // CreateRouteUseCase.execute() metodunu çağırarak rota oluşturma işlemini başlatıyoruz.
      // Bu metod asenkron (async) olduğu için 'await' ile bekliyoruz.
      // Parametreler: şehir, gün, bütçe, title, userId (opsiyonel)
      const route = await this.createRouteUseCase.execute(
        city,
        days,
        budget,
        title,
        userId || null
      );

      // Kullanıcı türüne göre farklı status kod döndür
      // Giriş Yapan: 201 Created (DB'ye kaydedildi)
      // Misafir: 200 OK (sadece JSON döndürüldü)
      const statusCode = route.userId ? 201 : 200;
      res.status(statusCode).json(route);
    } catch (error) {
      // Eğer herhangi bir aşamada hata meydana gelirse (validasyon, AI servisi, DB, vb.) buraya gelir.

      // Error nesnesinden mesajı çıkartıyoruz.
      // Eğer error bir Error nesnesi değilse, string'e çeviriyoruz.
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 400 status kodu: "Bad Request - İstek hatalı veya işlenemiyor"
      // error alanında detaylı hata mesajını gönderiyoruz ki istemci (frontend) bunu görebilsin
      res.status(400).json({ error: errorMessage });
    }
  };

  /**
   * getRoutesByUserId - Belirli bir kullanıcının tüm rotalarını listeleyen HTTP endpoint metodu
   * 
   * Arrow function kullanılır (this context'i korumak için)
   * 
   * Beklenen İstek Format:
   * URL Parametresi:
   * GET /routes/user/:userId
   * 
   * Örnek: GET /routes/user/clh123abc456
   * 
   * HTTP Yanıtları:
   * - 200 OK: Rotalar başarıyla getirildi (liste boş olabilir)
   * - 400 Bad Request: userId parametresi eksik veya hatalı
   * 
   * Yanıt Body (IRoute[]):
   * [
   *   {
   *     id: "route-id-1",
   *     userId: "clh123abc456",
   *     title: "İstanbul Rotası",
   *     city: "İstanbul",
   *     startDate: "2026-05-12T...",
   *     endDate: "2026-05-15T...",
   *     budgetType: "MODERATE",
   *     ...
   *   },
   *   {
   *     id: "route-id-2",
   *     userId: "clh123abc456",
   *     title: "Antalya Rotası",
   *     city: "Antalya",
   *     ...
   *   }
   * ]
   * 
   * 📝 Not: 
   * - Stops dahil EDILMEZ (performans için, sadece rota özeti)
   * - Hiç rota yoksa boş array [] döndürülür (hata değil, normal durum)
   * - userId boş veya null ise 400 hatası döndürülür
   */
  getRoutesByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      // URL parametresinden userId'yi al
      // URL: GET /routes/user/:userId
      // req.params.userId bu parametreyi içerir
      const userId = req.params.userId;

      // Validasyon: userId parametresi var mı ve string tipi mi?
      // Express'te req.params değerleri string | string[] olabilir
      // Bu yüzden önce type check yapmalıyız
      if (typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
          error: 'Kullanıcı ID parametresi gerekli ve boş olmayan bir metin olmalıdır.',
        });
        return;
      }

      // ============================================
      // 🎯 USE CASE ÇALIŞTIRILMASI
      // ============================================
      // GetRoutesByUserIdUseCase.execute() metodunu çağırarak
      // verilen userId'ye ait tüm rotaları getiriyoruz
      //
      // await: Asenkron işlemin tamamlanmasını bekle
      // routes: Dönen rota listesi (IRoute[])
      // Stops dahil OLMAZ, sadece rota summary'leri

      const routes = await this.getRoutesByUserIdUseCase.execute(userId);

      // ============================================
      // ✅ BAŞARILI YANIT
      // ============================================
      // 200 OK: Başarıyla işlendi
      // JSON body'de routes array'ini döndür
      // Liste boş olabilir, bu normal durum

      res.status(200).json(routes);
    } catch (error) {
      // ============================================
      // ❌ HATA YAKALAMA
      // ============================================
      // UseCase veya Prisma'dan hata geldi
      // Hata mesajını extract et ve HTTP 400 ile döndür

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      res.status(400).json({ error: errorMessage });
    }
  };

  /**
   * getRouteDetails - Belirli bir rotanın tüm detaylarını (stops ile) getiren HTTP endpoint metodu
   * 
   * Arrow function kullanılır (this context'i korumak için)
   * 
   * Beklenen İstek Format:
   * URL Parametresi:
   * GET /routes/:routeId
   * 
   * Örnek: GET /routes/clh456def789
   * 
   * HTTP Yanıtları:
   * - 200 OK: Rota başarıyla getirildi (Stops dahil)
   * - 404 Not Found: Rota veritabanında bulunamadı
   * - 400 Bad Request: routeId parametresi eksik veya veritabanı hatası
   * 
   * Yanıt Body (IRoute - Stops dahil):
   * {
   *   id: "route-id-123",
   *   userId: "clh123abc456",
   *   title: "İstanbul Rotası",
   *   city: "İstanbul",
   *   description: "Tarihî yarımada turunu içeren 3 günlük rota",
   *   startDate: "2026-05-12T00:00:00Z",
   *   endDate: "2026-05-14T23:59:59Z",
   *   budgetType: "MODERATE",
   *   stops: [
   *     {
   *       id: "stop-1",
   *       routeId: "route-id-123",
   *       order: 1,
   *       name: "Topkapı Sarayı",
   *       type: "ATTRACTION",
   *       description: "Osmanlı padişahlarının ikamet ettiği saray...",
   *       location: "Cankurtaran, İstanbul",
   *       latitude: 41.0136,
   *       ...
   *     },
   *     {
   *       id: "stop-2",
   *       routeId: "route-id-123",
   *       order: 2,
   *       name: "Galata Kulesi",
   *       type: "ATTRACTION",
   *       ...
   *     }
   *   ],
   *   createdAt: "2026-05-10T10:20:30Z",
   *   updatedAt: "2026-05-10T10:20:30Z"
   * }
   * 
   * 📝 Notlar:
   * - Stops dahil EDILIR ve order'a göre sıralıdır (Gün 1, Gün 2, etc.)
   * - Rota bulunamazsa RouteNotFoundError fırlatılır → HTTP 404 döndürülür
   * - Stops array'i, rota içerisinde stops field'ında bulunur
   * 
   * 🔍 Fark: getRoutesByUserId vs getRouteDetails
   * - getRoutesByUserId: Birden fazla rota, stops YOK, hızlı liste
   * - getRouteDetails: Bir rota, stops VAR, detaylı bilgi
   */
  getRouteDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      // URL parametresinden routeId'yi al
      // URL: GET /routes/:routeId
      // req.params.routeId bu parametreyi içerir
      const routeId = req.params.routeId;

      // Validasyon: routeId parametresi var mı ve string tipi mi?
      // Express'te req.params değerleri string | string[] olabilir
      // Bu yüzden önce type check yapmalıyız
      if (typeof routeId !== 'string' || routeId.trim().length === 0) {
        res.status(400).json({
          error: 'Rota ID parametresi gerekli ve boş olmayan bir metin olmalıdır.',
        });
        return;
      }

      // ============================================
      // 🎯 USE CASE ÇALIŞTIRILMASI
      // ============================================
      // GetRouteDetailsUseCase.execute() metodunu çağırarak
      // verilen routeId'ye ait rotayı (stops ile beraber) getiriyoruz
      //
      // await: Asenkron işlemin tamamlanmasını bekle
      // route: Dönen rota object'i (IRoute - stops dahil)
      //
      // Olası Exceptions:
      // - RouteNotFoundError: Rota DB'de yok (404 ile handle edecek)
      // - Error: Validasyon veya DB bağlantı hatası (400 ile handle edecek)

      const route = await this.getRouteDetailsUseCase.execute(routeId);

      // ============================================
      // ✅ BAŞARILI YANIT
      // ============================================
      // 200 OK: Rota başarıyla bulundu ve döndürüldü
      // JSON body'de rota object'ini (stops dahil) döndür

      res.status(200).json(route);
    } catch (error) {
      // ============================================
      // ❌ HATA YAKALAMA VE HTTP STATUS BELIRLEME
      // ============================================
      // Hata türüne göre farklı HTTP status kodu döndürüyoruz:
      //
      // 1) RouteNotFoundError → 404 Not Found
      //    "Rota bulunamadı" anlamında standart HTTP response
      //
      // 2) Diğer Errorlar → 400 Bad Request
      //    Validasyon hatası veya sistem hatası

      if (error instanceof RouteNotFoundError) {
        // ============================================
        // 🔴 404 NOT FOUND - Rota Bulunamadı
        // ============================================
        const errorMessage = error.message;
        res.status(404).json({ error: errorMessage });
      } else {
        // ============================================
        // 🟡 400 BAD REQUEST - Diğer Hatalar
        // ============================================
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        res.status(400).json({ error: errorMessage });
      }
    }
  };
}
