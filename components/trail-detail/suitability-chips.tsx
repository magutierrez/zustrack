import { Baby, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuitabilityChipProps {
  icon: React.ReactNode;
  label: string;
  suitable: boolean;
  yesLabel: string;
  noLabel: string;
}

function SuitabilityChip({ icon, label, suitable, yesLabel, noLabel }: SuitabilityChipProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        suitable
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          'ml-auto text-xs font-semibold',
          suitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400',
        )}
      >
        {suitable ? yesLabel : noLabel}
      </span>
    </div>
  );
}

interface SuitabilityChipsProps {
  childFriendly: boolean;
  petFriendly: boolean;
  labels: {
    childFriendly: string;
    petFriendly: string;
    yes: string;
    no: string;
  };
}

export function SuitabilityChips({ childFriendly, petFriendly, labels }: SuitabilityChipsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <SuitabilityChip
        icon={<Baby className="h-4 w-4" />}
        label={labels.childFriendly}
        suitable={childFriendly}
        yesLabel={labels.yes}
        noLabel={labels.no}
      />
      <SuitabilityChip
        icon={<PawPrint className="h-4 w-4" />}
        label={labels.petFriendly}
        suitable={petFriendly}
        yesLabel={labels.yes}
        noLabel={labels.no}
      />
    </div>
  );
}
