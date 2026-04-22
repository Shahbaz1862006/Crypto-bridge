import { getState, actions } from './store.js';
import { ROUTES, navigate } from './routes.js';
import { runBridgeGuard } from './bridge-guard.js';
import './modal.js';
import './copy.js';
import './success-modal.js';
import './failed-modal.js';
import './dev-panel.js';
import './cooling-ticker.js';

// Global session-expiry check on every page load
actions.checkExpiry();
runBridgeGuard();

// Back button wiring (for [data-back-button][data-fallback])
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  const back = t.closest('[data-back-button]');
  if (back) {
    e.preventDefault();
    const fallback = back.getAttribute('data-fallback') || ROUTES.MERCHANT.HOME;
    if (window.history.length > 1) window.history.back();
    else navigate(fallback);
    return;
  }
  const nav = t.closest('[data-nav]');
  if (nav) {
    const url = nav.getAttribute('data-nav');
    if (url) { navigate(url); return; }
  }
});

// Load the right page module based on server-rendered hint
const PAGE_MODULE_MAP = {
  'bridge/verify-email': '/js/pages/verify-email.js',
  'bridge/verify-otp':   '/js/pages/verify-otp.js',
  'bridge/explain':      '/js/pages/explain.js',
  'bridge/payment':      '/js/pages/payment.js',
  'bridge/beneficiary':  '/js/pages/beneficiary.js',
  'bridge/cooling-select':'/js/pages/cooling-select.js',
  'bridge/cooling':      '/js/pages/cooling.js',
  'bridge/verify':       '/js/pages/verify.js',
  'bridge/expired':      '/js/pages/expired.js',
  'merchant/home':       '/js/pages/merchant-home.js',
  'merchant/history':    '/js/pages/merchant-history.js',
};

const page = window.__PAGE__;
const pageSrc = PAGE_MODULE_MAP[page];
if (pageSrc) import(pageSrc).catch((err) => console.error('Page module failed:', err));

// Expose for debug
window.__STATE__ = getState;
