import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createOrder as createOrderApi,
  fetchRate,
  verifyReference as verifyReferenceApi,
  finalizeSettlement,
  setDevExchangeRate,
  setDevForceVerifyFail,
} from '../api/mockApi';
import { beneficiaries, DEFAULT_MERCHANT_HISTORY } from '../api/mockData';
import type { BridgeOrder, Beneficiary, MerchantTx, TxStatus, DevState, ForceVerifyFailMode, Wallet } from './types';

const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

function createEmptyOrder(): BridgeOrder {
  const usdtAmount = 60;
  const exchangeRate = 83;
  const now = Date.now();
  return {
    orderId: '',
    createdAt: now,
    lastActiveAt: now,
    merchantReturnUrl: 'https://merchant.example.com/deposit/return',
    currency: 'INR',
    coin: 'USDT_TRX',
    invoiceStatus: 'DRAFT',
    usdtAmount,
    inrAmount: Math.round(usdtAmount * exchangeRate * 100) / 100,
    exchangeRate,
    rateLoading: false,
    paymentMethod: null,
    beneficiaries: [...beneficiaries],
    selectedBeneficiaryId: null,
    selectedBeneficiary: null,
    coolingMinutes: null,
    coolingEndsAt: null,
    paymentTxId: '',
    referenceType: null,
    referenceNumber: '',
    referenceVerified: false,
    expectedInrAmount: Math.round(usdtAmount * exchangeRate * 100) / 100,
    verificationErrorCode: null,
    verificationErrorMessage: null,
    verificationError: null,
    purchasedUsdt: 0,
    postPurchaseAction: null,
    merchantTxId: null,
  };
}

function formatDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${h}:${m}:${s}`;
}

const DEFAULT_DEV: DevState = {
  forceVerifyFailMode: 'NONE',
  forceCoolingEndNow: false,
};

const DEFAULT_WALLET: Wallet = {
  availableUsdt: 13430.25,
  lockedUsdt: 0,
};

interface StoreState {
  order: BridgeOrder;
  merchantHistory: MerchantTx[];
  wallet: Wallet;
  usedReferences: string[];
  dev: DevState;
}

interface BridgeStore extends StoreState {
  touch: () => void;
  createOrder: (params: {
    merchantReturnUrl: string;
    currency: 'INR';
    coin: 'USDT_TRX';
    presetUsdt: number;
  }) => Promise<void>;
  setUsdtAmount: (amount: number) => void;
  selectUPI: () => void;
  selectBANK: () => void;
  selectBeneficiary: (beneficiary: Beneficiary) => void;
  setCooling: (minutes: number) => void;
  setCoolingNone: () => void;
  setPaymentTxId: (id: string) => void;
  setReferenceNumber: (value: string) => void;
  verifyReference: () => Promise<{ success: boolean; error?: string }>;
  resetUsedReferences: () => void;
  finalizeSend: () => Promise<void>;
  markSendToWallet: () => void;
  reset: () => void;
  isExpired: () => boolean;
  checkExpiry: () => boolean;
  expireIfIdle: () => boolean;
  setDevRate: (rate: number | null) => void;
  setDevForceVerifyFail: (mode: ForceVerifyFailMode) => void;
  setBeneficiaryHasCooling: (beneficiaryId: string, hasCooling: boolean) => void;

  tickCooling: () => void;
  goReadyForVerification: () => void;
  seedMerchantHistoryIfEmpty: () => void;

  addHistoryTx: (tx: Omit<MerchantTx, 'id'>) => string;
  /** Ensure tx exists in history (for demo row clicks); adds if not present */
  ensureTxInHistory: (tx: MerchantTx) => void;
  updateHistoryTxStatus: (id: string, status: TxStatus, failureReason?: string) => void;
  updateMerchantTxDescription: (id: string, description: string) => void;
  ensureMerchantTxForSuccess: () => void;
  setHistoryTxCoolingEnded: (id: string) => void;
  addMockSuccessfulTx: () => void;
  addMockFailedTx: () => void;
  addMockPendingTx: () => void;
  forceCoolingEnd: (id: string) => void;
  resetHistoryToDefaults: () => void;
  setMerchantTxId: (id: string | null) => void;
  /** Resume cooling from a tx in history (when user clicks PENDING row) */
  resumeCoolingFromTx: (txId: string) => boolean;
  /** Reset bridge flow for fresh deposit; preserves wallet and merchantHistory */
  resetBridgeFlow: (opts?: { preserveWalletAndHistory?: boolean; preserveHistory?: boolean }) => void;
}

export const useBridgeStore = create<BridgeStore>()(
  persist(
    (set, get) => {
      const order = createEmptyOrder();
      return {
        order,
        merchantHistory: [...DEFAULT_MERCHANT_HISTORY],
        wallet: DEFAULT_WALLET,
        usedReferences: [],
        dev: DEFAULT_DEV,

        touch: () =>
          set((s) => ({
            order: { ...s.order, lastActiveAt: Date.now() },
          })),

        createOrder: async (params) => {
          set((s) => ({
            order: { ...s.order, rateLoading: true },
          }));
          const rate = await fetchRate();
          const created = createOrderApi({ ...params, exchangeRate: rate });
          set((s) => ({
            order: { ...created, rateLoading: false },
            merchantHistory: s.merchantHistory,
          }));
          get().seedMerchantHistoryIfEmpty();
        },

        setUsdtAmount: (usdtAmount) => {
          const { order: o } = get();
          const inrAmount = Math.round(usdtAmount * o.exchangeRate * 100) / 100;
          set((s) => ({
            order: { ...s.order, usdtAmount, inrAmount },
          }));
        },

        selectUPI: () => {
          const upiBeneficiary: Beneficiary = {
            id: 'UPI-FIXED',
            displayName: 'Rapido Gate Collections',
            bankName: 'HDFC Bank',
            accountNumberMasked: 'rapidogate@hdfc',
            ifsc: 'HDFC0001234',
          };
          set((s) => ({
            order: {
              ...s.order,
              paymentMethod: 'UPI',
              referenceType: 'UTR',
              invoiceStatus: 'AWAITING_PAYMENT',
              expectedInrAmount: s.order.inrAmount,
              selectedBeneficiaryId: upiBeneficiary.id,
              selectedBeneficiary: upiBeneficiary,
              lastActiveAt: Date.now(),
            },
          }));
        },

        selectBANK: () =>
          set((s) => ({
            order: {
              ...s.order,
              paymentMethod: 'BANK',
              invoiceStatus: 'AWAITING_BENEFICIARY',
              lastActiveAt: Date.now(),
            },
          })),

        selectBeneficiary: (beneficiary) =>
          set((s) => ({
            order: {
              ...s.order,
              selectedBeneficiaryId: beneficiary.id,
              selectedBeneficiary: beneficiary,
              lastActiveAt: Date.now(),
            },
          })),

        setCooling: (coolingMinutes) => {
          const now = Date.now();
          const { dev } = get();
          const coolingMs = dev.forceCoolingEndNow ? 1000 : coolingMinutes * 60 * 1000;
          const coolingEndsAt = now + coolingMs;
          const { order: o, merchantHistory: hist } = get();
          const id = 'mtx_' + String(Date.now()).slice(-8);
          const lastBalance =
            hist.length > 0
              ? hist.reduce((max, t) => Math.max(max, t.balanceAfterUsdt), 0)
              : 13000;
          const beneficiary: import('./types').BeneficiaryDetails | null = o.selectedBeneficiary
            ? {
                beneficiaryName: o.selectedBeneficiary.displayName,
                bankName: o.selectedBeneficiary.bankName,
                accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
                ifsc: o.selectedBeneficiary.ifsc,
              }
            : null;
          const newTx: MerchantTx = {
            id,
            dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit pending cooling period',
            amountUsdt: o.usdtAmount,
            balanceAfterUsdt: lastBalance,
            reference: `ref_dep_${id.slice(-6)}...`,
            status: 'PENDING',
            coolingEndsAt,
            relatedOrderId: o.orderId,
            beneficiary,
          };
          set((s) => ({
            order: {
              ...s.order,
              coolingMinutes,
              coolingEndsAt,
              invoiceStatus: 'COOLING',
              merchantTxId: id,
              lastActiveAt: now,
            },
            merchantHistory: [newTx, ...s.merchantHistory],
          }));
        },

        setCoolingNone: () => {
          const { order: o, merchantHistory: hist } = get();
          const id = 'mtx_' + String(Date.now()).slice(-8);
          const lastBalance =
            hist.length > 0
              ? hist.reduce((max, t) => Math.max(max, t.balanceAfterUsdt), 0)
              : 13000;
          const beneficiary: import('./types').BeneficiaryDetails | null = o.selectedBeneficiary
            ? {
                beneficiaryName: o.selectedBeneficiary.displayName,
                bankName: o.selectedBeneficiary.bankName,
                accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
                ifsc: o.selectedBeneficiary.ifsc,
              }
            : null;
          const newTx: MerchantTx = {
            id,
            dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit – ready for verification',
            amountUsdt: o.usdtAmount,
            balanceAfterUsdt: lastBalance,
            reference: `ref_dep_${id.slice(-6)}...`,
            status: 'PAYMENT_VERIFICATION',
            coolingEndsAt: null,
            relatedOrderId: o.orderId,
            beneficiary,
          };
          set((s) => ({
            order: {
              ...s.order,
              coolingMinutes: null,
              coolingEndsAt: null,
              invoiceStatus: 'READY_FOR_VERIFICATION',
              referenceType: 'BRN',
              referenceNumber: '',
              expectedInrAmount: s.order.inrAmount,
              merchantTxId: id,
              lastActiveAt: Date.now(),
            },
            merchantHistory: [newTx, ...s.merchantHistory],
          }));
        },

        setPaymentTxId: (paymentTxId) =>
          set((s) => ({
            order: {
              ...s.order,
              paymentTxId,
              verificationError: null,
              lastActiveAt: Date.now(),
            },
          })),

        setReferenceNumber: (referenceNumber) =>
          set((s) => ({
            order: {
              ...s.order,
              referenceNumber,
              verificationError: null,
              verificationErrorCode: null,
              verificationErrorMessage: null,
              lastActiveAt: Date.now(),
            },
          })),

        resetUsedReferences: () => set({ usedReferences: [] }),

        verifyReference: async () => {
          const { order: o, usedReferences } = get();
          const ref = o.referenceNumber.trim().toUpperCase();
          const refType = o.referenceType;
          const expectedInr = o.expectedInrAmount || o.inrAmount;
          set((s) => ({
            order: {
              ...s.order,
              invoiceStatus: 'VERIFYING',
              verificationError: null,
              verificationErrorCode: null,
              verificationErrorMessage: null,
              lastActiveAt: Date.now(),
            },
          }));
          setDevForceVerifyFail(get().dev.forceVerifyFailMode);
          const result = await verifyReferenceApi(
            { referenceType: refType!, referenceNumber: ref, expectedInrAmount: expectedInr },
            usedReferences
          );
          const usdtAmount = o.usdtAmount;
          if (result.success) {
            const newTxId = 'mtx_' + String(Date.now()).slice(-8);
            set((s) => ({
              usedReferences: [...s.usedReferences, ref],
            }));
            set((s) => {
              const activeId = s.order.merchantTxId;
              let updated = s.merchantHistory;
              let finalMerchantTxId = activeId;
              if (activeId) {
                const idx = updated.findIndex((t) => t.id === activeId);
                if (idx >= 0) {
                  const prevBal =
                    idx < updated.length - 1
                      ? updated[idx + 1]?.balanceAfterUsdt ?? 13000
                      : 13000;
                  updated = updated.map((t, i) =>
                    i === idx
                      ? {
                          ...t,
                          status: 'SUCCESSFUL' as const,
                          description: `Bridge deposit purchase: ${usdtAmount} USDT (INR converted)`,
                          balanceAfterUsdt: prevBal + usdtAmount,
                        }
                      : t
                  );
                }
              } else {
                const lastBal = updated[0]?.balanceAfterUsdt ?? 13430.25;
                const beneficiary: import('./types').BeneficiaryDetails | null = s.order.selectedBeneficiary
                  ? {
                      beneficiaryName: s.order.selectedBeneficiary.displayName,
                      bankName: s.order.selectedBeneficiary.bankName,
                      accountNumberMasked: s.order.selectedBeneficiary.accountNumberMasked,
                      ifsc: s.order.selectedBeneficiary.ifsc,
                    }
                  : null;
                updated = [
                  {
                    id: newTxId,
                    dateTime: formatDateTime(new Date()),
                    type: 'Deposit via Crypto Bridge' as const,
                    description: `Bridge deposit purchase: ${usdtAmount} USDT (INR converted)`,
                    amountUsdt: usdtAmount,
                    balanceAfterUsdt: lastBal + usdtAmount,
                    reference: `ref_dep_${newTxId.slice(-6)}...`,
                    status: 'SUCCESSFUL' as const,
                    coolingEndsAt: null,
                    relatedOrderId: s.order.orderId,
                    beneficiary,
                  },
                  ...updated,
                ];
                finalMerchantTxId = newTxId;
              }
              return {
                order: {
                  ...s.order,
                  invoiceStatus: 'VERIFIED',
                  referenceVerified: true,
                  purchasedUsdt: usdtAmount,
                  merchantTxId: finalMerchantTxId,
                  verificationErrorCode: null,
                  verificationErrorMessage: null,
                  lastActiveAt: Date.now(),
                },
                merchantHistory: updated,
              };
            });
            return { success: true };
          }
          set((s) => {
            const activeId = s.order.merchantTxId;
            let updated = s.merchantHistory;
            if (activeId) {
              updated = updated.map((t) =>
                t.id === activeId
                  ? {
                      ...t,
                      status: 'FAILED' as const,
                      failureReason: result.error,
                    }
                  : t
              );
            } else {
              const lastBal = updated[0]?.balanceAfterUsdt ?? 13430.25;
              updated = [
                {
                  id: 'mtx_' + String(Date.now()).slice(-8),
                  dateTime: formatDateTime(new Date()),
                  type: 'Deposit via Crypto Bridge' as const,
                  description: 'Bridge deposit (verification failed)',
                  amountUsdt: usdtAmount,
                  balanceAfterUsdt: lastBal,
                  reference: 'ref_dep_fail...',
                  status: 'FAILED' as const,
                  coolingEndsAt: null,
                  relatedOrderId: s.order.orderId,
                  failureReason: result.error,
                },
                ...updated,
              ];
            }
            return {
              order: {
                ...s.order,
                invoiceStatus: 'FAILED',
                referenceVerified: false,
                verificationErrorCode: result.errorCode ?? null,
                verificationErrorMessage: result.error ?? null,
                verificationError: result.error ?? 'Verification failed',
                lastActiveAt: Date.now(),
              },
              merchantHistory: updated,
            };
          });
          return { success: false, error: result.error };
        },

        finalizeSend: async () => {
          const { order: o, merchantHistory, wallet } = get();
          const { orderId: ordId, merchantTxId: txId, purchasedUsdt: amt, postPurchaseAction } = o;

          if (postPurchaseAction === 'SEND') return;

          await finalizeSettlement(ordId);

          const targetTx = txId
            ? merchantHistory.find((t) => t.id === txId)
            : merchantHistory.find((t) => t.relatedOrderId === ordId);

          if (!targetTx) return;

          const currentAvailable = wallet?.availableUsdt ?? DEFAULT_WALLET.availableUsdt;
          const newAvailable = currentAvailable + amt;

          set((s) => {
            const tx = txId
              ? s.merchantHistory.find((t) => t.id === txId)
              : s.merchantHistory.find((t) => t.relatedOrderId === ordId);
            if (!tx) return s;

            const updatedTx: MerchantTx = {
              ...tx,
              status: 'SUCCESSFUL',
              description: 'Bridge deposit sent to merchant',
              dateTime: formatDateTime(new Date()),
              balanceAfterUsdt: newAvailable,
              amountUsdt: amt,
            };

            const rest = s.merchantHistory.filter((t) => t.id !== updatedTx.id);
            const newHistory = [updatedTx, ...rest];

            return {
              wallet: {
                availableUsdt: newAvailable,
                lockedUsdt: s.wallet?.lockedUsdt ?? 0,
              },
              merchantHistory: newHistory,
              order: {
                ...s.order,
                postPurchaseAction: 'SEND',
                lastActiveAt: Date.now(),
              },
            };
          });
        },

        markSendToWallet: () => {
          const { order: o } = get();
          set((s) => ({
            order: { ...s.order, postPurchaseAction: 'WALLET', lastActiveAt: Date.now() },
          }));
          const txId = o.merchantTxId;
          if (txId) {
            get().updateMerchantTxDescription(txId, 'User selected wallet withdrawal (KYC required)');
          }
        },

        reset: () =>
          set({
            order: createEmptyOrder(),
            merchantHistory: get().merchantHistory,
            wallet: get().wallet,
            usedReferences: get().usedReferences,
            dev: get().dev,
          }),

        resetBridgeFlow: (opts = {}) => {
          const { preserveWalletAndHistory = true, preserveHistory } = opts;
          const preserve = preserveWalletAndHistory || preserveHistory !== false;
          const { merchantHistory, wallet } = get();
          set((s) => ({
            order: createEmptyOrder(),
            merchantHistory: preserve ? merchantHistory : s.merchantHistory,
            wallet: preserve ? (wallet ?? s.wallet) : s.wallet,
            usedReferences: s.usedReferences,
            dev: s.dev,
          }));
          get().seedMerchantHistoryIfEmpty();
        },

        expireIfIdle: () => {
          return get().checkExpiry();
        },

        tickCooling: () => {
          const now = Date.now();
          const { order: o, merchantHistory } = get();
          let orderUpdated = false;
          let historyUpdated = false;
          let newHistory = merchantHistory;

          // Tick ALL PENDING rows in merchantHistory (global ticker)
          for (const tx of merchantHistory) {
            if (
              tx.status === 'PENDING' &&
              tx.coolingEndsAt != null &&
              now >= tx.coolingEndsAt
            ) {
              newHistory = newHistory.map((t) =>
                t.id === tx.id ? { ...t, status: 'PAYMENT_VERIFICATION' as const } : t
              );
              historyUpdated = true;
              if (o.merchantTxId === tx.id) {
                orderUpdated = true;
              }
            }
          }

          // Also tick order's cooling if it matches
          if (o.invoiceStatus === 'COOLING' && o.coolingEndsAt != null && now >= o.coolingEndsAt) {
            orderUpdated = true;
          }

          if (historyUpdated || orderUpdated) {
            set((s) => ({
              merchantHistory: newHistory,
              order: orderUpdated
                ? {
                    ...s.order,
                    invoiceStatus: 'READY_FOR_VERIFICATION',
                    referenceType: 'BRN',
                    referenceNumber: '',
                    expectedInrAmount: s.order.inrAmount,
                  }
                : s.order,
            }));
          }
        },

        goReadyForVerification: () => {
          set((s) => ({
            order: { ...s.order, invoiceStatus: 'READY_FOR_VERIFICATION' },
          }));
        },

        seedMerchantHistoryIfEmpty: () => {
          const { merchantHistory } = get();
          if (merchantHistory.length === 0) {
            set((s) => ({
              merchantHistory: [...DEFAULT_MERCHANT_HISTORY],
              order: s.order,
            }));
          }
        },

        isExpired: () => {
          const { order: o } = get();
          if (o.lastActiveAt === 0) return false;
          return Date.now() - o.lastActiveAt > SESSION_EXPIRY_MS;
        },

        checkExpiry: () => {
          if (get().isExpired()) {
            set((s) => ({
              order: { ...s.order, invoiceStatus: 'EXPIRED' },
            }));
            return true;
          }
          return false;
        },

        setDevRate: (rate) => {
          setDevExchangeRate(rate);
          if (rate !== null) {
            set((s) => ({
              order: { ...s.order, exchangeRate: rate },
            }));
          }
        },

        setDevForceVerifyFail: (mode) => {
          setDevForceVerifyFail(mode);
          set((s) => ({
            dev: { ...s.dev, forceVerifyFailMode: mode },
          }));
        },

        setBeneficiaryHasCooling: (beneficiaryId, hasCooling) => {
          const { order: o } = get();
          const updated = o.beneficiaries.map((b) =>
            b.id === beneficiaryId ? { ...b, hasCooling } : b
          );
          set((s) => ({
            order: {
              ...s.order,
              beneficiaries: updated,
              selectedBeneficiary:
                s.order.selectedBeneficiary?.id === beneficiaryId
                  ? { ...s.order.selectedBeneficiary, hasCooling }
                  : s.order.selectedBeneficiary,
              lastActiveAt: Date.now(),
            },
          }));
        },

        addHistoryTx: (tx) => {
          const id = 'mtx_' + String(Date.now()).slice(-8);
          const newTx: MerchantTx = { ...tx, id };
          set((s) => ({
            merchantHistory: [newTx, ...s.merchantHistory],
          }));
          return id;
        },

        ensureTxInHistory: (tx) => {
          const exists = get().merchantHistory.some((t) => t.id === tx.id);
          if (!exists) {
            set((s) => ({
              merchantHistory: [tx, ...s.merchantHistory],
            }));
          }
        },

        updateHistoryTxStatus: (id, status, failureReason) => {
          set((s) => ({
            merchantHistory: s.merchantHistory.map((t) =>
              t.id === id ? { ...t, status, failureReason } : t
            ),
          }));
        },

        updateMerchantTxDescription: (id, description) => {
          set((s) => ({
            merchantHistory: s.merchantHistory.map((t) =>
              t.id === id ? { ...t, description } : t
            ),
          }));
        },

        ensureMerchantTxForSuccess: () => {
          const { order: o, merchantHistory } = get();
          const existingByOrder = merchantHistory.find((t) => t.relatedOrderId === o.orderId);
          if (existingByOrder && existingByOrder.status === 'SUCCESSFUL') {
            if (!o.merchantTxId) {
              set((s) => ({ order: { ...s.order, merchantTxId: existingByOrder.id } }));
            }
            return;
          }
          if (o.merchantTxId) {
            const tx = merchantHistory.find((t) => t.id === o.merchantTxId);
            if (tx && tx.status === 'SUCCESSFUL') return;
          }
          const lastBal = merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
          const beneficiary: import('./types').BeneficiaryDetails | null = o.selectedBeneficiary
            ? {
                beneficiaryName: o.selectedBeneficiary.displayName,
                bankName: o.selectedBeneficiary.bankName,
                accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
                ifsc: o.selectedBeneficiary.ifsc,
              }
            : null;
          const id = get().addHistoryTx({
            dateTime: formatDateTime(new Date(o.createdAt || Date.now())),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit purchase: ' + (o.purchasedUsdt || o.usdtAmount) + ' USDT (INR converted)',
            amountUsdt: o.purchasedUsdt || o.usdtAmount,
            balanceAfterUsdt: lastBal + (o.purchasedUsdt || o.usdtAmount),
            reference: 'ref_dep_' + (o.orderId || 'new').slice(-8) + '...',
            status: 'SUCCESSFUL',
            coolingEndsAt: null,
            relatedOrderId: o.orderId,
            beneficiary,
          });
          set((s) => ({
            order: { ...s.order, merchantTxId: id },
          }));
        },

        setHistoryTxCoolingEnded: (id) => {
          set((s) => ({
            merchantHistory: s.merchantHistory.map((t) =>
              t.id === id
                ? { ...t, coolingEndsAt: Date.now() - 1000, status: 'PAYMENT_VERIFICATION' as const }
                : t
            ),
            order:
              s.order.merchantTxId === id
                ? { ...s.order, coolingEndsAt: Date.now() - 1000, invoiceStatus: 'READY_FOR_VERIFICATION' }
                : s.order,
          }));
        },

        addMockSuccessfulTx: () => {
          const { merchantHistory } = get();
          const lastBal = merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
          get().addHistoryTx({
            dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit purchase: 75 USDT (INR converted)',
            amountUsdt: 75,
            balanceAfterUsdt: lastBal + 75,
            reference: 'ref_dep_mock_ok...',
            status: 'SUCCESSFUL',
            coolingEndsAt: null,
            relatedOrderId: 'ORD-MOCK',
          });
        },

        addMockFailedTx: () => {
          const { merchantHistory } = get();
          const lastBal = merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
          get().addHistoryTx({
            dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit (verification failed)',
            amountUsdt: 90,
            balanceAfterUsdt: lastBal,
            reference: 'ref_dep_mock_fail...',
            status: 'FAILED',
            coolingEndsAt: null,
            relatedOrderId: 'ORD-MOCK',
            failureReason: 'TxID not found',
          });
        },

        addMockPendingTx: () => {
          const { merchantHistory } = get();
          const lastBal = merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
          get().addHistoryTx({
            dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: 'Bridge deposit pending cooling period',
            amountUsdt: 55,
            balanceAfterUsdt: lastBal,
            reference: 'ref_dep_mock_pend...',
            status: 'PENDING',
            coolingEndsAt: Date.now() + 60 * 60000,
            relatedOrderId: 'ORD-MOCK',
          });
        },

        forceCoolingEnd: (id) => {
          get().setHistoryTxCoolingEnded(id);
        },

        resetHistoryToDefaults: () => {
          set((s) => ({
            merchantHistory: [...DEFAULT_MERCHANT_HISTORY],
            order: s.order,
          }));
        },

        setMerchantTxId: (id) => {
          set((s) => ({
            order: { ...s.order, merchantTxId: id },
          }));
        },

        resumeCoolingFromTx: (txId) => {
          const { merchantHistory } = get();
          const tx = merchantHistory.find((t) => t.id === txId);
          const endsAt = tx?.coolingEndsAt;
          if (!tx || tx.status !== 'PENDING' || endsAt == null) return false;
          const now = Date.now();
          if (now >= endsAt) return false;
          set((s) => ({
            order: {
              ...s.order,
              merchantTxId: txId,
              coolingEndsAt: endsAt,
              coolingMinutes: Math.ceil((endsAt - now) / 60000),
              invoiceStatus: 'COOLING',
              usdtAmount: tx.amountUsdt,
              inrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
              lastActiveAt: Date.now(),
            },
          }));
          return true;
        },
      };
    },
    {
      name: 'fastpikeswap_bridge',
      partialize: (s) => ({
        order: s.order,
        merchantHistory: s.merchantHistory,
        wallet: s.wallet,
        usedReferences: s.usedReferences,
        dev: s.dev,
      }),
    }
  )
);
