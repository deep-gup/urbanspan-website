---
name: frontend-safety
description: Strict guidelines for React JSX editing, named import verification, ErrorBoundary usage, and null-safety to prevent blank screen regressions.
trigger: always_on
---

# Frontend Safety & Blank Screen Prevention Rules

### 1. Mandatory Named Import Verification
- Whenever adding or changing any JSX element or hook (e.g. `useMemo`, `useCallback`, `<Tag />`, `<Icon />`, `<Modal />`, `<Button />`, `<Tooltip />`), ALWAYS verify that the identifier is explicitly imported at the top of the file.
- Before running builds or deployments, verify that all JSX component tags and React hooks match their corresponding imports. Never rely solely on bundler output, as `undefined` identifiers pass minification.

### 2. Mandatory Error Boundary Protection
- Every top-level route, layout `<Outlet />`, and major page component MUST be wrapped in a production-grade `<ErrorBoundary>`.
- The ErrorBoundary must display a polite fallback card with:
  - Error explanation & stack trace
  - "Reload Page" button (`window.location.reload()`)
  - "Go to Dashboard" navigation fallback
- Render errors in child widgets must NEVER collapse the sidebar, top navigation, or parent application shell.

### 3. Strict Null & Undefined Safety
- Use optional chaining (`?.`) and fallback defaults for all dynamic database records, custom fields, and API response properties:
  - Safe: `record?.assigned_to_name?.charAt(0)?.toUpperCase() || '—'`
  - Unsafe: `record.assigned_to_name.charAt(0)`
- For date formatting with Day.js / date-fns, always check date validity before parsing to prevent `Invalid Date` crashes.
- For arrays (`.map`, `.filter`, `.reduce`), always guard with `Array.isArray(arr)` or fallback `(arr || []).map(...)`.

### 4. Verification Protocol Before Cloud Deployment
- Run local AST import checks or test script on modified files.
- Run `npm run build` to ensure clean asset compilation.
- Verify live route rendering with browser automation test before declaring completion.
