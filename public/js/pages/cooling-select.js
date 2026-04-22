import { actions } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

document.querySelector('[data-cooling-none]')?.addEventListener('click', () => {
  actions.touch();
  actions.setCoolingNone();
  navigate(ROUTES.BRIDGE.VERIFY);
});

document.querySelectorAll('[data-cooling-mins]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mins = parseInt(btn.getAttribute('data-cooling-mins') || '0', 10);
    if (!mins) return;
    actions.touch();
    actions.setCooling(mins);
    navigate(ROUTES.BRIDGE.COOLING);
  });
});
