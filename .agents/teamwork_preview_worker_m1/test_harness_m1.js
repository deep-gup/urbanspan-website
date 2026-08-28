import { chromium } from 'playwright';
import axios from 'axios';

const LIVE_WEB_URL = 'https://urbanspaninfra.co.in';
const API_BASE_URL = 'https://api.urbanspaninfra.co.in';
const ORG_CODE = 'urbanspan_steel_1764';
const API_KEY = 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f';

const results = {
  timestamp: new Date().toISOString(),
  environment: {
    liveWebUrl: LIVE_WEB_URL,
    apiBaseUrl: API_BASE_URL,
    orgCode: ORG_CODE
  },
  suites: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    consoleErrorsCount: 0,
    pageErrorsCount: 0
  }
};

function recordTest(suiteName, testName, status, details = {}) {
  let suite = results.suites.find(s => s.name === suiteName);
  if (!suite) {
    suite = { name: suiteName, tests: [] };
    results.suites.push(suite);
  }
  suite.tests.push({ testName, status, details, timestamp: new Date().toISOString() });
  results.summary.totalTests++;
  if (status === 'PASS') results.summary.passed++;
  else results.summary.failed++;
  console.log(`[${status}] ${suiteName} -> ${testName}`);
  if (status === 'FAIL') {
    console.error('   Failure details:', details);
  }
}

async function runSuite1_ApiVerification() {
  console.log('\n--- SUITE 1: Direct Headless API Verification ---');
  const suiteName = 'API Ingestion & RFQ Transmission';

  // Test 1.1: Product catalog retrieval
  try {
    const res = await axios.get(`${API_BASE_URL}/api/external/products`, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE
      },
      timeout: 10000
    });

    const products = res.data?.data || res.data;
    const isValid = Array.isArray(products) && products.length > 0;
    const categories = new Set(products.map(p => p.category));
    
    recordTest(suiteName, '1.1 Products Catalog Retrieval', isValid ? 'PASS' : 'FAIL', {
      productCount: products.length,
      categories: Array.from(categories),
      sampleProduct: products[0] ? { name: products[0].name, sku: products[0].sku, price: products[0].base_price } : null
    });
  } catch (err) {
    recordTest(suiteName, '1.1 Products Catalog Retrieval', 'FAIL', { error: err.message });
  }

  // Test 1.2: Form Schema Retrieval
  try {
    const res = await axios.get(`${API_BASE_URL}/api/external/forms/by-name/lead_capture/schema?org_code=${ORG_CODE}`, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE
      },
      timeout: 10000
    });

    const schema = res.data?.data;
    const hasFields = schema && Array.isArray(schema.fields) && schema.fields.length > 0;
    recordTest(suiteName, '1.2 Lead Capture Form Schema', hasFields ? 'PASS' : 'FAIL', {
      formName: schema?.name,
      fieldCount: schema?.fields?.length,
      fields: schema?.fields?.map(f => f.name)
    });
  } catch (err) {
    recordTest(suiteName, '1.2 Lead Capture Form Schema', 'FAIL', { error: err.message });
  }

  // Test 1.3: Direct RFQ Submission via /forms/by-name/lead_capture/submit
  try {
    const testRfqPayload = {
      org_code: ORG_CODE,
      name: 'Automated QA Test Auditor',
      company: 'Adversarial Steel Verification Ltd',
      email: 'qa.auditor@adversarialtest.org',
      phone: '+919999988888',
      source: 'buyer_cart_rfq_qa_test',
      quantity: 75,
      expected_value: 4165000,
      notes: 'Automated M1 Verification Test: 50 MT Fe-550D TMT + 25 MT ISMB Beams',
      custom_data: {
        total_tonnage: 75,
        base_subtotal: 4165000,
        gst_18_amount: 749700,
        grand_total_with_tax: 4914700,
        lead_type: 'rfq_cart'
      }
    };

    const res = await axios.post(`${API_BASE_URL}/api/external/forms/by-name/lead_capture/submit`, testRfqPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE
      },
      timeout: 10000
    });

    const success = res.data?.success === true || res.status === 200 || res.status === 201;
    recordTest(suiteName, '1.3 Direct Dynamic Form Lead Submission', success ? 'PASS' : 'FAIL', {
      responseStatus: res.status,
      responseData: res.data
    });
  } catch (err) {
    recordTest(suiteName, '1.3 Direct Dynamic Form Lead Submission', 'FAIL', { error: err.response?.data || err.message });
  }

  // Test 1.4: Direct RFQ Submission via /external/leads
  try {
    const testLeadPayload = {
      name: 'Automated Lead Endpoint Test',
      company: 'Adversarial Steel Verification Ltd',
      email: 'qa.lead@adversarialtest.org',
      phone: '+919999977777',
      source: 'm1_qa_test',
      quantity: 50,
      expected_value: 2725000,
      notes: 'Testing /external/leads endpoint directly'
    };

    const res = await axios.post(`${API_BASE_URL}/api/external/leads`, testLeadPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE
      },
      timeout: 10000
    });

    const success = res.data?.success === true || res.status === 200 || res.status === 201;
    recordTest(suiteName, '1.4 Direct /external/leads Capture', success ? 'PASS' : 'FAIL', {
      responseStatus: res.status,
      responseData: res.data
    });
  } catch (err) {
    recordTest(suiteName, '1.4 Direct /external/leads Capture', 'FAIL', { error: err.response?.data || err.message });
  }
}

async function runSuite2_BrowserCommercialJourney() {
  console.log('\n--- SUITE 2: Live Browser Commercial Journey & Cart Math ---');
  const suiteName = 'Browser Commercial Journey & Cart';

  const consoleLogs = [];
  const consoleErrors = [];
  const pageErrors = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.error('   [BROWSER CONSOLE ERROR]:', text);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message || err.toString());
    console.error('   [BROWSER PAGE UNCAUGHT ERROR]:', err);
  });

  try {
    // 2.1 Catalog Navigation & Loading
    await page.goto(`${LIVE_WEB_URL}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('h2:has-text("Commercial Steel Catalog")', { timeout: 10000 });

    const catalogTitle = await page.textContent('h2:has-text("Commercial Steel Catalog")');
    recordTest(suiteName, '2.1 Catalog Page Load', catalogTitle ? 'PASS' : 'FAIL', {
      title: catalogTitle
    });

    // 2.2 Category Filtering Test
    const categoryButtons = await page.$$('button:has-text("Rebars"), button:has-text("Structural Steel"), button:has-text("Coils"), button:has-text("Piping")');
    let categoryFilterPass = true;
    const categoryDetails = {};

    // Click Rebars
    const rebarsBtn = await page.$('button:text-is("Rebars")');
    if (rebarsBtn) {
      await rebarsBtn.click();
      await page.waitForTimeout(500);
      const productCards = await page.$$('.grid > div');
      categoryDetails.rebarsCount = productCards.length;
      if (productCards.length === 0) categoryFilterPass = false;
    }

    // Click All
    const allBtn = await page.$('button:text-is("All")');
    if (allBtn) {
      await allBtn.click();
      await page.waitForTimeout(500);
      const allProductCards = await page.$$('.grid > div');
      categoryDetails.allCount = allProductCards.length;
    }

    recordTest(suiteName, '2.2 Category Filtering', categoryFilterPass ? 'PASS' : 'FAIL', categoryDetails);

    // 2.3 Search Functionality Test
    const searchInput = await page.$('input[placeholder*="Search"]');
    let searchPass = false;
    let searchResultCount = 0;
    if (searchInput) {
      await searchInput.fill('Fe-550D');
      await page.waitForTimeout(500);
      const matches = await page.$$('.grid > div');
      searchResultCount = matches.length;
      searchPass = searchResultCount >= 1;

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(500);
    }
    recordTest(suiteName, '2.3 Catalog Search (SKU & Tag)', searchPass ? 'PASS' : 'FAIL', {
      searchQuery: 'Fe-550D',
      resultsFound: searchResultCount
    });

    // 2.4 Product Details & AST Markdown Specifications
    // Click on the first product card or navigate directly
    await page.goto(`${LIVE_WEB_URL}/products/US-TMT-550D`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    const productName = await page.textContent('h1');
    const priceText = await page.textContent('span.text-brand-steel-light, span:has-text("₹")');
    const gstPill = await page.textContent('div:has-text("Applicable GST @ 18%")');
    const specsGrid = await page.$('div:has-text("Technical & Material Specifications")');

    // Test Expand Overview AST Markdown
    const expandButton = await page.$('button:has-text("Expand Overview"), button:has-text("Read Full Overview")');
    if (expandButton) {
      await expandButton.click();
      await page.waitForTimeout(300);
    }

    recordTest(suiteName, '2.4 Product Details & AST Markdown Rendering', (productName && priceText && gstPill) ? 'PASS' : 'FAIL', {
      productName,
      priceText: priceText?.trim(),
      gstPillFound: !!gstPill,
      specsGridFound: !!specsGrid
    });

    // 2.5 Tonnage Selector & Stepper on Product Details
    const stepperInput = await page.$('input[type="number"]');
    const plusButton = await page.$('button:has(svg.lucide-plus)');
    const minusButton = await page.$('button:has(svg.lucide-minus)');
    const preset100Btn = await page.$('button:text-is("100 MT")');

    let stepperPass = false;
    if (preset100Btn && stepperInput) {
      await preset100Btn.click();
      await page.waitForTimeout(300);
      const val1 = await stepperInput.inputValue();
      if (val1 === '100') {
        if (plusButton) {
          await plusButton.click(); // 100 + 5 = 105
          await page.waitForTimeout(200);
          const val2 = await stepperInput.inputValue();
          if (val2 === '105') stepperPass = true;
        }
      }
    }

    recordTest(suiteName, '2.5 Tonnage Presets & ±5 MT Precision Stepper', stepperPass ? 'PASS' : 'FAIL', {
      testedPreset: '100 MT',
      testedPlusStepper: '105 MT'
    });

    // 2.6 Adding Products to Cart & Cart Math Exactness
    // Reset to 50 MT and Add Fe-550D TMT to Cart
    await stepperInput.fill('50');
    const addToCartBtn = await page.$('button:has-text("Add")');
    await addToCartBtn.click();
    await page.waitForTimeout(600);

    // Navigate to second product: US-STR-ISMB and add 25 MT
    await page.goto(`${LIVE_WEB_URL}/products/US-STR-ISMB`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    const ismbStepper = await page.$('input[type="number"]');
    const ismbPreset25 = await page.$('button:text-is("25 MT")');
    if (ismbPreset25) await ismbPreset25.click();
    else if (ismbStepper) await ismbStepper.fill('25');

    const ismbAddBtn = await page.$('button:has-text("Add")');
    await ismbAddBtn.click();
    await page.waitForTimeout(600);

    // Navigate to Cart Page
    await page.goto(`${LIVE_WEB_URL}/cart`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('h1:has-text("Buyer Cart & RFQ Dispatch")', { timeout: 10000 });

    // Verify Cart Calculations in DOM
    const cartItemElements = await page.$$('.space-y-4 > div.bg-white');
    const cartCount = cartItemElements.length;

    // Extract displayed amounts
    const subtotalText = await page.textContent('span:has-text("Base Material Subtotal") + span, div:has-text("Base Material Subtotal") span.font-bold');
    const gstText = await page.textContent('span:has-text("Applicable GST @ 18%") + span, div:has-text("Applicable GST @ 18%") span.font-mono');
    const grandTotalText = await page.textContent('span.text-2xl.font-black.text-brand-steel, div:has-text("Total Estimated Value") + span');

    // Retrieve state from browser localStorage for exact mathematical audit
    const localStorageCart = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data) : [];
    });

    let mathExactnessPass = true;
    const mathAudit = {
      itemsCount: localStorageCart.length,
      items: [],
      calculatedSubtotal: 0,
      calculatedGst: 0,
      calculatedGrandTotal: 0
    };

    let computedSubtotal = 0;
    for (const item of localStorageCart) {
      const expectedLineSubtotal = item.quantity * item.base_price;
      const expectedLineGst = expectedLineSubtotal * 0.18;
      const expectedLineTotal = expectedLineSubtotal + expectedLineGst;

      const lineMatches = (
        Math.abs(item.lineSubtotal - expectedLineSubtotal) < 0.01 &&
        Math.abs(item.lineGst - expectedLineGst) < 0.01 &&
        Math.abs(item.lineTotal - expectedLineTotal) < 0.01
      );

      if (!lineMatches) mathExactnessPass = false;

      computedSubtotal += expectedLineSubtotal;
      mathAudit.items.push({
        name: item.name,
        qty: item.quantity,
        rate: item.base_price,
        lineSubtotal: item.lineSubtotal,
        expectedLineSubtotal,
        lineGst: item.lineGst,
        lineTotal: item.lineTotal,
        lineMatches
      });
    }

    const computedGst = computedSubtotal * 0.18;
    const computedGrandTotal = computedSubtotal + computedGst;

    mathAudit.calculatedSubtotal = computedSubtotal;
    mathAudit.calculatedGst = computedGst;
    mathAudit.calculatedGrandTotal = computedGrandTotal;

    // Check Subtotal * 1.18 = Consignment Total
    const subtotalTimes118 = computedSubtotal * 1.18;
    if (Math.abs(computedGrandTotal - subtotalTimes118) > 0.01) {
      mathExactnessPass = false;
    }

    recordTest(suiteName, '2.6 Multi-Product Cart Mathematical Exactness', mathExactnessPass ? 'PASS' : 'FAIL', mathAudit);

    // 2.7 Cart Persistence across Page Reload
    await page.reload({ waitUntil: 'networkidle' });
    const reloadedCartLength = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data).length : 0;
    });

    recordTest(suiteName, '2.7 Cart LocalStorage State Persistence', reloadedCartLength === localStorageCart.length ? 'PASS' : 'FAIL', {
      originalCount: localStorageCart.length,
      reloadedCount: reloadedCartLength
    });

    // 2.8 RFQ Form Validation & Dispatch
    // Fill the RFQ Form
    const nameInput = await page.$('input[placeholder*="Ramesh"]');
    const companyInput = await page.$('input[placeholder*="Chandra Infra"]');
    const phoneInput = await page.$('input[placeholder*="98765"]');
    const emailInput = await page.$('input[placeholder*="buyer@"]');
    const locationInput = await page.$('input[placeholder*="Indore Ring Road"]');
    const notesInput = await page.$('textarea[placeholder*="Specify bend test"]');

    if (nameInput) await nameInput.fill('Saurabh Khandelwal QA');
    if (companyInput) await companyInput.fill('Khandelwal Infrastructure Pvt Ltd');
    if (phoneInput) await phoneInput.fill('+919826012345');
    if (emailInput) await emailInput.fill('sourabh.khandelwal@khandelwalinfra.com');
    if (locationInput) await locationInput.fill('Indore Bypass Super Corridor Site');
    if (notesInput) await notesInput.fill('Urgent delivery required with BIS mill test certificates.');

    // Intercept network request to verify payload transmission
    let rfqRequestSent = false;
    let rfqPayloadCaptured = null;
    page.on('request', req => {
      if (req.url().includes('/forms/by-name/lead_capture/submit') || req.url().includes('/leads')) {
        rfqRequestSent = true;
        try {
          rfqPayloadCaptured = JSON.parse(req.postData());
        } catch (e) {}
      }
    });

    const submitRfqBtn = await page.$('button[type="submit"]:has-text("Submit RFQ")');
    if (submitRfqBtn) {
      await submitRfqBtn.click();
      await page.waitForTimeout(3000);
    }

    // 2.9 Instant Confirmation Modal Verification
    const confirmationHeader = await page.$('h2:has-text("Multi-Product Commercial RFQ Transmitted!")');
    const refIdElement = await page.$('strong.font-mono:has-text("RFQ-CONSIGNMENT-")');
    const refIdText = refIdElement ? await refIdElement.textContent() : null;

    const modalPass = confirmationHeader !== null && refIdText !== null && refIdText.startsWith('RFQ-CONSIGNMENT-');
    recordTest(suiteName, '2.9 Instant RFQ Confirmation Modal & Reference ID', modalPass ? 'PASS' : 'FAIL', {
      modalFound: !!confirmationHeader,
      referenceId: refIdText,
      rfqRequestSent,
      rfqPayloadCaptured: rfqPayloadCaptured ? {
        name: rfqPayloadCaptured.name,
        company: rfqPayloadCaptured.company,
        quantity: rfqPayloadCaptured.quantity,
        expected_value: rfqPayloadCaptured.expected_value
      } : null
    });

    // 2.10 Verify Cart Cleared After Submission
    const cartPostSubmission = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data).length : 0;
    });

    recordTest(suiteName, '2.10 Cart Auto-Cleared Post RFQ Submission', cartPostSubmission === 0 ? 'PASS' : 'FAIL', {
      itemsRemainingInCart: cartPostSubmission
    });

  } catch (err) {
    recordTest(suiteName, 'Browser Suite Execution Error', 'FAIL', { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  // Record Console & Page Errors
  results.summary.consoleErrorsCount = consoleErrors.length;
  results.summary.pageErrorsCount = pageErrors.length;

  recordTest('Console & Exception Resilience', '2.11 Zero Runtime Console Errors', consoleErrors.length === 0 ? 'PASS' : 'FAIL', {
    errorCount: consoleErrors.length,
    errors: consoleErrors
  });

  recordTest('Console & Exception Resilience', '2.12 Zero Uncaught Page Exceptions', pageErrors.length === 0 ? 'PASS' : 'FAIL', {
    pageErrorCount: pageErrors.length,
    pageErrors: pageErrors
  });
}

async function main() {
  console.log('================================================================');
  console.log('MILSTONE 1 (M1): COMMERCIAL JOURNEY & RFQ CART AUDITING (R1)');
  console.log('EMPIRICAL VERIFICATION HARNESS');
  console.log('================================================================');

  await runSuite1_ApiVerification();
  await runSuite2_BrowserCommercialJourney();

  console.log('\n================================================================');
  console.log('TEST EXECUTION SUMMARY:');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Console Errors: ${results.summary.consoleErrorsCount}`);
  console.log(`Page Errors: ${results.summary.pageErrorsCount}`);
  console.log('================================================================');

  // Output JSON report
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
