export function validateReference(value, type) {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return { valid: false, error: 'Required' };
  if (!/^[A-Z0-9]+$/.test(trimmed)) return { valid: false, error: 'Enter a valid ' + type };
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (type === 'BRN') {
    if (trimmed.length < 12 || trimmed.length > 22) return { valid: false, error: 'Enter a valid BRN' };
    if (digitCount < 6) return { valid: false, error: 'Enter a valid BRN' };
  } else {
    if (trimmed.length < 10 || trimmed.length > 22) return { valid: false, error: 'Enter a valid UTR' };
  }
  return { valid: true };
}

export function normalizeReference(value) {
  return value.trim().toUpperCase();
}

export function maskReference(ref) {
  const t = ref.trim();
  if (t.length <= 8) return t;
  return t.slice(0, 4) + '****' + t.slice(-4);
}

export function formatCoolingLabel(minutes) {
  if (minutes == null) return 'None';
  if (minutes < 60) return `${minutes}m`;
  if (minutes === 60) return '1h';
  if (minutes === 120) return '2h';
  if (minutes === 1440) return '24h';
  return `${minutes / 60}h`;
}

export function formatReceiptDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${h}:${m}:${s}`;
}

export function formatReceiptText(order) {
  const lines = [
    '=== Transaction Receipt ===',
    `Order ID: ${order.orderId}`,
    `Date/Time: ${formatReceiptDate(order.createdAt)}`,
    `Payment Method: ${order.paymentMethod === 'UPI' ? 'UPI' : 'IMPS/RTGS/NEFT'}`,
  ];
  if (order.paymentMethod === 'BANK' && order.selectedBeneficiary) {
    const b = order.selectedBeneficiary;
    lines.push(`Beneficiary: ${b.displayName}`);
    lines.push(`Bank: ${b.bankName}`);
    lines.push(`Account: ${b.accountNumberMasked}`);
    lines.push(`IFSC: ${b.ifsc}`);
  }
  lines.push(
    `USDT Purchased: ${order.purchasedUsdt || order.usdtAmount} USDT`,
    `Exchange Rate: 1 USDT = ₹${order.exchangeRate}`,
    `INR Paid: ₹${(order.inrAmount || order.expectedInrAmount || 0).toLocaleString('en-IN')}`,
    `Reference Type: ${order.referenceType ?? '—'}`,
    `Reference Number: ${order.referenceNumber || '—'}`,
    `Status: Verified`,
    `Cooling Period: ${formatCoolingLabel(order.coolingMinutes)}`,
    '30% fee applies (for wallet withdrawal)',
  );
  return lines.join('\n');
}

export function downloadReceiptPdf(order) {
  const text = formatReceiptText(order);
  const lines = text.split('\n');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Transaction Receipt</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;max-width:480px;margin:0 auto}h1{font-size:18px;margin-bottom:16px}.line{margin:8px 0}.label{color:#6b7280;font-size:12px}.value{font-weight:500}</style>
</head><body><h1>Transaction Receipt</h1>${lines.filter((l) => l && !l.startsWith('===')).map((line) => {
    const idx = line.indexOf(': ');
    const label = idx >= 0 ? line.slice(0, idx) : line;
    const value = idx >= 0 ? line.slice(idx + 2) : '';
    return `<div class="line"><span class="label">${label}:</span> <span class="value">${value}</span></div>`;
  }).join('')}</body></html>`;
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow?.focus();
  setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 250);
}

export function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const preset = parseInt(params.get('presetUsdt') ?? '60', 10) || 60;
  return {
    merchantReturnUrl: params.get('merchantReturnUrl') ?? 'https://merchant.example.com/deposit/return',
    currency: params.get('currency') ?? 'INR',
    coin: params.get('coin') ?? 'USDT_TRX',
    presetUsdt: Math.min(10000, Math.max(10, preset)),
  };
}

export function getTxDeepLink(tx, now = Date.now()) {
  if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
    return { deepLinkRoute: `/bridge/cooling?txId=${encodeURIComponent(tx.id)}`, deepLinkEnabled: true };
  }
  if (tx.status === 'PAYMENT_VERIFICATION') {
    return { deepLinkRoute: `/bridge/verify?txId=${encodeURIComponent(tx.id)}`, deepLinkEnabled: true };
  }
  return { deepLinkRoute: '', deepLinkEnabled: false };
}

export const routeGuards = {
  canAccessPayment(s) {
    return ['DRAFT', 'AWAITING_PAYMENT', 'AWAITING_BENEFICIARY', 'COOLING', 'READY_FOR_VERIFICATION', 'VERIFYING', 'VERIFIED', 'FAILED'].includes(s);
  },
  canAccessBeneficiary(m) { return m === 'BANK'; },
  canAccessCoolingSelect(b) { return b != null; },
  canAccessCooling(b, s) { return b != null || s === 'COOLING'; },
  canAccessVerify(s) { return ['READY_FOR_VERIFICATION', 'VERIFYING', 'VERIFIED', 'FAILED'].includes(s); },
};

export function maskAccount(acc) {
  if (!acc) return '—';
  const s = String(acc).trim();
  if (!s) return '—';
  if (/^X+/.test(s)) return s;
  return 'XXXXXX' + s.slice(-4);
}
