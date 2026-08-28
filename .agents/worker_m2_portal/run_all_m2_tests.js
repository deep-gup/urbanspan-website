/**
 * run_all_m2_tests.js
 * Master Test Runner for Milestone M2: R2 Customer Self-Service Portal & Live Dispatch Tracker
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

async function runMasterSuite() {
  console.log('================================================================');
  console.log('🚀 STARTING COMPREHENSIVE M2 VERIFICATION CAMPAIGN');
  console.log('Target: UrbanSpan Customer Portal & Dispatch Tracker');
  console.log('Web URL: https://urbanspaninfra.co.in/portal');
  console.log('API URL: https://api.urbanspaninfra.co.in');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  const workingDir = 'C:\\Users\\gupta\\.gemini\\antigravity\\scratch\\urbanspan-website\\.agents\\worker_m2_portal';
  
  // 1. Run Backend API Suite
  console.log('>>> [1/2] Executing Backend API Verification Suite (test_m2_api.js)...');
  let apiPassed = false;
  let apiOutput = '';
  try {
    const { stdout, stderr } = await execPromise(`node "${path.join(workingDir, 'test_m2_api.js')}"`, {
      cwd: 'C:\\Users\\gupta\\.gemini\\antigravity\\scratch\\urbanspan-website'
    });
    apiOutput = stdout + (stderr ? '\n' + stderr : '');
    console.log(apiOutput);
    apiPassed = true;
  } catch (err) {
    apiOutput = err.stdout + '\n' + err.stderr;
    console.error(apiOutput);
    console.error('API Verification failed:', err.message);
  }

  // 2. Run Playwright Browser E2E Suite
  console.log('\n>>> [2/2] Executing Playwright Browser E2E Verification Suite (test_m2_browser.js)...');
  let browserPassed = false;
  let browserOutput = '';
  try {
    const { stdout, stderr } = await execPromise(`node "${path.join(workingDir, 'test_m2_browser.js')}"`, {
      cwd: 'C:\\Users\\gupta\\.gemini\\antigravity\\scratch\\urbanspan-website'
    });
    browserOutput = stdout + (stderr ? '\n' + stderr : '');
    console.log(browserOutput);
    browserPassed = true;
  } catch (err) {
    browserOutput = err.stdout + '\n' + err.stderr;
    console.error(browserOutput);
    console.error('Browser E2E Verification failed:', err.message);
  }

  console.log('\n================================================================');
  console.log('📋 MASTER M2 TEST EXECUTION SUMMARY:');
  console.log(`- Backend API Suite: ${apiPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`- Browser E2E Suite: ${browserPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('================================================================\n');

  return {
    apiPassed,
    browserPassed,
    allPassed: apiPassed && browserPassed
  };
}

runMasterSuite().then((res) => {
  if (!res.allPassed) {
    process.exit(1);
  }
}).catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
