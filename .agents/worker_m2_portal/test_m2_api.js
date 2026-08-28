/**
 * test_m2_api.js
 * Automated Backend API Verification Suite for Milestone M2:
 * R2 Customer Self-Service Portal & Live Dispatch Tracker (/portal)
 */

import axios from 'axios';

const API_BASE = 'https://api.urbanspaninfra.co.in';
const API_KEY = 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f';
const ORG_CODE = 'urbanspan_steel_1764';

const TEST_CREDENTIALS = {
  email: 'sourabh.khandelwal@khandelwalinfra.com',
  password: 'Password123!'
};

const INVALID_CREDENTIALS = {
  email: 'sourabh.invalid@khandelwalinfra.com',
  password: 'WrongPassword999!'
};

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, message, details = null) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  ✅ PASS: ${message}`);
    results.tests.push({ status: 'PASS', message, details });
  } else {
    results.failed++;
    console.error(`  ❌ FAIL: ${message}`, details || '');
    results.tests.push({ status: 'FAIL', message, details });
  }
}

async function runApiVerification() {
  console.log('================================================================');
  console.log('🚀 RUNNING M2 BACKEND API VERIFICATION SUITE');
  console.log(`Target API Host: ${API_BASE}`);
  console.log(`Org Code: ${ORG_CODE}`);
  console.log('================================================================\n');

  let authToken = null;
  let customerData = null;

  // -------------------------------------------------------------
  // Test Suite 1: Customer Authentication & Token Handling
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Customer Authentication & Token Handling ---');

  // Test 1.1: Negative Login with Invalid Credentials
  try {
    const invalidRes = await axios.post(
      `${API_BASE}/api/external/customers/login`,
      { org_code: ORG_CODE, ...INVALID_CREDENTIALS },
      { headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'x-org-code': ORG_CODE }, validateStatus: () => true }
    );
    assert(
      invalidRes.status === 401 || invalidRes.status === 400 || (invalidRes.data && invalidRes.data.success === false),
      `Negative login rejects invalid credentials with status ${invalidRes.status}`,
      { status: invalidRes.status, responseData: invalidRes.data }
    );
  } catch (err) {
    assert(false, `Negative login threw unexpected network error: ${err.message}`);
  }

  // Test 1.2: Positive Login with Verified Buyer Credentials
  try {
    const loginRes = await axios.post(
      `${API_BASE}/api/external/customers/login`,
      { org_code: ORG_CODE, ...TEST_CREDENTIALS },
      { headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'x-org-code': ORG_CODE } }
    );

    assert(loginRes.status === 200, `Positive login returns HTTP 200 OK`);
    const payload = loginRes.data?.data || loginRes.data;
    customerData = payload?.customer;
    authToken = payload?.token;

    assert(Boolean(authToken && typeof authToken === 'string' && authToken.split('.').length === 3), `Valid JWT token received in response`);
    assert(Boolean(customerData), `Customer profile object present in response`);
    assert(customerData?.email === TEST_CREDENTIALS.email, `Customer email matches: ${customerData?.email}`);
    assert(customerData?.name === 'Sourabh Khandelwal', `Customer name matches: ${customerData?.name}`);
    assert(customerData?.company === 'Khandelwal Infra Developers', `Customer company matches: ${customerData?.company}`);
    assert(Boolean(customerData?.party_id), `Customer party_id linked: ${customerData?.party_id}`);

    // Parse JWT token payload
    const [headerB64, payloadB64] = authToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    assert(
      Boolean(decodedPayload && (decodedPayload.customer_id || decodedPayload.party_id || decodedPayload.id)),
      `JWT payload contains valid claims (customer_id: ${decodedPayload.customer_id}, party_id: ${decodedPayload.party_id})`
    );
  } catch (err) {
    assert(false, `Positive login failed: ${err.message}`, err.response?.data);
  }

  // -------------------------------------------------------------
  // Test Suite 2: 'My Inquiries & Spot Quotes' Endpoint
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: My Inquiries & Spot Quotes (/inquiries) ---');

  if (!authToken) {
    console.error('Skipping authenticated tests due to login failure.');
    return results;
  }

  try {
    const inqRes = await axios.get(`${API_BASE}/api/external/customers/me/inquiries`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-org-code': ORG_CODE
      }
    });

    assert(inqRes.status === 200, `GET /api/external/customers/me/inquiries returns HTTP 200 OK`);
    const inquiries = inqRes.data?.data || inqRes.data || [];
    assert(Array.isArray(inquiries), `Inquiries payload is an Array (count: ${inquiries.length})`);

    if (inquiries.length > 0) {
      const sampleInquiry = inquiries[0];
      assert(Boolean(sampleInquiry.id), `Inquiry contains ID: ${sampleInquiry.id}`);
      assert(Boolean(sampleInquiry.status), `Inquiry contains status lifecycle state: ${sampleInquiry.status}`);
      assert(Boolean(sampleInquiry.created_at), `Inquiry contains creation timestamp: ${sampleInquiry.created_at}`);
      
      const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'won', 'lost'];
      const allStatusesValid = inquiries.every(inq => VALID_STATUSES.includes(inq.status));
      assert(allStatusesValid, `All inquiries conform to mapped lifecycle statuses (${VALID_STATUSES.join(', ')})`);
    }
  } catch (err) {
    assert(false, `GET /inquiries failed: ${err.message}`, err.response?.data);
  }

  // Test 2.2: Live RFQ Submission and Real-time Reflection in Inquiries
  console.log('\n--- Test Suite 2.2: Live RFQ Submission & CRM Reflection ---');
  const testRfqTimestamp = Date.now();
  const testRfqNotes = `Automated Verification Consignment ${testRfqTimestamp} - 75 MT Fe-550D TMT Rebars`;
  const testExpectedValue = 4087500; // 75 MT * 54500

  try {
    const submitRes = await axios.post(
      `${API_BASE}/api/external/forms/by-name/lead_capture/submit`,
      {
        org_code: ORG_CODE,
        name: customerData.name,
        email: customerData.email,
        company: customerData.company,
        phone: customerData.phone || '+91 99887 76655',
        product_id: 'p1',
        product_name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)',
        sku: 'US-TMT-550D',
        quantity: 75,
        notes: testRfqNotes,
        expected_value: testExpectedValue
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-org-code': ORG_CODE
        }
      }
    );

    assert(submitRes.status === 200 || submitRes.status === 201, `RFQ lead submission returned status ${submitRes.status}`);
    const leadCreated = submitRes.data?.data || submitRes.data;
    assert(Boolean(leadCreated?.id || leadCreated?.success !== false), `Lead record generated with ID: ${leadCreated?.id || 'Created'}`);

    // Check immediate reflection in customer inquiries
    const updatedInqRes = await axios.get(`${API_BASE}/api/external/customers/me/inquiries`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-org-code': ORG_CODE
      }
    });

    const updatedInquiries = updatedInqRes.data?.data || updatedInqRes.data || [];
    const matchedInquiry = updatedInquiries.find(inq => inq.notes?.includes(testRfqTimestamp.toString()) || inq.id === leadCreated?.id);

    assert(Boolean(matchedInquiry), `Newly submitted RFQ is immediately reflected in customer inquiries list`, {
      inquiryId: matchedInquiry?.id,
      status: matchedInquiry?.status,
      notes: matchedInquiry?.notes
    });

    if (matchedInquiry) {
      assert(matchedInquiry.status === 'new', `Newly created inquiry status defaults to 'new'`);
      assert(Number(matchedInquiry.expected_value) === testExpectedValue, `Inquiry expected value matches calculation: ₹${testExpectedValue.toLocaleString('en-IN')}`);
      assert(matchedInquiry.name === customerData.name, `Inquiry customer name matches: ${matchedInquiry.name}`);
      assert(matchedInquiry.email === customerData.email, `Inquiry customer email matches: ${matchedInquiry.email}`);
    }
  } catch (err) {
    assert(false, `RFQ lead submission and reflection test failed: ${err.message}`, err.response?.data);
  }

  // -------------------------------------------------------------
  // Test Suite 3: 'Active Supply Contracts' & 5-Tier Dispatch Progress Tracker
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Active Supply Contracts & 5-Tier Dispatch Tracker ---');

  try {
    const ordersRes = await axios.get(`${API_BASE}/api/external/customers/me/orders`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-org-code': ORG_CODE
      }
    });

    assert(ordersRes.status === 200, `GET /api/external/customers/me/orders returns HTTP 200 OK`);
    const orders = ordersRes.data?.data || ordersRes.data || [];
    assert(Array.isArray(orders) && orders.length > 0, `Active supply contracts returned (count: ${orders.length})`);

    const EXPECTED_DISPATCH_STAGES = [
      'order_confirmed',
      'mill_fabrication',
      'weighbridge_loaded',
      'in_transit',
      'delivered'
    ];

    orders.forEach((order, idx) => {
      console.log(`\n  Checking Contract #${idx + 1}: "${order.title}"`);
      assert(Boolean(order.id), `Contract #${idx + 1} has ID: ${order.id}`);
      assert(Number(order.deal_value) > 0, `Contract #${idx + 1} has valuation: ₹${Number(order.deal_value).toLocaleString('en-IN')}`);
      
      const dispatchStatus = order.dispatch_status || 'order_confirmed';
      const stageIdx = EXPECTED_DISPATCH_STAGES.indexOf(dispatchStatus);
      assert(stageIdx !== -1, `Contract #${idx + 1} dispatch_status ("${dispatchStatus}") matches valid 5-tier sequence`);

      // Verify line items
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach((item, itemIdx) => {
          assert(Boolean(item.product_name), `Item #${itemIdx + 1} has product_name: ${item.product_name}`);
          assert(Number(item.quantity) > 0, `Item #${itemIdx + 1} has quantity: ${item.quantity} ${item.product_unit || 'MT'}`);
          assert(Number(item.unit_price) > 0, `Item #${itemIdx + 1} has unit_price: ₹${Number(item.unit_price).toLocaleString('en-IN')}`);
        });
      }
    });

    // Check for advanced dispatch status (e.g. weighbridge_loaded)
    const advancedOrder = orders.find(o => o.dispatch_status === 'weighbridge_loaded');
    assert(
      Boolean(advancedOrder),
      `Verified contract with advanced dispatch status 'weighbridge_loaded' exists for multi-stage tracker testing`,
      { orderTitle: advancedOrder?.title, dispatch_status: advancedOrder?.dispatch_status }
    );

    if (advancedOrder) {
      const stageIdx = EXPECTED_DISPATCH_STAGES.indexOf(advancedOrder.dispatch_status);
      assert(stageIdx === 2, `Stage index for 'weighbridge_loaded' is 2 (3rd stage in 0-indexed tracker)`);
      console.log(`    -> Stage 0 (order_confirmed): COMPLETED`);
      console.log(`    -> Stage 1 (mill_fabrication): COMPLETED`);
      console.log(`    -> Stage 2 (weighbridge_loaded): ACTIVE (Indigo Ring)`);
      console.log(`    -> Stage 3 (in_transit): PENDING`);
      console.log(`    -> Stage 4 (delivered): PENDING`);
    }

  } catch (err) {
    assert(false, `GET /orders failed: ${err.message}`, err.response?.data);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 M2 BACKEND API TEST SUMMARY: ${results.passed}/${results.total} PASSED (${results.failed} FAILED)`);
  console.log('================================================================\n');

  return results;
}

runApiVerification().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  }
}).catch((e) => {
  console.error('Fatal API test error:', e);
  process.exit(1);
});
