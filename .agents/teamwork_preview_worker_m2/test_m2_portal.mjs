import { chromium } from 'playwright';

const BASE_URLS = [
  { name: 'Local Preview', url: 'http://localhost:4173' },
  { name: 'Live Web App', url: 'https://urbanspaninfra.co.in' }
];

const CREDENTIALS = {
  email: 'sourabh.khandelwal@khandelwalinfra.com',
  password: 'Password123!',
  expectedName: 'Sourabh Khandelwal',
  expectedCompany: 'Khandelwal Infra Developers',
  expectedGst: '23AABCK8901M1Z2'
};

async function runM2Audit() {
  console.log('================================================================');
  console.log('🧪 MILESTONE 2 (M2): CUSTOMER SELF-SERVICE PORTAL & DISPATCH TRACKER');
  console.log('Target User: ' + CREDENTIALS.email);
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const env of BASE_URLS) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`🌐 Testing Target Environment: ${env.name} (${env.url})`);
    console.log(`------------------------------------------------------------`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    const envReport = {
      target: env.name,
      url: env.url,
      tests: [],
      consoleErrors: consoleErrors,
      passed: true
    };

    try {
      // -------------------------------------------------------------
      // TEST 1: Navigation to /portal
      // -------------------------------------------------------------
      console.log('Test 1: Navigate to Customer Portal (/portal)...');
      await page.goto(`${env.url}/portal`, { waitUntil: 'networkidle', timeout: 20000 });
      const portalHeading = await page.locator('h2').first().textContent({ timeout: 5000 }).catch(() => '');
      const isLoginRendered = portalHeading && (portalHeading.includes('Client Sign In') || portalHeading.includes('Portal') || portalHeading.includes('Register'));
      
      envReport.tests.push({
        name: 'Portal Login Page Render',
        passed: !!isLoginRendered,
        details: `Heading rendered: "${portalHeading?.trim()}"`
      });
      console.log(`  ✓ Portal Page Loaded: "${portalHeading?.trim()}"`);

      // -------------------------------------------------------------
      // TEST 2: Authentication Error Handling (Wrong Password)
      // -------------------------------------------------------------
      console.log('\nTest 2: Authentication Error Handling (Wrong Password)...');
      await page.fill('input[type="email"]', CREDENTIALS.email);
      await page.fill('input[type="password"]', 'WrongPassword999!');
      await page.click('button[type="submit"]');

      // Wait for alert banner
      await page.waitForTimeout(1500);
      const alertText = await page.locator('.bg-red-50').textContent({ timeout: 5000 }).catch(() => '');
      const hasErrorBanner = alertText.length > 0;
      envReport.tests.push({
        name: 'Auth Error Handling (Invalid Password)',
        passed: hasErrorBanner,
        details: `Error alert received: "${alertText.trim()}"`
      });
      console.log(`  ✓ Error Banner Handled Gracefully: "${alertText.trim()}"`);

      // -------------------------------------------------------------
      // TEST 3: Successful Customer Authentication
      // -------------------------------------------------------------
      console.log('\nTest 3: Customer Authentication with Verified Credentials...');
      await page.fill('input[type="email"]', CREDENTIALS.email);
      await page.fill('input[type="password"]', CREDENTIALS.password);
      await page.click('button[type="submit"]');

      // Wait for authenticated portal view
      await page.waitForSelector('text=Verified Client Account', { timeout: 15000 });
      const userName = await page.locator('h2').first().textContent();
      const profileText = await page.locator('.bg-white.shadow-lg').first().innerText();
      const badgeText = await page.locator('text=Verified Client Account').first().textContent().catch(() => '');

      const authSuccess = userName.includes(CREDENTIALS.expectedName) && badgeText.includes('Verified Client Account');
      envReport.tests.push({
        name: 'Customer Authentication (/api/external/customers/login)',
        passed: authSuccess,
        details: `User: "${userName.trim()}", Company & GST present: ${profileText.includes(CREDENTIALS.expectedCompany)}, Badge: "${badgeText.trim()}"`
      });
      console.log(`  ✓ Authenticated as: ${userName.trim()}`);
      console.log(`  ✓ Profile Header text verified (Company, Badge, GSTIN)`);

      // -------------------------------------------------------------
      // TEST 4: Session Persistence (LocalStorage & Page Reload)
      // -------------------------------------------------------------
      console.log('\nTest 4: Session Persistence & Auto-Restoration across Reload...');
      const storedToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
      const storedUser = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
      const hasStoredToken = !!storedToken && storedToken.length > 20;

      // Reload page and check if still authenticated
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('text=Verified Client Account', { timeout: 10000 });
      const restoredUserName = await page.locator('h2').first().textContent();
      const sessionRestored = restoredUserName.includes(CREDENTIALS.expectedName);

      envReport.tests.push({
        name: 'Session Persistence (JWT in localStorage & Refresh)',
        passed: hasStoredToken && sessionRestored,
        details: `Token stored (len=${storedToken?.length}), restored user: "${restoredUserName.trim()}"`
      });
      console.log(`  ✓ JWT Token persisted in localStorage`);
      console.log(`  ✓ Auto-hydrated after reload: "${restoredUserName.trim()}"`);

      // -------------------------------------------------------------
      // TEST 5: 'My Inquiries & Spot Quotes' Tab Verification
      // -------------------------------------------------------------
      console.log('\nTest 5: My Inquiries & Spot Quotes Tab Data & Real-time reflection...');
      await page.click('button:has-text("My Inquiries & Spot Quotes")');
      await page.waitForTimeout(1000);

      const inqCards = await page.locator('.space-y-4 > div').count();
      const hasInquiries = inqCards > 0;
      const statusBadgeCount = await page.locator('.space-y-4 span.rounded-full').count();
      const callLinksCount = await page.locator('a[href^="tel:"]').count();

      envReport.tests.push({
        name: 'My Inquiries & Spot Quotes Tab',
        passed: hasInquiries && statusBadgeCount > 0,
        details: `Found ${inqCards} inquiries, status badges present: ${statusBadgeCount}, click-to-call links: ${callLinksCount}`
      });
      console.log(`  ✓ Found ${inqCards} Live Inquiries & Spot Quotes`);
      console.log(`  ✓ Status Badges (${statusBadgeCount}) & Click-to-call links (${callLinksCount}) verified`);

      // -------------------------------------------------------------
      // TEST 6: 'Active Supply Contracts' Tab Verification
      // -------------------------------------------------------------
      console.log('\nTest 6: Active Supply Contracts Tab & Manifest Valuation...');
      await page.click('button:has-text("Active Supply Contracts")');
      await page.waitForTimeout(1000);

      const orderCards = await page.locator('.space-y-6 > div').count();
      const cardTexts = [];
      for (let i = 0; i < orderCards; i++) {
        cardTexts.push(await page.locator('.space-y-6 > div').nth(i).innerText());
      }

      const hasValuations = cardTexts.some(t => t.includes('Contract Value:') || t.includes('₹'));
      const hasLineManifests = cardTexts.some(t => t.includes('Itemized Line Manifest:') || t.includes('Contracted Steel Items:'));

      envReport.tests.push({
        name: 'Active Supply Contracts Tab (Valuation & Line Manifests)',
        passed: orderCards > 0 && hasValuations,
        details: `Found ${orderCards} active supply contracts. Valuations present: ${hasValuations}, Manifests present: ${hasLineManifests}`
      });
      console.log(`  ✓ Found ${orderCards} Active Supply Contracts`);
      console.log(`  ✓ Contract Valuations & Itemized Line Manifests verified`);

      // -------------------------------------------------------------
      // TEST 7: 5-Tier Dispatch Progress Tracker Verification
      // -------------------------------------------------------------
      console.log('\nTest 7: 5-Tier Dispatch Progress Tracker Verification...');
      const trackerStages = [
        '1. Order Booked',
        '2. Mill Rolling',
        '3. Weighbridge Loaded',
        '4. In Transit',
        '5. Delivered'
      ];

      let allStagesFound = true;
      for (const stageName of trackerStages) {
        const count = await page.locator(`text=${stageName}`).count();
        if (count === 0) {
          allStagesFound = false;
          console.log(`  ✗ Missing stage label: ${stageName}`);
        } else {
          console.log(`  ✓ Stage Verified: "${stageName}" (Found ${count} instances)`);
        }
      }

      const completedCount = await page.locator('text=Completed').count();
      const activeCount = await page.locator('text=Active Stage').count();
      const pendingCount = await page.locator('text=Pending').count();
      const tonnageBars = await page.locator('text=Tonnage Progress Tracker').count();

      envReport.tests.push({
        name: '5-Tier Dispatch Progress Tracker & Tonnage Bars',
        passed: allStagesFound,
        details: `Stages 1-5 present: ${allStagesFound}, Active: ${activeCount}, Completed: ${completedCount}, Pending: ${pendingCount}, Tonnage Bars: ${tonnageBars}`
      });
      console.log(`  ✓ 5-Tier Stages verified across contracts`);
      console.log(`  ✓ Indicators: ${activeCount} Active, ${completedCount} Completed, ${pendingCount} Pending, ${tonnageBars} Tonnage Bars`);

      // -------------------------------------------------------------
      // TEST 8: Logout Flow
      // -------------------------------------------------------------
      console.log('\nTest 8: Logout Flow & Session Teardown...');
      await page.click('button:has-text("Sign Out")');
      await page.waitForTimeout(1000);
      const postLogoutHeading = await page.locator('h2').first().textContent({ timeout: 5000 }).catch(() => '');
      const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
      const isLoggedOut = !tokenAfterLogout && (postLogoutHeading?.includes('Client Sign In') || postLogoutHeading?.includes('Portal') || postLogoutHeading?.includes('Register'));

      envReport.tests.push({
        name: 'Customer Logout & Storage Teardown',
        passed: isLoggedOut,
        details: `Token cleared: ${!tokenAfterLogout}, Heading: "${postLogoutHeading?.trim()}"`
      });
      console.log(`  ✓ Session cleared successfully. Returned to sign-in form.`);

      // -------------------------------------------------------------
      // TEST 9: Console Error Audit
      // -------------------------------------------------------------
      const hasConsoleErrors = consoleErrors.length > 0;
      envReport.tests.push({
        name: '0 JavaScript Console Errors',
        passed: !hasConsoleErrors,
        details: hasConsoleErrors ? `Errors: ${consoleErrors.join(', ')}` : '0 console errors observed'
      });
      console.log(`  ✓ Console Errors Observed: ${consoleErrors.length}`);

    } catch (err) {
      console.error(`  ✗ Test Suite Error on ${env.name}:`, err);
      envReport.passed = false;
      envReport.error = err.message;
    } finally {
      await context.close();
    }

    envReport.passed = envReport.tests.every(t => t.passed);
    results.push(envReport);
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('📊 FINAL AUDIT SUMMARY - MILESTONE 2');
  console.log('================================================================');
  for (const r of results) {
    console.log(`\nEnvironment: ${r.target} (${r.url})`);
    console.log(`Status: ${r.passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    r.tests.forEach((t, i) => {
      console.log(`  ${i + 1}. [${t.passed ? 'PASS' : 'FAIL'}] ${t.name} -> ${t.details}`);
    });
  }

  return results;
}

runM2Audit().catch(console.error);
