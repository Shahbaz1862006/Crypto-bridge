import type { Beneficiary } from '../store/types';
import type { MerchantTx, BeneficiaryDetails } from '../store/types';

const MOCK_BENEFICIARY: BeneficiaryDetails = {
  beneficiaryName: 'Merchant Beneficiary - HDFC',
  bankName: 'HDFC Bank',
  accountNumberMasked: 'XXXXXX9012',
  ifsc: 'HDFC0001234',
};

const MOCK_BENEFICIARY_2: BeneficiaryDetails = {
  beneficiaryName: 'Merchant Beneficiary - ICICI',
  bankName: 'ICICI Bank',
  accountNumberMasked: 'XXXXXX1098',
  ifsc: 'ICIC0005678',
};

const MOCK_BENEFICIARY_3: BeneficiaryDetails = {
  beneficiaryName: 'Merchant Beneficiary - SBI',
  bankName: 'SBI',
  accountNumberMasked: 'XXXXXX7788',
  ifsc: 'SBIN0004321',
};

export const DEFAULT_EXCHANGE_RATE = 83.0;

export const beneficiaries: Beneficiary[] = [
  {
    id: 'BEN-001',
    displayName: 'Merchant Beneficiary - HDFC',
    bankName: 'HDFC Bank',
    accountNumberMasked: 'XXXXXX9012',
    ifsc: 'HDFC0001234',
  },
  {
    id: 'BEN-002',
    displayName: 'Merchant Beneficiary - ICICI',
    bankName: 'ICICI Bank',
    accountNumberMasked: 'XXXXXX1098',
    ifsc: 'ICIC0005678',
  },
  {
    id: 'BEN-003',
    displayName: 'Merchant Beneficiary - SBI',
    bankName: 'SBI',
    accountNumberMasked: 'XXXXXX7788',
    ifsc: 'SBIN0004321',
  },
];

export const COOLING_OPTIONS = [5, 30, 60, 120, 1440];

function formatDateTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${h}:${m}:${s}`;
}

/** Build default history with a recent PENDING tx for QA (2 min cooling) */
export function buildDefaultMerchantHistory(): MerchantTx[] {
  const now = Date.now();
  const recentPending: MerchantTx = {
    id: 'mtx_latest_pending',
    dateTime: formatDateTime(new Date()),
    type: 'Deposit via Crypto Bridge',
    description: 'Bridge deposit pending cooling period',
    amountUsdt: 60,
    balanceAfterUsdt: 13430.25,
    reference: 'ref_dep_pending...',
    status: 'PENDING',
    coolingEndsAt: now + 2 * 60 * 1000,
    relatedOrderId: 'ORD-LATEST',
    beneficiary: MOCK_BENEFICIARY,
  };
  return [
    recentPending,
    {
      id: 'mtx_001',
      dateTime: '26/02/2026, 18:31:25',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit purchase: 60 USDT (INR converted)',
      amountUsdt: 60,
      balanceAfterUsdt: 13430.25,
      reference: 'ref_dep_2rm...',
      status: 'SUCCESSFUL',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-001',
      beneficiary: MOCK_BENEFICIARY,
    },
    {
      id: 'mtx_002',
      dateTime: '26/02/2026, 18:15:10',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit purchase: 60 USDT (INR converted)',
      amountUsdt: 60,
      balanceAfterUsdt: 13370.25,
      reference: 'ref_dep_abc...',
      status: 'SUCCESSFUL',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-002',
      beneficiary: MOCK_BENEFICIARY_2,
    },
    {
      id: 'mtx_003',
      dateTime: '26/02/2026, 17:45:00',
      type: 'Player Deposit Conversion',
      description: 'Player deposit converted to USDT',
      amountUsdt: 120,
      balanceAfterUsdt: 13310.25,
      reference: 'ref_plr_xyz...',
      status: 'SUCCESSFUL',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-003',
      beneficiary: null,
    },
    {
      id: 'mtx_004',
      dateTime: '26/02/2026, 10:31:25',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit purchase: 120 USDT (verification failed)',
      amountUsdt: 120,
      balanceAfterUsdt: 13190.25,
      reference: 'ref_dep_bdjl...',
      status: 'FAILED',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-004',
      failureReason: 'TxID not found',
      beneficiary: MOCK_BENEFICIARY,
    },
    {
      id: 'mtx_005',
      dateTime: '26/02/2026, 09:55:00',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit: 80 USDT (amount mismatch)',
      amountUsdt: 80,
      balanceAfterUsdt: 13070.25,
      reference: 'ref_dep_amt...',
      status: 'FAILED',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-005',
      failureReason: 'Amount mismatch',
      beneficiary: MOCK_BENEFICIARY_2,
    },
    {
      id: 'mtx_006',
      dateTime: '26/02/2026, 08:20:15',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit: 50 USDT (reference already used)',
      amountUsdt: 50,
      balanceAfterUsdt: 12990.25,
      reference: 'ref_dep_used...',
      status: 'FAILED',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-006',
      failureReason: 'TxID already used',
      beneficiary: MOCK_BENEFICIARY_3,
    },
    {
      id: 'mtx_007',
      dateTime: '26/02/2026, 09:12:11',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit pending cooling period',
      amountUsdt: 80,
      balanceAfterUsdt: 12940.25,
      reference: 'ref_dep_pend...',
      status: 'PAYMENT_VERIFICATION',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-007',
      beneficiary: MOCK_BENEFICIARY,
    },
    {
      id: 'mtx_008',
      dateTime: '26/02/2026, 08:05:00',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit pending cooling period',
      amountUsdt: 100,
      balanceAfterUsdt: 12860.25,
      reference: 'ref_dep_cool...',
      status: 'PENDING',
      coolingEndsAt: now + 30 * 60000,
      relatedOrderId: 'ORD-008',
      beneficiary: MOCK_BENEFICIARY_2,
    },
    {
      id: 'mtx_009',
      dateTime: '26/02/2026, 07:30:00',
      type: 'Deposit via Crypto Bridge',
      description: 'Bridge deposit pending cooling period',
      amountUsdt: 45,
      balanceAfterUsdt: 12760.25,
      reference: 'ref_dep_wait...',
      status: 'PENDING',
      coolingEndsAt: now + 60 * 60000,
      relatedOrderId: 'ORD-009',
      beneficiary: MOCK_BENEFICIARY_3,
    },
    {
      id: 'mtx_010',
      dateTime: '25/02/2026, 18:00:00',
      type: 'Merchant Settlement',
      description: 'Settlement to merchant wallet',
      amountUsdt: -200,
      balanceAfterUsdt: 12715.25,
      reference: 'ref_settle_001...',
      status: 'SUCCESSFUL',
      coolingEndsAt: null,
      relatedOrderId: 'ORD-010',
      beneficiary: null,
    },
  ];
}

export const DEFAULT_MERCHANT_HISTORY: MerchantTx[] = buildDefaultMerchantHistory();
