import { actions, getState, subscribe } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

const params = new URLSearchParams(window.location.search);
const txIdParam = params.get('txId');
const isResumeMode = !!txIdParam;

const banner = document.querySelector('[data-cooling-resume-banner]');
const timerEl = document.querySelector('[data-cooling-timer]');
const activeBox = document.querySelector('[data-cooling-active]');
const doneBox = document.querySelector('[data-cooling-done]');
const toast = document.querySelector('[data-cooling-done-toast]');
const verifyBtn = document.querySelector('[data-cooling-verify]');

if (banner && isResumeMode) banner.classList.remove('hidden');

if (isResumeMode) actions.resumeCoolingFromTx(txIdParam);

function getEffectiveEnds() {
  const s = getState();
  const { coolingEndsAt } = s.order;
  if (coolingEndsAt != null) return coolingEndsAt;
  if (txIdParam) {
    const tx = s.merchantHistory.find((t) => t.id === txIdParam);
    return tx?.coolingEndsAt ?? null;
  }
  return null;
}

function fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

let toastShown = false;

function render() {
  const ends = getEffectiveEnds();
  if (ends == null && !isResumeMode) {
    navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true });
    return;
  }
  if (ends == null) return;
  const now = Date.now();
  const passed = now >= ends;
  if (!passed) {
    activeBox?.classList.remove('hidden');
    doneBox?.classList.add('hidden');
    if (timerEl) timerEl.textContent = fmtTime(ends - now);
  } else {
    activeBox?.classList.add('hidden');
    doneBox?.classList.remove('hidden');
    const { invoiceStatus } = getState().order;
    if (!toastShown && invoiceStatus === 'READY_FOR_VERIFICATION' && toast) {
      toast.classList.remove('hidden');
      toastShown = true;
      setTimeout(() => toast.classList.add('hidden'), 5000);
    }
  }
}

subscribe(render);
render();
setInterval(render, 1000);

document.querySelectorAll('[data-cooling-goto-merchant]').forEach((btn) => {
  btn.addEventListener('click', () => {
    actions.touch();
    navigate(ROUTES.MERCHANT.HISTORY);
  });
});

verifyBtn?.addEventListener('click', () => {
  actions.touch();
  navigate(ROUTES.BRIDGE.VERIFY);
});
