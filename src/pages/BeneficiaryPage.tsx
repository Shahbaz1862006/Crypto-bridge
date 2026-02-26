import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { beneficiaries as defaultBeneficiaries } from '../api/mockData';
import { StepIndicator } from '../components/StepIndicator';
import { ROUTES } from '../routes/paths';

export function BeneficiaryPage() {
  const navigate = useNavigate();
  const beneficiaries = useBridgeStore((s) => s.order.beneficiaries) ?? defaultBeneficiaries;
  const selectedBeneficiaryId = useBridgeStore((s) => s.order.selectedBeneficiaryId);
  const touch = useBridgeStore((s) => s.touch);
  const selectBeneficiary = useBridgeStore((s) => s.selectBeneficiary);
  const list = beneficiaries?.length ? beneficiaries : defaultBeneficiaries;

  const handleSelect = (ben: (typeof list)[0]) => {
    touch();
    selectBeneficiary(ben);
    navigate(ROUTES.BRIDGE.COOLING_SELECT);
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
        onClick={() => navigate(ROUTES.BRIDGE.PAYMENT)}
        className="mb-4 text-slate-400 hover:text-primary text-sm"
      >
        ← Back
      </button>
      <StepIndicator current={2} total={3} />

      <h1 className="text-2xl font-semibold text-white mb-2">Select Beneficiary</h1>
      <p className="text-slate-400 mb-6">
        Choose a registered beneficiary for your bank transfer.
      </p>

      <div className="flex flex-col gap-3">
        {list.map((ben) => (
          <button
            key={ben.id}
            type="button"
            onClick={() => handleSelect(ben)}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              selectedBeneficiaryId === ben.id
                ? 'border-primary bg-primary/10'
                : 'border-slate-600 bg-slate-800 hover:border-primary/50'
            }`}
          >
            <h3 className="font-semibold text-white">{ben.displayName}</h3>
            <p className="text-slate-400 text-sm mt-2">{ben.bankName}</p>
            <p className="text-slate-500 text-sm">
              {ben.accountNumberMasked} • {ben.ifsc}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
