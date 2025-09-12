import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

export default async function globalSetup() {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  console.log('🚀 Setting up test environment...');

  // Set test database URL
  const testDatabaseUrl = process.env.DATABASE_URL_TEST || 
    'postgresql://test:test@localhost:5432/restauranthub_test?schema=public';
  
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = 'test';

  try {
    // Reset test database
    console.log('📁 Resetting test database...');
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    });

    // Apply migrations
    console.log('🔄 Applying database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    });

    // Generate Prisma client
    console.log('⚡ Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });

    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
};