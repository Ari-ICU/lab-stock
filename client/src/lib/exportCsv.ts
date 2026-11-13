/**
 * CSD Stock — Institutional Excel (.xlsx) & Data Exporter
 * Generates print-ready native Microsoft Excel (.xlsx) workbooks compliant with
 * ECMA-376 / ISO 29500 (Excel for Mac, Windows, LibreOffice Calc, Apple Numbers),
 * featuring institutional masthead, metadata bar, shared string table, semantic status
 * styling, wrapped text, dynamic row heights, live Excel SUM totals, frozen header panes,
 * ISO A4 print setup (portrait/landscape fit-to-width, repeated headers, print area), and sign-off blocks.
 */

export interface ExportOptions {
  sheetTitle?: string;
  reportTitle?: string;
  reportSubtitle?: string;
  institutionName?: string;
  departmentName?: string;
  referenceCode?: string;
  preparedBy?: string;
  includeRowNumbers?: boolean;
  includeSummaryRow?: boolean;
  includeSignOff?: boolean;
  pageOrientation?: 'auto' | 'portrait' | 'landscape';
  format?: 'xlsx' | 'csv';
  notify?: (message: string) => void;
}

const DEFAULT_INSTITUTION_LINE =
  'KINGDOM OF CAMBODIA  •  MINISTRY OF EDUCATION, YOUTH AND SPORT  •  ROYAL UNIVERSITY OF PHNOM PENH';
const DEFAULT_DEPARTMENT_LINE =
  'Faculty of Science — Department of Computer Science (CSD)  |  Laboratory Fleet & Asset Management';

// Style indices matching <cellXfs> in styles.xml (pure white paper, zero cell fill backgrounds)
const S = {
  DEFAULT: 0,
  MASTHEAD: 1,
  SUBMASTHEAD: 2,
  TITLE: 3,
  META_LEFT: 4,
  META_RIGHT: 5,
  COL_HEADER: 6,
  DATA_TEXT: 7,
  DATA_BOLD: 8,
  DATA_CENTER: 9,
  DATA_NUM: 10,
  DATA_DEC: 11,
  DATA_PLAIN_NUM: 12,
  STATUS_GOOD: 13,
  STATUS_WARN: 14,
  STATUS_CRIT: 15,
  STATUS_INFO: 16,
  TOTAL_LABEL: 17,
  TOTAL_CENTER: 18,
  TOTAL_NUM: 19,
  TOTAL_DEC: 20,
  SIG_HEADER: 21,
  SIG_SPACE: 22,
  SIG_META: 23,
} as const;

/** Humanize system enums into clean international labels. */
function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '';

  const str = String(val).trim();
  switch (str) {
    case 'in_stock':
      return 'In Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'operational':
      return 'Operational';
    case 'in_use':
      return 'In Production';
    case 'maintenance':
      return 'Maintenance / Servicing';
    case 'available':
      return 'Available';
    case 'on_loan':
      return 'Checked Out';
    case 'active':
      return 'Active';
    case 'returned':
      return 'Returned';
    case 'overdue':
      return 'Overdue';
    case 'healthy':
    case 'HEALTHY':
      return 'Healthy';
    case 'attention':
    case 'ATTENTION':
    case 'warning':
    case 'WARNING':
      return 'Attention Required';
    case 'critical':
    case 'CRITICAL':
      return 'Critical';
    default:
      return str;
  }
}

/** Escape XML special characters and strip invalid XML 1.0 control characters. */
function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColLetter(colIdx: number): string {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function sanitizeSheetName(name: string): string {
  const cleaned = name
    .replace(/[\\/?*\[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^'+|'+$/g, '');
  const slice = (cleaned || 'Report')
    .slice(0, 31)
    .trim()
    .replace(/^'+|'+$/g, '')
    .trim();
  return slice || 'Report';
}

function deriveReportTitle(filename: string): string {
  return (
    filename
      .replace(/^csd_stock_|^csd_|_report$/gi, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'Inventory & Asset Register'
  );
}

function getPreparedByLabel(explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  if (typeof window === 'undefined') return 'Authorized System Operator';
  try {
    const raw = localStorage.getItem('lab_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; role?: string };
      if (parsed?.name) {
        return parsed.role ? `${parsed.name} (${parsed.role})` : parsed.name;
      }
    }
  } catch {
    // ignore storage read failures
  }
  return 'Authorized System Operator';
}

function classifyStatusStyle(header: string, value: string): number | null {
  const h = header.toLowerCase();
  const isStatusCol =
    h.includes('status') ||
    h.includes('condition') ||
    h.includes('health') ||
    h === 'warranty / condition';
  if (!isStatusCol) return null;

  const v = value.toLowerCase();
  if (
    v === 'in stock' ||
    v === 'operational' ||
    v === 'available' ||
    v === 'active' ||
    v === 'returned' ||
    v === 'healthy' ||
    v === 'excellent' ||
    v === 'good'
  ) {
    return S.STATUS_GOOD;
  }
  if (
    v === 'out of stock' ||
    v === 'overdue' ||
    v === 'critical' ||
    v === 'broken'
  ) {
    return S.STATUS_CRIT;
  }
  if (
    v === 'low stock' ||
    v.includes('maintenance') ||
    v.includes('attention') ||
    v.includes('warning') ||
    v.includes('repair') ||
    v.includes('pending')
  ) {
    return S.STATUS_WARN;
  }
  if (v === 'checked out' || v === 'in production' || v === 'on_loan') {
    return S.STATUS_INFO;
  }
  return null;
}

function isCenteredHeader(header: string): boolean {
  const h = header.toLowerCase();
  return (
    h === 'no.' ||
    h.includes('code') ||
    h.includes('sku') ||
    h.includes('serial') ||
    h.includes('room number') ||
    h.includes('room type') ||
    h === 'unit' ||
    h === 'unit measure' ||
    h === 'unit type' ||
    h.includes('date') ||
    h.includes('audited') ||
    h.includes('role')
  );
}

function isPrimaryBoldHeader(header: string, dataColIdx: number): boolean {
  if (dataColIdx === 0) return true;
  const h = header.toLowerCase();
  return (
    h === 'item name' ||
    h === 'equipment name' ||
    h === 'equipment / item name' ||
    h === 'facility name' ||
    h === 'parameter'
  );
}

function isAdditiveNumericColumn(header: string, rows: Record<string, unknown>[]): boolean {
  const h = header.toLowerCase();
  if (
    h.includes('id') ||
    h.includes('year') ||
    h.includes('serial') ||
    h.includes('phone') ||
    h.includes('rate') ||
    h.includes('percent') ||
    h === 'no.'
  ) {
    return false;
  }
  const hasAdditiveName =
    h.includes('unit') ||
    h.includes('qty') ||
    h.includes('quantity') ||
    h.includes('count') ||
    h.includes('broken') ||
    h.includes('working') ||
    h.includes('repair') ||
    h.includes('maintenance') ||
    h.includes('capacity') ||
    h.includes('seat') ||
    h.includes('allocation') ||
    h.includes('stock');
  if (!hasAdditiveName) return false;

  return rows.every((r) => typeof r[header] === 'number' && Number.isFinite(r[header] as number));
}

function isPlainNumberHeader(header: string): boolean {
  const h = header.toLowerCase();
  return h === 'no.' || h.includes('id') || h.includes('year') || h.includes('code');
}

// CRC32 table for ZIP generation
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (let i = 0; i < arrays.length; i++) {
    totalLength += arrays[i].length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < arrays.length; i++) {
    result.set(arrays[i], offset);
    offset += arrays[i].length;
  }
  return result;
}

interface ZipFileEntry {
  name: string;
  data: string | Uint8Array;
}

function createZipArchive(files: ZipFileEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const year = Math.max(1980, now.getFullYear());
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  const fileEntries: { nameBytes: Uint8Array; crc: number; size: number; offset: number }[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = calculateCrc32(dataBytes);
    const size = dataBytes.length;

    const header = new Uint8Array(30);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);

    fileEntries.push({ nameBytes, crc, size, offset });
    parts.push(header, nameBytes, dataBytes);
    offset += header.length + nameBytes.length + dataBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cd = new Uint8Array(46);
    const view = new DataView(cd.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, dosTime, true);
    view.setUint16(14, dosDate, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.size, true);
    view.setUint32(24, entry.size, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, entry.offset, true);

    parts.push(cd, entry.nameBytes);
    centralDirSize += cd.length + entry.nameBytes.length;
  }

  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileEntries.length, true);
  view.setUint16(10, fileEntries.length, true);
  view.setUint32(12, centralDirSize, true);
  view.setUint32(16, centralDirOffset, true);
  view.setUint16(20, 0, true);

  parts.push(eocd);
  return concatUint8Arrays(parts);
}

class SharedStringPool {
  private readonly list: string[] = [];
  private readonly indexByText = new Map<string, number>();
  private totalCount = 0;

  intern(text: string): number {
    this.totalCount++;
    const existing = this.indexByText.get(text);
    if (existing !== undefined) return existing;
    const idx = this.list.length;
    this.list.push(text);
    this.indexByText.set(text, idx);
    return idx;
  }

  toXml(): string {
    const items = this.list
      .map((s) => {
        const escaped = escapeXml(s);
        const preserve = /^\s|\s$/.test(s) ? ' xml:space="preserve"' : '';
        return `<si><t${preserve}>${escaped}</t></si>`;
      })
      .join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.totalCount}" uniqueCount="${this.list.length}">${items}</sst>`;
  }
}

/**
 * Emit a complete merged row so every underlying cell carries consistent border/fill styles.
 */
function buildMergedBandRow(
  rowNum: number,
  heightPt: number,
  totalCols: number,
  sst: SharedStringPool,
  segments: Array<{ startCol: number; endCol: number; style: number; value?: string }>
): { rowXml: string; mergeRefs: string[] } {
  let rowXml = `<row r="${rowNum}" ht="${heightPt}" customHeight="1">`;
  const mergeRefs: string[] = [];

  for (let c = 0; c < totalCols; c++) {
    const seg = segments.find((s) => c >= s.startCol && c <= s.endCol);
    const style = seg ? seg.style : S.DEFAULT;
    const ref = `${getColLetter(c)}${rowNum}`;
    if (seg && c === seg.startCol && seg.value !== undefined) {
      const sstIdx = sst.intern(seg.value);
      rowXml += `<c r="${ref}" s="${style}" t="s"><v>${sstIdx}</v></c>`;
    } else {
      rowXml += `<c r="${ref}" s="${style}"/>`;
    }
  }
  rowXml += '</row>';

  for (const seg of segments) {
    if (seg.endCol > seg.startCol) {
      mergeRefs.push(`${getColLetter(seg.startCol)}${rowNum}:${getColLetter(seg.endCol)}${rowNum}`);
    }
  }

  return { rowXml, mergeRefs };
}

function buildXlsxWorkbook(
  filename: string,
  rows: Record<string, unknown>[],
  options?: ExportOptions
): Uint8Array {
  const dataHeaders = Object.keys(rows[0]);
  const hasExistingNo =
    dataHeaders[0]?.trim().toLowerCase() === 'no.' || dataHeaders[0]?.trim() === '#';
  const includeNo = options?.includeRowNumbers !== false && !hasExistingNo;
  const headers = includeNo ? ['No.', ...dataHeaders] : dataHeaders;
  const totalCols = headers.length;
  const lastColIdx = totalCols - 1;
  const lastColLetter = getColLetter(lastColIdx);

  const safeSheetTitle = sanitizeSheetName(options?.sheetTitle || deriveReportTitle(filename));
  const reportTitle = (options?.reportTitle || deriveReportTitle(filename)).toUpperCase();
  const institutionLine = options?.institutionName || DEFAULT_INSTITUTION_LINE;
  const departmentLine = options?.reportSubtitle
    ? `${options?.departmentName || DEFAULT_DEPARTMENT_LINE}  —  ${options.reportSubtitle}`
    : options?.departmentName || DEFAULT_DEPARTMENT_LINE;

  const now = new Date();
  const isoDate = now.toISOString().split('T')[0];
  const dateCompact = isoDate.replace(/-/g, '');
  const timeShort = now.toTimeString().slice(0, 5);
  const docRef =
    options?.referenceCode ||
    `RUPP-CSD-${dateCompact}-${filename.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'RPT'}`;
  const preparedBy = getPreparedByLabel(options?.preparedBy);

  // Compute balanced column widths; allow long multi-word headers to wrap onto 2 lines inside compact numeric columns
  const minWidthScale = totalCols <= 5 ? 18 : 13;
  const colWidths = headers.map((h, colIdx) => {
    if (includeNo && colIdx === 0) return 6.5;
    const headerWords = h.split(/[\s/]+/).filter(Boolean);
    const longestHeaderWord = headerWords.reduce((best, w) => Math.max(best, w.length), 0);
    const targetHeaderWidth =
      h.includes(' ') && h.length > 14
        ? Math.max(longestHeaderWord + 4, Math.ceil(h.length * 0.62))
        : h.length;

    let maxLen = targetHeaderWidth;
    for (const row of rows) {
      const formatted = formatCellValue(row[h]);
      const longestLine = formatted
        .split(/\r?\n/)
        .reduce((best, line) => Math.max(best, line.length), 0);
      if (longestLine > maxLen) maxLen = longestLine;
    }
    return Math.max(minWidthScale, Math.min(48, Math.ceil(maxLen * 1.1) + 4));
  });

  let colsXml = '<cols>';
  colWidths.forEach((w, idx) => {
    colsXml += `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`;
  });
  colsXml += '</cols>';

  const sst = new SharedStringPool();
  const mergeRefs: string[] = [];
  let sheetDataXml = '<sheetData>';
  const totalCharWidth = colWidths.reduce((sum, w) => sum + w, 0);

  // Row 1: Institutional Masthead Banner
  const r1Lines = Math.max(1, Math.ceil(institutionLine.length / Math.max(24, totalCharWidth - 6)));
  const r1 = buildMergedBandRow(1, Math.max(24, r1Lines * 16 + 8), totalCols, sst, [
    { startCol: 0, endCol: lastColIdx, style: S.MASTHEAD, value: institutionLine },
  ]);
  sheetDataXml += r1.rowXml;
  mergeRefs.push(...r1.mergeRefs);

  // Row 2: Faculty & Department Banner
  const r2Lines = Math.max(1, Math.ceil(departmentLine.length / Math.max(28, totalCharWidth - 6)));
  const r2 = buildMergedBandRow(2, Math.max(21, r2Lines * 14 + 7), totalCols, sst, [
    { startCol: 0, endCol: lastColIdx, style: S.SUBMASTHEAD, value: departmentLine },
  ]);
  sheetDataXml += r2.rowXml;
  mergeRefs.push(...r2.mergeRefs);

  // Row 3: Official Report Title
  const r3Lines = Math.max(1, Math.ceil(reportTitle.length / Math.max(22, totalCharWidth - 8)));
  const r3 = buildMergedBandRow(3, Math.max(28, r3Lines * 18 + 10), totalCols, sst, [
    { startCol: 0, endCol: lastColIdx, style: S.TITLE, value: reportTitle },
  ]);
  sheetDataXml += r3.rowXml;
  mergeRefs.push(...r3.mergeRefs);

  // Row 4: Document Reference & Metadata Strip
  if (totalCols === 1) {
    const singleMeta = `Ref: ${docRef} | Records: ${rows.length} | By: ${preparedBy} | ${isoDate} ${timeShort}`;
    const r4Lines = Math.max(1, Math.ceil(singleMeta.length / Math.max(20, totalCharWidth - 4)));
    const r4 = buildMergedBandRow(4, Math.max(20, r4Lines * 14 + 6), totalCols, sst, [
      {
        startCol: 0,
        endCol: 0,
        style: S.META_LEFT,
        value: singleMeta,
      },
    ]);
    sheetDataXml += r4.rowXml;
    mergeRefs.push(...r4.mergeRefs);
  } else {
    const metaSplitIdx = Math.floor((totalCols - 1) / 2);
    const leftText = `Document Ref: ${docRef}   |   Total Records: ${rows.length}`;
    const rightText = `Prepared By: ${preparedBy}   |   Generated: ${isoDate} ${timeShort}`;
    const halfWidth = Math.max(20, Math.floor(totalCharWidth / 2) - 4);
    const r4Lines = Math.max(1, Math.ceil(leftText.length / halfWidth), Math.ceil(rightText.length / halfWidth));
    const r4 = buildMergedBandRow(4, Math.max(20, r4Lines * 14 + 6), totalCols, sst, [
      {
        startCol: 0,
        endCol: metaSplitIdx,
        style: S.META_LEFT,
        value: leftText,
      },
      {
        startCol: metaSplitIdx + 1,
        endCol: lastColIdx,
        style: S.META_RIGHT,
        value: rightText,
      },
    ]);
    sheetDataXml += r4.rowXml;
    mergeRefs.push(...r4.mergeRefs);
  }

  // Row 5: Clean visual spacer row
  sheetDataXml += '<row r="5" ht="10" customHeight="1"/>';

  // Row 6: Table Column Headers (Frozen & AutoFilter target)
  const HEADER_ROW = 6;
  const maxHeaderLines = headers.reduce((best, h, idx) => {
    const lines = Math.ceil(h.length / Math.max(6, colWidths[idx] - 3));
    return Math.max(best, lines);
  }, 1);
  const headerHeight = Math.max(28, Math.min(48, maxHeaderLines * 14 + 10));
  sheetDataXml += `<row r="${HEADER_ROW}" ht="${headerHeight}" customHeight="1">`;
  headers.forEach((h, colIdx) => {
    const ref = `${getColLetter(colIdx)}${HEADER_ROW}`;
    const sstIdx = sst.intern(h);
    sheetDataXml += `<c r="${ref}" s="${S.COL_HEADER}" t="s"><v>${sstIdx}</v></c>`;
  });
  sheetDataXml += '</row>';

  // Rows 7+: Data Records
  const FIRST_DATA_ROW = 7;
  rows.forEach((row, rowIdx) => {
    const rowNum = FIRST_DATA_ROW + rowIdx;

    let maxRowLines = 1;
    headers.forEach((h, colIdx) => {
      if (includeNo && colIdx === 0) return;
      const val = formatCellValue(row[h]);
      if (!val) return;
      const effectiveChars = Math.max(8, colWidths[colIdx] - 3);
      const lineCount = val
        .split(/\r?\n/)
        .reduce((acc, part) => acc + Math.max(1, Math.ceil(part.length / effectiveChars)), 0);
      if (lineCount > maxRowLines) maxRowLines = lineCount;
    });
    const rowHeight = Math.max(22, Math.min(115, maxRowLines * 14.5 + 7));

    sheetDataXml += `<row r="${rowNum}" ht="${rowHeight}" customHeight="1">`;
    headers.forEach((h, colIdx) => {
      const ref = `${getColLetter(colIdx)}${rowNum}`;
      if (includeNo && colIdx === 0) {
        sheetDataXml += `<c r="${ref}" s="${S.DATA_PLAIN_NUM}"><v>${rowIdx + 1}</v></c>`;
        return;
      }

      const dataIdx = includeNo ? colIdx - 1 : colIdx;
      const rawVal = row[h];
      if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
        const styleId = isPlainNumberHeader(h)
          ? S.DATA_PLAIN_NUM
          : Number.isInteger(rawVal)
          ? S.DATA_NUM
          : S.DATA_DEC;
        sheetDataXml += `<c r="${ref}" s="${styleId}"><v>${rawVal}</v></c>`;
        return;
      }

      const formatted = formatCellValue(rawVal);
      const statusStyle = classifyStatusStyle(h, formatted);
      const styleId =
        statusStyle !== null
          ? statusStyle
          : isPrimaryBoldHeader(h, dataIdx)
          ? S.DATA_BOLD
          : isCenteredHeader(h)
          ? S.DATA_CENTER
          : S.DATA_TEXT;

      if (!formatted) {
        sheetDataXml += `<c r="${ref}" s="${styleId}"/>`;
        return;
      }

      const sstIdx = sst.intern(formatted);
      sheetDataXml += `<c r="${ref}" s="${styleId}" t="s"><v>${sstIdx}</v></c>`;
    });
    sheetDataXml += '</row>';
  });

  const lastDataRow = FIRST_DATA_ROW + rows.length - 1;
  let currentRow = lastDataRow + 1;

  // Optional Accounting Summary / Totals Row with native Excel SUM formulas
  const additiveCols = dataHeaders.filter((h) => isAdditiveNumericColumn(h, rows));
  const shouldIncludeSummary =
    options?.includeSummaryRow !== false && rows.length > 1 && additiveCols.length > 0;

  if (shouldIncludeSummary) {
    const labelIdx = includeNo ? 1 : 0;
    const firstNonAdditiveIsPrimary = !additiveCols.includes(headers[labelIdx]);
    sheetDataXml += `<row r="${currentRow}" ht="24" customHeight="1">`;
    headers.forEach((h, colIdx) => {
      const ref = `${getColLetter(colIdx)}${currentRow}`;
      if (includeNo && colIdx === 0) {
        if (!firstNonAdditiveIsPrimary) {
          const sstIdx = sst.intern('TOTAL');
          sheetDataXml += `<c r="${ref}" s="${S.TOTAL_CENTER}" t="s"><v>${sstIdx}</v></c>`;
        } else {
          sheetDataXml += `<c r="${ref}" s="${S.TOTAL_CENTER}"/>`;
        }
        return;
      }
      if (colIdx === labelIdx && firstNonAdditiveIsPrimary) {
        const sstIdx = sst.intern(`TOTAL (${rows.length} Records)`);
        sheetDataXml += `<c r="${ref}" s="${S.TOTAL_LABEL}" t="s"><v>${sstIdx}</v></c>`;
        return;
      }
      if (additiveCols.includes(h)) {
        const colLetter = getColLetter(colIdx);
        let sum = 0;
        let allInt = true;
        for (const r of rows) {
          const n = r[h] as number;
          sum += n;
          if (!Number.isInteger(n)) allInt = false;
        }
        const totalStyle = allInt ? S.TOTAL_NUM : S.TOTAL_DEC;
        sheetDataXml += `<c r="${ref}" s="${totalStyle}"><f>SUM(${colLetter}${FIRST_DATA_ROW}:${colLetter}${lastDataRow})</f><v>${sum}</v></c>`;
        return;
      }
      sheetDataXml += `<c r="${ref}" s="${S.TOTAL_LABEL}"/>`;
    });
    sheetDataXml += '</row>';
    currentRow++;
  }

  // Official Verification & Sign-Off Block (for RUPP / Ministry submission)
  let lastUsedRow = currentRow - 1;
  if (options?.includeSignOff !== false && totalCols >= 3) {
    sheetDataXml += `<row r="${currentRow}" ht="14" customHeight="1"/>`;
    currentRow++;

    const sigBanner = buildMergedBandRow(currentRow, 20, totalCols, sst, [
      {
        startCol: 0,
        endCol: lastColIdx,
        style: S.SIG_HEADER,
        value: 'OFFICIAL VERIFICATION & INSTITUTIONAL ENDORSEMENT',
      },
    ]);
    sheetDataXml += sigBanner.rowXml;
    mergeRefs.push(...sigBanner.mergeRefs);
    currentRow++;

    const sigSegments: Array<{ startCol: number; endCol: number; title: string }> =
      totalCols >= 6
        ? (() => {
            const c1End = Math.floor(totalCols / 3) - 1;
            const c2End = Math.floor((2 * totalCols) / 3) - 1;
            return [
              { startCol: 0, endCol: c1End, title: 'Prepared By (Lab Officer / Staff)' },
              { startCol: c1End + 1, endCol: c2End, title: 'Reviewed By (Laboratory Supervisor)' },
              { startCol: c2End + 1, endCol: lastColIdx, title: 'Approved By (Head of Department / Dean)' },
            ];
          })()
        : (() => {
            const mid = Math.floor((totalCols - 1) / 2);
            return [
              { startCol: 0, endCol: mid, title: 'Prepared By (Lab Officer)' },
              { startCol: mid + 1, endCol: lastColIdx, title: 'Approved By (Head of Department)' },
            ];
          })();

    const sigTitles = buildMergedBandRow(
      currentRow,
      20,
      totalCols,
      sst,
      sigSegments.map((s) => ({
        startCol: s.startCol,
        endCol: s.endCol,
        style: S.SIG_HEADER,
        value: s.title,
      }))
    );
    sheetDataXml += sigTitles.rowXml;
    mergeRefs.push(...sigTitles.mergeRefs);
    currentRow++;

    const sigBox = buildMergedBandRow(
      currentRow,
      40,
      totalCols,
      sst,
      sigSegments.map((s) => ({
        startCol: s.startCol,
        endCol: s.endCol,
        style: S.SIG_SPACE,
        value: 'Signature & Institutional Stamp',
      }))
    );
    sheetDataXml += sigBox.rowXml;
    mergeRefs.push(...sigBox.mergeRefs);
    currentRow++;

    const sigMeta = buildMergedBandRow(
      currentRow,
      24,
      totalCols,
      sst,
      sigSegments.map((s) => ({
        startCol: s.startCol,
        endCol: s.endCol,
        style: S.SIG_META,
        value: 'Name: ________________   Date: ____ / ____ / 20____',
      }))
    );
    sheetDataXml += sigMeta.rowXml;
    mergeRefs.push(...sigMeta.mergeRefs);
    lastUsedRow = currentRow;
  }

  sheetDataXml += '</sheetData>';

  const autoFilterXml = `<autoFilter ref="A${HEADER_ROW}:${lastColLetter}${lastDataRow}"/>`;
  const mergeCellsXml =
    mergeRefs.length > 0
      ? `<mergeCells count="${mergeRefs.length}">${mergeRefs.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`
      : '';

  const orientation: 'portrait' | 'landscape' =
    options?.pageOrientation === 'portrait' || options?.pageOrientation === 'landscape'
      ? options.pageOrientation
      : totalCols <= 6
      ? 'portrait'
      : 'landscape';

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <dimension ref="A1:${lastColLetter}${lastUsedRow}"/>
  <sheetViews>
    <sheetView showGridLines="1" tabSelected="1" workbookViewId="0">
      <pane ySplit="${HEADER_ROW}" topLeftCell="A${FIRST_DATA_ROW}" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A${FIRST_DATA_ROW}" sqref="A${FIRST_DATA_ROW}"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="20"/>
  ${colsXml}
  ${sheetDataXml}
  ${autoFilterXml}
  ${mergeCellsXml}
  <printOptions horizontalCentered="1"/>
  <pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.25" footer="0.25"/>
  <pageSetup paperSize="9" orientation="${orientation}" fitToWidth="1" fitToHeight="0"/>
  <headerFooter>
    <oddFooter>&amp;LCSD Stock • Royal University of Phnom Penh&amp;C${escapeXml(docRef)}&amp;RPage &amp;P of &amp;N</oddFooter>
  </headerFooter>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="10">
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FF0B2545"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="13"/><color rgb="FF0F172A"/><name val="Arial"/><family val="2"/></font>
    <font><sz val="9"/><color rgb="FF475569"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="9"/><color rgb="FF1E293B"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="9"/><color rgb="FF065F46"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="9"/><color rgb="FF92400E"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="9"/><color rgb="FF9F1239"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="9"/><color rgb="FF1E40AF"/><name val="Arial"/><family val="2"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="7">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="medium"><color rgb="FF0F172A"/></top>
      <bottom style="medium"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/><top/>
      <bottom style="medium"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left/><right/><top/>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FF0F172A"/></top>
      <bottom style="double"><color rgb="FF0F172A"/></bottom>
      <diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FF94A3B8"/></left>
      <right style="thin"><color rgb="FF94A3B8"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="thin"><color rgb="FF94A3B8"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="24">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="4" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="4" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="4" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="8" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="9" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="5" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="5" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="3" fontId="1" fillId="0" borderId="5" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="4" fontId="1" fillId="0" borderId="5" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="bottom" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="6" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

  const escapedPrintTitleSheet = safeSheetTitle.replace(/'/g, "''");
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <fileVersion appName="xl" lastEdited="7" lowestEdited="7" rupBuild="24520"/>
  <workbookPr defaultThemeVersion="166925"/>
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/>
  </bookViews>
  <sheets>
    <sheet name="${escapeXml(safeSheetTitle)}" sheetId="1" r:id="rId1"/>
  </sheets>
  <definedNames>
    <definedName name="_xlnm.Print_Area" localSheetId="0">'${escapeXml(escapedPrintTitleSheet)}'!$A$1:$${lastColLetter}$${lastUsedRow}</definedName>
    <definedName name="_xlnm.Print_Titles" localSheetId="0">'${escapeXml(escapedPrintTitleSheet)}'!$1:$${HEADER_ROW}</definedName>
  </definedNames>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>`;

  const isoTimestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(reportTitle)}</dc:title>
  <dc:subject>${escapeXml(departmentLine)}</dc:subject>
  <dc:creator>${escapeXml(preparedBy)}</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${isoTimestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${isoTimestamp}</dcterms:modified>
</cp:coreProperties>`;

  // CT_Properties XSD sequence requires Company before Application
  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Company>Royal University of Phnom Penh — Faculty of Science</Company>
  <Application>Microsoft Excel</Application>
</Properties>`;

  const sharedStringsXml = sst.toXml();

  const files: ZipFileEntry[] = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    },
    { name: 'docProps/core.xml', data: coreXml },
    { name: 'docProps/app.xml', data: appXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/sharedStrings.xml', data: sharedStringsXml },
    { name: 'xl/worksheets/sheet1.xml', data: sheet1Xml },
  ];

  return createZipArchive(files);
}

/**
 * Universal Dataset Exporter.
 * Generates institutional-grade Microsoft Excel (.xlsx) reports by default,
 * or sanitized UTF-8 CSV when `format: 'csv'` is requested.
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  options?: ExportOptions
): boolean {
  if (!rows || rows.length === 0) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('csd-stock-toast', {
          detail: {
            message: 'No records matching the current filter to export.',
            type: 'warning',
          },
        })
      );
    }
    return false;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const baseName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const format = options?.format || 'xlsx';

  if (format === 'csv') {
    const headers = Object.keys(rows[0]);
    const escapeCsvCell = (raw: string): string => {
      const safe = /^(?:[=+\-@\t\r]|\s+[=+\-@])/.test(raw) ? `'${raw}` : raw;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csvLines: string[] = [
      headers.map((h) => escapeCsvCell(h)).join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const formatted = formatCellValue(row[header]);
            return escapeCsvCell(formatted);
          })
          .join(',')
      ),
    ];

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanFilename = `${baseName}_${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('csd-stock-toast', {
          detail: {
            message: `Exported ${rows.length} records to ${cleanFilename}`,
            type: 'success',
          },
        })
      );
    }

    if (options?.notify) {
      options.notify(`Exported ${rows.length} rows to ${cleanFilename}`);
    }

    return true;
  }

  try {
    const xlsxBytes = buildXlsxWorkbook(filename, rows, options);
    const blob = new Blob([xlsxBytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanFilename = `${baseName}_${dateStr}.xlsx`;

    link.setAttribute('href', url);
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('csd-stock-toast', {
          detail: {
            message: `Exported ${rows.length} records to Excel (${cleanFilename})`,
            type: 'success',
          },
        })
      );
    }

    if (options?.notify) {
      options.notify(`Exported ${rows.length} rows to ${cleanFilename}`);
    }

    return true;
  } catch (err) {
    console.error('Failed to generate Excel workbook, falling back to CSV:', err);
    return exportToCsv(filename, rows, { ...options, format: 'csv' });
  }
}

/**
 * Explicit helper to export Excel Workbook (.xlsx).
 */
export function exportToExcel(
  filename: string,
  rows: Record<string, unknown>[],
  options?: ExportOptions
): boolean {
  return exportToCsv(filename, rows, { ...options, format: 'xlsx' });
}
