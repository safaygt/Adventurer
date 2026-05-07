import type { IStop } from '../../domain/entities/Stop.js';
import { BudgetType } from '../../domain/enums/BudgetType.js';
import { GeminiAIService } from '../../infrastructure/services/GeminiAIService.js';

/**
 * CreateRouteUseCase
 * 
 * İş Mantığı Özeti:
 * Bu use case, bir şehir, gün sayısı ve bütçe tipi alarak, AI kullanarak
 * kullanıcı için kişiselleştirilmiş bir gezi rotası oluşturmaktan sorumludur.
 * 
 * Sorumlulukları:
 * 1. Gelen parametreleri validasyon (şehir adı, gün sayısı, bütçe türü)
 * 2. Validasyon başarılı ise GeminiAIService'e rota oluşturmayı talep etme
 * 3. AI tarafından oluşturulan durakları (IStop[]) döndürme
 * 4. Oluşan hatalar için uygun hata mesajları üretme
 * 
 * Dependency Injection prensibi uygulanmıştır:
 * - GeminiAIService dışarıdan enjekte ediliyor
 * - Bu sayede test edilebilir ve mock'lanabilir yapı sağlanıyor
 */
export class CreateRouteUseCase {
  /**
   * Constructor
   * 
   * @param geminiAIService - GeminiAIService örneği (Dependency Injection)
   * 
   * Tasarım: GeminiAIService'i parametre olarak alıyoruz ki:
   * - Bağımlılık dışarıdan kontrol edilebilsin
   * - Test sırasında mock service kullanılabilsin
   * - Servisin değiştirilmesi kolay olsun
   */
  constructor(private geminiAIService: GeminiAIService) {}

  /**
   * execute - Asenkron olarak rota oluşturmayı başlatan ana metod
   * 
   * @param city - Gezi yapılacak şehir adı (ör: "İstanbul", "Antalya")
   * @param days - Gezinin süresi gün cinsinden (1-30 gün)
   * @param budget - Bütçe seviyesi (ECONOMIC, STANDARD, LUXURY)
   * 
   * @returns Promise<IStop[]> - Sıralanmış durak listesi
   * @throws Error - Validasyon hatası veya AI servisi hatası durumunda
   * 
   * İş Akışı:
   * 1. Input Validasyonu: Parametreleri kontrol et
   * 2. Parametre Temizleme: Şehir adını normalize et
   * 3. AI Çağrısı: GeminiAIService.generateRoute'u çağır
   * 4. Sonuç Dönüşü: Oluşturulan durakları döndür
   */
  async execute(
    city: string,
    days: number,
    budget: BudgetType
  ): Promise<IStop[]> {
    // ============================================
    // ADIM 1: INPUT VALIDASYONU
    // ============================================
    // Gelen verilerin güvenli ve uygun olup olmadığını kontrol ediyoruz.
    // Hatalı veriler durumunda erken dönüş yaparak sistem koruması sağlıyoruz.

    // Şehir adı boş veya geçersiz mi?
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new Error(
        'Şehir adı gerekli ve boş olmayan bir metin olmalıdır.'
      );
    }

    // Gün sayısı geçerli mi?
    // - Sayı olması gerekiyor
    // - En az 1 gün, en fazla 30 gün olabilir (makul limit)
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      throw new Error(
        'Gün sayısı 1 ile 30 arasında bir tam sayı olmalıdır.'
      );
    }

    // Bütçe türü geçerli mi?
    // Tanımlı olan bütçe tiplerinden biri olmalı
    const validBudgetTypes = Object.values(BudgetType);
    if (!validBudgetTypes.includes(budget)) {
      throw new Error(
        `Bütçe türü şunlardan biri olmalıdır: ${validBudgetTypes.join(', ')}`
      );
    }

    // ============================================
    // ADIM 2: PARAMETRE NORMALIZASYONU
    // ============================================
    // Kullanıcının girdisini temizliyoruz (başında/sonunda boşluk varsa sil)
    const normalizedCity = city.trim();

    // ============================================
    // ADIM 3: AI SERVİSİ ÇAĞRISI
    // ============================================
    // GeminiAIService'den rota oluşturmayı istiyoruz.
    // Bu işlem ağ üzerinden yapıldığı için asenkron (async) ve hata oluşabilir.
    // Hata meydana gelirse kullanıcıya dönmek yerine lokal olarak işlenecek.
    try {
      const stops: IStop[] = await this.geminiAIService.generateRoute(
        normalizedCity,
        days,
        budget
      );

      // ============================================
      // ADIM 4: SONUÇ DOĞRULAMA
      // ============================================
      // AI'dan gelen sonuç boş array değilse başarılı
      if (!Array.isArray(stops) || stops.length === 0) {
        throw new Error(
          'AI servisi geçerli durak listesi oluşturamadı. Lütfen tekrar deneyiniz.'
        );
      }

      // ============================================
      // ADIM 5: SONUÇ DÖNÜŞÜ
      // ============================================
      // Oluşturulan durakları döndürüyoruz.
      // Bu duraklar bir sonraki adımda Route entity'sine kaydedilecek.
      return stops;
    } catch (error) {
      // AI servisi hatasını yakalarız ve daha anlaşılır hale getirilir
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
      throw new Error(`Rota oluşturma başarısız: ${errorMessage}`);
    }
  }
}
