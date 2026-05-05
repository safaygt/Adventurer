import { BudgetType } from '../enums/BudgetType.js';

/**
 * Route Entity
 * 
 * Bir seyahat rotasını temsil eder.
 * Her rota bir kullanıcıya ait ve birden fazla duraktan oluşur.
 * Rota başlangıç şehri, tarih aralığı ve bütçe tipi gibi ana bilgileri içerir.
 */
export interface IRoute {
  /**
   * Rotanın benzersiz tanımlayıcısı (UUID)
   */
  id: string;

  /**
   * Rotayı oluşturan kullanıcının ID'si
   * Bir rota sadece bir kullanıcıya aittir
   */
  userId: string;

  /**
   * Rotanın başlığı
   * Örn: "Türkiye'ye 7 Günlük Gezi", "Akdeniz Turu"
   */
  title: string;

  /**
   * Rotanın açıklama metni
   * Rotayla ilgili detaylı bilgiler içerebilir
   * @nullable
   */
  description: string | null;

  /**
   * Rotanın başlangıç şehri
   * Örn: "İstanbul", "Antalya"
   */
  city: string;

  /**
   * Rotanın başlama tarihi
   */
  startDate: Date;

  /**
   * Rotanın bitiş tarihi
   */
  endDate: Date;

  /**
   * Rotanın bütçe kategorisi
   * ECONOMIC, STANDARD veya LUXURY
   */
  budgetType: BudgetType;

  /**
   * Kaydın oluşturulma tarihi (ISO 8601 format)
   */
  createdAt: Date;

  /**
   * Kaydın son güncellenme tarihi (ISO 8601 format)
   */
  updatedAt: Date;
}
