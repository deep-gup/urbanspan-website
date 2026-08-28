import axios from 'axios';

const API_BASE = 'https://api.urbanspaninfra.co.in';
const API_KEY = 'fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f';
const ORG_CODE = 'urbanspan_steel_1764';

async function debugInquiries() {
  const loginRes = await axios.post(`${API_BASE}/api/external/customers/login`, {
    org_code: ORG_CODE,
    email: 'sourabh.khandelwal@khandelwalinfra.com',
    password: 'Password123!'
  }, { headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'x-org-code': ORG_CODE } });

  const token = loginRes.data?.data?.token;
  console.log('Customer:', loginRes.data?.data?.customer);

  const beforeInq = await axios.get(`${API_BASE}/api/external/customers/me/inquiries`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-org-code': ORG_CODE }
  });
  console.log('Current inquiries count:', beforeInq.data?.data?.length);
  console.log('Inquiries list:', JSON.stringify(beforeInq.data?.data, null, 2));

  // Now submit RFQ
  const submitRes = await axios.post(`${API_BASE}/api/external/forms/by-name/lead_capture/submit`, {
    org_code: ORG_CODE,
    customer_name: 'Sourabh Khandelwal',
    customer_email: 'sourabh.khandelwal@khandelwalinfra.com',
    customer_phone: '+91 99887 76655',
    delivery_location: 'Jaipur Expressway Project Site, Sector 12',
    expected_value: 4087500,
    notes: 'Debug Test RFQ',
    items: [
      {
        product_id: 'p1',
        product_name: 'Fe-550D TMT Steel Rebars (8mm - 32mm)',
        variant_name: '16mm Grade 550D',
        quantity: 75,
        product_unit: 'MT',
        base_price: 54500,
        unit_price: 54500
      }
    ]
  }, { headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'x-org-code': ORG_CODE } });

  console.log('Submit Res:', JSON.stringify(submitRes.data, null, 2));

  const afterInq = await axios.get(`${API_BASE}/api/external/customers/me/inquiries`, {
    headers: { 'Authorization': `Bearer ${token}`, 'x-org-code': ORG_CODE }
  });
  console.log('After inquiries count:', afterInq.data?.data?.length);
  console.log('After inquiries list:', JSON.stringify(afterInq.data?.data, null, 2));
}

debugInquiries();
