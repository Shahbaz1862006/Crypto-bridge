import { actions, getState, subscribe } from '../store.js';
import { ROUTES, navigate } from '../routes.js';
import { validateReference, normalizeReference } from '../utils.js';
import { openSuccessModal } from '../success-modal.js';
import { openFailedModal } from '../failed-modal.js';

const params = new URLSearchParams(window.location.search);
const txIdParam = params.get('txId');

const usdtEl = document.querySelector('[data-verify-usdt]');
const inrEl = document.querySelector('[data-verify-inr]');
const benWrap = document.querySelector('[data-verify-ben-wrap]');
const benName = document.querySelector('[data-verify-ben-name]');
const coolingBadge = document.querySelector('[data-verify-cooling-badge]');
const form = document.querySelector('[data-verify-form]');
const input = document.querySelector('[data-verify-input]');
const label = document.querySelector('[data-verify-label]');
const errEl = document.querySelector('[data-verify-error]');
const submitBtn = document.querySelector('[data-verify-submit]');
const retryBtn = document.querySelector('[data-verify-retry]');
const processing = document.querySelector('[data-verify-processing]');

if (txIdParam) {
  const s = getState();
  if (!s.order.merchantTxId) {
    const tx = s.merchantHistory.find((t) => t.id === txIdParam);
    if (tx && (tx.status === 'PAYMENT_VERIFICATION' || tx.status === 'PENDING')) {
      actions.setMerchantTxId(tx.id);
      actions.patchOrder({
        invoiceStatus: 'READY_FOR_VERIFICATION',
        usdtAmount: tx.amountUsdt,
        inrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
        expectedInrAmount: Math.round(tx.amountUsdt * (s.order.exchangeRate || 83) * 100) / 100,
        referenceType: tx.beneficiary ? 'BRN' : 'UTR',
        referenceNumber: '',
      });
    }
  }
}

function getRefType() {
  const { referenceType, paymentMethod } = getState().order;
  return referenceType ?? (paymentMethod === 'UPI' ? 'UTR' : paymentMethod === 'BANK' ? 'BRN' : null);
}

(function ensureRefType() {
  const { referenceType } = getState().order;
  if (!referenceType) {
    const r = getRefType();
    if (r) actions.patchOrder({ referenceType: r });
  }
})();

function render() {
  const o = getState().order;
  const refType = getRefType();
  if (usdtEl) usdtEl.textContent = `${o.usdtAmount} USDT`;
  if (inrEl) inrEl.textContent = `₹${(o.expectedInrAmount || o.inrAmount).toLocaleString('en-IN')}`;
  if (o.selectedBeneficiary) {
    benWrap?.classList.remove('hidden');
    if (benName) benName.textContent = o.selectedBeneficiary.displayName;
  } else {
    benWrap?.classList.add('hidden');
  }
  const usedCooling = o.coolingEndsAt != null && Date.now() >= o.coolingEndsAt;
  coolingBadge?.classList.toggle('hidden', !usedCooling);
  if (label) {
    label.textContent = refType === 'BRN' ? 'BRN (Bank Reference Number)' : 'UTR (UPI Transaction Reference)';
  }
  if (input instanceof HTMLInputElement) {
    input.placeholder = refType === 'BRN' ? 'Enter BRN' : 'Enter UTR';
    if (input.value !== (o.referenceNumber || '')) input.value = o.referenceNumber || '';
  }
  const validation = refType ? validateReference(o.referenceNumber || '', refType) : { valid: false };
  if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = !validation.valid;
  const err = o.verificationErrorMessage;
  if (err) {
    if (errEl) { errEl.textContent = err; errEl.classList.remove('hidden'); }
    retryBtn?.classList.remove('hidden');
    submitBtn?.classList.add('hidden');
  } else {
    errEl?.classList.add('hidden');
    retryBtn?.classList.add('hidden');
    submitBtn?.classList.remove('hidden');
  }
  processing?.classList.toggle('hidden', o.invoiceStatus !== 'VERIFYING');
}

input?.addEventListener('input', () => {
  if (input instanceof HTMLInputElement) {
    actions.setReferenceNumber(input.value);
  }
});

input?.addEventListener('blur', () => {
  if (input instanceof HTMLInputElement) {
    const v = input.value.trim().toUpperCase();
    if (v !== input.value) actions.setReferenceNumber(v);
  }
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const refType = getRefType();
  if (!refType) return;
  const o = getState().order;
  const validation = validateReference(o.referenceNumber || '', refType);
  if (!validation.valid) return;
  actions.touch();
  actions.patchOrder({ referenceNumber: normalizeReference(o.referenceNumber) });
  const result = await actions.verifyReference();
  if (result.success) {
    openSuccessModal();
  } else {
    openFailedModal({
      showChangeMethod: true,
      onTryAgain: () => actions.patchOrder({ verificationErrorMessage: null, verificationErrorCode: null }),
      onChangeMethod: () => navigate(ROUTES.BRIDGE.PAYMENT, { replace: true }),
    });
  }
});

retryBtn?.addEventListener('click', () => {
  actions.patchOrder({ verificationErrorMessage: null, verificationErrorCode: null });
});

subscribe(render);
render();
