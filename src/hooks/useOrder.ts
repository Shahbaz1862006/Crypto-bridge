import { useBridgeStore } from '../store/bridgeStore';

export function useOrder() {
  const order = useBridgeStore((s) => s.order);
  const touch = useBridgeStore((s) => s.touch);
  const setUsdtAmount = useBridgeStore((s) => s.setUsdtAmount);
  const selectUPI = useBridgeStore((s) => s.selectUPI);
  const selectBANK = useBridgeStore((s) => s.selectBANK);
  const selectBeneficiary = useBridgeStore((s) => s.selectBeneficiary);
  const setCooling = useBridgeStore((s) => s.setCooling);
  const setPaymentTxId = useBridgeStore((s) => s.setPaymentTxId);
  const setReferenceNumber = useBridgeStore((s) => s.setReferenceNumber);
  const verifyReference = useBridgeStore((s) => s.verifyReference);
  const createOrder = useBridgeStore((s) => s.createOrder);
  const finalizeSend = useBridgeStore((s) => s.finalizeSend);
  const setBeneficiaryHasCooling = useBridgeStore((s) => s.setBeneficiaryHasCooling);

  return {
    ...order,
    touch,
    setUsdtAmount,
    selectUPI,
    selectBANK,
    selectBeneficiary,
    setCooling,
    setPaymentTxId,
    setReferenceNumber,
    verifyReference,
    createOrder,
    finalizeSend,
    setBeneficiaryHasCooling,
  };
}
