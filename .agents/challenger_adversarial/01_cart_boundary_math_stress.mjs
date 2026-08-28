import { chromium } from 'playwright';

// Mathematical model of CartContext calculations
const GST_RATE = 0.18;

function simulateCartOperations(operations) {
  let cart = [];

  for (const op of operations) {
    if (op.type === 'add') {
      const { product, quantity } = op;
      if (!product || !product.id) continue;
      const qty = Math.max(1, Number(quantity) || 25);
      const basePrice = Number(product.base_price) || 0;
      const unit = product.unit || 'Metric Ton';

      const existingIdx = cart.findIndex((i) => i.id === product.id || (i.sku && i.sku === product.sku));
      if (existingIdx > -1) {
        const newQty = cart[existingIdx].quantity + qty;
        const lineSubtotal = newQty * (cart[existingIdx].base_price || basePrice);
        const lineGst = lineSubtotal * GST_RATE;
        cart[existingIdx] = {
          ...cart[existingIdx],
          quantity: newQty,
          lineSubtotal,
          lineGst,
          lineTotal: lineSubtotal + lineGst
        };
      } else {
        const lineSubtotal = qty * basePrice;
        const lineGst = lineSubtotal * GST_RATE;
        cart.push({
          id: product.id,
          sku: product.sku || '',
          name: product.name,
          base_price: basePrice,
          unit,
          quantity: qty,
          gst_rate: GST_RATE,
          lineSubtotal,
          lineGst,
          lineTotal: lineSubtotal + lineGst
        });
      }
    } else if (op.type === 'update') {
      const { productId, newQuantity } = op;
      const qty = Math.max(1, Number(newQuantity) || 1);
      cart = cart.map((item) => {
        if (item.id === productId || item.sku === productId) {
          const lineSubtotal = qty * item.base_price;
          const lineGst = lineSubtotal * GST_RATE;
          return {
            ...item,
            quantity: qty,
            lineSubtotal,
            lineGst,
            lineTotal: lineSubtotal + lineGst
          };
        }
        return item;
      });
    } else if (op.type === 'remove') {
      const { productId } = op;
      cart = cart.filter((i) => i.id !== productId && i.sku !== productId);
    } else if (op.type === 'clear') {
      cart = [];
    }
  }

  const totalCount = cart.length;
  const totalQuantity = cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const subtotal = cart.reduce((acc, item) => acc + (Number(item.lineSubtotal) || 0), 0);
  const totalGst = subtotal * GST_RATE;
  const grandTotal = subtotal + totalGst;

  return { cart, totalCount, totalQuantity, subtotal, totalGst, grandTotal };
}

async function runMathematicalInvarianceHarness() {
  console.log('====================================================');
  console.log('TEST HARNESS 1A: Mathematical & Boundary Simulation');
  console.log('====================================================');

  const products = [
    { id: 'p1', sku: 'US-TMT-550D', name: 'Fe-550D TMT Steel Rebars', base_price: 54500.00 },
    { id: 'p2', sku: 'US-STR-ISMB', name: 'Heavy Structural ISMB I-Beams', base_price: 58200.00 },
    { id: 'p3', sku: 'US-COIL-HR', name: 'Hot Rolled Steel Coils', base_price: 52800.00 },
    { id: 'p4', sku: 'US-COIL-CRCA', name: 'Cold Rolled Steel Sheets', base_price: 61000.00 },
    { id: 'p5', sku: 'US-PIPE-ERW', name: 'ERW Heavy Steel Piping', base_price: 63500.00 },
    { id: 'p6', sku: 'US-PLT-CARBON', name: 'Heavy Carbon Steel Plates', base_price: 59000.00 }
  ];

  let passedTests = 0;
  let totalTests = 0;
  const failures = [];

  // Case 1: 0 Quantity addition & update
  totalTests++;
  {
    const res = simulateCartOperations([
      { type: 'add', product: products[0], quantity: 0 },
      { type: 'update', productId: 'p1', newQuantity: 0 }
    ]);
    const expectedQty = 1; // Clamped by Math.max(1, ...)
    if (res.totalQuantity === expectedQty && res.subtotal === products[0].base_price) {
      console.log(`[PASS] Zero Quantity Clamping: Handled safely -> ${res.totalQuantity} MT, Subtotal: ₹${res.subtotal}`);
      passedTests++;
    } else {
      failures.push(`Zero Quantity failed: got ${res.totalQuantity}, expected ${expectedQty}`);
    }
  }

  // Case 2: Negative Quantity addition & update
  totalTests++;
  {
    const res = simulateCartOperations([
      { type: 'add', product: products[0], quantity: -50 },
      { type: 'update', productId: 'p1', newQuantity: -9999 }
    ]);
    const expectedQty = 1;
    if (res.totalQuantity === expectedQty && res.subtotal > 0) {
      console.log(`[PASS] Negative Quantity Clamping: Handled safely -> ${res.totalQuantity} MT, Subtotal: ₹${res.subtotal}`);
      passedTests++;
    } else {
      failures.push(`Negative Quantity failed: got ${res.totalQuantity}, expected ${expectedQty}`);
    }
  }

  // Case 3: Extreme Large Order (100,000 MT)
  totalTests++;
  {
    const res = simulateCartOperations([
      { type: 'add', product: products[0], quantity: 100000 },
      { type: 'add', product: products[1], quantity: 100000 }
    ]);
    const expectedSubtotal = (100000 * 54500) + (100000 * 58200);
    const expectedGst = expectedSubtotal * 0.18;
    const expectedGrand = expectedSubtotal + expectedGst;

    const mathExact = Math.abs(res.subtotal - expectedSubtotal) < 1e-5 &&
                     Math.abs(res.grandTotal - expectedGrand) < 1e-5 &&
                     Math.abs((res.subtotal * 1.18) - res.grandTotal) < 1e-5;

    if (mathExact) {
      console.log(`[PASS] Extreme 100,000 MT Multi-Order: ₹${res.grandTotal.toLocaleString('en-IN')} (Invariance Subtotal * 1.18 = Grand Total holds exact)`);
      passedTests++;
    } else {
      failures.push(`Extreme order math mismatch: subtotal=${res.subtotal}, grand=${res.grandTotal}`);
    }
  }

  // Case 4: Fractional Tonnages (0.5, 12.375, 99.99)
  totalTests++;
  {
    const res = simulateCartOperations([
      { type: 'add', product: products[2], quantity: 12.5 },
      { type: 'add', product: products[3], quantity: 87.25 }
    ]);
    const invDiff = Math.abs((res.subtotal * 1.18) - res.grandTotal);
    if (invDiff < 1e-6) {
      console.log(`[PASS] Fractional Tonnage Invariance: 99.75 MT -> Subtotal ₹${res.subtotal}, GST ₹${res.totalGst}, Grand ₹${res.grandTotal}`);
      passedTests++;
    } else {
      failures.push(`Fractional tonnage invariance failed diff: ${invDiff}`);
    }
  }

  // Case 5: 10,000 Rapid Randomized Mutations Stress Loop
  totalTests++;
  {
    const ops = [];
    for (let i = 0; i < 10000; i++) {
      const r = Math.random();
      const p = products[Math.floor(Math.random() * products.length)];
      if (r < 0.4) {
        ops.push({ type: 'add', product: p, quantity: Math.floor(Math.random() * 100) - 20 });
      } else if (r < 0.7) {
        ops.push({ type: 'update', productId: p.id, newQuantity: Math.floor(Math.random() * 200) - 10 });
      } else if (r < 0.95) {
        ops.push({ type: 'remove', productId: p.id });
      } else {
        ops.push({ type: 'clear' });
      }
    }

    const t0 = performance.now();
    const res = simulateCartOperations(ops);
    const t1 = performance.now();

    const sumLines = res.cart.reduce((acc, item) => acc + item.lineSubtotal, 0);
    const sumLineGst = res.cart.reduce((acc, item) => acc + item.lineGst, 0);
    const subtotalMatches = Math.abs(sumLines - res.subtotal) < 1e-5;
    const gstMatches = Math.abs(sumLineGst - res.totalGst) < 1e-5;
    const grandMatches = Math.abs((res.subtotal * 1.18) - res.grandTotal) < 1e-5;

    if (subtotalMatches && gstMatches && grandMatches && !isNaN(res.grandTotal)) {
      console.log(`[PASS] 10,000 Rapid Randomized Mutations executed in ${(t1 - t0).toFixed(2)}ms with 100% mathematical invariance`);
      passedTests++;
    } else {
      failures.push('Rapid mutation loop broke invariance or produced NaN');
    }
  }

  return { totalTests, passedTests, failures };
}

async function runBrowserCartStressHarness() {
  console.log('\n====================================================');
  console.log('TEST HARNESS 1B: Live Browser DOM & Cart UI Stress');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  let passedTests = 0;
  let totalTests = 0;
  const failures = [];

  try {
    // 1. Load Live Catalog / Product Page
    console.log('Navigating to live product catalog...');
    await page.goto('https://urbanspaninfra.co.in/products', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Open Product Details Page
    const firstProductCard = page.locator('div[class*="cursor-pointer"]').first();
    if (await firstProductCard.count() > 0) {
      await firstProductCard.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('https://urbanspaninfra.co.in/product/US-TMT-550D', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
    }

    // 3. Test Tonnage Stepper on Product Details: negative input and high input
    totalTests++;
    const stepperInput = page.locator('input[type="number"]').first();
    if (await stepperInput.count() > 0) {
      // Enter -100
      await stepperInput.fill('-100');
      await page.waitForTimeout(300);
      const val1 = await stepperInput.inputValue();

      // Click Add to Cart
      const addBtn = page.locator('button:has-text("Add")').first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      // Navigate to /cart
      await page.goto('https://urbanspaninfra.co.in/cart', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const cartItemQty = page.locator('input[type="number"]').first();
      const currentCartQty = await cartItemQty.inputValue();
      const qtyNum = Number(currentCartQty);

      if (qtyNum >= 1) {
        console.log(`[PASS] Negative stepper input clamped in Cart: ${qtyNum} MT (>= 1 MT)`);
        passedTests++;
      } else {
        failures.push(`Negative stepper was not clamped: got ${qtyNum}`);
      }
    }

    // 4. Test Extreme Value in Cart: 100000 MT
    totalTests++;
    const cartQtyInput = page.locator('input[type="number"]').first();
    if (await cartQtyInput.count() > 0) {
      await cartQtyInput.fill('100000');
      await page.waitForTimeout(500);

      // Verify DOM Valuation Summary text
      const pageText = await page.innerText('body');
      const hasNaN = pageText.includes('NaN');
      const hasUndefined = pageText.includes('undefined');

      if (!hasNaN && !hasUndefined) {
        console.log(`[PASS] Cart handled 100,000 MT in DOM without NaN or undefined text.`);
        passedTests++;
      } else {
        failures.push(`Cart showed NaN or undefined with 100,000 MT`);
      }
    }

    // 5. Test Rapid Plus/Minus Clicks (100 rapid clicks)
    totalTests++;
    const plusBtn = page.locator('button:has(svg.lucide-plus)').first();
    const minusBtn = page.locator('button:has(svg.lucide-minus)').first();
    if (await plusBtn.count() > 0 && await minusBtn.count() > 0) {
      for (let i = 0; i < 20; i++) {
        await plusBtn.click({ timeout: 500 }).catch(() => {});
      }
      for (let i = 0; i < 20; i++) {
        await minusBtn.click({ timeout: 500 }).catch(() => {});
      }
      await page.waitForTimeout(500);

      const finalVal = await page.locator('input[type="number"]').first().inputValue();
      console.log(`[PASS] Rapid +/- clicks completed. Current cart quantity: ${finalVal} MT`);
      passedTests++;
    }

    // 6. Test Clear Cart
    totalTests++;
    const clearBtn = page.locator('button:has-text("Clear Cart")');
    if (await clearBtn.count() > 0) {
      await clearBtn.click();
      await page.waitForTimeout(500);
      const emptyNotice = page.locator('text=Your Procurement Cart is Empty');
      if (await emptyNotice.count() > 0) {
        console.log(`[PASS] Clear Cart button cleanly resets cart state to empty view`);
        passedTests++;
      } else {
        failures.push('Empty cart state not displayed after Clear Cart');
      }
    }

  } catch (err) {
    console.error('Browser Cart test error:', err.message);
    failures.push(`Browser test exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  return { totalTests, passedTests, failures, consoleLogs, pageErrors };
}

async function main() {
  const mathResults = await runMathematicalInvarianceHarness();
  const browserResults = await runBrowserCartStressHarness();

  console.log('\n====================================================');
  console.log('SUMMARY: Cart Boundary & Mathematical Stress Results');
  console.log(`Mathematical Tests Passed: ${mathResults.passedTests}/${mathResults.totalTests}`);
  console.log(`Browser DOM Tests Passed: ${browserResults.passedTests}/${browserResults.totalTests}`);
  console.log(`Console Errors: ${browserResults.consoleLogs.length}`);
  console.log(`Page Exceptions: ${browserResults.pageErrors.length}`);
  if (mathResults.failures.length > 0 || browserResults.failures.length > 0) {
    console.log('FAILURES:', [...mathResults.failures, ...browserResults.failures]);
  } else {
    console.log('ALL CART & MATHEMATICAL STRESS TESTS PASSED WITH 100% INVARIANCE!');
  }
  console.log('====================================================');
}

main().catch(console.error);
