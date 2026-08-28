import { runAuthAdversarialTests } from './m2_challenger_auth.js';
import { runDispatchTrackerAdversarialTests } from './m2_challenger_dispatch.js';
import { runRenderingStressTests } from './m2_challenger_rendering.js';
import { runBrowserAdversarialTests } from './m2_challenger_browser_e2e.js';

async function runAllChallengerSuites() {
  console.log('#################################################################');
  console.log('⚡ EMPIRICAL CHALLENGER VERIFICATION RUNNER: MILESTONE 2 (M2 / R2)');
  console.log('Target: Customer Self-Service Portal & Live Dispatch Tracker');
  console.log('Timestamp:', new Date().toISOString());
  console.log('#################################################################\n');

  const startTime = Date.now();

  const suite1 = await runAuthAdversarialTests();
  const suite2 = runDispatchTrackerAdversarialTests();
  const suite3 = runRenderingStressTests();
  const suite4 = await runBrowserAdversarialTests();

  const allSuites = [suite1, suite2, suite3, suite4];
  const totalPassed = allSuites.reduce((acc, s) => acc + s.passed, 0);
  const totalFailed = allSuites.reduce((acc, s) => acc + s.failed, 0);
  const grandTotal = totalPassed + totalFailed;
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n======================================================');
  console.log('📊 FINAL CHALLENGER VERIFICATION SCORECARD');
  console.log('======================================================');
  allSuites.forEach(s => {
    const rate = ((s.passed / s.total) * 100).toFixed(1);
    console.log(`- ${s.suite.padEnd(35)}: ${s.passed}/${s.total} PASSED (${rate}%)`);
  });
  console.log('------------------------------------------------------');
  console.log(`TOTAL TESTS: ${grandTotal} | PASSED: ${totalPassed} | FAILED: ${totalFailed} | DURATION: ${durationSec}s`);
  console.log(`VERDICT: ${totalFailed === 0 ? '🟢 ALL INVARIANTS SATISFIED (APPROVE)' : '🔴 DEFICIENCIES DETECTED (REQUEST_CHANGES)'}`);
  console.log('======================================================\n');

  return {
    suites: allSuites,
    totalPassed,
    totalFailed,
    grandTotal,
    durationSec,
    verdict: totalFailed === 0 ? 'APPROVE' : 'REQUEST_CHANGES'
  };
}

runAllChallengerSuites().then(res => {
  if (res.totalFailed > 0) {
    process.exitCode = 1;
  }
}).catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exitCode = 1;
});
