// Express'in Request ve Response türlerini TypeScript ile güvenli kullanmak için import ediyoruz.
// 'type' anahtar kelimesi TypeScript'e bu importunun sadece tür tanımı için olduğunu söyler,
import type { Request, Response } from 'express';
import { CreateRouteUseCase } from '../../application/use-cases/CreateRouteUseCase.js';
import { BudgetType } from '../../domain/enums/BudgetType.js';

/**
 * RouteController
 * 
 * Sorumlulukları:
 * - HTTP istek/cevap işleme: req.body'den veri al, res ile cevap döndür
 * - İstek parametrelerini validasyon ve normalize etme (şehir adı, gün sayısı, bütçe)
 * - CreateRouteUseCase'i çağırarak rota oluşturmayı başlatma
 * - Başarı ve hata senaryolarını uygun HTTP status kodları ve JSON yanıtlarıyla işleme
 * 
 * Tasarım Deseni:
 * - Clean Architecture: Controller → UseCase → Service şeklinde katmanlı mimari
 * - Dependency Injection: CreateRouteUseCase dışarıdan enjekte ediliyor
 * - Single Responsibility: Her metod sadece bir görevi yapar
 */
export class RouteController {
  /**
   * Constructor - Dependency Injection
   * 
   * @param createRouteUseCase - CreateRouteUseCase örneği
   * 
   * Tasarım Nedenleri:
   * 1. Bağımlılıkları dışarıdan almak, testlerde mock kullanmayı kolaylaştırır
   * 2. private erişim belirleyicisi, bu değişkeni sadece sınıf içinde kullanılmasını garanti eder
   * 3. Yapıcı (constructor), Express route'u bağlanırken çağrılır
   * 
   * Örnek Express kullanımı:
   * const controller = new RouteController(createRouteUseCase);
   * app.post('/routes', controller.createRoute);
   */
  constructor(private createRouteUseCase: CreateRouteUseCase) {}

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
   *   city: "İstanbul",      // string: Şehir adı
   *   days: 3,               // number: Gezinin kaç gün olacağı
   *   budget: "STANDARD"     // BudgetType: ECONOMIC, STANDARD veya LUXURY
   * }
   * 
   * HTTP Yanıtları:
   * - 200 OK: Rota başarıyla oluşturuldu
   * - 400 Bad Request: Validation hatası veya işlem başarısız
   */
  createRoute = async (req: Request, res: Response): Promise<void> => {
    try {
  
      // İstek gövdesinden (body) gerekli veriler alınıyor.
      // Destructuring, kodun okunabilirliğini artırıyor.
      const { city, days, budget } = req.body;

    
      // CreateRouteUseCase.execute() metodunu çağırarak rota oluşturma işlemini başlatıyoruz.
      // Bu metod asenkron (async) olduğu için 'await' ile bekliyoruz.
      // Parametre olarak şehir, gün ve bütçe bilgisini iletiyoruz.
      const stops = await this.createRouteUseCase.execute(city, days, budget);

      
      // 200 status kodu: "OK - İstek başarılı"
      // res.json(): Veriyi otomatik olarak JSON'a çevirir ve Content-Type başlığını ayarlar
      // stops: Oluşturulan gezi noktalarının listesi
      res.status(200).json(stops);
    } catch (error) {
    
      // Eğer herhangi bir aşamada hata meydana gelirse (validasyon, AI servisi, vb.) buraya gelir.
      
      // Error nesnesinden mesajı çıkartıyoruz.
      // Eğer error bir Error nesnesi değilse, string'e çeviriyoruz.
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 400 status kodu: "Bad Request - İstek hatalı veya işlenemiyor"
      // error alanında detaylı hata mesajını gönderiyoruz ki istemci (frontend) bunu görebilsin
      res.status(400).json({ error: errorMessage });
    }
  };
}
