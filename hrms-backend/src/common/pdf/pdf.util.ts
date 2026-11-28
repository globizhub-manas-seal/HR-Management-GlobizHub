import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Shared letterhead PDF builder (used by tax invoices and the report
 * exports). Renders:
 *  - header: logo + company name + address block, right-aligned doc title
 *  - info grids (label/value boxes)
 *  - tables with header row styling + zebra rows
 *  - totals block, footer with page numbers
 */

export interface LetterheadInfo {
  companyName: string;
  addressLines: string[];
  logoBuffer?: Buffer | null;
  /** Right block next to the letterhead (e.g. GSTIN, phone, email) */
  rightLines?: string[];
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number; // weight (proportional); default equal split
  align?: 'left' | 'right' | 'center';
}

export interface TableRow {
  [key: string]: string | number | null | undefined;
}

const BRAND_COLOR = '#0f172a';
const ACCENT_COLOR = '#10b981';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

export class LetterheadPdf {
  readonly doc: PDFKit.PDFDocument;
  private chunks: Buffer[] = [];
  private readonly left: number;
  private readonly right: number;
  private y: number;

  constructor(opts?: { landscape?: boolean }) {
    this.doc = new PDFDocument({
      size: 'A4',
      layout: opts?.landscape ? 'landscape' : 'portrait',
      margin: 40,
      bufferPages: true,
    });
    this.left = this.doc.page.margins.left;
    this.right = this.doc.page.width - this.doc.page.margins.right;
    this.y = this.doc.page.margins.top;
    this.doc.on('data', (c: Buffer) => this.chunks.push(c));
  }

  private moveDown(n = 8) {
    this.y += n;
  }

  private ensureSpace(needed: number) {
    const bottomLimit = this.doc.page.height - this.doc.page.margins.bottom - 30;
    if (this.y + needed > bottomLimit) {
      this.doc.addPage();
      this.y = this.doc.page.margins.top;
    }
  }

  letterhead(lh: LetterheadInfo, docTitle: string, docSubtitle?: string) {
    const logoH = 46;
    let textX = this.left;
    if (lh.logoBuffer) {
      try {
        this.doc.image(lh.logoBuffer, this.left, this.y, { height: logoH });
        textX = this.left + logoH + 12;
      } catch {
        // invalid image — skip silently
      }
    }

    // Right block (title)
    this.doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(BRAND_COLOR)
      .text(docTitle, this.left, this.y, {
        width: this.right - this.left,
        align: 'right',
      });
    if (docSubtitle) {
      this.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(MUTED)
        .text(docSubtitle, Math.max(this.left, this.right - 230), this.y + 20, {
          width: 230,
          align: 'right',
          ellipsis: true,
        });
    }

    // Company identity
    this.doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(BRAND_COLOR)
      .text(lh.companyName, textX, this.y + 2, { width: 330 });
    this.doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(MUTED);
    let ly = this.y + 20;
    for (const line of lh.addressLines.filter(Boolean)) {
      this.doc.text(line, textX, ly, { width: 330 });
      ly += 11;
    }
    let ry = this.y + 20;
    for (const line of (lh.rightLines ?? []).filter(Boolean)) {
      this.doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(line, this.right - 200, ry, { width: 200, align: 'right' });
      ry += 11;
    }

    this.y = Math.max(ly, ry, this.y + logoH) + 6;
    this.accentRule();
    this.moveDown(14);
  }

  /** Brand accent line under the header */
  accentRule() {
    this.doc
      .moveTo(this.left, this.y)
      .lineTo(this.right, this.y)
      .lineWidth(2)
      .strokeColor(ACCENT_COLOR)
      .stroke();
  }

  title(text: string, subtitle?: string) {
    this.ensureSpace(60);
    this.doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(BRAND_COLOR)
      .text(text, this.left, this.y);
    this.y += 16;
    if (subtitle) {
      this.doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(MUTED)
        .text(subtitle, this.left, this.y);
      this.y += 16;
    }
  }

  /**
   * Grid of label/value boxes, `items` is a list of rows of cells.
   */
  infoGrid(items: Array<Array<{ label: string; value: string }>>) {
    for (const row of items) {
      this.ensureSpace(52);
      const cellW = (this.right - this.left) / row.length;
      let x = this.left;
      for (const cell of row) {
        const boxH = 44;
        this.doc
          .rect(x, this.y, cellW - 8, boxH)
          .fillColor('#f8fafc')
          .fill();
        this.doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(MUTED)
          .text(cell.label.toUpperCase(), x + 6, this.y + 6, {
            width: cellW - 20,
          });
        this.doc
          .font('Helvetica')
          .fontSize(9.5)
          .fillColor(BRAND_COLOR)
          .text(cell.value || '-', x + 6, this.y + 18, {
            width: cellW - 20,
            height: 22,
            ellipsis: true,
          });
        x += cellW;
      }
      this.y += 52;
    }
    this.moveDown(6);
  }

  table(
    columns: TableColumn[],
    rows: TableRow[],
    opts?: { zebra?: boolean; fontSize?: number; rowPadding?: number },
  ) {
    const fs_ = opts?.fontSize ?? 8.5;
    const pad = opts?.rowPadding ?? 6;
    const totalW = this.right - this.left;
    const weights = columns.map((c) => c.width ?? 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => (w / weightSum) * totalW);

    const drawHeader = () => {
      this.ensureSpace(30);
      this.doc
        .rect(this.left, this.y, totalW, 20)
        .fillColor(BRAND_COLOR)
        .fill();
      let x = this.left;
      columns.forEach((col, i) => {
        const align = col.align ?? 'left';
        this.doc
          .font('Helvetica-Bold')
          .fontSize(fs_)
          .fillColor('#ffffff')
          .text(col.label, x + 6, this.y + 6, {
            width: widths[i] - 12,
            align: align === 'right' ? 'right' : align === 'center' ? 'center' : 'left',
          });
        x += widths[i];
      });
      this.y += 20;
    };

    drawHeader();

    rows.forEach((row, idx) => {
      // measure row height
      const heights = columns.map((col, i) => {
        const v = row[col.key];
        return this.doc
          .font('Helvetica')
          .fontSize(fs_)
          .heightOfString(String(v ?? '-'), { width: widths[i] - 12 });
      });
      const rowH = Math.max(...heights) + pad * 2;
      if (this.y + rowH > this.doc.page.height - this.doc.page.margins.bottom - 26) {
        this.doc.addPage();
        this.y = this.doc.page.margins.top;
        drawHeader();
      }
      if (opts?.zebra !== false && idx % 2 === 1) {
        this.doc
          .rect(this.left, this.y, totalW, rowH)
          .fillColor('#f8fafc')
          .fill();
      }
      let x = this.left;
      columns.forEach((col, i) => {
        const v = row[col.key];
        const align = col.align ?? 'left';
        this.doc
          .font('Helvetica')
          .fontSize(fs_)
          .fillColor(BRAND_COLOR)
          .text(String(v ?? '-'), x + 6, this.y + pad, {
            width: widths[i] - 12,
            align: align === 'right' ? 'right' : align === 'center' ? 'center' : 'left',
          });
        x += widths[i];
      });
      this.y += rowH;
      this.doc
        .moveTo(this.left, this.y)
        .lineTo(this.right, this.y)
        .lineWidth(0.5)
        .strokeColor(LINE)
        .stroke();
    });
    this.y += 10;
  }

  totals(items: Array<{ label: string; value: string; bold?: boolean; accent?: boolean }>) {
    this.ensureSpace(items.length * 16 + 12);
    const colW = 220;
    const xLabel = this.right - colW;
    for (const item of items) {
      this.doc
        .font(item.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(item.bold ? 10 : 9)
        .fillColor(item.accent ? ACCENT_COLOR : item.bold ? BRAND_COLOR : MUTED)
        .text(item.label, xLabel, this.y, { width: colW - 100, align: 'left' });
      this.doc
        .font(item.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(item.bold ? 10 : 9)
        .fillColor(item.accent ? ACCENT_COLOR : BRAND_COLOR)
        .text(item.value, this.right - 90, this.y, { width: 90, align: 'right' });
      this.y += 15;
    }
    this.moveDown(8);
  }

  paragraph(text: string, opts?: { size?: number; color?: string }) {
    this.ensureSpace(40);
    this.doc
      .font('Helvetica')
      .fontSize(opts?.size ?? 8.5)
      .fillColor(opts?.color ?? MUTED)
      .text(text, this.left, this.y, { width: this.right - this.left });
    this.y = this.doc.y + 10;
  }

  /** Stamp "PAID"/"VOID"-style status badge */
  badge(text: string, color = ACCENT_COLOR) {
    this.ensureSpace(30);
    const w = text.length * 5.6 + 24;
    const x = this.right - w;
    this.doc
      .rect(x, this.y, w, 22)
      .fillColor(color)
      .fill();
    this.doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#ffffff')
      .text(text, x, this.y + 6, { width: w, align: 'center' });
    this.y += 30;
  }

  /** Draw page footers on every page and finalize. Returns the PDF buffer. */
  finish(footerText?: string): Promise<Buffer> {
    return new Promise((resolve) => {
      // Footer on each page
      const range = this.doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        this.doc.switchToPage(i);
        this.doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(MUTED)
          .text(
            footerText ?? 'Generated by GlobizHR',
            this.doc.page.margins.left,
            this.doc.page.height - 24,
            { width: this.doc.page.width - this.doc.page.margins.left * 2, align: 'center', lineBreak: false },
          );
        this.doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(MUTED)
          .text(
            `Page ${i - range.start + 1} of ${range.count}`,
            this.doc.page.margins.left,
            this.doc.page.height - 24,
            {
              width: this.doc.page.width - this.doc.page.margins.left * 2,
              align: 'right',
              lineBreak: false,
            },
          );
      }
      this.doc.end();
      this.doc.on('end', () => resolve(Buffer.concat(this.chunks)));
    });
  }
}

/**
 * Load a logo buffer from a stored URL:
 *  - "/uploads/<file>" -> read from the backend uploads dir
 *  - "http(s)://..."   -> fetch
 * Returns null when unavailable (PDF continues without a logo).
 */
export async function loadLogoBuffer(url?: string | null): Promise<Buffer | null> {
  if (!url) return null;
  try {
    if (url.startsWith('/uploads/')) {
      const candidates = [
        path.resolve(process.cwd(), url.replace(/^\//, '')),
        path.resolve(process.cwd(), 'uploads', path.basename(url)),
        path.resolve(__dirname, '..', '..', '..', 'uploads', path.basename(url)),
        path.resolve(__dirname, '..', '..', '..', '..', 'uploads', path.basename(url)),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return fs.readFileSync(p);
      }
      return null;
    }
    if (/^https?:\/\//.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arr = new Uint8Array(await res.arrayBuffer());
      return Buffer.from(arr);
    }
  } catch {
    return null;
  }
  return null;
}

export const fmtMoney = (n: number | string | null | undefined, currency = 'INR') => {
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency + ' ';
  const v = Number(n ?? 0);
  return `${sym}${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
