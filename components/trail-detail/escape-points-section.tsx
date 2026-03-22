import { MapPin, Car, Home } from 'lucide-react';

interface EscapePoint {
  lat: number;
  lng: number;
  name: string;
  type: 'town' | 'road' | 'shelter';
  distanceFromRoute: number;
}

interface Labels {
  escapePoints: string;
  town: string;
  road: string;
  shelter: string;
  kmAway: string;
}

const TYPE_ICONS = {
  town: MapPin,
  road: Car,
  shelter: Home,
};

export function EscapePointsSection({
  escapePoints,
  labels,
}: {
  escapePoints: EscapePoint[];
  labels: Labels;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.escapePoints}</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {escapePoints.map((ep, i) => {
          const Icon = TYPE_ICONS[ep.type];
          const typeLabel = labels[ep.type];
          return (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                  {ep.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{typeLabel}</span>
              </div>
              <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                {ep.distanceFromRoute} {labels.kmAway}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
