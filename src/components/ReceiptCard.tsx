import { CopyButton } from './CopyButton';
import { maskReference, formatCoolingLabel, formatReceiptDate, formatReceiptText } from '../utils/receipt';
import type { BridgeOrder } from '../store/types';

interface ReceiptCardProps {
  order: BridgeOrder;
  merchantTx?: unknown;
  onCopyReceipt?: (text: string) => void;
  onDownloadPdf?: () => void;
}

export function ReceiptCard({
  order,
  onCopyReceipt,
  onDownloadPdf,
}: ReceiptCardProps) {
  const usdt = order.purchasedUsdt || order.usdtAmount;
  const inr = order.inrAmount || order.expectedInrAmount;
  const refMasked = order.referenceNumber ? maskReference(order.referenceNumber) : '—';
  const receiptText = formatReceiptText(order);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      onCopyReceipt?.(receiptText);
    } catch {
      // fallback
    }
  };

  const handleDownloadPdf = () => {
    onDownloadPdf?.();
  };

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow)]">
      <div className="px-4 py-2 rounded-t-xl border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text)]">Receipt</h3>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
        <ReceiptRow label="Order ID" value={order.orderId} copyValue={order.orderId} />
        <ReceiptRow
          label="Date/Time"
          value={formatReceiptDate(order.createdAt)}
        />
        <ReceiptRow
          label="Payment Method"
          value={order.paymentMethod === 'UPI' ? 'UPI' : 'IMPS/RTGS/NEFT'}
        />
        {order.paymentMethod === 'BANK' && order.selectedBeneficiary && (
          <>
            <ReceiptRow
              label="Beneficiary"
              value={`${order.selectedBeneficiary.displayName} • ${order.selectedBeneficiary.bankName}`}
              span={2}
            />
            <ReceiptRow
              label="Account"
              value={order.selectedBeneficiary.accountNumberMasked}
            />
            <ReceiptRow label="IFSC" value={order.selectedBeneficiary.ifsc} />
          </>
        )}
        <ReceiptRow label="USDT Purchased" value={`${usdt} USDT`} />
        <ReceiptRow label="Exchange Rate" value={`1 USDT = ₹${order.exchangeRate}`} />
        <ReceiptRow
          label="INR Paid"
          value={`₹${inr.toLocaleString('en-IN')}`}
        />
        <ReceiptRow label="Reference Type" value={order.referenceType ?? '—'} />
        <ReceiptRow
          label="Reference Number"
          value={refMasked}
          copyValue={order.referenceNumber || undefined}
        />
        <ReceiptRow label="Status" value="Verified" />
        <ReceiptRow
          label="Cooling Period"
          value={formatCoolingLabel(order.coolingMinutes)}
        />
        <ReceiptRow label="Fee" value="30% (for wallet withdrawal)" span={2} />
      </div>
      <div className="px-4 py-2 border-t border-[var(--border)] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2 rounded-lg bg-gray-100 text-[var(--text)] text-sm font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
        >
          <CopyIcon />
          Copy receipt
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] text-sm font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
        >
          <DownloadIcon />
          Download PDF
        </button>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  copyValue,
  span = 1,
}: {
  label: string;
  value: string;
  copyValue?: string;
  span?: 1 | 2;
}) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <span className="text-[var(--muted)] block mb-0.5">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[var(--text)] font-medium break-all">{value}</span>
        {copyValue && (
          <CopyButton text={copyValue} className="shrink-0" />
        )}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}
