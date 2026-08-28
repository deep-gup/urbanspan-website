import axios from 'axios';
import fs from 'fs';

const API_BASE = 'https://api.urbanspaninfra.co.in';
const ORG_CODE = 'urbanspan_steel_1764';

async function testSavedSession() {
  const sessionPath = 'C:\\Users\\gupta\\.gemini\\antigravity\\scratch\\urbanspan-website\\.agents\\worker_m2_portal\\session.json';
  if (!fs.existsSync(sessionPath)) {
    console.log('No session.json found yet.');
    return;
  }
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  console.log('Loaded token from session.json, checking orders...');

  const ordersRes = await axios.get(`${API_BASE}/api/external/customers/me/orders`, {
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'x-org-code': ORG_CODE
    }
  });

  console.log('Orders status:', ordersRes.status, 'Count:', ordersRes.data?.data?.length);

  const inqRes = await axios.get(`${API_BASE}/api/external/customers/me/inquiries`, {
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'x-org-code': ORG_CODE
    }
  });

  console.log('Inquiries status:', inqRes.status, 'Count:', inqRes.data?.data?.length);
}

testSavedSession();
