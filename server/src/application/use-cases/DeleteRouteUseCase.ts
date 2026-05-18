import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

/**
 * RouteNotFoundError
 * 
 * 🎯 Amaç:
 * Silinmek istenen rota veritabanında bulunamadığında fırlatılan custom exception.
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
 * DeleteRouteUseCase
 * 
 * 📋 İş Mantığı Özeti:
 * Bu use case, belirli bir rotayı veritabanından silmekten sorumludur.
 * Rota silindiğinde, o rotaya bağlı TÜM duraklar (Stops) otomatik olarak silinir.
 * 
 * Cascade Delete Mekanizması:
 * - Prisma schema'sında onDelete: Cascade tanımlıdır
 * - Route silinince, Stop tablosundaki ilişkili tüm kayıtlar otomatik silinir
 * - Bu sayede orphan (sahipsiz) Stop kayıtları kalması önlenir
 * 
 * Sorumlulukları:
 * 1. Gelen routeId parametresini validasyon
 * 2. Veritabanında bu ID'ye sahip rota var mı kontrol et
 * 3. Rota yoksa RouteNotFoundError fırlat
 * 4. Rota varsa sil (Cascade delete ile stops'lar da silinir)
 * 5. Silinme başarılı olursa void döndür
 * 
 * 🏗️ Clean Architecture:
 * - Use Case, domain business logic'ini encapsulate eder
 * - Dış katmanlara (Controller, Route) implementation detail'leri açılmaz
 * - Bağımlılıklar dependency injection ile yönetilir
 * 
 * 💼 SOLID Principles:
 * - Single Responsibility: Sadece rota silmekle sorumlu
 * - Dependency Inversion: Prisma'ya direkt bağımlı DEĞİL (interface üzerinden)
 * - Open/Closed: Yeni hata tipleri eklemek için kapatılmış, esneklik için açık
 * 
 * ⚡ Performans & Veri Bütünlüğü:
 * - İlişkili tüm stops'lar Cascade Delete ile silinir
 * - Veritabanı seviyesinde veri bütünlüğü sağlanır
 * - Orphan kayıt problemi OLMAZ
 */
export class DeleteRouteUseCase {
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
   *     delete: jest.fn().mockResolvedValue({ id: '123' })
   *   }
   * }
   * const useCase = new DeleteRouteUseCase(mockPrismaClient)
   */
  constructor(private prismaClient: GeneratedPrismaClient) {}

  /**
   * execute - Asenkron olarak rota silen ana metod
   * 
   * @param routeId - Silinecek rotanın ID'si (benzersiz tanımlayıcı)
   * @returns Promise<void> - Başarılı silinme durumunda hiçbir şey döndürmez
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
   * 2️⃣  ROTA VARLIGI KONTROL ET
   *     Silinmeden önce, rotanın veritabanında olup olmadığını kontrol et
   *     - findUnique() ile rota bul
   *     - Eğer null döndü = rota yok
   *     - RouteNotFoundError fırlat (404 Not Found durumuna karşılık)
   * 
   * 3️⃣  ROTAYI SIL
   *     Eğer rota bulunduysa:
   *     - delete() metodu ile rotayı sil
   *     - Prisma schema'sında onDelete: Cascade tanımlı olduğundan
   *       → Stop tablosundaki ilişkili tüm kayıtlar otomatik silinir
   *       → Orphan (sahipsiz) kayıt kalması önlenir
   * 
   * 4️⃣  HATA YÖNETİMİ
   *     Veritabanı bağlantı hatası vs. durumunda:
   *     - Anlamlı hata mesajı ile Error fırlat
   * 
   * 📝 SQL Sorguları (Arka planda - Prisma tarafından generate edilir):
   * 
   * ADIM 2 - Varlık Kontrolü:
   * SELECT "id" FROM "Route"
   * WHERE "id" = $1
   * LIMIT 1
   * 
   * ADIM 3 - Silme (Cascade ile):
   * DELETE FROM "Stop" WHERE "routeId" = $1    (Auto executed)
   * DELETE FROM "Route" WHERE "id" = $1
   * 
   * 💡 Cascade Delete Açıklaması:
   * - Prisma schema.prisma dosyasında:
   *   route Route @relation(..., onDelete: Cascade)
   * - Bu setting, Stop silinmeden Route silinirse,
   *   ilişkili Stop'ları otomatik siler
   * - Veritabanı seviyesinde ilişkisel bütünlük sağlanır
   */
  async execute(routeId: string): Promise<void> {
    // ============================================
    // ✅ ADIM 1: INPUT VALIDASYONU
    // ============================================
    // Gelen verinin geçerli olup olmadığını kontrol ediyoruz.
    // Hatalı ID ile sorgu yapmamak için erken validasyon yaparız.

    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      throw new Error('Rota ID gereklidir ve boş olmayan bir metin olmalıdır.');
    }

    // ============================================
    // 🔍 ADIM 2: ROTANIN VARLIGI KONTROL ET
    // ============================================
    // Silinmeden önce, silinmek istenen rotanın veritabanında olup olmadığını kontrol et.
    // 
    // Neden Önemli?
    // - Kullanıcı hatalı ID gönderirse, silinmemiş bir rotanın silinmiş gibi görünmesini
    //   önlemek için anlamlı hata mesajı döndürmeliyiz
    // - DELETE işleminin başarılı olup olmadığını ancak bu kontrol ile bilebiliriz
    //   (Çünkü delete() hata fırlatmadan false döndürebilir)
    // - HTTP 404 dönmek için hata fırlatmalıyız

    try {
      // findUnique ile rota var mı kontrol et (performans için sadece id getir)
      const existingRoute = await this.prismaClient.route.findUnique({
        where: {
          id: routeId,
        },
        // Performans: Sadece id bilgisine ihtiyacımız var (var/yok kontrolü için)
        select: {
          id: true,
        },
      });

      // ============================================
      // ❌ ADIM 2A: ROTA BULUNAMASA
      // ============================================
      // findUnique null döndü = rota DB'de yok
      // Anlamlı hata mesajı fırlat

      if (!existingRoute) {
        throw new RouteNotFoundError(routeId);
      }

      // ============================================
      // 🗑️  ADIM 3: ROTAYI SIL
      // ============================================
      // Rota bulundu! Şimdi delete() ile rotayı sil.
      //
      // Cascade Delete Mekanizması:
      // - Schema.prisma'da Stop model'inde:
      //   route Route @relation(..., onDelete: Cascade)
      // - Bu ayar, Route silinince ilişkili Stop'ları otomatik siler
      // - Prisma bunu SQL düzeyinde transaction ile yönetir
      // - İlişkisel bütünlük sağlanır (orphan Stop kalması OLMAZ)
      //
      // Sonuç:
      // 1. Stop tablosundaki routeId = $1 kayıtları silinir
      // 2. Route tablosundaki id = $1 kaydı silinir
      // 3. Hepsi tek transaction'da yapılır (atomicity)

      await this.prismaClient.route.delete({
        where: {
          id: routeId,
        },
      });

      // ============================================
      // ✅ ADIM 4: BAŞARILI SONUÇ
      // ============================================
      // Rota başarıyla silinmiştir.
      // İlişkili Stop'lar da Cascade Delete ile silinmiştir.
      // void döndürüyoruz (başarısızlık durumunda exception fırlatıldı)

    } catch (error) {
      // ============================================
      // ❌ ADIM 5: HATA YAKALAMA VE MESAJ OLUŞTURMA
      // ============================================

      // Eğer RouteNotFoundError fırladıysak, onu direkt rethrow et
      if (error instanceof RouteNotFoundError) {
        throw error;
      }

      // Diğer hataları kapsayıcı mesaj ile fırlat
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new Error(
        `Rota silinirken hata oluştu. Rota ID: ${routeId}. Detay: ${errorMessage}`
      );
    }
  }
}
