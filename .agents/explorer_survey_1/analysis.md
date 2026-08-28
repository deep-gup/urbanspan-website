# Technical Analysis: R1 - Customer Commercial Journey & RFQ Cart Auditing

**Target System**: UrbanSpan Infrastructure Customer Web App & Self-Service Portal  
**Live Target**: https://urbanspaninfra.co.in  
**Backend API**: https://api.urbanspaninfra.co.in/api  
**Investigator**: `explorer_survey_1`  
**Date**: 2026-08-22  

---

## 1. Executive Summary

An exhaustive codebase and live API investigation was conducted on UrbanSpan's commercial procurement workflow, product catalog, product details pages, multi-product cart engine, and RFQ submission pipeline. 

The architecture is built on **React 19 + Vite 8 + Tailwind CSS 4 + React Router v7 + Capacitor 8**, interfacing with a headless CRM / ERP distribution backend (`api.urbanspaninfra.co.in`).

### Key Verification Highlights
1. **Catalog & Filtering**: Complete dynamic category generation (`Rebars`, `Structural Steel`, `Coils & Sheets`, `Piping & Tubes`, `Plates`), debounced multi-field search (`name`, `sku`, `tags`), and instant 1-click cart addition (default 25 MT).
2. **Product Details & Calculators**: Dual-tier image gallery with thumbnail navigator, rich markdown parser for technical descriptions, dynamic IS/BIS specifications matrix, interactive tonnage selectors (`[25, 50, 100, 200] MT` + `±5 MT` steppers), and real-time 18% GST (HSN 7214) tax breakdown.
3. **Cart Mathematics & State Management**: Strict adherence to mathematical exactness:
   - Line Item: $\text{Quantity} \times \text{Base Price} = \text{Line Subtotal}$
   - Line Tax: $\text{Line Subtotal} \times 0.18 = \text{Line GST}$
   - Line Total: $\text{Line Subtotal} + \text{Line GST} = \text{Line Subtotal} \times 1.18$
   - Consignment Valuation: $\text{Subtotal} = \sum \text{Line Subtotals}$
   - Consignment GST: $\text{Total GST} = \text{Subtotal} \times 0.18$
   - Grand Total: $\text{Subtotal} + \text{Total GST} = \text{Subtotal} \times 1.18$
   - State persisted in `localStorage['urbanspan_buyer_cart']`.
4. **RFQ Dispatch & CRM Pipeline**:
   - Single-product RFQs route via `DynamicForm` (`/rfq`) submitting to `POST /api/external/forms/by-name/lead_capture/submit`.
   - Multi-product bulk consignments route via `CartPage` (`/cart`), formatting full line item specifications into `custom_data.items` and top-level `items`.
   - Real-time confirmation modal/card generated with unique inquiry reference `RFQ-CONSIGNMENT-...` and direct navigation to Customer Portal (`/portal`).

---

## 2. Steel Catalog Architecture & Navigation

### 2.1 File & Component Mapping
- **Primary Catalog Component**: `src/components/ProductCatalog.jsx`
- **Route Definitions**: `src/App.jsx` (`/` on desktop, `/products` on desktop & mobile)
- **API Fetching Service**: `src/services/headlessApi.js` (`fetchSteelProducts`)

### 2.2 Data Sourcing & Fallbacks
`fetchSteelProducts()` performs an HTTP `GET` request to:
`https://api.urbanspaninfra.co.in/api/external/products`  
Headers: `x-api-key`, `x-org-code: urbanspan_steel_1764`

- **Live Database Response**: 4 primary TMT rebar items (`TMT-ISI`, `TMT-GK`, `TMT-JINDAL`, `TMT-BHUMIJA`).
- **Offline / Local Mock Fallback**: 6 primary steel products across all core categories:
  1. `US-TMT-550D` - Fe-550D TMT Steel Rebars (Category: `Rebars`, ₹54,500/MT)
  2. `US-STR-ISMB` - Heavy Structural ISMB I-Beams & Columns (Category: `Structural Steel`, ₹58,200/MT)
  3. `US-COIL-HR` - Hot Rolled (HR) Steel Coils & Sheets (Category: `Coils & Sheets`, ₹52,800/MT)
  4. `US-COIL-CRCA` - Cold Rolled (CR) Close Annealed Steel Sheets (Category: `Coils & Sheets`, ₹61,000/MT)
  5. `US-PIPE-ERW` - ERW & Seamless Heavy Steel Piping (Category: `Piping & Tubes`, ₹63,500/MT)
  6. `US-PLT-CARBON` - Heavy Carbon Steel Boiler & Structural Plates (Category: `Plates`, ₹59,000/MT)

### 2.3 Category Filtering & Search Mechanism
- **Category Filter**:
  ```javascript
  const uniqueCategories = Array.from(
    new Set(products.map(p => p.category).filter(c => typeof c === 'string' && c.trim() !== ''))
  );
  const categories = ['All', ...uniqueCategories];
  ```
  Matches using: `selectedCategory === 'All' || p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()`.
- **Search Query**:
  Matches case-insensitively against:
  1. `p.name`
  2. `p.sku`
  3. `p.tags` array elements

### 2.4 Catalog Card Features
- High-resolution product imagery with hover zoom (`group-hover:scale-105`).
- Visual status badges (e.g. `Primary Steel`, `BIS Certified`, `Fe 550D`, `In Stock & Ready`).
- Markdown excerpt cleaner (`getCleanDescriptionExcerpt`) stripping markdown symbols and truncating cleanly to 140 characters.
- Benchmark pricing with `+ 18% GST (Ex-mill)` notation or "Price on Request" fallback if base price is null.
- Instant "Add to Cart" button (adds 25 MT with 2-second checkmark feedback animation).
- "Quote RFQ" button transitioning to `/rfq` with pre-filled SKU and product metadata.

---

## 3. Product Details Page & Specifications Engine

### 3.1 File & Component Mapping
- **Component**: `src/components/ProductDetailsPage.jsx`
- **Route**: `src/App.jsx` (`/products/:id`)

### 3.2 Product Identification & Gallery
- Matches product by `p.sku === id || p.id === id`.
- **Gallery**: Responsive 4:3 main stage image viewer + horizontal thumbnail navigation strip with active focus ring (`selectedImageIndex`).
- **Web Share API & Clipboard Fallback**: Uses `navigator.share` on supported devices, with clipboard copy fallback and "Link Copied!" visual indicator.

### 3.3 Rich Content & Markdown Rendering
Custom AST parser `renderFormattedDescription` converts raw markdown without external DOM injection:
- Headings: `#`, `##`, `###` with brand steel accent bars.
- Blockquotes: `> ` rendered as custom callout panels.
- Bullet Lists (`- `, `* `, `• `) and Numbered Lists (`1. `).
- Inline formatting: Bold (`**...**`), Italics (`*...*`), and Links (`[...]`).
- Expandable / Collapsible container with gradient fade mask and "Read Full Overview & Specifications" toggle.

### 3.4 Benchmark Pricing & 18% GST Tax Breakdown
Displays ex-plant base rate and statutory 18% GST:
- Base Rate: `₹{Number(product.base_price).toLocaleString('en-IN')} / Metric Ton (ex-plant)`
- GST Breakdown Pill:
  - `Applicable GST @ 18%: +₹{Math.round(product.base_price * 0.18).toLocaleString('en-IN')}/MT`
  - `Effective: ₹{Math.round(product.base_price * 1.18).toLocaleString('en-IN')}/MT`
- HSN Code annotation (HSN 7214).

### 3.5 Tonnage Calculator & Stepper
- Quick preset selector buttons: `25 MT`, `50 MT`, `100 MT`, `200 MT`.
- Step increments: `+5 MT` and `-5 MT` buttons, plus direct integer input (enforcing `min="1"`).
- Action buttons:
  - `Add {customTonnage} MT to Cart`: updates global cart context with 2.5s success state.
  - `Inquire For Bulk Supply / Dispatch ({customTonnage} MT)`: navigates directly to commercial RFQ form.

### 3.6 Structured Data & Technical Specs Matrix
- Schema.org JSON-LD `Product` schema injected via `SEO.jsx` with `@type: "Product"`, `offers`, `sku`, `brand`.
- Specifications grid mapping all entries in `product.specs` or `product.specifications` (e.g. Grade, Standard, Yield Strength, Ductility, Raw Material, Diameter Range).
- Related products cross-linking: 3 relevant products rendered at the bottom for catalog discovery.

---

## 4. Multi-Product Cart & State Management Auditing

### 4.1 State Store Implementation (`src/context/CartContext.jsx`)
- **Storage**: `localStorage` key `'urbanspan_buyer_cart'`.
- **Constant**: `GST_RATE = 0.18` (18%).

### 4.2 Mathematical Formulas & Calculations

| Metric | Formula | Implementation Code |
|---|---|---|
| **Line Subtotal** | $\text{Qty} \times \text{Base Price}$ | `const lineSubtotal = qty * basePrice;` |
| **Line GST (18%)** | $\text{Line Subtotal} \times 0.18$ | `const lineGst = lineSubtotal * GST_RATE;` |
| **Line Total** | $\text{Line Subtotal} + \text{Line GST}$ | `const lineTotal = lineSubtotal + lineGst;` |
| **Total Items Count** | $\text{Count of unique products}$ | `const totalCount = cartItems.length;` |
| **Total Tonnage** | $\sum \text{Qty}_i$ | `cartItems.reduce((acc, item) => acc + item.quantity, 0);` |
| **Consignment Subtotal** | $\sum \text{Line Subtotal}_i$ | `cartItems.reduce((acc, item) => acc + item.lineSubtotal, 0);` |
| **Consignment 18% GST** | $\text{Subtotal} \times 0.18$ | `const totalGst = subtotal * GST_RATE;` |
| **Consignment Grand Total** | $\text{Subtotal} + \text{Total GST}$ | `const grandTotal = subtotal + totalGst;` |

### 4.3 Verification of Mathematical Consistency
For any given cart configuration:
$$\text{Grand Total} = \text{Subtotal} + (\text{Subtotal} \times 0.18) = \text{Subtotal} \times 1.18$$
$$\sum \text{Line Total}_i = \sum (\text{Line Subtotal}_i \times 1.18) = (\sum \text{Line Subtotal}_i) \times 1.18 = \text{Grand Total}$$
No rounding discrepancies or formula drift exist across item cards, summary panels, and submission payloads.

### 4.4 Cart User Interface (`src/components/CartPage.jsx`)
- **Empty State**: Friendly CTA with "Explore Commercial Steel Catalog" button.
- **Active State**:
  - Item cards: Product thumbnail, category, title, trash button, unit base price, 18% GST badge, stepper controls (`-5`, `+5`), quick chips (`25, 50, 100 MT`), line total.
  - Valuation summary card: Base material subtotal, 18% GST breakdown, total estimated value, statutory tax & logistics disclaimer.
  - Direct RFQ checkout form.
- **Navbar Integration**: Floating cart button with live item count badge (`totalCount`) and aggregate consignment tonnage tag (`totalQuantity MT`).

---

## 5. RFQ Submission Flow & CRM Integration

### 5.1 Submission Pipelines

```
[Buyer Commercial Journey]
         │
         ├─── Single Product: Product Page / RFQ Page
         │         │
         │         ▼
         │   DynamicForm.jsx
         │   (fetches schema: GET /external/forms/by-name/lead_capture/schema)
         │   (submits payload: POST /external/forms/by-name/lead_capture/submit)
         │         │
         │         ▼
         │   CRM Lead Entity Created (ff448c0f-...)
         │
         └─── Multi-Product Consignment: CartPage.jsx
                   │
                   ▼
             CartPage.jsx
             (composes itemized consignment breakdown)
             (submits payload: POST /external/forms/by-name/lead_capture/submit)
                   │
                   ▼
             CRM Lead Entity Created + Custom Data Items Breakdown
```

### 5.2 Multi-Product RFQ Payload Structure
```json
{
  "name": "Sourabh Khandelwal",
  "company": "Khandelwal Infra Developers",
  "email": "sourabh.khandelwal@khandelwalinfra.com",
  "phone": "+91 99887 76655",
  "source": "buyer_cart_rfq",
  "quantity": 100,
  "expected_value": 5650000,
  "notes": "Multi-Product Procurement Cart RFQ (100 MT Total Consignment):\n  1. JINDAL PANTHER TMT - 100 MT @ ₹56,500/MT (Base: ₹5,650,000, GST: ₹1,017,000)\nDestination Location: Indore Ring Road Project Site\nSite Notes: Standard Delivery",
  "custom_data": {
    "delivery_location": "Indore Ring Road Project Site",
    "site_notes": "Standard Delivery",
    "total_tonnage": 100,
    "base_subtotal": 5650000,
    "gst_18_amount": 1017000,
    "grand_total_with_tax": 6667000,
    "items_count": 1,
    "items": [
      {
        "product_id": "edfffef5-f50d-4e7c-82bd-bfb671f5b70a",
        "sku": "TMT-JINDAL",
        "product_name": "JINDAL PANTHER TMT",
        "category": "Rebars",
        "quantity": 100,
        "base_price": 56500,
        "unit": "ton",
        "line_subtotal": 5650000,
        "gst_18": 1017000,
        "line_total": 6667000
      }
    ]
  },
  "items": [
    {
      "product_id": "edfffef5-f50d-4e7c-82bd-bfb671f5b70a",
      "sku": "TMT-JINDAL",
      "product_name": "JINDAL PANTHER TMT",
      "category": "Rebars",
      "quantity": 100,
      "base_price": 56500,
      "unit": "ton",
      "line_subtotal": 5650000,
      "gst_18": 1017000,
      "line_total": 6667000
    }
  ]
}
```

### 5.3 Confirmation & Post-Submission Mechanics
1. Response received: `{ success: true, data: { entity_type: 'lead', id: '...', success: true } }`.
2. Cart state is cleared (`clearCart()`).
3. Confirmation Card displayed containing:
   - Generated inquiry reference (`RFQ-CONSIGNMENT-${Date.now().toString().slice(-6)}`).
   - Buyer Organization name.
   - Total Consignment Tonnage.
   - 1-click CTA button "Track in Customer Portal" (`/portal`).
   - CTA button "Browse Steel Catalog" (`/products`).
4. Google Analytics 4 event dispatched: `purchase_quote_intent` with consignment valuation, items, currency (`INR`).

---

## 6. Endpoints, Data Stores, & Edge Case Analysis

### 6.1 Endpoints Inventory
| Method | Endpoint | Purpose | Scope |
|---|---|---|---|
| `GET` | `/api/external/products` | Retrieve catalog inventory & benchmark prices | Public |
| `POST` | `/api/external/leads` | Direct single-product lead ingestion | Public (API Key) |
| `GET` | `/api/external/forms/by-name/:name/schema` | Retrieve schema fields for dynamic forms | Public (Org Code) |
| `POST` | `/api/external/forms/by-name/:name/submit` | Submit single or multi-item RFQs | Public (Org Code) |
| `POST` | `/api/external/customers/login` | Authenticate client buyer session | Public |
| `POST` | `/api/external/customers/register` | Register new customer account | Public |
| `GET` | `/api/external/customers/me/inquiries` | Retrieve customer's submitted RFQs & quotes | Authenticated (JWT) |
| `GET` | `/api/external/customers/me/orders` | Retrieve customer's active contracts & dispatches | Authenticated (JWT) |

### 6.2 Data Stores
- `localStorage['urbanspan_buyer_cart']`: Serialized array of `CartItem` objects.
- `localStorage['urbanspan_customer_user']`: Authenticated user profile (`name`, `email`, `company`, `phone`, `party_id`).
- `localStorage['urbanspan_customer_token']`: Customer JWT auth token for portal data fetching.
- `localStorage['urbanspan_api_config']`: Local override config for API URL, Key, and Org Code.

### 6.3 Edge Cases & Resiliency Matrix
1. **Unpriced Products (`base_price: null`)**:
   - Live products such as `TMT-ISI` and `TMT-BHUMIJA` have null base prices.
   - UI gracefully renders "Price on Request" or "Market Rate on Request".
   - Adding to cart assigns `base_price: 0`, preventing `NaN` rendering in cart totals.
2. **Quantity Bounds**:
   - Stepper inputs clamp minimum value to `1` via `Math.max(1, Number(val))`.
   - Prevents negative tonnages or divide-by-zero errors.
3. **Network Failure / Offline Catalog**:
   - `fetchSteelProducts` encapsulates an automatic `try/catch` fallback returning `MOCK_STEEL_PRODUCTS` (6 items across 5 steel categories).
4. **Session Pre-fill**:
   - When a customer is logged into `/portal`, `customerUser` props automatically hydrate RFQ contact fields (`name`, `company`, `email`, `phone`), minimizing checkout friction.
