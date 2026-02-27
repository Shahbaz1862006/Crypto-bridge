import type { InvoiceStatus, PaymentMethod } from '../store/types';

const PAYMENT_ALLOWED: InvoiceStatus[] = [
  'DRAFT',
  'AWAITING_PAYMENT',
  'AWAITING_BENEFICIARY',
  'COOLING',
  'READY_FOR_VERIFICATION',
  'VERIFYING', // Allow staying on payment during confirm → success (prevents Step 1 flash)
  'FAILED',
];

export function canAccessPayment(invoiceStatus: InvoiceStatus): boolean {
  return PAYMENT_ALLOWED.includes(invoiceStatus);
}

export function canAccessBeneficiary(paymentMethod: PaymentMethod | null): boolean {
  return paymentMethod === 'BANK';
}

export function canAccessCoolingSelect(
  selectedBeneficiary: { id: string } | null
): boolean {
  return selectedBeneficiary != null;
}

export function canAccessCooling(
  selectedBeneficiary: { id: string } | null,
  invoiceStatus: string
): boolean {
  return selectedBeneficiary != null || invoiceStatus === 'COOLING';
}


export function canAccessVerify(invoiceStatus: InvoiceStatus): boolean {
  return ['READY_FOR_VERIFICATION', 'VERIFYING', 'FAILED'].includes(invoiceStatus);
}

export function canAccessSuccess(
  invoiceStatus: InvoiceStatus,
  referenceVerified: boolean,
  orderId: string
): boolean {
  return (
    invoiceStatus === 'VERIFIED' &&
    referenceVerified === true &&
    Boolean(orderId?.trim())
  );
}
