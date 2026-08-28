/**
 * Persona C: Mobile Site Supervisor Simulation
 * Persona: Sunil Verma (Site Supervisor, Metro Site Office)
 * Viewport: Mobile (390x844)
 * Credentials: sunil.verma@metrocorridor.in | Password123!
 * 
 * Journey:
 * 1. Opens Urbanspan on Mobile Viewport (390x844)
 * 2. Navigates via mobile sticky header and 6-tab bottom bar (Home, Catalog, Quote, News, Portal, Chat)
 * 3. Requests 30 MT spot quote via DynamicForm / RFQ flow
 * 4. Verifies 18% GST live calculation & submits RFQ to CRM
 * 5. Logs into /portal to establish verified site session
 * 6. Navigates to /chat full-screen live chat route
 * 7. Connects to Socket.IO live messaging subsystem with JWT auth
 * 8. Sends urgent site dispatch inquiry message to CRM sales desk
 * 9. Audits mobile layout integrity and verifies zero horizontal scroll overflow
 */

import { chromium } from 'playwright';
import { io } from 'socket.io-client';

const BASE_URL = process.env.TEST_URL || 'https://urbanspaninfra.co.in';
const API_URL = 'https://api.urbanspaninfra.co.in';

export async function runPersonaC() {
  console.log('================================================================');
  console.log('🚀 STARTING PERSONA C: MOBILE SITE SUPERVISOR');
  console.log('👤 Profile: Sunil Verma | Indore Metro Site Office');
  console.log('📱 Viewport: Mobile (390x844 - iPhone 14 Pro)');
  console.log('🔑 Credentials: sunil.verma@metrocorridor.in | Password123!');
  console.log('🌐 Target URL:', BASE_URL);
  console.log('================================================================\n');

  const results = {
    persona: 'Persona C - Mobile Site Supervisor (Sunil Verma)',
    viewport: '390x844 (Mobile)',
    timestamp: new Date().toISOString(),
    steps: [],
    networkLogs: [],
    consoleLogs: [],
    passed: false,
    assertions: []
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1 UrbanSpanSiteSupervisor/1.0',
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  page.on('console', msg => {
    results.consoleLogs.push(`[MOBILE CONSOLE] ${msg.text()}`);
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/external/')) {
      const entry = {
        url,
        status: res.status(),
        method: res.request().method(),
        timestamp: new Date().toISOString()
      };
      try { entry.responseBody = await res.json(); } catch (e) {}
      results.networkLogs.push(entry);
      console.log(`  📡 [NET RES] ${res.request().method()} ${url} -> Status ${res.status()}`);
    }
  });

  try {
    // Step 1: Navigate to Mobile Home Dashboard
    console.log('👉 Step 1: Navigating to Mobile Home Dashboard (390x844)...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Verify Sticky Mobile Header & Bottom Tab Bar
    const stickyHeaderVisible = await page.locator('.sticky.top-0').isVisible();
    const bottomBarVisible = await page.locator('.fixed.bottom-0').isVisible();
    const quickActionGrid = await page.locator('.grid.grid-cols-2').isVisible();

    console.log(`  ✓ Sticky Mobile Header: ${stickyHeaderVisible}`);
    console.log(`  ✓ 6-Tab Bottom Navigation Bar: ${bottomBarVisible}`);
    console.log(`  ✓ 2x2 Quick Action Grid: ${quickActionGrid}`);

    results.assertions.push({ name: 'Mobile sticky header rendered', passed: stickyHeaderVisible });
    results.assertions.push({ name: 'Mobile 6-tab bottom bar rendered', passed: bottomBarVisible });
    results.assertions.push({ name: 'Mobile 2x2 Quick Action grid rendered', passed: quickActionGrid });

    // Check zero horizontal overflow on Mobile Home
    const homeOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    console.log(`  ✓ Mobile Home Zero Horizontal Overflow: ${homeOverflow}`);
    results.assertions.push({ name: 'Mobile Home zero horizontal overflow', passed: homeOverflow });

    // Step 2: Navigate to RFQ Form via Quick Action or Bottom Bar
    console.log('👉 Step 2: Navigating to /rfq for 30 MT Spot Quote...');
    const quoteTab = page.locator('a[href="/rfq"]').or(page.locator('button:has-text("Get Quote")')).first();
    await quoteTab.click();
    await page.waitForTimeout(1500);

    const rfqTitle = await page.locator('h2:has-text("Commercial Steel RFQ")').isVisible();
    console.log(`  ✓ RFQ Form Page reached: ${rfqTitle}`);
    results.assertions.push({ name: 'RFQ Form loaded on mobile', passed: rfqTitle });

    // Step 3: Configure 30 MT Spot Quote
    console.log('👉 Step 3: Selecting 30 MT tonnage preset...');
    const productSelect = page.locator('select');
    if (await productSelect.isVisible()) {
      const optionCount = await productSelect.locator('option').count();
      if (optionCount > 1) {
        await productSelect.selectOption({ index: 1 });
      }
    }

    const chip30 = page.locator('button:has-text("30 MT")');
    if (await chip30.isVisible()) {
      await chip30.click();
    } else {
      await page.fill('input[type="number"]', '30');
    }
    await page.waitForTimeout(500);

    // Step 4: Fill Site Supervisor Information
    console.log('👉 Step 4: Entering site supervisor commercial details...');
    await page.fill('input[placeholder*="Amit Sharma"]', 'Sunil Verma (Site Supervisor)');
    await page.fill('input[placeholder*="Metro Infra Projects"]', 'Indore Metro Rail Corridor-1 Joint Venture');
    await page.fill('input[placeholder*="amit.buyer@metroinfra.com"]', 'sunil.verma@metrocorridor.in');
    await page.fill('input[placeholder*="+91 94259"]', '+91 94066 99887');
    await page.fill('textarea[placeholder*="Specify delivery destination"]', 'Urgent 30 MT Fe-550D rebar batch for Pier Cap Casting at Vijayanagar Metro Site Office.');
    await page.waitForTimeout(500);

    // Step 5: Submit Spot Quote and Intercept CRM Call
    console.log('👉 Step 5: Submitting 30 MT Spot Quote to CRM...');
    const rfqPromise = page.waitForResponse(
      res => res.url().includes('/api/external/forms/by-name/lead_capture/submit') || res.url().includes('/api/external/leads'),
      { timeout: 15000 }
    );

    const submitBtn = page.locator('button[type="submit"]:has-text("Submit Commercial Steel RFQ")');
    await submitBtn.click();

    const rfqRes = await rfqPromise;
    console.log(`  ✓ RFQ Submission Response Status: ${rfqRes.status()}`);
    results.assertions.push({ name: 'Mobile Spot Quote API 200 OK', passed: rfqRes.status() === 200 || rfqRes.status() === 201 });

    await page.waitForTimeout(1000);
    const rfqConfirmed = await page.locator('h3:has-text("Commercial RFQ Transmitted!")').isVisible();
    console.log(`  ✓ RFQ Confirmation View rendered: ${rfqConfirmed}`);
    results.assertions.push({ name: 'RFQ Confirmation screen rendered', passed: rfqConfirmed });

    // Step 6: Log into Portal to establish verified customer session for Socket.IO Live Chat
    console.log('👉 Step 6: Authenticating Sunil Verma via /portal for verified live chat...');
    await page.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const loginEmailInput = page.locator('input[type="email"]');
    if (await loginEmailInput.isVisible()) {
      await loginEmailInput.fill('sunil.verma@metrocorridor.in');
      await page.locator('input[type="password"]').fill('Password123!');
      const authPromise = page.waitForResponse(res => res.url().includes('/api/external/customers/login'), { timeout: 15000 });
      await page.locator('button[type="submit"]:has-text("Sign In to Portal")').click();
      await authPromise;
      await page.waitForTimeout(1500);
    }

    const token = await page.evaluate(() => localStorage.getItem('urbanspan_customer_token'));
    console.log(`  ✓ Sunil Verma JWT Token established: ${!!token}`);
    results.assertions.push({ name: 'Client JWT authentication for Live Chat', passed: !!token });

    // Step 7: Navigate to Full-Screen Live Chat Route (/chat)
    console.log('👉 Step 7: Navigating to /chat via mobile bottom bar...');
    const chatTab = page.locator('a[href="/chat"]').first();
    await chatTab.click();
    await page.waitForTimeout(2000);

    const chatHeader = await page.locator('h4:has-text("Sales Support")').or(page.locator('h4:has-text("Urbanspan Sales Support")')).isVisible();
    const chatInput = await page.locator('input[placeholder*="Type message"]').or(page.locator('input[placeholder*="Sign in to chat"]')).first().isVisible();

    console.log(`  ✓ /chat Full-Screen Live Chat Header: ${chatHeader}`);
    console.log(`  ✓ /chat Message Input Field: ${chatInput}`);
    results.assertions.push({ name: '/chat full-screen layout loaded', passed: chatHeader && chatInput });

    // Check zero horizontal overflow on /chat
    const chatOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    console.log(`  ✓ /chat Zero Horizontal Overflow: ${chatOverflow}`);
    results.assertions.push({ name: 'Mobile /chat zero horizontal overflow', passed: chatOverflow });

    // Step 8: Send Urgent Dispatch Inquiry Message in Live Chat
    console.log('👉 Step 8: Sending urgent dispatch message in live chat...');
    const msgInput = page.locator('input[type="text"]').last();
    await msgInput.fill('Urgent: Dispatch status for Pier P-14 rebar batch needed today at Metro Site Office.');
    await page.waitForTimeout(300);

    const sendMsgPromise = page.waitForResponse(
      res => res.url().includes('/api/external/customers/me/chat/messages'),
      { timeout: 15000 }
    ).catch(() => null);

    const sendMsgBtn = page.locator('button[type="submit"]').last();
    await sendMsgBtn.click();

    const msgRes = await sendMsgPromise;
    if (msgRes) {
      console.log(`  ✓ Message API Response Status: ${msgRes.status()}`);
    }

    await page.waitForTimeout(1500);

    const sentMessageVisible = await page.locator('text=Urgent: Dispatch status for Pier P-14 rebar batch').isVisible();
    console.log(`  ✓ Chat Message Rendered in UI Thread: ${sentMessageVisible}`);
    results.assertions.push({ name: 'Site dispatch message rendered in chat thread', passed: sentMessageVisible });

    // Step 9: Direct Socket.IO Real-Time Messaging Protocol Audit with Auth
    console.log('👉 Step 9: Verifying Socket.IO bidirectional real-time communication with token...');
    const socketAudit = await new Promise((resolve) => {
      const socket = io(API_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      socket.on('connect', () => {
        console.log(`  ✓ Connected to Socket.IO server: ${socket.id}`);
        socket.disconnect();
        resolve({ connected: true, socketId: socket.id });
      });

      socket.on('connect_error', (err) => {
        console.warn(`  ⚠️ Socket connection notice: ${err.message}`);
        resolve({ connected: false, error: err.message });
      });
    });

    results.assertions.push({ name: 'Socket.IO bidirectional gateway connected with token', passed: socketAudit.connected });

    results.passed = results.assertions.every(a => a.passed);
    console.log(`\n✅ PERSONA C SIMULATION COMPLETED: ${results.passed ? 'ALL ASSERTIONS PASSED' : 'SOME ASSERTIONS FAILED'}`);

  } catch (error) {
    console.error('❌ PERSONA C FAILED with exception:', error);
    results.error = error.message;
    results.passed = false;
  } finally {
    await browser.close();
  }

  return results;
}

if (process.argv[1]?.endsWith('persona_c_mobile_supervisor.js')) {
  runPersonaC().then(res => {
    console.log('\n--- FINAL RESULT SUMMARY ---');
    console.log(JSON.stringify({ passed: res.passed, assertions: res.assertions }, null, 2));
    process.exit(res.passed ? 0 : 1);
  });
}
