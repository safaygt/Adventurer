/**
 * Prisma Database Singleton
 * 
 * Bu dosya, Prisma Client'ının singleton örneğini yönetir.
 * Uygulama başladığında tek bir veritabanı bağlantısı açılır ve
 * tüm modüller bu bağlantıyı paylaşır.
 */

import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma/client.js';

let prismaClientInstance: GeneratedPrismaClient | null = null;

/**
 * getPrismaClient()
 * 
 * Prisma Client singleton'unu döndürür.
 * İlk çağrıda yeni instance oluşturulur, sonraki çağrılarda cache'lenmiş örnek döndürülür.
 * 
 * @returns Prisma Client instance
 */
export function getPrismaClient(): GeneratedPrismaClient {
  if (!prismaClientInstance) {
    prismaClientInstance = new GeneratedPrismaClient({} as any);
  }
  return prismaClientInstance;
}

/**
 * closePrismaClient()
 * 
 * Veritabanı bağlantısını kapatır.
 * Sunucu kapanırken veya graceful shutdown sırasında çağrılmalıdır.
 */
export async function closePrismaClient(): Promise<void> {
  if (prismaClientInstance) {
    await prismaClientInstance.$disconnect();
    prismaClientInstance = null;
  }
}
