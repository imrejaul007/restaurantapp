const http = require('http');

// Accessibility Test Suite for RestaurantHub UI/UX
const testPages = [
  { url: 'http://localhost:3001/', name: 'Homepage' },
  { url: 'http://localhost:3001/auth/login', name: 'Login Page' },
  { url: 'http://localhost:3001/auth/signup', name: 'Signup Page' },
  { url: 'http://localhost:3001/jobs', name: 'Jobs Page' },
  { url: 'http://localhost:3001/marketplace', name: 'Marketplace Page' },
  { url: 'http://localhost:3001/community', name: 'Community Page' }
];

function checkAccessibilityFeatures(html, pageName) {
  const results = {
    page: pageName,
    accessibility: {
      hasSemanticHTML: false,
      hasAriaLabels: false,
      hasAltText: false,
      hasFormLabels: false,
      hasHeadingStructure: false,
      hasKeyboardNavigation: false,
      hasColorContrast: false,
      hasFocusIndicators: false,
      accessibilityScore: 0
    },
    mobileResponsive: {
      hasViewportMeta: false,
      hasResponsiveCSS: false,
      hasTouchFriendly: false,
      hasFlexboxGrid: false,
      mobileScore: 0
    },
    interactiveElements: {
      buttons: 0,
      forms: 0,
      links: 0,
      inputs: 0,
      selects: 0,
      textareas: 0
    },
    uxFeatures: {
      hasLoadingStates: false,
      hasErrorMessages: false,
      hasTooltips: false,
      hasModals: false,
      hasProgressIndicators: false,
      uxScore: 0
    }
  };

  // Accessibility Tests
  if (html.includes('<header>') || html.includes('<nav>') || html.includes('<main>') || html.includes('<section>') || html.includes('<footer>')) {
    results.accessibility.hasSemanticHTML = true;
  }

  if (html.includes('aria-label') || html.includes('aria-describedby') || html.includes('role=')) {
    results.accessibility.hasAriaLabels = true;
  }

  if (html.includes('alt=') && !html.includes('alt=""')) {
    results.accessibility.hasAltText = true;
  }

  if (html.includes('<label') && html.includes('for=')) {
    results.accessibility.hasFormLabels = true;
  }

  if (html.includes('<h1') && html.includes('<h2') && html.includes('<h3')) {
    results.accessibility.hasHeadingStructure = true;
  }

  if (html.includes('tabindex') || html.includes('focus:')) {
    results.accessibility.hasKeyboardNavigation = true;
  }

  if (html.includes('contrast') || html.includes('text-gray') || html.includes('dark:')) {
    results.accessibility.hasColorContrast = true;
  }

  if (html.includes('focus:ring') || html.includes('focus:outline')) {
    results.accessibility.hasFocusIndicators = true;
  }

  // Mobile Responsiveness Tests
  if (html.includes('viewport') && html.includes('width=device-width')) {
    results.mobileResponsive.hasViewportMeta = true;
  }

  if (html.includes('md:') || html.includes('lg:') || html.includes('sm:') || html.includes('@media')) {
    results.mobileResponsive.hasResponsiveCSS = true;
  }

  if (html.includes('touch') || html.includes('mobile') || html.includes('user-scalable=no')) {
    results.mobileResponsive.hasTouchFriendly = true;
  }

  if (html.includes('flex') && (html.includes('grid') || html.includes('grid-cols'))) {
    results.mobileResponsive.hasFlexboxGrid = true;
  }

  // Interactive Elements Count
  results.interactiveElements.buttons = (html.match(/<button/g) || []).length;
  results.interactiveElements.forms = (html.match(/<form/g) || []).length;
  results.interactiveElements.links = (html.match(/<a /g) || []).length;
  results.interactiveElements.inputs = (html.match(/<input/g) || []).length;
  results.interactiveElements.selects = (html.match(/<select/g) || []).length;
  results.interactiveElements.textareas = (html.match(/<textarea/g) || []).length;

  // UX Features Tests
  if (html.includes('loading') || html.includes('spinner') || html.includes('animate-spin')) {
    results.uxFeatures.hasLoadingStates = true;
  }

  if (html.includes('error') || html.includes('alert') || html.includes('danger')) {
    results.uxFeatures.hasErrorMessages = true;
  }

  if (html.includes('tooltip') || html.includes('title=')) {
    results.uxFeatures.hasTooltips = true;
  }

  if (html.includes('modal') || html.includes('dialog') || html.includes('fixed inset')) {
    results.uxFeatures.hasModals = true;
  }

  if (html.includes('progress') || html.includes('step') || html.includes('breadcrumb')) {
    results.uxFeatures.hasProgressIndicators = true;
  }

  // Calculate Scores
  const accessibilityChecks = Object.values(results.accessibility).slice(0, -1);
  results.accessibility.accessibilityScore = Math.round((accessibilityChecks.filter(Boolean).length / accessibilityChecks.length) * 100);

  const mobileChecks = Object.values(results.mobileResponsive).slice(0, -1);
  results.mobileResponsive.mobileScore = Math.round((mobileChecks.filter(Boolean).length / mobileChecks.length) * 100);

  const uxChecks = Object.values(results.uxFeatures).slice(0, -1);
  results.uxFeatures.uxScore = Math.round((uxChecks.filter(Boolean).length / uxChecks.length) * 100);

  return results;
}

function testPageContent(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let html = '';

      res.on('data', (chunk) => {
        html += chunk;
      });

      res.on('end', () => {
        const results = checkAccessibilityFeatures(html, name);
        results.status = res.statusCode;
        results.contentLength = html.length;
        resolve(results);
      });
    });

    req.on('error', (err) => {
      resolve({
        page: name,
        status: 'ERROR',
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        page: name,
        status: 'TIMEOUT',
        error: 'Request timeout'
      });
    });
  });
}

async function runComprehensiveTests() {
  console.log('🔍 RestaurantHub UI/UX Comprehensive Testing Report');
  console.log('='.repeat(60));
  console.log('Testing Frontend: http://localhost:3001');
  console.log('Test Date:', new Date().toLocaleString());
  console.log('='.repeat(60));

  const allResults = [];

  for (const page of testPages) {
    console.log(`\n📄 Testing: ${page.name}`);
    console.log('-'.repeat(40));

    const result = await testPageContent(page.url, page.name);
    allResults.push(result);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      continue;
    }

    console.log(`✅ Status: ${result.status}`);
    console.log(`📊 Content Size: ${result.contentLength} bytes`);

    console.log('\n♿ Accessibility Test Results:');
    console.log(`   Score: ${result.accessibility.accessibilityScore}%`);
    console.log(`   ✓ Semantic HTML: ${result.accessibility.hasSemanticHTML ? 'Yes' : 'No'}`);
    console.log(`   ✓ ARIA Labels: ${result.accessibility.hasAriaLabels ? 'Yes' : 'No'}`);
    console.log(`   ✓ Alt Text: ${result.accessibility.hasAltText ? 'Yes' : 'No'}`);
    console.log(`   ✓ Form Labels: ${result.accessibility.hasFormLabels ? 'Yes' : 'No'}`);
    console.log(`   ✓ Heading Structure: ${result.accessibility.hasHeadingStructure ? 'Yes' : 'No'}`);
    console.log(`   ✓ Keyboard Navigation: ${result.accessibility.hasKeyboardNavigation ? 'Yes' : 'No'}`);
    console.log(`   ✓ Focus Indicators: ${result.accessibility.hasFocusIndicators ? 'Yes' : 'No'}`);

    console.log('\n📱 Mobile Responsiveness:');
    console.log(`   Score: ${result.mobileResponsive.mobileScore}%`);
    console.log(`   ✓ Viewport Meta: ${result.mobileResponsive.hasViewportMeta ? 'Yes' : 'No'}`);
    console.log(`   ✓ Responsive CSS: ${result.mobileResponsive.hasResponsiveCSS ? 'Yes' : 'No'}`);
    console.log(`   ✓ Touch Friendly: ${result.mobileResponsive.hasTouchFriendly ? 'Yes' : 'No'}`);
    console.log(`   ✓ Flexbox/Grid: ${result.mobileResponsive.hasFlexboxGrid ? 'Yes' : 'No'}`);

    console.log('\n🎯 Interactive Elements:');
    console.log(`   Buttons: ${result.interactiveElements.buttons}`);
    console.log(`   Forms: ${result.interactiveElements.forms}`);
    console.log(`   Links: ${result.interactiveElements.links}`);
    console.log(`   Inputs: ${result.interactiveElements.inputs}`);
    console.log(`   Selects: ${result.interactiveElements.selects}`);

    console.log('\n🎨 UX Features:');
    console.log(`   Score: ${result.uxFeatures.uxScore}%`);
    console.log(`   ✓ Loading States: ${result.uxFeatures.hasLoadingStates ? 'Yes' : 'No'}`);
    console.log(`   ✓ Error Messages: ${result.uxFeatures.hasErrorMessages ? 'Yes' : 'No'}`);
    console.log(`   ✓ Tooltips: ${result.uxFeatures.hasTooltips ? 'Yes' : 'No'}`);
    console.log(`   ✓ Modals: ${result.uxFeatures.hasModals ? 'Yes' : 'No'}`);
    console.log(`   ✓ Progress Indicators: ${result.uxFeatures.hasProgressIndicators ? 'Yes' : 'No'}`);
  }

  // Generate Summary Report
  console.log('\n' + '='.repeat(60));
  console.log('📈 COMPREHENSIVE SUMMARY REPORT');
  console.log('='.repeat(60));

  const validResults = allResults.filter(r => !r.error);

  if (validResults.length > 0) {
    const avgAccessibility = Math.round(validResults.reduce((sum, r) => sum + r.accessibility.accessibilityScore, 0) / validResults.length);
    const avgMobile = Math.round(validResults.reduce((sum, r) => sum + r.mobileResponsive.mobileScore, 0) / validResults.length);
    const avgUX = Math.round(validResults.reduce((sum, r) => sum + r.uxFeatures.uxScore, 0) / validResults.length);

    console.log(`\n🏆 OVERALL SCORES:`);
    console.log(`   Accessibility Average: ${avgAccessibility}%`);
    console.log(`   Mobile Responsiveness: ${avgMobile}%`);
    console.log(`   UX Features: ${avgUX}%`);

    const totalInteractiveElements = validResults.reduce((sum, r) =>
      sum + r.interactiveElements.buttons + r.interactiveElements.forms +
      r.interactiveElements.links + r.interactiveElements.inputs + r.interactiveElements.selects, 0);

    console.log(`\n📊 INTERACTIVE ELEMENTS TOTAL: ${totalInteractiveElements}`);
    console.log(`   Total Buttons: ${validResults.reduce((sum, r) => sum + r.interactiveElements.buttons, 0)}`);
    console.log(`   Total Forms: ${validResults.reduce((sum, r) => sum + r.interactiveElements.forms, 0)}`);
    console.log(`   Total Links: ${validResults.reduce((sum, r) => sum + r.interactiveElements.links, 0)}`);
    console.log(`   Total Inputs: ${validResults.reduce((sum, r) => sum + r.interactiveElements.inputs, 0)}`);

    console.log(`\n🎯 TOP PERFORMING PAGES:`);
    validResults
      .sort((a, b) => b.accessibility.accessibilityScore - a.accessibility.accessibilityScore)
      .slice(0, 3)
      .forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.page} (Accessibility: ${result.accessibility.accessibilityScore}%)`);
      });

    console.log(`\n📱 BEST MOBILE EXPERIENCE:`);
    validResults
      .sort((a, b) => b.mobileResponsive.mobileScore - a.mobileResponsive.mobileScore)
      .slice(0, 3)
      .forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.page} (Mobile: ${result.mobileResponsive.mobileScore}%)`);
      });

    console.log(`\n✨ RECOMMENDATIONS:`);

    if (avgAccessibility < 80) {
      console.log(`   🔧 Improve accessibility by adding more ARIA labels and semantic HTML`);
    }

    if (avgMobile < 80) {
      console.log(`   📱 Enhance mobile experience with better responsive breakpoints`);
    }

    if (avgUX < 70) {
      console.log(`   🎨 Add more UX features like loading states and progress indicators`);
    }

    const overallRating = Math.round((avgAccessibility + avgMobile + avgUX) / 3);
    console.log(`\n⭐ OVERALL RATING: ${overallRating}%`);

    if (overallRating >= 90) {
      console.log(`   🏆 EXCELLENT - Outstanding UI/UX implementation!`);
    } else if (overallRating >= 75) {
      console.log(`   ✅ GOOD - Strong foundation with room for enhancement`);
    } else if (overallRating >= 60) {
      console.log(`   ⚠️  FAIR - Several areas need improvement`);
    } else {
      console.log(`   🚨 NEEDS WORK - Significant improvements required`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Testing completed successfully!');
  console.log('='.repeat(60));
}

runComprehensiveTests().catch(console.error);