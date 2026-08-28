/**
 * test_m2_browser.js
 * Comprehensive Playwright Automated E2E Test Suite for Milestone M2:
 * R2 Customer Self-Service Portal & Live Dispatch Tracker (/portal)
 */

import { chromium } from 'playwright';

const TARGET_URL = 'https://urbanspaninfra.co.in/portal';
const BUYER_EMAIL = 'sourabh.khandelwal@khandelwalinfra.com';
const BUYER_PASSWORD = 'Password123!';
const INVALID_EMAIL = 'invalid.buyer@khandelwalinfra.com';
const INVALID_PASSWORD = 'WrongPassword999!';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
  runtimeErrors: []
};

function assert(condition, message, details = null) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✅ PASS: ${message}`);
    results.tests.push({ status: 'PASS', message, details });
  } else {
    results.failed++;
    console.error(`  ❌ FAIL: ${message}`, details || '');
    results.tests.push({ status: 'FAIL', message, details });
  }
}

async function runBrowserTests() {
  console.log('================================================================');
  console.log('🌐 RUNNING M2 PLAYWRIGHT BROWSER E2E VERIFICATION SUITE');
  console.log(`Target Portal URL: ${TARGET_URL}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen to console messages and uncaught errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected 401 from deliberate negative login tests
      if (!text.includes('401') && !text.includes('status code 401') && !text.includes('favicon.ico')) {
        console.log(`  ⚠️ Browser Console Error: ${text}`);
        results.runtimeErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error(`  ❌ Uncaught Browser Exception: ${err.message}`);
    results.runtimeErrors.push(err.message);
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Portal Navigation & Initial Unauthenticated View
    // -------------------------------------------------------------
    console.log('--- Test 1: Portal Navigation & Unauthenticated Render ---');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const pageTitle = await page.title();
    assert(pageTitle.includes('Client Portal') || pageTitle.includes('Urbanspan'), `Portal page loaded with valid title: "${pageTitle}"`);

    // Verify Sign In Form Presence
    const formHeading = page.locator('h2:has-text("Urbanspan Client Sign In")').first();
    assert(await formHeading.isVisible(), `Login form heading "Urbanspan Client Sign In" is visible`);

    const emailInput = page.locator('input[type="email"]');
    const passInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    assert(await emailInput.isVisible(), `Email input field is visible`);
    assert(await passInput.isVisible(), `Password input field is visible`);
    assert(await submitBtn.isVisible(), `Submit button is visible with text: "${await submitBtn.textContent()}"`);

    // -------------------------------------------------------------
    // Test 2: Negative Authentication Error Handling
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Negative Authentication Error Handling ---');
    await emailInput.fill(INVALID_EMAIL);
    await passInput.fill(INVALID_PASSWORD);
    await submitBtn.click();

    // Wait for error banner
    const errorBanner = page.locator('div.bg-red-50, div:has-text("Invalid email or password")').first();
    await errorBanner.waitFor({ state: 'visible', timeout: 10000 });
    const errorText = await errorBanner.textContent();
    assert(errorText.includes('Invalid email or password') || errorText.includes('Authentication failed'), `Negative authentication renders expected error banner: "${errorText.trim()}"`);

    // Verify localStorage has no tokens
    const unauthStorageToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const unauthStorageUser = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
    assert(unauthStorageToken === null || unauthStorageToken === '', `localStorage 'urbanspan_customer_token' is empty on failed login`);
    assert(unauthStorageUser === null || unauthStorageUser === '', `localStorage 'urbanspan_customer_user' is empty on failed login`);

    // -------------------------------------------------------------
    // Test 3: Positive Authentication & Profile Badge Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Positive Authentication & Buyer Profile Badge ---');
    await emailInput.fill(BUYER_EMAIL);
    await passInput.fill(BUYER_PASSWORD);
    await submitBtn.click();

    // Wait for portal dashboard view
    const verifiedBadge = page.locator('span:has-text("Verified Client Account")').first();
    await verifiedBadge.waitFor({ state: 'visible', timeout: 15000 });
    assert(await verifiedBadge.isVisible(), `"Verified Client Account" badge is visible`);

    const customerNameHeading = page.locator('h2:has-text("Sourabh Khandelwal")').first();
    assert(await customerNameHeading.isVisible(), `Customer profile name "Sourabh Khandelwal" is rendered`);

    const companyEmailLine = page.locator('p:has-text("Khandelwal Infra Developers")').first();
    assert(await companyEmailLine.isVisible(), `Company & email line "Khandelwal Infra Developers • sourabh.khandelwal@khandelwalinfra.com" is rendered`);

    // Check localStorage persistence
    const savedToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const savedUserJson = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
    assert(Boolean(savedToken && savedToken.length > 20), `JWT token saved in localStorage ('urbanspan_customer_token')`);
    
    let savedUser = null;
    try { savedUser = JSON.parse(savedUserJson); } catch (e) {}
    assert(savedUser && savedUser.email === BUYER_EMAIL, `Customer profile JSON saved in localStorage ('urbanspan_customer_user')`, savedUser);

    // -------------------------------------------------------------
    // Test 4: Session Persistence across Page Reload
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Session Persistence across Page Reload ---');
    await page.reload({ waitUntil: 'networkidle' });
    
    const reloadedBadge = page.locator('span:has-text("Verified Client Account")').first();
    await reloadedBadge.waitFor({ state: 'visible', timeout: 10000 });
    assert(await reloadedBadge.isVisible(), `User session persists after full page reload without login prompt`);

    const reloadedName = page.locator('h2:has-text("Sourabh Khandelwal")').first();
    assert(await reloadedName.isVisible(), `Customer profile still visible after reload`);

    // -------------------------------------------------------------
    // Test 5: 'My Inquiries & Spot Quotes' Tab UI & Interactivity
    // -------------------------------------------------------------
    console.log('\n--- Test 5: My Inquiries & Spot Quotes Tab UI ---');
    const inquiriesTabBtn = page.locator('button:has-text("My Inquiries & Spot Quotes")').first();
    assert(await inquiriesTabBtn.isVisible(), `Inquiries Tab button is visible`);
    await inquiriesTabBtn.click();
    await page.waitForTimeout(1000);

    const inquiriesCards = page.locator('div.space-y-4 > div.p-5.rounded-2xl.bg-slate-50');
    const inqCardCount = await inquiriesCards.count();
    assert(inqCardCount > 0, `Inquiry cards rendered in tab (found ${inqCardCount} items)`);

    // Check first inquiry card details
    const firstInq = inquiriesCards.first();
    const inqTitle = await firstInq.locator('div.text-base.font-bold').first().textContent();
    assert(Boolean(inqTitle), `First inquiry title rendered: "${inqTitle?.trim()}"`);

    // Status pill
    const statusPill = firstInq.locator('span.rounded-full.text-xs.font-bold').first();
    const statusPillText = await statusPill.textContent();
    assert(Boolean(statusPillText), `Inquiry status pill rendered: "${statusPillText?.trim()}"`);

    // Budget valuation
    const budgetVal = await firstInq.locator('span.font-black.text-indigo-700').first().textContent();
    assert(Boolean(budgetVal && budgetVal.includes('₹')), `Inquiry budget value formatted in INR: "${budgetVal?.trim()}"`);

    // Test 1-click transition button on converted inquiry
    const convertedTransitionBtn = page.locator('button:has-text("View Active Supply Contract & Live Dispatch Tracker")').first();
    const hasConvertedBtn = await convertedTransitionBtn.isVisible().catch(() => false);
    if (hasConvertedBtn) {
      console.log('  Testing 1-click transition button to Active Contracts tab...');
      await convertedTransitionBtn.click();
      await page.waitForTimeout(1000);

      const activeTabBtn = page.locator('button.bg-white.text-indigo-700:has-text("Active Supply Contracts")');
      assert(await activeTabBtn.isVisible(), `1-click transition button switches active tab to 'Active Supply Contracts'`);
    }

    // -------------------------------------------------------------
    // Test 6: 'Active Supply Contracts' Tab & 5-Tier Dispatch Progress Tracker
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Active Supply Contracts & 5-Tier Dispatch Progress Tracker ---');
    const ordersTabBtn = page.locator('button:has-text("Active Supply Contracts")').first();
    await ordersTabBtn.click();
    await page.waitForTimeout(1000);

    const contractCards = page.locator('div.space-y-6 > div.p-5.rounded-2xl.bg-slate-50');
    const contractCount = await contractCards.count();
    assert(contractCount > 0, `Active contract cards rendered (found ${contractCount} contracts)`);

    // Check 5-tier dispatch tracker stages on contract cards
    const sampleContract = contractCards.first();
    const contractTitle = await sampleContract.locator('div.text-base.font-extrabold').first().textContent();
    console.log(`  Inspecting Contract Card: "${contractTitle?.trim()}"`);

    const dispatchStages = sampleContract.locator('div.grid.grid-cols-5 > div');
    const stagesCount = await dispatchStages.count();
    assert(stagesCount === 5, `5-Tier Dispatch Progress Tracker renders exactly 5 stages (found: ${stagesCount})`);

    const EXPECTED_STAGE_LABELS = [
      '1. Order Booked',
      '2. Mill Rolling',
      '3. Weighbridge Loaded',
      '4. In Transit',
      '5. Delivered'
    ];

    for (let i = 0; i < 5; i++) {
      const stageEl = dispatchStages.nth(i);
      const stageLabel = (await stageEl.locator('span').textContent())?.trim();
      assert(stageLabel === EXPECTED_STAGE_LABELS[i], `Stage ${i + 1} label matches expected: "${stageLabel}"`);
    }

    // Verify stage styling on the advanced 'weighbridge_loaded' contract
    const allContractsData = await page.$$eval('div.space-y-6 > div.p-5.rounded-2xl.bg-slate-50', (cards) => {
      return cards.map(c => {
        const title = c.querySelector('div.text-base.font-extrabold')?.textContent?.trim();
        const statusPill = c.querySelector('span.rounded-full.bg-blue-100')?.textContent?.trim();
        const stages = Array.from(c.querySelectorAll('div.grid.grid-cols-5 > div')).map(st => {
          const circle = st.querySelector('div.rounded-full');
          const label = st.querySelector('span')?.textContent?.trim();
          return {
            label,
            className: circle?.className
          };
        });
        return { title, statusPill, stages };
      });
    });

    const wbOrder = allContractsData.find(c => c.statusPill?.toLowerCase().includes('weighbridge loaded'));
    assert(Boolean(wbOrder), `Found contract with dispatch status 'weighbridge loaded' in DOM`, { title: wbOrder?.title });

    if (wbOrder && wbOrder.stages.length === 5) {
      console.log('  Verifying stage visual classes on weighbridge_loaded contract...');
      // Stage 1 (Order Booked - Completed -> emerald)
      assert(wbOrder.stages[0].className.includes('bg-emerald-500'), `Stage 1 (Order Booked) has completed emerald style ('bg-emerald-500')`);

      // Stage 2 (Mill Rolling - Completed -> emerald)
      assert(wbOrder.stages[1].className.includes('bg-emerald-500'), `Stage 2 (Mill Rolling) has completed emerald style ('bg-emerald-500')`);

      // Stage 3 (Weighbridge Loaded - Active -> indigo with ring)
      assert(wbOrder.stages[2].className.includes('bg-indigo-600') && wbOrder.stages[2].className.includes('ring-2'), `Stage 3 (Weighbridge Loaded) has active indigo style with ring ('bg-indigo-600 ring-2')`);

      // Stage 4 (In Transit - Pending -> slate)
      assert(wbOrder.stages[3].className.includes('bg-slate-200'), `Stage 4 (In Transit) has pending neutral slate style ('bg-slate-200')`);

      // Stage 5 (Delivered - Pending -> slate)
      assert(wbOrder.stages[4].className.includes('bg-slate-200'), `Stage 5 (Delivered) has pending neutral slate style ('bg-slate-200')`);
    }

    // -------------------------------------------------------------
    // Test 7: Sidebar & Administrative Widgets
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Sidebar Widgets & Refresh Controls ---');
    const keyAccountWidget = page.locator('div:has-text("Key Account Team")').first();
    assert(await keyAccountWidget.isVisible(), `"Key Account Team" sidebar widget is visible`);
    assert(await page.locator('text="Sunil Sharma"').first().isVisible(), `Key account executive "Sunil Sharma" rendered`);
    assert(await page.locator('text="sunil.approvals@urbanspan.com"').first().isVisible(), `Commercial approvals email rendered`);

    const opsContactWidget = page.locator('div:has-text("Operations & Dispatch Contact")').first();
    assert(await opsContactWidget.isVisible(), `"Operations & Dispatch Contact" widget is visible`);
    assert(await page.locator('text="Vikram Patel"').first().isVisible(), `Logistics coordinator "Vikram Patel" rendered`);

    const appVersionWidget = page.locator('div:has-text("Urbanspan App")').first();
    assert(await appVersionWidget.isVisible(), `App Version & OTA Info widget is visible`);

    const apkDownloadLink = page.locator('a[href*="urbanspan-app-v3.apk"]').first();
    assert(await apkDownloadLink.isVisible(), `Direct APK download button is present and linked`);

    // Refresh orders button test
    const refreshBtn = page.locator('button[title="Refresh Orders"]').first();
    assert(await refreshBtn.isVisible(), `Refresh Orders button is visible`);
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    assert(await contractCards.count() > 0, `Contracts reloaded successfully after refresh trigger`);

    // -------------------------------------------------------------
    // Test 8: Mobile Viewport Parity (390x844)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Mobile Viewport Parity (390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);

    // Verify no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!hasHorizontalScroll, `0 Horizontal overflow on mobile viewport (390x844) (scrollWidth: ${await page.evaluate(() => document.documentElement.scrollWidth)}px, windowWidth: 390px)`);

    const mobileProfileName = page.locator('h2:has-text("Sourabh Khandelwal")').first();
    assert(await mobileProfileName.isVisible(), `Customer profile header renders cleanly on mobile viewport`);

    const mobileInquiriesTab = page.locator('button:has-text("My Inquiries")').first();
    assert(await mobileInquiriesTab.isVisible(), `Mobile tab buttons are visible and accessible`);

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // Test 9: Sign Out Flow
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Sign Out Flow ---');
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    assert(await signOutBtn.isVisible(), `Sign Out button is visible`);
    await signOutBtn.click();
    await page.waitForTimeout(1000);

    const postLogoutHeading = page.locator('h2:has-text("Urbanspan Client Sign In")').first();
    await postLogoutHeading.waitFor({ state: 'visible', timeout: 5000 });
    assert(await postLogoutHeading.isVisible(), `View transitions back to Sign In form upon sign out`);

    const clearedToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const clearedUser = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
    assert(clearedToken === null, `localStorage 'urbanspan_customer_token' is removed on logout`);
    assert(clearedUser === null, `localStorage 'urbanspan_customer_user' is removed on logout`);

    // -------------------------------------------------------------
    // Test 10: 0 Console Errors Audit
    // -------------------------------------------------------------
    console.log('\n--- Test 10: 0 JavaScript Console Errors Audit ---');
    assert(results.runtimeErrors.length === 0, `0 Unexpected JavaScript runtime errors/exceptions encountered throughout E2E run (found: ${results.runtimeErrors.length})`, results.runtimeErrors);

  } catch (err) {
    console.error('Fatal browser test error:', err);
    assert(false, `Browser test suite encountered unhandled error: ${err.message}`);
  } finally {
    await browser.close();
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 M2 BROWSER E2E TEST SUMMARY: ${results.passed}/${results.total} PASSED (${results.failed} FAILED)`);
  console.log('================================================================\n');

  return results;
}

runBrowserTests().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  }
}).catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
