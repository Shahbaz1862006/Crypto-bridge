import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

export function ExpiredPage() {
  const navigate = useNavigate();
  const reset = useBridgeStore((s) => s.reset);

  const handleRestart = () => {
    reset();
    navigate(ROUTES.BRIDGE.EXPLAIN);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full py-16"
    >
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-4">Session expired</h1>
      <p className="text-[var(--muted)] mb-8">Restart deposit.</p>
      <button
        type="button"
        onClick={handleRestart}
        className="min-h-[44px] px-8 rounded-xl bg-[var(--green)] text-white font-semibold hover:bg-[var(--green-hover)]"
      >
        Restart
      </button>
      </div>
    </motion.div>
  );
}
