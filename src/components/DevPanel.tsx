import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import { ROUTES } from '../routes/paths';

export function DevPanel() {
  const [open, setOpen] = useState(false);

  const order = useBridgeStore((s) => s.order);
  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const setDevRate = useBridgeStore((s) => s.setDevRate);
  const setDevForceVerifyFail = useBridgeStore((s) => s.setDevForceVerifyFail);
  const setReferenceNumber = useBridgeStore((s) => s.setReferenceNumber);
  const resetUsedReferences = useBridgeStore((s) => s.resetUsedReferences);
  const reset = useBridgeStore((s) => s.reset);
  const dev = useBridgeStore((s) => s.dev);
  const checkExpiry = useBridgeStore((s) => s.checkExpiry);
  const setBeneficiaryHasCooling = useBridgeStore((s) => s.setBeneficiaryHasCooling);
  const addMockSuccessfulTx = useBridgeStore((s) => s.addMockSuccessfulTx);
  const addMockFailedTx = useBridgeStore((s) => s.addMockFailedTx);
  const addMockPendingTx = useBridgeStore((s) => s.addMockPendingTx);
  const forceCoolingEnd = useBridgeStore((s) => s.forceCoolingEnd);
  const resetHistoryToDefaults = useBridgeStore((s) => s.resetHistoryToDefaults);

  const navigate = useNavigate();
  const forceExpire = () => {
    useBridgeStore.setState((s) => ({
      order: { ...s.order, lastActiveAt: Date.now() - (4 * 60 * 60 * 1000 + 1000) },
    }));
    checkExpiry();
    navigate(ROUTES.BRIDGE.EXPIRED, { replace: true });
  };

  const latestPending = merchantHistory.find((t) => t.status === 'PENDING');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-slate-700 text-slate-400 text-xs font-mono flex items-center justify-center hover:bg-slate-600 hover:text-white transition-colors shadow-lg"
        aria-label="DEV"
        title="Dev Panel"
      >
        DEV
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-[9999] w-80 max-h-[70vh] overflow-y-auto rounded-xl bg-slate-800 border border-slate-600 p-4 shadow-2xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Dev Panel
          </h3>

          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">
                Exchange Rate (INR/USDT)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="83"
                className="w-full px-2 py-1.5 rounded bg-slate-700 text-white text-xs"
                onBlur={(e) => {
                  const v = parseFloat(e.target.value);
                  setDevRate(isNaN(v) ? null : v);
                }}
              />
            </div>

            {order.selectedBeneficiary && (
              <div>
                <label className="block text-slate-400 mb-1">
                  Beneficiary hasCooling
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBeneficiaryHasCooling(order.selectedBeneficiary!.id, true)
                    }
                    className={`px-2 py-1 rounded text-xs ${
                      order.selectedBeneficiary?.hasCooling
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-600 text-slate-400'
                    }`}
                  >
                    true
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBeneficiaryHasCooling(order.selectedBeneficiary!.id, false)
                    }
                    className={`px-2 py-1 rounded text-xs ${
                      !order.selectedBeneficiary?.hasCooling
                        ? 'bg-primary text-black'
                        : 'bg-slate-600 text-slate-400'
                    }`}
                  >
                    false
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Add mock tx</label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={addMockSuccessfulTx}
                  className="px-2 py-1 rounded bg-green-600/80 text-green-100 text-xs"
                >
                  + SUCCESSFUL
                </button>
                <button
                  type="button"
                  onClick={addMockFailedTx}
                  className="px-2 py-1 rounded bg-red-600/80 text-red-100 text-xs"
                >
                  + FAILED
                </button>
                <button
                  type="button"
                  onClick={addMockPendingTx}
                  className="px-2 py-1 rounded bg-amber-600/80 text-amber-100 text-xs"
                >
                  + PENDING
                </button>
              </div>
            </div>

            {latestPending && (
              <div>
                <button
                  type="button"
                  onClick={() => forceCoolingEnd(latestPending.id)}
                  className="w-full px-2 py-1.5 rounded bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
                >
                  Force cooling end (latest pending)
                </button>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">
                Force verify fail mode
              </label>
              <div className="flex flex-wrap gap-1">
                {(['NONE', 'FAIL', 'USED', 'AMOUNT'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDevForceVerifyFail(mode)}
                    className={`px-2 py-1 rounded text-xs ${
                      dev.forceVerifyFailMode === mode
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Force cooling end now
              </label>
              <button
                type="button"
                onClick={() =>
                  useBridgeStore.setState((s) => ({
                    dev: {
                      ...s.dev,
                      forceCoolingEndNow: !s.dev.forceCoolingEndNow,
                    },
                  }))
                }
                className={`px-2 py-1 rounded text-xs ${
                  dev.forceCoolingEndNow ? 'bg-amber-600 text-white' : 'bg-slate-600 text-slate-400'
                }`}
              >
                {dev.forceCoolingEndNow ? 'ON (1s cooling)' : 'OFF'}
              </button>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Auto-fill BRN</label>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'OK', value: 'BRN1234567890' },
                  { label: 'NF', value: 'BRN_NF_123' },
                  { label: 'USED', value: 'BRN_USED_123' },
                  { label: 'AMT', value: 'BRN_AMT_123' },
                  { label: 'FRAUD', value: 'BRN_FRAUD_123' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReferenceNumber(value)}
                    className="px-2 py-1 rounded bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Auto-fill UTR</label>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'OK', value: 'UTR1234567890' },
                  { label: 'NF', value: 'UTR_NF_123' },
                  { label: 'USED', value: 'UTR_USED_123' },
                  { label: 'AMT', value: 'UTR_AMT_123' },
                  { label: 'FRAUD', value: 'UTR_FRAUD_123' },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReferenceNumber(value)}
                    className="px-2 py-1 rounded bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={resetUsedReferences}
                className="w-full px-2 py-1.5 rounded bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
              >
                Reset used references
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={forceExpire}
                className="w-full px-2 py-1.5 rounded bg-amber-600/80 text-amber-100 text-xs hover:bg-amber-600"
              >
                Force session expired
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={resetHistoryToDefaults}
                className="w-full px-2 py-1.5 rounded bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
              >
                Reset history to defaults
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  navigate(ROUTES.BRIDGE.EXPLAIN);
                }}
                className="w-full px-2 py-1.5 rounded bg-red-600/80 text-red-100 text-xs hover:bg-red-600"
              >
                Reset store
              </button>
            </div>

            {order.orderId && (
              <p className="text-slate-500 text-xs">Order: {order.orderId}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
