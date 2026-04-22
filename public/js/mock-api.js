import { beneficiaries } from './mock-data.js';

let devOverrideRate = null;
let devForceVerifyFail = 'NONE';

export function setDevExchangeRate(rate) { devOverrideRate = rate; }
export function setDevForceVerifyFail(mode) { devForceVerifyFail = mode; }

export async function fetchRate() {
  await new Promise((r) => setTimeout(r, 800));
  return devOverrideRate ?? 83.0;
}

export function createOrder(params) {
  const orderId = 'ORD-' + String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();
  const usdtAmount = Math.min(10000, Math.max(10, params.presetUsdt));
  const inrAmount = Math.round(usdtAmount * params.exchangeRate * 100) / 100;
  return {
    orderId, createdAt: now, lastActiveAt: now,
    merchantReturnUrl: params.merchantReturnUrl,
    currency: params.currency, coin: params.coin,
    invoiceStatus: 'DRAFT',
    usdtAmount, inrAmount, exchangeRate: params.exchangeRate, rateLoading: false,
    paymentMethod: null,
    beneficiaries: [...beneficiaries],
    selectedBeneficiaryId: null, selectedBeneficiary: null,
    coolingMinutes: null, coolingEndsAt: null,
    paymentTxId: '', referenceType: null, referenceNumber: '',
    referenceVerified: false, expectedInrAmount: inrAmount,
    verificationErrorCode: null, verificationErrorMessage: null, verificationError: null,
    purchasedUsdt: 0, postPurchaseAction: null, merchantTxId: null,
  };
}

export const ALWAYS_SUCCESS_UTR = 'UTR1234567890';
export const ALWAYS_SUCCESS_BRN = 'BRN1234567890';

export async function verifyReference(params, usedReferences) {
  await new Promise((r) => setTimeout(r, 900));
  const ref = params.referenceNumber.trim().toUpperCase();
  const isValid =
    (params.referenceType === 'UTR' && ref === ALWAYS_SUCCESS_UTR) ||
    (params.referenceType === 'BRN' && ref === ALWAYS_SUCCESS_BRN);
  if (isValid) return { success: true };
  if (devForceVerifyFail === 'FAIL' || devForceVerifyFail === 'USED' || devForceVerifyFail === 'AMOUNT') {
    return {
      success: false,
      errorCode: devForceVerifyFail === 'USED' ? 'ALREADY_USED' : devForceVerifyFail === 'AMOUNT' ? 'AMOUNT_MISMATCH' : 'NOT_FOUND',
      error: params.referenceType === 'BRN' ? 'Incorrect BRN' : 'Incorrect UTR',
    };
  }
  return {
    success: false,
    errorCode: usedReferences.includes(ref) ? 'ALREADY_USED' : 'NOT_FOUND',
    error: params.referenceType === 'BRN' ? 'Incorrect BRN' : 'Incorrect UTR',
  };
}

export async function finalizeSettlement() {
  const delay = 800 + Math.floor(Math.random() * 401);
  await new Promise((r) => setTimeout(r, delay));
}
