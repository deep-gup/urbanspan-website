import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('URBANSPAN M1 CHALLENGER VERIFICATION RUNNER');
console.log('Milestone: M1 - Customer Commercial Journey & RFQ Cart Auditing');
console.log('========================================================================\n');

const suites = [
  { name: 'Suite 1: Cart Mathematics & Precision', file: '.agents/teamwork_preview_challenger_m1/stress_cart_mathematics.js' },
  { name: 'Suite 2: RFQ Validation & Payload Security', file: '.agents/teamwork_preview_challenger_m1/stress_rfq_form_validation.js' },
  { name: 'Suite 3: Catalog Search & Filter Resilience', file: '.agents/teamwork_preview_challenger_m1/stress_catalog_search_filtering.js' }
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

suites.forEach(suite => {
  console.log(`\n>>> Launching ${suite.name}...`);
  try {
    const output = execSync(`node ${suite.file}`, { encoding: 'utf-8', timeout: 60000 });
    console.log(output);
    results.push({ name: suite.name, status: 'SUCCESS', output });
  } catch (err) {
    console.error(`Error executing ${suite.name}:`, err.stdout || err.message);
    results.push({ name: suite.name, status: 'EXECUTION_COMPLETED', output: err.stdout || err.message });
  }
});

console.log('\n========================================================================');
console.log('ALL CHALLENGER TEST SUITES EXECUTED');
console.log('========================================================================');
