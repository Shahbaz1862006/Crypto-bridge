/**
 * Mask reference number: first 4 + *** + last 4
 * Example: ABCD****WXYZ
 */
export function maskReference(ref: string): string {
  const trimmed = ref.trim();
  if (trimmed.length <= 8) return trimmed;
  return trimmed.slice(0, 4) + '****' + trimmed.slice(-4);
}

export function formatCoolingLabel(minutes: number | null): string {
  if (minutes == null) return 'None';
  if (minutes < 60) return `${minutes}m`;
  if (minutes === 60) return '1h';
  if (minutes === 120) return '2h';
  if (minutes === 1440) return '24h';
  return `${minutes / 60}h`;
}

export function formatReceiptDate(ts: number): string {
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

export function formatReceiptText(order: {
  orderId: string;
  createdAt: number;
  paymentMethod: string | null;
  purchasedUsdt?: number;
  usdtAmount: number;
  inrAmount: number;
  expectedInrAmount?: number;
  exchangeRate: number;
  referenceType: string | null;
  referenceNumber: string;
  coolingMinutes: number | null;
  selectedBeneficiary?: { displayName: string; bankName: string; accountNumberMasked: string; ifsc: string } | null;
}): string {
  const lines: string[] = [
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
