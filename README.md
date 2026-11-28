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

- **Unified User hub:** every person on the platform — super admins, platform staff, company owners, managers and employees — resolves to a single `User` identity row linked to their domain profile.
- **Employee Management:** Complete CRUD for employee records and organizational structure.
- **Attendance & Leave Tracking:** Track daily attendance, clock-ins, clock-outs, and manage employee leave requests.
- **Shift Scheduling & Swapping:** Dynamic shift assignments and a robust engine for employees to request and approve shift swaps.
- **Payroll Processing:** Automated payroll calculations based on attendance and salary bands.
- **Loans & Advances:** Full loan lifecycle — company policy settings, request → approve → disburse → repayments (payroll auto-deduction, manual recording or Razorpay online repayment), amortization schedule and immutable activity history.
- **Reports console:** business owners get period-based reports (today / yesterday / last 7 / last 30 / this month / last month / this year / custom) on employees, attendance, leave, payroll and loans — exportable as CSV, Excel and PDF on the company letterhead (logo, legal name, address, GSTIN). Super admins get the same global report system at organization and platform level.
- **GST Tax Invoices:** invoices compute CGST/SGST (intra-state) or IGST (inter-state) from super-admin configuration and render a compliant tax-invoice PDF with SAC code, place of supply and amount in words.
- **Plan-wise module restrictions:** every module (payroll, recruitment, training, credentials, statutory…) is gated by the plan entitlement matrix that super admins edit per plan — enforced globally by the API guard and reflected in the UI sidebar/pages with upgrade prompts.
- **Document Management:** Secure upload and storage of employee documents using AWS S3.
- **Announcements & Tasks:** Company-wide announcements and individual task assignments.

---

## 💳 SaaS Billing, Freemium & Platform Controls

### Pricing model (fully super-admin controlled — nothing hardcoded)

| Item | Default | Where to change |
|---|---|---|
| Price per user / month | **Rs.49** | Platform Admin -> System Config Console |
| Contract term | **12 months, billed annually upfront** (Rs.588/user/yr) | Platform Admin -> System Config Console |
| Freemium user cap | **5 users** | Platform Admin -> System Config Console |
| Free period length | **3 months** (there is no separate trial — free IS the trial) | Platform Admin -> System Config Console |
| Renewal lead time | 30 days before contract end | Platform Admin -> System Config Console |
| Invoice due days / grace period | 7 / 3 days | Platform Admin -> System Config Console |
| GST on invoices | 18% | Platform Admin -> System Config Console |
| Blocked personal email domains | gmail/yahoo/outlook/... | Platform Admin -> System Config Console |
| Platform-wide seat hard cap | 10,000 users/org | Platform Admin -> System Config Console |

### How the lifecycle works

1. **Signup** - organization registers through `/register/wizard` with a **verified business email**
   (OTP-verified; personal domains like gmail.com are rejected - list is configurable). The admin
   account starts on the **Free plan immediately: 5 users for 3 months** (both configurable).
2. **Free period end** - the workspace locks to billing endpoints (HTTP 402 with an upgrade message)
   until the organization upgrades. Nobody loses their data.
3. **Upgrade** - tenant admins open **Settings -> Subscription & Billing** and pay
   `activeUsers x pricePerUserPerMonth x contractMonths` (e.g. 5 users = Rs.2,940/year) via
   **Razorpay Checkout**. The amount is always computed **server-side** from the SystemConfig +
   live employee count - the browser can never set it.
4. **Seats added mid-term** - every new user (invite, bulk import, candidate conversion) is invoiced
   **annually from the day they are added, prorated until the contract ends** (per-seat =
   price x 12 x remainingDays / termDays). Unpaid seat invoices follow the same grace/past-due rules.
5. **Annual renewal** - `renewalLeadDays` before contract end the cron issues ONE renewal invoice
   for the next term; paying it extends the contract automatically. Overdue invoices flip the
   subscription to `PAST_DUE` after the grace period: the workspace is locked to billing endpoints
   until the payment is verified.
6. **Landing page pricing** - the public site reads live numbers from
   `GET /platform/public/config` (price, contract term, freemium cap, free-period length, GST):
   change them in the super-admin console and the marketing page updates instantly.

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
DB_POOL_MAX="10"                # pg connection pool per API process
```

Without keys the checkout falls back to manual settlement: the invoice is issued, the subscription
stays active during the due window, and platform billing admins can record bank-transfer payments
(full ledger + audit trail).

### Seeding & creating the Super Admin

```bash
cd hrms-backend
cp .env.example .env            # set DATABASE_URL + JWT_SECRET + ENCRYPTION_KEY + Razorpay keys
npm install                     # (or bun install) — generates the Prisma client
npx prisma db push              # create/update the schema
npm run seed                    # super admin + plans + SystemConfig + coupons + feature flags
npm run seed:demo               # same + demo tenant "Globiz Demo Co" (paid annual, 5 users)
```

The seed is **idempotent** — re-running never duplicates or overwrites existing records.
It prints the resulting credentials. Defaults: `superadmin@globizhr.com / SuperAdmin@GlobizHR2026!`
(override via `PLATFORM_SUPER_ADMIN_EMAIL` / `PLATFORM_SUPER_ADMIN_PASSWORD` in .env).

Manage additional super admins any time:

```bash
node scripts/manage-superadmin.js list                                   # list platform + workspace admins
node scripts/manage-superadmin.js create <email> <password> First Last   # add a super admin
```

A super admin is ALSO auto-created at backend boot if none exists (`PLATFORM_ADMIN_EMAIL` /
`PLATFORM_ADMIN_PASSWORD` env vars, same defaults). Every super admin and tenant user is
mirrored into the unified `User` hub (one identity row per person — see the Key Features list).

### Seeding details (plans & module matrix)

The seed provisions the plan entitlement matrix used for plan-wise module restrictions:

- `PLAN_FREE` (freemium): core modules only — employees, attendance, leave, schedules,
  shift-swaps, documents, tasks, announcements, onboarding, organization, resignation,
  settings, support, **reports, loans, audit**.
- Paid plans (`PLAN_STARTER` / `PLAN_PRO` / `PLAN_ENTERPRISE`): every module enabled.
- Existing entitlement rows are never overwritten by re-running the seed — the matrix belongs
  to the super admin after provisioning (edit it from Platform Console → Modules → Plan
  Entitlements; changes go live within 15 seconds).

### New in this release (loans, reports, GST, gating)

| System | Where |
| --- | --- |
| Loans & advances console | `/workspace/loans` (owner: policy, approvals, repayments, history; employee: self-service + Razorpay repayment). API under `/loans`. Payroll auto-deducts the EMI of `ACTIVE` loans and records `PAYROLL` repayments. |
| Tenant reports | `/workspace/reports` + `GET /reports/summary|data/:dataset|export/:dataset?format=csv|excel|pdf` |
| Global platform reports | Platform Console → Global Reports (`/platform-admin/reports`) + `GET /platform/reports/*` |
| Tax invoice PDF | Tenant billing page → "PDF" button (`GET /organization/billing/invoices/:id/pdf`), super admin: `GET /platform/billing/invoices/:id/pdf` |
| GST configuration | Platform Console → Settings → "GST & Invoicing" tab (enable, rate, seller identity, SAC, notes) |
| Razorpay connect status | Platform Console → Settings → Pricing & Billing → connection card (`GET /platform/system/payment-gateway`) |

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
