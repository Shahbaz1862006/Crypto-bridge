import { openModal, closeModal } from './modal.js';

export function showLoading(msg) {
  const el = document.querySelector('[data-loading-message]');
  if (el) el.textContent = msg || 'Processing…';
  openModal('loading-overlay');
}
export function hideLoading() { closeModal('loading-overlay'); }
