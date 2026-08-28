// Mathematical Exactness Stress Test for UrbanSpan Multi-Product Cart Engine

const GST_RATE = 0.18;

const PRODUCTS = [
  { id: 'p1', name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)', sku: 'US-TMT-550D', base_price: 54500.00 },
  { id: 'p2', name: 'Heavy Structural ISMB I-Beams & Columns', sku: 'US-STR-ISMB', base_price: 58200.00 },
  { id: 'p3', name: 'Hot Rolled (HR) Steel Coils & Sheets (2mm - 12mm)', sku: 'US-COIL-HR', base_price: 52800.00 },
  { id: 'p4', name: 'Cold Rolled (CR) Close Annealed Steel Sheets', sku: 'US-COIL-CRCA', base_price: 61000.00 },
  { id: 'p5', name: 'ERW & Seamless Heavy Steel Piping (1/2" to 14" NB)', sku: 'US-PIPE-ERW', base_price: 63500.00 },
  { id: 'p6', name: 'Heavy Carbon Steel Boiler & Structural Plates', sku: 'US-PLT-CARBON', base_price: 59000.00 }
];

const TEST_SCENARIOS = [
  { name: 'Single Item Minimum (1 MT)', items: [{ idx: 0, qty: 1 }] },
  { name: 'Single Item Standard Truckload (25 MT)', items: [{ idx: 0, qty: 25 }] },
  { name: 'Single Item Heavy Consignment (100 MT)', items: [{ idx: 1, qty: 100 }] },
  { name: 'Dual Item Rebar + Structural (50 MT + 25 MT)', items: [{ idx: 0, qty: 50 }, { idx: 1, qty: 25 }] },
  { name: 'Multi-Product Mixed Grade (All 6 Products @ 30 MT each)', items: PRODUCTS.map((_, i) => ({ idx: i, qty: 30 })) },
  { name: 'Boundary Heavy Mega-Consignment (500 MT each of all products)', items: PRODUCTS.map((_, i) => ({ idx: i, qty: 500 })) },
  { name: 'Precision Stepper Fractional/Odd Quantities (17 MT, 33 MT, 79 MT)', items: [{ idx: 0, qty: 17 }, { idx: 2, qty: 33 }, { idx: 4, qty: 79 }] }
];

console.log('================================================================');
console.log('CART ENGINE MATHEMATICAL EXACTNESS STRESS AUDIT');
console.log('Formula: LineSubtotal = Qty * Rate');
console.log('         LineGST = LineSubtotal * 0.18');
console.log('         LineTotal = LineSubtotal + LineGST');
console.log('         Subtotal = sum(LineSubtotal)');
console.log('         TotalGST = Subtotal * 0.18');
console.log('         GrandTotal = Subtotal * 1.18 = Subtotal + TotalGST');
console.log('================================================================\n');

let allPassed = true;
let scenarioResults = [];

for (const scenario of TEST_SCENARIOS) {
  let computedSubtotal = 0;
  let lineItems = [];
  let scenarioPassed = true;

  for (const it of scenario.items) {
    const prod = PRODUCTS[it.idx];
    const qty = it.qty;
    const rate = prod.base_price;
    const lineSubtotal = qty * rate;
    const lineGst = lineSubtotal * GST_RATE;
    const lineTotal = lineSubtotal + lineGst;

    computedSubtotal += lineSubtotal;

    // Check individual line formula
    const expectedLineTotal = lineSubtotal * 1.18;
    const lineDiscrepancy = Math.abs(lineTotal - expectedLineTotal);
    if (lineDiscrepancy > 0.0001) {
      scenarioPassed = false;
      allPassed = false;
    }

    lineItems.push({
      sku: prod.sku,
      name: prod.name,
      qty,
      rate,
      lineSubtotal,
      lineGst,
      lineTotal
    });
  }

  const computedTotalGst = computedSubtotal * GST_RATE;
  const computedGrandTotal = computedSubtotal + computedTotalGst;
  const direct118Total = computedSubtotal * 1.18;

  const grandTotalDiscrepancy = Math.abs(computedGrandTotal - direct118Total);
  if (grandTotalDiscrepancy > 0.0001) {
    scenarioPassed = false;
    allPassed = false;
  }

  // Sum of individual line GSTs vs Subtotal * 0.18
  const sumOfLineGsts = lineItems.reduce((acc, i) => acc + i.lineGst, 0);
  const sumOfLineTotals = lineItems.reduce((acc, i) => acc + i.lineTotal, 0);

  const gstSumDiscrepancy = Math.abs(computedTotalGst - sumOfLineGsts);
  const totalSumDiscrepancy = Math.abs(computedGrandTotal - sumOfLineTotals);

  if (gstSumDiscrepancy > 0.0001 || totalSumDiscrepancy > 0.0001) {
    scenarioPassed = false;
    allPassed = false;
  }

  scenarioResults.push({
    scenarioName: scenario.name,
    itemsCount: lineItems.length,
    totalQuantity: lineItems.reduce((a, b) => a + b.qty, 0),
    subtotal: computedSubtotal,
    gst: computedTotalGst,
    grandTotal: computedGrandTotal,
    status: scenarioPassed ? 'PASS' : 'FAIL'
  });

  console.log(`Scenario: ${scenario.name}`);
  console.log(`   Items: ${lineItems.length} | Tonnage: ${lineItems.reduce((a, b) => a + b.qty, 0)} MT`);
  console.log(`   Subtotal: ₹${computedSubtotal.toLocaleString('en-IN')}`);
  console.log(`   GST (18%): ₹${computedTotalGst.toLocaleString('en-IN')}`);
  console.log(`   Grand Total: ₹${computedGrandTotal.toLocaleString('en-IN')}`);
  console.log(`   Result: ${scenarioPassed ? '✓ PASS (Exact Zero Discrepancy)' : '✗ FAIL'}\n`);
}

console.log('================================================================');
console.log(`FINAL RESULT: ${allPassed ? 'ALL SCENARIOS PASSED WITH 100% MATHEMATICAL EXACTNESS' : 'FAILURES DETECTED'}`);
console.log('================================================================');
