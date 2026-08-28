# BRIEFING — 2026-08-22T19:54:30+05:30

## Mission
Adversarially challenge and stress-test the Customer Self-Service Portal & Live Dispatch Tracker (/portal) (R2) for Milestone 2 (M2). Write generators, test harnesses, and empirically verify all auth attacks, dispatch tracker invariants, and rendering stress edge cases.

## 🔒 My Identity
- Archetype: empirical-challenger
- Roles: critic, specialist
- Working directory: C:\Users\gupta\.gemini\antigravity\scratch\urbanspan-website\.agents\teamwork_preview_challenger_m2
- Original parent: 577587b9-946a-43e8-9923-25812fcad8e5
- Milestone: Milestone 2 (M2) - Customer Portal & Live Dispatch Tracker (R2)
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code directly; write standalone test scripts in `src/tests` or dedicated test directory, and produce findings.
- Empirical verification mandatory: must execute verification tests via command line, no speculative assertions.
- .agents directory holds ONLY metadata (reports, briefings, progress, handoffs).

## Current Parent
- Conversation ID: 577587b9-946a-43e8-9923-25812fcad8e5
- Updated: 2026-08-22T19:54:30+05:30

## Review Scope
- **Files to review**: Customer portal components, auth stores/utilities, dispatch tracking components, order list/detail views, inquiry views.
- **Interface contracts**: ORIGINAL_REQUEST.md, PROJECT.md (R2 specification).
- **Review criteria**: Auth attack resilience, dispatch state invariants, numeric/rendering edge cases, zero uncaught exceptions/JS console errors.

## Attack Surface
- **Hypotheses tested**: [TBD]
- **Vulnerabilities found**: [TBD]
- **Untested angles**: [TBD]

## Loaded Skills
- None explicitly loaded.

## Key Decisions Made
- Initializing challenger workflow and empirical test plan.

## Artifact Index
- `challenger_report.md` — Complete adversarial test results, bug findings, risk assessment.
- `handoff.md` — 5-component handoff report.
- `progress.md` — Liveness and status heartbeat.
