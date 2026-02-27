import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  fallbackTo: string;
  preserveQuery?: boolean;
  className?: string;
}

/**
 * Back button for Bridge flow screens.
 * Uses navigate(-1) when there's browser history, else navigates to fallback route.
 */
export function BackButton({ fallbackTo, preserveQuery = false, className }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const target = preserveQuery ? `${fallbackTo}${location.search}` : fallbackTo;
      navigate(target);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        'mb-4 text-sm text-[var(--muted)] hover:text-[var(--green)] hover:underline inline-flex items-center gap-1 transition-colors'
      }
    >
      ← Back
    </button>
  );
}
