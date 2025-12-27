/**
 * Base Styles for Print Documents
 * Shared CSS styles used across all printable documents
 * 
 * These inline styles ensure consistent rendering in:
 * - Electron silent print
 * - Browser iframe print
 * - PDF export
 */

export const BASE_PRINT_STYLES = `
@page { size: A4; margin: 15mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px; line-height: 1.5; color: #000; background: #fff;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}

/* Container */
.print-container { padding: 20px; background: white; }

/* Flexbox Utilities */
.flex { display: flex; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.gap-2 { gap: 8px; }
.gap-6 { gap: 24px; }

/* Spacing */
.mb-1 { margin-bottom: 4px; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 16px; }
.mb-8 { margin-bottom: 32px; }
.mt-4 { margin-top: 16px; }
.mt-12 { margin-top: 48px; }
.my-2 { margin: 8px 0; }
.my-6 { margin: 24px 0; }
.p-4 { padding: 16px; }
.p-8 { padding: 32px; }
.pt-6 { padding-top: 24px; }
.py-3 { padding: 12px 0; }
.space-y-1 > * + * { margin-top: 4px; }
.space-y-2 > * + * { margin-top: 8px; }
.space-y-4 > * + * { margin-top: 16px; }

/* Grid */
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }

/* Width */
.w-full { width: 100%; }
.w-72 { width: 288px; }
.w-20 { width: 80px; }
.w-28 { width: 112px; }

/* Text */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-sm { font-size: 12px; }
.text-lg { font-size: 18px; }
.text-xl { font-size: 20px; }
.text-3xl { font-size: 30px; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }
.whitespace-pre-line { white-space: pre-line; }

/* Colors */
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }
.text-blue-600 { color: #2563eb; }
.bg-white { background-color: #fff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-blue-50 { background-color: #eff6ff; }

/* Border & Radius */
.rounded-lg { border-radius: 8px; }
.border { border: 1px solid #e5e7eb; }
.border-t { border-top: 1px solid #e5e7eb; }
.border-b { border-bottom: 1px solid #e5e7eb; }
.border-b-2 { border-bottom: 2px solid #e5e7eb; }
.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
.border-blue-200 { border-color: #bfdbfe; }

/* Table */
table { border-collapse: collapse; width: 100%; }
th, td { padding: 12px 8px; }

/* Logo */
.h-10 { height: 40px; }
.w-10 { width: 40px; }
.h-6 { height: 24px; }
.w-6 { width: 24px; }
.logo-box { 
  height: 40px; width: 40px; 
  background-color: #2563eb; 
  border-radius: 8px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
.logo-box svg { height: 24px; width: 24px; color: white; }
`;

/**
 * Build complete HTML document for printing
 */
export function buildPrintDocument(
    title: string,
    bodyContent: string,
    containerClass: string = 'print-container'
): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>${BASE_PRINT_STYLES}</style>
      </head>
      <body>
        <div class="${containerClass}">${bodyContent}</div>
      </body>
    </html>
  `;
}
