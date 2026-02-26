import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
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

  const handleClose = () => {
    if (!loading) onClose();
    onCancel?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-slate-800 border border-slate-600 p-6 shadow-2xl"
      >
        <h2 id="confirm-modal-title" className="text-xl font-semibold text-white mb-4">
          {title}
        </h2>
        <div className="text-slate-400 text-sm mb-6">{message}</div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800 disabled:opacity-70"
          >
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
