# API Gateway & Routing Security Hardening Plan

**Member 1:** A.L.M. Athulathmudali (`IT21129544`)  
**Core Component:** API Gateway & Docker Infrastructure  
**Assigned Git Branch:** `feature/gateway-security-hardening` (active: `fix/gateway-security-hardening`)  
**Target Module:** `api-gateway`  
**Governing Standards:** OWASP Top 10:2021 (A05:2021 – Security Misconfiguration), DevSecOps Hardening Rules (`.agents/rules/rules.md`)

---

## Executive Summary & Objective

This document outlines the phased engineering roadmap for remediating critical security misconfigurations in the Express-based API Gateway. The fixes address missing defensive HTTP response headers, permissive CORS policies, rate-limiting defense-in-depth, and reverse-proxy integrity for Google OAuth 2.0 / OIDC authentication flows. All remediations are backed by automated Jest/Supertest test suites and verified against OWASP ZAP DAST scan rules (10020, 10021, 10038, 10049).

---

## Architectural & Security Invariants

1. **Strict Pipeline Execution Order (`src/server.js`):**
   ```
   [1. Response Header Security (Helmet)]
                    │
                    ▼
   [2. Origin Authorization & Preflight (CORS)]
                    │
                    ▼
   [3. Traffic Shaping & Protection (Rate Limiter & Logger)]
                    │
                    ▼
   [4. Health Checks & Proxy Dispatchers (Reverse Proxy Engine)]
   ```
2. **Modular Separation of Concerns:**
   - No arbitrary inline security middleware configuration inside `server.js`.
   - Security headers configuration isolated in `src/config/securityHeaders.js`.
   - CORS policy configuration isolated in `src/config/corsConfig.js`.
   - All modules export testable factory functions and option dictionaries.
3. **Fail-Secure Configuration:**
   - Environmental variables with strictly validated fallbacks.
   - Zero tolerance for wildcard reflections (`*`) when credentials are enabled.
   - Complete suppression of runtime fingerprinting (`X-Powered-By`).
4. **OAuth 2.0 / Reverse-Proxy Invariance:**
   - Unaltered pass-through of HTTP `302`/`307` redirects from downstream services.
   - Non-destructive forwarding of query strings (`code`, `state`), `Authorization` headers, and cookies.

---

## Detailed Execution Phases & Subphases

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Environment & Dependency Baseline Preparation                 │
│  ├─ 1.1: Git Branch & Test Baseline Verification                       │
│  ├─ 1.2: Dependency Management (Add helmet to package.json)            │
│  └─ 1.3: Gateway Environment Variable Modeling & Defaults              │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Defensive HTTP Headers Implementation (OWASP A05:2021)        │
│  ├─ 2.1: Modular Security Headers Configuration (src/config/...)       │
│  ├─ 2.2: Technology Profile Masking (X-Powered-By Suppression)         │
│  └─ 2.3: Security Headers Test Suite (tests/unit/securityHeaders...)   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: CORS Policy Hardening & Preflight Control (OWASP A05:2021)    │
│  ├─ 3.1: Dynamic Whitelist Origin Authorization Module                 │
│  ├─ 3.2: Immediate Preflight (OPTIONS) Termination & Method Whitelisting│
│  └─ 3.3: CORS Policy Test Suite (tests/unit/corsPolicy.test.js)        │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Gateway Pipeline Restructuring & Traffic Shaping              │
│  ├─ 4.1: Server Pipeline Reordering in src/server.js                   │
│  ├─ 4.2: Rate Limiter Hardening & Proxy Trust Configuration            │
│  └─ 4.3: Gateway Integration Test Update (tests/integration/...)       │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 5: Reverse-Proxy Integrity & OAuth 2.0 Compatibility             │
│  ├─ 5.1: Proxy Routing Table Audit & Route Synchronization             │
│  ├─ 5.2: OAuth 2.0 Redirect & State Forwarding Verification            │
│  └─ 5.3: OAuth Reverse-Proxy Integration Test Suite                    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 6: Automated Verification, DAST Audit (ZAP), & Evidence Packaging│
│  ├─ 6.1: Comprehensive Unit & Integration Test Execution (100% Pass)   │
│  ├─ 6.2: OWASP ZAP Baseline DAST Scan Execution & Alert Remediation    │
│  └─ 6.3: Verification Checklist & Audit Trail Deliverable Packaging   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Environment & Dependency Baseline Preparation

#### Subphase 1.1: Git Branch & Test Baseline Verification [COMPLETED]
- **Branch Confirmed:** `fix/gateway-security-hardening` (tracking `origin/fix/gateway-security-hardening`).
- **Baseline Test Execution:**
  - Ran `npm test` (`jest --coverage`) in `api-gateway`.
  - **Results:** 4 test suites passed (`logger.test.js`, `proxyConfig.test.js`, `rateLimiter.test.js`, `server.test.js`), 7 tests passed, 0 failures.
  - **Baseline Code Coverage:**
    - Statements: 75.86%
    - Branches: 50.98%
    - Functions: 44.44%
    - Lines: 75.86%
  - **Identified Uncovered Lines in `src/server.js`:** 12-24, 45-51, 62-63 (proxy resolution and listen callback).
- **Working Tree State:** Clean branch tracking remote, ready for dependency installation.

#### Subphase 1.2: Dependency Resolution [COMPLETED]
- **Helmet Installed:** Added `"helmet": "^8.3.0"` to `api-gateway/package.json` under `dependencies`.
- **Lockfile Synchronization:** `package-lock.json` updated cleanly to guarantee `npm ci --only=production` Docker compatibility.
- **Runtime Resolution:** Verified `node -e "require('helmet')"` resolves to a valid middleware factory function.
- **Regression Testing:** Ran `npm test` (`jest --coverage`). All 4 test suites and 7 tests passed with zero failures.

#### Subphase 1.3: Gateway Environment Variable Modeling & Defaults [COMPLETED]
- **Configuration Template Created:** [api-gateway/.env.example](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/.env.example) created documenting `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `FRONTEND_URL`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, and downstream service URLs.
- **Modular Environment Parser Created:** [api-gateway/src/config/env.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/src/config/env.js) implemented with fail-secure defaults, sanitizing origins, eliminating wildcards (`*`), and validating numeric constraints.
- **Unit Test Coverage:** [api-gateway/tests/unit/env.test.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/tests/unit/env.test.js) added with 5 green unit tests covering defaults, custom configs, wildcard rejection, and fallback resolution.
- **Test Suite Results:** 5 passed suites, 12 total tests, statement coverage increased to 80.0%.

---

### Phase 2: Defensive HTTP Headers Implementation (OWASP A05:2021)

#### Subphase 2.1: Modular Security Headers Configuration [COMPLETED]
- **Modular Security Headers Module:** [api-gateway/src/config/securityHeaders.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/src/config/securityHeaders.js) implemented exporting `getSecurityHeadersOptions()` and `getSecurityHeadersMiddleware()`.
- **Defensive Directives Enforced:**
  - Strict Content-Security-Policy (CSP) restricting scripts, styles, frames (`'none'`), objects (`'none'`), and base URIs, while permitting OAuth and whitelisted frontend connections.
  - Frameguard enforcing `X-Frame-Options: DENY` (anti-clickjacking).
  - MIME-type protection enforcing `X-Content-Type-Options: nosniff`.
  - HSTS configured with `maxAge: 31536000`, `includeSubDomains: true`, and `preload: true`.
  - Referrer Policy set to `strict-origin-when-cross-origin`.
  - Restrictive `Permissions-Policy` header injected (`camera=(), microphone=(), geolocation=(), payment=()`).
- **Unit Test Coverage:** [api-gateway/tests/unit/securityHeadersConfig.test.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/tests/unit/securityHeadersConfig.test.js) added with 3 green unit tests verifying options and response header emission.
- **Test Results:** 6 test suites passed, 15 tests total.

#### Subphase 2.2: Technology Profiling Elimination [COMPLETED]
- **Express-Native Hardening:** Explicitly disabled runtime header advertising via `app.disable('x-powered-by')` in `api-gateway/src/server.js`.
- **Helmet Middleware Mounting:** Attached `getSecurityHeadersMiddleware()` at the topmost Express application cycle boundary.
- **Verification:** Verified live HTTP `/health` response completely omits `X-Powered-By`.

#### Subphase 2.3: Security Headers Test Suite [COMPLETED]
- **Automated Test Suite Implemented:** [api-gateway/tests/unit/securityHeaders.test.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/tests/unit/securityHeaders.test.js) asserting all requirements across 200 OK and 404 responses.
- **Assertions Verified:**
  1. `X-Powered-By` header is explicitly absent (`toBeUndefined()`).
  2. `X-Frame-Options` is strictly asserted to equal `DENY` (OWASP ZAP Rule 10020).
  3. `X-Content-Type-Options` equals `nosniff` (OWASP ZAP Rule 10021).
  4. `Content-Security-Policy` is defined, non-empty, and enforces restrictive source restrictions (OWASP ZAP Rule 10038).
  5. `Strict-Transport-Security` enforces `max-age` >= 31536000 with `includeSubDomains; preload`.
  6. `Referrer-Policy` enforces `strict-origin-when-cross-origin`.
  7. `Permissions-Policy` restricts high-risk browser APIs (`camera`, `microphone`, `geolocation`, `payment`).
- **Test Results:** 7 test suites passed, 23 total tests passed with zero failures. Phase 2 is 100% complete.

---

### Phase 3: CORS Policy Hardening & Preflight Control (OWASP A05:2021)

#### Subphase 3.1: Dynamic Whitelist Origin Authorization Module [COMPLETED]
- **Modular CORS Configuration:** Created [api-gateway/src/config/corsConfig.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/src/config/corsConfig.js) exporting `getAllowedOrigins()`, `createOriginValidator()`, and `getCorsOptions()`.
- **Policy Invariants Enforced:**
  - Whitelist resolution with fail-secure defaults (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`).
  - Origin validator permits whitelisted origins and direct/non-browser requests (`!origin`).
  - Untrusted origins rejected via `callback(null, false)` ensuring `Access-Control-Allow-Origin` is **never** emitted.
  - Zero tolerance for wildcard reflections with credentials.
  - Preflight caching (`maxAge: 86400`, `optionsSuccessStatus: 204`).
- **Unit Test Coverage:** Created [api-gateway/tests/unit/corsConfig.test.js](file:///c:/Users/lasit/OneDrive/Documents/IDEs/VS%20Code/secure-task-management-system/api-gateway/tests/unit/corsConfig.test.js) with 6 unit tests asserting whitelist validation, non-browser request allowance, unauthorized rejection, and options security.
- **Test Results:** 8 test suites passed, 29 total tests passed with zero failures. Coverage increased to 85.43% statements.

#### Subphase 3.2: Immediate Preflight Interception
- Guarantee that `OPTIONS` requests matching configured endpoints terminate at the gateway level with `204 No Content` or `200 OK` and required CORS headers, without hitting downstream services or consuming backend resources.

#### Subphase 3.3: CORS Policy Test Suite
- Create `api-gateway/tests/unit/corsPolicy.test.js`:
  1. **Authorized Origin (Positive Test):**
     - Request with `Origin: http://localhost:5173` receives `Access-Control-Allow-Origin: http://localhost:5173` and `Access-Control-Allow-Credentials: true`.
  2. **Unauthorized Origin (Negative Test):**
     - Request with `Origin: http://malicious-attacker.com` does **not** receive `Access-Control-Allow-Origin`.
  3. **Wildcard Rejection Test:**
     - Verify `Access-Control-Allow-Origin` is never `*` when credentials are true.
  4. **Preflight Handling (OPTIONS Test):**
     - `OPTIONS` request with `Access-Control-Request-Method: POST` returns `204` or `200` with permissible methods and headers.
  5. **Direct / Non-Browser Request Handling:**
     - Request without `Origin` header (like curl or health checks) returns HTTP `200` without server errors.

---

### Phase 4: Gateway Pipeline Restructuring & Traffic Shaping

#### Subphase 4.1: Server Pipeline Reordering in `src/server.js`
- Refactor `createApp()` in `api-gateway/src/server.js`:
  1. Disable `x-powered-by` via `app.disable('x-powered-by')`.
  2. Set `app.set('trust proxy', 1)` to correctly interpret client IP behind Docker bridge / reverse proxy.
  3. Attach `securityHeadersMiddleware` (`helmet(securityHeadersOptions)`).
  4. Attach `cors(corsOptions)`.
  5. Attach `logger`.
  6. Attach `rateLimiter`.
  7. Register local routes (`/health`).
  8. Register proxy dispatcher (`/api`).

#### Subphase 4.2: Rate Limiter Hardening
- Review and refine `api-gateway/src/middleware/rateLimiter.js`:
  - Parameterize `WINDOW_MS` and `MAX_REQUESTS` from environment variables (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`) with safe defaults (15 min, 100 requests).
  - Add standard rate-limiting headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` / `Retry-After`.
  - Maintain existing test coverage in `tests/unit/rateLimiter.test.js`.

#### Subphase 4.3: Integration Test Suite Update
- Update `api-gateway/tests/integration/server.test.js` to assert end-to-end integration:
  - `/health` endpoint returns `200 OK` with complete security headers present and `x-powered-by` absent.
  - Proper rate limit behavior over consecutive requests.

---

### Phase 5: Reverse-Proxy Integrity & OAuth 2.0 Compatibility

#### Subphase 5.1: Proxy Routing Table Audit & Route Synchronization
- Validate `api-gateway/src/config/proxyConfig.js` against microservice topology:
  - `/api/users` -> `USER_SERVICE_URL` (`http://localhost:5001` / `http://user-management:5001`)
  - `/api/tasks` -> `TASK_SERVICE_URL` (`http://localhost:5002` / `http://task-management:5002`)
  - `/api/boards` -> `TASK_SERVICE_URL` (`http://localhost:5002` / `http://task-management:5002`)
  - `/api/notifications` -> `NOTIFICATION_SERVICE_URL` (`http://localhost:5003` / `http://notifications-management:5003`)
  - `/api/reports`, `/api/analytics`, `/api/sync` -> `REPORTING_SERVICE_URL` (`http://localhost:5004` / `http://reporting-analytics:5000`)
- Ensure `proxyConfig.test.js` continues to pass without regression.

#### Subphase 5.2: OAuth 2.0 Route Pass-through Validation
- Audit proxy handlers for OAuth compatibility:
  - Route: `/api/users/auth/google` (initiates consent handshake)
  - Route: `/api/users/auth/google/callback` (Google callback with query parameters `?code=...&state=...`)
- Requirements:
  - Proxy configuration must NOT strip query parameters (`preserveHeaderKeyCase`, `autoRewrite: false`).
  - Proxy must forward HTTP `302`/`307` redirect responses intact with `Location` header back to the browser.
  - Proxy must preserve `Set-Cookie` and `Cookie` headers for session integrity.

#### Subphase 5.3: Reverse-Proxy OAuth Integration Test Suite
- Create `api-gateway/tests/integration/oauthProxy.test.js`:
  - Mock downstream User Service redirecting `302` to `https://accounts.google.com/o/oauth2/v2/auth?...`.
  - Verify API Gateway returns HTTP `302` with intact `Location` containing `client_id`, `state`, `redirect_uri`.
  - Simulate callback request `/api/users/auth/google/callback?code=mock_code&state=mock_state`.
  - Verify query parameters are transmitted intact to downstream mock handler.

---

### Phase 6: Automated Verification, DAST Audit (ZAP), & Evidence Packaging

#### Subphase 6.1: Comprehensive Unit & Integration Test Execution
- Run `npm test` in `api-gateway`.
- Target: 100% tests passing across all suites:
  - `tests/unit/securityHeaders.test.js`
  - `tests/unit/corsPolicy.test.js`
  - `tests/unit/rateLimiter.test.js`
  - `tests/unit/logger.test.js`
  - `tests/unit/proxyConfig.test.js`
  - `tests/integration/server.test.js`
  - `tests/integration/oauthProxy.test.js`
- Generate and verify code coverage report (`coverage/lcov-report/index.html`).

#### Subphase 6.2: OWASP ZAP Baseline DAST Execution & Alert Remediation
- Run OWASP ZAP baseline scan against API Gateway container/local listener:
  ```bash
  docker run --rm -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable zap-baseline.py \
    -t http://host.docker.internal:8000/ \
    -r zap-baseline-gateway-report.html \
    -J zap-baseline-gateway-report.json
  ```
- Verify zero High/Medium/Low alerts for targeted rules:
  - **Rule 10020:** Anti-CSRF / Anti-Clickjacking Header Missing -> **PASSED** (`X-Frame-Options: DENY`, `frame-ancestors 'none'`)
  - **Rule 10021:** X-Content-Type-Options Header Missing -> **PASSED** (`X-Content-Type-Options: nosniff`)
  - **Rule 10038:** Content Security Policy (CSP) Header Not Set -> **PASSED** (Strict CSP headers present)
  - **Rule 10049:** Stale or Permissive CORS Headers -> **PASSED** (Origin whitelist enforced, no wildcard credentials)

#### Subphase 6.3: Verification Checklist & Audit Trail Deliverable
- Complete verification of all items in `.agents/rules/rules.md`:
  - [x] No hardcoded URLs, ports, or origins in source files.
  - [x] New modules follow `camelCase.js` convention and test suites follow `.test.js`.
  - [x] All new dependencies (`helmet`) tracked in `package.json`.
  - [x] Full `npm test` suite executes with 100% green assertions.
  - [x] Downstream microservice proxy rules in `proxyConfig.js` remain fully functional.
  - [x] Documented evidence formatted for inclusion in `SE4030_Assignment_Report.pdf` and YouTube demonstration video.

---

## File Modification & Creation Inventory

| File Path | Action | Description |
| :--- | :---: | :--- |
| `api-gateway/package.json` | **MODIFY** | Add `helmet` dependency. |
| `api-gateway/.env.example` | **NEW** | Template configuration for gateway environment variables. |
| `api-gateway/src/config/securityHeaders.js` | **NEW** | Modular Helmet and security response headers configuration. |
| `api-gateway/src/config/corsConfig.js` | **NEW** | Modular dynamic CORS whitelist and preflight options. |
| `api-gateway/src/server.js` | **MODIFY** | Reorder pipeline (Helmet -> CORS -> Logger/RateLimit -> Proxy), wire modular configs. |
| `api-gateway/src/middleware/rateLimiter.js` | **MODIFY** | Parameterize thresholds from env, add standard rate-limit headers. |
| `api-gateway/tests/unit/securityHeaders.test.js` | **NEW** | Unit test suite asserting all 6 OWASP defensive headers. |
| `api-gateway/tests/unit/corsPolicy.test.js` | **NEW** | Unit test suite asserting authorized, unauthorized, wildcard-free, and preflight CORS flows. |
| `api-gateway/tests/integration/server.test.js` | **MODIFY** | Integration test asserting live headers and health endpoint behavior. |
| `api-gateway/tests/integration/oauthProxy.test.js` | **NEW** | Integration test asserting OAuth2 redirect and parameter passthrough. |
