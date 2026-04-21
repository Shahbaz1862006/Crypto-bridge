import { CopyButton } from '../CopyButton';

export interface BeneficiaryRow {
  label: string;
  value: string;
  copyValue?: string;
  mono?: boolean;
}

interface PaymentBeneficiaryCardProps {
  rows: BeneficiaryRow[];
}

/**
 * Beneficiary details card for UPI and IMPS payment screens.
 * Matches UPI: title "Beneficiary Details", space-y-1.5, same row styling.
 */
export function PaymentBeneficiaryCard({ rows }: PaymentBeneficiaryCardProps) {
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-default shadow-[var(--shadow)]">
      <h3 className="text-[var(--text)] font-medium mb-2">Beneficiary Details</h3>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--muted)] text-sm">{row.label}: </span>
            <span className={`text-[var(--text)] ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
            {row.copyValue && <CopyButton text={row.copyValue} />}
          </div>
        ))}
      </div>
    </div>
  );
}
