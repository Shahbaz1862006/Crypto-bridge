/**
 * Centralized route paths for the application.
 * Use these constants for navigation to avoid typos and enable refactoring.
 */
export const ROUTES = {
  ROOT: '/',
  BRIDGE: {
    BASE: '/bridge',
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
    BASE: '/merchant',
    HISTORY: '/merchant/history',
  },
} as const;

/** Build cooling URL with txId for resume mode */
export function coolingUrl(txId: string): string {
  return `${ROUTES.BRIDGE.COOLING}?txId=${encodeURIComponent(txId)}`;
}

/** Build verify URL with txId */
export function verifyUrl(txId: string): string {
  return `${ROUTES.BRIDGE.VERIFY}?txId=${encodeURIComponent(txId)}`;
}
