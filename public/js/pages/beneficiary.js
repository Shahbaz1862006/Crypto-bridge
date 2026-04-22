import { actions, getState, subscribe } from '../store.js';
import { ROUTES, navigate } from '../routes.js';
import { SINGLE_BANK_BENEFICIARY } from '../mock-data.js';
import { validateReference, normalizeReference } from '../utils.js';
import { showLoading, hideLoading } from '../loading.js';
import { openSuccessModal } from '../success-modal.js';
import { openFailedModal } from '../failed-modal.js';

const COOLING_OPTIONS = {
  none: 0, '30m': 30, '4h': 240, '6h': 360, '24h': 1440, '48h': 2880,
};

const usdtEl = document.querySelector('[data-ben-usdt]');
const inrEl = document.querySelector('[data-ben-inr]');
const brnWrap = document.querySelector('[data-brn-wrap]');
const brnInput = document.querySelector('[data-brn-input]');
const brnErr = document.querySelector('[data-brn-error]');
const brnConfirm = document.querySelector('[data-brn-confirm]');
const brnLabel = document.querySelector('[data-brn-label]');
const coolingSelect = document.querySelector('[data-cooling-select]');
const continueBtn = document.querySelector('[data-ben-continue]');
const changeMethodBtn = document.querySelector('[data-change-method]');

function renderAmounts() {
  const { usdtAmount, inrAmount, paymentMethod } = getState().order;
  if (usdtEl) usdtEl.textContent = `${usdtAmount} USDT`;
  if (inrEl) inrEl.textContent = `≈ ₹${inrAmount.toLocaleString('en-IN')} INR`;
  const isUPI = paymentMethod === 'UPI';
  if (brnLabel) brnLabel.textContent = isUPI ? 'Enter UTR / TxID' : 'Enter BRN';
  if (brnInput instanceof HTMLInputElement) brnInput.placeholder = isUPI ? 'E.G., 1234567890ABC' : 'E.G., BRN123456789';
}

function syncCooling() {
  if (!(coolingSelect instanceof HTMLSelectElement)) return;
  const v = coolingSelect.value;
  const isNone = v === 'none';
  brnWrap?.classList.toggle('hidden', !isNone);
  if (continueBtn instanceof HTMLButtonElement) {
    continueBtn.disabled = !v || isNone;
    continueBtn.style.display = isNone ? 'none' : '';
  }
}

function syncBrn() {
  if (!(brnInput instanceof HTMLInputElement)) return;
  const v = brnInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 22);
  if (brnInput.value !== v) brnInput.value = v;
  const { paymentMethod } = getState().order;
  const refType = paymentMethod === 'UPI' ? 'UTR' : 'BRN';
  const res = validateReference(v, refType);
  if (brnConfirm instanceof HTMLButtonElement) brnConfirm.disabled = !res.valid;
}

function selectLocalBen() {
  actions.selectBeneficiary({
    id: SINGLE_BANK_BENEFICIARY.id,
    displayName: SINGLE_BANK_BENEFICIARY.displayName,
    bankName: SINGLE_BANK_BENEFICIARY.bankName,
    accountNumberMasked: SINGLE_BANK_BENEFICIARY.accountNumberMasked,
    ifsc: SINGLE_BANK_BENEFICIARY.ifsc,
  });
}

coolingSelect?.addEventListener('change', syncCooling);

continueBtn?.addEventListener('click', () => {
  if (!(coolingSelect instanceof HTMLSelectElement)) return;
  const v = coolingSelect.value;
  if (!v || v === 'none') return;
  const mins = COOLING_OPTIONS[v];
  actions.touch();
  selectLocalBen();
  actions.setCooling(mins);
  navigate(ROUTES.BRIDGE.COOLING);
});

brnInput?.addEventListener('input', () => {
  brnErr?.classList.add('hidden');
  brnInput?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
  brnInput?.classList.add('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
  syncBrn();
});

brnConfirm?.addEventListener('click', async () => {
  if (!(brnInput instanceof HTMLInputElement)) return;
  const { paymentMethod } = getState().order;
  const refType = paymentMethod === 'UPI' ? 'UTR' : 'BRN';
  const res = validateReference(brnInput.value, refType);
  if (!res.valid) return;
  actions.touch();
  selectLocalBen();
  actions.setCoolingNone();
  actions.setReferenceNumber(normalizeReference(brnInput.value));
  showLoading('Wait, payment processing…');
  try {
    const result = await actions.verifyReference();
    if (result.success) {
      openSuccessModal();
    } else {
      if (brnErr) { brnErr.textContent = 'Invalid reference number'; brnErr.classList.remove('hidden'); }
      brnInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
      openFailedModal({
        showChangeMethod: true,
        onChangeMethod: () => {
          actions.patchOrder({ paymentMethod: null });
          navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
        },
      });
    }
  } finally {
    hideLoading();
  }
});

changeMethodBtn?.addEventListener('click', () => {
  actions.patchOrder({ paymentMethod: null });
  navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
});

subscribe(renderAmounts);
renderAmounts();
syncCooling();
syncBrn();
