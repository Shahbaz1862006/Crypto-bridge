import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

interface FailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  /** Called when "Change Method" is clicked. If not provided but showChangeMethod is true, navigates to payment. */
  onChangeMethod?: () => void;
  /** When true, shows "Change Method" button */
  showChangeMethod?: boolean;
}

export function FailedModal({
  isOpen,
  onClose,
  onTryAgain,
  onChangeMethod,
  showChangeMethod = true,
}: FailedModalProps) {
  const navigate = useNavigate();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  const handleTryAgain = () => {
    onTryAgain();
    onClose();
  };

  const handleChangeMethod = () => {
    onClose();
    if (onChangeMethod) {
      onChangeMethod();
    } else {
      navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-[rgba(17,24,39,0.35)] backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="failed-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow)]"
      >
        <h2 id="failed-modal-title" className="text-xl font-semibold text-[var(--text)] mb-2">
          Payment Failed
        </h2>
        <p className="text-[var(--text)] text-sm mb-1">
          The entered TxID / UTR / BRN is invalid or could not be verified.
        </p>
        <p className="text-[var(--muted)] text-sm mb-6">
          Please check the reference number and try again.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleTryAgain}
            className="min-h-[44px] w-full rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)] transition-colors"
          >
            Try Again
          </button>
          {showChangeMethod && (
            <button
              type="button"
              onClick={handleChangeMethod}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100 transition-colors"
            >
              Change Method
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
