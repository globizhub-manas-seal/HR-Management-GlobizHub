# Visual QA & Verification Checklist (Before & After)

This checklist tracks the visual verification and regression testing for the Apple HIG design system pass across the 8 core application screens.

---

## Screen-by-Screen Verification Checklist

| # | Screen & Route | Before State (Legacy) | After State (Apple HIG) | 375px (Mobile) | 768px (Tablet) | 1280px (Desktop) | 1920px (Wide) | Dark Mode | Status |
| :-: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Login**<br>`/login` | Hardcoded emerald palette (`bg-emerald-500`), harsh border, plain card, non-standard text weights. | Grouped Apple background (`#F2F2F7`), 24px rounded card with layered shadow, SF Pro / Inter typography, fill inputs, primary blue button, safe-area padded. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **2** | **Dashboard**<br>`/workspace/dashboard` | Dark charcoal and gold banner cards, ad-hoc `p-6` gaps, high border weight, disparate stat cards. | Unified 20px surface cards, 12% semantic tinted badge icons, 28px/34px tabular numerals, Apple 8pt layout rhythm, live feed table. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **3** | **Employee Directory & Add Modal**<br>`/workspace/employees` | Rainbow colored stat cards (violet, orange, blue, emerald), sharp 8px radii, dense custom table borders. | Apple card surfaces with semantic status accents, 20px radii, 8pt spacing rhythm, segmented card/list toggle, translucent sticky table headers, 20px modal. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **4** | **Profile & Preferences**<br>`/workspace/profile` | Inconsistent tabs, bright emerald save button, white inputs with hard grey borders. | Apple segmented vertical tabs list, 10px radius selected pill, fill inputs with accent focus halos, structured Inset Group card layouts. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **5** | **Attendance History**<br>`/workspace/attendance` | Mixed badge classes (indigo, emerald, amber, slate), harsh borders, empty state was a raw text line. | 0.5px hairline table row dividers, sticky translucent header, Apple semantic status pills, tabular numerals for hours, Apple HIG EmptyState. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **6** | **Leave Management**<br>`/workspace/leave` | Colored top borders (`bg-blue-500`, `bg-rose-500`), custom modal styling, non-standard buttons. | Clean Apple surface cards with 12% tinted icons, tabular-nums balance days, semantic status badges, Apple dialog with 10px fill inputs. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **7** | **Payroll Administration & Payslips**<br>`/workspace/payroll/admin`<br>`/workspace/my-payslips` | Indigo brand colors, hard table borders, non-tabular salary amounts, inconsistent export toolbar. | Clean Apple KPI cards with tabular-nums currency, right-aligned salary numbers, translucent toolbar, Apple printable payslip modal dialog. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |
| **8** | **Recruitment Pipeline**<br>`/workspace/recruitment` | Cramped KPI cards, small dense table rows, disparate action button colors. | 20px surface KPI cards with bold tabular figures, 50px table row height, segmented tab controls, Apple stroke 1.5 Lucide icons. | [x] | [x] | [x] | [x] | [x] | **VERIFIED** |

---

## Platform & Environment Checklist

- [x] **Light Mode:** Grouped background `#F2F2F7`, `#FFFFFF` cards, soft layered shadow (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)`).
- [x] **Dark Mode:** Deep black background `#000000`, elevated surface `#1C1C1E`, 0.5px hairlines `rgba(84, 84, 88, 0.60)`.
- [x] **Typography Stack:** Native SF Pro Text / Display on Apple platforms; fallback to Inter on Windows/Android/Linux.
- [x] **Motion & Springs:** `cubic-bezier(0.32, 0.72, 0, 1)`, `150ms` press scale to `0.98`, disabled transforms under `prefers-reduced-motion`.
- [x] **Capacitor Mobile:**
  - 49px translucent bottom navigation tab bar with safe-area bottom inset (`env(safe-area-inset-bottom)`).
  - Minimum 44x44 touch targets for all interactive controls.
  - Safe area padding on mobile header and dialog sheets.
- [x] **Accessibility:** WCAG 2.1 AA text contrast (minimum 4.5:1), visible 2px keyboard focus rings, full keyboard traversal.
- [x] **Zero Business Logic Regressions:** Routes, hooks, state, and API payload contracts remain untouched.
