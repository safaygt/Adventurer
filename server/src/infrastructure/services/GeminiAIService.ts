import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IStop } from '../../domain/entities/Stop.js';
import { StopType } from '../../domain/enums/StopType.js';
import { BudgetType } from '../../domain/enums/BudgetType.js';


/**
 * GeminiAIService
 * 
 * Google Gemini AI API'sini kullanarak gezi rotaları oluşturan hizmet.
 * Belirtilen şehir, gün sayısı ve bütçe türüne göre detaylı durak listesi üretir.
 */
export class GeminiAIService {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY ortam değişkeni tanımlanmamış. Lütfen .env dosyasına ekleyin.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: 'gemini-3-flash-preview'
    });
  }

  /**
   * Belirtilen şehir, gün sayısı ve bütçe için bir gezi rotası oluşturur.
   * 
   * @param city - Gezi yapılacak şehir adı (ör: "Istanbul", "Paris")
   * @param days - Gezinin süresi gün cinsinden (ör: 3, 7, 14)
   * @param budget - Bütçe türü (ECONOMIC, STANDARD, LUXURY)
   * @returns IStop array'ı - Sıralanmış durak listesi
   * @throws Error - API çağrısı başarısız olursa
   */
  async generateRoute(
    city: string,
    days: number,
    budget: BudgetType
  ): Promise<IStop[]> {
    try {
      // Gemini'ye detaylı talimat gönderiyoruz
      const prompt = this.buildPrompt(city, days, budget);

      const response = await this.model.generateContent(prompt);
      const text = response.response.text();

      // JSON array'ını yanıttan çıkartıyoruz
      const stops = this.parseStopsFromResponse(text);

      return stops;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      throw new Error(`Gemini API hatası: ${errorMessage}`);
    }
  }

  /**
   * Gemini'ye gönderilecek prompt'u oluşturur.
   * Detaylı talimatlar ve JSON format beklentisi içerir.
   */
  private buildPrompt(
    city: string,
    days: number,
    budget: BudgetType
  ): string {
    return `Sen profesyonel bir gezi rehberisin. Bana ${city} şehri için ${days} günlük, ${budget} bütçeli bir rota hazırla.

KURALLAR:
1. Toplam durak sayısı: ${Math.min(days * 4, 20)} adet
2. Her durak için ZORUNLU alanlar:
   - name (durak adı)
   - type (ACCOMMODATION, ATTRACTION, RESTAURANT, ACTIVITY, TRANSPORT, OTHER)
   - description (neden ziyaret etmeli)
   - location (tam adres)
   - order (sıra numarası, 1'den başla)
   - dayNumber (hangi güne ait olduğu, 1'den başla)
3. OPSIYONEL alanlar:
   - duration (dakika cinsinden, 30-180 arası)
   - estimatedCost (sayısal maliyet)
   - notes (rehber tavsiyeleri)
   - latitude, longitude (opsiyonel)
4. Bütçe seviyesine göre maliyet:
   - ECONOMIC: Düşük maliyet, bilinmeyen yerler
   - STANDARD: Orta seviye, ünlü yerler
   - LUXURY: Pahalı, eksklusif mekanlar
5. Rota mantıklı bir sırada olmalı (aynı bölgedeki yerler yanyana)
6. **GÜN AYIRMA KURALı**: Oluşturduğun durakları günlere ayır. Her bir durağın hangi güne ait olduğunu dayNumber alanında belirt. Birbirine yürüme mesafesinde veya yakın olan yerleri aynı gün içine grupla. Günlük akış sabah, öğle ve akşam şeklinde mantıklı bir sırada olsun.

YANIT FORMATI (JSON Array - hiçbir başka metin ekleme):
[
  {
    "name": "string",
    "type": "ACCOMMODATION" | "ATTRACTION" | "RESTAURANT" | "ACTIVITY" | "TRANSPORT" | "OTHER",
    "description": "string",
    "location": "string",
    "order": number,
    "dayNumber": number,
    "duration": number | null,
    "estimatedCost": number | null,
    "notes": "string" | null,
    "latitude": number | null,
    "longitude": number | null
  }
]

Sadece geçerli JSON döndür, başka yazı yazma!`;
  }

  /**
   * Gemini yanıtından stops array'ını çıkartıp parse eder.
   * JSON parsing hatalarını yönetir.
   */
  private parseStopsFromResponse(response: string): IStop[] {
    try {
      // Yanıttan JSON array'ını bulup çıkartıyoruz
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('Yanıtta JSON array bulunamadı');
      }

      const jsonString = jsonMatch[0];
      const stopsData = JSON.parse(jsonString);

      // Stops array'ını validate edip transform ediyoruz
      const stops: IStop[] = stopsData.map(
        (stop: any, index: number): IStop => {
          // Gerekli alanları kontrol ediyoruz
          if (!stop.name || !stop.type || !stop.location) {
            throw new Error(
              `Durak #${index} için gerekli alanlar eksik: name, type, location`
            );
          }

          // StopType validation
          if (!Object.values(StopType).includes(stop.type)) {
            throw new Error(
              `Durak #${index} için geçersiz type: ${stop.type}`
            );
          }

          return {
            id: this.generateUUID(), // Yeni UUID üretiyoruz
            routeId: '', // Route oluşturulurken atanacak
            order: stop.order ?? index + 1,
            type: stop.type as StopType,
            name: String(stop.name).trim(),
            description: stop.description ? String(stop.description).trim() : null,
            location: String(stop.location).trim(),
            dayNumber: typeof stop.dayNumber === 'number' ? stop.dayNumber : 1,
            duration: typeof stop.duration === 'number' ? stop.duration : null,
            estimatedCost:
              typeof stop.estimatedCost === 'number' ? stop.estimatedCost : null,
            notes: stop.notes ? String(stop.notes).trim() : null,
            latitude: typeof stop.latitude === 'number' ? stop.latitude : null,
            longitude: typeof stop.longitude === 'number' ? stop.longitude : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      );

      return stops;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen parsing hatası';
      throw new Error(`Stop parsing hatası: ${errorMessage}`);
    }
  }

  /**
   * RFC4122 v4 formatında random UUID üretir.
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
