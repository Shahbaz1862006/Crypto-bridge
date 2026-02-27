interface PaymentVerificationBlockProps {
  inputId: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
  canConfirm: boolean;
  isVerifying: boolean;
  onConfirm: () => void;
  buttonLabel: string;
}

/**
 * Verification input + Confirm button block for UPI and IMPS payment screens.
 * Matches UPI screen styling exactly.
 */
export function PaymentVerificationBlock({
  inputId,
  label,
  placeholder,
  value,
  onChange,
  error,
  canConfirm,
  isVerifying,
  onConfirm,
  buttonLabel,
}: PaymentVerificationBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label htmlFor={inputId} className="block text-[var(--text)] mb-2">
          {label}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full min-h-[44px] px-4 rounded-xl bg-white border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--focus)] focus:outline-none font-mono uppercase"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm || isVerifying}
        className="min-h-[44px] w-full rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
