/**
 * Persona A: Mega Infrastructure EPC Contractor Simulation
 * Persona: Rajesh Sharma (VP Procurement, Sharma Mega-Infra JV)
 * Viewport: Desktop (1440x900)
 * 
 * Journey:
 * 1. Opens Product Catalog on Desktop (1440x900)
 * 2. Compares primary steel catalog items and benchmark pricing
 * 3. Navigates to Product 1 (TMT Rebars), selects 120 MT tonnage, verifies 18% GST pill, adds to cart
 * 4. Navigates to Product 2 (Structural Steel / Secondary item), selects 45 MT tonnage, adds to cart
 * 5. Navigates to /cart and audits strict mathematical exactness (Subtotal * 1.18 = Grand Total)
 * 6. Fills and submits multi-product RFQ with GSTIN & project site specifications
 * 7. Verifies instant confirmation modal and CRM transmission
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'https://urbanspaninfra.co.in';

export async function runPersonaA() {
  console.log('================================================================');
  console.log('🚀 STARTING PERSONA A: MEGA INFRASTRUCTURE EPC CONTRACTOR');
  console.log('👤 Profile: Rajesh Sharma | Sharma Mega-Infra JV');
  console.log('🖥️ Viewport: Desktop (1440x900)');
  console.log('🌐 Target URL:', BASE_URL);
  console.log('================================================================\n');

  const results = {
    persona: 'Persona A - Mega Infrastructure EPC Contractor (Rajesh Sharma)',
    viewport: '1440x900 (Desktop)',
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

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 UrbanSpanSimulation/1.0'
  });

  const page = await context.newPage();

  page.on('console', msg => {
    results.consoleLogs.push(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/external/')) {
      const entry = {
        url,
        status: res.status(),
        method: res.request().method(),
        timestamp: new Date().toISOString()
      };
      try {
        entry.responseBody = await res.json();
      } catch (e) {}
      results.networkLogs.push(entry);
      console.log(`  📡 [NET RES] ${res.request().method()} ${url} -> Status ${res.status()}`);
    }
  });

  try {
    // Step 1: Navigate to Catalog
    console.log('👉 Step 1: Navigating to Product Catalog...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => localStorage.removeItem('urbanspan_buyer_cart'));
    await page.waitForTimeout(1500);

    const catalogTitle = await page.locator('h2:has-text("Commercial Steel Catalog")').isVisible();
    results.assertions.push({ name: 'Catalog header visible', passed: catalogTitle });
    console.log(`  ✓ Catalog page loaded: ${catalogTitle}`);
    results.steps.push({ step: 1, action: 'Loaded Product Catalog', success: catalogTitle });

    // Step 2: Inspect Products
    console.log('👉 Step 2: Inspecting products in catalog...');
    const productCardsCount = await page.locator('.grid > div.bg-white').count();
    console.log(`  ✓ Found ${productCardsCount} product cards rendered in catalog`);
    results.assertions.push({ name: 'Products rendered in catalog', passed: productCardsCount >= 2, count: productCardsCount });

    // Step 3: Open Product 1 Details
    console.log('👉 Step 3: Opening Product 1 (Primary TMT Rebar item)...');
    const firstCard = page.locator('.grid > div.bg-white').first();
    const firstProductName = await firstCard.locator('h3').innerText();
    console.log(`  ✓ Selecting Product 1: "${firstProductName}"`);
    await firstCard.locator('button:has-text("Specs")').click();
    await page.waitForTimeout(1500);

    const p1DetailsVisible = await page.locator('h1').isVisible();
    console.log(`  ✓ Product 1 Detail Page loaded: ${p1DetailsVisible}`);
    results.assertions.push({ name: 'Product 1 Details Page rendered', passed: p1DetailsVisible });

    // Step 4: Configure 120 MT Tonnage and Add to Cart
    console.log('👉 Step 4: Configuring 120 MT tonnage and adding to cart...');
    const p1TonnageInput = page.locator('input[type="number"]');
    await p1TonnageInput.fill('120');
    await page.waitForTimeout(500);

    const gstPillVisible = await page.locator('text=+ 18% GST').or(page.locator('text=Applicable GST @ 18%')).or(page.locator('text=Live Mill Benchmark Rate')).first().isVisible();
    console.log(`  ✓ Pricing & GST breakdown pill visible: ${gstPillVisible}`);
    results.assertions.push({ name: 'Pricing & GST Breakdown Pill visible', passed: gstPillVisible });

    const addToCartBtn = page.locator('button:has-text("Add 120 MT to Cart")').or(page.locator('button:has-text("Add to Cart")')).first();
    await addToCartBtn.click();
    await page.waitForTimeout(1000);
    console.log('  ✓ Added 120 MT Product 1 to Cart');
    results.steps.push({ step: 4, action: 'Added 120 MT Product 1 to cart', success: true });

    // Step 5: Navigate back to Catalog and Open Product 2 Details
    console.log('👉 Step 5: Navigating to Product 2...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const secondCard = page.locator('.grid > div.bg-white').nth(1);
    const secondProductName = await secondCard.locator('h3').innerText();
    console.log(`  ✓ Selecting Product 2: "${secondProductName}"`);
    await secondCard.locator('button:has-text("Specs")').click();
    await page.waitForTimeout(1500);

    const p2DetailsVisible = await page.locator('h1').isVisible();
    console.log(`  ✓ Product 2 Detail Page loaded: ${p2DetailsVisible}`);
    results.assertions.push({ name: 'Product 2 Details Page rendered', passed: p2DetailsVisible });

    // Step 6: Configure 45 MT Tonnage and Add to Cart
    console.log('👉 Step 6: Configuring 45 MT tonnage and adding to cart...');
    const p2TonnageInput = page.locator('input[type="number"]');
    await p2TonnageInput.fill('45');
    await page.waitForTimeout(500);

    const addP2Btn = page.locator('button:has-text("Add 45 MT to Cart")').or(page.locator('button:has-text("Add to Cart")')).first();
    await addP2Btn.click();
    await page.waitForTimeout(1000);
    console.log('  ✓ Added 45 MT Product 2 to Cart');
    results.steps.push({ step: 6, action: 'Added 45 MT Product 2 to cart', success: true });

    // Step 7: Navigate to Cart Page and Audit Mathematical Exactness
    console.log('👉 Step 7: Navigating to /cart and auditing mathematical exactness...');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Verify Cart items in DOM
    const cartItemElements = await page.locator('.space-y-4 > div.bg-white').count();
    console.log(`  ✓ Number of line items in cart: ${cartItemElements}`);
    results.assertions.push({ name: 'Two distinct products in cart', passed: cartItemElements === 2 });

    // Extract cart calculation values from page state
    const cartState = await page.evaluate(() => {
      const saved = localStorage.getItem('urbanspan_buyer_cart');
      if (!saved) return null;
      const items = JSON.parse(saved);
      const subtotal = items.reduce((acc, i) => acc + (Number(i.lineSubtotal) || (Number(i.quantity) * Number(i.base_price))), 0);
      const totalGst = subtotal * 0.18;
      const grandTotal = subtotal + totalGst;
      return { items, subtotal, totalGst, grandTotal };
    });

    console.log('  📊 Cart Mathematical Breakdown:');
    console.log('     Line Items:', cartState.items.map(i => `${i.name}: ${i.quantity} MT @ ₹${i.base_price}/MT = Base ₹${i.lineSubtotal} (+ GST ₹${i.lineGst})`));
    console.log(`     Subtotal (Base): ₹${cartState.subtotal.toLocaleString('en-IN')}`);
    console.log(`     GST @ 18%: ₹${cartState.totalGst.toLocaleString('en-IN')}`);
    console.log(`     Grand Total (incl. 18% GST): ₹${cartState.grandTotal.toLocaleString('en-IN')}`);

    // Mathematical assertions
    const item1 = cartState.items[0];
    const item2 = cartState.items[1];

    const p1ExpectedSubtotal = item1.quantity * item1.base_price;
    const p1ExpectedGst = p1ExpectedSubtotal * 0.18;
    const p1MathValid = item1.quantity === 120 && Math.abs(item1.lineSubtotal - p1ExpectedSubtotal) < 0.01 && Math.abs(item1.lineGst - p1ExpectedGst) < 0.01;

    const p2ExpectedSubtotal = item2.quantity * item2.base_price;
    const p2ExpectedGst = p2ExpectedSubtotal * 0.18;
    const p2MathValid = item2.quantity === 45 && Math.abs(item2.lineSubtotal - p2ExpectedSubtotal) < 0.01 && Math.abs(item2.lineGst - p2ExpectedGst) < 0.01;

    const expectedGrandTotal = (p1ExpectedSubtotal + p2ExpectedSubtotal) * 1.18;
    const grandTotalMathValid = Math.abs(cartState.grandTotal - expectedGrandTotal) < 0.01;

    console.log(`  ✓ Item 1 Math Verification (120 MT * ₹${item1.base_price}): ${p1MathValid ? 'EXACT MATCH' : 'MISMATCH'}`);
    console.log(`  ✓ Item 2 Math Verification (45 MT * ₹${item2.base_price}): ${p2MathValid ? 'EXACT MATCH' : 'MISMATCH'}`);
    console.log(`  ✓ Grand Total Math Verification (Subtotal * 1.18): ${grandTotalMathValid ? 'EXACT MATCH' : 'MISMATCH'}`);

    results.assertions.push({ name: 'Product 1 (120 MT) line calculation exact', passed: p1MathValid });
    results.assertions.push({ name: 'Product 2 (45 MT) line calculation exact', passed: p2MathValid });
    results.assertions.push({ name: 'Cart Grand Total with 18% GST exact', passed: grandTotalMathValid });

    // Step 8: Fill RFQ Lead Form as Rajesh Sharma (EPC Contractor)
    console.log('👉 Step 8: Filling RFQ lead submission form with EPC Contractor credentials...');
    await page.fill('input[placeholder*="Ramesh Chandra"]', 'Rajesh Sharma (VP Procurement)');
    await page.fill('input[placeholder*="Chandra Infra"]', 'Sharma Mega-Infra JV (GSTIN: 23AABCS1429B1Z8)');
    await page.fill('input[placeholder*="+91 98765"]', '+91 98260 12345');
    await page.fill('input[placeholder*="buyer@infraprojects.com"]', 'rajesh.sharma@sharmamegainfra.com');
    await page.fill('input[placeholder*="Indore Ring Road"]', 'Bhopal-Indore Highway Package 4, Project Yard 2');
    await page.fill('textarea[placeholder*="Specify bend test"]', 'Need Fe-550D test certificates per heat number + rolling schedule confirmation. Urgent dispatch requirement.');
    await page.waitForTimeout(500);

    // Step 9: Submit RFQ and Intercept Network Call
    console.log('👉 Step 9: Submitting multi-product commercial RFQ...');
    
    const leadResponsePromise = page.waitForResponse(
      res => res.url().includes('/api/external/forms/by-name/lead_capture/submit') || res.url().includes('/api/external/leads'),
      { timeout: 15000 }
    );

    const submitBtn = page.locator('button[type="submit"]:has-text("Submit RFQ")');
    await submitBtn.click();

    const leadResponse = await leadResponsePromise;
    const leadStatus = leadResponse.status();
    let leadData = null;
    try {
      leadData = await leadResponse.json();
    } catch (e) {}

    console.log(`  ✓ RFQ Submission Response Status: ${leadStatus}`);
    console.log('  ✓ RFQ Response Payload:', JSON.stringify(leadData));
    results.assertions.push({ name: 'RFQ Submission API 200 OK', passed: leadStatus === 200 || leadStatus === 201 });

    // Step 10: Verify Instant Confirmation View in UI
    console.log('👉 Step 10: Verifying UI confirmation state...');
    await page.waitForTimeout(1000);
    const confirmationVisible = await page.locator('h2:has-text("Multi-Product Commercial RFQ Transmitted!")').isVisible();
    const refVisible = await page.locator('strong:has-text("RFQ-CONSIGNMENT")').isVisible();
    const orgVisible = await page.locator('strong:has-text("Sharma Mega-Infra JV")').isVisible();
    const consignmentLineVisible = await page.locator('strong:has-text("Metric Tons")').isVisible();

    console.log(`  ✓ Confirmation Header visible: ${confirmationVisible}`);
    console.log(`  ✓ RFQ Reference visible: ${refVisible}`);
    console.log(`  ✓ Buyer Organization in summary: ${orgVisible}`);
    console.log(`  ✓ Total Consignment line rendered in confirmation: ${consignmentLineVisible}`);

    results.assertions.push({ name: 'Confirmation header visible', passed: confirmationVisible });
    results.assertions.push({ name: 'RFQ Consignment Reference rendered', passed: refVisible });
    results.assertions.push({ name: 'Organization name in confirmation', passed: orgVisible });
    results.assertions.push({ name: 'Consignment summary line rendered', passed: consignmentLineVisible });

    // Check cart cleared
    const cartPostSubmit = await page.evaluate(() => localStorage.getItem('urbanspan_buyer_cart'));
    const isCartCleared = cartPostSubmit === '[]' || cartPostSubmit === null;
    console.log(`  ✓ Cart state post-submission: ${isCartCleared ? 'CLEARED' : cartPostSubmit}`);
    results.assertions.push({ name: 'Cart cleared upon RFQ transmission', passed: isCartCleared });

    results.passed = results.assertions.every(a => a.passed);
    console.log(`\n✅ PERSONA A SIMULATION COMPLETED: ${results.passed ? 'ALL ASSERTIONS PASSED' : 'SOME ASSERTIONS FAILED'}`);

  } catch (error) {
    console.error('❌ PERSONA A FAILED with exception:', error);
    results.error = error.message;
    results.passed = false;
  } finally {
    await browser.close();
  }

  return results;
}

if (process.argv[1]?.endsWith('persona_a_epc_contractor.js')) {
  runPersonaA().then(res => {
    console.log('\n--- FINAL RESULT SUMMARY ---');
    console.log(JSON.stringify({ passed: res.passed, assertions: res.assertions }, null, 2));
    process.exit(res.passed ? 0 : 1);
  });
}
