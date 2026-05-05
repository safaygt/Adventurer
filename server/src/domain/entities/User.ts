/**
 * User Entity
 * 
 * Uygulamada kayıtlı kullanıcıları temsil eder.
 * Her kullanıcı birden fazla rota oluşturabilir.
 */
export interface IUser {
  /**
   * Kullanıcının benzersiz tanımlayıcısı (UUID)
   */
  id: string;

  /**
   * Kullanıcının e-posta adresi
   * Benzersiz ve giriş yaparken kullanılır
   */
  email: string;

  /**
   * Kullanıcının tam adı
   */
  name: string;

  /**
   * Kullanıcının profil resmi URL'si
   * @nullable
   */
  avatar: string | null;

  /**
   * Kaydın oluşturulma tarihi (ISO 8601 format)
   */
  createdAt: Date;

  /**
   * Kaydın son güncellenme tarihi (ISO 8601 format)
   */
  updatedAt: Date;
}
