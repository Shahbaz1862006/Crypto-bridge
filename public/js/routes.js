export const ROUTES = {
  ROOT: '/',
  BRIDGE: {
    VERIFY_EMAIL: '/bridge/verify-email',
    VERIFY_OTP: '/bridge/verify-otp',
    EXPLAIN: '/bridge/explain',
    PAYMENT: '/bridge/payment',
    BENEFICIARY: '/bridge/beneficiary',
    COOLING_SELECT: '/bridge/cooling-select',
    COOLING: '/bridge/cooling',
    VERIFY: '/bridge/verify',
    SUCCESS: '/bridge/success',
    EXPIRED: '/bridge/expired',
  },
  MERCHANT: {
    HOME: '/merchant',
    HISTORY: '/merchant/history',
  },
};

export function coolingUrl(txId) {
  return `${ROUTES.BRIDGE.COOLING}?txId=${encodeURIComponent(txId)}`;
}

export function verifyUrl(txId) {
  return `${ROUTES.BRIDGE.VERIFY}?txId=${encodeURIComponent(txId)}`;
}

export function navigate(url, { replace = false } = {}) {
  if (replace) window.location.replace(url);
  else window.location.href = url;
}
