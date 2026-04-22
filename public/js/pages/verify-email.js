import { actions } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = document.querySelector('[data-verify-email-form]');
const input = document.querySelector('[data-email-input]');
const error = document.querySelector('[data-email-error]');
const cancelBtn = document.querySelector('[data-verify-email-cancel]');

const stored = sessionStorage.getItem('fps_verify_email');
if (stored && input) input.value = stored;

function clearError() {
  error?.classList.add('hidden');
  input?.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
  input?.classList.add('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
}

function showError() {
  error?.classList.remove('hidden');
  input?.classList.remove('border-[var(--border)]', 'focus:border-[var(--green)]', 'focus:ring-[var(--focus)]');
  input?.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-100');
}

input?.addEventListener('input', clearError);

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = (input?.value || '').trim();
  if (!EMAIL_REGEX.test(value)) { showError(); return; }
  sessionStorage.setItem('fps_verify_email', value);
  actions.touch();
  navigate(ROUTES.BRIDGE.VERIFY_OTP);
});

cancelBtn?.addEventListener('click', () => {
  actions.resetBridgeFlow({ preserveHistory: true });
  sessionStorage.removeItem('fps_verify_email');
  navigate(ROUTES.MERCHANT.HOME, { replace: true });
});
