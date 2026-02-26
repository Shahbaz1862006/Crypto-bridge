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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1220]/95 backdrop-blur-sm"
    >
      <div className="w-12 h-12 border-4 border-slate-600 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-slate-300 text-lg">{message}</p>
    </motion.div>
  );
}
