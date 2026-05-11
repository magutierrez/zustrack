import {
  ArrowUp,
  ArrowDown,
  Ruler,
  Clock,
  Mountain,
  TrendingUp,
  TrendingDown,
  Eye,
} from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  onMapClick?: () => void;
  showOnMapLabel?: string;
}

function StatCard({ icon, label, value, sub, onMapClick, showOnMapLabel }: StatCardProps) {
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
      {onMapClick && (
        <button
          onClick={onMapClick}
          aria-label={showOnMapLabel ?? label}
          className="absolute top-3 right-3 flex items-center justify-center rounded-md p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <Eye className="size-3.5" />
        </button>
      )}
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
  highPointCoords?: { lat: number; lng: number } | null;
  lowPointCoords?: { lat: number; lng: number } | null;
  onShowOnMap?: (lat: number, lng: number) => void;
  labels: {
    distance: string;
    elevationGain: string;
    elevationLoss: string;
    highPoint: string;
    lowPoint: string;
    avgElevation: string;
    duration: string;
    km: string;
    meters: string;
    showOnMap: string;
    durationH: string;
    durationMin: string;
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
  highPointCoords,
  lowPointCoords,
  onShowOnMap,
  labels,
}: StatsGridProps) {
  const hours = Math.floor(estimatedDurationMin / 60);
  const mins = estimatedDurationMin % 60;
  const durationStr =
    hours === 0
      ? `${mins}${labels.durationMin}`
      : mins > 0
        ? `${hours}${labels.durationH} ${mins}${labels.durationMin}`
        : `${hours}${labels.durationH}`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Ruler className="size-4" />}
        label={labels.distance}
        value={`${distanceKm.toFixed(1)} ${labels.km}`}
      />
      <StatCard
        icon={<Clock className="size-4" />}
        label={labels.duration}
        value={durationStr}
      />
      <StatCard
        icon={<ArrowUp className="size-4 text-emerald-500" />}
        label={labels.elevationGain}
        value={`+${elevationGainM.toLocaleString()} ${labels.meters}`}
      />
      <StatCard
        icon={<ArrowDown className="size-4 text-rose-500" />}
        label={labels.elevationLoss}
        value={`-${elevationLossM.toLocaleString()} ${labels.meters}`}
      />
      {elevationMaxM !== null && (
        <StatCard
          icon={<TrendingUp className="size-4 text-sky-500" />}
          label={labels.highPoint}
          value={`${elevationMaxM.toLocaleString()} ${labels.meters}`}
          onMapClick={
            highPointCoords && onShowOnMap
              ? () => onShowOnMap(highPointCoords.lat, highPointCoords.lng)
              : undefined
          }
          showOnMapLabel={`${labels.highPoint} – ${labels.showOnMap}`}
        />
      )}
      {elevationMinM !== null && (
        <StatCard
          icon={<TrendingDown className="size-4 text-amber-500" />}
          label={labels.lowPoint}
          value={`${elevationMinM.toLocaleString()} ${labels.meters}`}
          onMapClick={
            lowPointCoords && onShowOnMap
              ? () => onShowOnMap(lowPointCoords.lat, lowPointCoords.lng)
              : undefined
          }
          showOnMapLabel={`${labels.lowPoint} – ${labels.showOnMap}`}
        />
      )}
      {avgElevationM !== null && (
        <StatCard
          icon={<Mountain className="size-4" />}
          label={labels.avgElevation}
          value={`${avgElevationM.toLocaleString()} ${labels.meters}`}
        />
      )}
    </div>
  );
}
