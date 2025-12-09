/**
 * Export Utility Module
 * Provides CSV and Excel export functionality for reports
 */

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportColumn<T> {
  /** Column header text */
  header: string;
  /** Key to access data or function to extract value */
  accessor: keyof T | ((row: T) => string | number | boolean | null | undefined);
  /** Optional formatter for the value */
  format?: (value: unknown) => string;
}

export interface ExportOptions<T> {
  /** File name without extension */
  filename: string;
  /** Data to export */
  data: T[];
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Export format */
  format: ExportFormat;
  /** Optional sheet name for Excel */
  sheetName?: string;
}

/**
 * Escapes special characters in CSV values
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, newline, or double quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Gets the value from a row based on the accessor
 */
function getValue<T>(row: T, column: ExportColumn<T>): string {
  let value: unknown;
  
  if (typeof column.accessor === 'function') {
    value = column.accessor(row);
  } else {
    value = row[column.accessor];
  }
  
  if (column.format) {
    return column.format(value);
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return String(value);
}

/**
 * Exports data to CSV format
 */
function exportToCSV<T>(options: ExportOptions<T>): void {
  const { filename, data, columns } = options;
  
  // Build header row
  const headers = columns.map((col) => escapeCSVValue(col.header));
  
  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeCSVValue(getValue(row, col)))
  );
  
  // Combine into CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
  
  // Add BOM for Excel to recognize UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadFile(blob, `${filename}.csv`);
}

/**
 * Exports data to Excel format (using CSV with .xlsx extension)
 * For a true XLSX export, you would need a library like xlsx or exceljs
 */
function exportToExcel<T>(options: ExportOptions<T>): void {
  const { filename, data, columns, sheetName = 'Sheet1' } = options;
  
  // Build header row
  const headers = columns.map((col) => col.header);
  
  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => getValue(row, col))
  );
  
  // Create a simple XML spreadsheet (Office 2003 XML format)
  // This provides better Excel compatibility than CSV while not requiring external libraries
  const xmlContent = generateExcelXML(headers, rows, sheetName);
  
  const blob = new Blob([xmlContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  
  downloadFile(blob, `${filename}.xls`);
}

/**
 * Generates Excel XML format (Office 2003 compatible)
 */
function generateExcelXML(headers: string[], rows: string[][], sheetName: string): string {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const headerCells = headers
    .map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          // Detect if the value is a number
          const numValue = parseFloat(cell);
          const isNumber = !isNaN(numValue) && isFinite(numValue) && cell.trim() !== '';
          const type = isNumber ? 'Number' : 'String';
          const value = isNumber ? numValue : escapeXML(cell);
          return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXML(sheetName)}">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Exports data to JSON format
 */
function exportToJSON<T>(options: ExportOptions<T>): void {
  const { filename, data, columns } = options;
  
  // Transform data using column definitions
  const transformedData = data.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      const key = typeof col.accessor === 'string' 
        ? String(col.accessor) 
        : col.header.toLowerCase().replace(/\s+/g, '_');
      obj[key] = getValue(row, col);
    });
    return obj;
  });
  
  const jsonContent = JSON.stringify(transformedData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  downloadFile(blob, `${filename}.json`);
}

/**
 * Triggers file download
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main export function
 */
export function exportData<T>(options: ExportOptions<T>): void {
  switch (options.format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'xlsx':
      exportToExcel(options);
      break;
    case 'json':
      exportToJSON(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Helper function to format currency values
 */
export function formatCurrencyForExport(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value ?? '');
}

/**
 * Helper function to format date values
 */
export function formatDateForExport(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string' && value) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return String(value ?? '');
}

/**
 * Helper function to format percentage values
 */
export function formatPercentageForExport(value: unknown): string {
  if (typeof value === 'number') {
    return `${value.toFixed(1)}%`;
  }
  return String(value ?? '');
}

/**
 * Get timestamp for filename
 */
export function getExportTimestamp(): string {
  return new Date().toISOString().split('T')[0];
}

