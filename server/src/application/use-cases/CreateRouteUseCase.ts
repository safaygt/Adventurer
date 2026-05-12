import type { IRoute } from '../../domain/entities/Route.js';
import type { IStop } from '../../domain/entities/Stop.js';
import { BudgetType } from '../../domain/enums/BudgetType.js';
import { GeminiAIService } from '../../infrastructure/services/GeminiAIService.js';
import { PrismaClient as GeneratedPrismaClient, type Prisma } from '../../generated/prisma/client.js';
import type { BudgetType as PrismaBudgetType, StopType as PrismaStopType } from '../../generated/prisma/enums.js';

/**
 * CreateRouteUseCase
 * 
 * İş Mantığı Özeti:
 * Bu use case, bir şehir, gün sayısı, bütçe tipi, title ve opsiyonel userId alarak,
 * AI kullanarak kişiselleştirilmiş bir gezi rotası oluşturmaktan sorumludur.
 * 
 * Sorumlulukları:
 * 1. Giriş Yapan Kullanıcı: AI'dan rota oluştur → Prisma Transaction ile DB'ye kaydet
 * 2. Misafir Kullanıcı: AI'dan rota oluştur → Sadece JSON olarak döndür (DB'ye kayıt yapma)
 * 3. Parametreleri validasyon (şehir adı, gün sayısı, bütçe türü, title)
 * 4. Oluşan hatalar için uygun hata mesajları üretme
 * 
 * Dependency Injection prensibi uygulanmıştır:
 * - GeminiAIService ve PrismaClient dışarıdan enjekte ediliyor
 * - Bu sayede test edilebilir ve mock'lanabilir yapı sağlanıyor
 */
export class CreateRouteUseCase {
  /**
   * Constructor
   * 
   * @param geminiAIService - GeminiAIService örneği (Dependency Injection)
   * @param prismaClient - PrismaClient örneği (Dependency Injection)
   * 
   * Tasarım: Bağımlılıkları parametre olarak alıyoruz ki:
   * - Bağımlılık dışarıdan kontrol edilebilsin
   * - Test sırasında mock service kullanılabilsin
   * - Servisin değiştirilmesi kolay olsun
   */
  /**
   * ⚙️ CONSTRUCTOR - Bağımlılık Enjeksiyonu (Dependency Injection)
   * 
   * Bu sınıf, kendi bağımlılıklarını yaratmaz, dışarıdan alır.
   * Bu sayede:
   * - Test sırasında mock (sahte) objeler verebiliriz
   * - Gerçek objeler değiştirilmek istenirse, constructor çağrısı değişir (internal kod değil)
   * - Bağımlılıklar açıkça görülür
   */
  constructor(
    private geminiAIService: GeminiAIService,
    private prismaClient: GeneratedPrismaClient
  ) {}

  /**
   * execute - Asenkron olarak rota oluşturmayı başlatan ana metod
   * 
   * @param city - Gezi yapılacak şehir adı (ör: "İstanbul", "Antalya")
   * @param days - Gezinin süresi gün cinsinden (1-30 gün)
   * @param budget - Bütçe seviyesi (BUDGET, MODERATE, LUXURY)
   * @param title - Rotanın başlığı/adı
   * @param userId - (Opsiyonel) Kullanıcı ID'si. Boş ise misafir rotası olarak işlenir.
   * 
   * @returns Promise<IRoute> - Oluşturulan rota (DB'ye kaydedilmiş veya geçici)
   * @throws Error - Validasyon hatası, AI servisi hatası veya DB işlemi hatası durumunda
   * 
   * İş Akışı:
   * 1. Input Validasyonu: Parametreleri kontrol et
   * 2. Parametre Temizleme: Verileri normalize et
   * 3. AI Çağrısı: GeminiAIService.generateRoute'u çağır
   * 4. Kullanıcı Türüne Göre İşlem:
   *    - Giriş Yapan: Prisma Transaction ile DB'ye kaydet
   *    - Misafir: Sadece JSON olarak döndür
   * 5. Sonuç Dönüşü: Oluşturulan rotayı döndür
   */
  async execute(
    city: string,
    days: number,
    budget: BudgetType,
    title: string,
    userId?: string | null
  ): Promise<IRoute> {
    // ============================================
    // ADIM 1: INPUT VALIDASYONU
    // ============================================
    // Gelen verilerin güvenli ve uygun olup olmadığını kontrol ediyoruz.
    // Hatalı veriler durumunda erken dönüş yaparak sistem koruması sağlıyoruz.

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new Error(
        'Şehir adı gerekli ve boş olmayan bir metin olmalıdır.'
      );
    }

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      throw new Error(
        'Gün sayısı 1 ile 30 arasında bir tam sayı olmalıdır.'
      );
    }

    const validBudgetTypes = Object.values(BudgetType);
    if (!validBudgetTypes.includes(budget)) {
      throw new Error(
        `Bütçe türü şunlardan biri olmalıdır: ${validBudgetTypes.join(', ')}`
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error(
        'Rota başlığı (title) gerekli ve boş olmayan bir metin olmalıdır.'
      );
    }

    // ============================================
    // ADIM 2: PARAMETRE NORMALIZASYONU
    // ============================================
    const normalizedCity = city.trim();
    const normalizedTitle = title.trim();
    const isAuthenticatedUser = userId && userId.trim().length > 0;

    // ============================================
    // ADIM 3: AI SERVİSİ ÇAĞRISI
    // ============================================
    let stops: IStop[];
    try {
      stops = await this.geminiAIService.generateRoute(
        normalizedCity,
        days,
        budget
      );

      if (!Array.isArray(stops) || stops.length === 0) {
        throw new Error(
          'AI servisi geçerli durak listesi oluşturamadı. Lütfen tekrar deneyiniz.'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
      throw new Error(`Rota oluşturma başarısız: ${errorMessage}`);
    }

    // ============================================
    // ADIM 4: KULLANICI TÜRÜNE GÖRE İŞLEM
    // ============================================
    
    if (isAuthenticatedUser) {
      // ===== GİRİŞ YAPMIŞ KULLANICI - DATABASE İŞLEMLERİ =====
      // Bu kullanıcının userId'si var, bu nedenle rotasını veritabanına kaydedelim
      
      try {
        /**
         * 🔄 TRANSACTION NEDİR?
         * 
         * Transaction, veritabanında bir dizi işlemin "hep beraber başarılı" 
         * veya "hep beraber başarısız" olmasını garanti eder.
         * 
         * Örnek senaryo (Transaction olmadan):
         * 1. Route kaydı → Başarılı ✅
         * 2. Stops kaydı → Başarısız ❌ (network hatası)
         * Sonuç: Database'de orphan (sahipsiz) Route var, ama Stops yok!
         *        Bu veri bütünlüğü problemini create eder.
         * 
         * Transaction ile:
         * 1. Route kaydı → Başarılı ✅
         * 2. Stops kaydı → Başarısız ❌
         * Sonuç: ROLLBACK → Route kaydı da silinir! 
         *        Database clean state'e döner.
         * 
         * ATOMICITY GARANTISI: "A-tom-icity" = bölünemez
         * Ya tümü yapılır, ya hiçbiri yapılmaz. Kısmi durum mümkün değil.
         */
        const route = await this.prismaClient.$transaction(
          async (tx: Prisma.TransactionClient) => {
            /**
             * 📝 TX PARAMETRESI AÇIKLAMASI
             * 
             * tx = "TransactionClient" - Transaction bağlamında veritabanı işlemleri yapar
             * 
             * Normalde: this.prismaClient.route.create()
             * Transaction'da: tx.route.create()
             * 
             * Fark: tx kullanan tüm işlemler aynı transaction'da yürütülür.
             * Eğer birisi fail olursa, hepsi rollback olur.
             */
            
            // ADIM 1: Route Kaydını Oluştur
            // ============================
            // User'ın rotasını veritabanına yazıyoruz
            const createdRoute = await tx.route.create({
              data: {
                userId: userId!,  // Non-null assertion: userId var, null değil!
                title: normalizedTitle,
                city: normalizedCity,
                description: null,
                startDate: new Date(),
                endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
                // ⚠️ TYPE CASTING: Domain BudgetType → Prisma BudgetType
                // İkisi nominal olarak farklı olsa da, string değerleri aynı
                budgetType: budget as PrismaBudgetType,
              },
            });

            // ADIM 2: Tüm Stop'ları Toplu (Batch) Ekle
            // ============================================
            // AI'dan gelen durakları, createdRoute'un ID'siyle ilişkilendirerek ekleyelim
            const createdStops = await tx.stop.createMany({
              data: stops.map((stop) => ({
                routeId: createdRoute.id,  // Route'u bu stop'lara bağla
                order: stop.order,
                // ⚠️ TYPE CASTING: Domain StopType → Prisma StopType
                type: stop.type as PrismaStopType,
                name: stop.name,
                description: stop.description || null,
                location: stop.location || null,
                latitude: stop.latitude || null,
                longitude: stop.longitude || null,
                duration: stop.duration || null,
                estimatedCost: stop.estimatedCost || null,
                notes: stop.notes || null,
              })),
            });

            /**
             * ✅ TRANSACTION BAŞARILI
             * 
             * Eğer buraya kadar hiç hata olmadıysa:
             * - Route DB'ye yazıldı
             * - Tüm Stops DB'ye yazıldı
             * - Transaction COMMIT edilir (kaydedilir)
             * 
             * Eğer hata olsaydı, catch'e giderdi ve ROLLBACK olurdu.
             */
            return createdRoute;
          }
        );

        // Route'u IRoute interface formatına dönüştür
        // Bu, TypeScript type checking'i ve consistency'i sağlar
        return {
          id: route.id,
          userId: route.userId,
          title: route.title,
          description: route.description,
          city: (route as any).city || normalizedCity,
          startDate: route.startDate,
          endDate: route.endDate,
          // ⚠️ TYPE CASTING: Prisma BudgetType → Domain BudgetType
          // Dönen veriye dönüştürmeliyiz çünkü interface Domain tipi bekliyor
          budgetType: route.budgetType as BudgetType,
          createdAt: route.createdAt,
          updatedAt: route.updatedAt,
        };
      } catch (error) {
        /**
         * ❌ TRANSACTION BAŞARISIZ
         * 
         * Eğer DB işlemi sırasında hata olursa:
         * - Tüm işlemler otomatik ROLLBACK olur
         * - Veritabanında hiçbir değişiklik kalmaması
         * - Hatayı yakalar ve kullanıcıya bildiririz
         */
        const errorMessage =
          error instanceof Error ? error.message : 'Veritabanı hatası';
        throw new Error(`Rota veritabanına kaydedilemedi: ${errorMessage}`);
      }
    } else {
      // ===== MİSAFİR KULLANICI - DB'YE KAYIT YOK =====
      // userId null ya da boş geldi → Login olmamış kullanıcı
      // Bu durumda: Veritabanında depolama yapmaz, sadece JSON döndürürüz
      
      /**
       * 🎯 MİSAFİR ROTASININ MANTIKI
       * 
       * Neden DB'ye kaydetmiyoruz?
       * 1. Veritabanında kullanıcısız (orphan) rota istemiyoruz
       * 2. Misafir kullanıcı verisi geçici - session timeout'ta silinir
       * 3. Kullanıcı sonra login olursa, yeni bir rota oluşturur
       * 
       * Neden yine IRoute döndürüyoruz?
       * 1. Frontend için konsistent response format
       * 2. Session'da tutabilir (localStorage'da)
       * 3. Stops gösterebilir
       * 4. Daha sonra share/export yapabilir
       */
      const temporaryRouteId = 'temp-' + Date.now();
      // Geçici ID: "temp-1715500000000"
      // temp- prefix ile DB ID'lerinden ayırt edilebilir
      
      const now = new Date();

      // Tam bir IRoute objesi döndür, ama:
      // - id: Veritabanında olmayan geçici ID
      // - userId: null (çünkü user login olmamış)
      // - DB'de depolanmamış
      return {
        id: temporaryRouteId,
        userId: null,  // ← Misafir rotası belirteci
        title: normalizedTitle,
        description: null,
        city: normalizedCity,
        startDate: now,
        endDate: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
        budgetType: budget,
        createdAt: now,
        updatedAt: now,
      };
    }
  }
}
