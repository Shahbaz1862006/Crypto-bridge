import { actions } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

const RESEND_SECONDS = 50;

const emailSpan = document.querySelector('[data-otp-email]');
const form = document.querySelector('[data-verify-otp-form]');
const input = document.querySelector('[data-otp-input]');
const errEl = document.querySelector('[data-otp-error]');
const helpEl = document.querySelector('[data-otp-help]');
const cdEl = document.querySelector('[data-otp-countdown]');
const resendBtn = document.querySelector('[data-otp-resend]');
const submitBtn = document.querySelector('[data-otp-submit]');

const email = sessionStorage.getItem('fps_verify_email') || '';
if (!email) {
  navigate(ROUTES.BRIDGE.VERIFY_EMAIL, { replace: true });
}
if (emailSpan) emailSpan.textContent = email;

let timer = null;
let remaining = RESEND_SECONDS;

function renderCountdown() {
  if (remaining > 0) {
    cdEl && (cdEl.textContent = `Resend after ${remaining}s`);
    cdEl?.classList.remove('hidden');
    resendBtn?.classList.add('hidden');
  } else {
    cdEl?.classList.add('hidden');
    resendBtn?.classList.remove('hidden');
  }
}

function startTimer() {
  remaining = RESEND_SECONDS;
  renderCountdown();
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) { clearInterval(timer); timer = null; }
    renderCountdown();
  }, 1000);
}
startTimer();

function clearError() {
  errEl?.classList.add('hidden');
  input?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
  input?.classList.add('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
}

function showError(msg) {
  if (errEl) { errEl.textContent = msg; errEl.classList.remove('hidden'); }
  input?.classList.remove('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
  input?.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
}

function syncSubmit() {
  if (!(submitBtn instanceof HTMLButtonElement)) return;
  const v = (input?.value || '').replace(/\D/g, '');
  submitBtn.disabled = v.length !== 6;
}

input?.addEventListener('input', () => {
  if (input instanceof HTMLInputElement) {
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    if (input.value !== digits) input.value = digits;
  }
  clearError();
  syncSubmit();
});

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = (input?.value || '').trim();
  if (!/^\d{6}$/.test(code)) { showError('Enter 6-digit code.'); return; }
  if (code === '123456') { showError('Invalid Code'); return; }
  actions.touch();
  sessionStorage.removeItem('fps_verify_email');
  navigate(ROUTES.BRIDGE.EXPLAIN);
});

resendBtn?.addEventListener('click', () => {
  clearError();
  startTimer();
});

syncSubmit();
