// Any element with [data-copy="TEXT"] becomes a copy trigger.
document.addEventListener('click', async (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  const btn = t.closest('[data-copy]');
  if (!btn) return;
  const text = btn.getAttribute('data-copy');
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const label = btn.querySelector('[data-copy-label]');
    const original = label ? label.textContent : null;
    if (label) { label.textContent = 'Copied'; }
    btn.classList.add('text-[var(--green)]');
    setTimeout(() => {
      if (label && original != null) label.textContent = original;
      btn.classList.remove('text-[var(--green)]');
    }, 1500);
  } catch { /* noop */ }
});
