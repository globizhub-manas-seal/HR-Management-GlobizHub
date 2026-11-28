/**
 * GST / Tax invoice computation shared by checkout, renewal cron and the
 * invoice PDF renderer. All rates come from SystemConfig (super-admin
 * controlled); nothing is hardcoded.
 */

export interface GstBreakdown {
  /** Base amount before tax (after discounts/coupons) */
  taxableAmount: number;
  /** Effective tax rate in % (0 when GST disabled) */
  taxRate: number;
  /** Total tax */
  taxAmount: number;
  /** Intra-state halves */
  cgstAmount: number;
  sgstAmount: number;
  /** Inter-state single line */
  igstAmount: number;
  /** "CGST+SGST" | "IGST" | null */
  taxLabel: string | null;
  placeOfSupply: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function normState(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

/**
 * Compute the GST breakup for an invoice.
 *  - gstEnabled=false            -> zero tax
 *  - company state == seller state -> CGST + SGST (split 50/50)
 *  - otherwise                    -> IGST (full rate)
 */
export function computeGst(
  baseAmount: number,
  gstPercent: number,
  companyState: string | null | undefined,
  sellerState: string,
  gstEnabled: boolean,
): GstBreakdown {
  const placeOfSupply = (companyState ?? sellerState ?? '').trim() || null;
  if (!gstEnabled || gstPercent <= 0 || baseAmount <= 0) {
    return {
      taxableAmount: round2(baseAmount),
      taxRate: 0,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxLabel: null,
      placeOfSupply,
    };
  }

  const taxAmount = round2((baseAmount * gstPercent) / 100);
  const intraState = normState(companyState) === normState(sellerState);
  if (intraState) {
    const half = round2(taxAmount / 2);
    return {
      taxableAmount: round2(baseAmount),
      taxRate: gstPercent,
      taxAmount,
      cgstAmount: half,
      sgstAmount: round2(taxAmount - half),
      igstAmount: 0,
      taxLabel: 'CGST+SGST',
      placeOfSupply,
    };
  }
  return {
    taxableAmount: round2(baseAmount),
    taxRate: gstPercent,
    taxAmount,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: taxAmount,
    taxLabel: 'IGST',
    placeOfSupply,
  };
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}

/** Indian numbering: crore / lakh / thousand / hundred */
export function amountInWordsINR(amount: number, currency = 'INR'): string {
  const safe = Math.max(0, Math.floor(amount));
  const units = [
    { value: 10_000_000, name: 'Crore' },
    { value: 100_000, name: 'Lakh' },
    { value: 1_000, name: 'Thousand' },
    { value: 100, name: 'Hundred' },
  ];
  let rest = safe;
  const parts: string[] = [];
  for (const u of units) {
    const count = Math.floor(rest / u.value);
    if (count > 0) {
      parts.push(
        `${count >= 100 ? amountInWordsINR(count) : twoDigits(count)} ${u.name}`,
      );
      rest %= u.value;
    }
  }
  if (rest > 0) parts.push(twoDigits(rest));
  const label = currency === 'INR' ? 'Rupees' : currency;
  const words = parts.length ? parts.join(' ') : 'Zero';
  return `${label} ${words} Only`;
}
