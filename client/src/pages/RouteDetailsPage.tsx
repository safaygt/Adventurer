/**
 * RouteDetailsPage Component
 * 
 * Belirli bir rotanın detaylarını ve duraklarını zaman çizelgesi ile gösterir.
 * Rota bilgileri, istatistikler ve tüm durağlar timeline formatında görüntülenir.
 * 
 * Özellikler:
 * - Detaylı rota bilgileri
 * - Durağ timeline görünümü
 * - Geri dönüş navigasyonu
 * - Loading ve error state'leri
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';

import { BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS } from '../types/index.js';
import RouteTimeline from '../components/RouteTimeline.js';
import routeService from '../services/routeService.js';

/**
 * RouteDetailsPage Bileşeni
 * 
 * URL parametrelerinden routeId'yi alır ve rota detaylarını gösterir.
 * 
 * @example
 * // URL: /routes/route-id-123
 * <RouteDetailsPage />
 */
export const RouteDetailsPage: React.FC = () => {
  // Router hook'ları
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  // Eğer routeId yoksa, hatayı göster
  if (!routeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <button
          onClick={() => navigate('/routes')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>
        <div className="max-w-md mx-auto bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800">Hata: Rota ID'si Bulunamadı</h2>
        </div>
      </div>
    );
  }

  // Rota detaylarını getir (stops dahil)
  const {
    data: route,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => routeService.getRouteDetails(routeId),
    staleTime: 2 * 60 * 1000, // 2 dakika
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Rota detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <button
          onClick={() => navigate('/routes')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Geri Dön
        </button>
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

  // Tarih formatlama
  const startDate = new Date(route.startDate);
  const endDate = new Date(route.endDate);
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Toplam tahmini maliyet hesapla
  const totalEstimatedCost =
    route.stops?.reduce((sum, stop) => sum + (stop.estimatedCost || 0), 0) || 0;

  // Toplam tahmini süre hesapla
  const totalDuration =
    route.stops?.reduce((sum, stop) => sum + (stop.duration || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-16">
      {/* Header Navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/routes')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-3"
          >
            <ArrowLeft size={20} />
            Rotalarıma Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{route.title}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Rota İstatistikleri Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Şehir */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={24} className="text-blue-500" />
              <h3 className="text-sm font-medium text-gray-600">Şehir</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{route.city}</p>
          </div>

          {/* Rota Süresi */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <Calendar size={24} className="text-green-500" />
              <h3 className="text-sm font-medium text-gray-600">Rota Süresi</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{durationDays} Gün</p>
            <p className="text-xs text-gray-500 mt-1">
              {startDate.toLocaleDateString('tr-TR')} - {endDate.toLocaleDateString('tr-TR')}
            </p>
          </div>

          {/* Bütçe Türü */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={24} className="text-purple-500" />
              <h3 className="text-sm font-medium text-gray-600">Bütçe Türü</h3>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${BUDGET_TYPE_COLORS[route.budgetType]}`}
            >
              {BUDGET_TYPE_LABELS[route.budgetType]}
            </span>
          </div>

          {/* Durak Sayısı */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-2">
              <MapPin size={24} className="text-orange-500" />
              <h3 className="text-sm font-medium text-gray-600">Durak Sayısı</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{route.stops?.length || 0}</p>
          </div>
        </div>

        {/* Detaylı Bilgiler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sol Taraf: Bilgiler */}
          <div className="lg:col-span-1 space-y-6">
            {/* Açıklama */}
            {route.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Açıklama</h3>
                <p className="text-gray-700 leading-relaxed">{route.description}</p>
              </div>
            )}

            {/* Bütçe Özeti */}
            {totalEstimatedCost > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign size={24} className="text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">Tahmini Toplam Maliyet</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {totalEstimatedCost.toFixed(2)} ₺
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Gün başına ortalama: {(totalEstimatedCost / durationDays).toFixed(2)} ₺
                </p>
              </div>
            )}

            {/* Sürü Özeti */}
            {totalDuration > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={24} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Toplam Aktivite Süresi</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.floor(totalDuration / 60)}s {totalDuration % 60}dk
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {route.stops && route.stops.length} durakta geçirilecek süre
                </p>
              </div>
            )}
          </div>

          {/* Sağ Taraf: Timeline */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Rota Zaman Çizelgesi</h2>
            <RouteTimeline stops={route.stops || []} routeStartDate={startDate} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© 2026 Adventurer - Gezi Rotası Planlama Uygulaması</p>
          <p className="mt-2">Rota oluşturulan: {new Date(route.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </footer>
    </div>
  );
};

export default RouteDetailsPage;
