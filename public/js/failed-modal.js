import { openModal, closeModal } from './modal.js';
import { ROUTES, navigate } from './routes.js';

let onRetry = null;
let onChangeMethod = null;
let showChangeMethodBtn = true;

export function openFailedModal(opts = {}) {
  onRetry = opts.onTryAgain || null;
  onChangeMethod = opts.onChangeMethod || null;
  showChangeMethodBtn = opts.showChangeMethod !== false;
  const changeBtn = document.querySelector('[data-failed-change-method]');
  if (changeBtn) changeBtn.classList.toggle('hidden', !showChangeMethodBtn);
  openModal('failed-modal');
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (t.closest('[data-failed-retry]')) {
    if (typeof onRetry === 'function') onRetry();
    closeModal('failed-modal');
    return;
  }
  if (t.closest('[data-failed-change-method]')) {
    closeModal('failed-modal');
    if (typeof onChangeMethod === 'function') onChangeMethod();
    else navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
  }
});
