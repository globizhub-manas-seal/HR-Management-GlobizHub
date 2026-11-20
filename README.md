# GlobizHR - Human Resource Management System

A modern, production-ready full-stack application for managing human resources. GlobizHR provides a comprehensive suite of tools for handling employee data, attendance, payroll, leave management, shift scheduling, and more.

## 🚀 Tech Stack

### Frontend (`hrms-frontend`)
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** React, [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Mobile Support:** [Capacitor](https://capacitorjs.com/) (Android)

### Backend (`hrms-backend`)
- **Framework:** [NestJS](https://nestjs.com/)
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Security:** Helmet, Throttler (Rate Limiting), Joi (Env Validation)
- **Observability:** `nestjs-pino` (Structured Logging), [Sentry](https://sentry.io/) (Error Tracking)

---

## 🌟 Key Features

- **Employee Management:** Complete CRUD for employee records and organizational structure.
- **Attendance & Leave Tracking:** Track daily attendance, clock-ins, clock-outs, and manage employee leave requests.
- **Shift Scheduling & Swapping:** Dynamic shift assignments and a robust engine for employees to request and approve shift swaps.
- **Payroll Processing:** Automated payroll calculations based on attendance and salary bands.
- **Document Management:** Secure upload and storage of employee documents using AWS S3.
- **Announcements & Tasks:** Company-wide announcements and individual task assignments.

---

## 💳 SaaS Billing, Freemium & Platform Controls

### Pricing model (fully super-admin controlled — nothing hardcoded)

| Item | Default | Where to change |
|---|---|---|
| Price per user / month | **Rs.49** (annual contract, invoiced monthly) | Platform Admin -> System Config Console |
| Freemium user cap | **5 users** | Platform Admin -> System Config Console |
| Free trial length | **7 days** (full features, auto-downgrades to freemium) | Platform Admin -> System Config Console |
| Invoice due days / grace period | 7 / 3 days | Platform Admin -> System Config Console |
| GST on invoices | 18% | Platform Admin -> System Config Console |
| Blocked personal email domains | gmail/yahoo/outlook/... | Platform Admin -> System Config Console |
| Platform-wide seat hard cap | 10,000 users/org | Platform Admin -> System Config Console |

### How the lifecycle works

1. **Signup** - organization registers through `/register/wizard` with a **verified business email**
   (OTP-verified; personal domains like gmail.com are rejected - list is configurable). The admin
   account is auto-verified, a **7-day full trial** starts immediately.
2. **Trial end** - a background job downgrades the workspace to **Freemium**
   (5-user cap, business-email requirement on new invites). Nobody is locked out.
3. **Upgrade** - tenant admins open **Settings -> Subscription & Billing** and pay
   `activeUsers x pricePerUserPerMonth` via **Razorpay Checkout**. The amount is always computed
   **server-side** from the SystemConfig + live employee count - the browser can never set it.
4. **Metered monthly invoices** - while on an annual contract, an invoice is generated every month
   for the actual active user count (x per-user price). Pay from the billing page or the platform
   can record manual bank settlements.
5. **Enforcement** - unpaid invoices flip the subscription to `PAST_DUE` after the grace period:
   the workspace is then locked to billing endpoints only (HTTP 402 with invoice details) until
   the payment is verified.

### Anti-bypass guarantees

- Checkout amounts are computed and stored server-side; clients submit only gateway ids + signature.
- Razorpay checkout results are verified with `HMAC_SHA256(order_id|payment_id, key_secret)`
  (timing-safe) and cross-checked against the Razorpay Payments API.
- Webhooks (`POST /platform/billing/webhook`) **always** require a valid signature
  (`x-razorpay-signature` over the raw body) - unsigned requests are rejected in every environment.
- Payments cannot over-credit or partially credit an invoice; idempotency keys + unique gateway
  payment ids prevent double-crediting; coupon usage counters are incremented exactly once per
  settled invoice.
- Seat limits (freemium cap, plan seats, platform hard cap) are enforced on **every** user-creating
  flow: invites, bulk imports, registration-wizard invites and candidate conversion.
- Role escalation is blocked: invites/imports can never create `SUPER_ADMIN`/`OWNER` users.

### Payment gateway configuration

```env
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"
RAZORPAY_WEBHOOK_SECRET="xxx"   # webhook URL: https://<backend>/platform/billing/webhook
SANDBOX_PAYMENTS="false"        # dev-only simulator; NEVER true in production
```

Without keys the checkout falls back to manual settlement: the invoice is issued, the subscription
stays active during the due window, and platform billing admins can record bank-transfer payments
(full ledger + audit trail).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- npm or yarn
- Docker & Docker Compose (for easy database setup)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd hrms-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env` (or create one) and ensure you fill in `DATABASE_URL`, `JWT_SECRET`, and `SENTRY_DSN`.

4. Start the database (using Docker Compose from the root):
   ```bash
   cd ..
   docker-compose up -d db
   cd hrms-backend
   ```

5. Run database migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```
   The backend will be running at `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd hrms-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file and configure your API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 📦 Deployment (Production Readiness)

This repository includes a multi-stage `Dockerfile` and `docker-compose.yml` for deploying the backend to production.
The CI/CD pipeline is configured via GitHub Actions (`.github/workflows/ci.yml`) to automatically lint and test code on pull requests.

For the frontend, it is heavily optimized for deployment on [Vercel](https://vercel.com).

## ⚡ Performance & Memory Optimizations (v2)

**Database (PostgreSQL / Prisma)**
- 21 new compound indexes across 19 hot models (tenant FKs: `Department`, `Role`,
  `Announcement`, `LeavePolicy`, `Shift`, `Branch`, `LeaveTransaction`,
  `ShiftSwapRequest`, `ResignationRequest`, `EmployeeLoan`, onboarding, statutory,
  plus `Subscription[status, trialEndsAt]` and `Invoice[subscriptionId, periodStart, status]`
  for the billing lifecycle sweeps).
- Subscription cron de-N+1'd: trial downgrades went from 3 queries **per trial**
  to 3 queries total (`updateMany` + `createMany` audit + batched notifications);
  monthly invoicing went from 4 queries **per subscription** to ~7 fixed queries
  (batched idempotency check, `groupBy` usage counts, `createMany` invoices/audits);
  past-due evaluation now filters `dueDate` in SQL via index instead of loading
  every issued invoice into memory, and restores via one `groupBy`.
- Right-sized pg connection pool: `DB_POOL_MAX` (default 10), `idleTimeoutMillis`
  30s, `connectionTimeoutMillis` 5s, `statement_timeout` 30s, TCP keepalive on.
- Graceful shutdown: `enableShutdownHooks()` + `onModuleDestroy` release pool
  sockets on SIGTERM/SIGINT instead of leaking them.

**Memory / payload (frontend)**
- Public brand assets recompressed 79-83% smaller (logo.png 316KB → 56KB,
  emblem 124KB → 20KB, horizontal 119KB → 21KB, logo.jpg 86KB → 39KB) with
  palette quantization; dimensions and transparency preserved, and
  `images.unoptimized` keeps sharp buffers off the server (flat RSS).
- Production builds strip `console.*` (except `error`/`warn`) from client
  bundles, ship no browser source maps, and drop `x-powered-by`.

**Repository size**
- The legacy `capacitor/` native iOS/Android shell (5.7MB: duplicated 2732px
  splash screens, intro MP4s, first-generation native view controllers that are
  not wired to this web app) is not part of this archive. The runnable system is
  the Next.js frontend + NestJS backend in this zip.

## 🔒 Security & Monitoring
- Ensure `SENTRY_DSN` is correctly configured in production for real-time error alerts.
- Structured JSON logging is enabled in production (via Pino) for easy aggregation.
- The NestJS backend is protected with `helmet` and strict CORS policies.
