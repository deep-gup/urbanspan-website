# UrbanSpan Web Application & Customer Portal: Comprehensive Architectural Survey & Technical Audit Report

**Investigator**: Explorer 1 (Teamwork Preview Survey Specialist)  
**Target Application**: UrbanSpan Infrastructure Web Platform & Client Portal (`https://urbanspaninfra.co.in`)  
**Target Codebase**: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website`  
**Date of Audit**: 2026-08-22  
**Audit Scope**: Frontend Architecture, Headless API Integration, Steel Catalog, Product Specs & AST Parser, Cart & GST Mathematics, RFQ/CRM Dispatch, Customer Portal & 5-Tier Dispatch Tracker, Live Chat WebSocket Subsystem, Mobile Viewport Parity.

---

## 1. Executive Summary & System Architecture

UrbanSpan is a digital procurement, quotation, and live dispatch tracking web platform for primary infrastructure steel products (Fe-550D TMT Rebars, Heavy Structural ISMB Beams, Hot Rolled / Cold Rolled Sheets & Coils, ERW & Seamless Heavy Piping, Carbon Steel Plates) serving B2B contractors, EPC builders, and infrastructure developers across India.

### 1.1 Technology Stack & Core Dependencies
- **Core Runtime & Build System**: React 19.2.7 (`react`, `react-dom`), Vite 8.1.5, ES Modules.
- **Routing**: React Router DOM 7.18.2 (`BrowserRouter`, `Routes`, `Route`, `useLocation`, `useNavigate`, `useParams`, `Link`).
- **Styling & Design System**: Tailwind CSS 4.3.3 (`@tailwindcss/vite`, `@theme` token definitions in `src/index.css`), Lucide React 1.26.0 iconography.
- **HTTP & Data Ingestion**: Axios 1.18.1 for RESTful ERP calls, PapaParse 5.5.4 for Google Sheets news CSV streaming.
- **Real-Time Communication**: Socket.IO Client 4.8.3 (`io`) for bidirectional WebSocket live chat with CRM sales engineers.
- **SEO & Meta Engine**: React Helmet Async 3.0.0 (`HelmetProvider`, `SEO` component with Schema.org JSON-LD Structured Data).
- **Mobile Packaging & Hybrid Engine**: Capacitor 8.4.2 (`@capacitor/core`, `@capacitor/android`), Capgo Capacitor Updater 8.51.3 for live over-the-air (OTA) binary updates.
- **Linting & Verification Tooling**: Oxlint 1.71.0, Playwright 1.62.1.

### 1.2 Build & Code Health Verification
- **Production Build Execution**: `cmd /c "npm run build"` -> `vite build` completed in **672ms** with **0 compilation errors**. Transformed 1,895 modules into production assets:
  - `dist/index.html` (9.12 kB)
  - `dist/assets/index-BuZzb-Or.css` (63.58 kB)
  - `dist/assets/index-DYlTRJ4S.js` (541.44 kB)
  - `dist/assets/web-B8lf9Eka.js` (5.08 kB)
- **Source Code Linting**: `cmd /c "npx oxlint --quiet src"` -> **0 errors** across 23 source files.

---

## 2. Steel Catalog, Navigation, and Multi-Category Filtering

### 2.1 Component Location & Structure
- **File Path**: `src/components/ProductCatalog.jsx` (294 lines)
- **Route Bindings**: `/products` and `/catalog` in `src/App.jsx:250-262`. Also embedded on the desktop home page (`/`) in `src/App.jsx:228`.

### 2.2 Data Ingestion & API Layer
- **API Function**: `fetchSteelProducts()` in `src/services/headlessApi.js:149-202`.
- **Backend Endpoint**: `GET https://api.urbanspaninfra.co.in/api/external/products`
- **Request Headers**:
  - `x-api-key: fdece7fcbbde496e10b0b5b1331586ee4e357cfd875d289554b075691bf5bc4f`
  - `x-org-code: urbanspan_steel_1764`
  - `Cache-Control: no-cache`, `Pragma: no-cache`, `Expires: 0`
- **Fault-Tolerant Catalog Fallback**: If the remote headless ERP is unreachable or returns empty data, the client falls back to `MOCK_STEEL_PRODUCTS` (6 BIS-certified product SKUs: Fe-550D TMT Rebars, ISMB I-Beams, HR Coils & Sheets, CRCA Sheets, ERW Piping, Heavy Carbon Steel Plates) with full specification sets and local image mappings (`/images/*.jpg`).
- **Image URL Normalizer**: Auto-detects relative `/uploads/...` paths from the CRM backend and resolves them against `config.apiBaseUrl` (`src/services/headlessApi.js:168-178`).

### 2.3 Category Filtering & Real-Time Search Logic
- **Dynamic Category Extraction** (`ProductCatalog.jsx:63-70`):
  ```javascript
  const uniqueCategories = Array.from(
    new Set(
      products
        .map(p => p.category)
        .filter(c => typeof c === 'string' && c.trim() !== '')
    )
  );
  const categories = ['All', ...uniqueCategories];
  ```
- **Filtering Algorithm** (`ProductCatalog.jsx:72-80`):
  - Filters by selected category: `matchesCategory = selectedCategory === 'All' || (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase())`.
  - Fuzzy Search: Queries against `product.name`, `product.sku`, and `product.tags` array (case-insensitive).
- **Interactive Controls**:
  - Category pill tabs with active state styling (`bg-brand-steel text-slate-900 shadow-md shadow-brand-steel/20`).
  - Search input with leading search icon.
  - "Refresh Live Stock" button with spinning `RefreshCw` icon during re-fetch.
  - Quick "Add to Cart" button (adds 25 MT with immediate 2-second visual check feedback).
  - "Quote RFQ" button delegating directly to `onSelectProductForInquiry(product)`.
  - Markdown excerpt cleaner `getCleanDescriptionExcerpt(text, maxLength=140)` ensuring clean presentation without raw markdown syntax in catalog summary cards.

---

## 3. Product Details Page, Specification AST Parser & Benchmark Pricing

### 3.1 Component Location & Route Parameters
- **File Path**: `src/components/ProductDetailsPage.jsx` (660 lines)
- **Route Bindings**: `/products/:id` and `/product/:id` in `src/App.jsx:264-276`.
- **Parameter Resolution**: `const { id } = useParams()` matches both SKU codes (`US-TMT-550D`) and internal IDs (`p1`).

### 3.2 Interactive Multi-Image Gallery Subsystem
- **Stage & Thumbnail Strip** (`ProductDetailsPage.jsx:340-375`):
  - Primary viewport stage with smooth 500ms zoom transition on hover (`group-hover:scale-105`).
  - Multi-image strip with active thumbnail border and ring highlight (`border-brand-steel ring-2 ring-brand-steel/30 scale-95`).
  - Counter badge overlay (`selectedImageIndex + 1 / galleryImages.length`).

### 3.3 Benchmark Pricing & 18% GST Breakdown Logic
- **Rate Formulation** (`ProductDetailsPage.jsx:427-461`):
  - **Base Benchmark Rate**: `₹{Number(product.base_price).toLocaleString('en-IN')} / {product.unit || 'Metric Ton'} (ex-plant)`
  - **Applicable GST Amount**: `Math.round(product.base_price * 0.18)` (`+₹9,810/MT` on ₹54,500 base).
  - **Effective Rate (incl. 18% GST)**: `Math.round(product.base_price * 1.18)` (`Effective: ₹64,310/MT`).
  - **Statutory Notice**: Clear disclosure stating base ex-plant rates conform to HSN 7214 statutory 18% GST, with logistics and transit insurance quoted upon site destination confirmation.

### 3.4 Tonnage Selection & Stepper Subsystem
- **Tonnage Preset Chips** (`ProductDetailsPage.jsx:463-485`): Quick select for 25 MT, 50 MT, 100 MT, 200 MT.
- **Interactive Numeric Stepper** (`ProductDetailsPage.jsx:487-512`):
  - Minus button: decrements by 5 MT (clamped to minimum 1 MT: `Math.max(1, prev - 5)`).
  - Plus button: increments by 5 MT (`prev + 5`).
  - Direct numeric input with live validation.
- **Buyer Call-to-Actions**:
  - `Add [customTonnage] MT to Cart` with `addToCart(product, customTonnage)` and 2.5s success state.
  - `Inquire For Bulk Supply / Dispatch ([customTonnage] MT)` triggering instant routing to `/rfq`.

### 3.5 Markdown AST Specification Parser
- **Parser Implementation** (`ProductDetailsPage.jsx:95-232`):
  - Ingests structured markdown from ERP product descriptions without external heavyweight dependencies.
  - AST Element Handlers:
    - `# Heading 1`, `## Heading 2`, `### Heading 3` (with styled steel accent bar).
    - `> Blockquotes / Highlight Callouts` (rendered with left brand-steel accent border).
    - `- / * / • Bullet Lists` with styled `▸` bullet icons.
    - `1. Numbered Lists` with bold numbered prefixes.
    - Inline formatting tokenizer for `**bold**`, `*italic*`, and `[link](url)`.
  - Expandable overview container with toggle button (`isOverviewExpanded`), smooth max-height transitions, and bottom gradient fade overlay.

### 3.6 Material Specifications Grid & Cross-Sell Engine
- **Specs Grid** (`ProductDetailsPage.jsx:592-607`): Dynamically iterates `Object.entries(product.specs)` to render 3-column specification cards (Grade, Standard, Yield Strength, Ductility, Dimension Ranges, etc.).
- **Related Products** (`ProductDetailsPage.jsx:611-657`): Dynamically filters out current SKU and displays up to 3 cross-sell products from the catalog.

---

## 4. Multi-Product Buyer Cart & Exact Mathematical Formulation

### 4.1 State Management & Persistence
- **File Path**: `src/context/CartContext.jsx` (134 lines)
- **Context Hook**: `useCart()` exported for global access across catalog cards, navbar badge, product detail pages, and cart page.
- **Storage Persistence**: `localStorage['urbanspan_buyer_cart']` initialized synchronously via lazy state initializer and synced on every mutation.

### 4.2 Mathematical Formulas & Calculations

$$\text{GST Rate} = 0.18 \quad (18\%)$$

$$\text{Line Subtotal} = \text{Quantity (MT)} \times \text{Base Price}$$

$$\text{Line GST} = \text{Line Subtotal} \times 0.18$$

$$\text{Line Total} = \text{Line Subtotal} + \text{Line GST} = \text{Line Subtotal} \times 1.18$$

$$\text{Total Quantity (MT)} = \sum_{i=1}^{n} \text{Quantity}_i$$

$$\text{Consignment Subtotal} = \sum_{i=1}^{n} \text{Line Subtotal}_i$$

$$\text{Consignment Total GST} = \text{Consignment Subtotal} \times 0.18$$

$$\text{Consignment Grand Total} = \text{Consignment Subtotal} + \text{Consignment Total GST} = \text{Consignment Subtotal} \times 1.18$$

### 4.3 Cart Operations & Mutation Handling
- `addToCart(product, quantity = 25)`: Checks existing item by `id` or `sku`. If present, merges quantity and recomputes all line totals; if absent, constructs new cart item object.
- `updateQuantity(productId, newQuantity)`: Clamps quantity to `Math.max(1, Number(newQuantity) || 1)` and recomputes line financials.
- `removeFromCart(productId)`: Filters item out by id/sku.
- `clearCart()`: Empties array and syncs storage.

### 4.4 Cart Page User Experience (`src/components/CartPage.jsx`)
- **Empty State**: Friendly industrial icon, explanation, and "Explore Commercial Steel Catalog" button.
- **Active Cart Grid (12-column layout)**:
  - **Left 7 Columns**: Line item cards with product thumbnail, category badge, base price, 18% GST badge, numeric stepper with `-5`/`+5` buttons, quick tonnage presets (25, 50, 100 MT), trash button, and line total.
  - **Right 5 Columns**: Consignment Valuation Card showing:
    - Base Material Subtotal (ex-plant)
    - Applicable GST @ 18% (HSN 7214) in emerald pill
    - Total Estimated Value (Base + 18% GST) in bold brand-steel font
    - Multi-Product RFQ dispatch form.

---

## 5. RFQ Submission Flow, Dynamic Schema Validation & CRM Leads Dispatch

### 5.1 Multi-Product Cart RFQ Transmission (`CartPage.jsx:48-138`)
- **API Endpoint**: `POST /api/external/forms/by-name/lead_capture/submit`
- **Composed Payload Structure**:
  ```json
  {
    "org_code": "urbanspan_steel_1764",
    "name": "Sourabh Khandelwal",
    "company": "Khandelwal Infrastructure Pvt Ltd",
    "email": "sourabh.khandelwal@khandelwalinfra.com",
    "phone": "+91 94259 22225",
    "source": "buyer_cart_rfq",
    "quantity": 125,
    "expected_value": 7062500,
    "notes": "Multi-Product Procurement Cart RFQ (125 MT Total Consignment):\n  1. Fe-550D TMT Steel Rebars - 50 MT @ ₹54,500/MT...\n  2. Heavy Structural ISMB I-Beams - 75 MT @ ₹58,200/MT...\nDestination Location: Indore Ring Road Project Site\nSite Notes: Standard Delivery",
    "custom_data": {
      "delivery_location": "Indore Ring Road Project Site",
      "site_notes": "Standard Delivery",
      "total_tonnage": 125,
      "base_subtotal": 7062500,
      "gst_18_amount": 1271250,
      "grand_total_with_tax": 8333750,
      "items_count": 2,
      "items": [...]
    },
    "items": [...]
  }
  ```
- **Post-Submission Lifecycle**:
  - Instant Confirmation Modal displayed with:
    - Generated Inquiry Reference ID (`RFQ-CONSIGNMENT-${timestamp}`)
    - Buyer Organization Confirmation
    - Total Consignment Tonnage Confirmation
    - Direct CTAs: "Track in Customer Portal" (`/portal`) and "Browse Steel Catalog" (`/products`).
  - Google Analytics 4 event `purchase_quote_intent` triggered.
  - Cart automatically cleared (`clearCart()`).

### 5.2 Standalone Dynamic RFQ Form (`DynamicForm.jsx` & `/rfq`)
- Fetches dynamic form schema from `GET /api/external/forms/by-name/lead_capture/schema`.
- Supports preselected product overrides (e.g. when clicked from catalog or details page).
- Tonnage quick chips (25, 30, 50, 100, 250, 500 MT).
- Live calculation banner showing Base Subtotal, 18% GST, and Total Valuation.
- Auto-populates buyer identity when logged in as a customer user.

---

## 6. Customer Self-Service Portal (`/portal`) & 5-Tier Dispatch Progress Tracker

### 6.1 Authentication & Session Persistence
- **File Path**: `src/components/CustomerPortal.jsx` (547 lines)
- **Login Endpoint**: `POST https://api.urbanspaninfra.co.in/api/external/customers/login`
- **Registration Endpoint**: `POST https://api.urbanspaninfra.co.in/api/external/customers/register`
- **Persistence Mechanism**:
  - `localStorage.setItem('urbanspan_customer_token', token)`
  - `localStorage.setItem('urbanspan_customer_user', JSON.stringify(customer))`
- **Verified Buyer Test Credentials**:
  - Email: `sourabh.khandelwal@khandelwalinfra.com`
  - Password: `Password123!`
- **Profile Header**: Displays Verified Client Account badge, user avatar with initial, company name, email, data refresh button, and sign out button.

### 6.2 Tab 1: 'My Inquiries & Spot Quotes'
- **Endpoint**: `GET /api/external/customers/me/inquiries` (Headers: `Authorization: Bearer <token>`, `x-org-code: urbanspan_steel_1764`).
- **Inquiry Card Features**:
  - Inquiry Title and submission date in Indian locale (`en-IN`).
  - Lifecycle Status Badge with color coding:
    - `new` -> "Received / Under Review" (Blue)
    - `contacted` -> "Sales Desk Assigned" (Amber)
    - `qualified` -> "Commercial Evaluation" (Indigo)
    - `proposal` -> "Official Quote Ready" (Purple)
    - `negotiation` -> "Rate Finalisation" (Pink)
    - `converted` -> "Contract Booked & Active" (Emerald)
    - `won` -> "Contract Approved" (Emerald)
    - `lost` -> "Closed" (Slate)
  - Assigned Sales Lead name and direct `tel:` click-to-call link for `assigned_rep_phone`.
  - Itemized steel specification list (product name, variant, requested quantity MT, unit price).
  - Inquiry notes and estimated commercial value.
  - 1-Click transition button for `converted`/`won` RFQs to jump directly to Active Supply Contracts.

### 6.3 Tab 2: 'Active Supply Contracts' & 5-Tier Dispatch Progress Tracker
- **Endpoint**: `GET /api/external/customers/me/orders`
- **Contract Details**: Contract Title, Deal Value (`₹{Number(order.deal_value).toLocaleString('en-IN')}`), Stage, Itemized manifests.
- **5-Tier Dispatch Progress Tracker** (`CustomerPortal.jsx:5-11, 314-344`):
  1. `order_confirmed` -> `1. Order Booked` (`FileText` icon)
  2. `mill_fabrication` -> `2. Mill Rolling` (`Factory` icon)
  3. `weighbridge_loaded` -> `3. Weighbridge Loaded` (`Scale` icon)
  4. `in_transit` -> `4. In Transit` (`Truck` icon)
  5. `delivered` -> `5. Delivered` (`CheckCircle` icon)
- **Visual State Rendering**:
  - **Completed Stages**: Emerald green circular icon badge (`bg-emerald-500 text-white`).
  - **Current Active Stage**: Indigo circular icon badge with glowing ring (`bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200`).
  - **Upcoming Stages**: Neutral slate circle (`bg-slate-200 text-slate-400`).

### 6.4 Sidebar Support & Live OTA App Info
- Key Account Director Card (Sunil Sharma).
- Operations & Logistics Coordinator Card (Vikram Patel).
- Live OTA System Status Card: Displays current version (`v1.2.0`), "Check OTA" button, and direct APK download button (`urbanspan-app-v3.apk`).

---

## 7. Floating Live Chat Widget Implementation

### 7.1 Component Architecture & Dual Modes
- **File Path**: `src/components/LiveChatWidget.jsx` (323 lines)
- **Desktop Mode** (`lines 224-322`):
  - Floating circular launcher at bottom-right (`fixed bottom-24 lg:bottom-6 right-6 z-50`) with pulsing status indicator.
  - Opens a 380x520px floating drawer window with backdrop blur and header.
- **Mobile Mode** (`lines 146-222`):
  - Full-screen route `/chat` (`h-[calc(100vh-64px)] bg-slate-50`) invoked from bottom tab bar or dashboard quick action.

### 7.2 Real-Time WebSocket & REST Subsystem
- **Protocol**: Socket.IO Client connected to `config.apiBaseUrl` (`transports: ['websocket', 'polling']`).
- **Connection Handshake**: `auth: { token: localStorage.getItem('urbanspan_customer_token') }`.
- **Lifecycle Flow**:
  1. Unauthenticated users see a lock banner prompting sign-in.
  2. Authenticated users fetch initial chat history from `GET /api/external/customers/me/chat`.
  3. Extracts `channel.id` and emits `join_channel` event to join client-specific channel room.
  4. Listens on `socket.on('new_message', (msg) => ...)` for real-time sales desk replies.
  5. User message dispatch:
     - Sends HTTP `POST /api/external/customers/me/chat/messages` with `{ content }`.
     - Upon API confirmation, emits `send_message` event over socket (`{ message: data.data, channel_id: channelId }`).
     - Includes optimistic UI appending if the socket connection is temporarily offline.
  6. Auto-scrolls message list on new incoming/outgoing messages.

---

## 8. Mobile Viewport Parity (390x844) & Dual-Mode UI

### 8.1 Dual-Viewport Switching Logic
- `isMobile = window.innerWidth < 1024` with resize listener in `src/App.jsx:120-126`.
- Desktop view features full header navigation, Hero section, and bottom footer.
- Mobile view features:
  - Sticky Top Header (`h-14`, logo, "Get Quote" quick action, "Portal" profile badge).
  - Mobile Home Dashboard (`src/components/MobileDashboard.jsx`):
    - Welcome / Client Status Greeting card.
    - 2x2 Quick Action Grid (Catalog, Get Quote, Portal, Live Chat) with touch targets > 48x48px.
    - Swipeable Latest News carousel with snap centering and hidden scrollbars.
    - System Info & OTA Update card.
  - Fixed 6-Tab Bottom Navigation Bar (`src/components/BottomTabBar.jsx`):
    - Height: `h-16`, `pb-safe`, `z-50`.
    - Tabs: Home, Catalog, Quote, News, Portal, Chat.
    - Active tab highlighting in `text-brand-steel` with bold label.
  - Full-screen `/chat` route replacing the desktop floating drawer.
  - Zero horizontal scroll overflow: `overflow-x-hidden` container protection on mobile routes.

---

## 9. Network & Interface Contracts Summary Table

| Endpoint / Channel | Method / Event | Headers / Auth | Payload / Request Body | Response / Effect |
|-------------------|----------------|----------------|------------------------|-------------------|
| `/api/external/products` | `GET` | `x-api-key`, `x-org-code` | None | Array of products with pricing, specs, images |
| `/api/external/forms/by-name/lead_capture/submit` | `POST` | `x-api-key`, `x-org-code` | `{ name, company, email, phone, quantity, expected_value, notes, custom_data, items }` | CRM Lead creation & reference ID generation |
| `/api/external/customers/login` | `POST` | `x-api-key`, `x-org-code` | `{ org_code, email, password }` | `{ data: { token, customer } }` |
| `/api/external/customers/register` | `POST` | `x-api-key`, `x-org-code` | `{ org_code, name, company, phone, email, password }` | `{ data: { token, customer } }` |
| `/api/external/customers/me/inquiries` | `GET` | `Bearer <JWT>`, `x-org-code` | None | Array of submitted RFQs with sales reps & statuses |
| `/api/external/customers/me/orders` | `GET` | `Bearer <JWT>`, `x-org-code` | None | Array of active supply contracts with 5-tier stages |
| `/api/external/customers/me/chat` | `GET` | `Bearer <JWT>`, `x-org-code` | None | Chat channel metadata & message history |
| `/api/external/customers/me/chat/messages` | `POST` | `Bearer <JWT>`, `x-org-code` | `{ content }` | Created message record |
| Socket.IO Gateway | `join_channel` | Socket Handshake JWT | `channelId` (string) | Joins room for bidirectional chat |
| Socket.IO Gateway | `send_message` | Socket Handshake JWT | `{ message, channel_id }` | Broadcasts message to CRM sales desk |
| Socket.IO Gateway | `new_message` | Socket Handshake JWT | None (Listener) | Ingests real-time incoming message |

---

## 10. Key Verification Observations & Recommendations

1. **Mathematical Rigor**: All calculations strictly adhere to:
   - Line Subtotal = Quantity * Base Price
   - Line GST = Line Subtotal * 0.18
   - Line Total = Line Subtotal * 1.18
   - Grand Total = Subtotal * 1.18
   - No floating-point rounding artifacts observed (`Math.round()` applied to rupees).
2. **Session Persistence**: JWT token and customer metadata are cleanly stored in `localStorage` under `urbanspan_customer_token` and `urbanspan_customer_user`.
3. **Graceful Fallbacks**: Products catalog gracefully falls back to `MOCK_STEEL_PRODUCTS` if the remote headless ERP is offline.
4. **Clean Codebase**: Production bundle builds with 0 errors (`vite build` in 672ms). Source files in `src/` have 0 oxlint errors.
