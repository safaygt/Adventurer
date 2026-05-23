/**
 * ⭐ CUSTOM REACT HOOKS - HOOKS KÜTÜPHANESİ ⭐
 * 
 * Bu dosya, Frontend'in sıklıkla kullanacağı hook'ları merkezi bir yerde toplamıştır.
 * 
 * ❓ HOOK NEDİR?
 * Hook = React'te yazılan fonksiyon + state + lifecycle hooks + veri yönetimi
 * Aynı işlevi birden fazla component'te yapacaksan, hook'u bir kere yazıp,
 * farklı yerlerde kullan (tekrar yazma = DRY - Don't Repeat Yourself)
 * 
 * ❓ NEDEN HOOKS YAZIYORUZ?
 * 1. Kod Tekrarını Önlemek
 *    - useGetUserRoutes hook'unu yazdıktan sonra, tüm componentler bunu kullanabilir
 *    - Her component'te useQuery'yi tekrar yazmanız gerekmiyor
 * 
 * 2. Kod Bakımı Kolaylaştırması
 *    - Veri getirme logic'i değişirse, sadece hook'u değiştirir, tüm componentler otomatik güncellenir
 * 
 * 3. Component'leri Temiz Tutmak
 *    - Component'ler UI'e odaklanabilir, veri yönetimi hook'larda
 * 
 * ❓ REACT QUERY NEDİR?
 * React Query = Veri yönetimi kütüphanesi
 * - useQuery: Veri getirmek (@tanstack/react-query)
 * - useMutation: Veri değişikliği (silme, güncelleme, oluşturma)
 * - useQueryClient: Cache'i kontrol etmek (veriyi yenileme vs.)
 * 
 * ❓ CACHE NEDİR?
 * Cache = Daha önce getirilen veriyi bellekte tutmak
 * - Aynı veri tekrar istenirse, API çağrısı yapmadan bellekten alır (hızlı!)
 * - invalidateQueries() ile cache'i eski hale getiririz (veriyi yenile)
 * 
 * 📁 DOSYA ORGANİZASYONU
 * 1. ROUTE HOOKS (Rota ile ilgili işlemler)
 * 2. STOP HOOKS (Durak ile ilgili işlemler)
 * 3. UTILITY HOOKS (Yardımcı fonksiyonlar - state yönetimi değil)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IRoute, IStop } from '../types/index.js';
import routeService from '../services/routeService.js';

// ============================================================
// ROUTE HOOKS - ROTA İŞLEMLERİ
// ============================================================

/**
 * Hook1️⃣: useGetUserRoutes - Kullanıcının Rotalarını Getir
 * 
 * 🎯 AMACI: Belirli bir kullanıcının tüm rotalarını backend'den getirmek
 * 
 * ❓ NEDEN YAZILDI?
 * - RoutesPage.tsx'de kullanıcının rotaları listelemek gerekiyor
 * - useQuery ile yapılan veri getirme işlemini hook'a aldık
 * - Gelecekte başka component'ler de bu hook'u kullanabilir
 * 
 * 🔄 REACT QUERY ÖZELLİKLERİ:
 * - queryKey: Cache'i ayırt etmek için (routes, userId kombinasyonu)
 * - queryFn: Çalıştırılacak async fonksiyon (backend API çağrısı)
 * - enabled: !!userId (sadece userId varsa çalıştır, yoksa istemedir)
 * - staleTime: 5 dakika (5 dakika içinde tekrar çağrıda API'ye gitme, cache'den al)
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - data: Gelen rotalar listesi (IRoute[])
 * - isLoading: Veri yükleniyor mu? (true/false)
 * - error: Hata var mı? (Error objesi ya da null)
 * - refetch: Verileri yeniden getirmek için fonksiyon
 * - isPending: Yükleme devam ediyor mu?
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const { data: routes, isLoading, error } = useGetUserRoutes('user-123');
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * return <RotaListesi routes={data} />;
 */
export const useGetUserRoutes = (userId: string) => {
  return useQuery({
    queryKey: ['routes', userId], // Cache anahtarı
    queryFn: () => routeService.getUserRoutes(userId), // Backend API çağrısı
    enabled: !!userId, // Sadece userId varsa çalıştır
    staleTime: 5 * 60 * 1000, // Cache 5 dakika geçerli
  });
};

/**
 * Hook2️⃣: useGetRouteDetails - Belirli Bir Rotanın Detaylarını Getir
 * 
 * 🎯 AMACI: Tek bir rotanın detaylı bilgilerini getirmek (RouteDetailsPage'de kullanılır)
 * 
 * ❓ NEDEN YAZILDI?
 * - Rota detay sayfasında tek bir rotanın bilgisi gösterilir
 * - useQuery ile yapılan veri getirme işlemini hook'a aldık
 * - Aynı rota tekrar istenirse, cache'den alınır (hızlı!)
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - data: Gelen rota detayları (IRoute)
 * - isLoading: Veri yükleniyor mu?
 * - error: Hata var mı?
 * - refetch: Verileri yeniden getirmek için
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const { data: route } = useGetRouteDetails('route-456');
 */
export const useGetRouteDetails = (routeId: string) => {
  return useQuery({
    queryKey: ['route', routeId], // Rota ID'sine göre cache anahtar
    queryFn: () => routeService.getRouteDetails(routeId), // API çağrısı
    enabled: !!routeId, // Sadece routeId varsa çalıştır
    staleTime: 2 * 60 * 1000, // Cache 2 dakika geçerli (detail daha sık değişebilir)
  });
};

/**
 * Hook3️⃣: useDeleteRoute - Rota Silme İşlemini Yönet
 * 
 * 🎯 AMACI: Rotayı backend'den silmek ve sonrasında cache'i güncellemek
 * 
 * ❓ NEDEN YAZILDI?
 * - Rota silindiğinde, sadece silinmiyor, aynı zamanda cache'in güncellemesi gerekiyor
 * - useMutation ile yapılan silme işlemini hook'a aldık
 * - onSuccess callback ile cache otomatik yenilenir
 * 
 * 🔄 MUTATION NEDİR?
 * - useQuery: Veri getirme (read)
 * - useMutation: Veri değişikliği (create, update, delete - write)
 * - useMutation, API çağrısı başladığında, tamamlandığında vs. olay tetikler
 * 
 * ⚙️ CALLBACK'LER:
 * - onSuccess: Silme başarılı olunca → cache'i yenile
 *   invalidateQueries({ queryKey: ['routes'] }) = tüm routes query'lerini eskile
 *   Sonra React otomatik olarak useGetUserRoutes'ı yeniden çağırır
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - mutate(routeId): Silme işlemini başlat
 * - isPending: Silme işlemi devam ediyor mu?
 * - variables: Gönderilen parametreler
 * - isSuccess: Başarılı mı?
 * - error: Hata varsa
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const deleteRouteMutation = useDeleteRoute();
 * <button onClick={() => deleteRouteMutation.mutate('route-id')}>Sil</button>
 */
export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routeId: string) => routeService.deleteRoute(routeId),
    onSuccess: () => {
      // ✨ CACHE YENILEME: Tüm routes cache'lerini eski hale getir
      // React Query otomatik olarak useGetUserRoutes hook'unu yeniden çağırır
      // Sonuç: Silinen rota listeden kaybolur
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

/**
 * Hook4️⃣: useRenameRoute - Rota Adını Güncelle
 * 
 * 🎯 AMACI: Rotanın adını değiştirmek ve cache'i güncellemek
 * 
 * ❓ NEDEN YAZILDI?
 * - Rota adı değiştirildiğinde, sadece adı değişmiyor, cache de güncellenmesi gerekiyor
 * - useMutation ile yapılan güncelleme işlemini hook'a aldık
 * - onSuccess callback ile hem rota hem de liste cache'i güncellenir
 * 
 * ⚙️ CALLBACK'LER:
 * - onSuccess: Güncelleme başarılı olunca → cache'i yenile
 *   Hem spesifik rota hem de rota listesi cache'i yenilenir
 * - variables: Gönderilen routeId ve title'ı alır
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - mutate({ routeId, title }): Güncelleme işlemini başlat
 * - isPending: Güncelleme devam ediyor mu?
 * - variables: Gönderilen parametreler
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const renameRouteMutation = useRenameRoute();
 * <button onClick={() => renameRouteMutation.mutate({ routeId: 'id', title: 'Yeni Ad' })}>
 *   Kaydet
 * </button>
 */
export const useRenameRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, title }: { routeId: string; title: string }) =>
      routeService.renameRoute(routeId, { title }),
    onSuccess: (_, variables) => {
      // ✨ CACHE YENILEME: Hem spesifik rota hem de liste güncellenir
      queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

/**
 * Hook5️⃣: useCreateRoute - Yeni Rota Oluştur
 * 
 * 🎯 AMACI: Yeni bir rota oluşturmak ve cache'e eklemek
 * 
 * ❓ NEDEN YAZILDI?
 * - Yeni rota oluşturulduğunda, liste cache'i güncellenmelidir
 * - useMutation ile yapılan oluşturma işlemini hook'a aldık
 * - onSuccess callback ile rota listesi cache'i yenilenir
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - mutate(routeData): Yeni rota oluştur
 * - isPending: Oluşturma devam ediyor mu?
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const createRouteMutation = useCreateRoute();
 * createRouteMutation.mutate({
 *   title: 'Marmaris Turu',
 *   city: 'Marmaris',
 *   startDate: '2026-06-01',
 *   ...
 * });
 */
export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: routeService.createRoute,
    onSuccess: () => {
      // ✨ CACHE YENILEME: Rota listesi yenilenir (yeni rota eklenmiş olur)
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

// ============================================================
// STOP HOOKS - DURAK İŞLEMLERİ
// ============================================================

/**
 * Hook6️⃣: useGetStopDetails - Belirli Bir Durakın Detaylarını Getir
 * 
 * 🎯 AMACI: Tek bir durakın detaylı bilgilerini getirmek
 * 
 * ❓ NEDEN YAZILDI?
 * - Durak detay sayfasında tek bir durakın bilgisi gösterilir
 * - useQuery ile yapılan veri getirme işlemini hook'a aldık
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * - data: Durak detayları (IStop)
 * - isLoading: Veri yükleniyor mu?
 * - error: Hata var mı?
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const { data: stop } = useGetStopDetails('stop-789');
 */
export const useGetStopDetails = (stopId: string) => {
  return useQuery({
    queryKey: ['stop', stopId], // Durak ID'sine göre cache
    queryFn: () => routeService.getStopDetails(stopId), // API çağrısı
    enabled: !!stopId, // Sadece stopId varsa çalıştır
    staleTime: 2 * 60 * 1000, // Cache 2 dakika geçerli
  });
};

// ============================================================
// UTILITY HOOKS - YARDIMCI FONKSİYONLAR (State Yönetimi Değil)
// ============================================================

/**
 * Hook7️⃣: useRouteStats - Rota İstatistiklerini Hesapla
 * 
 * 🎯 AMACI: Bir rota hakkında istatistikler hesaplamak (API çağrısı yok!)
 * 
 * ❓ NEDEN HOOK OLARAK YAZILDI?
 * - Rota istatistiklerini hesaplama logic'i uzun ve karmaşık
 * - Aynı işlemi birden fazla component'te yapabiliriz
 * - Hook'a aldığımızda, tüm componentler paylaşabilir
 * - React hook naming convention'ına uyması için
 * 
 * ⚠️ DİKKAT: Bu hook veri getirmez (API çağrısı yok)
 * - useQuery/useMutation kullanmıyor
 * - Sadece işlem yapıyor (hesaplama)
 * - Prop olarak gelen rota verisi ile çalışıyor
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * {
 *   durationDays: 15,          // Rota süresi (gün sayısı)
 *   totalEstimatedCost: 5000,  // Tüm duraklarda tahmini maliyet toplamı
 *   totalDuration: 30,         // Tüm duraklarda harcanan saat toplamı
 *   stopCount: 5               // Durak sayısı
 * }
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const stats = useRouteStats(routeData);
 * console.log(stats.durationDays); // 15 gün
 * console.log(stats.totalEstimatedCost); // 5000 TL
 */
export const useRouteStats = (route: IRoute | undefined) => {
  // Eğer rota yoksa, boş istatistikler döndür
  if (!route) {
    return {
      durationDays: 0,
      totalEstimatedCost: 0,
      totalDuration: 0,
      stopCount: 0,
    };
  }

  // 📅 ROTA SÜRESİNİ HESAPLA
  // Başlangıç ve bitiş tarihleri arasında kaç gün fark var?
  const startDate = new Date(route.startDate);
  const endDate = new Date(route.endDate);
  // Milisaniye → gün (1000ms * 60s * 60m * 24h = 1 gün)
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // 💰 TOPLAM MALİYETİ HESAPLA
  // Tüm duraklardaki tahmini maliyetleri topla
  // reduce: Dizideki her elemanı döngüyle dolaş ve topla
  const totalEstimatedCost =
    route.stops?.reduce((sum, stop) => sum + (stop.estimatedCost || 0), 0) || 0;

  // ⏱️ TOPLAM SÜREYI HESAPLA
  // Tüm duraklarda harcanan süreleri topla
  const totalDuration =
    route.stops?.reduce((sum, stop) => sum + (stop.duration || 0), 0) || 0;

  return {
    durationDays,
    totalEstimatedCost,
    totalDuration,
    stopCount: route.stops?.length || 0,
  };
};

/**
 * Hook8️⃣: useGroupStopsByDay - Durakalrı Güne Göre Gruplandır
 * 
 * 🎯 AMACI: Durakları hangi gün olduklarına göre gruplamak
 * 
 * ❓ NEDEN YAZILDI?
 * - RouteDetailsPage'de durakalrı "1. Gün", "2. Gün", "3. Gün" diye göstermek istiyoruz
 * - Bunun için durağı gruplandırma logic'i gerekiyordu
 * - Hook'a aldığımızda, başka component'ler de kullanabilir
 * 
 * ⚠️ DİKKAT: Bu da utility hook'u (API çağrısı yok)
 * - Sadece dizileri düzenlemek (Array.reduce())
 * 
 * 📤 RETURN ETTİĞİ NESNE:
 * {
 *   1: [stop1, stop2],       // 1. Gün'ün durakalrı
 *   2: [stop3, stop4, stop5], // 2. Gün'ün durakalrı
 *   3: [stop6],              // 3. Gün'ün durakalrı
 * }
 * 
 * 💡 KULLANIM ÖRNEĞI:
 * const groupedStops = useGroupStopsByDay(route.stops);
 * 
 * // Sonra bu şekilde render edebilirsin:
 * Object.entries(groupedStops).map(([day, stops]) => (
 *   <div key={day}>
 *     <h3>{day}. Gün</h3>
 *     {stops.map(stop => <div key={stop.id}>{stop.name}</div>)}
 *   </div>
 * ))
 * 
 * 🔧 DETAYLI AÇIKLAMA - REDUCE FONKSİYONU:
 * 
 * reduce((accumulator, currentElement) => {
 *   // accumulator: Başlangıçta {} (boş obje)
 *   // Her döngüde accumulator güncellenir
 *   // currentElement: stops dizisinin sıradaki elemanı
 * }, {}) // {} = başlangıç değeri
 * 
 * Örnek:
 * stops = [
 *   { id: 1, dayNumber: 1, name: 'İstanbul' },
 *   { id: 2, dayNumber: 1, name: 'Eminönü' },
 *   { id: 3, dayNumber: 2, name: 'Ankara' }
 * ]
 * 
 * 1. İterasyon: stop = stops[0] (dayNumber: 1)
 *    acc[1] yoksa, acc[1] = [] oluştur
 *    acc[1].push(stop) → acc = { 1: [stop1] }
 * 
 * 2. İterasyon: stop = stops[1] (dayNumber: 1)
 *    acc[1] varsa, direk push et
 *    acc = { 1: [stop1, stop2] }
 * 
 * 3. İterasyon: stop = stops[2] (dayNumber: 2)
 *    acc[2] yoksa, acc[2] = [] oluştur
 *    acc[2].push(stop) → acc = { 1: [stop1, stop2], 2: [stop3] }
 */
export const useGroupStopsByDay = (stops: IStop[] | undefined) => {
  // Eğer durak yoksa, boş obje döndür
  if (!stops) return {};

  // stops dizisini döngüyle dolaş ve güne göre grupla
  return stops.reduce(
    (acc, stop) => {
      // Eğer bu gün için dizi yoksa, oluştur
      if (!acc[stop.dayNumber]) {
        acc[stop.dayNumber] = [];
      }
      // Durağı ilgili gün dizisine ekle
      acc[stop.dayNumber].push(stop);
      // Güncellenen accumulator'ı döndür
      return acc;
    },
    {} as Record<number, IStop[]> // Başlangıç değeri: boş obje
  );
};
