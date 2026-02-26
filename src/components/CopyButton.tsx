import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CopyButton({ text, onCopy, className = '', children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-slate-400 hover:text-primary transition-colors ${className}`}
      disabled={!text}
      aria-label={copied ? 'Copied' : 'Copy'}
    >
      {children ?? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
      {copied && <span className="text-xs text-primary">Copied</span>}
    </button>
  );
}
