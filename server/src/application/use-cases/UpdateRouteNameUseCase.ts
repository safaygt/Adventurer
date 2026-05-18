import type { IRoute } from '../../domain/entities/Route.js';
import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

/**
 * RouteNotFoundError
 * 
 * 🎯 Amaç:
 * Güncellemek istenen rota veritabanında bulunamadığında fırlatılan custom exception.
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
 * ValidationError
 * 
 * 🎯 Amaç:
 * Gelen parametrelerin validasyon kurallarını ihlal ettiğinde fırlatılan custom exception.
 * 
 * Örnek Hata Durumları:
 * - Yeni title boş string olursa
 * - Yeni title string tipinde değilse
 * - Yeni title sadece space'lerden oluşuyorsa
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * UpdateRouteNameUseCase
 * 
 * 📋 İş Mantığı Özeti:
 * Bu use case, belirli bir rotanın 'title' (adı) alanını güncellemekten sorumludur.
 * Diğer alanlar (city, description, startDate, endDate vb.) bu use case'te 
 * güncellenmez - sadece title'ın değiştirilmesi amacı taşır (Rename işlemi).
 * 
 * Validasyon Kuralları:
 * - Yeni title boş olmamalı (empty string, null, undefined)
 * - Yeni title string tipinde olmalı
 * - Yeni title sadece space'lerden oluşmamalı
 * - Silinmek istenen rota veritabanında var olmalı
 * 
 * Sorumlulukları:
 * 1. Gelen routeId ve newTitle parametrelerini validasyon
 * 2. newTitle için strict validasyon kuralları uygula
 * 3. Veritabanında bu ID'ye sahip rota var mı kontrol et
 * 4. Rota yoksa RouteNotFoundError fırlat
 * 5. Rota varsa title'ı güncelle
 * 6. Güncellenmiş rotayı IRoute formatında döndür
 * 
 * 🏗️ Clean Architecture:
 * - Use Case, domain business logic'ini encapsulate eder
 * - Dış katmanlara (Controller, Route) implementation detail'leri açılmaz
 * - Bağımlılıklar dependency injection ile yönetilir
 * 
 * 💼 SOLID Principles:
 * - Single Responsibility: Sadece rota title'ını güncellemekle sorumlu
 * - Dependency Inversion: Prisma'ya direkt bağımlı DEĞİL (interface üzerinden)
 * - Open/Closed: Yeni validasyon kuralları eklemek için esnektir
 * 
 * ⚡ Veri Bütünlüğü:
 * - Sadece title alanı güncellenir
 * - updatedAt alanı Prisma tarafından otomatik güncellenebilir
 * - Diğer alanlar hiçbir şekilde etkilenmez
 */
export class UpdateRouteNameUseCase {
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
   *     update: jest.fn().mockResolvedValue({ id: '123', title: 'Yeni İsim' })
   *   }
   * }
   * const useCase = new UpdateRouteNameUseCase(mockPrismaClient)
   */
  constructor(private prismaClient: GeneratedPrismaClient) {}

  /**
   * execute - Asenkron olarak rota title'ını güncelleyen ana metod
   * 
   * @param routeId - Güncellenecek rotanın ID'si (benzersiz tanımlayıcı)
   * @param newTitle - Rotanın yeni başlığı (adı)
   * @returns Promise<IRoute> - Güncellenmiş rota bilgileri
   * @throws ValidationError - Gelen parametreler validasyon kurallarını ihlal ettiğinde
   * @throws RouteNotFoundError - Rota veritabanında bulunamadığında
   * @throws Error - Parametre validasyon hatası veya DB işlemi hatası
   * 
   * 📊 İş Akışı (Adım Adım):
   * 
   * 1️⃣  INPUT VALIDASYONU - routeId
   *     Gelen routeId'nin geçerli olup olmadığını kontrol et
   *     - routeId boş olmamalı
   *     - routeId string tipinde olmalı
   *     - routeId trim edilmeli (space'ler kaldırılmalı)
   * 
   * 2️⃣  INPUT VALIDASYONU - newTitle (STRICT KONTROL)
   *     Gelen newTitle'ın geçerli olup olmadığını kontrol et
   *     - newTitle boş olmamalı (null, undefined, '')
   *     - newTitle string tipinde olmalı
   *     - newTitle sadece space'lerden oluşmamalı (trim sonrası check)
   *     - newTitle minimum ve maksimum uzunluk sınırlamalarına uymalı (isteğe bağlı)
   * 
   * 3️⃣  ROTANIN VARLIGI KONTROL ET
   *     Güncellemeden önce, güncellemek istenen rotanın veritabanında olup olmadığını kontrol et
   *     - findUnique() ile rota bul
   *     - Eğer null döndü = rota yok
   *     - RouteNotFoundError fırlat (404 Not Found durumuna karşılık)
   * 
   * 4️⃣  ROTAYI GÜNCELLE
   *     Eğer rota bulunduysa:
   *     - update() metodu ile title'ı güncelle
   *     - Prisma otomatik olarak updatedAt field'ını güncelleyecek
   *     - Diğer tüm alanlar değiştirilmez
   * 
   * 5️⃣  HATA YÖNETİMİ
   *     Validasyon hatası vs. durumunda:
   *     - Anlamlı hata mesajı ile Error fırlat
   * 
   * 📝 SQL Sorgusu (Arka planda - Prisma tarafından generate edilir):
   * 
   * ADIM 3 - Varlık Kontrolü:
   * SELECT "id" FROM "Route"
   * WHERE "id" = $1
   * LIMIT 1
   * 
   * ADIM 4 - Güncelleme:
   * UPDATE "Route"
   * SET "title" = $1, "updatedAt" = CURRENT_TIMESTAMP
   * WHERE "id" = $2
   * RETURNING *
   * 
   * 💡 Partial Update:
   * - Sadece title ve updatedAt alanları güncellenir
   * - Diğer alanlar (city, description, startDate, endDate vb.) hiçbir şekilde etkilenmez
   * - Database seviyesinde bu güvenlik sağlanır
   */
  async execute(routeId: string, newTitle: string): Promise<IRoute> {
    // ============================================
    // ✅ ADIM 1: routeId VALIDASYONU
    // ============================================
    // Gelen routeId'nin geçerli olup olmadığını kontrol ediyoruz.
    // Hatalı ID ile sorgu yapmamak için erken validasyon yaparız.

    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      throw new ValidationError(
        'Rota ID gereklidir ve boş olmayan bir metin olmalıdır.'
      );
    }

    // ============================================
    // ✅ ADIM 2: newTitle VALIDASYONU (STRICT KONTROL)
    // ============================================
    // Yeni title için katı validasyon kuralları uyguluyoruz.
    //
    // Neden Strict?
    // - Boş title'lar veritabanı bütünlüğünü bozar
    // - Sadece space'lerden oluşan title'lar anlamsız olur
    // - Type safety'nin sağlanması gerekir
    //
    // Kontrol Sırası:
    // 1. Null/Undefined/Empty check
    // 2. Type check
    // 3. Trim sonrası boş check (sadece space'ler)

    if (newTitle === null || newTitle === undefined) {
      throw new ValidationError('Yeni rota başlığı gereklidir (null veya undefined olamaz).');
    }

    if (typeof newTitle !== 'string') {
      throw new ValidationError(
        `Yeni rota başlığı string tipinde olmalıdır. Gelen tip: ${typeof newTitle}`
      );
    }

    // Space'leri kaldır ve boş olup olmadığını kontrol et
    const trimmedTitle = newTitle.trim();

    if (trimmedTitle.length === 0) {
      throw new ValidationError(
        'Yeni rota başlığı boş olmamalı ve sadece space karakterlerinden oluşmamalıdır.'
      );
    }

    // ============================================
    // 🔍 ADIM 3: ROTANIN VARLIGI KONTROL ET
    // ============================================
    // Güncellemeden önce, rotanın veritabanında olup olmadığını kontrol et.
    //
    // Neden Önemli?
    // - Kullanıcı hatalı ID gönderirse, güncellenmemiş bir rotanın güncellemiş gibi görünmesini
    //   önlemek için anlamlı hata mesajı döndürmeliyiz
    // - UPDATE işleminin başarılı olup olmadığını ancak bu kontrol ile bilebiliriz
    // - HTTP 404 dönmek için hata fırlatmalıyız

    try {
      // findUnique ile rota var mı kontrol et
      const existingRoute = await this.prismaClient.route.findUnique({
        where: {
          id: routeId,
        },
      });

      // ============================================
      // ❌ ADIM 3A: ROTA BULUNAMASA
      // ============================================
      // findUnique null döndü = rota DB'de yok
      // Anlamlı hata mesajı fırlat

      if (!existingRoute) {
        throw new RouteNotFoundError(routeId);
      }

      // ============================================
      // ✏️  ADIM 4: ROTAYI GÜNCELLE
      // ============================================
      // Rota bulundu! Şimdi title'ı güncelle.
      //
      // Update İşlemi:
      // - Sadece title alanı güncellenir
      // - updatedAt alanı Prisma tarafından otomatik güncellenebilir
      //   (schema.prisma'da @updatedAt directive varsa)
      // - Diğer tüm alanlar değiştirilmez (SELECT * verdiği için hepsi gelir)
      //
      // Sonuç:
      // 1. Title alanı yeni değerle güncellenir
      // 2. updatedAt otomatik güncellenir
      // 3. Güncellenmiş rota tüm bilgileri ile döner

      const updatedRoute = await this.prismaClient.route.update({
        where: {
          id: routeId,
        },
        data: {
          // Sadece title alanını güncelle
          title: trimmedTitle,
        },
      });

      // ============================================
      // ✅ ADIM 5: BAŞARILI SONUÇ DÖNDÜR
      // ============================================
      // Rota başarıyla güncellenmiştir.
      // Güncellenmiş rota bilgilerini döndür (IRoute formatında)

      return updatedRoute as IRoute;
    } catch (error) {
      // ============================================
      // ❌ ADIM 6: HATA YAKALAMA VE MESAJ OLUŞTURMA
      // ============================================

      // Eğer ValidationError veya RouteNotFoundError fırladıysak, onu direkt rethrow et
      if (error instanceof ValidationError || error instanceof RouteNotFoundError) {
        throw error;
      }

      // Diğer hataları kapsayıcı mesaj ile fırlat
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(
        `Rota başlığı güncellenirken hata oluştu. Rota ID: ${routeId}. Detay: ${errorMessage}`
      );
    }
  }
}
