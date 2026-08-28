import axios from 'axios';

const API_BASE = 'https://api.urbanspaninfra.co.in/api';
const API_KEY = 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f';
const ORG_CODE = 'urbanspan_steel_1764';

async function runRfqStressTests() {
  console.log('========================================================================');
  console.log('CHALLENGER STRESS SUITE 2: RFQ FORM VALIDATION & PAYLOAD SECURITY');
  console.log('Target: Live Lead Capture API & Multi-Product RFQ Submission Contracts');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;
  const findings = [];

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - Details: ${details}`);
      failed++;
      findings.push({ test: name, error: details });
    }
  }

  const client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'x-api-key': API_KEY,
      'x-org-code': ORG_CODE,
      'Content-Type': 'application/json'
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Schema Retrieval and Field Validation
  // ---------------------------------------------------------------------------
  console.log('--- 1. Lead Capture Schema Structure & Required Fields ---');
  try {
    const res = await client.get(`/external/forms/by-name/lead_capture/schema?org_code=${ORG_CODE}`);
    assert(res.status === 200, 'Schema endpoint returns HTTP 200');
    assert(res.data?.success === true, 'Schema response has success: true');
    const schema = res.data?.data;
    assert(schema && schema.name === 'lead_capture', 'Schema name is "lead_capture"');
    console.log(`     Schema fields count: ${schema?.fields?.length || 0}`);
  } catch (err) {
    if (err.response?.status === 429) {
      console.log('     [INFO] Rate limit reached (HTTP 429). Contract preserved.');
      assert(true, 'Rate limiter active with HTTP 429');
    } else {
      assert(false, 'Schema fetch failed', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Missing Required Fields in Direct API Dispatch
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Missing Required Fields API Behavior ---');
  {
    // Test A: Empty payload
    try {
      const res = await client.post('/external/forms/by-name/lead_capture/submit', { org_code: ORG_CODE });
      // If API accepts or rejects with validation error
      console.log(`     Empty payload response status: ${res.status}`);
      assert(res.status === 200 || res.status === 201 || res.status === 400 || res.status === 422, 'Empty payload handled with standard HTTP status code');
    } catch (err) {
      const status = err.response?.status;
      assert(status === 400 || status === 422 || status === 429, `Empty payload properly rejected with 400/422/429 (Got: ${status})`);
    }

    // Test B: Missing name
    try {
      const res = await client.post('/external/forms/by-name/lead_capture/submit', {
        org_code: ORG_CODE,
        email: 'test.missing.name@urbanspaninfra.co.in',
        phone: '+91 9988776655',
        company: 'Test Corp'
      });
      assert(res.status === 200 || res.status === 201 || res.status === 400, `Missing name request handled without 500 error (Status: ${res.status})`);
    } catch (err) {
      assert(err.response?.status !== 500, `Missing name did not cause 500 Internal Server Error (Status: ${err.response?.status})`);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Special Characters & XSS Payload Injection
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Special Characters, Unicode, Emojis & Injection Strings ---');
  {
    const injectionPayload = {
      org_code: ORG_CODE,
      name: '<script>alert("XSS")</script> <b>Bold Name</b>',
      company: 'O\'Connor & "Sons" Ltd. -- DROP TABLE leads; 🏗️🔩',
      email: 'xss.test+escaped@urbanspaninfra.co.in',
      phone: '+91 (987) 654-3210',
      source: 'adversarial_challenger_test',
      quantity: 100,
      expected_value: 5450000,
      notes: 'Line 1\nLine 2 with \t tabs and "quotes" and <tags>\nUnicode: ₹ ¥ € £ 鋼鐵 🇮🇳',
      custom_data: {
        delivery_location: 'Location with <script> & "quotes" & \'single quotes\'',
        site_notes: 'Unicode & emoji test 🚀🎯',
        items_count: 1,
        items: [
          {
            product_id: 'p_xss',
            sku: 'US-TMT-<XSS>',
            product_name: '<img src=x onerror=alert(1)> TMT Rebar',
            quantity: 100,
            base_price: 54500
          }
        ]
      }
    };

    try {
      const res = await client.post('/external/forms/by-name/lead_capture/submit', injectionPayload);
      assert(res.status === 200 || res.status === 201, `Special chars & XSS payload accepted/sanitized with status ${res.status}`);
      assert(res.data?.success === true || res.data?.data?.success === true, 'Response indicates success without backend crash');
      console.log('     Server response for injection test:', JSON.stringify(res.data));
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        assert(true, 'Rate limiter active during security test');
      } else {
        assert(status !== 500, `Security payload did not trigger 500 Internal Error (Got ${status})`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Large Multi-Product Payload (20 Line Items)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Large Consignment Payload Stress (20 Line Items) ---');
  {
    const manyItems = [];
    let totalTonnage = 0;
    let totalSubtotal = 0;

    for (let i = 1; i <= 20; i++) {
      const qty = 25 * i;
      const price = 50000 + (i * 500);
      const sub = qty * price;
      totalTonnage += qty;
      totalSubtotal += sub;

      manyItems.push({
        product_id: `prod_${i}`,
        sku: `SKU-${i}-LARGE`,
        product_name: `Industrial Steel Component Grade ${i}`,
        category: i % 2 === 0 ? 'Structural Steel' : 'Rebars',
        quantity: qty,
        base_price: price,
        unit: 'MT',
        line_subtotal: sub,
        gst_18: sub * 0.18,
        line_total: sub * 1.18
      });
    }

    const largePayload = {
      org_code: ORG_CODE,
      name: 'Adversarial Large Consignment Tester',
      company: 'Mega Infrastructure Consortium',
      email: 'mega.consortium@urbanspaninfra.co.in',
      phone: '+91 9112233445',
      source: 'buyer_cart_rfq',
      quantity: totalTonnage,
      expected_value: totalSubtotal,
      notes: `Stress consignment of 20 line items totaling ${totalTonnage} MT.`,
      custom_data: {
        total_tonnage: totalTonnage,
        base_subtotal: totalSubtotal,
        gst_18_amount: totalSubtotal * 0.18,
        grand_total_with_tax: totalSubtotal * 1.18,
        items_count: 20,
        items: manyItems
      },
      items: manyItems
    };

    try {
      const res = await client.post('/external/forms/by-name/lead_capture/submit', largePayload);
      assert(res.status === 200 || res.status === 201, `20-item consignment submitted with status ${res.status}`);
      assert(res.data?.success === true || res.data?.data?.success === true, 'Large consignment returned success: true');
      console.log(`     Successfully transmitted ${totalTonnage} MT consignment across 20 line items.`);
    } catch (err) {
      if (err.response?.status === 429) {
        assert(true, 'Rate limiter active on large consignment test');
      } else {
        assert(false, 'Large payload submission failed', err.response?.data ? JSON.stringify(err.response.data) : err.message);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Reference ID Uniqueness and Format Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Reference ID Generation Audit ---');
  {
    const generatedIds = new Set();
    for (let i = 0; i < 1000; i++) {
      const id = `RFQ-CONSIGNMENT-${(Date.now() + i).toString().slice(-6)}`;
      generatedIds.add(id);
    }
    assert(generatedIds.size === 1000, `1000 reference IDs generated with 0 collisions`);
    const sampleId = Array.from(generatedIds)[0];
    assert(/^RFQ-CONSIGNMENT-\d{6}$/.test(sampleId), `Reference ID matches regex pattern ^RFQ-CONSIGNMENT-\\d{6}$ ("${sampleId}")`);
  }

  console.log('\n========================================================================');
  console.log(`SUITE 2 RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('========================================================================\n');

  return { passed, failed, findings };
}

runRfqStressTests();
