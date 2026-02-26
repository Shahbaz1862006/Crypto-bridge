export type PaymentMethod = 'UPI' | 'BANK';

export type ReferenceType = 'UTR' | 'BRN';

export type VerificationErrorCode = 'NOT_FOUND' | 'AMOUNT_MISMATCH' | 'ALREADY_USED' | 'FRAUD' | null;

export type InvoiceStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_BENEFICIARY'
  | 'COOLING'
  | 'READY_FOR_VERIFICATION'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED';

export type TxStatus = 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'PAYMENT_VERIFICATION';

export type TxType =
  | 'Player Deposit Conversion'
  | 'Deposit via Crypto Bridge'
  | 'Merchant Settlement';

export type PostPurchaseAction = 'SEND' | 'WALLET' | null;

export interface BeneficiaryDetails {
  beneficiaryName: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
}

export interface MerchantTx {
  id: string;
  dateTime: string;
  type: TxType;
  description: string;
  amountUsdt: number;
  balanceAfterUsdt: number;
  reference: string;
  status: TxStatus;
  coolingEndsAt: number | null;
  relatedOrderId: string;
  failureReason?: string;
  /** Beneficiary snapshot for this transaction */
  beneficiary?: BeneficiaryDetails | null;
  /** Route to navigate when row is clicked (e.g. /bridge/cooling?txId=...) */
  deepLinkRoute?: string;
  /** Whether the row is clickable for deep-link navigation */
  deepLinkEnabled?: boolean;
}

export interface Beneficiary {
  id: string;
  displayName: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
  hasCooling?: boolean; // optional; cooling is user's bank choice, not beneficiary
}

export interface BridgeOrder {
  orderId: string;
  createdAt: number;
  lastActiveAt: number;
  merchantReturnUrl: string;
  coin: 'USDT_TRX';
  currency: 'INR';
  invoiceStatus: InvoiceStatus;

  usdtAmount: number;
  inrAmount: number;
  exchangeRate: number;
  rateLoading: boolean;

  paymentMethod: PaymentMethod | null;
  beneficiaries: Beneficiary[];
  selectedBeneficiaryId: string | null;
  selectedBeneficiary: Beneficiary | null;

  coolingMinutes: number | null;
  coolingEndsAt: number | null;

  paymentTxId: string;
  /** UPI => UTR, BANK => BRN */
  referenceType: ReferenceType | null;
  referenceNumber: string;
  referenceVerified: boolean;
  expectedInrAmount: number;
  verificationErrorCode: VerificationErrorCode;
  verificationErrorMessage: string | null;
  verificationError: string | null;
  purchasedUsdt: number;
  postPurchaseAction: PostPurchaseAction | null;

  merchantTxId: string | null;
}

export type ForceVerifyFailMode = 'NONE' | 'FAIL' | 'USED' | 'AMOUNT';

export interface DevState {
  forceVerifyFailMode: ForceVerifyFailMode;
  forceCoolingEndNow: boolean;
}

export interface QueryParams {
  merchantReturnUrl: string;
  currency: string;
  coin: string;
  presetUsdt: number;
}

export interface Wallet {
  availableUsdt: number;
  lockedUsdt: number;
}
