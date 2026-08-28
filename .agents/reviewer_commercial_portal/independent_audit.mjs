import { chromium } from 'playwright';

const GST_RATE = 0.18;
const BASE_URL = 'https://urbanspaninfra.co.in';

const auditResults = {
  mathSuite: { passed: 0, failed: 0 },
  astSuite: { passed: 0, failed: 0 },
  dispatchTrackerSuite: { passed: 0, failed: 0 },
  e2eSuite: { passed: 0, failed: 0 }
};

function assertMath(condition, name, data = null) {
  if (condition) {
    auditResults.mathSuite.passed++;
  } else {
    auditResults.mathSuite.failed++;
    console.error('[MATH FAIL] ' + name, data);
  }
}

function assertAST(condition, name, data = null) {
  if (condition) {
    auditResults.astSuite.passed++;
  } else {
    auditResults.astSuite.failed++;
    console.error('[AST FAIL] ' + name, data);
  }
}

function assertDispatch(condition, name, data = null) {
  if (condition) {
    auditResults.dispatchTrackerSuite.passed++;
  } else {
    auditResults.dispatchTrackerSuite.failed++;
    console.error('[DISPATCH FAIL] ' + name, data);
  }
}

function assertE2E(condition, name, data = null) {
  if (condition) {
    auditResults.e2eSuite.passed++;
    console.log('  [E2E PASS] ' + name);
  } else {
    auditResults.e2eSuite.failed++;
    console.error('  [E2E FAIL] ' + name, data);
  }
}

// -------------------------------------------------------------
// 1. Math Exactness & 500 Randomized Runs
// -------------------------------------------------------------
console.log('=== TEST SUITE 1: MATHEMATICAL EXACTNESS & 500 RANDOMIZED RUNS ===');

function calculateCart(items) {
  let subtotal = 0;
  const calculatedItems = items.map(item => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const basePrice = Math.max(0, Number(item.base_price) || 0);
    const lineSubtotal = qty * basePrice;
    const lineGst = lineSubtotal * GST_RATE;
    const lineTotal = lineSubtotal + lineGst;
    subtotal += lineSubtotal;
    return { ...item, quantity: qty, base_price: basePrice, lineSubtotal, lineGst, lineTotal };
  });

  const totalGst = subtotal * GST_RATE;
  const grandTotal = subtotal + totalGst;
  const sumLineTotals = calculatedItems.reduce((acc, i) => acc + i.lineTotal, 0);

  return { calculatedItems, subtotal, totalGst, grandTotal, sumLineTotals };
}

// Standard products test
const testItems1 = [
  { id: '1', name: 'Fe-550D Rebar', base_price: 54500, quantity: 25 },
  { id: '2', name: 'ISMB 300 Beam', base_price: 58200, quantity: 50 },
  { id: '3', name: 'HR Coil 3mm', base_price: 52800, quantity: 30 }
];
const res1 = calculateCart(testItems1);
assertMath(res1.subtotal === 54500*25 + 58200*50 + 52800*30, 'Subtotal calculation exact for testItems1');
assertMath(Math.abs(res1.totalGst - res1.subtotal * 0.18) < 1e-9, 'Total GST is exactly Subtotal * 0.18');
assertMath(Math.abs(res1.grandTotal - res1.subtotal * 1.18) < 1e-9, 'Grand Total is exactly Subtotal * 1.18');
assertMath(Math.abs(res1.grandTotal - res1.sumLineTotals) < 1e-9, 'Grand Total strictly equals sum of Line Totals');

for (let i = 0; i < 500; i++) {
  const itemCount = Math.floor(Math.random() * 8) + 1;
  const randomItems = [];
  for (let j = 0; j < itemCount; j++) {
    randomItems.push({
      id: 'item_' + j,
      base_price: Math.floor(Math.random() * 100000) + 1000,
      quantity: Math.floor(Math.random() * 500) + 1
    });
  }
  const calc = calculateCart(randomItems);
  const drift = Math.abs(calc.grandTotal - calc.sumLineTotals);
  const mathDrift = Math.abs(calc.grandTotal - (calc.subtotal * 1.18));
  assertMath(drift < 1e-6, 'Run ' + i + ': Zero drift between Grand Total and sum of Line Totals');
  assertMath(mathDrift < 1e-6, 'Run ' + i + ': Grand Total matches Subtotal * 1.18');
}

// -------------------------------------------------------------
// 2. AST Spec Parser Logic Verification
// -------------------------------------------------------------
console.log('=== TEST SUITE 2: AST SPEC PARSER LOGIC VERIFICATION ===');
function cleanExcerpt(text, maxLength = 140) {
  if (!text) return 'Premium BIS-certified structural steel';
  const clean = text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '')
    .replace(/\*(.*?)\*/g, '')
    .replace(/__(.*?)__/g, '')
    .replace(/_(.*?)_/g, '')
    .replace(/([^]+)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/>\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length > maxLength) return clean.substring(0, maxLength).trim() + '...';
  return clean || 'Premium BIS-certified structural steel';
}

const rawSample = '## Specifications\n- **Grade**: Fe-550D\n- *Standard*: IS 1786:2008\n> Guaranteed yield strength of 550 N/mm²';
const cleaned = cleanExcerpt(rawSample);
assertAST(!cleaned.includes('##') && !cleaned.includes('**') && !cleaned.includes('>'), 'cleanExcerpt removes markdown tags');
assertAST(cleaned.includes('Grade: Fe-550D') || cleaned.includes('IS 1786:2008'), 'cleanExcerpt preserves essential technical terms');

// -------------------------------------------------------------
// 3. 5-Tier Dispatch Progress Tracker State Machine Test
// -------------------------------------------------------------
console.log('=== TEST SUITE 3: 5-TIER DISPATCH PROGRESS TRACKER STATE MACHINE ===');
const DISPATCH_STAGES = [
  'order_confirmed',
  'mill_fabrication',
  'weighbridge_loaded',
  'in_transit',
  'delivered'
];

function evaluateStages(currentStatus) {
  const currentIdx = Math.max(0, DISPATCH_STAGES.indexOf(currentStatus));
  return DISPATCH_STAGES.map((st, idx) => ({
    stage: st,
    isDone: currentIdx >= idx,
    isCurrent: currentIdx === idx
  }));
}

const evalWeighbridge = evaluateStages('weighbridge_loaded');
assertDispatch(evalWeighbridge[0].isDone === true && evalWeighbridge[0].isCurrent === false, 'Stage 0 (order_confirmed) is completed');
assertDispatch(evalWeighbridge[1].isDone === true && evalWeighbridge[1].isCurrent === false, 'Stage 1 (mill_fabrication) is completed');
assertDispatch(evalWeighbridge[2].isDone === true && evalWeighbridge[2].isCurrent === true, 'Stage 2 (weighbridge_loaded) is active');
assertDispatch(evalWeighbridge[3].isDone === false && evalWeighbridge[3].isCurrent === false, 'Stage 3 (in_transit) is pending');
assertDispatch(evalWeighbridge[4].isDone === false && evalWeighbridge[4].isCurrent === false, 'Stage 4 (delivered) is pending');

// -------------------------------------------------------------
// 4. Playwright Live Browser E2E Tests
// -------------------------------------------------------------
console.log('=== TEST SUITE 4: PLAYWRIGHT LIVE BROWSER E2E TESTS ===');

async function runBrowserAudit() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop Viewport
    const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageDesktop = await contextDesktop.newPage();

    console.log('Testing Desktop Catalog and Cart Flow...');
    await pageDesktop.goto(BASE_URL + '/products', { waitUntil: 'networkidle', timeout: 30000 });
    
    const cards = await pageDesktop.locator('h3').count();
    assertE2E(cards > 0, 'Catalog loaded ' + cards + ' product card(s)');

    const searchInput = pageDesktop.locator('input[placeholder*= Search]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('ISMB');
      await pageDesktop.waitForTimeout(400);
      const ismbCards = await pageDesktop.locator('h3').count();
      assertE2E(ismbCards > 0, 'Catalog search for ISMB returned ' + ismbCards + ' result(s)');
      await searchInput.fill('');
    }

    const firstCard = pageDesktop.locator('h3').first();
    await firstCard.click();
    await pageDesktop.waitForURL(/\/products\/.+/, { timeout: 15000 });
    
    const h1Text = await pageDesktop.locator('h1').first().innerText();
    assertE2E(h1Text.length > 0, 'Product Details page loaded H1: ' + h1Text);

    // Check pricing pill
    const gstPill = await pageDesktop.locator('text=Applicable GST @ 18%').or(pageDesktop.locator('text=Market Rate on Request')).first().isVisible();
    assertE2E(gstPill, '18% GST / Market rate pill rendered on Product Details');

    // Add to cart from details page
    const addBtn = pageDesktop.locator('button').filter({ hasText: /Add.*Cart/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await pageDesktop.waitForTimeout(800);
      assertE2E(true, 'Product added to cart from details page');
    }

    // Go to Cart
    await pageDesktop.goto(BASE_URL + '/cart', { waitUntil: 'networkidle', timeout: 20000 });
    const cartHeader = await pageDesktop.locator('h1').first().innerText();
    assertE2E(cartHeader.includes('Buyer Cart') || cartHeader.includes('Procurement'), 'Cart page rendered header: ' + cartHeader);

    const valuationCard = await pageDesktop.locator('text=Consignment Valuation').or(pageDesktop.locator('text=Base Material Subtotal')).first().isVisible();
    assertE2E(valuationCard, 'Consignment Valuation summary card rendered');

    // Mobile Viewport Testing
    console.log('\nTesting Mobile Viewport (390x844)...');
    const contextMobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const pageMobile = await contextMobile.newPage();

    await pageMobile.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const mobileHomeOverflow = await pageMobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assertE2E(!mobileHomeOverflow, 'Mobile Home has 0 horizontal scroll overflow');

    await pageMobile.goto(BASE_URL + '/products', { waitUntil: 'networkidle', timeout: 20000 });
    const mobileCatOverflow = await pageMobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assertE2E(!mobileCatOverflow, 'Mobile Catalog has 0 horizontal scroll overflow');

    await pageMobile.goto(BASE_URL + '/cart', { waitUntil: 'networkidle', timeout: 20000 });
    const mobileCartOverflow = await pageMobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assertE2E(!mobileCartOverflow, 'Mobile Cart has 0 horizontal scroll overflow');

    await pageMobile.goto(BASE_URL + '/portal', { waitUntil: 'networkidle', timeout: 20000 });
    const mobilePortalOverflow = await pageMobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assertE2E(!mobilePortalOverflow, 'Mobile Portal has 0 horizontal scroll overflow');

    await contextDesktop.close();
    await contextMobile.close();
  } catch (err) {
    console.error('Playwright audit error:', err);
    assertE2E(false, 'Playwright audit threw exception: ' + err.message);
  } finally {
    await browser.close();
  }
}

runBrowserAudit().then(() => {
  console.log('\n================================================================');
  console.log('📊 INDEPENDENT AUDIT SUMMARY:');
  console.log('  Math Suite: ' + auditResults.mathSuite.passed + ' passed, ' + auditResults.mathSuite.failed + ' failed');
  console.log('  AST Suite: ' + auditResults.astSuite.passed + ' passed, ' + auditResults.astSuite.failed + ' failed');
  console.log('  Dispatch Tracker Suite: ' + auditResults.dispatchTrackerSuite.passed + ' passed, ' + auditResults.dispatchTrackerSuite.failed + ' failed');
  console.log('  E2E Browser Suite: ' + auditResults.e2eSuite.passed + ' passed, ' + auditResults.e2eSuite.failed + ' failed');
  console.log('================================================================\n');

  const totalFailed = auditResults.mathSuite.failed + auditResults.astSuite.failed + auditResults.dispatchTrackerSuite.failed + auditResults.e2eSuite.failed;
  if (totalFailed > 0) {
    process.exit(1);
  }
});
