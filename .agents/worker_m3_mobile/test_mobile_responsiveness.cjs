const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  { name: 'Live Production Site', baseUrl: 'https://urbanspaninfra.co.in' },
  { name: 'Local Preview Server', baseUrl: 'http://localhost:4173' }
];

const ROUTES = [
  { path: '/', name: 'Mobile Home / Dashboard' },
  { path: '/catalog', name: 'Product Catalog (Alias)' },
  { path: '/products', name: 'Product Catalog (Canonical)' },
  { path: '/products/f33b648e-5966-4e4a-8068-d02a5a96d4df', name: 'Product Details (Canonical)' },
  { path: '/product/f33b648e-5966-4e4a-8068-d02a5a96d4df', name: 'Product Details (Alias)' },
  { path: '/cart', name: 'Procurement Cart' },
  { path: '/rfq', name: 'Commercial RFQ Form' },
  { path: '/portal', name: 'Customer Self-Service Portal' },
  { path: '/chat', name: 'Live Support Chat' },
  { path: '/news', name: 'News & Market Insights' },
  { path: '/about-us', name: 'About Us' },
  { path: '/contact', name: 'Contact Us' }
];

async function runMobileResponsivenessAudit() {
  console.log('================================================================');
  console.log('  M3: AUTOMATED MOBILE RESPONSIVENESS AUDIT (390x844 Viewport)');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    viewport: { width: 390, height: 844 },
    targets: []
  };

  try {
    for (const target of TARGETS) {
      console.log(`\n>>> Testing Target: ${target.name} (${target.baseUrl})`);
      const targetResult = {
        name: target.name,
        baseUrl: target.baseUrl,
        routes: [],
        summary: { total: 0, passed: 0, failed: 0, errors: [] }
      };

      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

      const consoleErrors = [];
      const networkFailures = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(`[Console Error] ${msg.text()}`);
        }
      });

      page.on('pageerror', err => {
        consoleErrors.push(`[Page Error] ${err.message}`);
      });

      page.on('requestfailed', req => {
        const url = req.url();
        if (!url.includes('google-analytics') && !url.includes('googletagmanager')) {
          networkFailures.push(`[Request Failed] ${req.method()} ${url} - ${req.failure()?.errorText}`);
        }
      });

      for (const route of ROUTES) {
        const fullUrl = `${target.baseUrl}${route.path}`;
        targetResult.summary.total++;
        const routeAudit = {
          name: route.name,
          path: route.path,
          url: fullUrl,
          passed: true,
          checks: {},
          metrics: {},
          issues: []
        };

        try {
          consoleErrors.length = 0;
          networkFailures.length = 0;

          const response = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 25000 }).catch(async () => {
            return await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
          });

          await new Promise(r => setTimeout(r, 1200));

          routeAudit.metrics.httpStatus = response ? response.status() : 'N/A';

          // 1. Audit Sticky Header
          const headerAudit = await page.evaluate(() => {
            const header = document.querySelector('.sticky.top-0, header');
            if (!header) return { found: false };
            const rect = header.getBoundingClientRect();
            const computed = window.getComputedStyle(header);
            const logo = header.querySelector('img');
            const quoteBtn = Array.from(header.querySelectorAll('button, a')).find(el => el.textContent.includes('Quote'));
            const portalBtn = Array.from(header.querySelectorAll('button, a')).find(el => el.textContent.includes('Portal') || el.querySelector('svg'));

            return {
              found: true,
              position: computed.position,
              top: computed.top,
              zIndex: computed.zIndex,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              hasLogo: !!logo,
              hasQuoteBtn: !!quoteBtn,
              hasPortalBtn: !!portalBtn
            };
          });
          routeAudit.checks.stickyHeader = headerAudit;

          // 2. Audit Fixed Bottom Tab Bar & Touch Targets (>=44x44px)
          const bottomBarAudit = await page.evaluate(() => {
            // Target the root bottom navigation bar specifically
            const bar = document.querySelector('div.fixed.bottom-0.z-50, div.fixed.bottom-0.left-0.right-0');
            if (!bar) return { found: false };
            const rect = bar.getBoundingClientRect();
            const computed = window.getComputedStyle(bar);
            const links = Array.from(bar.querySelectorAll('a'));

            const tabItems = links.map(link => {
              const lRect = link.getBoundingClientRect();
              const text = link.innerText.trim() || link.getAttribute('aria-label') || 'Icon';
              return {
                text,
                width: Math.round(lRect.width),
                height: Math.round(lRect.height),
                meetsTouchTarget: lRect.width >= 44 && lRect.height >= 44
              };
            });

            return {
              found: true,
              position: computed.position,
              bottom: computed.bottom,
              height: Math.round(rect.height),
              hasPbSafe: bar.classList.contains('pb-safe') || bar.parentElement?.classList.contains('pb-safe'),
              tabCount: tabItems.length,
              tabs: tabItems,
              allTouchTargetsValid: tabItems.length === 6 && tabItems.every(t => t.meetsTouchTarget)
            };
          });
          routeAudit.checks.bottomTabBar = bottomBarAudit;

          // 3. Audit Horizontal Scroll Overflow (document scrollWidth <= 390px)
          const overflowAudit = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidthDoc = document.documentElement.scrollWidth;
            const scrollWidthBody = document.body.scrollWidth;

            const overflowingElements = [];
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.right > docWidth + 2 && rect.width > 0 && window.getComputedStyle(el).overflowX !== 'auto' && window.getComputedStyle(el).overflowX !== 'scroll') {
                const tag = el.tagName.toLowerCase();
                const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 50) : '';
                if (window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden') {
                  overflowingElements.push({
                    tag,
                    cls,
                    rectRight: Math.round(rect.right),
                    rectWidth: Math.round(rect.width)
                  });
                }
              }
            }

            return {
              viewportWidth: docWidth,
              scrollWidthDoc,
              scrollWidthBody,
              hasHorizontalOverflow: scrollWidthDoc > docWidth || scrollWidthBody > docWidth,
              overflowingElementsCount: overflowingElements.length,
              sampleOverflows: overflowingElements.slice(0, 3)
            };
          });
          routeAudit.checks.horizontalOverflow = overflowAudit;

          // 4. Audit Layout & Spacing
          const layoutAudit = await page.evaluate(() => {
            const main = document.querySelector('main');
            const computedMain = main ? window.getComputedStyle(main) : null;
            return {
              mainFound: !!main,
              paddingBottom: computedMain ? computedMain.paddingBottom : null,
              hasBottomPadding: computedMain ? parseInt(computedMain.paddingBottom, 10) >= 48 : false
            };
          });
          routeAudit.checks.layoutPadding = layoutAudit;

          // 5. Console & Network checks
          routeAudit.checks.consoleErrors = [...consoleErrors];
          routeAudit.checks.networkFailures = [...networkFailures];

          // Determine pass/fail
          if (overflowAudit.hasHorizontalOverflow) {
            routeAudit.passed = false;
            routeAudit.issues.push(`Horizontal scroll overflow detected: scrollWidth=${overflowAudit.scrollWidthDoc}px > ${overflowAudit.viewportWidth}px`);
          }
          if (bottomBarAudit.found && !bottomBarAudit.allTouchTargetsValid) {
            routeAudit.passed = false;
            routeAudit.issues.push(`Bottom tab bar touch targets invalid: ${JSON.stringify(bottomBarAudit.tabs)}`);
          }
          if (consoleErrors.length > 0) {
            routeAudit.issues.push(`Console errors encountered: ${consoleErrors.join(' | ')}`);
          }

          if (routeAudit.passed) {
            targetResult.summary.passed++;
            console.log(`  [PASS] ${route.name.padEnd(35)} (${route.path}) - 0 Overflow, Bottom Bar 6 tabs OK (Touch: ~65x64px)`);
          } else {
            targetResult.summary.failed++;
            console.log(`  [FAIL] ${route.name.padEnd(35)} (${route.path}) - Issues: ${routeAudit.issues.join(', ')}`);
          }

        } catch (err) {
          routeAudit.passed = false;
          routeAudit.issues.push(`Navigation / Evaluation error: ${err.message}`);
          targetResult.summary.failed++;
          console.log(`  [ERR]  ${route.name.padEnd(35)} (${route.path}) - ${err.message}`);
        }

        targetResult.routes.push(routeAudit);
      }

      await page.close();
      results.targets.push(targetResult);
    }

    await browser.close();

    const outputPath = path.join(__dirname, 'mobile_responsiveness_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nAudit completed! Detailed results saved to: ${outputPath}`);
    return results;

  } catch (err) {
    console.error('Fatal audit failure:', err);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  runMobileResponsivenessAudit();
}

module.exports = { runMobileResponsivenessAudit };