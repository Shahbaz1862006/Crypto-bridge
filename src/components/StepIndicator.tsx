interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-4" role="status" aria-label={`Step ${current} of ${total}`}>
      <span className="text-sm text-slate-400">Step {current} of {total}</span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current - 1 ? 'bg-primary' : i === current - 1 ? 'bg-primary' : 'bg-slate-600'
            } ${i < current - 1 ? 'opacity-60' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
