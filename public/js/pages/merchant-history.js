import { actions, getState, subscribe } from '../store.js';
import { ROUTES, navigate, coolingUrl, verifyUrl } from '../routes.js';
import { maskAccount } from '../utils.js';
import { openModal, closeModal } from '../modal.js';

const tbody = document.querySelector('[data-history-body]');
const depositBtn = document.querySelector('[data-deposit-cta]');

depositBtn?.addEventListener('click', () => {
  actions.resetBridgeFlow({ preserveHistory: true });
  navigate(ROUTES.BRIDGE.VERIFY_EMAIL, { replace: true });
});

actions.seedMerchantHistoryIfEmpty();

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function statusBadge(status) {
  const text = status === 'PAYMENT_VERIFICATION' ? 'Payment Verification' : status;
  const map = {
    SUCCESSFUL: 'bg-[var(--success-bg)] text-[var(--success-text)]',
    FAILED: 'bg-[var(--failed-bg)] text-[var(--failed-text)]',
    PAYMENT_VERIFICATION: 'bg-[var(--verify-bg)] text-[var(--verify-text)]',
    PENDING: 'bg-[var(--pending-bg)] text-[var(--pending-text)]',
  };
  const cls = map[status] || map.PENDING;
  return `<span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}">${escapeHtml(text)}</span>`;
}

function coolingText(tx, now) {
  if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
    const ms = tx.coolingEndsAt - now;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return '—';
}

function render() {
  if (!tbody) return;
  const { merchantHistory } = getState();
  const now = Date.now();
  if (merchantHistory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-[var(--muted)]">No transactions yet.</td></tr>`;
    return;
  }
  const rows = merchantHistory.map((tx) => {
    const amountColor = tx.amountUsdt >= 0 ? 'text-[var(--green)]' : 'text-red-500';
    const amountPrefix = tx.amountUsdt >= 0 ? '+' : '';
    const inrVal = (tx.amountUsdt * 83).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const method = tx.beneficiary ? 'IMPS/NEFT' : 'UPI';
    let actionsHtml = '';
    if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
      actionsHtml = `<button type="button" data-resume-cooling="${escapeHtml(tx.id)}" class="text-[var(--green)] text-sm font-medium hover:underline">Resume</button>`;
    } else if (tx.status === 'PAYMENT_VERIFICATION') {
      actionsHtml = `<button type="button" data-go-verify="${escapeHtml(tx.id)}" class="text-[var(--green)] text-sm font-medium hover:underline">Verify</button>`;
    } else {
      actionsHtml = `<button type="button" data-show-detail="${escapeHtml(tx.id)}" class="text-[var(--muted)] text-sm hover:text-[var(--text)]">View</button>`;
    }
    return `<tr data-row="${escapeHtml(tx.id)}" class="hover:bg-gray-50 cursor-pointer">
      <td class="px-4 py-3 text-[var(--text)] text-sm">${escapeHtml(tx.dateTime)}</td>
      <td class="px-4 py-3 text-[var(--text)] text-sm">${escapeHtml(method)}</td>
      <td class="px-4 py-3 text-sm font-medium ${amountColor} text-right">${amountPrefix}${tx.amountUsdt}</td>
      <td class="px-4 py-3 text-[var(--text)] text-sm text-right">₹${inrVal}</td>
      <td class="px-4 py-3">${statusBadge(tx.status)}</td>
      <td class="px-4 py-3 text-[var(--muted)] text-sm">${coolingText(tx, now)}</td>
      <td class="px-4 py-3 text-[var(--muted)] text-sm font-mono">${escapeHtml(tx.reference || '—')}</td>
      <td class="px-4 py-3 text-right">${actionsHtml}</td>
    </tr>`;
  });
  tbody.innerHTML = rows.join('');
}

function findTx(id) {
  return getState().merchantHistory.find((t) => t.id === id);
}

function showDetail(tx) {
  const body = document.querySelector('[data-detail-body]');
  const title = document.querySelector('[data-detail-title]');
  if (!body || !title) return;
  title.textContent = tx.status === 'FAILED' ? 'Failure Details' : 'Transaction Details';
  const amountColor = tx.amountUsdt >= 0 ? 'text-[var(--green)]' : 'text-red-500';
  const amountPrefix = tx.amountUsdt >= 0 ? '+' : '';
  body.innerHTML = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p class="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Date/Time</p><p class="text-[var(--text)]">${escapeHtml(tx.dateTime)}</p></div>
        <div><p class="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Status</p>${statusBadge(tx.status)}</div>
        <div><p class="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Amount</p><p class="font-medium ${amountColor}">${amountPrefix}${tx.amountUsdt} USDT</p></div>
        <div class="sm:col-span-2"><p class="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Description</p><p class="text-[var(--text)]">${escapeHtml(tx.description)}</p></div>
        ${tx.status === 'FAILED' && tx.failureReason ? `<div class="sm:col-span-2"><p class="text-[var(--muted)] text-xs uppercase tracking-wider mb-1">Failure reason</p><p class="text-red-500">${escapeHtml(tx.failureReason)}</p></div>` : ''}
      </div>
      <h3 class="text-xl font-semibold text-[var(--text)] mt-8">Beneficiary Details</h3>
      <div class="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><div class="text-xs tracking-widest uppercase text-[var(--muted)]">Beneficiary Name</div><div class="mt-2 text-lg text-[var(--text)]">${escapeHtml(tx.beneficiary?.beneficiaryName ?? '—')}</div></div>
          <div><div class="text-xs tracking-widest uppercase text-[var(--muted)]">Bank Name</div><div class="mt-2 text-lg text-[var(--text)]">${escapeHtml(tx.beneficiary?.bankName ?? '—')}</div></div>
          <div><div class="text-xs tracking-widest uppercase text-[var(--muted)]">Account (Masked)</div><div class="mt-2 text-lg text-[var(--text)] font-mono">${escapeHtml(maskAccount(tx.beneficiary?.accountNumberMasked))}</div></div>
          <div><div class="text-xs tracking-widest uppercase text-[var(--muted)]">IFSC</div><div class="mt-2 text-lg text-[var(--text)] font-mono">${escapeHtml(tx.beneficiary?.ifsc ?? '—')}</div></div>
        </div>
      </div>
      <button type="button" data-modal-close class="min-h-[44px] px-6 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-gray-100">Close</button>
    </div>
  `;
  openModal('detail-modal');
}

function resumeCooling(id) {
  const tx = findTx(id);
  if (!tx) return;
  const now = Date.now();
  if (tx.coolingEndsAt != null && now < tx.coolingEndsAt) {
    actions.ensureTxInHistory(tx);
    if (actions.resumeCoolingFromTx(id)) navigate(coolingUrl(id));
  }
}

function goVerify(id) {
  const tx = findTx(id);
  if (!tx) return;
  actions.ensureTxInHistory(tx);
  actions.setMerchantTxId(id);
  const rate = getState().order.exchangeRate || 83;
  actions.patchOrder({
    paymentTxId: '',
    referenceType: tx.beneficiary ? 'BRN' : 'UTR',
    referenceNumber: '',
    expectedInrAmount: Math.round(tx.amountUsdt * rate * 100) / 100,
    invoiceStatus: 'READY_FOR_VERIFICATION',
    usdtAmount: tx.amountUsdt,
    inrAmount: Math.round(tx.amountUsdt * rate * 100) / 100,
  });
  navigate(verifyUrl(id));
}

tbody?.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  const resume = t.closest('[data-resume-cooling]');
  if (resume) { e.stopPropagation(); actions.touch(); resumeCooling(resume.getAttribute('data-resume-cooling')); return; }
  const ver = t.closest('[data-go-verify]');
  if (ver) { e.stopPropagation(); actions.touch(); goVerify(ver.getAttribute('data-go-verify')); return; }
  const det = t.closest('[data-show-detail]');
  if (det) {
    const tx = findTx(det.getAttribute('data-show-detail'));
    if (tx) showDetail(tx);
    return;
  }
  const row = t.closest('[data-row]');
  if (row) {
    const id = row.getAttribute('data-row');
    const tx = findTx(id);
    if (!tx) return;
    actions.touch();
    const now = Date.now();
    if (tx.status === 'PENDING' && tx.coolingEndsAt != null && now < tx.coolingEndsAt) { resumeCooling(id); return; }
    if (tx.status === 'PAYMENT_VERIFICATION') { goVerify(id); return; }
    if (tx.status === 'FAILED' || tx.status === 'SUCCESSFUL') { showDetail(tx); }
  }
});

subscribe(render);
render();

setInterval(() => { actions.tickCooling(); render(); }, 10000);
window.addEventListener('focus', () => { actions.tickCooling(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') actions.tickCooling();
});
