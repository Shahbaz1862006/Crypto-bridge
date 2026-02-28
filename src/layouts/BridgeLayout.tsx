import { Outlet, useLocation } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { StepIndicator } from '../components/StepIndicator';
import { ROUTES } from '../routes/paths';

const BRIDGE_ROUTE_CONFIG: Record<string, { step: number; fallbackTo: string }> = {
  [ROUTES.BRIDGE.EXPLAIN]: { step: 1, fallbackTo: ROUTES.MERCHANT.HISTORY },
  [ROUTES.BRIDGE.PAYMENT]: { step: 2, fallbackTo: ROUTES.BRIDGE.EXPLAIN },
  [ROUTES.BRIDGE.BENEFICIARY]: { step: 2, fallbackTo: ROUTES.BRIDGE.PAYMENT },
  [ROUTES.BRIDGE.COOLING_SELECT]: { step: 2, fallbackTo: ROUTES.BRIDGE.BENEFICIARY },
  [ROUTES.BRIDGE.COOLING]: { step: 2, fallbackTo: ROUTES.MERCHANT.HISTORY },
  [ROUTES.BRIDGE.VERIFY]: { step: 2, fallbackTo: ROUTES.MERCHANT.HISTORY },
  [ROUTES.BRIDGE.EXPIRED]: { step: 2, fallbackTo: ROUTES.MERCHANT.HISTORY },
};

function getRouteConfig(pathname: string): { step: number; fallbackTo: string } {
  const basePath = pathname.split('?')[0];
  return BRIDGE_ROUTE_CONFIG[basePath] ?? { step: 1, fallbackTo: ROUTES.MERCHANT.HISTORY };
}

/**
 * Layout for Bridge flow screens.
 * Renders consistent header (brand + back + step) with left alignment, then page content.
 */
export function BridgeLayout() {
  const location = useLocation();
  const { step, fallbackTo } = getRouteConfig(location.pathname);

  return (
    <div className="w-full">
      <header className="px-4 lg:px-10 pt-6 pb-4">
        <div className="text-lg font-semibold text-[var(--text)]">Fastpikeswop</div>
        <div className="mt-6">
          <BackButton
            fallbackTo={fallbackTo}
            forceRedirectTo={location.pathname === ROUTES.BRIDGE.EXPLAIN ? 'http://localhost:5173/merchant/history' : undefined}
            className="mb-0 text-sm text-[var(--muted)] hover:text-[var(--green)] hover:underline inline-flex items-center gap-1 transition-colors"
          />
        </div>
        <div className="mt-4">
          <StepIndicator current={step} total={2} />
        </div>
      </header>
      <main className="px-4 lg:px-10 pt-4 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
