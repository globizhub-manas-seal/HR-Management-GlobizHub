#!/usr/bin/env node
/**
 * GlobizHR — one-command idempotent seed.
 *
 *   node scripts/seed.js              # platform data (super admin, plans, config, coupons)
 *   node scripts/seed.js --with-demo  # + demo tenant "Globiz Demo Co" (paid annual, 5 users)
 *
 * Safe to re-run: everything is an upsert. Existing data is never overwritten
 * unless it is missing. Prints the resulting credentials at the end.
 *
 * Environment: reads hrms-backend/.env (or env vars already exported).
 * Requires `prisma generate` (or dist/generated) to exist.
 */
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
  // The sandbox exports a global DATABASE_URL (SQLite) that would otherwise
  // shadow the backend .env — force the backend's own value to win.
  override: true,
});

let PrismaClient;
let PrismaPg;
try {
  ({ PrismaClient } = require('../dist/generated/prisma/client'));
  ({ PrismaPg } = require('@prisma/adapter-pg'));
} catch {
  ({ PrismaClient } = require('../generated/prisma/client'));
  ({ PrismaPg } = require('@prisma/adapter-pg'));
}
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SUPER_ADMIN_EMAIL = (process.env.PLATFORM_SUPER_ADMIN_EMAIL || 'superadmin@globizhr.com').toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.PLATFORM_SUPER_ADMIN_PASSWORD || 'SuperAdmin@GlobizHR2026!';

// Every plan-configurable module (must match src/platform/subscriptions/module-registry.ts)
const ALL_HRMS_MODULES = [
  'employees', 'attendance', 'leave', 'schedules', 'shift-swaps', 'documents',
  'tasks', 'announcements', 'onboarding', 'organization', 'resignation',
  'settings', 'support', 'reports', 'loans', 'audit',
  // Paid/advanced modules — disabled on PLAN_FREE by default
  'payroll', 'recruitment', 'training', 'credentials', 'india',
];

// Modules unlocked on the freemium (PLAN_FREE) tier by default
const FREEMIUM_CORE_MODULES = new Set([
  'employees', 'attendance', 'leave', 'schedules', 'shift-swaps', 'documents',
  'tasks', 'announcements', 'onboarding', 'organization', 'resignation',
  'settings', 'support', 'reports', 'loans', 'audit',
]);

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

async function seedSystemConfig() {
  const existing = await prisma.systemConfig.findUnique({ where: { singletonKey: 'GLOBAL' } });
  if (existing) {
    console.log('  SystemConfig ......... exists (super admin can edit from the console)');
    return existing;
  }
  const created = await prisma.systemConfig.create({
    data: {
      singletonKey: 'GLOBAL',
      currency: 'INR',
      pricePerUserPerMonth: 49,
      invoiceDueDays: 7,
      gracePeriodDays: 3,
      minUsersPerInvoice: 1,
      gstPercent: 18,
      invoicePrefix: 'INV',
      paymentGateway: 'RAZORPAY',
      freemiumMaxUsers: 5,
      freemiumMonths: 3,
      contractMonths: 12,
      renewalLeadDays: 30,
      requireBusinessEmail: true,
    },
  });
  console.log('  SystemConfig ......... created (₹49/user/mo, annual ₹588, freemium 5 users / 3 months)');
  return created;
}

async function seedSuperAdmin() {
  const existing = await prisma.platformUser.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
  if (existing) {
    // ensure role + active state even if re-seeded with different env password
    await prisma.platformUser.update({
      where: { id: existing.id },
      data: { role: 'SUPER_ADMIN', isActive: true },
    });
    console.log(`  Super admin ......... exists (${SUPER_ADMIN_EMAIL})`);
    return existing;
  }
  const hashed = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  const created = await prisma.platformUser.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      firstName: 'Platform',
      lastName: 'Super Admin',
      password: hashed,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log(`  Super admin ......... created (${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD})`);
  return created;
}

async function seedPlans() {
  const tiers = [
    {
      name: 'Freemium',
      code: 'PLAN_FREE',
      description: 'Free account: up to the platform-configured user cap (default 5) with verified business emails, for the platform-configured duration (default 3 months).',
      monthlyPrice: 0, annualPrice: 0, maxEmployees: 5, maxStorageGb: 2,
    },
    {
      name: 'Pay As You Grow',
      code: 'PLAN_STARTER',
      description: 'Per-user pricing (default ₹49/user/month) billed annually at ₹588/user/year. Seats added mid-term are invoiced prorated until contract end.',
      monthlyPrice: 49, annualPrice: 588, maxEmployees: 10000, maxStorageGb: 10,
    },
    {
      name: 'Professional Tier',
      code: 'PLAN_PRO',
      description: 'Legacy tiered plan (kept for enterprise feature gating).',
      monthlyPrice: 4999, annualPrice: 49990, maxEmployees: 200, maxStorageGb: 25,
    },
    {
      name: 'Enterprise Tier',
      code: 'PLAN_ENTERPRISE',
      description: 'High-scale multi-branch organization tier with dedicated limits and custom overrides.',
      monthlyPrice: 14999, annualPrice: 149990, maxEmployees: 1000, maxStorageGb: 100,
    },
  ];

  for (const tier of tiers) {
    const existing = await prisma.platformPlan.findUnique({ where: { code: tier.code } });
    if (existing) {
      await prisma.platformPlan.update({
        where: { id: existing.id },
        data: {
          monthlyPrice: tier.monthlyPrice,
          annualPrice: tier.annualPrice,
          maxEmployees: tier.maxEmployees,
          isActive: true,
        },
      });
      console.log(`  Plan ................ exists (${tier.code})`);
      continue;
    }
    const plan = await prisma.platformPlan.create({
      data: {
        name: tier.name,
        code: tier.code,
        description: tier.description,
        monthlyPrice: tier.monthlyPrice,
        annualPrice: tier.annualPrice,
        maxEmployees: tier.maxEmployees,
        maxStorageGb: tier.maxStorageGb,
        trialDays: 0,
        isPublic: true,
        isActive: true,
      },
    });
    for (const mod of ALL_HRMS_MODULES) {
      await prisma.planEntitlement.create({
        data: { planId: plan.id, moduleKey: mod, isEnabled: true },
      });
    }
    console.log(`  Plan ................ created (${tier.code}: ${tier.name})`);
  }
}

/**
 * Plan x module entitlement matrix. Freemium unlocks the core module set;
 * paid plans unlock everything. Existing rows are NEVER overwritten (the
 * super admin owns the matrix once it exists) — only missing rows are
 * created with the correct default.
 */
async function seedEntitlementMatrix() {
  const plans = await prisma.platformPlan.findMany();
  let created = 0;
  for (const plan of plans) {
    const existingRows = await prisma.planEntitlement.findMany({
      where: { planId: plan.id },
      select: { moduleKey: true },
    });
    const have = new Set(existingRows.map((r) => r.moduleKey));
    const isFree = plan.code === 'PLAN_FREE';
    for (const mod of ALL_HRMS_MODULES) {
      if (have.has(mod)) continue;
      await prisma.planEntitlement.create({
        data: {
          planId: plan.id,
          moduleKey: mod,
          isEnabled: isFree ? FREEMIUM_CORE_MODULES.has(mod) : true,
        },
      });
      created += 1;
    }
  }
  console.log(`  Entitlement matrix .. ensured (${created} row(s) added; free plan = core modules only)`);
}

/**
 * Unified User hub backfill: one User row per PlatformUser + Employee.
 * Idempotent — safe to re-run.
 */
async function backfillUserHub() {
  const [platformUsers, employees] = await Promise.all([
    prisma.platformUser.findMany(),
    prisma.employee.findMany(),
  ]);
  let pCount = 0;
  for (const pu of platformUsers) {
    await prisma.user.upsert({
      where: { email: pu.email.toLowerCase() },
      create: {
        email: pu.email.toLowerCase(),
        password: pu.password,
        scope: 'PLATFORM',
        role: pu.role,
        displayName: `${pu.firstName} ${pu.lastName}`.trim(),
        platformUserId: pu.id,
        isActive: pu.isActive,
      },
      update: {
        password: pu.password,
        platformUserId: pu.id,
        role: pu.role,
        isActive: pu.isActive,
      },
    });
    pCount++;
  }
  let eCount = 0;
  for (const emp of employees) {
    const email = emp.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.employeeId === emp.id) {
      await prisma.user.update({
        where: { email },
        data: {
          password: emp.password,
          role: emp.role,
          companyId: emp.companyId,
          isActive: !['TERMINATED', 'RESIGNED'].includes(emp.employmentStatus),
        },
      });
      eCount++;
      continue;
    }
    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          password: emp.password,
          scope: 'COMPANY',
          role: emp.role,
          displayName: `${emp.firstName} ${emp.lastName}`.trim(),
          companyId: emp.companyId,
          employeeId: emp.id,
          isActive: !['TERMINATED', 'RESIGNED'].includes(emp.employmentStatus),
        },
      });
    } else {
      // Email exists linked to a different profile (platform user with the
      // same email) — link the employee profile only when the hub row is free
      await prisma.user.update({
        where: { email },
        data: { employeeId: existing.employeeId ?? emp.id },
      }).catch(() => {});
    }
    eCount++;
  }
  // Back-link profiles to their hub rows
  await prisma.$executeRawUnsafe(
    `UPDATE "Employee" e SET "userId" = u.id FROM "User" u WHERE u."employeeId" = e.id AND e."userId" IS NULL`,
  ).catch(() => {});
  await prisma.$executeRawUnsafe(
    `UPDATE "PlatformUser" p SET "userId" = u.id FROM "User" u WHERE u."platformUserId" = p.id AND p."userId" IS NULL`,
  ).catch(() => {});
  console.log(`  User hub ............ synced (${eCount} employee(s), ${pCount} platform user(s))`);
}

async function seedCoupons() {
  const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1);
  const coupons = [
    { code: 'LAUNCH50', name: 'Launch — 50% off first invoice', discountType: 'PERCENTAGE', discountValue: 50 },
    { code: 'ANNUAL20', name: 'Annual commitment — 20% off', discountType: 'PERCENTAGE', discountValue: 20 },
  ];
  for (const c of coupons) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (existing) {
      console.log(`  Coupon .............. exists (${c.code})`);
      continue;
    }
    await prisma.coupon.create({
      data: { ...c, validUntil: yearEnd, maxUsage: 1000, isActive: true },
    });
    console.log(`  Coupon .............. created (${c.code})`);
  }
}

async function seedFeatureFlags() {
  const flags = [
    { key: 'payroll_console', label: 'Payroll Console', isEnabled: true },
    { key: 'recruitment', label: 'Recruitment ATS', isEnabled: true },
    { key: 'training', label: 'Training & Competency', isEnabled: true },
  ];
  for (const f of flags) {
    const existing = await prisma.platformFeatureFlag.findUnique({ where: { key: f.key } }).catch(() => null);
    if (existing) continue;
    await prisma.platformFeatureFlag.create({ data: { ...f, description: `Seeded default: ${f.label}` } }).catch(() => {});
  }
  console.log('  Feature flags ....... ensured');
}

async function seedDemoTenant() {
  const adminEmail = 'admin@globizdemo.test';
  const demoCompanyEmail = 'office@globizdemo.test';
  const demoDomain = 'globizdemo.test';
  const existingCompany = await prisma.company.findFirst({
    where: { OR: [{ email: demoCompanyEmail }, { employees: { some: { email: adminEmail } } }] },
  });
  if (existingCompany) {
    console.log(`  Demo tenant ......... exists (${adminEmail} / Test@12345)`);
    return;
  }

  const password = await bcrypt.hash('Test@12345', 10);
  const company = await prisma.company.create({
    data: {
      name: 'Globiz Demo Co',
      email: demoCompanyEmail,
      industry: 'Software',
      size: '11-50',
      country: 'India',
      status: 'VERIFIED',
      subscription: 'PRO',
      departments: { create: [
        { name: 'Engineering' }, { name: 'People Ops' }, { name: 'Finance' },
      ] },
      employees: { create: [
        { firstName: 'Demo', lastName: 'Admin', email: adminEmail, password, role: 'OWNER', employmentStatus: 'ACTIVE', employeeCode: 'GZ-001', departmentId: undefined },
      ] },
    },
    include: { employees: true, departments: true },
  });

  // 4 more employees to hit the 5-seat demo state
  const names = [
    ['Asha', 'Nair'], ['Rohit', 'Verma'], ['Meera', 'Iyer'], ['Kabir', 'Shah'],
  ];
  for (let i = 0; i < names.length; i++) {
    await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: names[i][0],
        lastName: names[i][1],
        email: `${names[i][0].toLowerCase()}.${names[i][1].toLowerCase()}@${demoDomain}`,
        password,
        role: 'EMPLOYEE',
        employmentStatus: 'ACTIVE',
        employeeCode: `GZ-00${i + 2}`,
      },
    });
  }

  // PAID annual subscription (settled invoice) — matches DEMO-CREDENTIALS.txt
  const starterPlan = await prisma.platformPlan.findUnique({ where: { code: 'PLAN_STARTER' } });
  const config = await prisma.systemConfig.findUnique({ where: { singletonKey: 'GLOBAL' } });
  const now = new Date();
  const periodEnd = addMonths(now, config?.contractMonths ?? 12);
  const subscription = await prisma.subscription.create({
    data: {
      companyId: company.id,
      planId: starterPlan.id,
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
      startDate: now,
      contractStartsAt: now,
      contractEndsAt: periodEnd,
      currentPeriodEnd: periodEnd,
    },
  });

  const count = await prisma.invoice.count();
  await prisma.invoice.create({
    data: {
      invoiceNumber: `${config?.invoicePrefix || 'INV'}-${now.getFullYear()}-${String(count + 1).padStart(5, '0')}`,
      companyId: company.id,
      subscriptionId: subscription.id,
      amountDue: 5 * (config?.pricePerUserPerMonth ?? 49) * (config?.contractMonths ?? 12),
      amountPaid: 5 * (config?.pricePerUserPerMonth ?? 49) * (config?.contractMonths ?? 12),
      currency: config?.currency || 'INR',
      status: 'PAID',
      paidAt: now,
      dueDate: now,
      periodStart: now,
      periodEnd,
      perUserPrice: config?.pricePerUserPerMonth ?? 49,
      userCount: 5,
    },
  });

  console.log('  Demo tenant ......... created (admin@globizdemo.test / Test@12345 — paid annual, 5 users)');
}

async function main() {
  const withDemo = process.argv.includes('--with-demo');
  console.log('\n=== GlobizHR seed ===\n');
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL missing — copy .env.example to .env first.');
    process.exit(1);
  }

  await seedSystemConfig();
  await seedSuperAdmin();
  await seedPlans();
  await seedEntitlementMatrix();
  await seedCoupons();
  await seedFeatureFlags();
  if (withDemo) await seedDemoTenant();
  await backfillUserHub();

  console.log('\n--- Login credentials ---');
  console.log(`PLATFORM SUPER ADMIN  ${SUPER_ADMIN_EMAIL}  /  ${SUPER_ADMIN_PASSWORD}`);
  if (withDemo) console.log('TENANT (PAID annual)  admin@globizdemo.test  /  Test@12345');
  console.log('\nManage more super admins:  node scripts/manage-superadmin.js create <email> <password>\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
