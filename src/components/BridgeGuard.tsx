import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBridgeStore } from '../store/bridgeStore';
import {
  canAccessPayment,
  canAccessBeneficiary,
  canAccessCooling,
  canAccessCoolingSelect,
  canAccessVerify,
} from '../utils/routeGuards';
import { ROUTES } from '../routes/paths';

export function BridgeGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const checkExpiry = useBridgeStore((s) => s.checkExpiry);
  const touch = useBridgeStore((s) => s.touch);

  const order = useBridgeStore((s) => s.order);
  const { invoiceStatus, paymentMethod, selectedBeneficiary } = order;

  useEffect(() => {
    touch();
  }, [location.pathname, touch]);

  useEffect(() => {
    if (checkExpiry()) {
      navigate(ROUTES.BRIDGE.EXPIRED, { replace: true });
      return;
    }

    const path = location.pathname;

    if (path === ROUTES.BRIDGE.EXPIRED) return;
    if (invoiceStatus === 'EXPIRED') {
      navigate(ROUTES.BRIDGE.EXPIRED, { replace: true });
      return;
    }

    if (path === ROUTES.BRIDGE.EXPLAIN) return;

    if (path === ROUTES.BRIDGE.PAYMENT) {
      if (!canAccessPayment(invoiceStatus)) {
        navigate(ROUTES.BRIDGE.EXPLAIN, { replace: true });
      }
      return;
    }

    if (path === ROUTES.BRIDGE.BENEFICIARY) {
      if (!canAccessBeneficiary(paymentMethod)) {
        navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
      }
      return;
    }

    if (path === ROUTES.BRIDGE.COOLING_SELECT) {
      if (!canAccessCoolingSelect(selectedBeneficiary)) {
        navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true });
      }
      return;
    }

    if (path === ROUTES.BRIDGE.COOLING) {
      if (!canAccessCooling(selectedBeneficiary, invoiceStatus)) {
        navigate(ROUTES.BRIDGE.BENEFICIARY, { replace: true });
      }
      return;
    }

    if (path === ROUTES.MERCHANT.HOME || path === ROUTES.MERCHANT.HISTORY) return;

    if (path === ROUTES.BRIDGE.VERIFY) {
      if (!canAccessVerify(invoiceStatus)) {
        if (invoiceStatus === 'COOLING') navigate(ROUTES.BRIDGE.COOLING, { replace: true });
        else navigate(ROUTES.BRIDGE.PAYMENT, { replace: true });
      }
      return;
    }

    // Success route removed – redirect to merchant history
    if (path === ROUTES.BRIDGE.SUCCESS) {
      navigate(ROUTES.MERCHANT.HISTORY, { replace: true });
    }
  }, [
    location.pathname,
    invoiceStatus,
    paymentMethod,
    selectedBeneficiary,
    checkExpiry,
    navigate,
  ]);

  return <>{children}</>;
}
