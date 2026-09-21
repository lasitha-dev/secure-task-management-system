# Secure Task Management System (SE4030 – Secure Software Development)

An enterprise-grade, microservice-based task management platform audited, remediated, and hardened against OWASP Top 10 vulnerabilities, featuring Google OAuth 2.0 / OpenID Connect (OIDC) authentication.

Originally developed for **SE4010 (Current Trends in Software Engineering)**, this project has been upgraded for **SE4030 (Secure Software Development)** to address critical security vulnerabilities and implement standards-compliant authentication mechanisms.

---

## 1. Assignment & Group Details

* **Institution:** Sri Lanka Institute of Information Technology (SLIIT)
* **Faculty / Department:** Faculty of Computing | Department of Computer Science & Software Engineering
* **Module:** SE4030 – Secure Software Development
* **Assignment:** Group Assignment – Vulnerability Identification, Remediation & OAuth Implementation
* **Submission Deadline:** October 2, 2026

### Group Members & Contributions

| # | Student Name | Student ID | Primary Responsibilities & Component Focus |
| :-: | :--- | :---: | :--- |
| **1** | **A.L.M. Athulathmudali** | `IT21129544` | **API Gateway & Routing Security:** Helmet headers, CORS policy enforcement, rate limiting, and gateway DAST audits. |
| **2** | **W.M.P.J. Wijenayake** | `IT22194558` | **Task Management Service:** Broken Object-Level Authorization (IDOR) fixes, NoSQL injection sanitization, and access-control validation. |
| **3** | **S.S. Kumarasinghe** | `IT22221414` | **User Management Service:** Google OAuth 2.0 / OpenID Connect implementation, password sanitization, and brute-force mitigation. |
| **4** | **G.A. Sandaru** | `IT22258908` | **Notifications & Reporting Services:** Outdated dependency patching, SAST/DAST automation (OWASP ZAP, Snyk/Semgrep), and video demonstration. |

---

## 2. Submission Deliverables & Links

* **Original Project Repository:** [https://github.com/lasitha-dev/Task-Management-System.git](https://github.com/lasitha-dev/Task-Management-System.git)
  *(Original codebase baseline committed prior to the start of the semester)*
* **Modified Hardened Repository:** `https://github.com/lasitha-dev/secure-task-management-system.git`
  *(Contains atomic commit history for every vulnerability fix and feature addition)*
* **YouTube Demonstration Video (Max 20 Minutes):** `https://youtu.be/<YOUR_VIDEO_ID>`
  *(Presents vulnerability identification, proof-of-concept exploits, code remediation walkthrough, and OAuth 2.0 authentication)*
* **Project Security Report:** Available in repository root as `SE4030_Assignment_Report.pdf`
* **Original Baseline Deployment (SE4010 Reference):** [Azure Container Apps](https://user-frontend.niceocean-2a043b3e.southeastasia.azurecontainerapps.io)

---

## 3. System Architecture & Microservice Topology

The platform utilizes a decoupled microservices architecture with a Database-per-Service pattern, routed through a centralized API Gateway:

```
                 +---------------------------------------+
                 |          Frontend (React / Vite)       |
                 |        User & Task Management UI       |
                 +-------------------+---------------------+
                                     | HTTPS / REST
                                     v
                 +---------------------------------------+
                 |          API Gateway (Port 5000)        |
                 |  - Helmet Security Headers (CSP, HSTS) |
                 |  - Whitelisted Origin CORS Lockdown    |
                 |  - Global & Route-Specific Rate Limit  |
                 |  - Reverse Proxy (Path-Based Routing)  |
                 +---+---------------+---------------+----+
                     |               |                |
     +---------------+               |                +---------------+
     v (Port 5001)                   v (Port 5002)                    v (Port 5004)
+-------------------+           +-------------------+           +--------------------+
|  User Management  |           |  Task Management  |           | Reporting/Analytics|
|  - JWT Validation  |           |  - Kanban Boards   |          |  - Data Aggregation|
|  - Google OAuth2   |           |  - Task CRUD/State  |         |  - Status Insights |
|  - RBAC Middleware |           |  - IDOR Prevention  |         |  - Read-Only Sync  |
+---------+---------+           +---------+----------+          +---------+----------+
          |                               | (Port 5003)                    |
          |                               v                                |
          |                     +-------------------+                     |
          |                     |   Notifications    |                     |
          |                     |  - System Alerts   |                     |
          |                     |  - Email Triggers  |                     |
          |                     +---------+---------+                     |
          |                               |                                |
          v                               v                                v
    [ Users DB ]                    [ Tasks DB ]                    [ Reports DB ]
     (MongoDB)                       (MongoDB)                       (MongoDB)
```

### Microservice Port Mapping

| Service Name | Container Port | Host Port | Database Instance | Primary Responsibility |
| :--- | :---: | :---: | :--- | :--- |
| **API Gateway** | `5000` | `5000` | N/A (Reverse Proxy) | Centralized reverse proxy, security headers, CORS, rate limiting. |
| **User Service** | `5001` | `5001` | `UsersDB` (MongoDB) | Registration, login, JWT issuance, Google OAuth2, RBAC. |
| **Task Service** | `5002` | `5002` | `TasksDB` (MongoDB) | Kanban boards, task lifecycle, assignment, ownership checks. |
| **Notification Service** | `5003` | `5003` | `NotificationsDB` (MongoDB) | Email notifications, task update alerts, history. |
| **Reporting Service** | `5004` | `5004` | `ReportsDB` (MongoDB) | Task performance metrics, status distributions, summaries. |
| **Frontend Web App** | `80` / `5173` | `3000` / `5173` | N/A (Client Browser) | React Kanban board interface and user dashboard. |

---

## 4. Remediated Vulnerabilities (OWASP Top 10 Summary)

In accordance with assignment requirements, at least 7 distinct vulnerability categories across different architectural layers were identified, exploited, patched, and verified:

| # | Vulnerability Category (OWASP Top 10) | Target Service & Endpoint | Detection Method | Root Cause & Security Remediation |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **A01:2021 – Broken Access Control (IDOR / BOLA)** | `task-management`<br>`PUT/DELETE /api/tasks/:id` | Manual DAST (Burp Suite) | **Root Cause:** Endpoints updated or deleted tasks based on URL parameters without verifying if the requester was the creator or board member.<br>**Fix:** Implemented object-level authorization middleware validating `task.creatorId.equals(req.user.id)` before query execution. |
| **2** | **A07:2021 – Identification & Authentication Failures** | `user-management`<br>`POST /api/users/login` | OWASP ZAP (Active Scan) | **Root Cause:** No brute-force protection existed on the authentication endpoint, permitting credential-stuffing attacks.<br>**Fix:** Applied `express-rate-limit` with an IP-and-account sliding window limiting requests to 5 failed attempts per 15 minutes. |
| **3** | **A03:2021 – Injection (NoSQL Query Injection)** | `user-management`<br>`POST /api/users/login` | SAST (Semgrep) & Postman | **Root Cause:** Raw `req.body` JSON values were passed directly into Mongoose filters (allowing operators like `{"$ne": ""}`).<br>**Fix:** Enforced input sanitization via `express-mongo-sanitize` and strict schema validation with `express-validator`. |
| **4** | **A05:2021 – Security Misconfiguration (Missing Headers)** | `api-gateway`<br>`src/server.js` | OWASP ZAP (Baseline Scan) | **Root Cause:** Gateway lacked secure response headers, exposing `X-Powered-By: Express` and leaving clients vulnerable to Clickjacking and MIME sniffing.<br>**Fix:** Integrated `helmet` middleware configuring strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and HSTS. |
| **5** | **A05:2021 – Permissive Cross-Origin Resource Sharing** | `api-gateway`<br>`src/server.js` | DAST Inspection | **Root Cause:** Gateway accepted wildcard origins (`*`) while processing Bearer Authorization headers.<br>**Fix:** Restricted CORS whitelist to explicit trusted domain origins with `credentials: true` and disallowed wildcard reflections. |
| **6** | **A02:2021 – Cryptographic Failures & Data Exposure** | `user-management`<br>`GET /api/users/profile` | Manual Code Audit / SAST | **Root Cause:** User queries serialized complete database documents back to the client, including hashed passwords and internal fields.<br>**Fix:** Enforced explicit projection filters (`.select("-password -__v")`) across all query controllers and standardized DTO outputs. |
| **7** | **A06:2021 – Vulnerable and Outdated Components** | Microservices Dependencies (`package.json`) | `npm audit` / Snyk | **Root Cause:** Legacy versions of dependencies contained publicly disclosed High/Critical CVEs.<br>**Fix:** Upgraded vulnerable libraries across all microservice packages, resolved dependency trees, and added CI audit gates. |

---

## 5. Unfixed Vulnerabilities & Technical Justification

* **Microservice Mutual TLS (mTLS) Internal Zero-Trust Encryption:**
  * *Justification:* Inter-service HTTP communication runs inside an isolated Docker bridge network that is not directly exposed to external public interfaces. Transitioning internal Docker communication to automated certificate rotation and mTLS was excluded due to development-environment certificate-overhead constraints within the project timeline. Documented as an enterprise production backlog item.
* **Distributed Denial of Service (DDoS) Volumetric Shielding:**
  * *Justification:* Application-layer rate limiting is enforced via Redis/in-memory gateway limiters. Mitigation of Layer 3/4 volumetric DDoS attacks requires upstream infrastructure-level scrubbing (e.g., Cloudflare, Azure Front Door) that cannot be fully implemented or simulated within local Docker environments.

---

## 6. OAuth 2.0 / OpenID Connect (OIDC) Implementation

The system integrates an **OAuth 2.0 / OpenID Connect** authorization flow using the **Google Identity Platform** to enhance authentication security and provide third-party sign-in:

* **Protocol & Grant Type:** OAuth 2.0 Authorization Code Grant (`response_type=code`) with OpenID Connect
* **Identity Provider:** Google Identity Services
* **Scopes Requested:** `openid`, `profile`, `email`
* **Workflow:**
  1. User selects **Sign in with Google** on the frontend, triggering a GET request to `/api/users/auth/google` on the API Gateway.
  2. The Gateway proxies the request to the User Management Service, which redirects the user to Google's consent screen with the configured `client_id`, `redirect_uri`, and cryptographic `state`.
  3. Upon consent, Google redirects to `/api/users/auth/google/callback` with an authorization code.
  4. The User Management Service exchanges the authorization code for an ID token and access token directly with Google's token endpoint over a TLS back-channel.
  5. The service validates the OpenID identity payload, automatically provisions or links the user account in `UsersDB`, and returns a signed application JWT for session management.

---

## 7. Local Environment Setup & Execution

### Prerequisites

* **Docker Engine** (v20.10+) and **Docker Compose**
* **Node.js** (v18+) & **npm**
* Google Cloud Platform Console OAuth Credentials (`Client ID` & `Client Secret`)

### Environment Configuration

Configure a `.env` file in the root directory (or respective microservice folders):

```env
# Gateway Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Connections
USER_DB_URI=mongodb://mongo:27017/user_management
TASK_DB_URI=mongodb://mongo:27017/task_management
NOTIFICATION_DB_URI=mongodb://mongo:27017/notifications_management
REPORTING_DB_URI=mongodb://mongo:27017/reporting_analytics

# Authentication & Tokens
JWT_SECRET=your_super_secret_jwt_random_key_min_32_chars
JWT_EXPIRE=24h

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/users/auth/google/callback
```

### Running the System

```bash
# Clone the modified repository
git clone https://github.com/<YOUR-ORGANIZATION-OR-USERNAME>/secure-task-management-system.git
cd secure-task-management-system

# Build and start all microservices and databases in detached mode
docker-compose up --build -d

# Verify that all containers are healthy and running
docker-compose ps
```

* **Frontend Application:** `http://localhost:5173`
* **API Gateway Entry Point:** `http://localhost:5000`
* **Gateway Health Endpoint:** `http://localhost:5000/health`

---

## 8. Security Auditing & Verification Commands

### Static Application Security Testing (SAST)

```bash
# Run Semgrep static analysis rules across all services
semgrep --config p/owasp-top-ten .
```

### Software Composition Analysis (SCA)

```bash
# Scan npm dependencies for known CVEs
npm audit --workspaces
```

### Dynamic Application Security Testing (DAST)

```bash
# Run OWASP ZAP baseline scan against the API Gateway
docker run -t zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:5000/
```