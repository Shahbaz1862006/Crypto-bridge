import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { COOLING_OPTIONS } from '../api/mockData';
import { StepIndicator } from '../components/StepIndicator';
import { ROUTES } from '../routes/paths';

export function CoolingSelectPage() {
  const navigate = useNavigate();
  const touch = useBridgeStore((s) => s.touch);
  const setCooling = useBridgeStore((s) => s.setCooling);
  const setCoolingNone = useBridgeStore((s) => s.setCoolingNone);

  const handleSelectNone = () => {
    touch();
    setCoolingNone();
    navigate(ROUTES.BRIDGE.VERIFY);
  };

  const handleSelectCooling = (mins: number) => {
    touch();
    setCooling(mins);
    navigate(ROUTES.BRIDGE.COOLING);
  };

  const formatCoolingLabel = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    if (mins === 60) return '1 hr';
    if (mins === 120) return '2 hr';
    if (mins === 1440) return '24 hr';
    return `${mins / 60} hr`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-[480px] mx-auto px-4 pt-0 pb-8"
    >
      <button
        type="button"
        onClick={() => navigate(ROUTES.BRIDGE.BENEFICIARY)}
        className="mb-4 text-slate-400 hover:text-primary text-sm"
      >
        ← Back
      </button>
      <StepIndicator current={2} total={3} />

      <h1 className="text-2xl font-semibold text-white mb-2">Select Cooling Period</h1>
      <p className="text-slate-400 mb-6">
        Some banks may require a cooling period for first-time beneficiary transfers.
      </p>

      <div className="space-y-2 mb-6">
        <button
          type="button"
          onClick={handleSelectNone}
          className="w-full min-h-[44px] px-4 rounded-xl bg-slate-800 border border-slate-600 hover:border-primary text-left text-white flex items-center justify-between"
        >
          <span>None</span>
          <span className="text-primary text-sm">Skip cooling</span>
        </button>
        {COOLING_OPTIONS.map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => handleSelectCooling(mins)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-slate-800 border border-slate-600 hover:border-primary text-left text-white"
          >
            {formatCoolingLabel(mins)}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
