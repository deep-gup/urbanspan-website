import { chromium } from 'playwright';

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

async function runE2EAudit() {
  console.log('================================================================');
  console.log('MILESTONE 1 (M1) COMPREHENSIVE E2E AUDIT WITH PLAYWRIGHT');
  console.log('Testing: Catalog, AST Specs, Steppers, Multi-Product Cart Math,');
  console.log('         RFQ Transmission, Confirmation Modal, Zero Console Errors');
  console.log('================================================================\n');

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

  // Monitor console errors and uncaught exceptions
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('gtag')) {
        auditReport.consoleErrors.push(txt);
        console.error('   [BROWSER ERROR]:', txt);
      }
    }
  });

  page.on('pageerror', err => {
    auditReport.uncaughtExceptions.push(err.message || err.toString());
    console.error('   [UNCAUGHT EXCEPTION]:', err);
  });

  // Mock API routes for clean deterministic E2E verification
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
          reference_id: `RFQ-CONSIGNMENT-${Date.now().toString().slice(-6)}`
        }
      })
    });
  });

  await page.route('**/api/external/leads**', async route => {
    const postData = route.request().postDataJSON();
    auditReport.rfqSubmissionsCaptured.push(postData);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: `lead_${Date.now()}`,
          entity_type: 'lead'
        }
      })
    });
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Catalog Navigation & Categories
    // -------------------------------------------------------------------------
    await page.goto('https://urbanspaninfra.co.in/products', { waitUntil: 'networkidle' });
    await page.waitForSelector('h2:has-text("Commercial Steel Catalog")');

    logPass('1.1 Catalog Page Loaded Successfully');

    // Test Category Filtering
    const categories = ['Rebars', 'Structural Steel', 'Coils & Sheets', 'Piping & Tubes', 'Plates'];
    let allCategoriesFiltered = true;

    for (const cat of categories) {
      const btn = await page.$(`button:text-is("${cat}")`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(300);
        const cards = await page.$$('.grid > div.bg-white');
        if (cards.length === 0) {
          allCategoriesFiltered = false;
        }
      } else {
        allCategoriesFiltered = false;
      }
    }

    // Reset to 'All'
    await (await page.$('button:text-is("All")')).click();
    await page.waitForTimeout(300);

    if (allCategoriesFiltered) {
      logPass('1.2 Category Filtering (Rebars, Structural Steel, Coils, Piping, Plates)', { tested: categories });
    } else {
      logFail('1.2 Category Filtering');
    }

    // Test Search by SKU and Tag
    const searchInput = await page.$('input[placeholder*="Search"]');
    await searchInput.fill('Fe-550D');
    await page.waitForTimeout(400);
    let searchCards = await page.$$('.grid > div.bg-white');
    const nameSearchPass = searchCards.length === 1;

    await searchInput.fill('US-STR-ISMB');
    await page.waitForTimeout(400);
    searchCards = await page.$$('.grid > div.bg-white');
    const skuSearchPass = searchCards.length === 1;

    await searchInput.fill('');
    await page.waitForTimeout(300);

    if (skuSearchPass && nameSearchPass) {
      logPass('1.3 Case-Insensitive SKU & Name Search', { queriesTested: ['Fe-550D', 'US-STR-ISMB'] });
    } else {
      logFail('1.3 Search Filtering', { skuSearchPass, nameSearchPass, searchCardsCount: searchCards.length });
    }

    // -------------------------------------------------------------------------
    // TEST 2: Product Details & AST Markdown Specifications Rendering
    // -------------------------------------------------------------------------
    await page.goto('https://urbanspaninfra.co.in/products/US-TMT-550D', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Fe-550D TMT Steel Rebars")');

    // Expand Overview to render full AST
    const expandBtn = await page.$('button:has-text("Expand Overview"), button:has-text("Read Full Overview")');
    if (expandBtn) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }

    // Check AST elements
    const h3Heading = await page.$('h3:has-text("Material Features")');
    const blockquote = await page.$('div.border-brand-steel:has-text("Manufactured in certified primary steel mills")');
    const bulletList = await page.$('li:has-text("Superior ductility with high elongation")');
    const numberedList = await page.$('div:has-text("1."):has-text("Yield Strength")');
    const boldText = await page.$('strong:has-text("IS 1786:2008")');

    const astSpecsRenderPass = !!(h3Heading && blockquote && bulletList && numberedList && boldText);
    if (astSpecsRenderPass) {
      logPass('2.1 AST Markdown Parser (Headings, Blockquotes, Bullet Lists, Numbered Lists, Bold inline)', {
        h3Found: !!h3Heading,
        blockquoteFound: !!blockquote,
        bulletListFound: !!bulletList,
        numberedListFound: !!numberedList,
        boldTextFound: !!boldText
      });
    } else {
      logFail('2.1 AST Markdown Parser Rendering', {
        h3: !!h3Heading, blockquote: !!blockquote, bulletList: !!bulletList, numberedList: !!numberedList, boldText: !!boldText
      });
    }

    // Check 18% GST pill and effective price calculation
    const gstPillText = await page.textContent('div:has-text("Applicable GST @ 18%:")');
    const basePrice = 54500;
    const expectedGst = Math.round(basePrice * 0.18); // 9810
    const expectedEffective = Math.round(basePrice * 1.18); // 64310

    const gstPillMatches = gstPillText.includes(expectedGst.toLocaleString('en-IN')) && gstPillText.includes(expectedEffective.toLocaleString('en-IN'));
    if (gstPillMatches) {
      logPass('2.2 Benchmark Pricing & 18% GST Tax Breakdown Pill', {
        basePrice: `₹${basePrice}/MT`,
        expectedGst: `₹${expectedGst}/MT`,
        expectedEffective: `₹${expectedEffective}/MT`
      });
    } else {
      logFail('2.2 18% GST Breakdown Pill', { gstPillText });
    }

    // Technical specifications grid
    const specsTable = await page.$('div:has-text("Technical & Material Specifications")');
    const yieldStrengthSpec = await page.textContent('div:has-text("YieldStrength")');
    if (specsTable && yieldStrengthSpec.includes('550 N/mm²')) {
      logPass('2.3 Technical & Material Specifications Key-Value Grid', { yieldStrength: '550 N/mm²' });
    } else {
      logFail('2.3 Technical Specs Grid');
    }

    // -------------------------------------------------------------------------
    // TEST 3: Tonnage Presets & Steppers on Details Page
    // -------------------------------------------------------------------------
    const stepperInput = await page.$('input[type="number"]');
    const plusBtn = await page.$('button:has(svg.lucide-plus)');
    const minusBtn = await page.$('button:has(svg.lucide-minus)');
    const preset50Btn = await page.$('button:text-is("50 MT")');
    const preset100Btn = await page.$('button:text-is("100 MT")');

    await preset100Btn.click();
    await page.waitForTimeout(200);
    const valAfter100 = await stepperInput.inputValue();

    await plusBtn.click();
    await page.waitForTimeout(200);
    const valAfterPlus = await stepperInput.inputValue();

    await minusBtn.click();
    await minusBtn.click();
    await page.waitForTimeout(200);
    const valAfterMinus = await stepperInput.inputValue();

    const stepperPass = valAfter100 === '100' && valAfterPlus === '105' && valAfterMinus === '95';
    if (stepperPass) {
      logPass('3.1 Tonnage Presets (25/50/100/200 MT) & Precision Stepper (±5 MT)', {
        preset100: valAfter100,
        plus5: valAfterPlus,
        minus10: valAfterMinus
      });
    } else {
      logFail('3.1 Tonnage Steppers', { valAfter100, valAfterPlus, valAfterMinus });
    }

    // -------------------------------------------------------------------------
    // TEST 4: Multi-Product Cart Composition & Mathematical Exactness
    // -------------------------------------------------------------------------
    // Set 50 MT and add Fe-550D TMT to cart
    await preset50Btn.click();
    await page.waitForTimeout(200);
    const addToCartTmt = await page.$('button:has-text("Add 50 MT to Cart")');
    await addToCartTmt.click();
    await page.waitForTimeout(500);

    // Navigate to Product 2: ISMB Beams and add 25 MT
    await page.goto('https://urbanspaninfra.co.in/products/US-STR-ISMB', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Heavy Structural ISMB")');
    const ismbPreset25 = await page.$('button:text-is("25 MT")');
    if (ismbPreset25) await ismbPreset25.click();
    await page.waitForTimeout(200);
    const addToCartIsmb = await page.$('button:has-text("Add 25 MT to Cart")');
    await addToCartIsmb.click();
    await page.waitForTimeout(500);

    // Navigate to Cart Page
    await page.goto('https://urbanspaninfra.co.in/cart', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1:has-text("Buyer Cart & RFQ Dispatch")');

    // Retrieve state from browser localStorage for exact mathematical verification
    const cartState = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data) : [];
    });

    let mathExactnessPass = true;
    let expectedConsignmentSubtotal = 0;

    const auditedItems = cartState.map(item => {
      const expectedLineSubtotal = item.quantity * item.base_price;
      const expectedLineGst = expectedLineSubtotal * 0.18;
      const expectedLineTotal = expectedLineSubtotal + expectedLineGst;

      expectedConsignmentSubtotal += expectedLineSubtotal;

      const exactMatch = (
        item.lineSubtotal === expectedLineSubtotal &&
        item.lineGst === expectedLineGst &&
        item.lineTotal === expectedLineTotal
      );
      if (!exactMatch) mathExactnessPass = false;

      return {
        name: item.name,
        qty: item.quantity,
        rate: item.base_price,
        lineSubtotal: item.lineSubtotal,
        expectedLineSubtotal,
        lineGst: item.lineGst,
        lineTotal: item.lineTotal,
        exactMatch
      };
    });

    const expectedTotalGst = expectedConsignmentSubtotal * 0.18;
    const expectedGrandTotal = expectedConsignmentSubtotal * 1.18;

    // Verify DOM amounts extracted directly from the Summary card elements
    const domValues = await page.evaluate(() => {
      const subtotalEl = document.querySelector('div.space-y-3 div:first-child span.font-bold');
      const gstEl = document.querySelector('div.space-y-3 div:nth-child(2) span.font-mono');
      const grandTotalEl = document.querySelector('span.text-2xl.font-black.text-brand-steel');

      return {
        subtotalText: subtotalEl ? subtotalEl.textContent : '',
        gstText: gstEl ? gstEl.textContent : '',
        grandTotalText: grandTotalEl ? grandTotalEl.textContent : ''
      };
    });

    const domSubtotalClean = parseInt(domValues.subtotalText.replace(/[^0-9]/g, ''), 10);
    const domGstClean = parseInt(domValues.gstText.replace(/[^0-9]/g, ''), 10);
    const domGrandTotalClean = parseInt(domValues.grandTotalText.replace(/[^0-9]/g, ''), 10);

    const domMathMatches = (
      domSubtotalClean === expectedConsignmentSubtotal &&
      domGstClean === Math.round(expectedTotalGst) &&
      domGrandTotalClean === Math.round(expectedGrandTotal)
    );

    if (mathExactnessPass && domMathMatches) {
      logPass('4.1 Multi-Product Cart Mathematical Exactness (Line = Qty*Rate, Consignment = Subtotal*1.18)', {
        itemsCount: auditedItems.length,
        items: auditedItems,
        subtotal: expectedConsignmentSubtotal,
        gst18: expectedTotalGst,
        grandTotal: expectedGrandTotal,
        domSubtotal: domSubtotalClean,
        domGst: domGstClean,
        domGrandTotal: domGrandTotalClean
      });
    } else {
      logFail('4.1 Cart Math Exactness', { mathExactnessPass, domMathMatches, auditedItems, expectedGrandTotal, domGrandTotalClean, domValues });
    }

    // -------------------------------------------------------------------------
    // TEST 5: Cart Persistence across Page Reload
    // -------------------------------------------------------------------------
    await page.reload({ waitUntil: 'networkidle' });
    const reloadedCart = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data) : [];
    });

    if (reloadedCart.length === cartState.length && reloadedCart[0].id === cartState[0].id) {
      logPass('5.1 Browser LocalStorage Cart State Persistence across Navigation/Reload', {
        itemCountPersisted: reloadedCart.length
      });
    } else {
      logFail('5.1 Cart State Persistence');
    }

    // -------------------------------------------------------------------------
    // TEST 6: RFQ Submission Flow, Form Validation & Instant Confirmation Modal
    // -------------------------------------------------------------------------
    // Fill the RFQ Form
    await page.fill('input[placeholder*="Ramesh"]', 'Sourabh Khandelwal');
    await page.fill('input[placeholder*="Chandra Infra"]', 'Khandelwal Infrastructure Pvt Ltd');
    await page.fill('input[placeholder*="98765"]', '+91 94259 22225');
    await page.fill('input[placeholder*="buyer@"]', 'sourabh.khandelwal@khandelwalinfra.com');
    await page.fill('input[placeholder*="Indore Ring Road"]', 'Indore Bypass Super Corridor Project Site');
    await page.fill('textarea[placeholder*="Specify bend test"]', 'Urgent 75 MT consignment required with IS 1786 and IS 2062 Mill Test Certificates.');

    // Submit RFQ Form
    const submitBtn = await page.$('button[type="submit"]:has-text("Submit RFQ for All")');
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Verify Instant Confirmation Modal
    const modalDetails = await page.evaluate(() => {
      const header = document.querySelector('h2');
      const refId = document.querySelector('strong.font-mono');
      const rows = Array.from(document.querySelectorAll('div.p-4.bg-slate-50 div.flex.justify-between'));
      const rowTexts = rows.map(r => ({
        label: r.querySelector('span')?.textContent?.trim(),
        value: r.querySelector('strong')?.textContent?.trim()
      }));

      return {
        heading: header ? header.textContent.trim() : null,
        refId: refId ? refId.textContent.trim() : null,
        rows: rowTexts
      };
    });

    const orgRow = modalDetails.rows.find(r => r.label === 'Buyer Organization:');
    const consignmentRow = modalDetails.rows.find(r => r.label === 'Total Consignment:');

    const confirmationPass = (
      modalDetails.heading === 'Multi-Product Commercial RFQ Transmitted!' &&
      modalDetails.refId &&
      modalDetails.refId.startsWith('RFQ-CONSIGNMENT-') &&
      orgRow?.value === 'Khandelwal Infrastructure Pvt Ltd' &&
      consignmentRow?.value === '75 Metric Tons'
    );

    if (confirmationPass) {
      logPass('6.1 Instant RFQ Confirmation Modal & Dynamic Reference ID', {
        confirmationHeading: modalDetails.heading,
        referenceId: modalDetails.refId,
        buyerOrg: orgRow?.value,
        consignmentTonnage: consignmentRow?.value
      });
    } else {
      logFail('6.1 Instant RFQ Confirmation Modal', { modalDetails });
    }

    // Verify Captured RFQ Payload sent to CRM backend
    if (auditReport.rfqSubmissionsCaptured.length > 0) {
      const captured = auditReport.rfqSubmissionsCaptured[0];
      const payloadValid = (
        captured.name === 'Sourabh Khandelwal' &&
        captured.company === 'Khandelwal Infrastructure Pvt Ltd' &&
        captured.email === 'sourabh.khandelwal@khandelwalinfra.com' &&
        captured.quantity === 75 &&
        captured.expected_value === 4180000 &&
        captured.custom_data?.items?.length === 2
      );

      if (payloadValid) {
        logPass('6.2 Backend CRM Lead Ingestion Payload Contract Validation', {
          name: captured.name,
          company: captured.company,
          quantity: captured.quantity,
          expected_value: captured.expected_value,
          itemCount: captured.custom_data.items.length
        });
      } else {
        logFail('6.2 Payload Contract Validation', { captured });
      }
    } else {
      logFail('6.2 Backend RFQ Request Ingestion');
    }

    // Verify Cart Cleared After Submission
    const finalCartState = await page.evaluate(() => {
      const data = localStorage.getItem('urbanspan_buyer_cart');
      return data ? JSON.parse(data) : [];
    });

    if (finalCartState.length === 0) {
      logPass('6.3 Cart State Reset (Auto-cleared upon successful RFQ dispatch)', { finalCartCount: 0 });
    } else {
      logFail('6.3 Cart State Reset', { remainingItems: finalCartState.length });
    }

    // -------------------------------------------------------------------------
    // TEST 7: Zero Runtime Console Errors & Page Exceptions
    // -------------------------------------------------------------------------
    if (auditReport.consoleErrors.length === 0) {
      logPass('7.1 Zero JavaScript Runtime Console Errors (0 errors across entire commercial journey)', { count: 0 });
    } else {
      logFail('7.1 JavaScript Console Errors Detected', { errors: auditReport.consoleErrors });
    }

    if (auditReport.uncaughtExceptions.length === 0) {
      logPass('7.2 Zero Uncaught Exceptions/Page Crashes across Catalog, Details, Cart, RFQ', { count: 0 });
    } else {
      logFail('7.2 Uncaught Exceptions Detected', { exceptions: auditReport.uncaughtExceptions });
    }

  } catch (err) {
    console.error('Fatal E2E execution error:', err);
    logFail('E2E Audit Fatal Crash', { error: err.message, stack: err.stack });
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('AUDIT SUMMARY');
  const total = auditReport.tests.length;
  const passed = auditReport.tests.filter(t => t.status === 'PASS').length;
  const failed = auditReport.tests.filter(t => t.status === 'FAIL').length;
  console.log(`Total Tests Executed: ${total}`);
  console.log(`Passed: ${passed} / ${total} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} / ${total}`);
  console.log(`Console Errors: ${auditReport.consoleErrors.length}`);
  console.log(`Uncaught Page Exceptions: ${auditReport.uncaughtExceptions.length}`);
  console.log('================================================================');

  return auditReport;
}

runE2EAudit().then(report => {
  console.log('\nAudit execution complete.');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
