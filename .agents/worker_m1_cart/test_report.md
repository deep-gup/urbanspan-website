# Milestone M1 Detailed Test Report: Commercial Journey & Cart Auditing

**Auditor / Agent**: `worker_m1_cart` (Implementer / QA Specialist)  
**Execution Timestamp**: 2026-08-22T13:33:29Z  
**Target Web Application**: `https://urbanspaninfra.co.in`  
**Target Backend API**: `https://api.urbanspaninfra.co.in/api`  
**Result**: **PASSED (89 / 89 Assertions Passed, 0 Failures)**  

---

## 1. Executive Summary

An automated, adversarial verification campaign was executed against the UrbanSpan Infrastructure commercial frontend and headless distribution CRM backend.

All milestone requirements for **Milestone M1 (R1 Commercial Journey & Cart Auditing)** have been verified with automated test suites comprising **89 distinct assertions**:
1. **Steel Catalog Navigation & Filtering**: Dynamic category generation, category tabs (`All`, `Rebars`, `Structural Steel`, `Coils & Sheets`, `Piping & Tubes`, `Plates`), multi-field debounced search (`name`, `sku`, `tags`), and 1-click cart addition.
2. **Product Details & Calculators**: Dual-tier image gallery, AST markdown spec parser, live benchmark pricing, statutory **18% GST (HSN 7214)** tax breakdown pills (`Base Rate + 18% GST = Effective Rate/MT`), interactive tonnage steppers (`±5 MT`), and presets (`[25, 50, 100, 200] MT`).
3. **Multi-Product Cart Mathematical Exactness**: Strict mathematical invariant testing across single items, multi-product consignments, and a 100-cycle randomized stress simulation:
   $$\text{Line Subtotal} = \text{Quantity (MT)} \times \text{Base Price}$$
   $$\text{Line GST (18\%)} = \text{Line Subtotal} \times 0.18$$
   $$\text{Line Total} = \text{Line Subtotal} \times 1.18$$
   $$\text{Consignment Subtotal} = \sum \text{Line Subtotals}$$
   $$\text{Consignment Grand Total} = \text{Consignment Subtotal} \times 1.18 = \sum \text{Line Totals}$$
4. **RFQ Dispatch & CRM Ingestion**: Full transmission to `POST /api/external/forms/by-name/lead_capture/submit` and `POST /api/external/leads`, generating real CRM lead entities (`d75f5c0f-8b8d-4d6f-9c24-b43b99d3c54e`), instant confirmation modal with reference `RFQ-CONSIGNMENT-...`, and clean cart state resets.
5. **Console & Layout Parity**: **0 Uncaught JavaScript exceptions**, **0 Critical console errors**, and **0 horizontal scroll overflow** across Desktop (1440x900) and Mobile (390x844).

---

## 2. Test Suites Execution Breakdown

### Suite 1: Headless CRM & Commercial API Endpoints (`test_api_endpoints.js`)
- **Status**: PASSED (9 / 9 Assertions)
- **Verified Endpoints**:
  - `GET /api/external/products`: Returns HTTP 200 with standard payload `{ success: true, data: [...] }`. Validated products array (`TMT-ISI`, `TMT-GK`, `TMT-JINDAL`, `TMT-BHUMIJA`) and graceful rate-limiting fallback.
  - `GET /api/external/forms/by-name/lead_capture/schema`: Successfully ingested 8-field dynamic schema.
  - `POST /api/external/forms/by-name/lead_capture/submit`: Transmitted multi-product RFQ with structured `custom_data.items` array and `items` manifest, creating lead entity `d75f5c0f-8b8d-4d6f-9c24-b43b99d3c54e`.
  - `POST /api/external/leads`: Successfully ingested direct single-product lead `84f52cec-3318-4fee-8b36-250dc2b52641`.

### Suite 2: Multi-Product Cart Calculations & Mathematical Exactness (`test_cart_mathematics.js`)
- **Status**: PASSED (46 / 46 Assertions)
- **Scenarios Tested**:
  - **Scenario 1 (Single Product 25 MT)**:
    - Base: ₹54,500/MT $\times$ 25 MT = ₹13,62,500
    - GST (18%): ₹2,45,250
    - Total: ₹16,07,750 (Exact)
  - **Scenario 2 (Multi-Product 4-Category Consignment — 205 MT Total)**:
    - Item 1 (Rebars 100 MT @ ₹54,500): Subtotal ₹54,50,000 | GST ₹9,81,000 | Total ₹64,31,000
    - Item 2 (Structural Steel 50 MT @ ₹58,200): Subtotal ₹29,10,000 | GST ₹5,23,800 | Total ₹34,33,800
    - Item 3 (HR Coils 35 MT @ ₹52,800): Subtotal ₹18,48,000 | GST ₹3,32,640 | Total ₹21,80,640
    - Item 4 (ERW Pipes 20 MT @ ₹63,500): Subtotal ₹12,70,000 | GST ₹2,28,600 | Total ₹14,98,600
    - **Consignment Base Subtotal**: ₹1,14,78,000
    - **Consignment 18% GST**: ₹20,66,040
    - **Consignment Grand Total**: ₹1,35,44,040 (Exact, $\sum \text{Line Totals} = \text{Grand Total}$)
  - **Scenario 3 (Mutation, Duplicate Merging, & Removal)**:
    - Adding duplicate SKU merges quantity without creating duplicate rows.
    - In-cart stepper modifies line subtotals and updates consignment totals in real time.
    - Item deletion recalculates remaining manifest.
    - `clearCart()` resets count, tonnage, subtotal, and grand total to 0.
  - **Scenario 4 (Boundary & Edge Invariants)**:
    - Unpriced items (`base_price: null/0`) default safely to 0 without `NaN`.
    - Negative stepper inputs clamp to minimum 1 MT.
    - Large tonnage (10,000 MT = ₹70.8 Crores) matches exact integer math without floating-point overflow.
  - **Scenario 5 (100-Cycle Randomized Stress Simulation)**:
    - 100 randomized multi-item cart consignment tests passed with exact GST & Grand Total.

### Suite 3: E2E Commercial Journey & Cart Audit via Playwright (`test_e2e_commercial_journey.js`)
- **Status**: PASSED (34 / 34 Assertions)
- **Desktop (1440x900) Verification**:
  - Catalog header, filter buttons, debounced search bar verified.
  - 1-click "Add to Cart" button verified with visual checkmark feedback (`Added (25 MT)`).
  - Product details page route (`/products/:id`) verified with H1 heading, AST spec parser, benchmark rate, 18% GST breakdown pill, and tonnage steppers (`100 MT`).
  - Multi-product cart page (`/cart`) verified with Consignment Valuation card, line item breakdown, and stepper modification (`+5 MT`).
  - Commercial RFQ submission form completed with buyer info, notes, and site location, verifying confirmation receipt (`RFQ-CONSIGNMENT-...`) and portal CTA link.
- **Mobile (390x844) Parity Verification**:
  - Mobile Home: `clientWidth=390px, scrollWidth=390px` (0 horizontal overflow).
  - Mobile Bottom Tab Bar: `div.fixed.bottom-0` sticky bar rendered with `Catalog`, `Quote`, and `Portal` links.
  - Mobile Catalog: 0 horizontal overflow (390px <= 390px).
  - Mobile Cart: 0 horizontal overflow (390px <= 390px).
- **Console & Network Integrity**:
  - 0 Uncaught JavaScript exceptions.
  - 0 Critical JavaScript runtime console errors.

---

## 3. Verification Commands & Repro

To re-run the entire M1 verification suite independently:
```powershell
# In repository root
node .agents/worker_m1_cart/run_all_m1_tests.js
```
Individual test suites:
```powershell
# Direct API suite
node .agents/worker_m1_cart/test_api_endpoints.js

# Cart mathematics suite
node .agents/worker_m1_cart/test_cart_mathematics.js

# Playwright E2E browser suite
node .agents/worker_m1_cart/test_e2e_commercial_journey.js
```

---

## 4. Artifact Reference Index
- Master Audit Runner: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\worker_m1_cart\run_all_m1_tests.js`
- API Test Suite: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\worker_m1_cart\test_api_endpoints.js`
- Cart Math Suite: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\worker_m1_cart\test_cart_mathematics.js`
- Playwright E2E Suite: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\worker_m1_cart\test_e2e_commercial_journey.js`
- Structured Test Results: `C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\worker_m1_cart\test_results.json`
