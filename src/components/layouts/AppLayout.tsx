import { Outlet } from 'react-router-dom';

/**
 * Root layout for the application.
 * Wraps all routes with shared styling and structure.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Outlet />
    </div>
  );
}
