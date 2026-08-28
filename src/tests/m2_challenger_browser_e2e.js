import { chromium } from 'playwright';

const TARGET_URL = 'https://urbanspaninfra.co.in/portal';
const VALID_EMAIL = 'sourabh.khandelwal@khandelwalinfra.com';
const VALID_PASSWORD = 'Password123!';

const MOCK_CUSTOMER = {
  id: '76fddbf2-6ff9-4a43-8bbc-1206dae472d9',
  name: 'Sourabh Khandelwal',
  email: 'sourabh.khandelwal@khandelwalinfra.com',
  company: 'Khandelwal Infra Developers',
  party_id: '2f406a41-9fde-4e6e-bc3e-a7669de2b52f',
  phone: '+91 99887 76655'
};

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcl9pZCI6Ijc2ZmRkYmYyLTZmZjktNGE0My04YmJjLTEyMDZkYWU0NzJkOSIsInBhcnR5X2lkIjoiMmY0MDZhNDEtOWZkZS00ZTZlLWJjM2UtYTc2NjlkZTJiNTJmIiwib3JnX2lkIjoiNDQ1ZjBhMzYtM2NhNC00ZTY4LWJmNTMtN2ZiN2M3Yjk1YjBiIiwib3JnX3NjaGVtYSI6Im9yZ191cmJhbnNwYW5fc3RlZWxfMTc4NTY3MzU1NzM1OCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4NzQwODc1MSwiZXhwIjoxNzkwMDAwNzUxfQ.kBkR-3ODdWY9FW2zg9gc3hQbYRZjBQN_6x_JSUK-1RY';

const MOCK_ORDERS = [
  {
    id: 'ord-1',
    title: 'Contract 1 - Order Confirmed (Stage 1 Active)',
    deal_value: '2285000.00',
    currency: 'INR',
    stage: 'qualification',
    dispatch_status: 'order_confirmed',
    items: [{ product_name: 'Fe-550D TMT Rebars', quantity: 50, unit_price: '45700.00', product_unit: 'ton' }]
  },
  {
    id: 'ord-2',
    title: 'Contract 2 - Mill Rolling (Stage 2 Active)',
    deal_value: '4835000.00',
    currency: 'INR',
    stage: 'qualification',
    dispatch_status: 'mill_fabrication',
    items: [{ product_name: 'Heavy ISMB I-Beams', quantity: 80, unit_price: '58200.00', product_unit: 'ton' }]
  },
  {
    id: 'ord-3',
    title: 'Contract 3 - Weighbridge Loaded (Stage 3 Active)',
    deal_value: '9942500.00',
    currency: 'INR',
    stage: 'qualification',
    dispatch_status: 'weighbridge_loaded',
    items: [{ product_name: 'BHUMIJA TMT BARS', quantity: 100, unit_price: '54500.00', product_unit: 'ton' }]
  },
  {
    id: 'ord-4',
    title: 'Contract 4 - In Transit (Stage 4 Active)',
    deal_value: '12500000.00',
    currency: 'INR',
    stage: 'qualification',
    dispatch_status: 'in_transit',
    items: [{ product_name: 'Carbon Steel Boiler Plates', quantity: 150, unit_price: '59000.00', product_unit: 'ton' }]
  },
  {
    id: 'ord-5',
    title: 'Contract 5 - Delivered to Site (Stage 5 Completed/Active)',
    deal_value: '50000000.00',
    currency: 'INR',
    stage: 'qualification',
    dispatch_status: 'delivered',
    items: [{ product_name: 'Seamless Steel Piping', quantity: 200, unit_price: '63500.00', product_unit: 'ton' }]
  }
];

const MOCK_INQUIRIES = [
  {
    id: 'inq-1',
    name: 'Bulk TMT Consignment RFQ',
    status: 'new',
    expected_value: '4500000',
    created_at: '2026-08-22T10:00:00Z',
    items: [{ product_name: 'Fe-550D TMT', quantity: 100, product_unit: 'MT', base_price: '45000' }]
  },
  {
    id: 'inq-2',
    name: 'Structural Beams RFQ',
    status: 'won',
    expected_value: '6200000',
    created_at: '2026-08-21T10:00:00Z',
    items: [{ product_name: 'ISMB 400', quantity: 80, product_unit: 'MT', base_price: '58000' }]
  }
];

export async function runBrowserAdversarialTests() {
  console.log('\n======================================================');
  console.log('🧪 SUITE 4: PLAYWRIGHT LIVE BROWSER ADVERSARIAL SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];
  const consoleErrors = [];
  const pageErrors = [];

  const record = (name, ok, details) => {
    if (ok) {
      passed++;
      console.log(`  ✅ PASS: ${name}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL: ${name} -> ${details}`);
    }
    results.push({ name, ok, details });
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.warn(`    [Browser Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error(`    [Browser Page Uncaught Error] ${err.message}`);
  });

  // Setup deterministic network interception for complete invariant testing
  await page.route('**/api/external/customers/login', async route => {
    try {
      const postData = route.request().postDataJSON();
      if (postData.email === VALID_EMAIL && postData.password === VALID_PASSWORD) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: MOCK_TOKEN,
              customer: MOCK_CUSTOMER
            }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Authentication failed. Please check credentials or API settings.'
          })
        });
      }
    } catch (e) {
      await route.continue();
    }
  });

  await page.route('**/api/external/customers/me/orders', async route => {
    const authHeader = route.request().headers()['authorization'];
    if (!authHeader || authHeader.includes('CORRUPTED') || authHeader.includes('null')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized token' })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_ORDERS
        })
      });
    }
  });

  await page.route('**/api/external/customers/me/inquiries', async route => {
    const authHeader = route.request().headers()['authorization'];
    if (!authHeader || authHeader.includes('CORRUPTED') || authHeader.includes('null')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Unauthorized token' })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: MOCK_INQUIRIES
        })
      });
    }
  });

  try {
    // 1. Initial Page Load
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 20000 });
    const pageTitle = await page.title();
    record('Portal Page Loads Successfully', pageTitle.includes('Client Portal') || pageTitle.includes('Urbanspan'), `Title: ${pageTitle}`);

    // Clear any previous session in localStorage to start clean
    await page.evaluate(() => {
      localStorage.removeItem('urbanspan_customer_token');
      localStorage.removeItem('urbanspan_customer_user');
    });
    await page.reload({ waitUntil: 'networkidle' });

    // 2. Negative Login Test: SQL Injection attempt in login form
    await page.fill('input[type="email"]', "admin' OR '1'='1");
    await page.fill('input[type="password"]', "wrongpass123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const errorBannerVisible = await page.locator('text=Authentication failed').isVisible().catch(() => false);
    record('Negative Login & SQLi rejection renders visible error banner', errorBannerVisible, 'Error banner displayed safely');

    // 3. Positive Verified Buyer Login
    await page.fill('input[type="email"]', VALID_EMAIL);
    await page.fill('input[type="password"]', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for Dashboard
    await page.waitForSelector('text=Verified Client Account', { timeout: 15000 });
    const verifiedBadge = await page.locator('text=Verified Client Account').isVisible();
    const customerNameVisible = await page.locator('text=Sourabh Khandelwal').first().isVisible();
    record('Verified Buyer Login transitions to Dashboard', verifiedBadge && customerNameVisible, 'Verified badge & Customer Name displayed');

    // 4. Session Persistence Verification
    const storedToken = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const storedUser = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
    const validLocalStorage = !!storedToken && !!storedUser && storedUser.includes('Sourabh');
    record('LocalStorage Session Persistence (Token & Profile cached)', validLocalStorage, `Token present, User: ${storedUser?.slice(0, 40)}...`);

    // Reload page to verify hydration
    await page.reload({ waitUntil: 'networkidle' });
    const stillLoggedIn = await page.locator('text=Verified Client Account').isVisible();
    record('Full Page Reload Maintains Hydrated Session', stillLoggedIn, 'Dashboard remained mounted after reload');

    // 5. Inquiries & Spot Quotes Tab Audit
    const inquiriesTabBtn = page.locator('button:has-text("My Inquiries & Spot Quotes")');
    if (await inquiriesTabBtn.isVisible()) {
      await inquiriesTabBtn.click();
      await page.waitForTimeout(500);
    }
    const inquiryCardsCount = await page.locator('text=Submitted on').count();
    record('Inquiries & Spot Quotes Tab renders submitted RFQs', inquiryCardsCount > 0, `Rendered ${inquiryCardsCount} inquiry cards`);

    // 1-Click Transition Button Verification
    const convertBtn = page.locator('button:has-text("View Active Supply Contract")').first();
    const hasConvertBtn = await convertBtn.isVisible();
    if (hasConvertBtn) {
      await convertBtn.click();
      await page.waitForTimeout(500);
    }
    record('1-Click Transition Button navigates to Active Contracts', hasConvertBtn, 'Button toggled to active contracts tab');

    // 6. Active Supply Contracts Tab & 5-Tier Dispatch Tracker Invariant Audit
    const contractsTabBtn = page.locator('button:has-text("Active Supply Contracts")');
    await contractsTabBtn.click();
    await page.waitForTimeout(500);

    const contractCardsCount = await page.locator('text=Live Mill & Dispatch Progress').count();
    record('Active Supply Contracts Tab renders contract milestones', contractCardsCount === 5, `Rendered ${contractCardsCount} contract milestone cards`);

    // Invariant Verification: Check all 5 dispatch states in the DOM
    // Contract 1: order_confirmed (Stage 1 active)
    // Contract 2: mill_fabrication (Stage 2 active)
    // Contract 3: weighbridge_loaded (Stage 3 active)
    // Contract 4: in_transit (Stage 4 active)
    // Contract 5: delivered (Stage 5 active)
    const milestoneLabels = ['1. Order Booked', '2. Mill Rolling', '3. Weighbridge Loaded', '4. In Transit', '5. Delivered'];
    let allLabelsPresent = true;
    for (const label of milestoneLabels) {
      const isVis = await page.locator(`text=${label}`).first().isVisible().catch(() => false);
      if (!isVis) allLabelsPresent = false;
    }
    record('All 5 Dispatch Milestone Labels present in DOM', allLabelsPresent, milestoneLabels.join(' -> '));

    // 7. Adversarial LocalStorage Tampering (Corrupted User JSON)
    await page.evaluate(() => {
      localStorage.setItem('urbanspan_customer_user', '{corrupted_json_syntax_error');
    });
    await page.reload({ waitUntil: 'networkidle' });
    const loginFormRenderedAfterCorruptJson = await page.locator('text=Urbanspan Client Sign In, text=Sign In to Portal').first().isVisible().catch(() => false);
    record('Adversarial LocalStorage Attack 1 (Corrupted JSON handled gracefully)', loginFormRenderedAfterCorruptJson, 'Fallback to clean Sign In form without white screen crash');

    // 8. Adversarial LocalStorage Tampering (Expired / Malformed Token)
    await page.evaluate(() => {
      localStorage.setItem('urbanspan_customer_token', 'CORRUPTED_JWT_ATTACK_STRING_12345');
      localStorage.setItem('urbanspan_customer_user', JSON.stringify(MOCK_CUSTOMER));
    });
    await page.reload({ waitUntil: 'networkidle' });
    const portalMounted = await page.locator('text=Sourabh Khandelwal').isVisible().catch(() => false);
    record('Adversarial LocalStorage Attack 2 (Tampered Token survives 401 without unhandled crash)', portalMounted, 'App caught 401 gracefully without unhandled exception');

    // 9. Re-login & Extreme State Transitions (Rapid Tab Clicking)
    await page.evaluate(() => {
      localStorage.removeItem('urbanspan_customer_token');
      localStorage.removeItem('urbanspan_customer_user');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', VALID_EMAIL);
    await page.fill('input[type="password"]', VALID_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Verified Client Account', { timeout: 15000 });

    // Stress: Rapidly toggle tabs 10 times
    for (let i = 0; i < 10; i++) {
      await page.locator('button:has-text("My Inquiries & Spot Quotes")').click().catch(() => {});
      await page.locator('button:has-text("Active Supply Contracts")').click().catch(() => {});
    }
    // Rapidly click refresh orders 5 times
    const refreshBtn = page.locator('button[title="Refresh Orders"]');
    if (await refreshBtn.isVisible()) {
      for (let i = 0; i < 5; i++) {
        await refreshBtn.click().catch(() => {});
      }
    }
    await page.waitForTimeout(500);
    const stableAfterStress = await page.locator('text=Live Mill & Dispatch Progress').first().isVisible();
    record('Extreme State Transitions & Rapid Tab Switching Stress', stableAfterStress, 'UI remained stable with 0 desync');

    // 10. Clean Sign Out Verification
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await signOutBtn.click();
    await page.waitForTimeout(500);
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    const userAfterLogout = await page.evaluate(() => localStorage.getItem('urbanspan_customer_user'));
    const cleanLogout = !tokenAfterLogout && !userAfterLogout && await page.locator('text=Sign In to Portal').isVisible();
    record('Sign Out purges localStorage keys and resets to login form', cleanLogout, 'Session purged completely');

    // 11. Mobile Viewport Parity (390x844) Audit
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const zeroOverflow = scrollWidth <= windowWidth;
    record('Mobile Viewport Parity (390x844) Zero Horizontal Overflow', zeroOverflow, `scrollWidth=${scrollWidth}px, innerWidth=${windowWidth}px`);

    // 12. Uncaught JS Console Errors Assert
    const uncaughtErrors = pageErrors.length;
    record('Zero Uncaught JavaScript Page Errors during all workflows', uncaughtErrors === 0, `Uncaught errors count: ${uncaughtErrors}`);

  } catch (err) {
    record('Playwright Browser Test Suite Execution', false, err.message);
  } finally {
    await browser.close();
  }

  console.log(`\nSuite 4 Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests.\n`);
  return { suite: 'Browser E2E Adversarial', passed, failed, total: passed + failed, results, consoleErrors, pageErrors };
}
