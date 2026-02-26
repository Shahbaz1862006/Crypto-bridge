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
      className="max-w-[480px] mx-auto px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-semibold text-white mb-4">Session expired</h1>
      <p className="text-slate-400 mb-8">Restart deposit.</p>
      <button
        type="button"
        onClick={handleRestart}
        className="min-h-[44px] px-8 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
      >
        Restart
      </button>
    </motion.div>
  );
}
