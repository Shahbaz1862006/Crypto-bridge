import { getState, actions, subscribe } from './store.js';
import { ROUTES, navigate } from './routes.js';

const toggle = document.querySelector('[data-devpanel-toggle]');
const panel = document.querySelector('[data-devpanel]');
if (toggle && panel) {
  toggle.addEventListener('click', () => panel.classList.toggle('hidden'));
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;

  if (t.closest('[data-dev-reset]')) {
    actions.reset();
    navigate(ROUTES.BRIDGE.EXPLAIN);
    return;
  }
  if (t.closest('[data-dev-reset-refs]')) { actions.resetUsedReferences(); return; }
  if (t.closest('[data-dev-reset-history]')) { actions.resetHistoryToDefaults(); return; }
  if (t.closest('[data-dev-expire]')) {
    const s = getState();
    actions.patchOrder({ lastActiveAt: Date.now() - (4 * 60 * 60 * 1000 + 1000) });
    actions.checkExpiry();
    navigate(ROUTES.BRIDGE.EXPIRED, { replace: true });
    return;
  }
  const add = t.closest('[data-dev-add]');
  if (add) {
    const kind = add.getAttribute('data-dev-add');
    if (kind === 'ok') actions.addMockSuccessfulTx();
    else if (kind === 'fail') actions.addMockFailedTx();
    else actions.addMockPendingTx();
    return;
  }
  if (t.closest('[data-dev-force-cooling-latest]')) {
    const s = getState();
    const latest = s.merchantHistory.find((x) => x.status === 'PENDING');
    if (latest) actions.forceCoolingEnd(latest.id);
    return;
  }
  const mode = t.closest('[data-dev-verify-mode]');
  if (mode) {
    actions.setDevForceVerifyFail(mode.getAttribute('data-dev-verify-mode'));
    return;
  }
  if (t.closest('[data-dev-cooling-end-now]')) {
    const s = getState();
    actions.setDevForceCoolingEndNow(!s.dev.forceCoolingEndNow);
    return;
  }
  const ref = t.closest('[data-dev-ref]');
  if (ref) { actions.setReferenceNumber(ref.getAttribute('data-dev-ref')); return; }
  const benTrue = t.closest('[data-dev-ben-cooling-true]');
  if (benTrue) {
    const s = getState();
    if (s.order.selectedBeneficiary) actions.setBeneficiaryHasCooling(s.order.selectedBeneficiary.id, true);
    return;
  }
  const benFalse = t.closest('[data-dev-ben-cooling-false]');
  if (benFalse) {
    const s = getState();
    if (s.order.selectedBeneficiary) actions.setBeneficiaryHasCooling(s.order.selectedBeneficiary.id, false);
    return;
  }
});

const rateInput = document.querySelector('[data-dev-rate]');
if (rateInput) {
  rateInput.addEventListener('blur', (e) => {
    const v = parseFloat(e.target.value);
    actions.setDevRate(isNaN(v) ? null : v);
  });
}

function syncUi(state) {
  const { order, dev, merchantHistory } = state;
  for (const btn of document.querySelectorAll('[data-dev-verify-mode]')) {
    const m = btn.getAttribute('data-dev-verify-mode');
    btn.className = (dev.forceVerifyFailMode === m
      ? 'px-2 py-1 rounded text-xs bg-amber-600 text-white'
      : 'px-2 py-1 rounded text-xs bg-gray-200 text-[var(--muted)] hover:bg-gray-300');
  }
  const endNow = document.querySelector('[data-dev-cooling-end-now]');
  if (endNow) {
    endNow.className = dev.forceCoolingEndNow
      ? 'px-2 py-1 rounded text-xs bg-amber-600 text-white'
      : 'px-2 py-1 rounded text-xs bg-gray-200 text-[var(--muted)]';
    endNow.textContent = dev.forceCoolingEndNow ? 'ON (1s cooling)' : 'OFF';
  }
  const benWrap = document.querySelector('[data-dev-ben-cooling]');
  if (benWrap) benWrap.classList.toggle('hidden', !order.selectedBeneficiary);
  const bt = document.querySelector('[data-dev-ben-cooling-true]');
  const bf = document.querySelector('[data-dev-ben-cooling-false]');
  if (bt) bt.className = (order.selectedBeneficiary?.hasCooling
    ? 'px-2 py-1 rounded text-xs bg-amber-600 text-white'
    : 'px-2 py-1 rounded text-xs bg-gray-200 text-[var(--muted)]');
  if (bf) bf.className = (!order.selectedBeneficiary?.hasCooling
    ? 'px-2 py-1 rounded text-xs bg-[var(--green)] text-white'
    : 'px-2 py-1 rounded text-xs bg-gray-200 text-[var(--muted)]');
  const fcwrap = document.querySelector('[data-dev-force-cooling-wrap]');
  const latestPending = merchantHistory.find((t) => t.status === 'PENDING');
  if (fcwrap) fcwrap.classList.toggle('hidden', !latestPending);
  const orderLine = document.querySelector('[data-dev-order]');
  if (orderLine) {
    if (order.orderId) { orderLine.classList.remove('hidden'); orderLine.textContent = 'Order: ' + order.orderId; }
    else orderLine.classList.add('hidden');
  }
}

syncUi(getState());
subscribe(syncUi);
