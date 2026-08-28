# R2 - Customer Self-Service Portal & Live Dispatch Tracker (/portal) Investigation Report

**Agent**: `explorer_survey_2`  
**Investigation Timestamp**: 2026-08-22T13:25:30Z  
**Workspace Root**: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website`  
**Live Application Target**: `https://urbanspaninfra.co.in/portal`  
**Live API Host**: `https://api.urbanspaninfra.co.in`  
**Test Client Identity**: Sourabh Khandelwal (`sourabh.khandelwal@khandelwalinfra.com` / `Password123!`)

---

## Executive Summary

The Customer Self-Service Portal (`/portal`) provides an authenticated commercial workspace for verified steel buyers, builders, and infrastructure contractors. It features secure customer authentication, session persistence via browser local storage, real-time synchronization with the Distro CRM backend (`/leads` and `/deals`), a dual-tab management interface for **My Inquiries & Spot Quotes** and **Active Supply Contracts**, and a **5-Tier Dispatch Progress Tracker** reflecting physical steel mill dispatch milestones.

All live API endpoints have been probed, verified, and validated against the verified buyer credentials (`sourabh.khandelwal@khandelwalinfra.com` / `Password123!`).

---

## 1. System Architecture & Route Mapping

### 1.1 Application Entry & Routing
The customer self-service portal is mounted at `/portal` in the React 19 Single Page Application.

- **Route Configuration** (`src/App.jsx`, Lines 300–312):
  ```jsx
  <Route path="/portal" element={
    <div className="pt-24 lg:pt-24 min-h-screen bg-slate-50">
      <SEO title="Client Portal" />
      <CustomerPortal 
        customerUser={customerUser} 
        setCustomerUser={setCustomerUser}
        appVersion={appVersion}
        onCheckUpdate={() => checkOtaUpdate(true)}
        isUpdating={isUpdating}
        otaStatus={otaStatus}
      />
    </div>
  } />
  ```
- **Global Session State** (`src/App.jsx`, Lines 119, 128–133):
  - `customerUser` state is initialized from `localStorage.getItem('urbanspan_customer_user')`.
  - When authenticated, `customerUser` contains the customer profile object (`id`, `party_id`, `name`, `company`, `email`, `phone`).
- **Dynamic Backend URL Resolution** (`src/services/headlessApi.js`, Lines 3–39):
  - Hostname `urbanspaninfra.co.in` or `PROD` resolves to `https://api.urbanspaninfra.co.in`.
  - Development mode resolves to local/network IP or `import.meta.env.VITE_API_URL`.
  - Standard headers: `x-api-key: fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f`, `x-org-code: urbanspan_steel_1764`.

---

## 2. Customer Authentication & Session Management

### 2.1 Component Flow
- **Component File**: `src/components/CustomerPortal.jsx` (Lines 1–547)
- Dual mode form: Sign In (`isRegisterMode: false`) and Registration (`isRegisterMode: true`).

### 2.2 Live Endpoint Verification
- **Endpoint**: `POST https://api.urbanspaninfra.co.in/api/external/customers/login`
- **Request Payload**:
  ```json
  {
    "org_code": "urbanspan_steel_1764",
    "email": "sourabh.khandelwal@khandelwalinfra.com",
    "password": "Password123!"
  }
  ```
- **Live Response (Status 200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "customer": {
        "id": "76fddbf2-6ff9-4a43-8bbc-1206dae472d9",
        "party_id": "2f406a41-9fde-4e6e-bc3e-a7669de2b52f",
        "name": "Sourabh Khandelwal",
        "email": "sourabh.khandelwal@khandelwalinfra.com",
        "company": "Khandelwal Infra Developers",
        "phone": "+91 99887 76655"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 2.3 Storage & Persistence
- **Storage Keys**:
  - `urbanspan_customer_token`: Raw JWT Bearer token used for authenticated requests.
  - `urbanspan_customer_user`: Serialized customer profile JSON.
- **Cross-Component Utilization**:
  - `Navbar.jsx`: Renders customer badge with first name (`Sourabh`) and portal link.
  - `MobileDashboard.jsx`: Renders personalized greeting banner ("Welcome back, Sourabh!").
  - `DynamicForm.jsx` & `CartPage.jsx`: Pre-fills contact information for seamless RFQ submission.
  - `LiveChatWidget.jsx`: Uses JWT token to authenticate socket connection and fetch live chat history.
- **Sign Out Flow**:
  - `handleLogout()` (`CustomerPortal.jsx`, Lines 101–106) deletes both `urbanspan_customer_token` and `urbanspan_customer_user` from localStorage and clears component state.
- **Error Handling**:
  - Captures authentication rejections (`err.response?.data?.error`) and renders an alert banner with an `AlertCircle` icon.

---

## 3. 'My Inquiries & Spot Quotes' Tab Implementation

### 3.1 Real-Time Sync & CRM Integration
- **API Endpoint**: `GET https://api.urbanspaninfra.co.in/api/external/customers/me/inquiries`
- **Headers**: `Authorization: Bearer <token>`, `x-org-code: urbanspan_steel_1764`
- **Data Flow**:
  1. Buyer submits an RFQ via `/rfq` (`DynamicForm`) or `/cart` (`CartPage`).
  2. Frontend sends `POST /api/external/forms/by-name/lead_capture/submit`.
  3. Backend Distro CRM inserts lead and links it with customer's email / party ID.
  4. Portal queries `/api/external/customers/me/inquiries` and immediately renders the new inquiry.
- **Live Submission Test**:
  - Submitted 60 MT Fe-550D TMT RFQ (`id: 4af5a8b1-bc26-43cf-ac81-bc5a6dfb0134`) with expected value ₹3,270,000.
  - Lead was created with HTTP 201 and instantly appeared at the top of Sourabh Khandelwal's inquiries with `status: "new"`.

### 3.2 Status Mapping & UI Presentation
The portal renders 8 status states:

| Status Key | UI Label | Badge Color | Description |
| :--- | :--- | :--- | :--- |
| `new` | Received / Under Review | Blue (`bg-blue-100 text-blue-800`) | Initial submission received by sales desk |
| `contacted` | Sales Desk Assigned | Amber (`bg-amber-100 text-amber-800`) | Key account manager assigned |
| `qualified` | Commercial Evaluation | Indigo (`bg-indigo-100 text-indigo-800`) | Technical and mill specifications validated |
| `proposal` | Official Quote Ready | Purple (`bg-purple-100 text-purple-800`) | Proforma pricing issued to buyer |
| `negotiation` | Rate Finalisation | Pink (`bg-pink-100 text-pink-800`) | Final terms and freight discussions |
| `converted` | Contract Booked & Active | Emerald (`bg-emerald-100 text-emerald-800`) | Converted to supply contract |
| `won` | Contract Approved | Emerald (`bg-emerald-100 text-emerald-800`) | Commercial contract signed |
| `lost` | Closed | Slate (`bg-slate-100 text-slate-700`) | Closed / cancelled RFQ |

### 3.3 Interactive Actions
- **Assigned Representative Phone**: Direct `tel:` click-to-call link for assigned sales manager (e.g., Rajesh Verma: `+91 98200 44556`).
- **1-Click Conversion Bridge**: Converted/Won inquiries display a prominent button ("View Active Supply Contract & Live Dispatch Tracker ➔") to immediately transition to the **Active Supply Contracts** tab.

---

## 4. 'Active Supply Contracts' & 5-Tier Dispatch Progress Tracker

### 4.1 Live Contract Data Model
- **API Endpoint**: `GET https://api.urbanspaninfra.co.in/api/external/customers/me/orders`
- **Verified Live Contracts for Sourabh Khandelwal**:
  1. `Deal - Sourabh Khandelwal` — ₹2,285,000.00 | `order_confirmed` | Rep: Rajesh Verma | Item: BHUMIJA TMT BARS (50 ton @ 45,700/ton).
  2. `Deal - Khandelwal Infra Developers` — ₹4,835,000.00 | `order_confirmed`.
  3. `Commercial Township Phase 1 - 100 MT TMT Consignment` — ₹4,835,000.00 | `order_confirmed` | Items: BHUMIJA TMT BARS (50 ton) + ISI TMT RAIPUR (50 ton).
  4. `Commercial Township Phase 1 - 100 MT TMT Consignment (Revision)` — ₹4,835,000.00 | `order_confirmed`.
  5. `Commercial Township Phase 1 - 50 MT BHUMIJA TMT` — ₹2,285,000.00 | `weighbridge_loaded` | Rep: Rajesh Verma.

### 4.2 5-Tier Dispatch Progress Tracker
The dispatch milestone progression is configured as:

```
[1. Order Booked] ──▶ [2. Mill Rolling] ──▶ [3. Weighbridge Loaded] ──▶ [4. In Transit] ──▶ [5. Delivered]
  (FileText)             (Factory)                (Scale)                 (Truck)             (CheckCircle)
```

#### Visual State Determination:
```javascript
const DISPATCH_STAGES = [
  { key: 'order_confirmed', label: '1. Order Booked', icon: FileText },
  { key: 'mill_fabrication', label: '2. Mill Rolling', icon: Factory },
  { key: 'weighbridge_loaded', label: '3. Weighbridge Loaded', icon: Scale },
  { key: 'in_transit', label: '4. In Transit', icon: Truck },
  { key: 'delivered', label: '5. Delivered', icon: CheckCircle }
];

const currentStatus = order.dispatch_status || 'order_confirmed';
const stageKeys = DISPATCH_STAGES.map(s => s.key);
const currentIdx = Math.max(0, stageKeys.indexOf(currentStatus));
```
- **Stages < currentIdx**: Completed (Solid Emerald `bg-emerald-500 text-white`).
- **Stage === currentIdx**: Active Step (Indigo with ring `bg-indigo-600 ring-2 ring-indigo-200 shadow-md`).
- **Stages > currentIdx**: Pending (Neutral Slate `bg-slate-200 text-slate-400`).
- **Live Verification**: Contract #5 (`weighbridge_loaded`) correctly advances the stepper to Stage 3 (Weighbridge Loaded), marking Stages 1 and 2 as completed.

---

## 5. Sidebar & System Widgets

1. **Key Account Team**: Sunil Sharma (Director & Commercial Approvals, `sunil.approvals@urbanspan.com`).
2. **Operations & Logistics**: Vikram Patel (Operations).
3. **App Version & OTA Widget**: Displays current build (`v1.2.0`), manual OTA check trigger, and direct APK download link (`https://storage.googleapis.com/urbanspan-downloads/urbanspan-app-v3.apk`).

---

## 6. Comprehensive API Routes & Component Map

| Component | Related Files | API Endpoint | HTTP Method | Auth / Headers | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| CustomerPortal | `CustomerPortal.jsx`, `headlessApi.js` | `/api/external/customers/login` | POST | `x-api-key`, `x-org-code` | Authenticate buyer |
| CustomerPortal | `CustomerPortal.jsx`, `headlessApi.js` | `/api/external/customers/register` | POST | `x-api-key`, `x-org-code` | Create buyer account |
| CustomerPortal | `CustomerPortal.jsx`, `headlessApi.js` | `/api/external/customers/me/orders` | GET | `Bearer <token>` | Load active contracts & dispatch stages |
| CustomerPortal | `CustomerPortal.jsx`, `headlessApi.js` | `/api/external/customers/me/inquiries` | GET | `Bearer <token>` | Load submitted RFQs & quote statuses |
| DynamicForm | `DynamicForm.jsx`, `headlessApi.js` | `/api/external/forms/by-name/:name/submit` | POST | `x-api-key`, `x-org-code` | Submit single-product RFQ |
| CartPage | `CartPage.jsx`, `headlessApi.js` | `/api/external/forms/by-name/lead_capture/submit` | POST | `x-api-key`, `x-org-code` | Submit multi-product consignment RFQ |
| LiveChatWidget | `LiveChatWidget.jsx`, `headlessApi.js` | `/api/external/customers/me/chat` | GET | `Bearer <token>` | Load customer chat channel history |
| LiveChatWidget | `LiveChatWidget.jsx`, `headlessApi.js` | `/api/external/customers/me/chat/messages` | POST | `Bearer <token>` | Send customer chat message |
