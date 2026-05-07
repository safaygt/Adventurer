import 'dotenv/config.js';
import { GeminiAIService } from './infrastructure/services/GeminiAIService.js';
import { CreateRouteUseCase } from './application/use-cases/CreateRouteUseCase.js';
import { BudgetType } from './domain/enums/BudgetType.js';


/**
 * Test Dosyası
 * 
 * GeminiAIService ve CreateRouteUseCase'in entegrasyonunu test eder.
 * 
 * Amaç:
 * - AI servisi başarıyla çalışıyor mu?
 * - Use case input validasyonu düzgün mü?
 * - Rota oluşturma işlemi başarılı mı?
 * 
 * Çalıştırma:
 * npx tsx src/test-ai.ts
 */

async function main() {
  console.log('🚀 Rota Oluşturma Test Başlıyor...\n');

  try {
    // ============================================
    // ADIM 1: Servisleri Oluştur
    // ============================================
    console.log('📌 Adım 1: GeminiAIService başlatılıyor...');
    const geminiAIService = new GeminiAIService();
    console.log('✅ GeminiAIService başarıyla oluşturuldu.\n');

    // ============================================
    // ADIM 2: Use Case'i Oluştur (Dependency Injection)
    // ============================================
    console.log('📌 Adım 2: CreateRouteUseCase oluşturuluyor...');
    const createRouteUseCase = new CreateRouteUseCase(geminiAIService);
    console.log('✅ CreateRouteUseCase başarıyla oluşturuldu (GeminiAIService injected).\n');

    // ============================================
    // ADIM 3: execute() Metodunu Çağır
    // ============================================
    console.log('📌 Adım 3: execute() metodu çağrılıyor...');
    console.log('   📍 Şehir: Ankara');
    console.log('   📅 Gün: 3');
    console.log('   💰 Bütçe: STANDARD\n');

    const stops = await createRouteUseCase.execute(
      'Ankara',
      3,
      BudgetType.STANDARD
    );

    // ============================================
    // ADIM 4: Sonuçları Göster
    // ============================================
    console.log('✅ Rota başarıyla oluşturuldu!\n');
    console.log('📍 Oluşturulan Duraklar (IStop[]):');
    console.log('━'.repeat(60));
    console.log(JSON.stringify(stops, null, 2));
    console.log('━'.repeat(60));
    console.log(`\n📊 Toplam durak sayısı: ${stops.length}`);

  } catch (error) {
    // ============================================
    // HATA DURUMU: Kullanıcıya Bildir
    // ============================================
    console.error('❌ Hata oluştu:\n');
    if (error instanceof Error) {
      console.error('Hata Adı:', error.name);
      console.error('Hata Mesajı:', error.message);
      console.error('Stack Trace:', error.stack);
    } else {
      console.error('Bilinmeyen Hata:', error);
    }
    process.exit(1);
  }
}

// ============================================
// UYGULAMAVI BAŞLAT
// ============================================
main();
