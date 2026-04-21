import { formatReceiptText } from './receipt';
import type { BridgeOrder } from '../store/types';

/**
 * Opens print dialog with receipt content. User can "Save as PDF" from print dialog.
 * Uses a hidden iframe to avoid popup blockers.
 */
export function downloadReceiptPdf(order: BridgeOrder): void {
  const text = formatReceiptText(order);
  const lines = text.split('\n');
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transaction Receipt</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 18px; margin-bottom: 16px; }
    .line { margin: 8px 0; }
    .label { color: #6b7280; font-size: 12px; }
    .value { font-weight: 500; }
  </style>
</head>
<body>
  <h1>Transaction Receipt</h1>
  ${lines
    .filter((l) => l && !l.startsWith('==='))
    .map((line) => {
      const idx = line.indexOf(': ');
      const label = idx >= 0 ? line.slice(0, idx) : line;
      const value = idx >= 0 ? line.slice(idx + 2) : '';
      return `<div class="line"><span class="label">${label}:</span> <span class="value">${value}</span></div>`;
    })
    .join('')}
</body>
</html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 250);
}
