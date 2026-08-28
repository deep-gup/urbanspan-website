const DISPATCH_STAGES = [
  { key: 'order_confirmed', label: '1. Order Booked' },
  { key: 'mill_fabrication', label: '2. Mill Rolling' },
  { key: 'weighbridge_loaded', label: '3. Weighbridge Loaded' },
  { key: 'in_transit', label: '4. In Transit' },
  { key: 'delivered', label: '5. Delivered' }
];

export function computeStageState(dispatchStatus) {
  const currentStatus = dispatchStatus || 'order_confirmed';
  const stageKeys = DISPATCH_STAGES.map(s => s.key);
  const currentIdx = Math.max(0, stageKeys.indexOf(currentStatus));

  const stages = DISPATCH_STAGES.map((st, idx) => {
    const isDone = currentIdx >= idx;
    const isCurrent = currentIdx === idx;
    return {
      key: st.key,
      label: st.label,
      idx,
      isDone,
      isCurrent,
      state: isCurrent ? 'CURRENT' : isDone ? 'COMPLETED' : 'PENDING'
    };
  });

  const progressPercent = Math.round(((currentIdx + 1) / DISPATCH_STAGES.length) * 100);

  return {
    rawStatus: dispatchStatus,
    currentStatus,
    currentIdx,
    progressPercent,
    stages
  };
}

export function runDispatchTrackerAdversarialTests() {
  console.log('\n======================================================');
  console.log('🧪 SUITE 2: DISPATCH TRACKER INVARIANTS & STAGE BOUNDS');
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

  // Test 1-5: Exact Stage Invariant Verification for all 5 official states
  const testCases = [
    { status: 'order_confirmed', expectedIdx: 0, expectedCurrent: 0, expectedDoneCount: 1, expectedPercent: 20 },
    { status: 'mill_fabrication', expectedIdx: 1, expectedCurrent: 1, expectedDoneCount: 2, expectedPercent: 40 },
    { status: 'weighbridge_loaded', expectedIdx: 2, expectedCurrent: 2, expectedDoneCount: 3, expectedPercent: 60 },
    { status: 'in_transit', expectedIdx: 3, expectedCurrent: 3, expectedDoneCount: 4, expectedPercent: 80 },
    { status: 'delivered', expectedIdx: 4, expectedCurrent: 4, expectedDoneCount: 5, expectedPercent: 100 }
  ];

  testCases.forEach(({ status, expectedIdx, expectedCurrent, expectedDoneCount, expectedPercent }) => {
    const res = computeStageState(status);

    const idxMatch = res.currentIdx === expectedIdx;
    const currentMatches = res.stages.filter(s => s.isCurrent).length === 1 && res.stages[expectedCurrent].isCurrent === true;
    const doneMatches = res.stages.filter(s => s.isDone).length === expectedDoneCount;
    const percentMatches = res.progressPercent === expectedPercent;

    let sequenceValid = true;
    for (let i = 0; i < 5; i++) {
      if (i < expectedIdx && (!res.stages[i].isDone || res.stages[i].isCurrent)) sequenceValid = false;
      if (i === expectedIdx && (!res.stages[i].isDone || !res.stages[i].isCurrent)) sequenceValid = false;
      if (i > expectedIdx && (res.stages[i].isDone || res.stages[i].isCurrent)) sequenceValid = false;
    }

    const ok = idxMatch && currentMatches && doneMatches && percentMatches && sequenceValid;
    record(`Stage Invariant: "${status}" -> Index ${expectedIdx} (${expectedPercent}%)`, ok, 
      `Idx=${res.currentIdx}, DoneCount=${res.stages.filter(s => s.isDone).length}, SequenceValid=${sequenceValid}`);
  });

  // Test 6: Unknown status string handling
  const unknownStatuses = ['cancelled', 'on_hold', 'processing_error', 'customs_hold', 'UNKNOWN_STATUS_CODE'];
  unknownStatuses.forEach((unk) => {
    const res = computeStageState(unk);
    const boundsValid = res.currentIdx >= 0 && res.currentIdx < 5;
    const exactlyOneCurrent = res.stages.filter(s => s.isCurrent).length === 1;
    const noNaN = !isNaN(res.progressPercent);

    record(`Stage Bounds Fuzzing: Unknown status "${unk}"`, boundsValid && exactlyOneCurrent && noNaN,
      `Calculated fallback idx: ${res.currentIdx}, No NaN, Single current stage`);
  });

  // Test 7: Null, Undefined, and Empty String Dispatch Statuses
  const falsyStatuses = [null, undefined, '', '   '];
  falsyStatuses.forEach((falsyVal) => {
    const res = computeStageState(falsyVal);
    const boundsOk = res.currentIdx === 0 && res.progressPercent === 20;
    record(`Falsy Status Fallback: ${JSON.stringify(falsyVal)} -> Clamped to Idx 0 (20%)`, boundsOk,
      `currentIdx=${res.currentIdx}, progress=${res.progressPercent}%`);
  });

  // Test 8: Non-string and Corrupted Types
  const corruptTypes = [12345, true, false, {}, [], NaN, -1];
  corruptTypes.forEach((corrupt) => {
    let ok = false;
    try {
      const res = computeStageState(corrupt);
      ok = res.currentIdx >= 0 && res.currentIdx <= 4 && !isNaN(res.progressPercent);
    } catch (e) {
      ok = false;
    }
    record(`Corrupt Type Invariant: ${JSON.stringify(corrupt)}`, ok, 'Safely clamped without uncaught runtime exception');
  });

  // Test 9: Mathematical Monotonicity Invariant Proof
  let monotonic = true;
  let lastPercent = 0;
  for (const tc of testCases) {
    const res = computeStageState(tc.status);
    if (res.progressPercent <= lastPercent && lastPercent > 0) {
      monotonic = false;
    }
    lastPercent = res.progressPercent;
  }
  record('Mathematical Monotonicity Invariant (Strictly increasing progress 20% -> 100%)', monotonic, `Progress strictly increases monotonically`);

  console.log(`\nSuite 2 Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests.\n`);
  return { suite: 'Dispatch Tracker Adversarial', passed, failed, total: passed + failed, results };
}
