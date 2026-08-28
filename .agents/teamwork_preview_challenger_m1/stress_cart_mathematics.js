// Stress Test Suite 1: Mathematical Precision & Rounding Edge Cases (M1)
// Adversarial Challenger for UrbanSpan M1 Cart Engine

const GST_RATE = 0.18;

function createCartEngine() {
  let cartItems = [];

  const addToCart = (product, quantity = 25) => {
    if (!product || !product.id) return;
    const qty = Math.max(1, Number(quantity) || 25);
    const basePrice = Number(product.base_price) || 0;
    const unit = product.unit || 'Metric Ton';

    const existingIdx = cartItems.findIndex((item) => item.id === product.id || (item.sku && item.sku === product.sku));
    if (existingIdx > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIdx].quantity + qty;
      const lineSubtotal = newQty * (updated[existingIdx].base_price || basePrice);
      const lineGst = lineSubtotal * GST_RATE;
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        lineSubtotal,
        lineGst,
        lineTotal: lineSubtotal + lineGst
      };
      cartItems = updated;
    } else {
      const image = (Array.isArray(product.images) && product.images[0]) || product.image_url || '/images/tmt_rebars.jpg';
      const lineSubtotal = qty * basePrice;
      const lineGst = lineSubtotal * GST_RATE;
      const newItem = {
        id: product.id,
        sku: product.sku || '',
        name: product.name,
        category: product.category || 'Steel',
        image,
        base_price: basePrice,
        unit,
        quantity: qty,
        gst_rate: GST_RATE,
        lineSubtotal,
        lineGst,
        lineTotal: lineSubtotal + lineGst,
        specs: product.specs || {}
      };
      cartItems = [...cartItems, newItem];
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = Math.max(1, Number(newQuantity) || 1);
    cartItems = cartItems.map((item) => {
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
  };

  const removeFromCart = (productId) => {
    cartItems = cartItems.filter((item) => item.id !== productId && item.sku !== productId);
  };

  const clearCart = () => {
    cartItems = [];
  };

  const getMetrics = () => {
    const totalCount = cartItems.length;
    const totalQuantity = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.lineSubtotal) || 0), 0);
    const totalGst = subtotal * GST_RATE;
    const grandTotal = subtotal + totalGst;
    return {
      cartItems,
      totalCount,
      totalQuantity,
      subtotal,
      totalGst,
      grandTotal,
      gstRate: GST_RATE
    };
  };

  const hydrateRaw = (rawItems) => {
    cartItems = rawItems;
  };

  return { addToCart, updateQuantity, removeFromCart, clearCart, getMetrics, hydrateRaw };
}

function runMathStressTests() {
  console.log('========================================================================');
  console.log('CHALLENGER STRESS SUITE 1: MATHEMATICAL & ROUNDING PRECISION EDGE CASES');
  console.log('Target: UrbanSpan CartContext Mathematical Formulae & Rounding Invariants');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const findings = [];

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - Details: ${details}`);
      failed++;
      findings.push({ test: name, error: details });
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Large Tonnages (1,000 MT, 10,000 MT, 100,000 MT, 1,000,000 MT)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Large Tonnages Precision Audit ---');
  {
    const tonnages = [1000, 10000, 100000, 1000000];
    const baseRates = [54500, 58200, 61000, 63500];

    tonnages.forEach((qty, idx) => {
      const cart = createCartEngine();
      const rate = baseRates[idx];
      cart.addToCart({ id: `p_${idx}`, sku: `SKU-${idx}`, name: `Bulk Item ${idx}`, base_price: rate }, qty);

      const m = cart.getMetrics();
      const expectedSubtotal = qty * rate;
      const expectedGst = expectedSubtotal * 0.18;
      const expectedGrandTotal = expectedSubtotal * 1.18;

      assert(m.subtotal === expectedSubtotal, `Large Tonnage (${qty} MT @ ₹${rate}/MT) subtotal exact: ₹${m.subtotal}`);
      assert(m.totalGst === expectedGst, `Large Tonnage (${qty} MT) GST exact: ₹${m.totalGst}`);
      assert(m.grandTotal === expectedGrandTotal, `Large Tonnage (${qty} MT) Grand Total exact: ₹${m.grandTotal}`);
      assert(m.grandTotal === m.subtotal + m.totalGst, `Additive invariant holds for ${qty} MT`);
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Fractional Pricing & Rates (e.g. ₹54500.50, ₹48234.33, ₹61111.11, ₹49999.99)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Fractional Pricing & Rates Precision Audit ---');
  {
    const fractionalRates = [54500.50, 48234.33, 61111.11, 49999.99, 52800.75];
    fractionalRates.forEach((rate, idx) => {
      const cart = createCartEngine();
      const qty = 33; // odd tonnage
      cart.addToCart({ id: `frac_${idx}`, sku: `FRAC-${idx}`, name: `Frac Item ${idx}`, base_price: rate }, qty);

      const m = cart.getMetrics();
      const expectedSubtotal = qty * rate;
      const expectedGst = expectedSubtotal * 0.18;
      const expectedGrandTotal = expectedSubtotal * 1.18;

      const subtotalDiff = Math.abs(m.subtotal - expectedSubtotal);
      const gstDiff = Math.abs(m.totalGst - expectedGst);
      const grandTotalDiff = Math.abs(m.grandTotal - expectedGrandTotal);

      assert(subtotalDiff < 1e-9, `Fractional Rate ₹${rate} Subtotal exact within float precision (diff: ${subtotalDiff})`);
      assert(gstDiff < 1e-9, `Fractional Rate ₹${rate} GST exact within float precision (diff: ${gstDiff})`);
      assert(grandTotalDiff < 1e-9, `Fractional Rate ₹${rate} Grand Total exact within float precision (diff: ${grandTotalDiff})`);
      
      // Check display rounding
      const formattedSubtotal = Math.round(m.subtotal);
      const formattedGst = Math.round(m.totalGst);
      const formattedGrandTotal = Math.round(m.grandTotal);
      assert(!isNaN(formattedSubtotal) && !isNaN(formattedGst) && !isNaN(formattedGrandTotal), `Formatted values are valid numbers`);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Odd Tonnages & Prime Numbers (1, 3, 7, 11, 13, 17, 19, 37, 99 MT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Odd Tonnages & Prime Quantities Audit ---');
  {
    const oddTonnages = [1, 3, 7, 11, 13, 17, 19, 37, 99];
    const cart = createCartEngine();
    let cumulativeSubtotal = 0;

    oddTonnages.forEach((qty, idx) => {
      const rate = 50000 + (idx * 1337);
      cart.addToCart({ id: `odd_${idx}`, sku: `ODD-${idx}`, name: `Odd Item ${idx}`, base_price: rate }, qty);
      cumulativeSubtotal += qty * rate;
    });

    const m = cart.getMetrics();
    const expectedConsignmentTotal = cumulativeSubtotal * 1.18;
    const expectedConsignmentGst = cumulativeSubtotal * 0.18;

    assert(m.totalCount === 9, 'All 9 odd items added');
    assert(m.subtotal === cumulativeSubtotal, `Cumulative subtotal exact: ₹${m.subtotal} === ₹${cumulativeSubtotal}`);
    assert(Math.abs(m.totalGst - expectedConsignmentGst) < 1e-9, `Consignment GST exact: ₹${m.totalGst}`);
    assert(Math.abs(m.grandTotal - expectedConsignmentTotal) < 1e-9, `Consignment Grand Total exact: ₹${m.grandTotal}`);
  }

  // ---------------------------------------------------------------------------
  // 4. 100,000 Iteration Monte Carlo Floating Point Drift Invariant Stress Test
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. 100,000-Iteration Monte Carlo Floating-Point Drift Stress Test ---');
  {
    let maxDrift = 0;
    let driftCount = 0;
    const iterations = 100000;

    for (let i = 0; i < iterations; i++) {
      const numItems = 1 + Math.floor(Math.random() * 10);
      let simSubtotal = 0;

      for (let k = 0; k < numItems; k++) {
        const qty = 1 + Math.floor(Math.random() * 500);
        // Random price between 30,000 and 90,000 with up to 2 decimal places
        const price = Math.round((30000 + Math.random() * 60000) * 100) / 100;
        simSubtotal += qty * price;
      }

      const totalGst = simSubtotal * 0.18;
      const grandTotal1 = simSubtotal + totalGst;
      const grandTotal2 = simSubtotal * 1.18;

      const drift = Math.abs(grandTotal1 - grandTotal2);
      if (drift > maxDrift) maxDrift = drift;
      if (drift > 1e-5) driftCount++;
    }

    assert(driftCount === 0, `0 drift occurrences > 1e-5 across 100,000 random consignments (Max drift: ${maxDrift})`);
    console.log(`     Maximum Floating-Point Discrepancy observed: ${maxDrift.toExponential(4)}`);
  }

  // ---------------------------------------------------------------------------
  // 5. Quantity Stepper & Defensive Bounds Testing
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Quantity Stepper & Defensive Boundary Testing ---');
  {
    const cart = createCartEngine();
    const item = { id: 'p_boundary', sku: 'BOUND-1', name: 'Boundary Item', base_price: 50000 };

    // Add with 0 -> should clamp to default 25
    cart.addToCart(item, 0);
    assert(cart.getMetrics().cartItems[0].quantity === 25, 'addToCart with quantity=0 defaults to 25 MT');

    // Add with negative -> Math.max(1, -10) -> should be 25 + 1 = 26
    cart.addToCart(item, -10);
    assert(cart.getMetrics().cartItems[0].quantity === 26, 'addToCart with negative quantity defaults to min 1 MT added');

    // Update with 0 -> should clamp to 1
    cart.updateQuantity('p_boundary', 0);
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'updateQuantity to 0 clamps to minimum 1 MT');

    // Update with negative -> should clamp to 1
    cart.updateQuantity('p_boundary', -999);
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'updateQuantity to -999 clamps to minimum 1 MT');

    // Update with NaN / String
    cart.updateQuantity('p_boundary', 'abc');
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'updateQuantity with "abc" safely falls back to 1 MT');

    cart.updateQuantity('p_boundary', null);
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'updateQuantity with null safely falls back to 1 MT');

    cart.updateQuantity('p_boundary', undefined);
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'updateQuantity with undefined safely falls back to 1 MT');

    // Update with numeric string "50"
    cart.updateQuantity('p_boundary', '50');
    assert(cart.getMetrics().cartItems[0].quantity === 50, 'updateQuantity with numeric string "50" coerces to 50 MT');
  }

  // ---------------------------------------------------------------------------
  // 6. Rounding Discrepancy Analysis between Sum of Rounded Line Totals vs Consignment Total
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Line Item Rounding vs Consignment Summary Analysis ---');
  {
    // Check if rounding each line item separately produces differences with rounding grandTotal
    // In commercial invoicing: Consignment Total = Math.round(Sum(Line Subtotals) * 1.18)
    const cart = createCartEngine();
    const items = [
      { id: 'r1', sku: 'R1', name: 'Rebar 8mm', base_price: 54501, qty: 3 },
      { id: 'r2', sku: 'R2', name: 'Rebar 10mm', base_price: 54503, qty: 7 },
      { id: 'r3', sku: 'R3', name: 'Rebar 12mm', base_price: 54507, qty: 11 }
    ];
    items.forEach(i => cart.addToCart(i, i.qty));

    const m = cart.getMetrics();
    const sumOfRoundedLineTotals = m.cartItems.reduce((acc, i) => acc + Math.round(i.lineTotal), 0);
    const roundedConsignmentTotal = Math.round(m.grandTotal);
    const roundingDiff = Math.abs(sumOfRoundedLineTotals - roundedConsignmentTotal);

    console.log(`     Sum of Rounded Line Totals: ₹${sumOfRoundedLineTotals.toLocaleString('en-IN')}`);
    console.log(`     Rounded Consignment Grand Total: ₹${roundedConsignmentTotal.toLocaleString('en-IN')}`);
    console.log(`     Rounding Delta: ₹${roundingDiff}`);
    assert(roundingDiff <= items.length, `Rounding delta is within statutory tolerance <= ₹${items.length} (Observed: ₹${roundingDiff})`);
  }

  console.log('\n========================================================================');
  console.log(`SUITE 1 RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  return { passed, failed, findings };
}

runMathStressTests();
