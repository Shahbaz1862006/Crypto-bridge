import { openModal, closeModal, showToast } from './modal.js';
import { getState, actions, subscribe } from './store.js';
import { maskReference, formatCoolingLabel, formatReceiptDate, formatReceiptText, downloadReceiptPdf } from './utils.js';

const WITHDRAW_FEE_PERCENT = 30;

function fmtUsdt(n) { return `${Number(n).toFixed(2)} USDT`; }

function buildReceipt(order) {
  const usdt = order.purchasedUsdt || order.usdtAmount;
  const inr = order.inrAmount || order.expectedInrAmount;
  const refMasked = order.referenceNumber ? maskReference(order.referenceNumber) : '—';
  const rows = [
    { label: 'Order ID', value: order.orderId, copy: order.orderId },
    { label: 'Date/Time', value: formatReceiptDate(order.createdAt) },
    { label: 'Payment Method', value: order.paymentMethod === 'UPI' ? 'UPI' : 'IMPS/RTGS/NEFT' },
  ];
  if (order.paymentMethod === 'BANK' && order.selectedBeneficiary) {
    const b = order.selectedBeneficiary;
    rows.push({ label: 'Beneficiary', value: `${b.displayName} • ${b.bankName}`, span: 2 });
    rows.push({ label: 'Account', value: b.accountNumberMasked });
    rows.push({ label: 'IFSC', value: b.ifsc });
  }
  rows.push({ label: 'USDT Purchased', value: `${usdt} USDT` });
  rows.push({ label: 'Exchange Rate', value: `1 USDT = ₹${order.exchangeRate}` });
  rows.push({ label: 'INR Paid', value: `₹${(inr || 0).toLocaleString('en-IN')}` });
  rows.push({ label: 'Reference Type', value: order.referenceType ?? '—' });
  rows.push({ label: 'Reference Number', value: refMasked, copy: order.referenceNumber || undefined });
  rows.push({ label: 'Status', value: 'Verified' });
  rows.push({ label: 'Cooling Period', value: formatCoolingLabel(order.coolingMinutes) });
  rows.push({ label: 'Fee', value: '30% (for wallet withdrawal)', span: 2 });
  return rows;
}

function renderReceipt() {
  const host = document.querySelector('[data-receipt-rows]');
  if (!host) return;
  const order = getState().order;
  const rows = buildReceipt(order);
  host.innerHTML = rows.map((r) => {
    const spanCls = r.span === 2 ? 'sm:col-span-2' : '';
    const copyHtml = r.copy ? ` <button type="button" data-copy="${escapeHtml(r.copy)}" class="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--green)] transition-colors shrink-0" aria-label="Copy"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></button>` : '';
    return `<div class="${spanCls}"><span class="text-[var(--muted)] block mb-0.5">${escapeHtml(r.label)}</span><div class="flex items-center gap-2"><span class="text-[var(--text)] font-medium break-all">${escapeHtml(r.value || '')}</span>${copyHtml}</div></div>`;
  }).join('');
}

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function openSuccessModal() {
  actions.ensureMerchantTxForSuccess();
  const order = getState().order;
  const purchased = order.purchasedUsdt || order.usdtAmount;
  const amtEl = document.querySelector('[data-success-amount]');
  if (amtEl) amtEl.textContent = String(purchased);
  renderReceipt();
  openModal('success-modal');
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof Element)) return;

  if (t.closest('[data-success-send]')) {
    actions.touch();
    closeModal('success-modal');
    window.location.href = `${window.location.origin}/merchant`;
    return;
  }
  if (t.closest('[data-success-withdraw]')) {
    actions.touch();
    const order = getState().order;
    const purchased = order.purchasedUsdt || order.usdtAmount;
    const fee = Math.round(purchased * (WITHDRAW_FEE_PERCENT / 100) * 100) / 100;
    const finalAmt = Math.round((purchased - fee) * 100) / 100;
    const pEl = document.querySelector('[data-withdraw-purchased]');
    const fEl = document.querySelector('[data-withdraw-fee]');
    const finEl = document.querySelector('[data-withdraw-final]');
    if (pEl) pEl.textContent = fmtUsdt(purchased);
    if (fEl) fEl.textContent = '- ' + fmtUsdt(fee);
    if (finEl) finEl.textContent = fmtUsdt(finalAmt);
    openModal('withdraw-modal');
    return;
  }
  if (t.closest('[data-withdraw-confirm]')) {
    actions.touch();
    actions.markSendToWallet();
    closeModal('withdraw-modal');
    window.location.href = 'https://pikeswop.com/';
    return;
  }
  if (t.closest('[data-receipt-copy]')) {
    navigator.clipboard.writeText(formatReceiptText(getState().order)).catch(() => {});
    showToast('copy', 2000);
    return;
  }
  if (t.closest('[data-receipt-pdf]')) {
    downloadReceiptPdf(getState().order);
    showToast('pdf', 3000);
    return;
  }
});

subscribe(() => {
  const modal = document.querySelector('[data-modal="success-modal"]');
  if (modal && !modal.classList.contains('hidden')) renderReceipt();
});
