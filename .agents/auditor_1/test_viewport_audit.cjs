/**
 * Viewport & Responsive Layout Forensic Audit
 * Author: auditor_1
 * Viewports: Desktop 1440x900, Mobile 390x844
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://urbanspaninfra.co.in';

const ROUTES_TO_AUDIT = [
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
  console.log('VIEWPORT & RESPONSIVE LAYOUT FORENSIC AUDIT');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const report = {
    timestamp: new Date().toISOString(),
    mobileResults: [],
    desktopResults: [],
    summary: { totalRoutes: ROUTES_TO_AUDIT.length, mobilePass: 0, desktopPass: 0, errors: 0 }
  };

  // -------------------------------------------------------------
  // PART 1: MOBILE VIEWPORT (390x844)
  // -------------------------------------------------------------
  console.log('--- AUDITING MOBILE VIEWPORT (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  const mobileConsoleErrors = [];
  mobilePage.on('pageerror', err => mobileConsoleErrors.push(err.message));
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') mobileConsoleErrors.push(msg.text());
  });

  for (const route of ROUTES_TO_AUDIT) {
    const url = `${BASE_URL}${route}`;
    try {
      await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await mobilePage.waitForTimeout(500);

      const metrics = await mobilePage.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientW = docEl.clientWidth;
        const hasHorizontalOverflow = scrollW > clientW + 1; // 1px tolerance

        // Touch targets check in bottom tab bar if present
        const bottomBar = document.querySelector('div.fixed.bottom-0');
        let touchTargetPass = true;
        let tabDimensions = [];
        if (bottomBar) {
          const links = bottomBar.querySelectorAll('a');
          links.forEach(l => {
            const rect = l.getBoundingClientRect();
            tabDimensions.push({ width: Math.round(rect.width), height: Math.round(rect.height) });
            if (rect.width < 40 || rect.height < 40) {
              touchTargetPass = false;
            }
          });
        }

        return {
          scrollWidth: scrollW,
          clientWidth: clientW,
          hasHorizontalOverflow,
          hasBottomBar: !!bottomBar,
          touchTargetPass,
          tabDimensions
        };
      });

      const pass = !metrics.hasHorizontalOverflow && metrics.touchTargetPass;
      if (pass) report.summary.mobilePass++;

      console.log(`[MOBILE 390x844] Route "${route}": scrollWidth=${metrics.scrollWidth}px, clientWidth=${metrics.clientWidth}px, overflow=${metrics.hasHorizontalOverflow}, bottomBar=${metrics.hasBottomBar} -> ${pass ? 'PASS' : 'FAIL'}`);

      report.mobileResults.push({
        route,
        url,
        metrics,
        pass
      });
    } catch (err) {
      console.error(`[MOBILE ERROR] Route "${route}" failed:`, err.message);
      report.mobileResults.push({ route, url, error: err.message, pass: false });
    }
  }

  // -------------------------------------------------------------
  // PART 2: DESKTOP VIEWPORT (1440x900)
  // -------------------------------------------------------------
  console.log('\n--- AUDITING DESKTOP VIEWPORT (1440x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const desktopPage = await desktopContext.newPage();
  const desktopConsoleErrors = [];
  desktopPage.on('pageerror', err => desktopConsoleErrors.push(err.message));
  desktopPage.on('console', msg => {
    if (msg.type() === 'error') desktopConsoleErrors.push(msg.text());
  });

  for (const route of ROUTES_TO_AUDIT) {
    if (route === '/chat') continue; // Mobile-only full-screen route
    const url = `${BASE_URL}${route}`;
    try {
      await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await desktopPage.waitForTimeout(500);

      const desktopMetrics = await desktopPage.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientW = docEl.clientWidth;
        const hasNavbar = !!document.querySelector('nav');
        const hasFloatingChat = !!document.querySelector('div.fixed.bottom-24, div.fixed.bottom-6, div.fixed.right-6');

        return {
          scrollWidth: scrollW,
          clientWidth: clientW,
          hasNavbar,
          hasFloatingChat
        };
      });

      const pass = desktopMetrics.scrollWidth <= desktopMetrics.clientWidth + 2;
      if (pass) report.summary.desktopPass++;

      console.log(`[DESKTOP 1440x900] Route "${route}": scrollW=${desktopMetrics.scrollWidth}px, clientW=${desktopMetrics.clientWidth}px, navbar=${desktopMetrics.hasNavbar} -> ${pass ? 'PASS' : 'FAIL'}`);

      report.desktopResults.push({
        route,
        url,
        metrics: desktopMetrics,
        pass
      });
    } catch (err) {
      console.error(`[DESKTOP ERROR] Route "${route}" failed:`, err.message);
      report.desktopResults.push({ route, url, error: err.message, pass: false });
    }
  }

  // Floating chat widget drawer interaction test on desktop
  console.log('\n--- TESTING DESKTOP FLOATING LIVE CHAT DRAWER ---');
  try {
    await desktopPage.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(1000);

    // Look for launcher button
    const launcher = desktopPage.locator('div.fixed.bottom-6.right-6 button, div.fixed.bottom-24.right-6 button').first();
    const launcherVisible = await launcher.isVisible();
    console.log(`Floating launcher visible on Desktop: ${launcherVisible}`);

    if (launcherVisible) {
      await launcher.click();
      await desktopPage.waitForTimeout(500);

      // Check drawer window
      const drawer = desktopPage.locator('div.fixed.bottom-6.right-6 div, div.fixed.bottom-24.right-6 div').first();
      const drawerVisible = await drawer.isVisible();
      console.log(`Chat drawer opened on Desktop: ${drawerVisible}`);

      // Close drawer
      const closeBtn = desktopPage.locator('button:has(svg.lucide-x), button:has(svg.lucide-close)').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await desktopPage.waitForTimeout(300);
        console.log('Closed chat drawer cleanly via X button');
      }
    }
  } catch (err) {
    console.warn('Desktop floating chat drawer interaction note:', err.message);
  }

  await browser.close();

  report.mobileConsoleErrors = mobileConsoleErrors;
  report.desktopConsoleErrors = desktopConsoleErrors;

  fs.writeFileSync(
    path.join(__dirname, 'viewport_audit_results.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n================================================================');
  console.log(`MOBILE AUDIT: ${report.summary.mobilePass}/${ROUTES_TO_AUDIT.length} Passed`);
  console.log(`DESKTOP AUDIT: ${report.summary.desktopPass}/${ROUTES_TO_AUDIT.length - 1} Passed`);
  console.log(`CONSOLE ERRORS: Mobile=${mobileConsoleErrors.length}, Desktop=${desktopConsoleErrors.length}`);
  console.log('================================================================');
}

runViewportAudit().catch(err => {
  console.error('Fatal viewport audit error:', err);
  process.exit(1);
});
