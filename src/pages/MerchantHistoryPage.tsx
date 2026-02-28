import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import type { MerchantTx } from '../store/types';
import { ROUTES, coolingUrl, verifyUrl } from '../routes/paths';
import { LargeModal } from '../components/LargeModal';

function maskAccount(acc: string | null | undefined): string {
  if (!acc) return '—';
  const s = String(acc).trim();
  if (!s) return '—';
  if (/^X+/.test(s)) return s;
  const last4 = s.slice(-4);
  return 'XXXXXX' + last4;
}

export function MerchantHistoryPage() {
  const navigate = useNavigate();
  const [detailModal, setDetailModal] = useState<MerchantTx | null>(null);

  const resetBridgeFlow = useBridgeStore((s) => s.resetBridgeFlow);
  const touch = useBridgeStore((s) => s.touch);
  const setMerchantTxId = useBridgeStore((s) => s.setMerchantTxId);
  const resumeCoolingFromTx = useBridgeStore((s) => s.resumeCoolingFromTx);
  const ensureTxInHistory = useBridgeStore((s) => s.ensureTxInHistory);
  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const tickCooling = useBridgeStore((s) => s.tickCooling);
  const seedMerchantHistoryIfEmpty = useBridgeStore((s) => s.seedMerchantHistoryIfEmpty);

  const now = Date.now();
  const transactions = merchantHistory;

  useEffect(() => {
    seedMerchantHistoryIfEmpty();
  }, [seedMerchantHistoryIfEmpty]);

  const refreshHistory = useCallback(() => {
    tickCooling();
  }, [tickCooling]);

  useEffect(() => {
    refreshHistory();
    const onFocus = () => refreshHistory();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshHistory();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(refreshHistory, 10000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [refreshHistory]);

  const handleDeposit = () => {
    resetBridgeFlow({ preserveHistory: true });
    navigate(ROUTES.BRIDGE.EXPLAIN, { replace: true });
  };

  const handlePendingClick = (tx: MerchantTx, e: React.MouseEvent) => {
    e.stopPropagation();
    touch();
    if (tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
      ensureTxInHistory(tx);
      if (resumeCoolingFromTx(tx.id)) {
        navigate(coolingUrl(tx.id));
      }
    }
  };

  const handleRowClick = (tx: MerchantTx, e?: React.MouseEvent) => {
    touch();
    if (e?.target instanceof HTMLElement && e.target.closest('button')) return;

    if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
      ensureTxInHistory(tx);
      if (resumeCoolingFromTx(tx.id)) {
        navigate(coolingUrl(tx.id));
      }
      return;
    }
    if (tx.status === 'PAYMENT_VERIFICATION') {
      ensureTxInHistory(tx);
      setMerchantTxId(tx.id);
      useBridgeStore.setState((s) => ({
        order: {
          ...s.order,
          paymentTxId: '',
          referenceType: tx.beneficiary ? 'BRN' : 'UTR',
          referenceNumber: '',
          expectedInrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
          invoiceStatus: 'READY_FOR_VERIFICATION',
          usdtAmount: tx.amountUsdt,
          inrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
        },
      }));
      navigate(verifyUrl(tx.id));
      return;
    }
    if (tx.status === 'FAILED' || tx.status === 'SUCCESSFUL') {
      setDetailModal(tx);
    }
  };

  return (
    <>
      <header className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]">
        <h1 className="text-lg font-semibold text-[var(--text)]">Transactions</h1>
        <button
          type="button"
          onClick={handleDeposit}
          className="px-4 py-2 rounded-lg bg-[var(--green)] text-white text-sm font-medium hover:bg-[var(--green-hover)]"
        >
          Deposit via fastpikeswop
        </button>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[#F9FAFB]">
                  <th className="px-4 py-3 text-[var(--muted)] font-medium text-sm">Date/Time</th>
                  <th className="px-4 py-3 text-[var(--muted)] font-medium text-sm">Description</th>
                  <th className="px-4 py-3 text-[var(--muted)] font-medium text-sm">Amount (USDT)</th>
                  <th className="px-4 py-3 text-[var(--muted)] font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={(e) => handleRowClick(tx, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(tx);
                      }
                    }}
                    className="border-b border-[var(--border)] transition-colors cursor-pointer hover:bg-[#F3F4F6]"
                  >
                    <td className="px-4 py-3 text-[var(--text)] text-sm">{tx.dateTime}</td>
                    <td className="px-4 py-3 text-[var(--text)] text-sm max-w-[280px] truncate">
                      {tx.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        tx.amountUsdt >= 0 ? 'text-[var(--green)]' : 'text-red-500'
                      }`}
                    >
                      {tx.amountUsdt >= 0 ? '+' : ''}
                      {tx.amountUsdt} USDT
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={(e) => handlePendingClick(tx, e)}
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--pending-bg)] text-[var(--pending-text)] cursor-pointer hover:opacity-90 hover:underline transition-all"
                        >
                          PENDING
                        </button>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'SUCCESSFUL'
                              ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                              : tx.status === 'FAILED'
                                ? 'bg-[var(--failed-bg)] text-[var(--failed-text)]'
                                : tx.status === 'PAYMENT_VERIFICATION'
                                  ? 'bg-[var(--verify-bg)] text-[var(--verify-text)]'
                                  : 'bg-[var(--pending-bg)] text-[var(--pending-text)]'
                          }`}
                        >
                          {tx.status === 'PAYMENT_VERIFICATION'
                            ? 'Payment Verification'
                            : tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LargeModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal?.status === 'FAILED' ? 'Failure Details' : 'Transaction Details'}
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Date/Time</p>
                <p className="text-[var(--text)]">{detailModal.dateTime}</p>
              </div>
              <div>
                <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailModal.status === 'SUCCESSFUL'
                      ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      : detailModal.status === 'FAILED'
                        ? 'bg-[var(--failed-bg)] text-[var(--failed-text)]'
                        : detailModal.status === 'PAYMENT_VERIFICATION'
                          ? 'bg-[var(--verify-bg)] text-[var(--verify-text)]'
                          : 'bg-[var(--pending-bg)] text-[var(--pending-text)]'
                  }`}
                >
                  {detailModal.status === 'PAYMENT_VERIFICATION'
                    ? 'Payment Verification'
                    : detailModal.status}
                </span>
              </div>
              <div>
                <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Amount</p>
                <p className={`font-medium ${detailModal.amountUsdt >= 0 ? 'text-[var(--green)]' : 'text-red-500'}`}>
                  {detailModal.amountUsdt >= 0 ? '+' : ''}{detailModal.amountUsdt} USDT
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Description</p>
                <p className="text-[var(--text)]">{detailModal.description}</p>
              </div>
              {detailModal.status === 'FAILED' && detailModal.failureReason && (
                <div className="sm:col-span-2">
                  <p className="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Failure reason</p>
                  <p className="text-red-500">{detailModal.failureReason}</p>
                </div>
              )}
            </div>

            <h3 className="text-xl font-semibold text-[var(--text)] mt-8">Beneficiary Details</h3>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs tracking-widest uppercase text-[var(--muted)]">Beneficiary Name</div>
                  <div className="mt-2 text-lg text-[var(--text)]">
                    {detailModal.beneficiary?.beneficiaryName ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-widest uppercase text-[var(--muted)]">Bank Name</div>
                  <div className="mt-2 text-lg text-[var(--text)]">
                    {detailModal.beneficiary?.bankName ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-widest uppercase text-[var(--muted)]">Account (Masked)</div>
                  <div className="mt-2 text-lg text-[var(--text)] font-mono">
                    {maskAccount(detailModal.beneficiary?.accountNumberMasked)}
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-widest uppercase text-[var(--muted)]">IFSC</div>
                  <div className="mt-2 text-lg text-[var(--text)] font-mono">
                    {detailModal.beneficiary?.ifsc ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetailModal(null)}
              className="min-h-[44px] px-6 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        )}
      </LargeModal>
    </>
  );
}
