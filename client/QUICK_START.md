# 🚀 Adventurer Frontend - Hızlı Başlama Kılavuzu

Bu kılavuz, frontend'i hızlıca kurmanız ve çalıştırmanız için adım adım talimatlar sunmaktadır.

## ✅ Ön Gereksinimler

1. **Node.js** (v18+) ve **npm** yüklü olmalı
2. **Backend Server** çalışır durumda olmalı (http://localhost:3000)
3. **VS Code** veya favori editörünüz açık olmalı

---

## 📋 Kurulum Adımları

### 1️⃣ Ortam Dosyasını Yapılandırın

```bash
# client klasörüne gidin
cd client

# .env.local dosyasını açın (zaten oluşturulmuş)
# İçerinde şu satırı kontrol edin:
# VITE_API_URL=http://localhost:3000/api
```

### 2️⃣ Node Modüllerini Yükleyin

```bash
npm install
```

> Eğer hata alırsanız, aşağıdakini çalıştırın:
> ```bash
> npm install --legacy-peer-deps
> ```

### 3️⃣ Backend Server'ı Başlatın

Başka bir terminal penceresinde:

```bash
cd server
npm run dev
# veya
npm start
```

Backend'in şu adreste çalıştığını doğrulayın:
```
http://localhost:3000/api
```

### 4️⃣ Frontend Development Server'ı Başlatın

```bash
cd client
npm run dev
```

Çıktıda göreceksiniz:
```
  VITE v8.0.10  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

### 5️⃣ Tarayıcıda Uygulamayı Açın

```
http://localhost:5173
```

---

## 🧪 Uygulamayı Test Etme

### Sayfaları Kontrol Edin

1. **Rotalarım Sayfası** (`/routes`)
   - ✓ Tüm rotaları görmeli
   - ✓ "Yeni Rota Oluştur" butonu görünmeli
   - ✓ Her rotada "Sil" ve "Yeniden Adlandır" butonları görünmeli

2. **Rota Detay Sayfası** (`/routes/:routeId`)
   - ✓ Rota bilgileri (şehir, tarih, bütçe) görünmeli
   - ✓ Zaman çizelgesinde durağlar listelenmeli
   - ✓ Her durak türüne göre renklendirilmeli

### Aksiyonları Test Edin

```typescript
// 1. Rota Silme
- Bir rotanın yanındaki "Sil" butonuna tıklayın
- Onay mesajı çıkmalı
- Rota silinmeli ve liste yenilenmeli

// 2. Rota Adı Değiştirme
- Bir rotanın yanındaki "Yeniden Adlandır" butonuna tıklayın
- Inline input görünmeli
- Yeni ad yazın ve Kaydet butonuna tıklayın
- Rota adı güncellenip liste yenilenmeli

// 3. Detay Sayfasına Gitme
- "Detayları Gör" linkine tıklayın
- Rota detay sayfası açılmalı
- Durağ zaman çizelgesi görünmeli
```

---

## 📝 Proje Yapısı Hatırlatması

```
client/
├── src/
│   ├── components/              # UI Bileşenleri
│   │   ├── RouteCard.tsx        # Rota kartı
│   │   └── RouteTimeline.tsx    # Durak zaman çizelgesi
│   ├── pages/                   # Sayfa Bileşenleri
│   │   ├── RoutesPage.tsx       # Rotaları listele
│   │   └── RouteDetailsPage.tsx # Rota detaylarını göster
│   ├── services/                # API İletişim
│   │   └── routeService.ts      # Backend endpoint'leri
│   ├── types/                   # TypeScript Tür Tanımları
│   │   └── index.ts             # Interface'ler ve Enum'lar
│   ├── hooks/                   # Özel Hook'lar
│   │   └── index.ts             # React Query hook'ları
│   ├── App.tsx                  # Ana Bileşen
│   └── main.tsx                 # Entry Point
├── .env.local                   # Ortam Değişkenleri
├── vite.config.ts               # Vite Konfigürasyonu
└── package.json                 # Bağımlılıklar
```

---

## 🐛 Yaygın Sorunlar ve Çözümleri

### Problem: "Cannot find module" hatası

**Çözüm:**
```bash
# 1. node_modules klasörünü silin
rm -rf node_modules

# 2. package-lock.json dosyasını silin
rm package-lock.json

# 3. Yeniden yükleyin
npm install
```

### Problem: Backend'e bağlanılamıyor

**Çözüm:**
```bash
# 1. Backend server çalışıyor mu kontrol edin
# http://localhost:3000/api adresini tarayıcıda açın

# 2. .env.local dosyasını kontrol edin
VITE_API_URL=http://localhost:3000/api

# 3. Backend'i yeniden başlatın
cd server
npm run dev
```

### Problem: Port zaten kullanımda

**Çözüm:**
```bash
# Port 5173'i kullanan işlemi sonlandırın (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Veya farklı port kullanın
npm run dev -- --port 3001
```

---

## 🔧 Geliştirme İpuçları

### TypeScript Hataları Kontrol Edin

```bash
npx tsc --noEmit
```

### ESLint Kontrolü Yapın

```bash
npm run lint
```

### Production Build Test Edin

```bash
npm run build
npm run preview
```

---

## 📚 Kod Örnekleri

### 1. Rotaları Listele

```typescript
import { useGetUserRoutes } from './hooks';

function MyComponent() {
  const { data: routes, isLoading } = useGetUserRoutes('user-123');
  
  if (isLoading) return <div>Yükleniyor...</div>;
  
  return (
    <div>
      {routes?.map(route => (
        <div key={route.id}>{route.title}</div>
      ))}
    </div>
  );
}
```

### 2. Rota Sil

```typescript
import { useDeleteRoute } from './hooks';

function DeleteButton({ routeId }) {
  const deleteRouteMutation = useDeleteRoute();
  
  const handleDelete = () => {
    deleteRouteMutation.mutate(routeId, {
      onSuccess: () => alert('Silindi!'),
      onError: (error) => alert('Hata: ' + error.message),
    });
  };
  
  return (
    <button onClick={handleDelete}>
      {deleteRouteMutation.isPending ? 'Siliniyor...' : 'Sil'}
    </button>
  );
}
```

### 3. API Service Kullanımı

```typescript
import routeService from './services';

// Tüm route'ları getir
const routes = await routeService.getUserRoutes('user-123');

// Belirli route'un detaylarını getir
const route = await routeService.getRouteDetails('route-456');

// Route oluştur
const newRoute = await routeService.createRoute({
  title: 'İstanbul Turu',
  city: 'İstanbul',
  startDate: '2026-05-20',
  endDate: '2026-05-27',
  budgetType: 'MODERATE',
});
```

---

## 🎯 Sonraki Adımlar

- [ ] Authentication sistemi ekleyin
- [ ] Rota oluşturma sayfası (Create Route UI)
- [ ] Durak ekleme/düzenleme modeli
- [ ] Harita integrasyon (Google Maps)
- [ ] Kullanıcı profili
- [ ] Favoriler sistemi
- [ ] Sosyal paylaşım

---

## 💡 Faydalı Kaynaklar

- [React Belgeleri](https://react.dev)
- [TypeScript Belgeleri](https://www.typescriptlang.org/docs)
- [React Router](https://reactrouter.com)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📞 Destek

Herhangi bir sorun yaşarsanız, lütfen aşağıdakini kontrol edin:

1. ✓ Backend server çalışıyor mu?
2. ✓ `.env.local` dosyası doğru ayarlanmış mı?
3. ✓ Node modülleri doğru kuruldu mu?
4. ✓ Tarayıcı konsolu açık (F12) ve hata var mı?

---

**Kolay gelsin! 🎉**

*Son Güncellenme: 2026-05-22*
