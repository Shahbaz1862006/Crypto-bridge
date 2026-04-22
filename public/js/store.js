import { beneficiaries, buildDefaultMerchantHistory, formatDateTime } from './mock-data.js';
import { createOrder as createOrderApi, fetchRate, verifyReference as verifyReferenceApi, finalizeSettlement, setDevExchangeRate, setDevForceVerifyFail as setApiDevForceVerifyFail } from './mock-api.js';

const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;
const STORAGE_KEY = 'fastpikeswap_bridge';

function createEmptyOrder() {
  const usdtAmount = 60;
  const exchangeRate = 83;
  const now = Date.now();
  return {
    orderId: '', createdAt: now, lastActiveAt: now,
    merchantReturnUrl: 'https://merchant.example.com/deposit/return',
    currency: 'INR', coin: 'USDT_TRX',
    invoiceStatus: 'DRAFT',
    usdtAmount, inrAmount: Math.round(usdtAmount * exchangeRate * 100) / 100,
    exchangeRate, rateLoading: false,
    paymentMethod: null,
    beneficiaries: [...beneficiaries],
    selectedBeneficiaryId: null, selectedBeneficiary: null,
    coolingMinutes: null, coolingEndsAt: null,
    paymentTxId: '', referenceType: null, referenceNumber: '',
    referenceVerified: false,
    expectedInrAmount: Math.round(usdtAmount * exchangeRate * 100) / 100,
    verificationErrorCode: null, verificationErrorMessage: null, verificationError: null,
    purchasedUsdt: 0, postPurchaseAction: null, merchantTxId: null,
  };
}

const DEFAULT_DEV = { forceVerifyFailMode: 'NONE', forceCoolingEndNow: false };
const DEFAULT_WALLET = { availableUsdt: 13430.25, lockedUsdt: 0 };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.state ? parsed.state : null;
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: {
        order: state.order,
        merchantHistory: state.merchantHistory,
        wallet: state.wallet,
        usedReferences: state.usedReferences,
        dev: state.dev,
      },
      version: 0,
    }));
  } catch { /* noop */ }
}

const initial = loadState();
const state = {
  order: initial?.order ?? createEmptyOrder(),
  merchantHistory: initial?.merchantHistory ?? buildDefaultMerchantHistory(),
  wallet: initial?.wallet ?? { ...DEFAULT_WALLET },
  usedReferences: initial?.usedReferences ?? [],
  dev: initial?.dev ?? { ...DEFAULT_DEV },
};

const listeners = new Set();

function notify() {
  saveState(state);
  for (const fn of listeners) {
    try { fn(state); } catch (e) { console.error(e); }
  }
}

export function getState() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function patchOrder(patch) {
  state.order = { ...state.order, ...patch };
  notify();
}

export const actions = {
  touch() {
    state.order.lastActiveAt = Date.now();
    notify();
  },

  async createOrder(params) {
    patchOrder({ rateLoading: true });
    const rate = await fetchRate();
    const created = createOrderApi({ ...params, exchangeRate: rate });
    state.order = { ...created, rateLoading: false };
    notify();
    actions.seedMerchantHistoryIfEmpty();
  },

  setUsdtAmount(usdtAmount) {
    const inrAmount = Math.round(usdtAmount * state.order.exchangeRate * 100) / 100;
    patchOrder({ usdtAmount, inrAmount });
  },

  selectUPI() {
    const upiBeneficiary = {
      id: 'UPI-FIXED',
      displayName: 'Rapido Gate Collections',
      bankName: 'HDFC Bank',
      accountNumberMasked: 'rapidogate@hdfc',
      ifsc: 'HDFC0001234',
    };
    patchOrder({
      paymentMethod: 'UPI',
      referenceType: 'UTR',
      invoiceStatus: 'AWAITING_PAYMENT',
      expectedInrAmount: state.order.inrAmount,
      selectedBeneficiaryId: upiBeneficiary.id,
      selectedBeneficiary: upiBeneficiary,
      lastActiveAt: Date.now(),
    });
  },

  selectBANK() {
    patchOrder({ paymentMethod: 'BANK', invoiceStatus: 'AWAITING_BENEFICIARY', lastActiveAt: Date.now() });
  },

  selectBeneficiary(beneficiary) {
    patchOrder({
      selectedBeneficiaryId: beneficiary.id,
      selectedBeneficiary: beneficiary,
      lastActiveAt: Date.now(),
    });
  },

  setCooling(coolingMinutes) {
    const now = Date.now();
    const coolingMs = state.dev.forceCoolingEndNow ? 1000 : coolingMinutes * 60 * 1000;
    const coolingEndsAt = now + coolingMs;
    const o = state.order;
    const id = 'mtx_' + String(Date.now()).slice(-8);
    const lastBalance = state.merchantHistory.length > 0
      ? state.merchantHistory.reduce((max, t) => Math.max(max, t.balanceAfterUsdt), 0) : 13000;
    const beneficiary = o.selectedBeneficiary ? {
      beneficiaryName: o.selectedBeneficiary.displayName,
      bankName: o.selectedBeneficiary.bankName,
      accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
      ifsc: o.selectedBeneficiary.ifsc,
    } : null;
    const newTx = {
      id, dateTime: formatDateTime(new Date()),
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit pending cooling period',
      amountUsdt: o.usdtAmount, balanceAfterUsdt: lastBalance,
      reference: `ref_dep_${id.slice(-6)}...`,
      status: 'PENDING', coolingEndsAt, relatedOrderId: o.orderId, beneficiary,
    };
    state.merchantHistory = [newTx, ...state.merchantHistory];
    patchOrder({
      coolingMinutes, coolingEndsAt,
      invoiceStatus: 'COOLING', merchantTxId: id, lastActiveAt: now,
    });
  },

  setCoolingNone() {
    const o = state.order;
    const id = 'mtx_' + String(Date.now()).slice(-8);
    const lastBalance = state.merchantHistory.length > 0
      ? state.merchantHistory.reduce((max, t) => Math.max(max, t.balanceAfterUsdt), 0) : 13000;
    const beneficiary = o.selectedBeneficiary ? {
      beneficiaryName: o.selectedBeneficiary.displayName,
      bankName: o.selectedBeneficiary.bankName,
      accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
      ifsc: o.selectedBeneficiary.ifsc,
    } : null;
    const newTx = {
      id, dateTime: formatDateTime(new Date()),
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit – ready for verification',
      amountUsdt: o.usdtAmount, balanceAfterUsdt: lastBalance,
      reference: `ref_dep_${id.slice(-6)}...`,
      status: 'PAYMENT_VERIFICATION', coolingEndsAt: null, relatedOrderId: o.orderId, beneficiary,
    };
    state.merchantHistory = [newTx, ...state.merchantHistory];
    patchOrder({
      coolingMinutes: null, coolingEndsAt: null,
      invoiceStatus: 'READY_FOR_VERIFICATION',
      referenceType: 'BRN', referenceNumber: '',
      expectedInrAmount: state.order.inrAmount,
      merchantTxId: id, lastActiveAt: Date.now(),
    });
  },

  setPaymentTxId(paymentTxId) {
    patchOrder({ paymentTxId, verificationError: null, lastActiveAt: Date.now() });
  },

  setReferenceNumber(referenceNumber) {
    patchOrder({
      referenceNumber, verificationError: null,
      verificationErrorCode: null, verificationErrorMessage: null,
      lastActiveAt: Date.now(),
    });
  },

  resetUsedReferences() { state.usedReferences = []; notify(); },

  async verifyReference() {
    const o = state.order;
    const ref = o.referenceNumber.trim().toUpperCase();
    const refType = o.referenceType;
    const expectedInr = o.expectedInrAmount || o.inrAmount;
    patchOrder({
      invoiceStatus: 'VERIFYING',
      verificationError: null, verificationErrorCode: null, verificationErrorMessage: null,
      lastActiveAt: Date.now(),
    });
    setApiDevForceVerifyFail(state.dev.forceVerifyFailMode);
    const result = await verifyReferenceApi(
      { referenceType: refType, referenceNumber: ref, expectedInrAmount: expectedInr },
      state.usedReferences
    );
    const usdtAmount = o.usdtAmount;
    if (result.success) {
      state.usedReferences = [...state.usedReferences, ref];
      const activeId = state.order.merchantTxId;
      let finalMerchantTxId = activeId;
      if (activeId) {
        const idx = state.merchantHistory.findIndex((t) => t.id === activeId);
        if (idx >= 0) {
          const prevBal = idx < state.merchantHistory.length - 1
            ? state.merchantHistory[idx + 1]?.balanceAfterUsdt ?? 13000 : 13000;
          state.merchantHistory = state.merchantHistory.map((t, i) =>
            i === idx ? {
              ...t, status: 'SUCCESSFUL',
              description: `Bridge deposit purchase: ${usdtAmount} USDT (INR converted)`,
              balanceAfterUsdt: prevBal + usdtAmount,
            } : t
          );
        }
      } else {
        const newTxId = 'mtx_' + String(Date.now()).slice(-8);
        const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
        const beneficiary = state.order.selectedBeneficiary ? {
          beneficiaryName: state.order.selectedBeneficiary.displayName,
          bankName: state.order.selectedBeneficiary.bankName,
          accountNumberMasked: state.order.selectedBeneficiary.accountNumberMasked,
          ifsc: state.order.selectedBeneficiary.ifsc,
        } : null;
        state.merchantHistory = [
          {
            id: newTxId, dateTime: formatDateTime(new Date()),
            type: 'Deposit via Crypto Bridge',
            description: `Bridge deposit purchase: ${usdtAmount} USDT (INR converted)`,
            amountUsdt: usdtAmount, balanceAfterUsdt: lastBal + usdtAmount,
            reference: `ref_dep_${newTxId.slice(-6)}...`,
            status: 'SUCCESSFUL', coolingEndsAt: null,
            relatedOrderId: state.order.orderId, beneficiary,
          },
          ...state.merchantHistory,
        ];
        finalMerchantTxId = newTxId;
      }
      patchOrder({
        invoiceStatus: 'VERIFIED', referenceVerified: true, purchasedUsdt: usdtAmount,
        merchantTxId: finalMerchantTxId,
        verificationErrorCode: null, verificationErrorMessage: null,
        lastActiveAt: Date.now(),
      });
      return { success: true };
    }
    const activeId = state.order.merchantTxId;
    if (activeId) {
      state.merchantHistory = state.merchantHistory.map((t) =>
        t.id === activeId ? { ...t, status: 'FAILED', failureReason: result.error } : t
      );
    } else {
      const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
      state.merchantHistory = [
        {
          id: 'mtx_' + String(Date.now()).slice(-8),
          dateTime: formatDateTime(new Date()),
          type: 'Deposit via Crypto Bridge',
          description: 'Bridge deposit (verification failed)',
          amountUsdt: usdtAmount, balanceAfterUsdt: lastBal,
          reference: 'ref_dep_fail...',
          status: 'FAILED', coolingEndsAt: null,
          relatedOrderId: state.order.orderId, failureReason: result.error,
        },
        ...state.merchantHistory,
      ];
    }
    patchOrder({
      invoiceStatus: 'FAILED', referenceVerified: false,
      verificationErrorCode: result.errorCode ?? null,
      verificationErrorMessage: result.error ?? null,
      verificationError: result.error ?? 'Verification failed',
      lastActiveAt: Date.now(),
    });
    return { success: false, error: result.error };
  },

  async finalizeSend() {
    const o = state.order;
    const { orderId: ordId, merchantTxId: txId, purchasedUsdt: amt, postPurchaseAction } = o;
    if (postPurchaseAction === 'SEND') return;
    await finalizeSettlement(ordId);
    const targetTx = txId
      ? state.merchantHistory.find((t) => t.id === txId)
      : state.merchantHistory.find((t) => t.relatedOrderId === ordId);
    if (!targetTx) return;
    const currentAvailable = state.wallet?.availableUsdt ?? DEFAULT_WALLET.availableUsdt;
    const newAvailable = currentAvailable + amt;
    const tx = txId
      ? state.merchantHistory.find((t) => t.id === txId)
      : state.merchantHistory.find((t) => t.relatedOrderId === ordId);
    if (!tx) return;
    const updatedTx = {
      ...tx, status: 'SUCCESSFUL',
      description: 'Bridge deposit sent to merchant',
      dateTime: formatDateTime(new Date()),
      balanceAfterUsdt: newAvailable, amountUsdt: amt,
    };
    const rest = state.merchantHistory.filter((t) => t.id !== updatedTx.id);
    state.merchantHistory = [updatedTx, ...rest];
    state.wallet = { availableUsdt: newAvailable, lockedUsdt: state.wallet?.lockedUsdt ?? 0 };
    patchOrder({ postPurchaseAction: 'SEND', lastActiveAt: Date.now() });
  },

  markSendToWallet() {
    const o = state.order;
    patchOrder({ postPurchaseAction: 'WALLET', lastActiveAt: Date.now() });
    if (o.merchantTxId) actions.updateMerchantTxDescription(o.merchantTxId, 'User selected wallet withdrawal (KYC required)');
  },

  reset() {
    state.order = createEmptyOrder();
    notify();
  },

  resetBridgeFlow(opts = {}) {
    state.order = createEmptyOrder();
    notify();
    actions.seedMerchantHistoryIfEmpty();
  },

  expireIfIdle() { return actions.checkExpiry(); },

  tickCooling() {
    const now = Date.now();
    const o = state.order;
    let orderUpdated = false;
    let historyUpdated = false;
    let newHistory = state.merchantHistory;
    for (const tx of state.merchantHistory) {
      if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now >= tx.coolingEndsAt) {
        newHistory = newHistory.map((t) => t.id === tx.id ? { ...t, status: 'PAYMENT_VERIFICATION' } : t);
        historyUpdated = true;
        if (o.merchantTxId === tx.id) orderUpdated = true;
      }
    }
    if (o.invoiceStatus === 'COOLING' && o.coolingEndsAt != null && now >= o.coolingEndsAt) {
      orderUpdated = true;
    }
    if (historyUpdated || orderUpdated) {
      state.merchantHistory = newHistory;
      if (orderUpdated) {
        patchOrder({
          invoiceStatus: 'READY_FOR_VERIFICATION',
          referenceType: 'BRN', referenceNumber: '',
          expectedInrAmount: state.order.inrAmount,
        });
      } else {
        notify();
      }
    }
  },

  goReadyForVerification() {
    patchOrder({ invoiceStatus: 'READY_FOR_VERIFICATION' });
  },

  seedMerchantHistoryIfEmpty() {
    if (state.merchantHistory.length === 0) {
      state.merchantHistory = buildDefaultMerchantHistory();
      notify();
    }
  },

  isExpired() {
    const lastActive = state.order.lastActiveAt;
    if (lastActive === 0) return false;
    return Date.now() - lastActive > SESSION_EXPIRY_MS;
  },

  checkExpiry() {
    if (actions.isExpired()) {
      patchOrder({ invoiceStatus: 'EXPIRED' });
      return true;
    }
    return false;
  },

  setDevRate(rate) {
    setDevExchangeRate(rate);
    if (rate !== null) patchOrder({ exchangeRate: rate });
  },

  setDevForceVerifyFail(mode) {
    setApiDevForceVerifyFail(mode);
    state.dev = { ...state.dev, forceVerifyFailMode: mode };
    notify();
  },

  setDevForceCoolingEndNow(val) {
    state.dev = { ...state.dev, forceCoolingEndNow: !!val };
    notify();
  },

  setBeneficiaryHasCooling(beneficiaryId, hasCooling) {
    const o = state.order;
    const updated = o.beneficiaries.map((b) => b.id === beneficiaryId ? { ...b, hasCooling } : b);
    patchOrder({
      beneficiaries: updated,
      selectedBeneficiary: o.selectedBeneficiary?.id === beneficiaryId
        ? { ...o.selectedBeneficiary, hasCooling } : o.selectedBeneficiary,
      lastActiveAt: Date.now(),
    });
  },

  addHistoryTx(tx) {
    const id = 'mtx_' + String(Date.now()).slice(-8);
    const newTx = { ...tx, id };
    state.merchantHistory = [newTx, ...state.merchantHistory];
    notify();
    return id;
  },

  ensureTxInHistory(tx) {
    if (!state.merchantHistory.some((t) => t.id === tx.id)) {
      state.merchantHistory = [tx, ...state.merchantHistory];
      notify();
    }
  },

  updateHistoryTxStatus(id, status, failureReason) {
    state.merchantHistory = state.merchantHistory.map((t) =>
      t.id === id ? { ...t, status, failureReason } : t);
    notify();
  },

  updateMerchantTxDescription(id, description) {
    state.merchantHistory = state.merchantHistory.map((t) =>
      t.id === id ? { ...t, description } : t);
    notify();
  },

  ensureMerchantTxForSuccess() {
    const o = state.order;
    const existingByOrder = state.merchantHistory.find((t) => t.relatedOrderId === o.orderId);
    if (existingByOrder && existingByOrder.status === 'SUCCESSFUL') {
      if (!o.merchantTxId) patchOrder({ merchantTxId: existingByOrder.id });
      return;
    }
    if (o.merchantTxId) {
      const tx = state.merchantHistory.find((t) => t.id === o.merchantTxId);
      if (tx && tx.status === 'SUCCESSFUL') return;
    }
    const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
    const beneficiary = o.selectedBeneficiary ? {
      beneficiaryName: o.selectedBeneficiary.displayName,
      bankName: o.selectedBeneficiary.bankName,
      accountNumberMasked: o.selectedBeneficiary.accountNumberMasked,
      ifsc: o.selectedBeneficiary.ifsc,
    } : null;
    const id = actions.addHistoryTx({
      dateTime: formatDateTime(new Date(o.createdAt || Date.now())),
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit purchase: ' + (o.purchasedUsdt || o.usdtAmount) + ' USDT (INR converted)',
      amountUsdt: o.purchasedUsdt || o.usdtAmount,
      balanceAfterUsdt: lastBal + (o.purchasedUsdt || o.usdtAmount),
      reference: 'ref_dep_' + (o.orderId || 'new').slice(-8) + '...',
      status: 'SUCCESSFUL', coolingEndsAt: null,
      relatedOrderId: o.orderId, beneficiary,
    });
    patchOrder({ merchantTxId: id });
  },

  setHistoryTxCoolingEnded(id) {
    state.merchantHistory = state.merchantHistory.map((t) =>
      t.id === id ? { ...t, coolingEndsAt: Date.now() - 1000, status: 'PAYMENT_VERIFICATION' } : t);
    if (state.order.merchantTxId === id) {
      patchOrder({ coolingEndsAt: Date.now() - 1000, invoiceStatus: 'READY_FOR_VERIFICATION' });
    } else notify();
  },

  addMockSuccessfulTx() {
    const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
    actions.addHistoryTx({
      dateTime: formatDateTime(new Date()), type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit purchase: 75 USDT (INR converted)',
      amountUsdt: 75, balanceAfterUsdt: lastBal + 75,
      reference: 'ref_dep_mock_ok...', status: 'SUCCESSFUL',
      coolingEndsAt: null, relatedOrderId: 'ORD-MOCK',
    });
  },

  addMockFailedTx() {
    const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
    actions.addHistoryTx({
      dateTime: formatDateTime(new Date()), type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit (verification failed)',
      amountUsdt: 90, balanceAfterUsdt: lastBal,
      reference: 'ref_dep_mock_fail...', status: 'FAILED',
      coolingEndsAt: null, relatedOrderId: 'ORD-MOCK', failureReason: 'TxID not found',
    });
  },

  addMockPendingTx() {
    const lastBal = state.merchantHistory[0]?.balanceAfterUsdt ?? 13430.25;
    actions.addHistoryTx({
      dateTime: formatDateTime(new Date()), type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit pending cooling period',
      amountUsdt: 55, balanceAfterUsdt: lastBal,
      reference: 'ref_dep_mock_pend...', status: 'PENDING',
      coolingEndsAt: Date.now() + 60 * 60000, relatedOrderId: 'ORD-MOCK',
    });
  },

  forceCoolingEnd(id) { actions.setHistoryTxCoolingEnded(id); },

  resetHistoryToDefaults() {
    state.merchantHistory = buildDefaultMerchantHistory();
    notify();
  },

  setMerchantTxId(id) { patchOrder({ merchantTxId: id }); },

  resumeCoolingFromTx(txId) {
    const tx = state.merchantHistory.find((t) => t.id === txId);
    const endsAt = tx?.coolingEndsAt;
    if (!tx || tx.status !== 'PENDING' || endsAt == null) return false;
    const now = Date.now();
    if (now >= endsAt) return false;
    patchOrder({
      merchantTxId: txId, coolingEndsAt: endsAt,
      coolingMinutes: Math.ceil((endsAt - now) / 60000),
      invoiceStatus: 'COOLING', usdtAmount: tx.amountUsdt,
      inrAmount: Math.round(tx.amountUsdt * (state.order.exchangeRate || 83) * 100) / 100,
      lastActiveAt: Date.now(),
    });
    return true;
  },

  patchOrder,
};

if (typeof window !== 'undefined') {
  window.__STORE__ = { getState, actions, subscribe };
}
