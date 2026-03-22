import { cn } from '@/lib/utils';

type EffortLevel = 'easy' | 'moderate' | 'hard' | 'very_hard';

const EFFORT_STYLES: Record<EffortLevel, string> = {
  easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  moderate: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  hard: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  very_hard: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

interface EffortBadgeProps {
  level: string;
  label: string;
  score?: number;
  className?: string;
}

export function EffortBadge({ level, label, score, className }: EffortBadgeProps) {
  const style = EFFORT_STYLES[level as EffortLevel] ?? EFFORT_STYLES.moderate;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold',
        style,
        className,
      )}
    >
      {label}
      {score !== undefined && (
        <span className="ml-1 rounded-full bg-black/10 px-1.5 py-0.5 text-xs font-bold dark:bg-white/10">
          {score}/100
        </span>
      )}
    </span>
  );
}
