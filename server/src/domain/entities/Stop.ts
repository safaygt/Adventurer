import { StopType } from '../enums/StopType.js';

/**
 * Stop Entity
 * 
 * Bir rota içerisinde ziyaret edilecek durağı temsil eder.
 * Her durak bir rotaya ait ve sırayla düzenlenmiştir.
 * Konaklama, atraksiyon, restoran gibi çeşitli türde durağı içerebilir.
 */
export interface IStop {
  /**
   * Durağın benzersiz tanımlayıcısı (UUID)
   */
  id: string;

  /**
   * Bu durağın ait olduğu rotanın ID'si
   */
  routeId: string;

  /**
   * Rotadaki durak sırası
   * 1'den başlayan sıralama, rota boyunca ziyaret ediliş sırasını gösterir
   */
  order: number;

  /**
   * Durağın türü
   * ACCOMMODATION, ATTRACTION, RESTAURANT, ACTIVITY, TRANSPORT, OTHER
   */
  type: StopType;

  /**
   * Durağın adı
   * Örn: "Topkapı Sarayı", "Ümit Kebapçısı", "Four Seasons Hotel"
   */
  name: string;

  /**
   * Durağın açıklama metni
   * Detaylı bilgiler ve tavsiyeler içerebilir
   * @nullable
   */
  description: string | null;

  /**
   * Durağın tam adresi
   */
  location: string;

  /**
   * Durağın enlem koordinatı (WGS84)
   * @nullable
   */
  latitude: number | null;

  /**
   * Durağın boylam koordinatı (WGS84)
   * @nullable
   */
  longitude: number | null;

  /**
   * Durakta geçirilecek tahmini süre (dakika cinsinden)
   * Örn: 120 (2 saat), 180 (3 saat)
   * @nullable
   */
  duration: number | null;

  /**
   * Durakta harcanan tahmini maliyet (para birimi belirtilmeden)
   * Bütçe planlaması için kullanılır
   * @nullable
   */
  estimatedCost: number | null;

  /**
   * Durakla ilgili notlar ve ipuçları
   * Rehber tavsiyesi, özel bilgiler, vb.
   * @nullable
   */
  notes: string | null;

  /**
   * Kaydın oluşturulma tarihi (ISO 8601 format)
   */
  createdAt: Date;

  /**
   * Kaydın son güncellenme tarihi (ISO 8601 format)
   */
  updatedAt: Date;
}
