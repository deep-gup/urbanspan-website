import { testApiEndpoints } from './test_api_endpoints.js';
import { testCartMathematics } from './test_cart_mathematics.js';
import { runE2ECommercialJourney } from './test_e2e_commercial_journey.js';
import fs from 'fs';
import path from 'path';

async function runMasterM1Audit() {
  console.log('========================================================================');
  console.log('URBANSPAN INFRASTRUCTURE — MILESTONE M1 AUDIT & VERIFICATION RUNNER');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Target Frontend:', 'https://urbanspaninfra.co.in');
  console.log('Target Headless API:', 'https://api.urbanspaninfra.co.in/api');
  console.log('========================================================================\n');

  const startTime = Date.now();
  const summary = {
    timestamp: new Date().toISOString(),
    suites: {},
    totalPassed: 0,
    totalFailed: 0,
    durationMs: 0,
    status: 'UNKNOWN'
  };

  // Suite 1: Headless API Endpoints
  try {
    const s1 = await testApiEndpoints();
    summary.suites.apiEndpoints = s1;
    summary.totalPassed += s1.passed;
    summary.totalFailed += s1.failed;
  } catch (err) {
    summary.suites.apiEndpoints = { error: err.message, passed: 0, failed: 1 };
    summary.totalFailed += 1;
  }

  // Suite 2: Cart Mathematics
  try {
    const s2 = testCartMathematics();
    summary.suites.cartMathematics = s2;
    summary.totalPassed += s2.passed;
    summary.totalFailed += s2.failed;
  } catch (err) {
    summary.suites.cartMathematics = { error: err.message, passed: 0, failed: 1 };
    summary.totalFailed += 1;
  }

  // Suite 3: Playwright E2E Commercial Journey
  try {
    const s3 = await runE2ECommercialJourney();
    summary.suites.e2eJourney = s3;
    summary.totalPassed += s3.passed;
    summary.totalFailed += s3.failed;
  } catch (err) {
    summary.suites.e2eJourney = { error: err.message, passed: 0, failed: 1 };
    summary.totalFailed += 1;
  }

  summary.durationMs = Date.now() - startTime;
  summary.status = summary.totalFailed === 0 ? 'PASSED' : 'FAILED';

  console.log('\n========================================================================');
  console.log(`FINAL MILESTONE M1 AUDIT SUMMARY`);
  console.log(`Status: ${summary.status}`);
  console.log(`Total Passed Assertions: ${summary.totalPassed}`);
  console.log(`Total Failed Assertions: ${summary.totalFailed}`);
  console.log(`Total Execution Time: ${(summary.durationMs / 1000).toFixed(2)}s`);
  console.log('========================================================================\n');

  // Save audit output to test_results.json
  const resultsPath = path.resolve('.agents/worker_m1_cart/test_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(`Results written to: ${resultsPath}`);

  if (summary.totalFailed > 0) {
    process.exit(1);
  }
}

runMasterM1Audit().catch(err => {
  console.error('Master runner fatal failure:', err);
  process.exit(1);
});
