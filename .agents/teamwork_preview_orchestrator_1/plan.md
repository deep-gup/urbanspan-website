# QA Assessment & Feature Verification Plan: UrbanSpan

## Objective
Execute an exhaustive, adversarial quality assessment and feature verification campaign of UrbanSpan's live web app (https://urbanspaninfra.co.in) and Customer Self-Service Portal (https://urbanspaninfra.co.in/portal).

## Phases & Steps
### Phase 0: Survey & Technical Mapping
- Spawn 3 parallel Explorer/Spec Miner agents:
  1. Explorer 1: Codebase structure, local repo inspection, frontend components, routing, cart logic, API client.
  2. Spec Miner 2: Live endpoints inspection, API contracts (/leads, auth, portal endpoints, WebSocket live chat protocol).
  3. Explorer 3: Mobile responsiveness, CSS/viewport rules, portal views, dispatch tracking data structures.
- Consolidate findings into `PROJECT.md` with complete Feature Inventory.

### Phase 1: M1 — Customer Commercial Journey & RFQ Cart Auditing (R1)
- Verify catalog navigation, category filtering (TMT Rebars, Structural Steel, Plates & Sheets, Pipes), and search.
- Verify product detail pages, bundle calculators, benchmark pricing, 18% GST breakdowns.
- Adversarially test multi-product cart calculations for mathematical exactness (Quantity * Rate/MT = Line Total, Subtotal * 1.18 = Consignment Total).
- Test RFQ submission flow, form validation, `/leads` backend transmission, instant confirmation modal.
- Verify 0 JS console errors.

### Phase 2: M2 — Customer Self-Service Portal & Live Dispatch Tracker (R2)
- Test customer authentication with buyer credentials (`sourabh.khandelwal@khandelwalinfra.com` | `Password123!`), session persistence, and error handling.
- Verify 'My Inquiries & Spot Quotes' tab for real-time reflection of submitted RFQs.
- Verify 'Active Supply Contracts' tab: valuation, line items, 5-tier dispatch tracker (Order Confirmed → Mill Fabrication → Weighbridge Loaded → In Transit → Delivered to Site), tonnage progress bars.
- Verify buyer profile badge and commercial data integrity.

### Phase 3: M3 — Mobile Parity & Real-Time Support Messaging (R3)
- Audit mobile responsiveness on 390x844 viewport: navigation bar, touch targets, bottom bar, modal sheets, zero horizontal overflow.
- Test floating Live Chat widget: WebSocket bidirectional messaging with CRM sales desk, unread indicators, mobile viewport positioning without obscuring touch navigation.

### Phase 4: Final Synthesis, Forensic Audit & Human Reporting
- Run Forensic Integrity Audit (`teamwork_preview_auditor`).
- Compile comprehensive QA Assessment Report detailing all tests, evidence chains, pass/fail matrices, discovered bugs/anomalies, and remediation guidance.
- Report results to human/parent.
