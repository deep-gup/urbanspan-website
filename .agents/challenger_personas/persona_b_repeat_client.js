/**
 * Persona B: Verified Repeat Client Simulation
 * Persona: Sourabh Khandelwal (Khandelwal Infra Developers)
 * Credentials: sourabh.khandelwal@khandelwalinfra.com | Password123!
 * Viewports: Desktop (1440x900) & Mobile (390x844)
 * 
 * Journey:
 * 1. Logs into /portal on Desktop (1440x900) with verified credentials
 * 2. Intercepts JWT auth token & verifies "Verified Client Account" badge
 * 3. Inspects 'My Inquiries & Spot Quotes' tab & real-time RFQ statuses
 * 4. Switches to 'Active Supply Contracts' tab & audits 5-tier dispatch tracker on Contract #5
 * 5. Verifies 5 stages: Order Booked (Done), Mill Rolling (Done), Weighbridge Loaded (Current), In Transit (Pending), Delivered (Pending)
 * 6. Tests Mobile Viewport (390x844) responsiveness, session persistence & zero overflow
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'https://urbanspaninfra.co.in';

export async function runPersonaB() {
  console.log('================================================================');
  console.log('🚀 STARTING PERSONA B: VERIFIED REPEAT CLIENT');
  console.log('👤 Profile: Sourabh Khandelwal | Khandelwal Infra Developers');
  console.log('🔑 Credentials: sourabh.khandelwal@khandelwalinfra.com | Password123!');
  console.log('🖥️ Viewports: Desktop (1440x900) & Mobile (390x844)');
  console.log('🌐 Target URL:', BASE_URL);
  console.log('================================================================\n');

  const results = {
    persona: 'Persona B - Verified Repeat Client (Sourabh Khandelwal)',
    viewports: ['1440x900 (Desktop)', '390x844 (Mobile)'],
    timestamp: new Date().toISOString(),
    steps: [],
    networkLogs: [],
    consoleLogs: [],
    passed: false,
    assertions: []
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // PART 1: DESKTOP SIMULATION (1440x900)
    // -------------------------------------------------------------
    console.log('--- PART 1: DESKTOP VIEWPORT (1440x900) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 UrbanSpanRepeatClient/1.0'
    });
    const page = await desktopContext.newPage();

    page.on('console', msg => {
      results.consoleLogs.push(`[DESKTOP CONSOLE] ${msg.text()}`);
    });

    page.on('response', async res => {
      const url = res.url();
      if (url.includes('/api/external/')) {
        const entry = {
          url,
          status: res.status(),
          method: res.request().method()
        };
        try { entry.responseBody = await res.json(); } catch (e) {}
        results.networkLogs.push(entry);
        console.log(`  📡 [NET RES] ${res.request().method()} ${url} -> Status ${res.status()}`);
      }
    });

    // Step 1: Navigate to /portal
    console.log('👉 Step 1: Navigating to /portal...');
    await page.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const loginTitle = await page.locator('h2:has-text("Urbanspan Client Sign In")').or(page.locator('h2:has-text("Sourabh")')).isVisible();
    console.log(`  ✓ Portal page reached (Login form visible: ${loginTitle})`);

    // Step 2: Perform Customer Authentication
    console.log('👉 Step 2: Entering credentials sourabh.khandelwal@khandelwalinfra.com...');
    await page.fill('input[type="email"]', 'sourabh.khandelwal@khandelwalinfra.com');
    await page.fill('input[type="password"]', 'Password123!');

    const authPromise = page.waitForResponse(res => res.url().includes('/api/external/customers/login'), { timeout: 15000 });
    await page.click('button[type="submit"]:has-text("Sign In to Portal")');

    const authRes = await authPromise;
    console.log(`  ✓ Auth API Status: ${authRes.status()}`);
    const authData = await authRes.json();
    const tokenAcquired = !!authData?.data?.token;
    console.log(`  ✓ JWT Token issued: ${tokenAcquired ? 'YES' : 'NO'}`);
    results.assertions.push({ name: 'Customer Auth API 200 OK & JWT issued', passed: authRes.status() === 200 && tokenAcquired });

    await page.waitForTimeout(2000);

    // Step 3: Verify Verified Account Badge & Profile Info
    console.log('👉 Step 3: Verifying logged-in profile dashboard...');
    const verifiedBadge = await page.locator('text=Verified Client Account').isVisible();
    const customerName = await page.locator('h2:has-text("Sourabh Khandelwal")').isVisible();
    const companyName = await page.locator('text=Khandelwal Infra Developers').isVisible();

    console.log(`  ✓ Verified Client Account Badge: ${verifiedBadge}`);
    console.log(`  ✓ Customer Name "Sourabh Khandelwal": ${customerName}`);
    console.log(`  ✓ Organization "Khandelwal Infra Developers": ${companyName}`);

    results.assertions.push({ name: 'Verified Client Account badge rendered', passed: verifiedBadge });
    results.assertions.push({ name: 'Customer name displayed correctly', passed: customerName });
    results.assertions.push({ name: 'Company name displayed correctly', passed: companyName });

    // Step 4: Verify 'My Inquiries & Spot Quotes' Tab
    console.log('👉 Step 4: Inspecting "My Inquiries & Spot Quotes" tab...');
    const inquiriesTabBtn = page.locator('button:has-text("My Inquiries & Spot Quotes")');
    await inquiriesTabBtn.click();
    await page.waitForTimeout(1500);

    const inquiriesCount = await page.locator('.space-y-4 > div.p-5').count();
    console.log(`  ✓ Inquiries rendered in portal: ${inquiriesCount}`);
    results.assertions.push({ name: 'Inquiries list populated', passed: inquiriesCount > 0, count: inquiriesCount });

    // Step 5: Switch to 'Active Supply Contracts' Tab
    console.log('👉 Step 5: Switching to "Active Supply Contracts" tab...');
    const contractsTabBtn = page.locator('button:has-text("Active Supply Contracts")');
    await contractsTabBtn.click();
    await page.waitForTimeout(1500);

    const contractsCount = await page.locator('.space-y-6 > div.p-5').count();
    console.log(`  ✓ Active Supply Contracts rendered: ${contractsCount}`);
    results.assertions.push({ name: '5 Active Supply Contracts rendered', passed: contractsCount >= 5, count: contractsCount });

    // Step 6: Audit Contract #5 and 5-Tier Dispatch Progress Tracker
    console.log('👉 Step 6: Auditing Contract #5 (50 MT BHUMIJA TMT) & 5-Stage Tracker...');
    
    // Find Contract #5
    const contract5 = page.locator('.space-y-6 > div.p-5').filter({ hasText: 'BHUMIJA' }).or(page.locator('.space-y-6 > div.p-5').filter({ hasText: '50 MT' })).first();
    const contract5Visible = await contract5.isVisible();
    console.log(`  ✓ Contract #5 found: ${contract5Visible}`);
    results.assertions.push({ name: 'Contract #5 (50 MT BHUMIJA TMT) found', passed: contract5Visible });

    // Extract contract 5 details
    const contract5Text = await contract5.innerText();
    const hasValue2285k = contract5Text.includes('22,85,000') || contract5Text.includes('2,285,000');
    const hasWeighbridgeBadge = contract5Text.toLowerCase().includes('weighbridge loaded');

    console.log(`  ✓ Contract 5 Deal Value (₹22,85,000): ${hasValue2285k}`);
    console.log(`  ✓ Contract 5 Dispatch Badge (weighbridge loaded): ${hasWeighbridgeBadge}`);
    results.assertions.push({ name: 'Contract 5 valuation ₹2,285,000 exact', passed: hasValue2285k });
    results.assertions.push({ name: 'Contract 5 stage weighbridge_loaded badge', passed: hasWeighbridgeBadge });

    // Audit the 5-Tier Dispatch Stepper inside Contract #5
    const stage1Done = await contract5.locator('div:has-text("1. Order Booked")').first().isVisible();
    const stage2Done = await contract5.locator('div:has-text("2. Mill Rolling")').first().isVisible();
    const stage3Current = await contract5.locator('div:has-text("3. Weighbridge Loaded")').first().isVisible();
    const stage4Pending = await contract5.locator('div:has-text("4. In Transit")').first().isVisible();
    const stage5Pending = await contract5.locator('div:has-text("5. Delivered")').first().isVisible();

    console.log('  📊 5-Tier Dispatch Stepper Verification:');
    console.log(`     Stage 1 (1. Order Booked): ${stage1Done ? 'RENDERED' : 'MISSING'}`);
    console.log(`     Stage 2 (2. Mill Rolling): ${stage2Done ? 'RENDERED' : 'MISSING'}`);
    console.log(`     Stage 3 (3. Weighbridge Loaded - ACTIVE): ${stage3Current ? 'RENDERED' : 'MISSING'}`);
    console.log(`     Stage 4 (4. In Transit - PENDING): ${stage4Pending ? 'RENDERED' : 'MISSING'}`);
    console.log(`     Stage 5 (5. Delivered - PENDING): ${stage5Pending ? 'RENDERED' : 'MISSING'}`);

    const all5StagesPresent = stage1Done && stage2Done && stage3Current && stage4Pending && stage5Pending;
    results.assertions.push({ name: 'All 5 Dispatch Stages present on Contract #5', passed: all5StagesPresent });

    // Step 7: Verify Key Account & Operations Contact Cards
    const sunilCard = await page.locator('text=Sunil Sharma').isVisible();
    const vikramCard = await page.locator('text=Vikram Patel').isVisible();
    console.log(`  ✓ Key Account Director (Sunil Sharma) card: ${sunilCard}`);
    console.log(`  ✓ Logistics Coordinator (Vikram Patel) card: ${vikramCard}`);
    results.assertions.push({ name: 'Key Account Team contacts visible', passed: sunilCard && vikramCard });

    // -------------------------------------------------------------
    // PART 2: MOBILE VIEWPORT SIMULATION (390x844)
    // -------------------------------------------------------------
    console.log('\n--- PART 2: MOBILE VIEWPORT (390x844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1 UrbanSpanMobile/1.0'
    });
    const mobilePage = await mobileContext.newPage();

    // Inject token to test session persistence
    const savedToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const savedUser = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));

    await mobilePage.addInitScript(({ token, user }) => {
      localStorage.setItem('urbanspan_customer_token', token);
      localStorage.setItem('urbanspan_customer_user', user);
    }, { token: savedToken, user: savedUser });

    console.log('👉 Step 8: Navigating to /portal on Mobile (390x844) with preserved session...');
    await mobilePage.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    const mobileVerifiedBadge = await mobilePage.locator('text=Verified Client Account').isVisible();
    console.log(`  ✓ Mobile Session Persistence - Verified Badge: ${mobileVerifiedBadge}`);
    results.assertions.push({ name: 'Mobile session persistence and verified badge', passed: mobileVerifiedBadge });

    // Check zero horizontal overflow on mobile
    const overflowCheck = await mobilePage.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    console.log(`  ✓ Mobile Viewport Overflow Check: ScrollWidth=${overflowCheck.docScrollWidth}px, InnerWidth=${overflowCheck.innerWidth}px, Overflow=${overflowCheck.hasOverflow}`);
    results.assertions.push({ name: 'Mobile Portal zero horizontal scroll overflow', passed: !overflowCheck.hasOverflow });

    // Test mobile tab switching to Active Contracts
    const mobileContractsTab = mobilePage.locator('button:has-text("Active Supply Contracts")');
    await mobileContractsTab.click();
    await mobilePage.waitForTimeout(1000);

    const mobileContract5 = mobilePage.locator('.space-y-6 > div.p-5').filter({ hasText: 'BHUMIJA' }).first();
    const mobileContract5Visible = await mobileContract5.isVisible();
    console.log(`  ✓ Mobile Active Contracts & Tracker rendering: ${mobileContract5Visible}`);
    results.assertions.push({ name: 'Mobile Active Supply Contracts rendered', passed: mobileContract5Visible });

    results.passed = results.assertions.every(a => a.passed);
    console.log(`\n✅ PERSONA B SIMULATION COMPLETED: ${results.passed ? 'ALL ASSERTIONS PASSED' : 'SOME ASSERTIONS FAILED'}`);

  } catch (error) {
    console.error('❌ PERSONA B FAILED with exception:', error);
    results.error = error.message;
    results.passed = false;
  } finally {
    await browser.close();
  }

  return results;
}

if (process.argv[1]?.endsWith('persona_b_repeat_client.js')) {
  runPersonaB().then(res => {
    console.log('\n--- FINAL RESULT SUMMARY ---');
    console.log(JSON.stringify({ passed: res.passed, assertions: res.assertions }, null, 2));
    process.exit(res.passed ? 0 : 1);
  });
}
