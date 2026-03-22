import {
  ArrowUp,
  ArrowDown,
  Ruler,
  Clock,
  Mountain,
  TrendingUp,
  TrendingDown,
  Percent,
} from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

interface StatsGridProps {
  distanceKm: number;
  elevationGainM: number;
  elevationLossM: number;
  elevationMaxM: number | null;
  elevationMinM: number | null;
  avgElevationM: number | null;
  estimatedDurationMin: number;
  maxSlopePct: number;
  labels: {
    distance: string;
    elevationGain: string;
    elevationLoss: string;
    highPoint: string;
    lowPoint: string;
    avgElevation: string;
    duration: string;
    maxSlope: string;
    km: string;
    meters: string;
  };
}

export function StatsGrid({
  distanceKm,
  elevationGainM,
  elevationLossM,
  elevationMaxM,
  elevationMinM,
  avgElevationM,
  estimatedDurationMin,
  maxSlopePct,
  labels,
}: StatsGridProps) {
  const hours = Math.floor(estimatedDurationMin / 60);
  const mins = estimatedDurationMin % 60;
  const durationStr = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Ruler className="h-4 w-4" />}
        label={labels.distance}
        value={`${distanceKm.toFixed(1)} ${labels.km}`}
      />
      <StatCard
        icon={<Clock className="h-4 w-4" />}
        label={labels.duration}
        value={durationStr}
      />
      <StatCard
        icon={<ArrowUp className="h-4 w-4 text-emerald-500" />}
        label={labels.elevationGain}
        value={`+${elevationGainM.toLocaleString()} ${labels.meters}`}
      />
      <StatCard
        icon={<ArrowDown className="h-4 w-4 text-rose-500" />}
        label={labels.elevationLoss}
        value={`-${elevationLossM.toLocaleString()} ${labels.meters}`}
      />
      {elevationMaxM !== null && (
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-sky-500" />}
          label={labels.highPoint}
          value={`${elevationMaxM.toLocaleString()} ${labels.meters}`}
        />
      )}
      {elevationMinM !== null && (
        <StatCard
          icon={<TrendingDown className="h-4 w-4 text-amber-500" />}
          label={labels.lowPoint}
          value={`${elevationMinM.toLocaleString()} ${labels.meters}`}
        />
      )}
      {avgElevationM !== null && (
        <StatCard
          icon={<Mountain className="h-4 w-4" />}
          label={labels.avgElevation}
          value={`${avgElevationM.toLocaleString()} ${labels.meters}`}
        />
      )}
      <StatCard
        icon={<Percent className="h-4 w-4" />}
        label={labels.maxSlope}
        value={`${maxSlopePct.toFixed(1)}%`}
      />
    </div>
  );
}
