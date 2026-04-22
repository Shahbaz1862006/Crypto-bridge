import { actions, getState } from '../store.js';
import { ROUTES, navigate } from '../routes.js';
import { parseQueryParams } from '../utils.js';
import { showLoading, hideLoading } from '../loading.js';

const continueBtn = document.querySelector('[data-explain-continue]');
const cancelBtn = document.querySelector('[data-explain-cancel]');

continueBtn?.addEventListener('click', async () => {
  showLoading();
  try {
    const state = getState();
    if (!state.order.orderId) {
      const params = parseQueryParams();
      await actions.createOrder(params);
    } else {
      actions.touch();
    }
    navigate(ROUTES.BRIDGE.PAYMENT);
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
});

cancelBtn?.addEventListener('click', () => {
  actions.resetBridgeFlow({ preserveHistory: true });
  navigate(ROUTES.MERCHANT.HOME, { replace: true });
});
