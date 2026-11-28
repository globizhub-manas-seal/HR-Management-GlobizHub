import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  LetterheadPdf,
  loadLogoBuffer,
} from '../common/pdf/pdf.util';
import { fmtDate, fmtDateTime } from './report-range';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportTable {
  title: string;
  columns: Array<{ key: string; label: string; width?: number; money?: boolean }>;
  rows: Array<Record<string, unknown>>;
}

export interface ExportContext {
  /** Letterhead identity */
  companyName: string;
  addressLines: string[];
  logoBuffer?: Buffer | null;
  extraHeaderLines?: string[];
  /** Report meta */
  reportTitle: string;
  rangeLabel: string;
  generatedBy?: string;
  footer?: string;
}

const fmtCell = (v: unknown, money?: boolean): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (money) {
    const n = Number(v);
    if (Number.isFinite(n)) return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (v instanceof Date) return fmtDate(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

@Injectable()
export class ReportExportService {
  private readonly logger = new Logger(ReportExportService.name);

  toCsv(tables: ExportTable[]): string {
    const parts: string[] = [];
    for (const t of tables) {
      parts.push(t.title.toUpperCase());
      parts.push(t.columns.map((c) => c.label).join(','));
      for (const row of t.rows) {
        parts.push(t.columns.map((c) => fmtCell(row[c.key], c.money)).join(','));
      }
      parts.push('');
    }
    return '\uFEFF' + parts.join('\r\n');
  }

  async toExcel(tables: ExportTable[], ctx: ExportContext): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = ctx.companyName;
    wb.created = new Date();

    const sheet = wb.addWorksheet(
      (ctx.reportTitle || 'Report').slice(0, 30).replace(/[\\*?:/\[\]]/g, ''),
    );
    sheet.columns = tables[0]?.columns.map((c) => ({
      header: c.label,
      key: c.key,
      width: c.width ?? Math.max(14, Math.min(38, c.label.length + 8)),
    }));

    // Letterhead rows
    sheet.mergeCells(1, 1, 1, Math.max(1, sheet.columns.length));
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = ctx.companyName;
    titleCell.font = { bold: true, size: 15, color: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 26;

    sheet.mergeCells(2, 1, 2, Math.max(1, sheet.columns.length));
    const addrCell = sheet.getCell(2, 1);
    addrCell.value = [...ctx.addressLines, ...(ctx.extraHeaderLines ?? [])]
      .filter(Boolean)
      .join(' • ');
    addrCell.font = { size: 9, color: { argb: 'FF64748B' } };
    addrCell.alignment = { horizontal: 'center' };

    sheet.mergeCells(3, 1, 3, Math.max(1, sheet.columns.length));
    const metaCell = sheet.getCell(3, 1);
    metaCell.value = `${ctx.reportTitle} — ${ctx.rangeLabel} (generated ${fmtDateTime(new Date())})`;
    metaCell.font = { bold: true, size: 11, color: { argb: 'FF10B981' } };
    metaCell.alignment = { horizontal: 'center' };

    let rowIdx = 5;
    for (const t of tables) {
      const headerRow = sheet.getRow(rowIdx);
      t.columns.forEach((c, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = c.label;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (!sheet.columns[i]) {
          sheet.columns[i] = { width: Math.max(14, Math.min(38, c.label.length + 8)) };
        }
      });
      headerRow.height = 18;
      rowIdx += 1;

      for (const r of t.rows) {
        const dataRow = sheet.getRow(rowIdx);
        t.columns.forEach((c, i) => {
          const cell = dataRow.getCell(i + 1);
          const v = r[c.key];
          cell.value =
            v instanceof Date
              ? v
              : typeof v === 'number' || (c.money && v !== null && v !== undefined && Number.isFinite(Number(v)))
                ? Number(v)
                : (v ?? '-') as any;
          if (c.money && typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
          if ((rowIdx - 5) % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
        });
        rowIdx += 1;
      }
      rowIdx += 1; // blank line between tables
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  async toPdf(tables: ExportTable[], ctx: ExportContext): Promise<Buffer> {
    if (!tables || tables.length === 0) {
      tables = [{ title: 'No data for the selected period', columns: [{ key: 'x', label: '-' }], rows: [] }];
    }
    const needsLandscape = tables.some((t) => t.columns.length > 7);
    const pdf = new LetterheadPdf({ landscape: needsLandscape });
    pdf.letterhead(
      {
        companyName: ctx.companyName,
        addressLines: [...ctx.addressLines, ...(ctx.extraHeaderLines ?? [])],
        logoBuffer: ctx.logoBuffer ?? null,
        rightLines: [`Period: ${ctx.rangeLabel}`],
      },
      ctx.reportTitle,
      tables.map((t) => t.title).join(' • '),
    );
    pdf.paragraph(
      `Generated ${fmtDateTime(new Date())}${ctx.generatedBy ? ` by ${ctx.generatedBy}` : ''}`,
    );

    for (const t of tables) {
      pdf.title(t.title);
      pdf.table(
        t.columns.map((c) => ({
          key: c.key,
          label: c.label,
          width: c.width,
          align: c.money ? ('right' as const) : undefined,
        })),
        t.rows.map((r) => {
          const out: Record<string, string> = {};
          for (const c of t.columns) {
            out[c.key] = fmtCell(r[c.key], c.money);
          }
          return out;
        }),
        { fontSize: tables[0].columns.length > 8 ? 7 : 8 },
      );
    }

    return pdf.finish(ctx.footer ?? `${ctx.companyName} • Generated by GlobizHR`);
  }

  /** Convenience: load a logo stored in CompanySettings.companyLogo */
  async loadCompanyLogo(url?: string | null): Promise<Buffer | null> {
    return loadLogoBuffer(url);
  }
}
