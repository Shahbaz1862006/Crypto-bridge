const OPEN_STACK = [];

function getEl(id) {
  return document.querySelector(`[data-modal="${id}"]`);
}

export function openModal(id) {
  const el = getEl(id);
  if (!el) return;
  el.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  OPEN_STACK.push(id);
}

export function closeModal(id) {
  const el = getEl(id);
  if (!el) return;
  el.classList.add('hidden');
  const idx = OPEN_STACK.lastIndexOf(id);
  if (idx >= 0) OPEN_STACK.splice(idx, 1);
  if (OPEN_STACK.length === 0) document.body.style.overflow = '';
}

export function closeTop() {
  if (OPEN_STACK.length) closeModal(OPEN_STACK[OPEN_STACK.length - 1]);
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTop(); });

document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const closeBtn = target.closest('[data-modal-close]');
  if (closeBtn) {
    const host = closeBtn.closest('[data-modal]');
    if (host) closeModal(host.getAttribute('data-modal'));
    return;
  }
  const modal = target.closest('[data-modal]');
  if (modal && target === modal) {
    closeModal(modal.getAttribute('data-modal'));
  }
});

export function showToast(name, durationMs = 2000) {
  const el = document.querySelector(`[data-toast="${name}"]`);
  if (!el) return;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), durationMs);
}
