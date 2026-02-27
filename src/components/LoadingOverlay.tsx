import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[rgba(17,24,39,0.35)] backdrop-blur-sm"
    >
      <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--green)] rounded-full animate-spin" />
      <p className="mt-4 text-[var(--text)] text-lg">{message}</p>
    </motion.div>
  );
}
