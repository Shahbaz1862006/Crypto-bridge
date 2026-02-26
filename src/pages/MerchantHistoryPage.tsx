import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import type { MerchantTx } from '../store/types';
import { ROUTES, coolingUrl, verifyUrl } from '../routes/paths';
import { Modal } from '../components/Modal';
import { LargeModal } from '../components/LargeModal';

export function MerchantHistoryPage() {
  const navigate = useNavigate();
  const [coolingEndedToast, setCoolingEndedToast] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('30');
  const [detailModal, setDetailModal] = useState<MerchantTx | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  const merchantHistory = useBridgeStore((s) => s.merchantHistory);
  const wallet = useBridgeStore((s) => s.wallet);
  const resetBridgeFlow = useBridgeStore((s) => s.resetBridgeFlow);
  const touch = useBridgeStore((s) => s.touch);
  const setMerchantTxId = useBridgeStore((s) => s.setMerchantTxId);
  const resumeCoolingFromTx = useBridgeStore((s) => s.resumeCoolingFromTx);

  const now = Date.now();

  const filteredHistory = useMemo(() => {
    return merchantHistory.filter((tx) => {
      const matchSearch =
        !search ||
        tx.reference.toLowerCase().includes(search.toLowerCase()) ||
        tx.description.toLowerCase().includes(search.toLowerCase());
      const matchType =
        typeFilter === 'all' || tx.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [merchantHistory, search, typeFilter]);

  useEffect(() => {
    const hasPending = merchantHistory.some(
      (t) =>
        t.status === 'PENDING' &&
        t.coolingEndsAt &&
        now >= t.coolingEndsAt
    );
    if (hasPending) {
      setCoolingEndedToast(true);
      const t = setTimeout(() => setCoolingEndedToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [merchantHistory, now]);

  const handleExportCSV = () => {
    touch();
    const blob = new Blob(
      [
        'Date,Type,Description,Amount,Balance,Reference,Status\n' +
          merchantHistory
            .map(
              (t) =>
                `${t.dateTime},${t.type},${t.description},${t.amountUsdt},${t.balanceAfterUsdt},${t.reference},${t.status}`
            )
            .join('\n'),
      ],
      { type: 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    touch();
    alert('Export PDF (mock) – would download PDF');
  };

  const handleRowClick = (tx: MerchantTx, e?: React.MouseEvent) => {
    touch();
    if (e?.target instanceof HTMLElement && e.target.closest('button')) return;
    setDetailModal(tx);
  };

  const handleVerifyClick = (tx: MerchantTx) => {
    touch();
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
  };

  const canVerify = (tx: MerchantTx) =>
    tx.status === 'PAYMENT_VERIFICATION' ||
    (tx.status === 'PENDING' && tx.coolingEndsAt != null && now >= tx.coolingEndsAt);

  const coolingActive = (tx: MerchantTx) =>
    tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt;

  const availableBalance = wallet?.availableUsdt ?? merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
  const lockedBalance = wallet?.lockedUsdt ?? 0;

  return (
    <div className="flex min-h-screen bg-[#0B1220]">
      {/* Sidebar */}
      <aside className="w-16 lg:w-56 flex flex-col bg-[#0F172A] border-r border-slate-700 text-slate-400">
        <div className="p-4 border-b border-slate-700">
          <span className="font-semibold text-white text-lg hidden lg:inline">
            FastPikeswap
          </span>
        </div>
        <nav className="flex-1 p-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.MERCHANT.HISTORY)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-primary"
          >
            <span>📊</span>
            <span className="hidden lg:inline">Transactions</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.BRIDGE.PAYMENT)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 mt-1"
          >
            <span>💳</span>
            <span className="hidden lg:inline">Bridge</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-700 bg-[#0F172A]">
          <h1 className="text-lg font-semibold text-white">
            Transaction History
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-sm hover:bg-slate-800"
            >
              Invite Player
            </button>
            <button
              type="button"
              onClick={() => setDepositModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-primary text-black text-sm font-medium"
            >
              Deposit
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {coolingEndedToast && (
            <div className="mb-4 p-4 rounded-xl bg-primary/20 border border-primary/50 text-primary text-sm">
              Cooling ended. Please verify payment.
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-sm">Available Balance</p>
              <p className="text-2xl font-semibold text-primary">
                {availableBalance.toFixed(2)} USDT
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-sm">Locked Balance</p>
              <p className="text-2xl font-semibold text-slate-300">{lockedBalance.toFixed(2)} USDT</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-primary focus:outline-none min-w-[200px]"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-primary focus:outline-none"
            >
              <option value="all">All types</option>
              <option value="Deposit via Crypto Bridge">Deposit via Crypto Bridge</option>
              <option value="Player Deposit Conversion">Player Deposit Conversion</option>
              <option value="Merchant Settlement">Merchant Settlement</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:border-primary focus:outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800"
            >
              Export PDF
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Date
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Type
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Description
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Balance after
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Status
                    </th>
                    <th className="px-4 py-3 text-slate-400 font-medium text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((tx) => (
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
                      className="border-b border-slate-700/50 transition-colors cursor-pointer hover:bg-slate-800/70"
                    >
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {tx.dateTime}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {tx.type}
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          tx.amountUsdt >= 0 ? 'text-primary' : 'text-red-400'
                        }`}
                      >
                        {tx.amountUsdt >= 0 ? '+' : ''}
                        {tx.amountUsdt} USDT
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        {tx.balanceAfterUsdt.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm font-mono">
                        {tx.reference}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'SUCCESSFUL'
                              ? 'bg-green-500/20 text-green-400'
                              : tx.status === 'FAILED'
                                ? 'bg-red-500/20 text-red-400'
                                : tx.status === 'PAYMENT_VERIFICATION'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {tx.status === 'PAYMENT_VERIFICATION'
                            ? 'Payment Verification'
                            : tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {canVerify(tx) ? (
                          <button
                            type="button"
                            onClick={() => handleVerifyClick(tx)}
                            className="px-3 py-1 rounded-lg bg-primary text-black text-xs font-medium hover:bg-primary/90"
                          >
                            Verify
                          </button>
                        ) : coolingActive(tx) ? (
                          <span
                            className="text-xs text-slate-500"
                            title="Cooling in progress"
                          >
                            Cooling...
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Deposit modal */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Deposit"
      >
        <p className="text-slate-400 mb-6">
          Deposit fiat via Crypto Bridge. Fastpikeswop will convert your payment into USDT.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setDepositModalOpen(false);
              resetBridgeFlow({ preserveWalletAndHistory: true });
              navigate(ROUTES.BRIDGE.EXPLAIN, { replace: true });
            }}
            className="min-h-[44px] w-full rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
          >
            Deposit via Fastpikeswop
          </button>
          <button
            type="button"
            onClick={() => setDepositModalOpen(false)}
            className="min-h-[44px] w-full rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Transaction Details Large Modal */}
      <LargeModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal?.status === 'FAILED' ? 'Failure Details' : 'Transaction Details'}
      >
        {detailModal && (
          <div className="space-y-6">
            {/* Section A: Transaction Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Date/Time</p>
                <p className="text-slate-300">{detailModal.dateTime}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Status</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailModal.status === 'SUCCESSFUL'
                      ? 'bg-green-500/20 text-green-400'
                      : detailModal.status === 'FAILED'
                        ? 'bg-red-500/20 text-red-400'
                        : detailModal.status === 'PAYMENT_VERIFICATION'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {detailModal.status === 'PAYMENT_VERIFICATION'
                    ? 'Payment Verification'
                    : detailModal.status}
                </span>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Amount</p>
                <p className={`font-medium ${detailModal.amountUsdt >= 0 ? 'text-primary' : 'text-red-400'}`}>
                  {detailModal.amountUsdt >= 0 ? '+' : ''}{detailModal.amountUsdt} USDT
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Balance after</p>
                <p className="text-slate-300">{detailModal.balanceAfterUsdt.toFixed(2)} USDT</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Reference</p>
                <div className="flex items-center gap-2">
                  <p className="text-slate-300 font-mono text-sm">{detailModal.reference}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(detailModal.reference);
                    }}
                    className="px-2 py-1 rounded bg-slate-700 text-slate-400 text-xs hover:bg-slate-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Type</p>
                <p className="text-slate-300">{detailModal.type}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Description</p>
                <p className="text-slate-300">{detailModal.description}</p>
              </div>
              {detailModal.status === 'FAILED' && detailModal.failureReason && (
                <div className="sm:col-span-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Failure reason</p>
                  <p className="text-red-400">{detailModal.failureReason}</p>
                </div>
              )}
              {detailModal.status === 'PENDING' && detailModal.coolingEndsAt && now < detailModal.coolingEndsAt && (
                <div className="sm:col-span-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Cooling ends at</p>
                  <p className="text-slate-300">
                    {new Date(detailModal.coolingEndsAt).toLocaleString()} (
                    {Math.ceil((detailModal.coolingEndsAt - now) / 60000)} min remaining)
                  </p>
                </div>
              )}
            </div>

            {/* Section B: Beneficiary Details */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-medium text-white mb-4">Beneficiary Details</h3>
              {detailModal.beneficiary ? (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Beneficiary Name</p>
                    <p className="text-slate-300">{detailModal.beneficiary.beneficiaryName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Bank Name</p>
                    <p className="text-slate-300">{detailModal.beneficiary.bankName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Account (masked)</p>
                    <p className="text-slate-300 font-mono">{detailModal.beneficiary.accountNumberMasked}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">IFSC</p>
                    <p className="text-slate-300 font-mono">{detailModal.beneficiary.ifsc}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">No beneficiary details available</p>
              )}
            </div>

            {/* Contextual CTAs */}
            <div className="flex flex-wrap gap-3 pt-4">
              {detailModal.status === 'PENDING' && coolingActive(detailModal) && (
                <button
                  type="button"
                  onClick={() => {
                    if (resumeCoolingFromTx(detailModal.id)) {
                      setDetailModal(null);
                      navigate(coolingUrl(detailModal.id));
                    }
                  }}
                  className="min-h-[44px] px-6 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
                >
                  Open Cooling Screen
                </button>
              )}
              {detailModal.status === 'PAYMENT_VERIFICATION' && (
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyClick(detailModal);
                    setDetailModal(null);
                  }}
                  className="min-h-[44px] px-6 rounded-xl bg-primary text-black font-semibold hover:bg-primary/90"
                >
                  Verify Payment
                </button>
              )}
              {detailModal.status === 'FAILED' && (
                <button
                  type="button"
                  onClick={() => {
                    handleVerifyClick(detailModal);
                    setDetailModal(null);
                  }}
                  className="min-h-[44px] px-6 rounded-xl border border-primary text-primary font-semibold hover:bg-primary/10"
                >
                  Retry Verification
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="min-h-[44px] px-6 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </LargeModal>
    </div>
  );
}
