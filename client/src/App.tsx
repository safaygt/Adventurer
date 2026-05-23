/**
 * Adventurer Application - Main App Component
 * 
 * Bu bileşen uygulamanın ana iskeletini oluşturur.
 * React Router ile sayfalar arasında navigasyonu yönetir.
 * React Query provider'ı ile veri caching ve state management'ı sağlar.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoutesPage from './pages/RoutesPage.js';
import RouteDetailsPage from './pages/RouteDetailsPage.js';
import './App.css';

/**
 * React Query Client Konfigürasyonu
 * 
 * Veri caching, stale time, garbage collection gibi ayarları içerir.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Başarısız request'i 1 kez yeniden dene
      refetchOnWindowFocus: false, // Pencere focus edince refetch yapma
      staleTime: 5 * 60 * 1000, // 5 dakika sonra data eski kabul et
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * App Bileşeni
 * 
 * Uygulamanın route'larını ve provider'larını tanımlar.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Ana Sayfa - Rotalarım */}
          <Route path="/routes" element={<RoutesPage />} />

          {/* Rota Detay Sayfası */}
          <Route path="/routes/:routeId" element={<RouteDetailsPage />} />

          {/* Default Route - Başlangıç Sayfasına Yönlendir */}
          <Route path="/" element={<Navigate to="/routes" replace />} />

          {/* Tanımlanmamış Route'lar - Ana Sayfaya Yönlendir */}
          <Route path="*" element={<Navigate to="/routes" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
               