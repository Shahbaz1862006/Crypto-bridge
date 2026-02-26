import { Outlet } from 'react-router-dom';
import { BridgeHeader } from '../components/BridgeHeader';

/**
 * Layout for Bridge flow screens.
 * Renders BridgeHeader + page content.
 * Does NOT wrap Merchant Transaction History.
 */
export function BridgeLayout() {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-6 pb-8">
      <BridgeHeader />
      <Outlet />
    </div>
  );
}
