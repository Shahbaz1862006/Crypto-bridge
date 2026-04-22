import { actions, getState, subscribe } from '../store.js';
import { ROUTES, navigate } from '../routes.js';
import { validateReference, normalizeReference } from '../utils.js';
import { showLoading, hideLoading } from '../loading.js';
import { openSuccessModal } from '../success-modal.js';
import { openFailedModal } from '../failed-modal.js';

const FIXED_USDT = 60;
const FIXED_INR = FIXED_USDT * 83;

const selectView = document.querySelector('[data-payment-select]');
const upiView = document.querySelector('[data-payment-upi]');
const upiBtn = document.querySelector('[data-pay-upi]');
const bankBtn = document.querySelector('[data-pay-bank]');
const qrEl = document.querySelector('[data-upi-qr]');
const utrInput = document.querySelector('[data-utr-input]');
const utrErr = document.querySelector('[data-utr-error]');
const utrConfirm = document.querySelector('[data-utr-confirm]');
const changeMethodBtn = document.querySelector('[data-change-method]');

let qrRendered = false;
const UPI_URI = `upi://pay?pa=rapidogate@hdfc&pn=Rapido%20Gate%20Collections&am=${FIXED_INR.toFixed(2)}&cu=INR`;

function renderQrFallbackImg() {
  if (!qrEl) return;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(UPI_URI)}`;
  qrEl.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'UPI QR code';
  img.width = 320;
  img.height = 320;
  img.className = 'block';
  qrEl.appendChild(img);
  qrRendered = true;
}

function renderQrWithLib() {
  if (!qrEl || !window.QRCode) return false;
  try {
    window.QRCode.toDataURL(UPI_URI, { width: 320, margin: 1, errorCorrectionLevel: 'M' }, (err, url) => {
      if (err || !url) { renderQrFallbackImg(); return; }
      qrEl.innerHTML = '';
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'UPI QR code';
      img.width = 320;
      img.height = 320;
      img.className = 'block';
      qrEl.appendChild(img);
      qrRendered = true;
    });
    return true;
  } catch {
    return false;
  }
}

function ensureQr({ attempts = 20, delay = 100 } = {}) {
  if (qrRendered || !qrEl) return;
  if (renderQrWithLib()) return;
  if (attempts <= 0) { renderQrFallbackImg(); return; }
  setTimeout(() => ensureQr({ attempts: attempts - 1, delay }), delay);
}

function renderView() {
  const { paymentMethod } = getState().order;
  if (paymentMethod === 'UPI') {
    selectView?.classList.add('hidden');
    upiView?.classList.remove('hidden');
    ensureQr();
  } else {
    selectView?.classList.remove('hidden');
    upiView?.classList.add('hidden');
  }
}

subscribe(renderView);
renderView();

upiBtn?.addEventListener('click', () => {
  actions.touch();
  actions.selectUPI();
});

bankBtn?.addEventListener('click', () => {
  actions.touch();
  actions.selectBANK();
  navigate(ROUTES.BRIDGE.BENEFICIARY);
});

changeMethodBtn?.addEventListener('click', () => {
  actions.touch();
  actions.patchOrder({ paymentMethod: null });
});

function syncUtr() {
  if (!(utrInput instanceof HTMLInputElement)) return;
  const v = utrInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 22);
  if (utrInput.value !== v) utrInput.value = v;
  const res = validateReference(v, 'UTR');
  if (utrConfirm instanceof HTMLButtonElement) utrConfirm.disabled = !res.valid;
}

utrInput?.addEventListener('input', () => {
  utrErr?.classList.add('hidden');
  utrInput?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
  utrInput?.classList.add('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
  syncUtr();
});

utrConfirm?.addEventListener('click', async () => {
  if (!(utrInput instanceof HTMLInputElement)) return;
  const res = validateReference(utrInput.value, 'UTR');
  if (!res.valid) return;
  actions.touch();
  const normalized = normalizeReference(utrInput.value);
  actions.patchOrder({
    referenceNumber: normalized,
    referenceType: 'UTR',
    expectedInrAmount: getState().order.inrAmount,
  });
  showLoading('Wait, payment processing…');
  try {
    const result = await actions.verifyReference();
    if (result.success) {
      openSuccessModal();
    } else {
      if (utrErr) { utrErr.textContent = 'Invalid reference number'; utrErr.classList.remove('hidden'); }
      utrInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
      openFailedModal({
        showChangeMethod: true,
        onChangeMethod: () => actions.patchOrder({ paymentMethod: null }),
      });
    }
  } finally {
    hideLoading();
  }
});

syncUtr();
