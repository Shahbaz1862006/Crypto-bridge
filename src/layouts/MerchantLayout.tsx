import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

/**
 * Layout for Merchant screens.
 * Sidebar with only Transactions menu item.
 */
export function MerchantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHistory = location.pathname === ROUTES.MERCHANT.HISTORY;

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="w-16 lg:w-56 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] text-[var(--muted)]">
        <div className="p-4 border-b border-[var(--border)]">
          <h1
            onClick={() => navigate(ROUTES.MERCHANT.HOME)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(ROUTES.MERCHANT.HOME);
              }
            }}
            className="text-xl font-semibold text-gray-900 cursor-pointer hidden lg:inline"
          >
            Merchant
          </h1>
        </div>
        <nav className="flex-1 p-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.MERCHANT.HISTORY)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
              isHistory ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-gray-100 text-[var(--muted)]'
            }`}
          >
            <span>📊</span>
            <span className="hidden lg:inline">Transactions</span>
          </button>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
