# Quality Assessment & Feature Verification Plan

## Objective
Execute an exhaustive, adversarial multi-agent quality assessment, real-world customer persona simulation, and feature verification campaign across UrbanSpan's live customer-facing web application and self-service portal (https://urbanspaninfra.co.in) on desktop (1440x900) and mobile (390x844) viewports.

## Workflow Phases

### Phase 0: Survey & Scope Mapping (Exploration)
- Dispatch 3 parallel Explorers:
  1. `explorer_catalog_rfq`: Explore catalog structure, categories, search, pricing formulas, GST computation, cart state management, and RFQ submission API endpoints.
  2. `explorer_portal_auth`: Explore customer portal `/portal`, authentication flow, session persistence, contract tracking endpoints, dispatch stages, and CRM `/leads` reflection.
  3. `explorer_mobile_chat`: Explore mobile responsiveness (390x844), CSS layouts/viewports, touch navigation, and WebSocket live chat widget architecture.
- Synthesize survey findings into `PROJECT.md` with comprehensive Feature Inventory and Interface Contracts.

### Phase 1: Test Infrastructure & Verification Automation (Implementation Track)
- Dispatch Worker / Test Writer to implement automated E2E test suites covering:
  - R1: Catalog navigation, search/filter, bundle calculators, exact mathematical pricing, and RFQ submission to CRM.
  - R2: Portal login with verified credentials (`sourabh.khandelwal@khandelwalinfra.com` | `Password123!`), session persistence, inquiry tracking, and active supply contract 5-tier dispatch tracker.
  - R3: Mobile viewport layout parity (390x844), touch targets, horizontal scroll overflow check, and Live Chat WebSocket communication.

### Phase 2: Persona Simulation & Adversarial Verification
- Simulate real-world buyer personas (e.g. Large Infrastructure Contractor purchasing 120 MT TMT Rebars & Structural Steel, Tier-2 Regional Builder, Mobile Site Engineer submitting spot quote).
- Dispatch Challengers to perform adversarial edge testing: zero quantity, extreme quantities, network timeouts, invalid inputs, rapid cart mutations, session expiration, and mobile viewport resizing.

### Phase 3: Forensic Integrity Audit & Multi-Agent Review
- Dispatch Independent Reviewers to verify all acceptance criteria and test execution evidence.
- Dispatch Forensic Auditor (`teamwork_preview_auditor`) to verify zero mock/facade implementations, genuine network transactions, true CRM persistence, and accurate calculations.

### Phase 4: Final Gate & Reporting
- Synthesize all reports and evidence.
- Provide comprehensive findings report to Sentinel and user.
