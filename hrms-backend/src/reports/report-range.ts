import { BadRequestException } from '@nestjs/common';

/**
 * Report period resolution — single-selection presets used by the tenant
 * Reports console and the platform Global Reports.
 */
export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
  preset: PeriodPreset;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * Resolve a period preset (+ optional custom range) into an inclusive
 * [from, to] window. Everything else in the report pipeline reads this.
 */
export function resolveRange(
  period?: string,
  from?: string,
  to?: string,
): DateRange {
  const now = new Date();
  const preset = (period ?? 'last30') as PeriodPreset;
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now), label: 'Today', preset };
    case 'yesterday': {
      const y = new Date(now.getTime() - 86400000);
      return { from: startOfDay(y), to: endOfDay(y), label: 'Yesterday', preset };
    }
    case 'last7':
      return {
        from: startOfDay(new Date(now.getTime() - 6 * 86400000)),
        to: endOfDay(now),
        label: 'Last 7 days',
        preset,
      };
    case 'last30':
      return {
        from: startOfDay(new Date(now.getTime() - 29 * 86400000)),
        to: endOfDay(now),
        label: 'Last 30 days',
        preset,
      };
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(s), to: endOfDay(now), label: 'This month', preset };
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: startOfDay(s),
        to: endOfDay(e),
        label: 'Last month',
        preset,
      };
    }
    case 'this_year': {
      const s = new Date(now.getFullYear(), 0, 1);
      return { from: startOfDay(s), to: endOfDay(now), label: 'This year', preset };
    }
    case 'custom': {
      if (!from || !to) {
        throw new BadRequestException(
          'Custom period requires both "from" and "to" dates (YYYY-MM-DD)',
        );
      }
      const f = new Date(from);
      const t = new Date(to);
      if (isNaN(f.getTime()) || isNaN(t.getTime())) {
        throw new BadRequestException('Invalid custom range dates');
      }
      if (f > t) {
        throw new BadRequestException('"from" must be before "to"');
      }
      return {
        from: startOfDay(f),
        to: endOfDay(t),
        label: `${from} to ${to}`,
        preset,
      };
    }
    default:
      throw new BadRequestException(
        `Unknown period "${period}". Use one of: today, yesterday, last7, last30, this_month, last_month, this_year, custom`,
      );
  }
}

export const PERIOD_PRESETS: Array<{ key: PeriodPreset; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_year', label: 'This year' },
  { key: 'custom', label: 'Custom range' },
];

export const fmtDate = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

export const fmtDateTime = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

export const fmtMoney = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/** Escape a value for CSV output */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(columns: string[], rows: Array<Record<string, unknown>>): string {
  const header = columns.map(csvCell).join(',');
  const lines = rows.map((r) => columns.map((c) => csvCell(r[c])).join(','));
  // BOM so Excel opens UTF-8 (₹ etc.) correctly
  return '\uFEFF' + [header, ...lines].join('\r\n');
}
