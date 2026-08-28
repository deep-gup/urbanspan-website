# UrbanSpan Web Application & Customer Portal — Specification Survey Report

**Author**: Spec Miner 2 (QA & Verification Campaign)
**Target Environment**:
- Web Application: https://urbanspaninfra.co.in
- Customer Portal: https://urbanspaninfra.co.in/portal
- Headless API Gateway: https://api.urbanspaninfra.co.in
- Verified Test Account: sourabh.khandelwal@khandelwalinfra.com | Password123!
- API Org Code: urbanspan_steel_1764
- API Key: fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f
- Date / Timestamp: 2026-08-22T14:10:00Z

---

## 1. Executive Summary

UrbanSpan is a digital procurement, live quotation, and dispatch tracking web platform for primary infrastructure steel products (TMT Rebars, Structural Beams, HR Coils, CRCA Sheets, Plates, and Pipes). The platform employs a dual-viewport React 19 SPA frontend with Tailwind CSS v4, connected to a Headless REST API and real-time Socket.IO WebSocket gateway hosted on Google Cloud.

This survey establishes the complete, authoritative specification discovered through direct live probing of all network endpoints, WebSocket handshakes, authentication mechanics, form validation constraints, rate limiters, buyer data feeds, and local codebase cross-referencing.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Products & Catalog | Headless Product Catalog Stream | Retrieves live mill steel catalog with prices, categories, AST markdown specs, and tags | Headers: x-api-key, x-org-code | JSON array of products with ID, name, SKU, base price, images, specs | Falls back to MOCK_STEEL_PRODUCTS on HTTP error / rate limit | Live probe GET /api/external/products & headlessApi.js |
| 2 | Products & Catalog | Client-Side Fallback Catalog | Fallback catalog providing 6 canonical steel products when offline or rate-limited | None | 6 steel items (Fe-550D TMT, ISMB Beams, HR Coils, CRCA, ERW Pipes, Carbon Plates) | N/A | src/services/headlessApi.js |
| 3 | Commercial Math | 18% GST Tax Breakdown | Transparent GST pill calculations: Base Rate + 18% GST = Effective Rate/MT (HSN 7214) | Base price per MT (P) | P_eff = P * 1.18, GST amount = P * 0.18 | Minimum 0 | CartContext.jsx, CartPage.jsx, ProductDetailsPage.jsx |
| 4 | Commercial Math | Multi-Product Cart Valuation | Mathematical exactness across multi-line consignments | Item quantity Q_i, Rate P_i | Line Total = Q_i * P_i * 1.18, Grand Total = (Sum Q_i * P_i) * 1.18 | Minimum quantity clamped to 1 | src/context/CartContext.jsx |
| 5 | Commercial Math | Tonnage Stepper & Presets | Rapid MT selection (25, 50, 100, 200 MT) and fine-grained stepper (+5 / -5 MT) | User click / numeric input | Updates item quantity and recalculates totals | Clamps input to Q >= 1 | CartPage.jsx, ProductDetailsPage.jsx |
| 6 | RFQ Lead Capture | Dynamic Form Schema Ingestion | Fetches schema definition for dynamic lead capture forms | Query param: org_code | Form schema object with fields array and validation rules | Returns HTTP 400 if org_code missing | Live probe GET /api/external/forms/by-name/lead_capture/schema |
| 7 | RFQ Lead Capture | Single & Multi-Product RFQ Submission | Submits commercial inquiry with consignment items and customer info to CRM | JSON payload: name, email, phone, company, quantity, expected_value, items | HTTP 201 { data: { entity_type: 'lead', id: '<UUID>', success: true } } | HTTP 400 on missing org_code | Live probe POST /api/external/forms/by-name/lead_capture/submit |
| 8 | RFQ Lead Capture | Direct CRM Leads Ingestion | Direct transmission endpoint to create CRM leads | JSON payload: name, email, phone, company, requirement | HTTP 201 { data: { id: '<UUID>', name: '...' }, success: true } | HTTP 400 on bad payload | Live probe POST /api/external/leads |
| 9 | Authentication | Customer Login | Authenticates verified buyer with email and password, issuing HS256 JWT | JSON: { org_code, email, password } | HTTP 200 { data: { customer: {...}, token: '<JWT>' } } | HTTP 401 {'error':'Invalid email or password.'} | Live probe POST /api/external/customers/login |
| 10 | Authentication | Customer Registration | Creates new client account for order tracking & test certs | JSON: { org_code, name, email, password, company, phone } | HTTP 201 { data: { customer: {...}, token: '<JWT>' } } | HTTP 400 missing fields; HTTP 500 duplicate email | Live probe POST /api/external/customers/register |
| 11 | Authentication | Session Persistence | Persists customer JWT and profile in browser storage | Auth response token & customer object | LocalStorage keys: urbanspan_customer_token, urbanspan_customer_user | Expired/cleared on sign out | src/components/CustomerPortal.jsx & App.jsx |
| 12 | Customer Portal | My Inquiries & Spot Quotes Feed | Fetches submitted RFQs with real-time status, assigned reps, and deal value | Header: Authorization: Bearer <JWT>, x-org-code | JSON array of inquiries with status, rep details, quote data | HTTP 401 if token missing or invalid | Live probe GET /api/external/customers/me/inquiries |
| 13 | Customer Portal | Active Supply Contracts Feed | Fetches live customer orders, deal values, and contracted manifests | Header: Authorization: Bearer <JWT>, x-org-code | JSON array of active orders, contracted items, dispatch statuses | HTTP 401 if token missing or invalid | Live probe GET /api/external/customers/me/orders |
| 14 | Customer Portal | 5-Tier Dispatch Progress Tracker | Visual 5-stage progress: Order Confirmed -> Mill Fabrication -> Weighbridge Loaded -> In Transit -> Delivered | dispatch_status field on order object | Stepper progress indicator with icon, label, and highlight | Defaults to Stage 1 (order_confirmed) if unrecognized | CustomerPortal.jsx & live orders probe |
| 15 | Live Chat Subsystem | Chat History Retrieval | Loads customer channel ID and past message history | Header: Authorization: Bearer <JWT>, x-org-code | JSON { channel: { id, name }, messages: [ ... ] } | HTTP 401 if token missing or invalid | Live probe GET /api/external/customers/me/chat |
| 16 | Live Chat Subsystem | Socket.IO Live WebSocket Connection | Real-time bidirectional connection to ERP chat gateway | Connection handshake { auth: { token } }, transports ['websocket', 'polling'] | Socket connection ID, room joining, live event broadcasts | Disconnects on invalid auth; reconnects via polling | Live probe io('https://api.urbanspaninfra.co.in') |
| 17 | Live Chat Subsystem | REST Message Post & Broadcast | Posts message via REST and broadcasts event to Socket.IO channel | REST payload { content }, Socket emit send_message | HTTP 200 { data: { id, channel_id, content, ... } }, new_message event | HTTP 401 if unauthenticated | Live probe POST /api/external/customers/me/chat/messages |
| 18 | News & Market Insights | Google Sheets Live CSV Feed | Real-time steel industry news and market analysis ingestion | GET VITE_NEWS_CSV_URL | CSV text parsed by PapaParse into structured article cards | Displays error banner if CSV URL fails | Live probe & src/components/News.jsx |
| 19 | Mobile & Hybrid | Dual Viewport Switcher | Dynamically renders mobile app dashboard vs desktop header based on viewport | Viewport width check: window.innerWidth < 1024 | Mobile: BottomTabBar (6 tabs), full-screen chat; Desktop: Navbar, floating chat | Responsive resize listener | src/App.jsx, Navbar.jsx, BottomTabBar.jsx |
| 20 | Mobile & Hybrid | Live OTA Update Sync | Over-the-air binary updates via Capgo CapacitorUpdater | Payload { app_id: 'com.urbanspan.app', version } | Downloads update bundle from GCP storage and reloads | Gracefully alerts if on latest web build | src/App.jsx & CustomerPortal.jsx |
| 21 | Rate Limiting | IP Rate Limiter Gateway | Protects API against denial-of-service and burst traffic | IP request frequency | Rate limit headers: ratelimit-policy: 100;w=900, ratelimit-remaining | Returns HTTP 429 Too Many Requests with retry-after header | Live probe testing on api.urbanspaninfra.co.in |

---

## 3. Edge Cases & Observed Behavior

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | Customer Login | Incorrect password for existing email | HTTP 401 {'error':'Invalid email or password.','success':false} |
| 2 | Customer Login | Non-existent email address | HTTP 401 {'error':'Invalid email or password.','success':false} |
| 3 | Customer Register | Already registered email address | HTTP 500 {'error':'Email already registered. Please log in with your password.','success':false} |
| 4 | Customer Register | Missing password field | HTTP 400 {'error':'Missing required fields: org_code, name, email, password.','success':false} |
| 5 | Orders API | Missing Authorization header | HTTP 401 {'error':'Access denied. Missing token or x-org-code.','success':false} |
| 6 | Orders API | Malformed / Invalid JWT token | HTTP 401 {'error':'Invalid token. Please log in again.','success':false} |
| 7 | Inquiries API | Missing Authorization header | HTTP 401 {'error':'Access denied. Missing token or x-org-code.','success':false} |
| 8 | Lead Form Submit | Missing org_code in payload / header | HTTP 400 {'error':'Missing org_code.','success':false} |
| 9 | Lead Form Submit | Missing contact name or email (frontend) | Form validation prevents submission, displays red warning banner |
| 10 | Lead Form Submit | Non-numeric or negative quantity | Frontend stepper enforces minimum 1 MT via Math.max(1, qty) |
| 11 | Products API | Burst requests exceeding 100 reqs/15 min | HTTP 429 Too Many Requests with retry-after: 627 |
| 12 | Products API | API down / HTTP 429 received | Frontend catches error and falls back seamlessly to MOCK_STEEL_PRODUCTS |
| 13 | Live Chat Widget | Unauthenticated user opens chat | Displays lock banner 'Log in for verified sales chat', hides send button |
| 14 | Live Chat Widget | Sending empty whitespace message | Input handler ignores submission (if (!inputText.trim()) return) |
| 15 | Live Chat WebSocket | Socket connection fails or drops | REST endpoint POST /api/external/customers/me/chat/messages sends message and optimistically updates UI |
| 16 | Multi-Product Cart | User clears cart | LocalStorage urbanspan_buyer_cart is reset to [], UI renders empty state card |
| 17 | Customer Portal | Buyer with 0 inquiries but active orders | Automatically defaults active portal tab to orders |

---

## 4. Architectural Deep Dive

### 4.1. Network Endpoints & API Structure
- Base URL: https://api.urbanspaninfra.co.in/api
- Standard Headers:
  - x-api-key: fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f
  - x-org-code: urbanspan_steel_1764
  - Authorization: Bearer <JWT> (for customer authenticated routes)
  - Content-Type: application/json

### 4.2. Authentication & Session Architecture
- JWT Standard: HS256 algorithm with 30-day expiry (exp: 1789999733).
- Token Claims:
`json
{
  customer_id: 76fddbf2-6ff9-4a43-8bbc-1206dae472d9,
  party_id: 2f406a41-9fde-4e6e-bc3e-a7669de2b52f,
  org_id: 445f0a36-3ca4-4e68-bf53-7fb7c7b95b0b,
  org_schema: org_urbanspan_steel_1785673557358,
  role: customer,
  iat: 1787407733,
  exp: 1789999733
}
`
- Verified Buyer Profile (sourabh.khandelwal@khandelwalinfra.com):
  - Name: Sourabh Khandelwal
  - Company: Khandelwal Infra Developers
  - Phone: +91 99887 76655
  - Active Orders Count: 5 supply contracts
  - Total Active Valuation: > 1.88 Crores INR
  - Current Dispatch Statuses: order_confirmed, weighbridge_loaded
  - Assigned Sales Rep: Rajesh Verma (rajesh.sales@urbanspan.com | +91 98200 44556)

### 4.3. Real-Time Chat WebSocket Protocol
- Transport: Socket.IO client v4.8.3 (transports: ['websocket', 'polling'])
- Connection Handshake:
`javascript
const socket = io('https://api.urbanspaninfra.co.in', {
  auth: { token: localStorage.getItem('urbanspan_customer_token') },
  transports: ['websocket', 'polling']
});
`
- Channel Subscription: Client emits join_channel with channel ID (f1ed4af2-1bfa-4036-af86-9064fb0c0dd7).
- Message Emission: Client posts message via POST /api/external/customers/me/chat/messages, then broadcasts via socket.emit('send_message', { message: data, channel_id }).
- Message Reception: Client listens for new_message event and appends to UI history.

### 4.4. 5-Tier Dispatch Progress Stages
The 5 sequential dispatch stages mapped in CustomerPortal.jsx are:
1. order_confirmed — 1. Order Booked (Icon: FileText)
2. mill_fabrication — 2. Mill Rolling (Icon: Factory)
3. weighbridge_loaded — 3. Weighbridge Loaded (Icon: Scale)
4. in_transit — 4. In Transit (Icon: Truck)
5. delivered — 5. Delivered (Icon: CheckCircle)

### 4.5. Commercial Cart Valuation Formula
- Line Subtotal = Quantity (MT) * Base Price
- Line GST (18%) = Line Subtotal * 0.18
- Line Total = Line Subtotal * 1.18
- Consignment Subtotal = Sum(Line Subtotal)
- Consignment Total GST = Consignment Subtotal * 0.18
- Consignment Total = Consignment Subtotal * 1.18

---

## 5. Conclusion & Verification Readiness
All core APIs, live WebSocket channels, form submissions, customer sessions, and portal feeds are fully operational and verified live against production servers (https://urbanspaninfra.co.in and https://api.urbanspaninfra.co.in).
