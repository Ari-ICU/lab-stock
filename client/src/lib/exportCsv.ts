/**
 * CSD Stock - Professional Fleet Spreadsheet & Data Exporter
 * Generates native Microsoft Excel (.xlsx) workbooks with auto-fitted column widths,
 * styled headers, and auto-filters, avoiding the "Possible Data Loss" CSV warnings.
 * Also provides fallback standard UTF-8 CSV with BOM for raw database ingestion.
 */

export interface ExportOptions {
  sheetTitle?: string;
  format?: 'xlsx' | 'csv';
  notify?: (message: string) => void;
}

// Clean and humanize common internal enum values
function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';

  if (typeof val === 'boolean') {
    return val ? 'Yes' : 'No';
  }

  if (typeof val === 'number') {
    return String(val);
  }

  const str = String(val).trim();

  // Common system status transformations
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
    default:
      return str;
  }
}

function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
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

// CRC32 table for ZIP generation
const CRC32_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
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
    view.setUint16(8, 0, true); // stored (no compression)
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
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
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
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

function buildXlsxWorkbook(rows: Record<string, unknown>[], sheetTitle: string = 'CSD Fleet'): Uint8Array {
  const headers = Object.keys(rows[0]);

  // Compute optimal column widths based on maximum string lengths + comfortable margins
  const colWidths = headers.map((h) => {
    let max = h.length;
    for (const row of rows) {
      const formatted = formatCellValue(row[h]);
      if (formatted.length > max) max = formatted.length;
    }
    // Allow wide enough column so text is never truncated in Excel
    return Math.max(14, Math.min(70, Math.ceil(max * 1.15) + 4));
  });

  let colsXml = '<cols>';
  colWidths.forEach((w, idx) => {
    colsXml += `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`;
  });
  colsXml += '</cols>';

  let sheetDataXml = '<sheetData>';

  // Row 1: Styled Header (Dark Slate #0F172A, Bold White text, centered, height 26pt)
  sheetDataXml += '<row r="1" ht="26" customHeight="1">';
  headers.forEach((h, colIdx) => {
    const cellRef = `${getColLetter(colIdx)}1`;
    sheetDataXml += `<c r="${cellRef}" s="1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
  });
  sheetDataXml += '</row>';

  // Data rows (Height 20pt, light borders, auto formatting)
  rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2;
    sheetDataXml += `<row r="${rowNum}" ht="20" customHeight="1">`;
    headers.forEach((h, colIdx) => {
      const cellRef = `${getColLetter(colIdx)}${rowNum}`;
      const rawVal = row[h];
      const val = formatCellValue(rawVal);

      // Check if pure number
      if (typeof rawVal === 'number' && !isNaN(rawVal)) {
        sheetDataXml += `<c r="${cellRef}" s="3"><v>${rawVal}</v></c>`;
      } else {
        sheetDataXml += `<c r="${cellRef}" s="2" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });
    sheetDataXml += '</row>';
  });
  sheetDataXml += '</sheetData>';

  const lastColLetter = getColLetter(headers.length - 1);
  const lastRowNum = rows.length + 1;
  const autoFilterXml = `<autoFilter ref="A1:${lastColLetter}${lastRowNum}"/>`;

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${colsXml}
  ${sheetDataXml}
  ${autoFilterXml}
</worksheet>`;

  // Excel Styles: Header with #0F172A solid fill, white bold font; clean borders on data cells
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Aptos"/><sz val="11"/></font>
    <font><b/><color rgb="FFFFFFFF"/><name val="Aptos"/><sz val="11"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

  const files: ZipFileEntry[] = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetTitle)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', data: sheet1Xml },
  ];

  return createZipArchive(files);
}

/**
 * Universal Dataset Exporter
 * Defaults to downloading native Microsoft Excel (.xlsx) with auto-fitted column widths
 * and zero "data loss" warnings. Also supports downloading UTF-8 CSV when format: 'csv' is set.
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
  const format = options?.format || 'xlsx'; // Default to beautiful Excel .xlsx!

  if (format === 'csv') {
    const headers = Object.keys(rows[0]);
    const csvLines: string[] = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const formatted = formatCellValue(row[header]);
            return `"${formatted.replace(/"/g, '""')}"`;
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

  // Generate Native Excel .xlsx
  try {
    const sheetTitle = options?.sheetTitle || 'CSD Fleet Overview';
    const xlsxBytes = buildXlsxWorkbook(rows, sheetTitle);
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
    // Fallback to CSV if any unexpected issue occurs
    return exportToCsv(filename, rows, { ...options, format: 'csv' });
  }
}

/**
 * Explicit helper to export Excel Workbook (.xlsx)
 */
export function exportToExcel(
  filename: string,
  rows: Record<string, unknown>[],
  options?: ExportOptions
): boolean {
  return exportToCsv(filename, rows, { ...options, format: 'xlsx' });
}
