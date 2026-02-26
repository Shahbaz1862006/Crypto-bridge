import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { BridgeGuard } from '../components/BridgeGuard';
import { AppLayout } from '../components/layouts/AppLayout';
import { BridgeLayout } from '../layouts/BridgeLayout';
import { ExplainPage } from '../pages/ExplainPage';
import { PaymentPage } from '../pages/PaymentPage';
import { BeneficiaryPage } from '../pages/BeneficiaryPage';
import { CoolingPage } from '../pages/CoolingPage';
import { CoolingSelectPage } from '../pages/CoolingSelectPage';
import { MerchantHistoryPage } from '../pages/MerchantHistoryPage';
import { VerifyPage } from '../pages/VerifyPage';
import { SuccessPage } from '../pages/SuccessPage';
import { ExpiredPage } from '../pages/ExpiredPage';
import { ROUTES } from './paths';

/**
 * Route configuration with nested structure.
 * Bridge routes use BridgeLayout (Fastpikeswop header).
 * Merchant History does NOT use BridgeLayout.
 */
export function AppRoutes() {
  const location = useLocation();

  return (
    <BridgeGuard>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.BRIDGE.EXPLAIN} replace />} />
            <Route element={<BridgeLayout />}>
              <Route path={ROUTES.BRIDGE.EXPLAIN} element={<ExplainPage />} />
              <Route path={ROUTES.BRIDGE.PAYMENT} element={<PaymentPage />} />
              <Route path={ROUTES.BRIDGE.BENEFICIARY} element={<BeneficiaryPage />} />
              <Route path={ROUTES.BRIDGE.COOLING_SELECT} element={<CoolingSelectPage />} />
              <Route path={ROUTES.BRIDGE.COOLING} element={<CoolingPage />} />
              <Route path={ROUTES.BRIDGE.VERIFY} element={<VerifyPage />} />
              <Route path={ROUTES.BRIDGE.SUCCESS} element={<SuccessPage />} />
              <Route path={ROUTES.BRIDGE.EXPIRED} element={<ExpiredPage />} />
            </Route>
            <Route path={ROUTES.MERCHANT.HISTORY} element={<MerchantHistoryPage />} />
            <Route path="*" element={<Navigate to={ROUTES.BRIDGE.EXPLAIN} replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </BridgeGuard>
  );
}
