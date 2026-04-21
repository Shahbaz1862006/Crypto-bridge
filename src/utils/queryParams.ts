import type { QueryParams } from '../store/types';

const DEFAULTS: QueryParams = {
  merchantReturnUrl: 'https://merchant.example.com/deposit/return',
  currency: 'INR',
  coin: 'USDT_TRX',
  presetUsdt: 60,
};

export function parseQueryParams(): QueryParams {
  if (typeof window === 'undefined') return DEFAULTS;
  const params = new URLSearchParams(window.location.search);
  return {
    merchantReturnUrl: params.get('merchantReturnUrl') ?? DEFAULTS.merchantReturnUrl,
    currency: params.get('currency') ?? DEFAULTS.currency,
    coin: params.get('coin') ?? DEFAULTS.coin,
    presetUsdt: Math.min(10000, Math.max(10, parseInt(params.get('presetUsdt') ?? String(DEFAULTS.presetUsdt), 10) || DEFAULTS.presetUsdt)),
  };
}
