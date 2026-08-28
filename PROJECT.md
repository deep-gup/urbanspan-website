# Project: UrbanSpan Web App & Customer Portal QA Assessment

## Architecture
UrbanSpan is an enterprise B2B steel procurement web application and customer self-service portal built with React 19, Vite 8, React Router v7, and Tailwind CSS v4. It integrates with a headless cloud API (`https://api.urbanspaninfra.co.in`) for product ingestion, CRM lead/RFQ capture, customer authentication, supply contracts, and bidirectional real-time support over Socket.IO WebSockets.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 UrbanSpan Web Platform                  │
                  │  (React 19 + React Router v7 + Tailwind CSS v4 + Vite)  │
                  └────────────┬────────────────────────────┬───────────────┘
                               │                            │
            ┌──────────────────┴───────────────┐            │
            ▼                                  ▼            ▼
┌───────────────────────┐          ┌───────────────────────┐ ┌───────────────────────┐
│ Commercial Journey    │          │ Customer Portal       │ │ Live Chat Subsystem   │
│ - Catalog & Search    │          │ - JWT Authentication  │ │ - Socket.IO WebSocket │
│ - AST Spec Parser     │          │ - Spot Quotes / RFQs  │ │ - Real-time Desk Chat │
│ - Multi-Product Cart  │          │ - 5-Tier Dispatch     │ │ - Mobile Fullscreen   │
│ - Lead Capture /leads │          │   Tracker             │ │   Drawer              │
└───────────┬───────────┘          └───────────┬───────────┘ └───────────┬───────────┘
            │                                  │                         │
            ▼                                  ▼                         ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                      Headless API (api.urbanspaninfra.co.in)                       │
│  - Products (/products)                      - Customer Auth (/customers/login)    │
│  - Leads & RFQs (/forms/by-name/lead_capture) - Contracts & Orders (/orders)        │
│  - Chat Channel & WS Gateway (/chat, WS)     - Inquiries (/inquiries)              │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Steel Catalog Navigation | Category filtering across TMT Rebars, Structural Steel, Plates & Sheets, Pipes | M1 | Survey (Exp 1, Spec 2) |
| 2 | SKU & Tag Search | Case-insensitive search across product names, SKUs, and steel grades | M1 | Survey (Exp 1) |
| 3 | Product Details & AST Specs | Custom markdown AST parser rendering headings, lists, tables, callouts | M1 | Survey (Exp 1) |
| 4 | Benchmark Pricing & 18% GST | Unit price display with 18% GST tax breakdown pill (`Base + 18% = Effective`) | M1 | Survey (Exp 1, Spec 2) |
| 5 | Tonnage Presets & Steppers | Preset tonnage selectors (25, 50, 100, 200 MT) and ±5 MT precision numeric stepper | M1 | Survey (Exp 1) |
| 6 | Multi-Product Cart Engine | Mathematical computation: Line Subtotal = Qty * Rate, GST = Subtotal * 0.18, Total = Subtotal * 1.18 | M1 | Survey (Exp 1, Spec 2) |
| 7 | Cart State Persistence | Browser `localStorage['urbanspan_buyer_cart']` serialization and hydration | M1 | Survey (Exp 1) |
| 8 | RFQ Form Validation & Dispatch | Form validation and payload transmission to `/api/external/forms/by-name/lead_capture/submit` | M1 | Survey (Exp 1, Spec 2) |
| 9 | Instant RFQ Confirmation Modal | Dynamic Reference ID generation (`RFQ-CONSIGNMENT-${timestamp}`) with next-step navigation | M1 | Survey (Exp 1) |
| 10 | Buyer Authentication Flow | Secure login with JWT issuance (30-day HS256) via `/api/external/customers/login` | M2 | Survey (Spec 2) |
| 11 | Session Persistence & Auth State | Token stored in `localStorage['urbanspan_customer_token']`, auto-hydrated on refresh | M2 | Survey (Spec 2) |
| 12 | Auth Error Handling | Proper 401 Unauthorized handling with user-friendly error banners | M2 | Survey (Spec 2) |
| 13 | 'My Inquiries & Spot Quotes' Tab | Real-time retrieval of submitted RFQs with status badges and click-to-call links | M2 | Survey (Exp 1, Spec 2) |
| 14 | 'Active Supply Contracts' Tab | Contract valuations, tonnage metrics, itemized manifests | M2 | Survey (Exp 1, Spec 2) |
| 15 | 5-Tier Dispatch Progress Tracker | Milestone progress: Order Booked → Mill Rolling → Weighbridge Loaded → In Transit → Delivered | M2 | Survey (Exp 1, Exp 3, Spec 2) |
| 16 | Mobile Viewport Parity (390x844) | Layout responsive breakpoint (<1024px) with zero horizontal overflow | M3 | Survey (Exp 3) |
| 17 | Touch Target Compliance | Fixed bottom tab bar with 65x64px touch targets (>44x44px standard) and `.pb-safe` padding | M3 | Survey (Exp 3) |
| 18 | Live Chat WebSocket Gateway | Socket.IO connection with JWT auth, channel joining, and bidirectional messaging | M3 | Survey (Exp 1, Spec 2) |
| 19 | Live Chat Unread & Layout | Pulsing unread badge, desktop drawer (380x520px) vs mobile full-screen `/chat` page | M3 | Survey (Exp 1, Exp 3) |
| 20 | Component State Resilience | Loading spinners, empty states, and fallback error alerts across all views | M3 | Survey (Exp 3) |
| 21 | Production Build & Zero JS Errors | Zero compilation errors, 0 runtime JS console errors across all workflows | M4 | Survey (Exp 1, Exp 3, Spec 2) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Customer Commercial Journey & RFQ Cart Auditing (R1) | Features 1-9: Catalog, Search, AST specs, Pricing/GST, Cart Math, RFQ Submission | none | DONE |
| M2 | Customer Self-Service Portal & Live Dispatch Tracker (R2) | Features 10-15: Authentication, Session, Inquiries, Active Contracts, 5-Tier Tracker | M1 | IN_PROGRESS |
| M3 | Mobile Parity & Real-Time Support Messaging (R3) | Features 16-20: 390x844 Viewport, Touch Targets, Socket.IO Live Chat, State Resilience | M1, M2 | PLANNED |
| M4 | Forensic Audit, Adversarial Verification & QA Report | Feature 21: Full E2E adversarial testing, Forensic Integrity Audit, QA Synthesis | M1, M2, M3 | PLANNED |

## Interface Contracts
### Commercial Journey ↔ Cart ↔ CRM Leads
- Cart State Schema: `{ items: Array<{ id, sku, name, category, base_price, quantity, unit, line_total }>, subtotal: number, gst: number, grand_total: number }`
- RFQ Submission Endpoint: `POST /api/external/forms/by-name/lead_capture/submit`
- Payload: `{ org_code, name, company, email, phone, quantity, expected_value, notes, custom_data: { cart_items, subtotal, gst, grand_total, lead_type: 'rfq_cart' } }`
- Response: `{ data: { entity_type: 'lead', id: string, success: true }, success: true }`

### Auth ↔ Customer Portal ↔ Orders API
- Login Endpoint: `POST /api/external/customers/login`
- Login Payload: `{ org_code: 'urbanspan_steel_1764', email, password }`
- Response: `{ data: { token: string, customer: { id, name, company, email, phone, status, gst_number } }, success: true }`
- Orders Endpoint: `GET /api/external/customers/me/orders` with `Authorization: Bearer <token>`
- Orders Schema: `Array<{ id, order_number, deal_name, deal_value, quantity_mt, dispatch_status: 'order_confirmed' | 'mill_fabrication' | 'weighbridge_loaded' | 'in_transit' | 'delivered', items: Array<{ name, sku, quantity, unit_price }> }>`

### Client ↔ WebSocket Gateway (Live Chat)
- Gateway URL: `https://api.urbanspaninfra.co.in` with `{ auth: { token } }`
- Events:
  - Client -> Server: `join_channel({ channel_id })`, `send_message({ channel_id, message })`
  - Server -> Client: `new_message({ id, channel_id, sender_type: 'customer' | 'admin', message, created_at })`

## Code Layout
- `src/App.jsx` — Core routing, layout switcher (desktop vs mobile), global providers
- `src/components/ProductCatalog.jsx` — Steel catalog, category filtering, search
- `src/components/ProductDetailsPage.jsx` — Product specifications, AST markdown parser, 18% GST calculation, tonnage presets
- `src/context/CartContext.jsx` — Cart state provider, mathematical calculation formulas, localStorage sync
- `src/components/CartPage.jsx` — Multi-product cart view, RFQ lead capture form, instant confirmation modal
- `src/components/CustomerPortal.jsx` — Buyer login, spot quotes tab, active contracts, 5-tier dispatch progress tracker
- `src/components/LiveChatWidget.jsx` — Socket.IO live chat client, messaging UI, unread indicators
- `src/components/BottomTabBar.jsx` — Mobile bottom navigation bar (6 tabs)
- `src/components/MobileDashboard.jsx` — Mobile home screen & carousels
- `src/services/headlessApi.js` — Axios API client, authentication helper, product fetching with fallback
