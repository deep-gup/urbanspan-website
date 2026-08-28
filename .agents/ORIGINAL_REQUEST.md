# Original User Request

## 2026-08-22T13:54:29Z

Execute an exhaustive, adversarial multi-agent quality assessment, real-world customer persona simulation, and feature verification campaign across UrbanSpan's live customer-facing web application and self-service portal (https://urbanspaninfra.co.in) on both desktop (1440x900) and mobile (390x844) viewports.

Working directory: C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website
Integrity mode: development

## Target Environment & Credentials
- Web App URL: https://urbanspaninfra.co.in
- Customer Portal URL: https://urbanspaninfra.co.in/portal
- Verified Buyer Credentials: sourabh.khandelwal@khandelwalinfra.com | Password123!

## Requirements

### R1. Customer Commercial Journey & RFQ Cart Auditing
- Verify steel catalog navigation, search, and category filtering across TMT Rebars, Structural Steel, Plates & Sheets, and Pipes.
- Verify product details pages: specifications, bundle calculators, benchmark pricing, and 18% GST tax breakdowns.
- Test multi-product cart calculations: enforce mathematical exactness (Quantity * Rate/MT = Line Total, Subtotal * 1.18 = Consignment Total).
- Test RFQ submission flow: form validation, transmission to backend CRM (/leads), and instant confirmation modal.

### R2. Customer Self-Service Portal & Live Dispatch Tracker (/portal)
- Test customer authentication, session persistence, and error handling.
- Verify 'My Inquiries & Spot Quotes' tab: real-time reflection of submitted RFQs and status updates.
- Verify 'Active Supply Contracts' tab: contract valuation, line items, and the 5-Tier Dispatch Progress Tracker (Order Confirmed → Mill Fabrication → Weighbridge Loaded → In Transit → Delivered to Site).

### R3. Mobile Parity & Real-Time Support Messaging
- Audit mobile responsiveness (390x844 viewport): navigation bar, touch targets, bottom bar, modal sheets, and zero horizontal scroll overflow.
- Test floating Live Chat Widget: bidirectional WebSocket messaging with CRM sales desk, unread indicators, and mobile viewport positioning.

## Acceptance Criteria

### Commercial Journey & Calculations
- [ ] Catalog, product details, cart, and RFQ form operate with 0 JavaScript console errors across desktop and mobile.
- [ ] Cart calculations mathematically match Subtotal * 1.18 = Consignment Total without rounding discrepancies.
- [ ] Submitted RFQs appear instantaneously in CRM Leads with matching customer and item details.

### Portal & Dispatch Tracker
- [ ] Customer portal loads verified profile badge and correct commercial data for logged-in client.
- [ ] Active supply contracts display correct 5-tier dispatch stages and tonnage progress bars.

### Mobile & Dark/Light Mode Integrity
- [ ] 0 layout breaks, clipped text, or horizontal scroll overflow on mobile (390x844).
- [ ] Floating live chat opens smoothly without obscuring essential touch navigation.
