// Multi-Product Cart Calculation & Mathematical Exactness Verification

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

  return { addToCart, updateQuantity, removeFromCart, clearCart, getMetrics };
}

function testCartMathematics() {
  console.log('================================================================');
  console.log('SUITE 2: MULTI-PRODUCT CART CALCULATIONS & MATHEMATICAL EXACTNESS');
  console.log('Tax Rate Constant: 18% GST (GST_RATE = 0.18)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - Details: ${details}`);
      failed++;
    }
  }

  // Scenario 1: Single item default addition (25 MT)
  console.log('Scenario 1: Single Item (25 MT @ ₹54,500/MT)');
  {
    const cart = createCartEngine();
    const product = { id: 'p1', sku: 'US-TMT-550D', name: 'Fe-550D TMT', base_price: 54500 };
    cart.addToCart(product, 25);

    const m = cart.getMetrics();
    assert(m.totalCount === 1, 'Total item count is 1');
    assert(m.totalQuantity === 25, 'Total quantity is 25 MT');
    
    const expectedSubtotal = 25 * 54500; // 1,362,500
    const expectedGst = expectedSubtotal * 0.18; // 245,250
    const expectedGrandTotal = expectedSubtotal * 1.18; // 1,607,750

    assert(m.subtotal === expectedSubtotal, `Subtotal exact: ₹${m.subtotal} === ₹${expectedSubtotal}`);
    assert(m.totalGst === expectedGst, `Total GST exact: ₹${m.totalGst} === ₹${expectedGst}`);
    assert(m.grandTotal === expectedGrandTotal, `Grand Total exact: ₹${m.grandTotal} === ₹${expectedGrandTotal}`);
    assert(m.cartItems[0].lineTotal === expectedGrandTotal, `Line Total matches Grand Total for single item`);
  }

  // Scenario 2: Multi-product 4-category consignment
  console.log('\nScenario 2: Multi-product Consignment (4 items across 4 categories)');
  {
    const cart = createCartEngine();
    const items = [
      { id: 'p1', sku: 'US-TMT-550D', name: 'Fe-550D Rebars', category: 'Rebars', base_price: 54500, qty: 100 },
      { id: 'p2', sku: 'US-STR-ISMB', name: 'ISMB 300 Beams', category: 'Structural Steel', base_price: 58200, qty: 50 },
      { id: 'p3', sku: 'US-COIL-HR', name: 'HR Steel Coils', category: 'Coils & Sheets', base_price: 52800, qty: 35 },
      { id: 'p4', sku: 'US-PIPE-ERW', name: 'ERW Heavy Pipes', category: 'Piping & Tubes', base_price: 63500, qty: 20 },
    ];

    items.forEach(i => cart.addToCart(i, i.qty));

    const m = cart.getMetrics();
    assert(m.totalCount === 4, 'Cart count is 4 items');
    assert(m.totalQuantity === 205, 'Total tonnage is 100+50+35+20 = 205 MT');

    // Individual line item checks
    let calculatedSubtotalSum = 0;
    let calculatedLineTotalSum = 0;

    m.cartItems.forEach((item, idx) => {
      const src = items[idx];
      const lineSub = src.qty * src.base_price;
      const lineGst = lineSub * 0.18;
      const lineTot = lineSub + lineGst;

      assert(item.lineSubtotal === lineSub, `Item ${idx+1} line subtotal exact (₹${item.lineSubtotal} === ₹${lineSub})`);
      assert(item.lineGst === lineGst, `Item ${idx+1} line GST exact (₹${item.lineGst} === ₹${lineGst})`);
      assert(item.lineTotal === lineTot, `Item ${idx+1} line total exact (₹${item.lineTotal} === ₹${lineTot})`);

      calculatedSubtotalSum += lineSub;
      calculatedLineTotalSum += lineTot;
    });

    assert(m.subtotal === calculatedSubtotalSum, `Consignment subtotal equals sum of line subtotals (₹${m.subtotal})`);
    assert(m.totalGst === calculatedSubtotalSum * 0.18, `Consignment GST equals Subtotal * 0.18 (₹${m.totalGst})`);
    assert(m.grandTotal === calculatedSubtotalSum * 1.18, `Consignment Grand Total equals Subtotal * 1.18 (₹${m.grandTotal})`);
    assert(Math.abs(m.grandTotal - calculatedLineTotalSum) < 1e-6, `Sum of line totals strictly equals consignment grand total`);

    console.log(`     Consignment Breakdown:`);
    console.log(`     - Subtotal (Base Material): ₹${m.subtotal.toLocaleString('en-IN')}`);
    console.log(`     - 18% Statutory GST: ₹${m.totalGst.toLocaleString('en-IN')}`);
    console.log(`     - Grand Total Consignment: ₹${m.grandTotal.toLocaleString('en-IN')}`);
  }

  // Scenario 3: Stepper updates, duplicate item additions, and removal
  console.log('\nScenario 3: Quantity Stepper, Merging Duplicates, & Item Removal');
  {
    const cart = createCartEngine();
    const p1 = { id: 'p1', sku: 'US-TMT-550D', name: 'Fe-550D Rebars', base_price: 54500 };
    const p2 = { id: 'p2', sku: 'US-STR-ISMB', name: 'ISMB Beams', base_price: 58200 };

    cart.addToCart(p1, 25);
    cart.addToCart(p2, 10);
    assert(cart.getMetrics().totalQuantity === 35, 'Initial quantity is 35 MT');

    // Add more of p1 (25 MT more -> should merge to 50 MT)
    cart.addToCart(p1, 25);
    const mAfterAdd = cart.getMetrics();
    assert(mAfterAdd.totalCount === 2, 'Duplicate add does not increase item count');
    assert(mAfterAdd.cartItems[0].quantity === 50, 'p1 quantity correctly merged to 50 MT');
    assert(mAfterAdd.cartItems[0].lineSubtotal === 50 * 54500, 'p1 line subtotal updated to 50 * 54500');

    // Update p2 via stepper: +15 MT -> 25 MT
    cart.updateQuantity('p2', 25);
    assert(cart.getMetrics().cartItems[1].quantity === 25, 'p2 quantity updated to 25 MT');
    assert(cart.getMetrics().totalQuantity === 75, 'New total quantity is 50 + 25 = 75 MT');

    // Remove p1
    cart.removeFromCart('p1');
    const mAfterRemove = cart.getMetrics();
    assert(mAfterRemove.totalCount === 1, 'Item count decreased to 1 after removing p1');
    assert(mAfterRemove.cartItems[0].id === 'p2', 'Remaining item is p2');
    assert(mAfterRemove.subtotal === 25 * 58200, 'Subtotal reflects only p2');

    // Clear cart
    cart.clearCart();
    assert(cart.getMetrics().totalCount === 0, 'Count is 0 after clearCart');
    assert(cart.getMetrics().totalQuantity === 0, 'Quantity is 0 after clearCart');
    assert(cart.getMetrics().subtotal === 0, 'Subtotal is 0 after clearCart');
    assert(cart.getMetrics().grandTotal === 0, 'Grand total is 0 after clearCart');
  }

  // Scenario 4: Edge cases (0 base price, negative quantities, boundary testing)
  console.log('\nScenario 4: Edge Cases & Mathematical Boundary Invariants');
  {
    const cart = createCartEngine();
    // Unpriced item (base_price: 0 or null)
    const unpriced = { id: 'p_null', sku: 'TMT-UNPRICED', name: 'Custom Alloy', base_price: null };
    cart.addToCart(unpriced, 50);

    const mNull = cart.getMetrics();
    assert(mNull.cartItems[0].base_price === 0, 'Null base_price safely defaults to 0');
    assert(mNull.cartItems[0].lineSubtotal === 0, 'Line subtotal is 0 without NaN');
    assert(mNull.cartItems[0].lineTotal === 0, 'Line total is 0 without NaN');
    assert(mNull.subtotal === 0 && !isNaN(mNull.subtotal), 'Consignment subtotal is numeric 0');
    assert(mNull.grandTotal === 0 && !isNaN(mNull.grandTotal), 'Grand total is numeric 0');

    // Attempting negative quantity via stepper
    cart.updateQuantity('p_null', -10);
    assert(cart.getMetrics().cartItems[0].quantity === 1, 'Negative quantity clamped to minimum 1 MT');

    // Large bulk industrial tonnage test (10,000 MT)
    const heavySteel = { id: 'p_heavy', sku: 'US-HEAVY', name: 'Industrial Billet', base_price: 60000 };
    cart.addToCart(heavySteel, 10000);
    const mHeavy = cart.getMetrics();
    const expectedHeavySubtotal = 10000 * 60000; // 600,000,000 (60 Crores)
    const expectedHeavyTotal = expectedHeavySubtotal * 1.18; // 708,000,000 (70.8 Crores)
    assert(mHeavy.cartItems[1].lineSubtotal === expectedHeavySubtotal, 'Large subtotal matches exact integer math');
    assert(mHeavy.cartItems[1].lineTotal === expectedHeavyTotal, 'Large grand total matches exact integer math');
  }

  // Scenario 5: Randomized 100 Iteration Stress Test
  console.log('\nScenario 5: 100-Cycle Randomized Consignment Simulation');
  let randomizedAllPassed = true;
  for (let i = 1; i <= 100; i++) {
    const cart = createCartEngine();
    const itemCount = 1 + Math.floor(Math.random() * 8);
    let expectedConsignmentSubtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const price = 40000 + Math.floor(Math.random() * 30000);
      const qty = 5 + Math.floor(Math.random() * 200);
      cart.addToCart({ id: `rand_${j}`, sku: `SKU-${j}`, name: `Steel ${j}`, base_price: price }, qty);
      expectedConsignmentSubtotal += price * qty;
    }

    const m = cart.getMetrics();
    const expectedConsignmentGst = expectedConsignmentSubtotal * 0.18;
    const expectedConsignmentGrand = expectedConsignmentSubtotal * 1.18;

    if (
      m.subtotal !== expectedConsignmentSubtotal ||
      Math.abs(m.totalGst - expectedConsignmentGst) > 1e-5 ||
      Math.abs(m.grandTotal - expectedConsignmentGrand) > 1e-5
    ) {
      randomizedAllPassed = false;
      console.error(`Random test failed at iteration ${i}`);
      break;
    }
  }
  assert(randomizedAllPassed, '100 randomized multi-item cart consignment tests passed with exact GST & Grand Total');

  console.log('\n----------------------------------------------------------------');
  console.log(`SUITE 2 RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('----------------------------------------------------------------\n');

  return { passed, failed, total: passed + failed };
}

if (process.argv[1]?.endsWith('test_cart_mathematics.js')) {
  const res = testCartMathematics();
  if (res.failed > 0) process.exit(1);
}

export { testCartMathematics };
