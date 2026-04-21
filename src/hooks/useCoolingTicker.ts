import { useEffect } from 'react';
import { useBridgeStore } from '../store/bridgeStore';

/**
 * Global cooling ticker - runs every 1s to update PENDING -> PAYMENT_VERIFICATION
 * when cooling ends. Mount at App root so it runs across all pages.
 */
export function useCoolingTicker() {
  const tickCooling = useBridgeStore((s) => s.tickCooling);

  useEffect(() => {
    const interval = setInterval(() => {
      tickCooling();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickCooling]);
}
