/**
 * CSD Stock - Universal CSV Exporter with UTF-8 BOM support
 * Ensures clean rendering across Microsoft Excel, Apple Numbers, and Google Sheets.
 */

export interface ExportCsvOptions {
  sheetTitle?: string;
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

export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  options?: ExportCsvOptions
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

  const headers = Object.keys(rows[0]);
  
  // Format each row with escaped quotes and commas
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

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel opens UTF-8 & Khmer text without encoding corruption
  const csvContent = '\uFEFF' + csvLines.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Format clean date string: YYYY-MM-DD
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const cleanFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Trigger feedback event
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
