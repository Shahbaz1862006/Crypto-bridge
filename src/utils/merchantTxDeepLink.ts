import type { MerchantTx } from '../store/types';
import { coolingUrl, verifyUrl } from '../routes/paths';

/**
 * Compute deepLinkRoute and deepLinkEnabled for a merchant transaction.
 * Used for row click behavior in Transaction History.
 */
export function getTxDeepLink(
  tx: MerchantTx,
  now: number = Date.now()
): { deepLinkRoute: string; deepLinkEnabled: boolean } {
  // PENDING with cooling still active → navigate to cooling
  if (
    tx.status === 'PENDING' &&
    tx.coolingEndsAt != null &&
    now < tx.coolingEndsAt
  ) {
    return {
      deepLinkRoute: coolingUrl(tx.id),
      deepLinkEnabled: true,
    };
  }
  // PAYMENT_VERIFICATION → navigate to verify
  if (tx.status === 'PAYMENT_VERIFICATION') {
    return {
      deepLinkRoute: verifyUrl(tx.id),
      deepLinkEnabled: true,
    };
  }
  // SUCCESSFUL / FAILED → open details modal (no route)
  return {
    deepLinkRoute: '',
    deepLinkEnabled: false,
  };
}
