const http = require('http');
const https = require('https');

// Test different pages and endpoints
const testPages = [
  { url: 'http://localhost:3001/', name: 'Homepage' },
  { url: 'http://localhost:3001/auth/login', name: 'Login Page' },
  { url: 'http://localhost:3001/auth/signup', name: 'Signup Page' },
  { url: 'http://localhost:3001/jobs', name: 'Jobs Page' },
  { url: 'http://localhost:3001/marketplace', name: 'Marketplace Page' },
  { url: 'http://localhost:3001/community', name: 'Community Page' },
];

function testUrl(url, name) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          name,
          url,
          status: res.statusCode,
          headers: res.headers,
          hasContent: data.length > 0,
          contentLength: data.length,
          isHtml: res.headers['content-type']?.includes('text/html'),
          hasTitle: data.includes('<title>'),
          hasNavigation: data.includes('nav') || data.includes('header'),
          hasFooter: data.includes('footer'),
          hasButtons: data.includes('button') || data.includes('btn'),
          hasForms: data.includes('<form'),
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name,
        url,
        error: err.message,
        status: 'ERROR'
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name,
        url,
        error: 'Timeout',
        status: 'TIMEOUT'
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Starting UI/UX Testing for RestaurantHub');
  console.log('=' * 50);

  for (const page of testPages) {
    console.log(`\n📄 Testing: ${page.name}`);
    const result = await testUrl(page.url, page.name);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
    } else {
      console.log(`✅ Status: ${result.status}`);
      console.log(`📊 Content Length: ${result.contentLength} bytes`);
      console.log(`🌐 Is HTML: ${result.isHtml ? 'Yes' : 'No'}`);
      console.log(`📝 Has Title: ${result.hasTitle ? 'Yes' : 'No'}`);
      console.log(`🧭 Has Navigation: ${result.hasNavigation ? 'Yes' : 'No'}`);
      console.log(`🦶 Has Footer: ${result.hasFooter ? 'Yes' : 'No'}`);
      console.log(`🔘 Has Buttons: ${result.hasButtons ? 'Yes' : 'No'}`);
      console.log(`📋 Has Forms: ${result.hasForms ? 'Yes' : 'No'}`);
    }
  }

  console.log('\n✨ Testing completed!');
}

runTests().catch(console.error);