import { useNavigate, useLocation } from 'react-router-dom';

interface BackButtonProps {
  fallbackTo: string;
  preserveQuery?: boolean;
  className?: string;
  /** When set, always hard redirect to this URL (ignores history) */
  forceRedirectTo?: string;
}

/**
 * Back button for Bridge flow screens.
 * Uses forceRedirectTo when set, else navigate(-1) when there's browser history, else navigates to fallback route.
 */
export function BackButton({ fallbackTo, preserveQuery = false, className, forceRedirectTo }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (forceRedirectTo) {
      window.location.href = forceRedirectTo;
      return;
    }
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
