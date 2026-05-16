import type { IRoute } from '../../domain/entities/Route.js';
import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

/**
 * GetRoutesByUserIdUseCase
 * 
 * 📋 İş Mantığı Özeti:
 * Bu use case, belirli bir kullanıcıya ait TÜM rotaları veritabanından alır ve listeler.
 * Performans nedeniyle, rotaların içindeki duraklar (Stops) dahil EDILMEZ.
 * Kullanıcının rotalarını hızlı bir şekilde listelemek için idealdir.
 * 
 * Sorumlulukları:
 * 1. Gelen userId parametresini validasyon
 * 2. Prisma'dan o kullanıcıya ait tüm rotaları getir (stops dahil edilmeyecek)
 * 3. Veritabanı işlemi hatası durumunda anlamlı hata mesajı üret
 * 4. Rotaları IRoute[] formatında döndür
 * 
 * 🏗️ Clean Architecture:
 * - Bağımlılıklar dışarıdan enjekte edilir (Dependency Injection)
 * - Use Case tek bir sorumluluğa sahiptir (Single Responsibility Principle)
 * - Infrastructure (Prisma) layer ile bağımlılık yoktur, abstract edilmiştir
 * 
 * ⚡ Performans Notu:
 * Stops dahil edilmediğinden, N+1 query problemi yaşanmaz ve liste işlemi hızlıdır.
 * Eğer stops detaylarına ihtiyaç varsa, GetRouteDetailsUseCase kullanılmalıdır.
 */
export class GetRoutesByUserIdUseCase {
  /**
   * ⚙️ CONSTRUCTOR - Bağımlılık Enjeksiyonu
   * 
   * @param prismaClient - Prisma ORM Client'ı (Dependency Injection)
   * 
   * Tasarım Felsefesi:
   * - Prisma Client bu sınıfın içinde new'lenmez, dışarıdan enjekte edilir
   * - Bu sayede:
   *   • Test sırasında mock Prisma Client verebiliriz
   *   • Gerçek implementasyon değişirse, bu sınıf değişmez
   *   • Sınıf birden fazla projede kullanılabilir hale gelir
   */
  constructor(private prismaClient: GeneratedPrismaClient) {}

  /**
   * execute - Asenkron olarak kullanıcı rotalarını getiren ana metod
   * 
   * @param userId - Rotaları getirilecek kullanıcının ID'si
   * @returns Promise<IRoute[]> - Kullanıcıya ait rota listesi (Stops dahil değil)
   * @throws Error - Parametre validasyon hatası veya DB işlemi hatası durumunda
   * 
   * 📊 İş Akışı (Adım Adım):
   * 
   * 1️⃣  INPUT VALIDASYONU
   *     Gelen userId'nin geçerli olup olmadığını kontrol et
   *     - userId boş olmamalı
   *     - userId string tipinde olmalı
   * 
   * 2️⃣  PRISMA QUERY ÇALIŞTIRILMASI
   *     veritabanından sorguyu çalıştır:
   *     - userId ile eşleşen TÜM rotaları getir
   *     - Sadece rota özet bilgileri (id, title, city, startDate, endDate, budgetType vb.)
   *     - Stops dahil ETME (performans için)
   * 
   * 3️⃣  HATA YÖNETİMİ
   *     Veritabanı bağlantı hatası vs. durumunda:
   *     - Anlamlı hata mesajı ile exception fırlat
   * 
   * 4️⃣  SONUÇ DÖNDÜRME
   *     Rotaları IRoute[] formatında döndür
   *     - Hiç rota yoksa boş array [] döndür (hata değil, normal durum)
   * 
   * 📝 SQL Sorgusu (Arka planda):
   * SELECT * FROM "Route" WHERE "userId" = $1
   * ORDER BY "createdAt" DESC
   * (Stops dahil EDILMEZ, sadece Route bilgileri döner)
   */
  async execute(userId: string): Promise<IRoute[]> {
    // ============================================
    // ✅ ADIM 1: INPUT VALIDASYONU
    // ============================================
    // Gelen verinin geçerli olup olmadığını kontrol ediyoruz.
    // Yanlış veri ile DB query'si çalıştırmamak için erken validasyon yaparız.

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error(
        'Kullanıcı ID gereklidir ve boş olmayan bir metin olmalıdır.'
      );
    }

    // ============================================
    // 🔄 ADIM 2: VERITABANINDAN ROTALARI GETIR
    // ============================================
    // Prisma Client kullanarak kullanıcıya ait tüm rotaları sorguladık.
    // 
    // 🎯 NOT: findMany() çağrısında "include: { stops: true }" YOK!
    //    Çünkü:
    //    - Listede sadece rota özetlerine ihtiyaç var
    //    - Her rotanın tüm stops'ları getirmek N+1 problem yaratır
    //    - Performans için stops'lar çıkartıldı
    //
    // Sonuç: Her rota object'inde 'stops' field'ı undefined olur
    // Eğer stops'lara ihtiyaç varsa, GetRouteDetailsUseCase kullanılmalıdır

    try {
      const routes = await this.prismaClient.route.findMany({
        where: {
          // Sorgu Koşulu: Sadece verilen userId'ye ait rotaları getir
          userId: userId,
        },
        // Sıralama: En yeni oluşturulan rotalar önce
        orderBy: {
          createdAt: 'desc',
        },
        // Stops dahil ETME - sadece rota ana bilgileri getir
        // include: { stops: false } - default olarak false'dir, yazmasak da olur
      });

      // ============================================
      // ✅ ADIM 3: BAŞARILI SONUÇ DÖNDÜR
      // ============================================
      // Veritabanı sorgusu başarılı oldu.
      // Rotaları IRoute[] tipinde döndürüyoruz.
      //
      // 💡 Açıklama:
      // - routes boş array olabilir (kullanıcının rotası yoksa) - bu hata DEĞİL
      // - Her rota IRoute interface'ini karşılar (Prisma, DB schema ile match)
      // - Hata durumunda, aşağıdaki catch bloğu çalışacak

      return routes as IRoute[];
    } catch (error) {
      // ============================================
      // ❌ ADIM 4: HATA YAKALAMA VE MESAJ OLUŞTURMA
      // ============================================
      // Veritabanı sorgusu başarısız oldu.
      // Kullanıcıya ve log sistemine anlamlı hata mesajı sağlayalım.
      //
      // Olası Hatalar:
      // - Veritabanı bağlantısı koptu
      // - Prisma Client hatalı
      // - Sorgu syntax hatası
      // - Yetkilendirme sorunu

      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
      throw new Error(
        `Rotaları getirirken bir hata oluştu: ${errorMessage}`
      );
    }
  }
}
