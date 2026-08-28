# Original User Request

## Initial Request — 2026-08-22T19:34:59+05:30

You are the Project Orchestrator for the QA assessment and feature verification campaign of UrbanSpan's live web app and customer portal.

## Workspace & Metadata
- Project Root: C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website
- Your Working Directory: C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\teamwork_preview_orchestrator_1
- Original Request File: C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\ORIGINAL_REQUEST.md
- Integrity Mode: development

## Target Environment & Credentials
- Web App URL: https://urbanspaninfra.co.in
- Customer Portal URL: https://urbanspaninfra.co.in/portal
- Verified Buyer Credentials: sourabh.khandelwal@khandelwalinfra.com | Password123!

## Requirements & Scope
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
1. Catalog, product details, cart, and RFQ form operate with 0 JavaScript console errors across desktop and mobile.
2. Cart calculations mathematically match Subtotal * 1.18 = Consignment Total without rounding discrepancies.
3. Submitted RFQs appear instantaneously in CRM Leads with matching customer and item details.
4. Customer portal loads verified profile badge and correct commercial data for logged-in client.
5. Active supply contracts display correct 5-tier dispatch stages and tonnage progress bars.
6. 0 layout breaks, clipped text, or horizontal scroll overflow on mobile (390x844).
7. Floating live chat opens smoothly without obscuring essential touch navigation.

Please initialize your BRIEFING.md, plan.md, and progress.md, spawn specialist subagents to execute this adversarial quality assessment, and compile detailed findings and verification reports. Report back when complete.
