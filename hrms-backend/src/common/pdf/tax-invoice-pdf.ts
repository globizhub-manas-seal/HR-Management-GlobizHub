import { LetterheadPdf, loadLogoBuffer, fmtMoney, fmtDate } from './pdf.util';
import { amountInWordsINR } from '../gst';

/**
 * GST-compliant Tax Invoice renderer for subscription invoices.
 *
 * Seller identity comes from the invoice snapshot (SystemConfig at issue
 * time); buyer identity from the tenant company. Renders CGST/SGST split
 * for intra-state supply and IGST for inter-state supply.
 */
export async function renderTaxInvoicePdf(
  invoice: {
    invoiceNumber: string;
    amountDue: any;
    amountPaid: any;
    currency: string;
    status: string;
    dueDate: Date;
    createdAt: Date;
    paidAt?: Date | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    perUserPrice?: any | null;
    userCount?: number | null;
    couponCode?: string | null;
    taxableAmount?: any | null;
    taxLabel?: string | null;
    taxRate?: any | null;
    taxAmount?: any | null;
    cgstAmount?: any | null;
    sgstAmount?: any | null;
    igstAmount?: any | null;
    placeOfSupply?: string | null;
    sellerName?: string | null;
    sellerAddress?: string | null;
    sellerGstin?: string | null;
    buyerGstin?: string | null;
    sacCode?: string | null;
    notes?: string | null;
  },
  company: {
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    gstin?: string | null;
    email?: string | null;
  },
  logoBuffer?: Buffer | null,
): Promise<Buffer> {
  const pdf = new LetterheadPdf();

  const currency = invoice.currency || 'INR';
  const taxable = Number(invoice.taxableAmount ?? invoice.amountDue ?? 0);
  const taxAmount = Number(invoice.taxAmount ?? 0);
  const total = Number(invoice.amountDue ?? 0);
  const paid = Number(invoice.amountPaid ?? 0);
  const balance = Math.max(0, total - paid);

  pdf.letterhead(
    {
      companyName: invoice.sellerName || 'GlobizHR',
      addressLines: [invoice.sellerAddress ?? ''].filter(Boolean),
      logoBuffer,
      rightLines: [
        invoice.sellerGstin ? `GSTIN: ${invoice.sellerGstin}` : '',
        invoice.sacCode ? `SAC: ${invoice.sacCode}` : '',
      ],
    },
    invoice.taxLabel ? 'TAX INVOICE' : 'INVOICE',
    `Invoice ${invoice.invoiceNumber}`,
  );

  if (invoice.status === 'PAID') {
    pdf.badge('PAID');
  } else if (invoice.status === 'ISSUED') {
    pdf.badge('PAYMENT DUE', '#f59e0b');
  }

  pdf.infoGrid([
    [
      {
        label: 'Billed To',
        value: company.name,
      },
      {
        label: 'Invoice Number',
        value: invoice.invoiceNumber,
      },
      {
        label: 'Invoice Date',
        value: fmtDate(invoice.createdAt),
      },
    ],
    [
      {
        label: 'Buyer Address',
        value: [company.address, company.city, company.state, company.pincode]
          .filter(Boolean)
          .join(', '),
      },
      {
        label: 'Buyer GSTIN',
        value: invoice.buyerGstin || company.gstin || '-',
      },
      {
        label: 'Place of Supply',
        value: invoice.placeOfSupply || company.state || '-',
      },
    ],
    [
      {
        label: 'Billing Period',
        value:
          invoice.periodStart && invoice.periodEnd
            ? `${fmtDate(invoice.periodStart)} — ${fmtDate(invoice.periodEnd)}`
            : '-',
      },
      {
        label: 'Due Date',
        value: fmtDate(invoice.dueDate),
      },
      {
        label: 'Payment Status',
        value: invoice.status === 'PAID' ? `Paid${invoice.paidAt ? ' on ' + fmtDate(invoice.paidAt) : ''}` : invoice.status,
      },
    ],
  ]);

  const perUser = invoice.perUserPrice ? Number(invoice.perUserPrice) : null;
  const seats = invoice.userCount ?? null;
  const description =
    seats && perUser
      ? `GlobizHR HRMS subscription — ${seats} user(s) × ${fmtMoney(perUser, currency)}/month (annual contract)`
      : 'GlobizHR HRMS subscription';

  pdf.table(
    [
      { key: 'description', label: 'Description', width: 4 },
      { key: 'sac', label: 'SAC', width: 1 },
      { key: 'taxable', label: 'Taxable Value', width: 1.4, align: 'right' },
      { key: 'rate', label: 'Tax Rate', width: 1, align: 'right' },
      { key: 'tax', label: 'Tax Amount', width: 1.2, align: 'right' },
      { key: 'total', label: 'Total', width: 1.4, align: 'right' },
    ],
    [
      {
        description,
        sac: invoice.sacCode || '-',
        taxable: fmtMoney(taxable, currency),
        rate: invoice.taxLabel ? `${Number(invoice.taxRate ?? 0)}%` : '—',
        tax: invoice.taxLabel ? fmtMoney(taxAmount, currency) : '—',
        total: fmtMoney(total, currency),
      },
    ],
  );

  const totals: Array<{ label: string; value: string; bold?: boolean; accent?: boolean }> = [
    { label: 'Taxable Value', value: fmtMoney(taxable, currency) },
  ];
  if (invoice.taxLabel === 'CGST+SGST') {
    totals.push({ label: 'CGST', value: fmtMoney(invoice.cgstAmount ?? 0, currency) });
    totals.push({ label: 'SGST', value: fmtMoney(invoice.sgstAmount ?? 0, currency) });
  } else if (invoice.taxLabel === 'IGST') {
    totals.push({ label: 'IGST', value: fmtMoney(invoice.igstAmount ?? 0, currency) });
  }
  totals.push({ label: 'Invoice Total', value: fmtMoney(total, currency), bold: true });
  if (paid > 0) {
    totals.push({ label: 'Amount Paid', value: fmtMoney(paid, currency) });
    totals.push({ label: 'Balance Due', value: fmtMoney(balance, currency), accent: balance > 0 });
  }
  pdf.totals(totals);

  pdf.paragraph(`Amount in words: ${amountInWordsINR(total, currency)}`);

  if (invoice.couponCode) {
    pdf.paragraph(`Coupon applied: ${invoice.couponCode} (discount reflected in the taxable value).`);
  }

  pdf.paragraph(
    invoice.notes ||
      'This is a computer-generated tax invoice. Payments are processed securely through Razorpay.',
  );

  return pdf.finish(
    `${invoice.sellerName ?? 'GlobizHR'} • Invoice ${invoice.invoiceNumber} • Generated ${fmtDate(new Date())}`,
  );
}

export { loadLogoBuffer };
