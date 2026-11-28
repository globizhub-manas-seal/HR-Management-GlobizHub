/**
 * Plan module registry — maps API route prefixes to plan module keys.
 *
 * The ModuleEntitlementGuard derives the module from the request path so
 * EVERY controller is plan-gated without touching each one. A controller
 * can override with @RequirePlanModule('key') or opt out with
 * @SkipPlanModuleCheck().
 */

/** All configurable modules (super-admin matrix: plan x module). */
export const ALL_MODULE_KEYS = [
  'employees',
  'attendance',
  'leave',
  'schedules',
  'shift-swaps',
  'documents',
  'tasks',
  'announcements',
  'onboarding',
  'organization',
  'resignation',
  'settings',
  'support',
  'reports',
  'loans',
  'audit',
  // Paid/advanced modules — disabled on PLAN_FREE by default
  'payroll',
  'recruitment',
  'training',
  'credentials',
  'india',
] as const;

export type ModuleKey = (typeof ALL_MODULE_KEYS)[number];

/** Modules unlocked on the freemium (PLAN_FREE) tier by default. */
export const FREEMIUM_CORE_MODULES: Set<string> = new Set([
  'employees',
  'attendance',
  'leave',
  'schedules',
  'shift-swaps',
  'documents',
  'tasks',
  'announcements',
  'onboarding',
  'organization',
  'resignation',
  'settings',
  'support',
  'reports',
  'loans',
  'audit',
]);

/**
 * Route prefix (first path segment(s)) -> module key. Longest prefix wins.
 */
export const ROUTE_MODULE_MAP: Array<[string, string]> = [
  ['payroll/statutory', 'india'],
  ['payroll', 'payroll'],
  ['recruitment/public/careers', 'recruitment'],
  ['recruitment/applications', 'recruitment'],
  ['recruitment/jobs', 'recruitment'],
  ['recruitment/manpower', 'recruitment'],
  ['recruitment/requisitions', 'recruitment'],
  ['recruitment', 'recruitment'],
  ['training/competencies', 'training'],
  ['training/position-changes', 'training'],
  ['training/my-learning', 'training'],
  ['training/categories', 'training'],
  ['training/evaluations', 'training'],
  ['training/expenses', 'training'],
  ['training/plans', 'training'],
  ['training/programs', 'training'],
  ['training/sessions', 'training'],
  ['training', 'training'],
  ['credentials', 'credentials'],
  ['attendance', 'attendance'],
  ['leaves', 'leave'],
  ['employees', 'employees'],
  ['documents', 'documents'],
  ['tasks', 'tasks'],
  ['announcements', 'announcements'],
  ['onboarding', 'onboarding'],
  ['organization', 'organization'],
  ['resignation', 'resignation'],
  ['schedules', 'schedules'],
  ['shift-swaps', 'shift-swaps'],
  ['settings', 'settings'],
  ['support', 'support'],
  ['loans', 'loans'],
  ['reports', 'reports'],
  ['audit', 'audit'],
];

/**
 * Resolve the module key for a request path.
 * Returns null when the path is not module-gated (auth, platform, public...).
 */
export function resolveModuleKey(path: string): string | null {
  const clean = path.split('?')[0].replace(/^\/+/, '');
  if (!clean) return null;
  // Longest-prefix match
  let best: { prefix: string; module: string } | null = null;
  for (const [prefix, module] of ROUTE_MODULE_MAP) {
    if (
      (clean === prefix || clean.startsWith(prefix + '/')) &&
      (!best || prefix.length > best.prefix.length)
    ) {
      best = { prefix, module };
    }
  }
  return best ? best.module : null;
}

/**
 * Route prefixes that are NEVER plan-gated (platform surface, auth, public,
 * self-service endpoints that must stay reachable per SubscriptionGuard).
 */
export const UNGATED_PREFIXES = [
  'auth',
  'uploads',
  'careers',
  'platform',
  'notifications',
  'support',
];
