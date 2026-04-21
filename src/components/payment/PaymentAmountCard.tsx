interface PaymentAmountCardProps {
  usdtAmount: number;
  inrAmount: number;
}

/**
 * Amount receipt card for UPI and IMPS payment screens.
 * Matches UPI screen: bold amounts on same row, no extra lines.
 */
export function PaymentAmountCard({ usdtAmount, inrAmount }: PaymentAmountCardProps) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4 shadow-[var(--shadow)]">
      <span className="text-2xl font-bold text-[var(--text)]">{usdtAmount} USDT</span>
      <span className="text-2xl font-bold text-[var(--text)]">
        ≈ ₹{inrAmount.toLocaleString('en-IN')} INR
      </span>
    </div>
  );
}
