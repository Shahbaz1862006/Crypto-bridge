import { getState, actions } from './store.js';
import { ROUTES, navigate } from './routes.js';
import { routeGuards } from './utils.js';

export function runBridgeGuard() {
  const path = window.location.pathname;
  const { order } = getState();
  const { invoiceStatus, paymentMethod, selectedBeneficiary } = order;

  if (path === ROUTES.BRIDGE.EXPIRED) return;
  if (invoiceStatus === 'EXPIRED') { navigate(ROUTES.BRIDGE.EXPIRED, { replace: true }); return; }

  if (path === ROUTES.BRIDGE.VERIFY_EMAIL) return;
  if (path === ROUTES.BRIDGE.VERIFY_OTP) return;
  if (path === ROUTES.BRIDGE.EXPLAIN) return;

  if (path === ROUTES.BRIDGE.PAYMENT && !routeGuards.canAccessPayment(invoiceStatus)) {
    navigate(ROUTES.BRIDGE.EXPLAIN, { replace: true }); return;
  }
  if (path === ROUTES.BRIDGE.BENEFICIARY && !routeGuards.canAccessBeneficiary(paymentMethod)) {
    navigate(ROUTES.BRIDGE.PAYMENT, { replace: true }); return;
  }
  if (path === ROUTES.BRIDGE.COOLING_SELECT && !routeGuards.canAccessCoolingSelect(selectedBeneficiary)) {
    navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true }); return;
  }
  if (path === ROUTES.BRIDGE.COOLING && !routeGuards.canAccessCooling(selectedBeneficiary, invoiceStatus)) {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('txId')) { navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true }); return; }
  }
  if (path === ROUTES.BRIDGE.VERIFY && !routeGuards.canAccessVerify(invoiceStatus)) {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('txId')) { navigate(ROUTES.MERCHANT.HISTORY, { replace: true }); return; }
  }
}
