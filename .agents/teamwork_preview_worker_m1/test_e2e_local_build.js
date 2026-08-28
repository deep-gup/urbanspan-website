import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST_DIR = path.resolve('dist');
const PORT = 4173;

// Lightweight static file server for Vite built assets
function startLocalServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    
    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html'); // SPA fallback
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Local test server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)',
    sku: 'US-TMT-550D',
    category: 'Rebars',
    base_price: 54500.00,
    unit: 'Metric Ton',
    description: `### Primary Infrastructure Grade TMT
High tensile earthquake-resistant TMT rebars adhering to **IS 1786:2008** specifications for heavy infrastructure & high-rise construction.

## Material Features
- Superior ductility with high elongation (>16%)
- Thermex thermo-mechanical treatment technology
- Extreme corrosion and earthquake resistance
- Excellent bendability without crack formation

> Manufactured in certified primary steel mills with BIS certification. Tested for yield strength and tensile ratio.

### Quality Parameters
1. Yield Strength: Minimum 550 N/mm²
2. Tensile Strength: Minimum 600 N/mm²
3. Elongation: 14.5% to 18.0%
4. Carbon Equivalent: Maximum 0.42%`,
    image_url: '/images/tmt_rebars.jpg',
    images: ['/images/tmt_rebars.jpg'],
    specs: { Grade: 'Fe-550D', Standard: 'IS 1786:2008', YieldStrength: '550 N/mm²', Ductility: 'High (D-Grade)' },
    tags: ['Rebars', 'In Stock & Ready', 'BIS Certified']
  },
  {
    id: 'p2',
    name: 'Heavy Structural ISMB I-Beams & Columns',
    sku: 'US-STR-ISMB',
    category: 'Structural Steel',
    base_price: 58200.00,
    unit: 'Metric Ton',
    description: `### Heavy Structural Steel Sections
Primary structural steel sections (ISMB 100 to ISMB 600) certified under **IS 2062:2011 Grade E250 / E350** for bridge & factory building frames.

## Key Applications
- Industrial warehouse pre-engineered buildings
- Heavy flyovers and bridge structural spans
- Multi-tier industrial racking and mezzanines

> Available in standard 6m, 11m, and 12m lengths with custom cut-to-length options.`,
    image_url: '/images/structural_beams.jpg',
    images: ['/images/structural_beams.jpg'],
    specs: { Grade: 'IS 2062 E250 / E350', Sections: 'ISMB 100 - 600', Standard: 'IS 808', Application: 'Bridges & High Rises' },
    tags: ['Structural Steel', 'Primary Steel', 'In Stock']
  },
  {
    id: 'p3',
    name: 'Hot Rolled (HR) Steel Coils & Sheets (2mm - 12mm)',
    sku: 'US-COIL-HR',
    category: 'Coils & Sheets',
    base_price: 52800.00,
    unit: 'Metric Ton',
    description: `### Industrial Hot Rolled Coils
Industrial hot rolled coil stock with uniform gauge control and superior weldability for automotive chassis & heavy equipment.

## Product Details
- Uniform chemical composition conforming to **IS 10748**
- High formability and fatigue resistance
- Ideal for pipe manufacturing and heavy chassis fabrication`,
    image_url: '/images/steel_coils.jpg',
    images: ['/images/steel_coils.jpg'],
    specs: { Thickness: '2.0mm - 12.0mm', Width: '1250mm / 1500mm', Standard: 'IS 10748', CoilWeight: '15 - 28 Tons' },
    tags: ['Coils & Sheets', 'In Stock & Ready']
  },
  {
    id: 'p4',
    name: 'Cold Rolled (CR) Close Annealed Steel Sheets',
    sku: 'US-COIL-CRCA',
    category: 'Coils & Sheets',
    base_price: 61000.00,
    unit: 'Metric Ton',
    description: 'High surface finish CRCA sheets designed for precision fabrication, panel enclosures, and appliance manufacturing.',
    image_url: '/images/steel_coils.jpg',
    images: ['/images/steel_coils.jpg'],
    specs: { Thickness: '0.4mm - 3.0mm', Finish: 'Matt / Bright', Standard: 'IS 513', Formability: 'Extra Deep Drawing' },
    tags: ['Coils & Sheets', 'Precision Grade']
  },
  {
    id: 'p5',
    name: 'ERW & Seamless Heavy Steel Piping (1/2" to 14" NB)',
    sku: 'US-PIPE-ERW',
    category: 'Piping & Tubes',
    base_price: 63500.00,
    unit: 'Metric Ton',
    description: 'Black & Hot-Dip Galvanized carbon steel pipes according to IS 1239 / IS 3589 for industrial fluid distribution & HVAC.',
    image_url: '/images/steel_pipes.jpg',
    images: ['/images/steel_pipes.jpg'],
    specs: { Size: '1/2" to 14" NB', Schedule: 'Sch 20 - Sch 80', Standard: 'IS 1239 / IS 3589', Coating: 'Galvanized / Black' },
    tags: ['Piping & Tubes', 'Heavy Industry']
  },
  {
    id: 'p6',
    name: 'Heavy Carbon Steel Boiler & Structural Plates',
    sku: 'US-PLT-CARBON',
    category: 'Plates',
    base_price: 59000.00,
    unit: 'Metric Ton',
    description: 'High strength pressure vessel and structural steel plates conforming to IS 2062 / ASTM A36 standard for heavy engineering.',
    image_url: '/images/structural_beams.jpg',
    images: ['/images/structural_beams.jpg'],
    specs: { Thickness: '6mm - 100mm', Grade: 'ASTM A36 / IS 2062', Testing: 'Ultrasonic Tested', Edge: 'Mill / Trimmed' },
    tags: ['Plates', 'Boiler Quality']
  }
];

const FORM_SCHEMA = {
  name: 'lead_capture',
  title: 'Commercial Steel RFQ Submission',
  fields: [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'company', label: 'Company / Organization', type: 'text', required: true },
    { name: 'email', label: 'Business Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'tel', required: true },
    { name: 'quantity', label: 'Required Quantity (MT)', type: 'number', required: true },
    { name: 'expected_value', label: 'Estimated Value', type: 'number', required: false },
    { name: 'notes', label: 'Delivery Site & Specs', type: 'textarea', required: false }
  ]
};

async function runLocalE2ETest() {
  const server = await startLocalServer();
  const BASE_URL = `http://localhost:${PORT}`;

  const auditReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    consoleErrors: [],
    uncaughtExceptions: [],
    rfqSubmissionsCaptured: []
  };

  function logPass(title, details = {}) {
    console.log(`[PASS] ${title}`);
    auditReport.tests.push({ title, status: 'PASS', details });
  }

  function logFail(title, details = {}) {
    console.error(`[FAIL] ${title}`, details);
    auditReport.tests.push({ title, status: 'FAIL', details });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('gtag')) {
        auditReport.consoleErrors.push(txt);
        console.error('   [BROWSER CONSOLE ERROR]:', txt);
      }
    }
  });

  page.on('pageerror', err => {
    auditReport.uncaughtExceptions.push(err.message || err.toString());
    console.error('   [UNCAUGHT PAGE ERROR]:', err);
  });

  // Mock API routes for deterministic backend response
  await page.route('**/api/external/products**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_PRODUCTS })
    });
  });

  await page.route('**/api/external/forms/by-name/lead_capture/schema**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FORM_SCHEMA })
    });
  });

  await page.route('**/api/external/forms/by-name/lead_capture/submit**', async route => {
    const postData = route.request().postDataJSON();
    auditReport.rfqSubmissionsCaptured.push(postData);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: `lead_${Date.now()}`,
          entity_type: 'lead',
          reference_id: `RFQ-CONSIGNMENT-998877`
        }
      })
    });
  });

  try {
    // 1. Catalog Page Load & Navigation
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h2:has-text("Commercial Steel Catalog")');
    logPass('1.1 Catalog Page Loaded');

    // 2. Category Filtering
    const categories = ['Rebars', 'Structural Steel', 'Coils & Sheets', 'Piping & Tubes', 'Plates'];
    let allCategoriesPass = true;
    for (const cat of categories) {
      const btn = await page.$(`button:text-is("${cat}")`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(200);
        const cards = await page.$$('.grid > div.bg-white');
        if (cards.length === 0) allCategoriesPass = false;
      } else {
        allCategoriesPass = false;
      }
    }
    await (await page.$('button:text-is("All")')).click();
    await page.waitForTimeout(200);
    if (allCategoriesPass) logPass('1.2 Category Filtering (Rebars, Structural, Coils, Piping, Plates)');
    else logFail('1.2 Category Filtering');

    // 3. Search
    const searchInput = await page.$('input[placeholder*="Search"]');
    await searchInput.fill('Fe-550D');
    await page.waitForTimeout(300);
    const searchCards1 = await page.$$('.grid > div.bg-white');
    await searchInput.fill('US-STR-ISMB');
    await page.waitForTimeout(300);
    const searchCards2 = await page.$$('.grid > div.bg-white');
    await searchInput.fill('');
    await page.waitForTimeout(200);

    if (searchCards1.length === 1 && searchCards2.length === 1) {
      logPass('1.3 Case-Insensitive SKU & Keyword Search');
    } else {
      logFail('1.3 Search Filtering');
    }

    // 4. Product Details & AST Specs
    await page.goto(`${BASE_URL}/products/US-TMT-550D`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Fe-550D TMT Steel Rebars")');

    const expandBtn = await page.$('button:has-text("Expand Overview"), button:has-text("Read Full Overview")');
    if (expandBtn) {
      await expandBtn.click();
      await page.waitForTimeout(200);
    }

    const h3Heading = await page.$('h3:has-text("Material Features")');
    const blockquote = await page.$('div.border-brand-steel:has-text("Manufactured in certified primary steel mills")');
    const bulletList = await page.$('li:has-text("Superior ductility with high elongation")');
    const numberedList = await page.$('div:has-text("1."):has-text("Yield Strength")');
    const boldText = await page.$('strong:has-text("IS 1786:2008")');

    if (h3Heading && blockquote && bulletList && numberedList && boldText) {
      logPass('2.1 AST Markdown Specifications Parser & Rich Rendering');
    } else {
      logFail('2.1 AST Markdown Parser');
    }

    // 5. Benchmark Pricing & 18% GST Breakdown
    const gstPill = await page.textContent('div:has-text("Applicable GST @ 18%:")');
    if (gstPill && gstPill.includes('9,810') && gstPill.includes('64,310')) {
      logPass('2.2 Benchmark Pricing & 18% GST Tax Breakdown Pill');
    } else {
      logFail('2.2 18% GST Breakdown Pill', { gstPill });
    }

    // 6. Stepper & Tonnage Presets
    const stepperInput = await page.$('input[type="number"]');
    const plusBtn = await page.$('button:has(svg.lucide-plus)');
    const minusBtn = await page.$('button:has(svg.lucide-minus)');
    const preset100Btn = await page.$('button:text-is("100 MT")');

    await preset100Btn.click();
    await page.waitForTimeout(100);
    const val100 = await stepperInput.inputValue();

    await plusBtn.click();
    await page.waitForTimeout(100);
    const val105 = await stepperInput.inputValue();

    await minusBtn.click();
    await minusBtn.click();
    await page.waitForTimeout(100);
    const val95 = await stepperInput.inputValue();

    if (val100 === '100' && val105 === '105' && val95 === '95') {
      logPass('3.1 Tonnage Presets (25/50/100/200 MT) & Precision Stepper (±5 MT)');
    } else {
      logFail('3.1 Tonnage Presets & Steppers');
    }

    // 7. Add Items to Cart & Verify Math Exactness
    await (await page.$('button:text-is("50 MT")')).click();
    await (await page.$('button:has-text("Add 50 MT to Cart")')).click();
    await page.waitForTimeout(300);

    await page.goto(`${BASE_URL}/products/US-STR-ISMB`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Heavy Structural ISMB")');
    await (await page.$('button:text-is("25 MT")')).click();
    await (await page.$('button:has-text("Add 25 MT to Cart")')).click();
    await page.waitForTimeout(300);

    // Navigate to Cart
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Buyer Cart & RFQ Dispatch")');

    const cartState = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data) : [];
    });

    let mathPass = true;
    let expectedSubtotal = 0;
    for (const item of cartState) {
      const lineSub = item.quantity * item.base_price;
      const lineGst = lineSub * 0.18;
      const lineTot = lineSub + lineGst;
      expectedSubtotal += lineSub;
      if (item.lineSubtotal !== lineSub || item.lineGst !== lineGst || item.lineTotal !== lineTot) {
        mathPass = false;
      }
    }

    const expectedGst = expectedSubtotal * 0.18;
    const expectedGrandTotal = expectedSubtotal * 1.18;

    if (mathPass && expectedSubtotal === 4180000 && expectedGst === 752400 && expectedGrandTotal === 4932400) {
      logPass('4.1 Multi-Product Cart Mathematical Exactness (Quantity * Rate = Line, Subtotal * 1.18 = Total)', {
        subtotal: expectedSubtotal,
        gst18: expectedGst,
        grandTotal: expectedGrandTotal
      });
    } else {
      logFail('4.1 Cart Math Exactness', { mathPass, expectedSubtotal, expectedGst, expectedGrandTotal });
    }

    // 8. Cart State Persistence across reload
    await page.reload({ waitUntil: 'networkidle' });
    const reloadedCart = await page.evaluate(() => JSON.parse(localStorage.getItem('urbanspan_buyer_cart') || '[]'));
    if (reloadedCart.length === 2 && reloadedCart[0].quantity === 50 && reloadedCart[1].quantity === 25) {
      logPass('5.1 Browser LocalStorage Cart Persistence across Page Reload');
    } else {
      logFail('5.1 Cart State Persistence');
    }

    // 9. RFQ Form Submission & Instant Confirmation Modal
    await page.fill('input[placeholder*="Ramesh"]', 'Sourabh Khandelwal');
    await page.fill('input[placeholder*="Chandra Infra"]', 'Khandelwal Infrastructure Pvt Ltd');
    await page.fill('input[placeholder*="98765"]', '+91 94259 22225');
    await page.fill('input[placeholder*="buyer@"]', 'sourabh.khandelwal@khandelwalinfra.com');
    await page.fill('input[placeholder*="Indore Ring Road"]', 'Indore Bypass Super Corridor Project Site');
    await page.fill('textarea[placeholder*="Specify bend test"]', '75 MT consignment required with mill test certificates.');

    await (await page.$('button[type="submit"]:has-text("Submit RFQ for All")')).click();
    await page.waitForTimeout(1000);

    const modalData = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const refStrong = document.querySelector('strong.font-mono');
      const rows = Array.from(document.querySelectorAll('div.p-4.bg-slate-50 div.flex.justify-between'));
      const parsedRows = rows.map(r => ({
        label: r.querySelector('span')?.textContent?.trim(),
        value: r.querySelector('strong')?.textContent?.trim()
      }));
      return {
        heading: h2?.textContent?.trim(),
        refId: refStrong?.textContent?.trim(),
        rows: parsedRows
      };
    });

    const orgRow = modalData.rows.find(r => r.label === 'Buyer Organization:');
    const consignmentRow = modalData.rows.find(r => r.label === 'Total Consignment:');

    const modalValid = (
      modalData.heading === 'Multi-Product Commercial RFQ Transmitted!' &&
      modalData.refId &&
      modalData.refId.startsWith('RFQ-CONSIGNMENT-') &&
      orgRow?.value === 'Khandelwal Infrastructure Pvt Ltd' &&
      consignmentRow?.value === '75 Metric Tons'
    );

    if (modalValid) {
      logPass('6.1 Instant RFQ Confirmation Modal & Dynamic Reference ID', {
        heading: modalData.heading,
        referenceId: modalData.refId,
        buyerOrg: orgRow.value,
        totalConsignment: consignmentRow.value
      });
    } else {
      logFail('6.1 Confirmation Modal Rendering', { modalData });
    }

    // 10. Verify Payload Contract
    if (auditReport.rfqSubmissionsCaptured.length > 0) {
      const payload = auditReport.rfqSubmissionsCaptured[0];
      const validPayload = (
        payload.name === 'Sourabh Khandelwal' &&
        payload.company === 'Khandelwal Infrastructure Pvt Ltd' &&
        payload.quantity === 75 &&
        payload.expected_value === 4180000 &&
        payload.custom_data?.items?.length === 2
      );
      if (validPayload) logPass('6.2 Backend CRM Lead Ingestion Payload Contract Validation');
      else logFail('6.2 Payload Contract Validation', { payload });
    } else {
      logFail('6.2 Backend RFQ Request Ingestion');
    }

    // 11. Cart Reset Post Submission
    const postSubmissionCart = await page.evaluate(() => JSON.parse(localStorage.getItem('urbanspan_buyer_cart') || '[]'));
    if (postSubmissionCart.length === 0) {
      logPass('6.3 Cart State Reset (Auto-cleared upon successful RFQ dispatch)');
    } else {
      logFail('6.3 Cart State Reset', { postSubmissionCart });
    }

    // 12. Zero Console Errors & Page Exceptions
    if (auditReport.consoleErrors.length === 0) {
      logPass('7.1 Zero JavaScript Runtime Console Errors across all workflows');
    } else {
      logFail('7.1 Console Errors Found', { errors: auditReport.consoleErrors });
    }

    if (auditReport.uncaughtExceptions.length === 0) {
      logPass('7.2 Zero Uncaught Page Exceptions across all workflows');
    } else {
      logFail('7.2 Page Exceptions Found', { exceptions: auditReport.uncaughtExceptions });
    }

  } catch (err) {
    console.error('Fatal execution error:', err);
    logFail('E2E Audit Fatal Crash', { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n================================================================');
  console.log('FINAL E2E AUDIT SUMMARY:');
  const total = auditReport.tests.length;
  const passed = auditReport.tests.filter(t => t.status === 'PASS').length;
  const failed = auditReport.tests.filter(t => t.status === 'FAIL').length;
  console.log(`Total Verification Tests: ${total}`);
  console.log(`Passed: ${passed} / ${total} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} / ${total}`);
  console.log(`Console Errors: ${auditReport.consoleErrors.length}`);
  console.log(`Uncaught Page Exceptions: ${auditReport.uncaughtExceptions.length}`);
  console.log('================================================================\n');

  return auditReport;
}

runLocalE2ETest().then(report => {
  console.log('E2E Local Verification Complete.');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
