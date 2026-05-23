/**
 * RouteTimeline Component
 * 
 * Bir rotanın duraklarını (stops) dikey bir zaman çizelgesi şeklinde gösterir.
 * Her durak gün, saat, lokasyon ve detay bilgileriyle görüntülenir.
 * 
 * Özellikler:
 * - Gün bazında gruplandırılmış durağlar
 * - Durak türüne göre renklendirme
 * - Responsive tasarım
 * - Smooth scroll ve animasyonlar
 */

import React from 'react';
import type { IStop } from '../types/index.js';
import { StopType, STOP_TYPE_LABELS, STOP_TYPE_ICONS } from '../types/index.js';
import { Clock, MapPin, DollarSign, FileText } from 'lucide-react';

interface RouteTimelineProps {
  /** Gösterilecek duraklar listesi */
  stops: IStop[];
  
  /** Rota başlangıç tarihi (güne karşılık gelecek şekilde formatlamak için) */
  routeStartDate?: Date;
}

/**
 * Durak türüne göre renk tema döndür
 */
const getStopTypeColor = (type: StopType): string => {
  const colors: Record<StopType, string> = {
    [StopType.ACCOMMODATION]: 'border-blue-500 bg-blue-50',
    [StopType.ATTRACTION]: 'border-purple-500 bg-purple-50',
    [StopType.RESTAURANT]: 'border-orange-500 bg-orange-50',
    [StopType.ACTIVITY]: 'border-green-500 bg-green-50',
    [StopType.TRANSPORT]: 'border-gray-500 bg-gray-50',
    [StopType.OTHER]: 'border-gray-400 bg-gray-50',
  };
  return colors[type];
};

/**
 * Durak türüne göre badge rengi döndür
 */
const getStopTypeBadgeColor = (type: StopType): string => {
  const colors: Record<StopType, string> = {
    [StopType.ACCOMMODATION]: 'bg-blue-200 text-blue-800',
    [StopType.ATTRACTION]: 'bg-purple-200 text-purple-800',
    [StopType.RESTAURANT]: 'bg-orange-200 text-orange-800',
    [StopType.ACTIVITY]: 'bg-green-200 text-green-800',
    [StopType.TRANSPORT]: 'bg-gray-200 text-gray-800',
    [StopType.OTHER]: 'bg-gray-200 text-gray-800',
  };
  return colors[type];
};

/**
 * Duraklarını güne göre gruplandır
 */
const groupStopsByDay = (stops: IStop[]): Record<number, IStop[]> => {
  return stops.reduce(
    (acc, stop) => {
      if (!acc[stop.dayNumber]) {
        acc[stop.dayNumber] = [];
      }
      acc[stop.dayNumber].push(stop);
      return acc;
    },
    {} as Record<number, IStop[]>
  );
};

/**
 * Gün numarasından tarihi hesapla
 */
const calculateDateForDay = (startDate: Date, dayNumber: number): Date => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return date;
};

/**
 * RouteTimeline Bileşeni
 * 
 * @example
 * <RouteTimeline
 *   stops={routeStops}
 *   routeStartDate={new Date('2026-05-20')}
 * />
 */
export const RouteTimeline: React.FC<RouteTimelineProps> = ({
  stops,
  routeStartDate = new Date(),
}) => {
  // Duraklarını güne göre gruplandır
  const groupedStops = groupStopsByDay(stops);
  
  // Gün numaralarını sıralı şekilde al
  const sortedDays = Object.keys(groupedStops)
    .map(Number)
    .sort((a, b) => a - b);

  // Eğer durak yoksa boş durumu göster
  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <MapPin size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">Bu rotada henüz durak yok</p>
        <p className="text-sm mt-1">Durağı hemen eklemek için lütfen API'yi kullanın</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Timeline Container */}
      <div className="space-y-12">
        {sortedDays.map((dayNumber) => {
          const dayStops = groupedStops[dayNumber];
          const dayDate = calculateDateForDay(routeStartDate, dayNumber);
          const dayDateFormatted = dayDate.toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <div key={dayNumber} className="relative">
              {/* Gün Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  Gün {dayNumber}
                </div>
                <div className="text-gray-600 text-sm">
                  <p className="font-medium">{dayDateFormatted}</p>
                  <p className="text-xs text-gray-500">{dayStops.length} durak</p>
                </div>
              </div>

              {/* Duraklara ait Timeline Çizgisi */}
              <div className="space-y-4 pl-8 border-l-2 border-blue-300">
                {dayStops
                  // Durakları sıraya göre sırala
                  .sort((a, b) => a.order - b.order)
                  .map((stop, index) => (
                    <div
                      key={stop.id}
                      className={`relative ml-0 pb-4 ${index === dayStops.length - 1 ? '' : 'pb-8'}`}
                    >
                      {/* Timeline Noktası */}
                      <div className="absolute -left-11 top-2 w-6 h-6 bg-blue-600 border-4 border-white rounded-full shadow-md" />

                      {/* Durak Kartı */}
                      <div
                        className={`p-4 rounded-lg border-l-4 ${getStopTypeColor(stop.type)} transition-all hover:shadow-md`}
                      >
                        {/* Header: Durak Adı ve Türü */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{stop.name}</h3>
                            <p className="text-sm text-gray-600">{stop.location}</p>
                          </div>
                          <span
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStopTypeBadgeColor(
                              stop.type
                            )}`}
                          >
                            {STOP_TYPE_ICONS[stop.type]} {STOP_TYPE_LABELS[stop.type]}
                          </span>
                        </div>

                        {/* Durak Detayları Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          {/* Süre */}
                          {stop.duration && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock size={16} className="text-gray-500" />
                              <span>
                                <strong>{Math.round(stop.duration / 60)}s</strong> (
                                {stop.duration}dk)
                              </span>
                            </div>
                          )}

                          {/* Maliyet */}
                          {stop.estimatedCost && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <DollarSign size={16} className="text-green-600" />
                              <span>
                                <strong>{stop.estimatedCost.toFixed(2)}</strong> ₺
                              </span>
                            </div>
                          )}

                          {/* Koordinatlar (Varsa) */}
                          {stop.latitude && stop.longitude && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <MapPin size={16} className="text-red-600" />
                              <span>
                                {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Açıklama */}
                        {stop.description && (
                          <div className="mb-3 text-sm text-gray-700 bg-white/50 p-2 rounded">
                            {stop.description}
                          </div>
                        )}

                        {/* Notlar */}
                        {stop.notes && (
                          <div className="flex gap-2 text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                            <FileText size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-900">{stop.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rota Tamamlandı Göstergesi */}
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-gray-700 font-medium">Rota Detaylarınız Tamamlandı</p>
        <p className="text-sm text-gray-500 mt-1">Toplam {stops.length} durak</p>
      </div>
    </div>
  );
};

export default RouteTimeline;
