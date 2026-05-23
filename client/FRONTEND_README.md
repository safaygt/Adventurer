# Adventurer Frontend - Gezi Rotası Planlama Uygulaması

## 📋 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir React bileşenleri
│   ├── RouteCard.tsx    # Rota kart bileşeni
│   └── RouteTimeline.tsx # Durak zaman çizelgesi bileşeni
├── pages/               # Sayfa bileşenleri
│   ├── RoutesPage.tsx   # Rotalarım sayfası (liste görünümü)
│   └── RouteDetailsPage.tsx # Rota detay sayfası
├── services/            # API iletişim katmanı
│   └── routeService.ts  # Backend endpoint'leriyle iletişim
├── types/               # TypeScript tür tanımları
│   └── index.ts         # Tüm interface'ler ve enum'lar
├── hooks/               # Özel React Hook'lar
│   └── index.ts         # Veri yönetimi hook'ları
├── App.tsx              # Ana uygulama bileşeni
└── main.tsx             # Giriş noktası
```

## 🚀 Başlangıç

### 1. Ortam Değişkenlerini Ayarlayın

```bash
# .env.local dosyasında backend URL'sini ayarlayın
VITE_API_URL=http://localhost:3000/api
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

### 4. Uygulamaya Erişin

Tarayıcıda `http://localhost:5173` adresine gidin.

---

## 📦 Temel Bileşenler

### 1. Types (`src/types/index.ts`)

Backend'den gelen verilerin TypeScript interface'lerini tanımlar.

```typescript
import { IRoute, IStop, BudgetType, StopType } from './types';

// Interface örnekleri
interface IRoute {
  id: string;
  title: string;
  city: string;
  startDate: Date;
  endDate: Date;
  budgetType: BudgetType;
  stops?: IStop[];
}

interface IStop {
  id: string;
  name: string;
  type: StopType;
  location: string;
  dayNumber: number;
  // ... diğer alanlar
}

enum BudgetType {
  BUDGET = 'BUDGET',
  MODERATE = 'MODERATE',
  LUXURY = 'LUXURY',
}

enum StopType {
  ACCOMMODATION = 'ACCOMMODATION',
  ATTRACTION = 'ATTRACTION',
  RESTAURANT = 'RESTAURANT',
  ACTIVITY = 'ACTIVITY',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}
```

**Utility Objects:**
- `BUDGET_TYPE_LABELS` - Bütçe türü etiketleri
- `BUDGET_TYPE_COLORS` - Tailwind renk sınıfları
- `STOP_TYPE_LABELS` - Durak türü etiketleri
- `STOP_TYPE_ICONS` - Durak türü emoji'leri

---

### 2. API Service (`src/services/routeService.ts`)

Backend endpoint'lerine merkezi istek yöneticisi.

#### Fonksiyonlar:

```typescript
// Yeni rota oluştur
const route = await routeService.createRoute({
  title: "İstanbul Turu",
  city: "İstanbul",
  startDate: "2026-05-20",
  endDate: "2026-05-27",
  budgetType: BudgetType.MODERATE,
});

// Kullanıcının rotalarını getir
const routes = await routeService.getUserRoutes('user-123');

// Rota detaylarını getir (stops dahil)
const routeDetails = await routeService.getRouteDetails('route-456');

// Rotayı sil
await routeService.deleteRoute('route-456');

// Rota adını güncelle
const updated = await routeService.renameRoute('route-456', {
  title: "Yeni Rota Adı"
});

// Durak detaylarını getir
const stop = await routeService.getStopDetails('stop-789');
```

#### Özellikler:

- **Axios Instance**: Merkezi HTTP client
- **Interceptor'lar**: Request/response işleme
- **Error Handling**: Merkezi hata yönetimi
- **Type Safety**: Tüm response'lar type-safe

---

### 3. Özel Hook'lar (`src/hooks/index.ts`)

React Query kullanarak veri yönetimini sağlayan hook'lar.

```typescript
// Rotaları getir
const { data: routes, isLoading } = useGetUserRoutes('user-123');

// Rota detaylarını getir
const { data: route } = useGetRouteDetails('route-456');

// Rota sil
const deleteRouteMutation = useDeleteRoute();
deleteRouteMutation.mutate('route-id');

// Rota adını güncelle
const renameRouteMutation = useRenameRoute();
renameRouteMutation.mutate({ routeId: 'id', title: 'Yeni Ad' });

// Rota istatistikleri
const stats = useRouteStats(route);
console.log(stats.durationDays);
console.log(stats.totalEstimatedCost);

// Duraklarını güne göre grupla
const groupedStops = useGroupStopsByDay(route?.stops);
```

---

### 4. Bileşenler

#### RouteCard

Bir rotayı kart formatında gösterir.

```typescript
import RouteCard from './components/RouteCard';

<RouteCard
  route={routeData}
  onDelete={(id) => console.log('Silindi:', id)}
  onRename={(id, title) => console.log('Yeniden adlandırıldı:', title)}
  isDeleting={false}
  isRenaming={false}
/>
```

**Özellikler:**
- Inline rename modu
- Silme onayı
- Tailwind tasarımı
- Loading state'leri
- Link to details page

#### RouteTimeline

Duraklarını zaman çizelgesi formatında gösterir.

```typescript
import RouteTimeline from './components/RouteTimeline';

<RouteTimeline
  stops={route.stops}
  routeStartDate={new Date('2026-05-20')}
/>
```

**Özellikler:**
- Gün bazında gruplandırma
- Durak türüne göre renklendirme
- Konum, süre, maliyet bilgileri
- Responsive grid

---

### 5. Sayfalar

#### RoutesPage

Kullanıcının tüm rotalarını listeler.

```
/routes
```

**Özellikler:**
- Rotaları grid görünümünde gösterir
- Silme ve yeniden adlandırma işlemleri
- Yeni rota oluşturma butonu
- Empty state göstergesi
- Loading ve error state'leri

#### RouteDetailsPage

Belirli bir rotanın detaylarını gösterir.

```
/routes/:routeId
```

**Özellikler:**
- Rota istatistikleri (şehir, tarih, bütçe, durak sayısı)
- Tahmini maliyet ve süre
- Durak zaman çizelgesi
- Geri dönüş navigasyonu
- Loading ve error state'leri

---

## 🔄 Veri Akışı

```
┌─────────────────────────────────────────┐
│   React Component                       │
│  (RoutesPage, RouteDetailsPage)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Custom Hooks (hooks/index.ts)        │
│  (useGetUserRoutes, useDeleteRoute)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   React Query (Data Management)         │
│  (Caching, Refetching, Mutations)      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   API Service (routeService.ts)        │
│  (Axios, Request/Response)             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Backend Server                        │
│  (http://localhost:3000/api)           │
└─────────────────────────────────────────┘
```

---

## 🎨 Tailwind CSS Kullanımı

Projede Tailwind CSS v4 kullanılmaktadır. Örnekler:

```typescript
// Renk sınıfları
className="bg-blue-600 text-white"
className="border-2 border-blue-200 rounded-lg"

// Responsive tasarım
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Flexbox
className="flex items-center justify-between gap-4"

// Animasyonlar
className="hover:shadow-lg transition-shadow duration-300"
```

---

## 🧪 Örnek Kullanımlar

### Rotaları Listeleme

```typescript
export const RoutesPage: React.FC = () => {
  const userId = 'test-user-1';
  const { data: routes, isLoading, error } = useGetUserRoutes(userId);

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error.message}</div>;

  return (
    <div className="grid grid-cols-3 gap-6">
      {routes.map(route => (
        <RouteCard key={route.id} route={route} ... />
      ))}
    </div>
  );
};
```

### Rota Silme

```typescript
const handleDeleteRoute = () => {
  const deleteRouteMutation = useDeleteRoute();
  
  if (window.confirm('Silmek istediğinize emin misiniz?')) {
    deleteRouteMutation.mutate(routeId, {
      onSuccess: () => {
        navigate('/routes');
      },
    });
  }
};
```

### Rota Adı Güncelleme

```typescript
const handleRenameRoute = (newTitle: string) => {
  const renameRouteMutation = useRenameRoute();
  
  renameRouteMutation.mutate(
    { routeId, title: newTitle },
    {
      onSuccess: () => {
        setIsEditMode(false);
      },
    }
  );
};
```

---

## 🔧 Konfigürasyon

### React Query Ayarları

`App.tsx` dosyasında bulunan `queryClient` ayarları:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // 1 kez yeniden dene
      refetchOnWindowFocus: false, // Pencere focus'ta refetch yapma
      staleTime: 5 * 60 * 1000,   // 5 dakika sonra eski kabul et
    },
  },
});
```

### API Base URL

`.env.local` dosyasında ayarlanır:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🐛 Hata Yönetimi

Tüm API çağrıları merkezi error handling ile gelir:

```typescript
// Service'ten error handle etme
try {
  const route = await routeService.createRoute(data);
} catch (error) {
  const message = routeService.getErrorMessage(error);
  console.error('Hata:', message);
}

// Hook'lardan error handle etme
const { error } = useGetUserRoutes(userId);
if (error) {
  console.error('Hata:', routeService.getErrorMessage(error));
}
```

---

## 📱 Responsive Tasarım

Tüm bileşenler mobile-first yaklaşımı ile responsive tasarlanmıştır:

- **Mobile**: 1 kolon grid
- **Tablet**: 2 kolon grid  
- **Desktop**: 3 kolon grid

---

## 🚀 Build ve Deployment

### Production Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 📚 Teknolojiler

- **React 19**: UI framework
- **TypeScript 6**: Type safety
- **Vite 8**: Build tool
- **React Router 7**: Routing
- **React Query 5**: Data management
- **Axios 1.16**: HTTP client
- **Tailwind CSS 4**: Styling
- **Lucide React**: Icons

---

## 📝 Notlar

1. **Backend Bağlantısı**: Backend server'ının çalışır durumda olması gerekir
2. **Auth**: Şu anda hardcoded `userId` kullanılmaktadır. Gelecekte auth sistemiyle entegre edilecek
3. **CORS**: Backend'de CORS yapılandırması gerekebilir
4. **Cache**: React Query otomatik caching ve refetching yapar

---

## 🤝 Katkı

Herhangi bir sorun veya öneriniz varsa, lütfen iletişime geçin.

---

**Son Güncelleme**: 2026-05-22
**Geliştirici**: Adventurer Development Team
