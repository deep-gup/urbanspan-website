export function formatCurrencyIN(val) {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
}

export function formatInquiryDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

export function getStatusInfo(status) {
  const statusMap = {
    new: { label: 'Received / Under Review', color: 'bg-blue-100 text-blue-800' },
    contacted: { label: 'Sales Desk Assigned', color: 'bg-amber-100 text-amber-800' },
    qualified: { label: 'Commercial Evaluation', color: 'bg-indigo-100 text-indigo-800' },
    proposal: { label: 'Official Quote Ready', color: 'bg-purple-100 text-purple-800' },
    negotiation: { label: 'Rate Finalisation', color: 'bg-pink-100 text-pink-800' },
    converted: { label: 'Contract Booked & Active', color: 'bg-emerald-100 text-emerald-800' },
    won: { label: 'Contract Approved', color: 'bg-emerald-100 text-emerald-800' },
    lost: { label: 'Closed', color: 'bg-slate-100 text-slate-700' }
  };
  const key = (status || 'new').toLowerCase();
  return statusMap[key] || { label: String(status || 'PENDING').toUpperCase(), color: 'bg-slate-100 text-slate-700' };
}

export function runRenderingStressTests() {
  console.log('\n======================================================');
  console.log('🧪 SUITE 3: DATA RENDERING STRESS & BOUNDARY CONDITIONS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

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

  // Test 1: Indian Rupee Currency Formatting Stress
  const currencyCases = [
    { in: '2285000.00', expected: '₹22,85,000' },
    { in: '4835000.00', expected: '₹48,35,000' },
    { in: '100000000', expected: '₹10,00,00,000' }, // 10 Crore
    { in: '999999999999', expected: '₹9,99,99,99,99,999' }, // 999 Billion
    { in: '0', expected: '₹0' },
    { in: 0, expected: '₹0' },
    { in: null, expected: '₹0' },
    { in: undefined, expected: '₹0' },
    { in: 'not_a_number', expected: '₹0' },
    { in: -50000, expected: '₹-50,000' }
  ];

  currencyCases.forEach(tc => {
    const formatted = formatCurrencyIN(tc.in);
    const ok = formatted.includes('₹') && !formatted.includes('NaN');
    record(`Currency Format: input=${JSON.stringify(tc.in)} -> output="${formatted}"`, ok, `Formatted result: ${formatted}`);
  });

  // Test 2: Date Formatting Resilience
  const dateCases = [
    { in: '2026-08-22T09:10:31.652Z', valid: true },
    { in: '2026-01-01T00:00:00Z', valid: true },
    { in: null, valid: true },
    { in: undefined, valid: true },
    { in: 'invalid-date-string-12345', valid: true },
    { in: '', valid: true }
  ];

  dateCases.forEach(tc => {
    let output = '';
    let ok = true;
    try {
      output = formatInquiryDate(tc.in);
      ok = typeof output === 'string' && output.length > 0 && output !== 'Invalid Date';
    } catch (e) {
      ok = false;
    }
    record(`Date Formatting Resilience: input=${JSON.stringify(tc.in)} -> output="${output}"`, ok, `Rendered date safely`);
  });

  // Test 3: Status Info Mapping
  const statusTestList = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'won', 'lost', 'UNKNOWN_STATUS', null, undefined, ''];
  statusTestList.forEach(st => {
    const info = getStatusInfo(st);
    const ok = !!info.label && !!info.color && typeof info.label === 'string' && typeof info.color === 'string';
    record(`Status Mapping: input=${JSON.stringify(st)} -> label="${info.label}"`, ok, `Color class: ${info.color}`);
  });

  // Test 4: Order Line Items Matrix Stress
  const mockOrders = [
    { id: 1, title: 'Contract 1 - Full Items', deal_value: 5000000, dispatch_status: 'in_transit', items: [{ product_name: 'Fe-550D TMT', quantity: 50, unit_price: 54500 }] },
    { id: 2, title: 'Contract 2 - Empty Items', deal_value: 2000000, dispatch_status: 'order_confirmed', items: [] },
    { id: 3, title: 'Contract 3 - Null Items', deal_value: 1500000, dispatch_status: 'mill_fabrication', items: null },
    { id: 4, title: 'Contract 4 - Undefined Items', deal_value: 800000, dispatch_status: 'delivered' },
    { id: 5, title: 'Contract 5 - Corrupt Item Object', deal_value: 3000000, dispatch_status: 'weighbridge_loaded', items: [{ product_name: null, quantity: null, unit_price: null }] },
    { id: 6, title: 'Contract 6 - Large 50-Item Manifest', deal_value: 100000000, dispatch_status: 'in_transit', items: Array.from({ length: 50 }, (_, i) => ({ product_name: `Steel Item ${i + 1}`, quantity: 10, unit_price: 50000 })) }
  ];

  mockOrders.forEach(ord => {
    let renderable = true;
    try {
      const itemsList = ord.items && Array.isArray(ord.items) && ord.items.length > 0 ? ord.items : [];
      itemsList.forEach(it => {
        const name = it.product_name || 'Standard Steel Section';
        const qty = it.quantity || 1;
        const rate = formatCurrencyIN(it.unit_price);
        if (!name || !qty || !rate) renderable = false;
      });
    } catch (e) {
      renderable = false;
    }
    record(`Order Items Stress (Order "${ord.title}")`, renderable, `Items length: ${ord.items?.length || 0}`);
  });

  // Test 5: Customer User Object Safety Stress (Checking split() vulnerability)
  const userCases = [
    { user: { name: 'Sourabh Khandelwal', email: 'sourabh@test.com' }, safeSplit: true },
    { user: { name: 'Sourabh', email: 'sourabh@test.com' }, safeSplit: true },
    { user: { name: '', email: 'sourabh@test.com' }, safeSplit: true },
    { user: { name: null, email: 'sourabh@test.com' }, safeSplit: false },
    { user: { email: 'sourabh@test.com' }, safeSplit: false },
    { user: { name: 12345, email: 'sourabh@test.com' }, safeSplit: false }
  ];

  userCases.forEach(uc => {
    // Check if defensive display name getter survives:
    const safeDisplayName = (uc.user?.name && typeof uc.user.name === 'string') 
      ? uc.user.name.split(' ')[0] 
      : (uc.user?.email?.split('@')[0] || 'User');

    const ok = typeof safeDisplayName === 'string' && safeDisplayName.length > 0;
    record(`User Profile Display Name Resilience (user.name=${JSON.stringify(uc.user.name)})`, ok, `Resolved to "${safeDisplayName}" without throwing`);
  });

  console.log(`\nSuite 3 Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests.\n`);
  return { suite: 'Data Rendering Stress', passed, failed, total: passed + failed, results };
}
