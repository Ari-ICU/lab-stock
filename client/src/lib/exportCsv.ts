export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const str = val === null || val === undefined ? '' : String(val);
          // Escape quotes and commas
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
