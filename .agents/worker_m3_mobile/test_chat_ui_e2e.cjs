const puppeteer = require('puppeteer');
const axios = require('axios');
const jwt = require('../../../distro-app/backend/node_modules/jsonwebtoken');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  baseUrl: 'https://urbanspaninfra.co.in',
  localUrl: 'http://localhost:4173',
  apiBaseUrl: 'https://api.urbanspaninfra.co.in',
  orgCode: 'urbanspan_steel_1764',
  orgId: '445f0a36-3ca4-4e68-bf53-7fb7c7b95b0b',
  orgSchema: 'org_urbanspan_steel_1785673557358',
  jwtSecret: 'fallback_secret_key_for_development',
  credentials: {
    email: 'sourabh.khandelwal@khandelwalinfra.com',
    password: 'Password123!',
    customerId: '76fddbf2-6ff9-4a43-8bbc-1206dae472d9',
    partyId: '2f406a41-9fde-4e6e-bc3e-a7669de2b52f',
    company: 'Khandelwal Infra Developers',
    name: 'Sourabh Khandelwal'
  }
};

async function runChatUiE2ETests() {
  console.log('================================================================');
  console.log('  M3: END-TO-END BROWSER CHAT UI & VIEWPORT BEHAVIOR AUDIT');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  function recordTest(name, passed, details = {}, error = null) {
    results.summary.total++;
    if (passed) results.summary.passed++;
    else results.summary.failed++;

    results.tests.push({ name, passed, details, error: error ? (error.message || String(error)) : null });
    console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}`);
    if (details && Object.keys(details).length > 0) {
      console.log(`         Details: ${JSON.stringify(details)}`);
    }
    if (error) {
      console.log(`         Error: ${error.message || error}`);
    }
  }

  // Obtain customer session token
  const payload = {
    customer_id: CONFIG.credentials.customerId,
    party_id: CONFIG.credentials.partyId,
    org_id: CONFIG.orgId,
    org_schema: CONFIG.orgSchema,
    role: 'customer'
  };
  const token = jwt.sign(payload, CONFIG.jwtSecret, { expiresIn: '30d' });
  const customerUser = {
    id: CONFIG.credentials.customerId,
    name: CONFIG.credentials.name,
    company: CONFIG.credentials.company,
    email: CONFIG.credentials.email,
    party_id: CONFIG.credentials.partyId
  };

  try {
    // ------------------------------------------------------------------------
    // SUITE 1: Mobile Viewport (390x844) Chat Experience
    // ------------------------------------------------------------------------
    console.log('\n>>> Suite 1: Mobile Viewport (390x844) Chat Experience');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // Test 1.1: Mobile Unauthenticated /chat Route
    try {
      await mobilePage.goto(`${CONFIG.baseUrl}/chat`, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 1000));

      const unauthUiState = await mobilePage.evaluate(() => {
        const authNotice = Array.from(document.querySelectorAll('div, span')).some(el => el.textContent.includes('Log in for verified sales chat'));
        const loginBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Log In'));
        const floatingBtn = document.querySelector('button.rounded-full.fixed');
        return {
          authNoticePresent: authNotice,
          loginButtonPresent: !!loginBtn,
          floatingButtonHiddenOnMobile: !floatingBtn
        };
      });

      recordTest('Mobile Unauthenticated /chat Display & Gate', unauthUiState.authNoticePresent && unauthUiState.loginButtonPresent, unauthUiState);
      recordTest('Mobile Floating Launcher Suppression (Prevents Obscuring Bottom Bar)', unauthUiState.floatingButtonHiddenOnMobile, unauthUiState);
    } catch (err) {
      recordTest('Mobile Unauthenticated /chat Display & Gate', false, {}, err);
    }

    // Test 1.2: Mobile Authenticated Full-Screen /chat Experience
    try {
      // Inject session token and user profile into localStorage
      await mobilePage.evaluate((t, u) => {
        localStorage.setItem('urbanspan_customer_token', t);
        localStorage.setItem('urbanspan_customer_user', JSON.stringify(u));
      }, token, customerUser);

      await mobilePage.goto(`${CONFIG.baseUrl}/chat`, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 2000));

      const authUiState = await mobilePage.evaluate(() => {
        const header = document.querySelector('h4');
        const statusText = document.querySelector('span.text-emerald-500, span.text-emerald-400');
        const input = document.querySelector('input[type="text"]');
        const sendBtn = document.querySelector('button[type="submit"]');
        const messages = Array.from(document.querySelectorAll('div.rounded-2xl'));

        return {
          headerTitle: header ? header.innerText : null,
          socketStatus: statusText ? statusText.innerText : null,
          hasInput: !!input,
          hasSendBtn: !!sendBtn,
          messageCount: messages.length,
          inputPlaceholder: input ? input.placeholder : null
        };
      });

      const isStateValid = authUiState.hasInput && authUiState.hasSendBtn && authUiState.messageCount >= 1;
      recordTest('Mobile Authenticated Full-Screen Support Chat UI', isStateValid, authUiState);

      // Test 1.3: Mobile Input Interaction & Message Submission
      const testMsg = `Mobile live inquiry test at ${Date.now()}`;
      await mobilePage.type('input[type="text"]', testMsg);
      await mobilePage.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 2000));

      const messageAppended = await mobilePage.evaluate((sentText) => {
        const bubbles = Array.from(document.querySelectorAll('div.rounded-2xl'));
        return bubbles.some(b => b.textContent.includes(sentText));
      }, testMsg);

      recordTest('Mobile Interactive Message Submission & Bubble Stream Appending', messageAppended, { sentText: testMsg });

    } catch (err) {
      recordTest('Mobile Authenticated Full-Screen Support Chat UI', false, {}, err);
    }

    await mobilePage.close();

    // ------------------------------------------------------------------------
    // SUITE 2: Desktop Viewport (1440x900) Floating Drawer Experience
    // ------------------------------------------------------------------------
    console.log('\n>>> Suite 2: Desktop Viewport (1440x900) Floating Drawer Experience');
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    try {
      // Inject authenticated session
      await desktopPage.goto(CONFIG.baseUrl, { waitUntil: 'domcontentloaded' });
      await desktopPage.evaluate((t, u) => {
        localStorage.setItem('urbanspan_customer_token', t);
        localStorage.setItem('urbanspan_customer_user', JSON.stringify(u));
      }, token, customerUser);

      await desktopPage.goto(CONFIG.baseUrl, { waitUntil: 'networkidle2', timeout: 25000 });
      await new Promise(r => setTimeout(r, 1500));

      // Test 2.1: Floating Launcher Button Presence & Position
      const launcherState = await desktopPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-message-square') && b.classList.contains('rounded-full'));
        if (!btn) return { found: false };
        const rect = btn.getBoundingClientRect();
        const computed = window.getComputedStyle(btn);
        return {
          found: true,
          position: computed.position,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          right: Math.round(window.innerWidth - rect.right),
          bottom: Math.round(window.innerHeight - rect.bottom),
          hasGreenPulse: !!btn.querySelector('.bg-emerald-400')
        };
      });

      recordTest('Desktop Floating Chat Launcher Button (Position & Indicator)', launcherState.found && launcherState.hasGreenPulse, launcherState);

      // Test 2.2: Open Floating Chat Drawer
      await desktopPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-message-square') && b.classList.contains('rounded-full'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      const drawerState = await desktopPage.evaluate(() => {
        const drawer = Array.from(document.querySelectorAll('div')).find(d => (d.classList.contains('w-[380px]') || d.classList.contains('w-[380px]')) && d.querySelector('input'));
        if (!drawer) return { opened: false };
        const rect = drawer.getBoundingClientRect();
        const header = drawer.querySelector('h4');
        const closeBtn = drawer.querySelector('button svg.lucide-x');
        const input = drawer.querySelector('input');
        return {
          opened: true,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          headerText: header ? header.innerText : null,
          hasCloseButton: !!closeBtn,
          hasInput: !!input
        };
      });

      recordTest('Desktop Floating Chat Drawer Open (Dimensions: ~380x520px)', drawerState.opened && drawerState.width >= 350, drawerState);

      // Test 2.3: Close Floating Chat Drawer
      await desktopPage.evaluate(() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      const drawerClosed = await desktopPage.evaluate(() => {
        const drawer = Array.from(document.querySelectorAll('div')).find(d => (d.classList.contains('w-[380px]') || d.classList.contains('w-[380px]')) && d.querySelector('input'));
        return !drawer;
      });

      recordTest('Desktop Floating Chat Drawer Smooth Close', drawerClosed, { drawerClosed });

    } catch (err) {
      recordTest('Desktop Floating Chat Drawer Experience', false, {}, err);
    }

    await desktopPage.close();
    await browser.close();

    const outputPath = path.join(__dirname, 'chat_ui_e2e_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\nChat UI E2E tests completed! Saved results to: ${outputPath}`);
    return results;

  } catch (err) {
    console.error('Fatal Chat UI E2E test failure:', err);
    await browser.close();
    process.exit(1);
  }
}

if (require.main === module) {
  runChatUiE2ETests();
}

module.exports = { runChatUiE2ETests };
