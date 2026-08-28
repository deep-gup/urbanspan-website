const fs = require('fs');
const path = require('path');
const { runMobileResponsivenessAudit } = require('./test_mobile_responsiveness.cjs');
const { runRealtimeChatSocketTests } = require('./test_realtime_chat_socket.cjs');
const { runChatUiE2ETests } = require('./test_chat_ui_e2e.cjs');

async function runMasterVerificationSuite() {
  console.log('################################################################');
  console.log('  URBANSPAN M3: MASTER AUTOMATED VERIFICATION SUITE');
  console.log('  Milestone: R3 Mobile Parity & Real-Time Support Messaging');
  console.log('################################################################\n');

  const startTime = Date.now();
  const masterReport = {
    timestamp: new Date().toISOString(),
    suiteName: 'Milestone 3 - Mobile Parity & Real-Time Support Messaging',
    environment: {
      liveAppUrl: 'https://urbanspaninfra.co.in',
      localPreviewUrl: 'http://localhost:4173',
      apiBaseUrl: 'https://api.urbanspaninfra.co.in',
      mobileViewport: '390x844 (iPhone 12/13/14 Pro baseline)',
      desktopViewport: '1440x900'
    },
    sections: {},
    summary: {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      executionDurationMs: 0
    }
  };

  try {
    // 1. Run Mobile Responsiveness Audit
    console.log('\n================== PHASE 1: MOBILE RESPONSIVENESS ==================');
    const respResults = await runMobileResponsivenessAudit();
    masterReport.sections.mobileResponsiveness = respResults;
    for (const t of respResults.targets) {
      masterReport.summary.totalTests += t.summary.total;
      masterReport.summary.totalPassed += t.summary.passed;
      masterReport.summary.totalFailed += t.summary.failed;
    }

    // 2. Run Real-Time Chat WebSocket Tests
    console.log('\n================== PHASE 2: REAL-TIME CHAT WEBSOCKET ==================');
    const socketResults = await runRealtimeChatSocketTests();
    masterReport.sections.realtimeChatSocket = socketResults;
    masterReport.summary.totalTests += socketResults.summary.total;
    masterReport.summary.totalPassed += socketResults.summary.passed;
    masterReport.summary.totalFailed += socketResults.summary.failed;

    // 3. Run Chat UI E2E Tests
    console.log('\n================== PHASE 3: CHAT UI & VIEWPORT E2E ==================');
    const chatUiResults = await runChatUiE2ETests();
    masterReport.sections.chatUiE2E = chatUiResults;
    masterReport.summary.totalTests += chatUiResults.summary.total;
    masterReport.summary.totalPassed += chatUiResults.summary.passed;
    masterReport.summary.totalFailed += chatUiResults.summary.failed;

    masterReport.summary.executionDurationMs = Date.now() - startTime;

    // Save Master JSON Results
    const jsonPath = path.join(__dirname, 'm3_master_results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(masterReport, null, 2), 'utf8');

    console.log('\n################################################################');
    console.log('  VERIFICATION SUITE SUMMARY');
    console.log(`  Total Tests Executed: ${masterReport.summary.totalTests}`);
    console.log(`  Passed: ${masterReport.summary.totalPassed}`);
    console.log(`  Failed: ${masterReport.summary.totalFailed}`);
    console.log(`  Duration: ${(masterReport.summary.executionDurationMs / 1000).toFixed(2)}s`);
    console.log('################################################################\n');

    return masterReport;

  } catch (err) {
    console.error('Master Suite Execution Failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runMasterVerificationSuite();
}

module.exports = { runMasterVerificationSuite };
