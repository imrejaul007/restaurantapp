import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log('🚀 Starting global setup...');

  // Launch browser and create a page for setup operations
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready
    console.log(`📱 Checking if app is ready at ${baseURL}...`);
    await page.goto(baseURL || 'http://localhost:3001', { waitUntil: 'networkidle' });

    // You can add authentication setup here if needed
    // For example, create test users, setup test data, etc.

    console.log('✅ App is ready for testing');

    // Store authentication state if needed
    // await page.context().storageState({ path: 'auth-state.json' });

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;