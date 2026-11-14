# Elephant-Goldfish Model (EGM) Whole-Project Master Audit Report

**Target Scope**: `hrms-backend-v1` (NestJS 11 + Prisma ORM) & `hrms-project-v1` (Next.js 16 + Tailwind CSS)  
**Methodology**: Elephant-Goldfish Multi-Persona Protocol (`egm-design`, `egm-codebase-details`, `egm-implementation-readiness`, `egm-zoom-out`)  
**Audit Date**: November 2026  
**Status**: Comprehensive Synthesis Completed  

---

## Executive Summary

The audited HRMS SaaS platform features strong modular foundations, comprehensive Indian statutory tax/payroll utilities, and fine-grained role structures. However, rigorous multi-perspective stress testing identified **10 Critical P0 Blockers** across tenant isolation, payment security, database relational integrity, and background execution resilience that must be resolved prior to production launch.

---

## 🚨 Critical P0 Blockers (Immediate Remediation Required)

### 1. Multi-Tenant Leak: Prisma `undefined` Query Stripping
- **Persona Finding**: `egm-design` & `egm-zoom-out`
- **Location**: `hrms-backend-v1/src/auth/auth.guard.ts` & `src/employee/employee.service.ts`
- **Technical Vulnerability**:  
  `AuthGuard` does not verify that `payload.companyId` is defined, nor does it reject platform tokens (`payload.isPlatform = true`). When an unassigned platform token accesses tenant routes (e.g. `GET /employees`), `req.user.companyId` is `undefined`.  
  Prisma silently strips keys with `undefined` values from `WHERE` clauses. The generated query becomes `SELECT * FROM "Employee"`, leaking the entire employee directory across all tenants.
- **Action**: Reject requests missing `companyId` in `AuthGuard` on all workspace routes, and add strict non-null assertions before querying Prisma.

---

### 2. Parameter Transposition in Attendance Correction Review (100% Failure Rate)
- **Persona Finding**: `egm-design`
- **Location**: `hrms-backend-v1/src/attendance/attendance.controller.ts#L97-L105`
- **Technical Vulnerability**:  
  In `AttendanceController.reviewCorrection`, the controller passes:
  `(id, req.user.sub, dto.status, dto.reviewNote, req.user.companyId)`.  
  However, `AttendanceService.reviewCorrection` is declared as:  
  `(correctionId, reviewerId, companyId, status, reviewerNote)`.  
  `dto.status` (`"APPROVED"`) is passed as `companyId`, causing the tenant verification check `correction.employee.companyId !== "APPROVED"` to fail and trigger an unconditional `404 Not Found`.
- **Action**: Fix argument mapping in `AttendanceController` or pass a typed parameter object.

---

### 3. Unauthenticated Billing Webhook & Payment Forgery
- **Persona Finding**: `egm-design`
- **Location**: `hrms-backend-v1/src/platform/billing/platform-billing.controller.ts#L141-L152` & `platform-billing.service.ts#L533-L564`
- **Technical Vulnerability**:  
  The billing webhook route `@Post('webhook')` receives the `stripe-signature` header but never validates cryptographic HMAC signatures. Furthermore, if no idempotency key is supplied, the service generates a random key on each request. Anyone can POST a forged JSON payload to activate subscriptions and mark invoices paid.
- **Action**: Enforce HMAC cryptographic signature verification (`stripe.webhooks.constructEvent` / Razorpay SHA256) and reject unsigned payloads before processing.

---

### 4. Synchronous Bulk Invites & External Email Calls on HTTP Thread (504 Timeout)
- **Persona Finding**: `egm-implementation-readiness`
- **Location**: `hrms-backend-v1/src/auth/auth.service.ts#L335-L470`
- **Technical Vulnerability**:  
  In `registerWizard()`, imported employees are processed in a sequential synchronous loop: for each employee, it performs multiple DB writes and an external synchronous HTTP request to Resend (`await this.emailService.sendEmployeeInvitationEmail(...)`). Importing 50–100 employees creates 350–700 database calls and 50–100 sequential external network requests, resulting in reverse-proxy timeouts (504 Gateway Timeout) and Resend rate limiting (429).
- **Action**: Offload employee invitation emails and task scaffolding to an asynchronous background worker or queue.

---

### 5. In-Memory Payroll Batch Queue with Permanent Lock Risk
- **Persona Finding**: `egm-implementation-readiness`
- **Location**: `hrms-backend-v1/src/payroll/batch/payroll-batch-queue.service.ts#L101-L140`
- **Technical Vulnerability**:  
  Batch payroll processing runs via in-process `setImmediate`. If the server container restarts or scales down during a run, jobs are abandoned in `PROCESSING` status. Because the service blocks future runs if an existing run is in `QUEUED` or `PROCESSING`, the tenant is permanently locked out of running payroll for that month/year.
- **Action**: Add an application-boot reconciliation hook (`OnModuleInit`) that marks orphaned `PROCESSING` jobs as `FAILED` if abandoned, and introduce durable queueing.

---

### 6. CORS Fail-Open Security Vulnerability
- **Persona Finding**: `egm-implementation-readiness`
- **Location**: `hrms-backend-v1/src/main.ts#L26-L48`
- **Technical Vulnerability**:  
  Line 38 in `main.ts`:  
  `const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);`  
  If `FRONTEND_ORIGIN` is empty or missing, `allowedOrigins.length === 0` evaluates to `true`, permitting any origin to make authenticated CORS requests with credentials.
- **Action**: Enforce fail-closed CORS: if `allowedOrigins.length === 0`, deny access immediately.

---

### 7. Frontend vs Backend Route Mismatches (Immediate 404s)
- **Persona Finding**: `egm-codebase-details`
- **Locations**:
  - `hrms-project-v1/src/lib/api/leaves.ts`: Calls `/leave/holidays` (singular), but backend is mounted at `/leaves` (plural).
  - `hrms-project-v1/src/lib/api/recruitment.ts`: Calls `/recruitment/jobs`, `/recruitment/requisitions`, and `/recruitment/offers`, which do not match backend controller route definitions.
  - `hrms-project-v1/src/lib/api/employees.ts`: Declares `getSkills`, `getEmergencyContacts`, `getHistory`, but backend `EmployeeController` lacks `GET` routes for these sub-resources.
- **Action**: Normalize route paths across `leavesApi`, `recruitmentApi`, and add missing sub-resource `GET` endpoints in `EmployeeController`.

---

### 8. Absence of Next.js Global & Route Error Boundaries
- **Persona Finding**: `egm-implementation-readiness`
- **Location**: `hrms-project-v1/src/app`
- **Technical Vulnerability**:  
  Neither `error.tsx` nor `global-error.tsx` exist in the Next.js app. Any unhandled client exception causes a white screen of death.
- **Action**: Implement `src/app/global-error.tsx` and `src/app/error.tsx` with user-friendly recovery triggers.

---

### 9. Shared Company Policy E-Signature Mutation
- **Persona Finding**: `egm-codebase-details`
- **Location**: `hrms-backend-v1/src/document/document.service.ts#L640-L652`
- **Technical Vulnerability**:  
  Company policies are stored as a single shared `Document` row. When an employee signs a company document, the service updates the shared `Document` record directly (`isSigned: true`), falsely marking the policy as signed for every employee in the company.
- **Action**: Introduce a `DocumentSignature` or `PolicyAcknowledgement` join model to track signatures per employee.

---

### 10. Context Tree Leaks in Next.js Root Layout
- **Persona Finding**: `egm-zoom-out`
- **Location**: `hrms-project-v1/src/app/layout.tsx`
- **Technical Vulnerability**:  
  Root `layout.tsx` wraps all routes (including `/platform-admin/*` and public careers pages) inside `ViewModeProvider` and `PermissionProvider`. Both providers resort to defensive pathname sniffing to prevent crashes on non-workspace pages.
- **Action**: Scope tenant providers strictly inside `src/app/(dashboard)/workspace/layout.tsx`.

---

## 🟡 Major Architectural Gaps (P1 Priority)

1. **Prisma Relational Deletion Cascades**:
   - `Attendance`, `AttendanceCorrection`, `LeaveBalance`, `SupportTicket`, and statutory tables lack `onDelete: Cascade` or `SetNull`. Deleting an employee or company triggers foreign key constraint violations (`23503`).
2. **Missing Relational Foreign Keys**:
   - `SalaryTemplate.companyId`, `Document.companyId`, and `LoanRepayment.payrollRecordId` are loose unindexed string columns without foreign key constraints.
3. **Missing Composite Database Indexes**:
   - High-traffic multi-tenant tables (`Notification`, `LeaveRequest`, `Task`, `Document`, `PayrollRecord`) lack compound indexes on `[companyId, ...]`, leading to sequential table scans.
4. **Attendance Server vs Tenant Timezone Desynchronization**:
   - `attendance.service.ts` calculates `today` using the host server timezone rather than `CompanySettings.timeZone`, causing shifts for international tenants to evaluate against the wrong calendar day.
5. **Nightly Attendance Cron Cascade**:
   - `attendance-cron.service.ts` runs sequential queries per employee on the main thread, risking event loop saturation at multi-tenant scale.
6. **Dead-Weight Dependency**:
   - `zustand` is installed as a production dependency in the backend `package.json`.

---
*Report generated and archived by Antigravity under EGM protocol.*
