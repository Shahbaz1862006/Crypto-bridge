import { actions } from '../store.js';
import { ROUTES, navigate } from '../routes.js';

document.querySelector('[data-expired-restart]')?.addEventListener('click', () => {
  actions.reset();
  navigate(ROUTES.BRIDGE.EXPLAIN);
});
