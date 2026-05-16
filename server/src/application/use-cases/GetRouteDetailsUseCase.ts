import type { IRoute } from '../../domain/entities/Route.js';
import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

/**
 * RouteNotFoundError
 * 
 * 🎯 Amaç:
 * Aranan rota veritabanında bulunamadığında fırlatılan custom exception.
 * 
 * 💡 Neden Custom Error?
 * - Hata türünü açık hale getirmeleri (catch'te fark edilebilir)
 * - Hata mesajı standardlaştırılır
 * - Application layer'da özel işlem yapılabilir (HTTP 404 döndermek gibi)
 * 
 * 🏗️ Clean Architecture Principle: Domain Entities and Exceptions
 * - Hata türleri domain layer'ına ait
 * - Application layer'da use-case specific hataları tanımlarız
 */
export class RouteNotFoundError extends Error {
  constructor(routeId: string) {
    super(`Rota bulunamadı. Rota ID: ${routeId}`);
    this.name = 'RouteNotFoundError';
  }
}

/**
 * GetRouteDetailsUseCase
 * 
 * 📋 İş Mantığı Özeti:
 * Bu use case, belirli bir rotanın TÜZEL detaylarını (route + tüm stops'ları)
 * veritabanından alır ve döndürür.
 * 
 * Eğer rota bulunamazsa, anlamlı bir hata fırlatır (RouteNotFoundError).
 * Rotanın yapısını ve tüm durakları görmek için idealdir.
 * 
 * Sorumlulukları:
 * 1. Gelen routeId parametresini validasyon
 * 2. Prisma'dan o rota ID'sine ait rotayı + tüm stops'ları getir
 * 3. Rota bulunamazsa RouteNotFoundError fırlat
 * 4. Veritabanı işlemi hatası durumunda anlamlı hata mesajı üret
 * 5. Rotayı IRoute formatında döndür (stops dahil)
 * 
 * 🏗️ Clean Architecture:
 * - Use Case, domain business logic'ini encapsulate eder
 * - Dış katmanlara (Controller, Route) implementation detail'leri açılmaz
 * - Bağımlılıklar dependency injection ile yönetilir
 * 
 * 💼 SOLID Principles:
 * - Single Responsibility: Sadece rota detaylarını almakla sorumlu
 * - Dependency Inversion: Prisma'ya direkt bağımlı DEĞİL (interface üzerinden)
 * - Open/Closed: Yeni hata tipleri eklemek için kapatılmış, rozluk için açık
 * 
 * ⚡ Performans Notu:
 * Include kullanılarak, 1 sorgu ile rota + tüm stops'ları getiririz.
 * N+1 problemi OLMAZ, çünkü include Prisma tarafından JOIN ile optimize edilir.
 */
export class GetRouteDetailsUseCase {
  /**
   * ⚙️ CONSTRUCTOR - Bağımlılık Enjeksiyonu
   * 
   * @param prismaClient - Prisma ORM Client'ı (Dependency Injection)
   * 
   * 🎯 Bağımlılık Enjeksiyonu Neden Önemli:
   * - Unit test yazarken mock client verebiliriz
   * - Gerçek DB bağlantısı test sırasında yapılmaz (daha hızlı)
   * - Farklı DB implementasyonları kolayca değiştirilir
   * 
   * Örnek Test Kullanımı:
   * const mockPrismaClient = {
   *   route: {
   *     findUnique: jest.fn().mockResolvedValue({ id: '123', ... })
   *   }
   * }
   * const useCase = new GetRouteDetailsUseCase(mockPrismaClient)
   */
  constructor(private prismaClient: GeneratedPrismaClient) {}

  /**
   * execute - Asenkron olarak rota detaylarını getiren ana metod
   * 
   * @param routeId - Detayları getirilecek rotanın ID'si
   * @returns Promise<IRoute> - Rota bilgileri (Stops dahil)
   * @throws RouteNotFoundError - Rota veritabanında bulunamadığında
   * @throws Error - Parametre validasyon hatası veya DB işlemi hatası
   * 
   * 📊 İş Akışı (Adım Adım):
   * 
   * 1️⃣  INPUT VALIDASYONU
   *     Gelen routeId'nin geçerli olup olmadığını kontrol et
   *     - routeId boş olmamalı
   *     - routeId string tipinde olmalı
   *     - routeId trim edilmeli (space'ler kaldırılmalı)
   * 
   * 2️⃣  VERITABANINDAN ROTA SORGULAMASI
   *     Prisma findUnique() ile:
   *     - routeId'ye göre benzersiz rotayı bul
   *     - ÖNEMLI: include: { stops: true } kullanarak
   *       → Route ve tüm ilişkili Stop'ları tek sorgu ile getir
   *       → Prisma bunu SQL LEFT JOIN ile optimize eder
   *       → N+1 query problemi OLMAZ
   * 
   * 3️⃣  ROTA BULUNAMASA
   *     Eğer findUnique null dönerse:
   *     - Rotanın veritabanında olmadığı anlamına gelir
   *     - RouteNotFoundError exception'ı fırlat
   *     - Bu exception Controller'da catch'lenerek HTTP 404 gönderilebilir
   * 
   * 4️⃣  ROTA BULUNDUYSA
   *     Stops'lar include ile beraber geldi
   *     Rotayı döndür:
   *     - stops array'i route object'inin içinde bulunur
   *     - stops büyükten küçüğe sıralanır (order field'ı)
   * 
   * 5️⃣  HATA YÖNETİMİ
   *     Veritabanı bağlantı hatası vs. durumunda:
   *     - Anlamlı hata mesajı ile Error fırlat
   * 
   * 📝 SQL Sorgusu (Arka planda - Prisma tarafından generate edilir):
   * SELECT "Route".*, "Stop".*
   * FROM "Route"
   * LEFT JOIN "Stop" ON "Route"."id" = "Stop"."routeId"
   * WHERE "Route"."id" = $1
   * ORDER BY "Stop"."order" ASC
   */
  async execute(routeId: string): Promise<IRoute> {
    // ============================================
    // ✅ ADIM 1: INPUT VALIDASYONU
    // ============================================
    // Gelen verinin geçerli olup olmadığını kontrol ediyoruz.
    // Hatalı ID ile sorgu yapmamak için erken validasyon yaparız.

    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      throw new Error('Rota ID gereklidir ve boş olmayan bir metin olmalıdır.');
    }

    // ============================================
    // 🔄 ADIM 2: VERITABANINDAN ROTAYI GETIR (STOPS İLE BİRLİKTE)
    // ============================================
    // Prisma findUnique() ile:
    // - Rotayı ID'ye göre benzersiz şekilde buluruz (Primary Key)
    // - include: { stops: true } ile tüm ilişkili Stops'ları birlikte getiririz
    //
    // 🚀 Performans: 
    // Prisma bunu SQL JOIN ile optimize eder, tek sorgu kullanılır.
    // N+1 problemi OLMAZ (eski yöntemde her stop için ayrı query yapılırdı)
    //
    // 📊 Dönen Data:
    // {
    //   id: 'route-uuid',
    //   title: 'İstanbul Rotası',
    //   city: 'İstanbul',
    //   stops: [
    //     { id: 'stop-1', name: 'Topkapı Sarayı', order: 1, ... },
    //     { id: 'stop-2', name: 'Galata Kulesi', order: 2, ... },
    //   ],
    //   ...
    // }

    try {
      const route = await this.prismaClient.route.findUnique({
        where: {
          // Arama Koşulu: Bu ID'ye sahip rotayı bul
          id: routeId,
        },
        // İlişkileri Include Et: Route'un tüm Stop'larını birlikte getir
        include: {
          stops: {
            // İç Query Ayarları: Stops'ları order field'ına göre sırala
            orderBy: {
              order: 'asc', // 1. gün, 2. gün, 3. gün sırası
            },
          },
        },
      });

      // ============================================
      // ❌ ADIM 3: ROTA BULUNAMASA - ERRORr FIRLATacak
      // ============================================
      // findUnique() null döndü = rota DB'de yok
      // Kullanıcıya anlamlı hata mesajı sağla

      if (!route) {
        throw new RouteNotFoundError(routeId);
      }

      // ============================================
      // ✅ ADIM 4: BAŞARILI SONUÇ DÖNDÜR
      // ============================================
      // Rota bulundu ve stops ile beraber geldi.
      // IRoute formatında döndürüyoruz (TypeScript type safety).
      //
      // 💡 Dönen route'ta:
      // - Tüm Route bilgileri vardır (id, title, city, startDate, endDate, etc.)
      // - stops array'i vardır (tüm duraklar, order'a göre sıralı)
      // - Type safe olarak IRoute interface'ini karşılar

      return route as IRoute;
    } catch (error) {
      // ============================================
      // ❌ ADIM 5: HATA YAKALAMA VE MESAJ OLUŞTURMA
      // ============================================
      // Hata türlerine göre farklı davranış:
      //
      // A) RouteNotFoundError: Rota bulunamadı (normal durum, kontrollü)
      //    → Direkt hata fırlat, Controller catch'leyecek
      //
      // B) Diğer Errorlar: DB bağlantısı vs. sorun (sistem hatası)
      //    → Anlamlı hata mesajı ile kapat ve fırlat

      // Eğer RouteNotFoundError ise, direkt olarak yeniden fırlat
      if (error instanceof RouteNotFoundError) {
        throw error;
      }

      // Diğer hatalar için anlamlı mesaj oluştur
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
      throw new Error(
        `Rota detaylarını getirirken bir hata oluştu: ${errorMessage}`
      );
    }
  }
}
