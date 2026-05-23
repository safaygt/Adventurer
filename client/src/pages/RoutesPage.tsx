/**
 * RoutesPage Component
 * 
 * Kullanıcının tüm rotalarını listeleyen ana sayfa.
 * Rotaları kart şeklinde gösterir, silme ve yeniden adlandırma işlemleri yapılabilir.
 * 
 * ÖNEMLI AÇIKLAMA:
 * Bu component'te hook'lar (useGetUserRoutes, useDeleteRoute, useRenameRoute) kullanıyoruz.
 * Hooks, tekrar kullanılabilir veri yönetimi fonksiyonları. Böylece aynı kodu farklı yerlerde 
 * tekrarlamak yerine, hook'ları import edip kullanıyoruz.
 * 
 * Özellikler:
 * - React Query ile veri yönetimi ve caching
 * - Custom hooks ile temiz, okunabilir kod
 * - Error boundary ve loading state'leri
 * - Responsive grid tasarım
 */

import React from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import type { IRoute } from '../types/index.js';
import RouteCard from '../components/RouteCard.js';
import routeService from '../services/routeService.js';
import { useNavigate } from 'react-router-dom';
// Custom hook'ları import ediyoruz
import { useGetUserRoutes, useDeleteRoute, useRenameRoute } from '../hooks/index.js';

/**
 * RoutesPage Bileşeni
 * 
 * Bu component'in görevleri:
 * 1. Rotaları listele (useGetUserRoutes hook'u ile)
 * 2. Rota silme işlemini yönet (useDeleteRoute hook'u ile)
 * 3. Rota adı değiştir (useRenameRoute hook'u ile)
 * 4. RouteCard component'lerine callback'ler ilet
 * 
 * @example
 * <RoutesPage />
 */
export const RoutesPage: React.FC = () => {
  // Router hook'u - sayfalar arası geçiş için
  const navigate = useNavigate();

  // Hardcoded userId (gelecekte auth sisteminden alınacak)
  // TODO: Auth context'den userId alınacak
  const userId = 'test-user-1';

  // 📌 Hook1: Kullanıcının rotalarını getir
  // useGetUserRoutes hook'u tanımlanmış hooks/index.ts'de
  // React Query'nin sağladığı caching ve refetch özellikleri burada kullanılıyor
  const {
    data: routes = [],
    isLoading,
    error,
    refetch,
  } = useGetUserRoutes(userId);

  // 📌 Hook2: Rota silme işlemini yönet
  // Bu hook silindiğinde otomatik olarak cache'i güncelliyor
  // onSuccess callback'i sayesinde lista yenileniyor
  const deleteRouteMutation = useDeleteRoute();

  // 📌 Hook3: Rota adı güncelleme işlemini yönet
  // Bu hook da silindiğinde otomatik olarak cache'i güncelliyor
  const renameRouteMutation = useRenameRoute();

  /**
   * ❗ CALLBACK FONKSIYON: handleDeleteRoute
   * 
   * Ne işe yarıyor?
   * - RouteCard component'ten silme talebi geldiğinde çalışır
   * - deleteRouteMutation.mutate() çağrısı yaparak backend'e silme isteği gönderir
   * 
   * Parametreler:
   * - routeId: Silinecek rotanın ID'si (RouteCard'den geliyor)
   * 
   * Akış:
   * RoutesPage -> handleDeleteRoute -> deleteRouteMutation.mutate() -> Backend API
   */
  const handleDeleteRoute = (routeId: string) => {
    deleteRouteMutation.mutate(routeId);
  };

  /**
   * ❗ CALLBACK FONKSIYON: handleRenameRoute
   * 
   * Ne işe yarıyor?
   * - RouteCard component'ten yeniden adlandırma talebi geldiğinde çalışır
   * - renameRouteMutation.mutate() çağrısı yaparak backend'e güncelleme isteği gönderir
   * 
   * Parametreler:
   * - routeId: Adı değiştirilecek rotanın ID'si (RouteCard'den geliyor)
   * - newTitle: Rota'nın yeni adı (RouteCard'deki input'tan geliyor)
   * 
   * Akış:
   * RoutesPage -> handleRenameRoute -> renameRouteMutation.mutate() -> Backend API
   */
  const handleRenameRoute = (routeId: string, newTitle: string) => {
    renameRouteMutation.mutate({ routeId, title: newTitle });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Rotalarınız yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Hata Oluştu</h2>
          <p className="text-red-700 mb-4">{routeService.getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Gezi Rotalarım</h1>
            <p className="text-gray-600 mt-1">
              {routes.length > 0
                ? `${routes.length} rota${routes.length !== 1 ? 'nız var' : 'nız var'}`
                : 'Henüz bir rotanız yok'}
            </p>
          </div>

          {/* Yeni Rota Oluştur Butonu */}
          <button
            onClick={() => navigate('/routes/create')}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Yeni Rota Oluştur
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Eğer rota yoksa boş durum */}
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">🗺️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Henüz Rotanız Yok</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              İlk gezi rotanızı oluşturmaya başlayın ve harika bir yolculuk planlayın!
            </p>
            <button
              onClick={() => navigate('/routes/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              İlk Rotamı Oluştur
            </button>
          </div>
        ) : (
          // Rotaların Grid Görünümü
          // map() ile her rota için bir RouteCard component'i oluşturuluyor
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route: IRoute) => (
              <RouteCard
                key={route.id}
                // 1️⃣ route prop'u: RouteCard'e gösterilecek rota verisini iletiyoruz
                route={route}
                
                // 2️⃣ onDelete prop'u: RouteCard'deki sil butonu tıklandığında çalışacak callback
                // RouteCard -> handleDeleteRoute -> deleteRouteMutation.mutate()
                onDelete={handleDeleteRoute}
                
                // 3️⃣ onRename prop'u: RouteCard'deki adı değiştir işlemi bittiğinde çalışacak callback
                // RouteCard -> handleRenameRoute -> renameRouteMutation.mutate()
                onRename={handleRenameRoute}
                
                // 4️⃣ isDeleting prop'u: Silme işlemi devam ederken RouteCard'de loading göstermek için
                // Bu prop sayesinde sil butonu loading animasyonu gösterir
                isDeleting={
                  deleteRouteMutation.isPending && deleteRouteMutation.variables === route.id
                }
                
                // 5️⃣ isRenaming prop'u: Rename işlemi devam ederken RouteCard'de loading göstermek için
                // Bu prop sayesinde input alanı ve butonlar disable olur
                isRenaming={
                  renameRouteMutation.isPending &&
                  renameRouteMutation.variables?.routeId === route.id
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© 2026 Adventurer - Gezi Rotası Planlama Uygulaması</p>
          <p className="mt-2">Backend API: {routeService.getApiBaseUrl()}</p>
        </div>
      </footer>
    </div>
  );
};

export default RoutesPage;
