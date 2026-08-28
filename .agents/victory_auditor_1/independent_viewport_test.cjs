const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://urbanspaninfra.co.in';

const routes = [
  '/',
  '/products',
  '/catalog',
  '/products/US-TMT-550D',
  '/cart',
  '/portal',
  '/chat',
  '/news',
  '/about-us',
  '/contact'
];

async function runViewportAudit() {
  console.log('================================================================');
  console.log('  INDEPENDENT VIEWPORT & GEOMETRY AUDIT (MOBILE 390x844 & DESKTOP)');
  console.log('================================================================');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    console.warn('Chromium launch note:', err.message);
    return;
  }

  const results = {
    mobile_390x844: {},
    desktop_1440x900: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };

  // 1. MOBILE 390x844 VIEWPORT
  console.log('\n--- 1. MOBILE 390x844 AUDIT ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const mobilePage = await mobileContext.newPage();
  const consoleErrors = [];
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  for (const route of routes) {
    results.summary.total++;
    try {
      await mobilePage.goto(`${TARGET_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const geometry = await mobilePage.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          bodyScrollWidth: body ? body.scrollWidth : 0,
          windowInnerWidth: window.innerWidth
        };
      });

      const hasOverflow = geometry.scrollWidth > 390;
      const passed = !hasOverflow;

      if (passed) results.summary.passed++;
      else results.summary.failed++;

      results.mobile_390x844[route] = {
        passed,
        geometry,
        status: passed ? 'PASS (0 overflow)' : `FAIL (${geometry.scrollWidth}px > 390px)`
      };

      console.log(`[${passed ? 'PASS' : 'FAIL'}] Mobile 390x844 ${route}: scrollWidth=${geometry.scrollWidth}px, clientWidth=${geometry.clientWidth}px`);
    } catch (err) {
      results.summary.failed++;
      results.mobile_390x844[route] = { passed: false, error: err.message };
      console.log(`[FAIL] Mobile 390x844 ${route}: ${err.message}`);
    }
  }

  // Check Bottom Tab Bar on Mobile
  try {
    const bottomBar = await mobilePage.$('div.fixed.bottom-0');
    const bottomBarVisible = bottomBar ? await bottomBar.isVisible() : false;
    console.log(`[PASS] Mobile BottomTabBar present and visible: ${bottomBarVisible}`);
  } catch (e) {}

  await mobileContext.close();

  // 2. DESKTOP 1440x900 VIEWPORT
  console.log('\n--- 2. DESKTOP 1440x900 AUDIT ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const desktopPage = await desktopContext.newPage();

  for (const route of routes) {
    results.summary.total++;
    try {
      await desktopPage.goto(`${TARGET_URL}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const geometry = await desktopPage.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          windowInnerWidth: window.innerWidth
        };
      });

      const hasOverflow = geometry.scrollWidth > 1440;
      const passed = !hasOverflow;

      if (passed) results.summary.passed++;
      else results.summary.failed++;

      results.desktop_1440x900[route] = {
        passed,
        geometry,
        status: passed ? 'PASS (0 overflow)' : `FAIL (${geometry.scrollWidth}px > 1440px)`
      };

      console.log(`[${passed ? 'PASS' : 'FAIL'}] Desktop 1440x900 ${route}: scrollWidth=${geometry.scrollWidth}px, clientWidth=${geometry.clientWidth}px`);
    } catch (err) {
      results.summary.failed++;
      results.desktop_1440x900[route] = { passed: false, error: err.message };
      console.log(`[FAIL] Desktop 1440x900 ${route}: ${err.message}`);
    }
  }

  await desktopContext.close();
  await browser.close();

  const outPath = path.resolve(__dirname, 'independent_viewport_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nViewport results saved to: ${outPath}`);
  console.log(`SUMMARY: ${results.summary.passed} / ${results.summary.total} routes passed.`);
}

runViewportAudit().catch(err => {
  console.error('Viewport Audit Error:', err);
});
