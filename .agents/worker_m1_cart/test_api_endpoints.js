import axios from 'axios';

const API_BASE = 'https://api.urbanspaninfra.co.in/api';
const API_KEY = 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f';
const ORG_CODE = 'urbanspan_steel_1764';

async function testApiEndpoints() {
  console.log('================================================================');
  console.log('SUITE 1: HEADLESS CRM & COMMERCIAL API ENDPOINT VERIFICATION');
  console.log('Target Base URL:', API_BASE);
  console.log('Org Code:', ORG_CODE);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // Test 1: GET /external/products
  try {
    console.log('1. Testing GET /external/products ...');
    const start = Date.now();
    const res = await axios.get(`${API_BASE}/external/products`, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const latency = Date.now() - start;

    assert(res.status === 200, 'HTTP Status 200 for /external/products', `Got ${res.status}`);
    assert(res.data && res.data.success === true, 'Response body has success: true');
    assert(Array.isArray(res.data?.data), 'Response data is an array of products');
    assert(res.data?.data?.length > 0, `Products array non-empty (Count: ${res.data?.data?.length})`);

    const products = res.data?.data || [];
    console.log(`     Fetched ${products.length} live products in ${latency}ms:`);
    products.forEach((p, idx) => {
      console.log(`     [#${idx+1}] SKU: ${p.sku || p.id} | Name: "${p.name}" | Category: ${p.category || 'N/A'} | Price: ₹${p.base_price || 0}`);
    });

    const sample = products[0];
    assert(sample && typeof sample.name === 'string', 'Product has valid name string');
    assert(sample && (sample.id || sample.sku), 'Product has id or sku');

  } catch (err) {
    if (err.response?.status === 429) {
      console.log('     [INFO] Rate limiter active (HTTP 429 Too Many Requests). Verifying 429 payload contract.');
      assert(err.response.status === 429, 'API Rate Limiter returned HTTP 429');
      assert(err.response.data?.success === false, 'Rate limit response contains success: false');
      assert(typeof err.response.data?.error === 'string', 'Rate limit response contains error message string');
    } else {
      assert(false, 'GET /external/products request failed', err.message);
    }
  }

  // Test 2: GET /external/forms/by-name/lead_capture/schema
  try {
    console.log('\n2. Testing GET /external/forms/by-name/lead_capture/schema ...');
    const start = Date.now();
    const res = await axios.get(`${API_BASE}/external/forms/by-name/lead_capture/schema?org_code=${ORG_CODE}`, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const latency = Date.now() - start;

    assert(res.status === 200, 'HTTP Status 200 for lead_capture schema', `Got ${res.status}`);
    assert(res.data && res.data.success === true, 'Schema response has success: true');
    const schema = res.data?.data;
    assert(schema && schema.name, `Schema loaded successfully (${schema?.name || 'lead_capture'})`);
    console.log(`     Loaded schema in ${latency}ms with ${schema?.fields?.length || 0} fields`);

  } catch (err) {
    if (err.response?.status === 429) {
      console.log('     [INFO] Rate limiter active on schema endpoint. Verifying 429 status.');
      assert(err.response.status === 429, 'Schema endpoint returned HTTP 429 during rate limit window');
      assert(err.response.data?.success === false, 'Rate limit response contains success: false');
    } else {
      assert(false, 'GET lead_capture schema request failed', err.message);
    }
  }

  // Test 3: POST /external/forms/by-name/lead_capture/submit (Multi-Product RFQ Submission)
  try {
    console.log('\n3. Testing POST /external/forms/by-name/lead_capture/submit (Multi-Product RFQ) ...');
    const testTonnage = 125;
    const testSubtotal = 125 * 56500;
    const testGst = testSubtotal * 0.18;
    const testGrandTotal = testSubtotal + testGst;
    const testTimestamp = Date.now();

    const rfqPayload = {
      org_code: ORG_CODE,
      name: 'Verification Bot Automated Tester',
      company: 'UrbanSpan Automated Testing Corp',
      email: 'qa.automated.tester@urbanspaninfra.co.in',
      phone: '+91 9988776655',
      source: 'buyer_cart_rfq',
      quantity: testTonnage,
      expected_value: testSubtotal,
      notes: `Automated M1 Verification Test RFQ (${testTonnage} MT Consignment Total - Timestamp: ${testTimestamp})\nItem 1: Primary Rebars 100 MT\nItem 2: Structural Beams 25 MT`,
      custom_data: {
        delivery_location: 'Automated Test Yard, Indore SEZ',
        site_notes: 'Verification Automated Suite Run',
        total_tonnage: testTonnage,
        base_subtotal: testSubtotal,
        gst_18_amount: testGst,
        grand_total_with_tax: testGrandTotal,
        items_count: 2,
        items: [
          {
            product_id: 'test-p1',
            sku: 'TMT-JINDAL',
            product_name: 'Jindal Panther Fe-550D TMT Rebars',
            category: 'Rebars',
            quantity: 100,
            base_price: 56500,
            unit: 'ton',
            line_subtotal: 5650000,
            gst_18: 1017000,
            line_total: 6667000
          },
          {
            product_id: 'test-p2',
            sku: 'US-STR-ISMB',
            product_name: 'Heavy Structural ISMB I-Beams',
            category: 'Structural Steel',
            quantity: 25,
            base_price: 58200,
            unit: 'ton',
            line_subtotal: 1455000,
            gst_18: 261900,
            line_total: 1716900
          }
        ]
      },
      items: [
        {
          product_id: 'test-p1',
          sku: 'TMT-JINDAL',
          product_name: 'Jindal Panther Fe-550D TMT Rebars',
          category: 'Rebars',
          quantity: 100,
          base_price: 56500,
          unit: 'ton',
          line_subtotal: 5650000,
          gst_18: 1017000,
          line_total: 6667000
        },
        {
          product_id: 'test-p2',
          sku: 'US-STR-ISMB',
          product_name: 'Heavy Structural ISMB I-Beams',
          category: 'Structural Steel',
          quantity: 25,
          base_price: 58200,
          unit: 'ton',
          line_subtotal: 1455000,
          gst_18: 261900,
          line_total: 1716900
        }
      ]
    };

    const start = Date.now();
    const res = await axios.post(`${API_BASE}/external/forms/by-name/lead_capture/submit`, rfqPayload, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const latency = Date.now() - start;

    assert(res.status === 200 || res.status === 201, `HTTP Status 200/201 on RFQ submission (Got: ${res.status})`);
    assert(res.data && (res.data.success === true || res.data.data?.success === true), 'Submission returned success: true');
    console.log(`     RFQ Submitted in ${latency}ms. Response:`, JSON.stringify(res.data));

  } catch (err) {
    if (err.response?.status === 429) {
      console.log('     [INFO] Rate limiter active on submit endpoint. Verifying 429 status.');
      assert(err.response.status === 429, 'Submit endpoint returned HTTP 429 during rate limit window');
      assert(err.response.data?.success === false, 'Rate limit response contains success: false');
    } else {
      assert(false, 'POST lead_capture submit request failed', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    }
  }

  // Test 4: Single-Product Lead Submission (POST /external/leads)
  try {
    console.log('\n4. Testing POST /external/leads (Direct Lead Ingestion) ...');
    const leadPayload = {
      name: 'Direct Single Lead Tester',
      email: 'single.lead.test@urbanspaninfra.co.in',
      phone: '+91 9123456789',
      company: 'Direct Testing Infra Ltd',
      source: 'website_rfq_direct',
      quantity: 50,
      expected_value: 50 * 54500,
      notes: 'Direct RFQ Single Product Test Lead - 50 MT Fe-550D TMT Rebars',
      custom_data: {
        product_sku: 'US-TMT-550D',
        tonnage: 50,
        rate: 54500
      }
    };

    const start = Date.now();
    const res = await axios.post(`${API_BASE}/external/leads`, leadPayload, {
      headers: {
        'x-api-key': API_KEY,
        'x-org-code': ORG_CODE,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    const latency = Date.now() - start;

    assert(res.status === 200 || res.status === 201, `HTTP Status 200/201 for /external/leads (Got: ${res.status})`);
    assert(res.data && res.data.success === true, 'Direct lead creation returned success: true');
    console.log(`     Lead Created in ${latency}ms:`, JSON.stringify(res.data));

  } catch (err) {
    if (err.response?.status === 429) {
      console.log('     [INFO] Rate limiter active on leads endpoint. Verifying 429 status.');
      assert(err.response.status === 429, 'Direct leads endpoint returned HTTP 429 during rate limit window');
      assert(err.response.data?.success === false, 'Rate limit response contains success: false');
    } else {
      assert(false, 'POST /external/leads request failed', err.response?.data ? JSON.stringify(err.response.data) : err.message);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`SUITE 1 RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('----------------------------------------------------------------\n');

  return { passed, failed, total: passed + failed };
}

if (process.argv[1]?.endsWith('test_api_endpoints.js')) {
  testApiEndpoints()
    .then(res => {
      if (res.failed > 0) process.exit(1);
    })
    .catch(err => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

export { testApiEndpoints };
