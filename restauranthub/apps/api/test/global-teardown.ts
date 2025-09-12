import { PrismaClient } from '@prisma/client';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST || 
          'postgresql://test:test@localhost:5432/restauranthub_test?schema=public',
      },
    },
  });

  try {
    // Clean up test database
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;
    
    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};