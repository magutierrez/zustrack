import { Droplets } from 'lucide-react';

interface WaterSource {
  lat: number;
  lng: number;
  name: string;
  type: 'natural' | 'urban';
  distanceFromRoute: number;
  reliability: 'high' | 'medium' | 'low';
}

interface Labels {
  waterSources: string;
  natural: string;
  urban: string;
  reliable: string;
  seasonal: string;
  unreliable: string;
  kmAway: string;
}

const RELIABILITY_STYLES = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function WaterSourcesSection({
  waterSources,
  labels,
}: {
  waterSources: WaterSource[];
  labels: Labels;
}) {
  const reliabilityLabel = (r: WaterSource['reliability']) =>
    r === 'high' ? labels.reliable : r === 'medium' ? labels.seasonal : labels.unreliable;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.waterSources}</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {waterSources.map((ws, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <Droplets className="h-4 w-4 shrink-0 text-sky-400" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">
                {ws.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {ws.type === 'natural' ? labels.natural : labels.urban}
              </span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RELIABILITY_STYLES[ws.reliability]}`}
            >
              {reliabilityLabel(ws.reliability)}
            </span>
            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {ws.distanceFromRoute} {labels.kmAway}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
