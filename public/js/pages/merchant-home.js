import { actions } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

document.querySelector('[data-deposit-cta]')?.addEventListener('click', () => {
  actions.resetBridgeFlow({ preserveHistory: true });
  navigate(ROUTES.BRIDGE.VERIFY_EMAIL, { replace: true });
});
