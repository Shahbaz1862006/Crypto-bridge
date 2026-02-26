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
