// Express'in Request ve Response türlerini TypeScript ile güvenli kullanmak için import ediyoruz.
// 'type' anahtar kelimesi TypeScript'e bu importunun sadece tür tanımı için olduğunu söyler,
import type { Request, Response } from 'express';
import { CreateRouteUseCase } from '../../application/use-cases/CreateRouteUseCase.js';
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
}
