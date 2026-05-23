/**
 * RouteCard Component
 * 
 * ⭐ ÖNEMLİ AÇIKLAMA ⭐
 * 
 * Bu component bir rotanın kart görünümünü göstermekten daha fazlasını yapıyor.
 * Parent component'ten (RoutesPage) aldığı callback fonksiyonları kullanarak
 * rota silme ve adlandırma işlemlerini gerçekleştiriyor.
 * 
 * Prop'lar (Arayüz - Interface):
 * - route: Gösterilecek rota verileri
 * - onDelete: Silme işlemini tetikleyen callback (RoutesPage'de tanımlanmış)
 * - onRename: Adlandırma işlemini tetikleyen callback (RoutesPage'de tanımlanmış)
 * - isDeleting: Silme işlemi devam ederken loading göstermek için
 * - isRenaming: Adlandırma işlemi devam ederken loading göstermek için
 * 
 * State'ler (Yerel Durum):
 * - isEditMode: Rota adını düzenlemede miyiz?
 * - editedTitle: Düzenleme modunda yazılan yeni ad
 * 
 * Akış (Data Flow):
 * 1. Kullanıcı sil/düzenle butonuna tıklar
 * 2. RouteCard'deki handler'lar devreye girer
 * 3. Handler, parent'ten aldığı callback'i çağırır
 * 4. Callback'i RoutesPage'de yazılmış handleDeleteRoute/handleRenameRoute çalıştırır
 * 5. Bu fonksiyonlar mutation'ları tetikler
 * 6. Mutation backend'e API çağrısı yapar
 * 
 * Özellikler:
 * - Inline silme/düzenleme (sayfa yenilemesiz)
 * - Tailwind CSS ile responsive tasarım
 * - Hover efektleri ve geçişler
 * - Loading state'leri
 */

import React, { useState } from 'react';
import { Trash2, Edit2, Calendar, MapPin } from 'lucide-react';
import type { IRoute } from '../types/index.js';
import { BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS } from '../types/index.js';
import { Link } from 'react-router-dom';

/**
 * RouteCardProps Interface
 * 
 * Bu interface, RouteCard'e iletilecek tüm prop'ları tanımlar.
 * TypeScript sayesinde yanlış prop gönderme hataları önlenir.
 */
interface RouteCardProps {
  /** Gösterilecek rota verisi - API'dan gelen IRoute tipi verisi */
  route: IRoute;
  
  /** 
   * ❌ CALLBACK: Rota silindiğinde çağrılacak fonksiyon
   * 
   * Parent (RoutesPage) bunu şöyle tanımlamışken:
   * const handleDeleteRoute = (routeId: string) => {
   *   deleteRouteMutation.mutate(routeId);
   * }
   * 
   * Akış: Sil butonu tıklandı -> handleDelete() -> onDelete() -> backend API
   */
  onDelete: (routeId: string) => void;
  
  /** 
   * 🔄 CALLBACK: Rota adı değiştirildiğinde çağrılacak fonksiyon
   * 
   * Parent (RoutesPage) bunu şöyle tanımlamışken:
   * const handleRenameRoute = (routeId: string, newTitle: string) => {
   *   renameRouteMutation.mutate({ routeId, title: newTitle });
   * }
   * 
   * Akış: Kaydet butonu tıklandı -> handleSaveRename() -> onRename() -> backend API
   */
  onRename: (routeId: string, newTitle: string) => void;
  
  /** 
   * ⏳ Silme işlemi devam ederken loading durumu
   * 
   * RoutesPage'de şöyle hesaplanıyor:
   * deleteRouteMutation.isPending && deleteRouteMutation.variables === route.id
   * 
   * true ise: sil butonu loading animasyonu gösterir, input'lar disable olur
   */
  isDeleting?: boolean;
  
  /** 
   * ⏳ Rename işlemi devam ederken loading durumu
   * 
   * RoutesPage'de şöyle hesaplanıyor:
   * renameRouteMutation.isPending && renameRouteMutation.variables?.routeId === route.id
   * 
   * true ise: input alanı ve butonlar disable olur
   */
  isRenaming?: boolean;
}

/**
 * RouteCard Bileşeni
 * 
 * @example
 * <RouteCard
 *   route={routeData}
 *   onDelete={(id) => deleteRouteMutation.mutate(id)}
 *   onRename={(id, title) => renameRouteMutation.mutate({ routeId: id, title })}
 *   isDeleting={false}
 *   isRenaming={false}
 * />
 */
export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onDelete,
  onRename,
  isDeleting = false,
  isRenaming = false,
}) => {
  /**
   * 📝 STATE: Inline Düzenleme Modu
   * 
   * Neden gerekli?
   * - Kullanıcı edit butonuna tıkladığında, kart başlığı input alanına dönüşmesi gerekiyor
   * - İptal et tıklanırsa, yapılan değişiklikler geri alınmalı
   * - Kaydet tıklanırsa, onRename callback'i çağrılmalı
   */
  const [isEditMode, setIsEditMode] = useState(false);
  
  /**
   * 📝 STATE: Düzenleme Modunda Yazılan Yeni Ad
   * 
   * Neden state'de tutuluyor?
   * - Kullanıcı input'a yazarken, yazı real-time olarak güncellenmeli
   * - Değişiklikleri Kaydet/İptal et seçeneğine göre işlemek gerekiyor
   */
  const [editedTitle, setEditedTitle] = useState(route.title);

  /**
   * ❗ HANDLER FUNCTION: handleDelete
   * 
   * Neden yazıldı?
   * - Sil butonu tıklandığında user confirmation (onay) istemek için
   * - Onay verirse, parent component'in onDelete callback'ini çağırmak için
   * 
   * Akış:
   * 1. Sil butonuna tıkla → handleDelete() çalışır
   * 2. window.confirm() ile kullanıcı onayı iste
   * 3. Eğer onay verirse → this.props.onDelete(route.id) çağır
   * 4. onDelete() fonksiyonu RoutesPage'de yazılmış → deleteRouteMutation.mutate()
   * 5. Mutation backend'e API çağrısı yapar → rota silinir
   */
  const handleDelete = () => {
    // Kullanıcıdan onay iste - yanlış silme işlemini önlemek için
    if (window.confirm(`"${route.title}" rotasını silmek istediğinize emin misiniz?`)) {
      // Eğer kullanıcı "Tamam" derse, parent'ten aldığı callback'i çağır
      onDelete(route.id);
    }
  };

  /**
   * ❗ HANDLER FUNCTION: handleEditClick
   * 
   * Neden yazıldı?
   * - Edit/Kalem ikonuna tıklandığında edit moduna girmek için
   * - İnput alanını ilk değeriyle başlatmak için
   * 
   * Akış:
   * 1. Edit butonuna tıkla → handleEditClick() çalışır
   * 2. isEditMode state'i true'ya ayarla (input görünür hale gelir)
   * 3. editedTitle state'ini mevcut başlık ile başlat
   */
  const handleEditClick = () => {
    // Edit modunu aç
    setIsEditMode(true);
    // Input alanını rota'nın mevcut adı ile başlat
    setEditedTitle(route.title);
  };

  /**
   * ❗ HANDLER FUNCTION: handleSaveRename
   * 
   * Neden yazıldı?
   * - Düzenleme modunda Kaydet butonuna tıklandığında çalışır
   * - Yeni adın geçerli olup olmadığını kontrol eder
   * - Parent component'in onRename callback'ini çağırır
   * 
   * Akış:
   * 1. Kaydet butonuna tıkla → handleSaveRename() çalışır
   * 2. Yeni ad boş mu / aynı mı kontrol et
   * 3. Eğer farklı ve geçerli ise:
   *    - parent'ten aldığı onRename callback'i çağır
   *    - onRename() fonksiyonu RoutesPage'de yazılmış → renameRouteMutation.mutate()
   *    - Mutation backend'e API çağrısı yapar → rota adı güncellenir
   * 4. Edit modundan çık (input kaybolur, başlık tekrar görünür hale gelir)
   */
  const handleSaveRename = () => {
    if (editedTitle.trim() && editedTitle !== route.title) {
      // Yeni ad geçerli ve eski ad'dan farklı ise
      // Parent'e yeni adı ilet
      onRename(route.id, editedTitle.trim());
      // Edit modundan çık
      setIsEditMode(false);
    } else {
      // Eğer aynı ad ise ya da boş ise, sadece edit modundan çık (hiç kaydetme)
      setIsEditMode(false);
    }
  };

  /**
   * ❗ HANDLER FUNCTION: handleCancelRename
   * 
   * Neden yazıldı?
   * - Düzenleme modundaki İptal Et (✕) butonuna tıklandığında çalışır
   * - Yapılan değişiklikleri geri alır
   * - Edit modundan çıkışı sağlar
   * 
   * Akış:
   * 1. İptal butonuna tıkla → handleCancelRename() çalışır
   * 2. Edit modunu kapat (input kaybolur)
   * 3. editedTitle'ı orijinal başlık ile geri yükle
   */
  const handleCancelRename = () => {
    // Edit modunu kapat
    setIsEditMode(false);
    // Değişiklikleri geri al - mevcut başlık ile state'i sıfırla
    setEditedTitle(route.title);
  };

  // Tarih formatlanması - gösterilecek formata uygun hale getir
  const startDate = new Date(route.startDate);
  const endDate = new Date(route.endDate);
  const dateRange = `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`;

  // Rota süresi (gün sayısı) - başlangıç ve bitiş tarihleri arasındaki fark
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      {/* 
        ========================================
        KART HEADER - ROTA ADI VE AKSIYONLAR
        ========================================
        
        İki mod var:
        1️⃣ Normal Mod: Rota adı, Edit butonu, Sil butonu
        2️⃣ Edit Mod: Input alanı, Kaydet butonu, İptal buton
        
        isEditMode state'i bu iki modu kontrol ediyor.
        Ternary operator (? :) ile koşullu render yapılıyor.
      */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        {isEditMode ? (
          // 2️⃣ EDIT MOD: İnput alanı ve kontrol butonları
          <div className="flex gap-2">
            {/* 
              Input alanı - Yeni rota adını yazıyoruz
              
              - value={editedTitle}: state'deki değeri göster
              - onChange: yazarken state'i güncelle
              - disabled={isRenaming}: API isteği devam ederken input'u engelle
              - autoFocus: component mount olunca input'a fokus et (hemen yazabilsin)
            */}
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Rota adını girin"
              className="flex-1 px-3 py-2 rounded text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
              autoFocus
              disabled={isRenaming}
            />
            
            {/* 
              Kaydet Butonu (✓)
              
              Niye burada?
              - handleSaveRename() çağırır
              - Yeni adı parent'e (onRename callback) iletir
              - Edit modundan çıkır
              - isRenaming true ise disable eder (API isteği sırasında)
            */}
            <button
              onClick={handleSaveRename}
              disabled={isRenaming}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 px-3 py-2 rounded text-white text-sm font-medium transition-colors"
              title="Kaydet"
            >
              ✓
            </button>
            
            {/* 
              İptal Butonu (✕)
              
              Niye burada?
              - handleCancelRename() çağırır
              - Yapılan değişiklikleri geri alır
              - Edit modundan çıkır (normal moda döner)
              - isRenaming true ise disable eder (API isteği sırasında)
            */}
            <button
              onClick={handleCancelRename}
              disabled={isRenaming}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 px-3 py-2 rounded text-white text-sm font-medium transition-colors"
              title="İptal Et"
            >
              ✕
            </button>
          </div>
        ) : (
          // 1️⃣ NORMAL MOD: Rota adı ve aksiyon butonları
          <div className="flex justify-between items-start">
            {/* Rota adı - tıklanırsa detay sayfasına gider */}
            <Link
              to={`/routes/${route.id}`}
              className="text-white text-xl font-bold hover:underline flex-1 cursor-pointer"
            >
              {route.title}
            </Link>
            
            {/* Aksiyon Butonları */}
            <div className="flex gap-2">
              {/* 
                ✏️ Yeniden Adlandır Butonu
                
                Niye burada?
                - handleEditClick() çağırır
                - Edit moduna geçer (input alanı ortaya çıkar)
                - disabled: isRenaming veya isDeleting devam ediyorsa engelle
                
                Akış: Tıkla → handleEditClick() → isEditMode = true → input görünür
              */}
              <button
                onClick={handleEditClick}
                disabled={isRenaming || isDeleting}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 rounded transition-colors"
                title="Yeniden Adlandır"
              >
                <Edit2 size={18} className="text-white" />
              </button>

              {/* 
                🗑️ Sil Butonu
                
                Niye burada?
                - handleDelete() çağırır
                - Kullanıcı onayı ister
                - onDelete callback'i çağırır (parent'te tanımlanmış)
                - disabled: isDeleting veya isRenaming devam ediyorsa engelle
                - isDeleting true ise loading spinner göster
                
                Akış: Tıkla → handleDelete() → confirm dialog → onDelete() → backend API
              */}
              <button
                onClick={handleDelete}
                disabled={isDeleting || isRenaming}
                className="p-2 bg-red-500/20 hover:bg-red-600/30 disabled:bg-red-500/10 rounded transition-colors"
                title="Rotayı Sil"
              >
                {isDeleting ? (
                  // İşlem devam ederken: Loading spinner göster
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  // Normal: Trash ikonu göster
                  <Trash2 size={18} className="text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 
        ========================================
        KART BODY - ROTA DETAYLARI
        ========================================
        
        Rota hakkında bilgileri gösterir:
        - Şehir adı
        - Tarih aralığı ve süre
        - Açıklama
        - Bütçe tipi
        - Durak sayısı
      */}
      <div className="p-6 space-y-4">
        {/* Şehir Bilgisi - harita pin ikonu ile beraber */}
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin size={18} className="text-blue-500 flex-shrink-0" />
          <span className="font-medium">{route.city}</span>
        </div>

        {/* Tarih Aralığı ve Süre - takvim ikonu ile beraber */}
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar size={18} className="text-blue-500 flex-shrink-0" />
          <div className="flex flex-col">
            <span>{dateRange}</span>
            <span className="text-gray-500">({durationDays} gün)</span>
          </div>
        </div>

        {/* Açıklama (varsa) - sadece ilk 2 satırı göster */}
        {route.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{route.description}</p>
        )}

        {/* 
          Bütçe Türü Badge
          
          BUDGET_TYPE_COLORS: type'a göre arka plan rengi (types/index.ts'de tanımlanmış)
          BUDGET_TYPE_LABELS: type'a göre Türkçe label (types/index.ts'de tanımlanmış)
        */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${BUDGET_TYPE_COLORS[route.budgetType]}`}>
            {BUDGET_TYPE_LABELS[route.budgetType]}
          </span>
        </div>

        {/* Durak Sayısı (varsa) - kaç tane durak var göster */}
        {route.stops && route.stops.length > 0 && (
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
            📍 {route.stops.length} durak
          </div>
        )}
      </div>

      {/* 
        ========================================
        KART FOOTER - DETAY LINKI
        ========================================
        
        "Detayları Gör" linkine tıklandığında rota detay sayfasına gidilir
      */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <Link
          to={`/routes/${route.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
        >
          Detayları Gör →
        </Link>
      </div>
    </div>
  );
};

export default RouteCard;
