interface SlopeBreakdown {
  flat: number;
  gentle: number;
  steep: number;
  extreme: number;
}

interface Labels {
  slopeBreakdown: string;
  flat: string;
  gentle: string;
  steep: string;
  extreme: string;
}

const SEGMENTS: { key: keyof SlopeBreakdown; color: string; label: keyof Labels }[] = [
  { key: 'flat', color: 'bg-emerald-500', label: 'flat' },
  { key: 'gentle', color: 'bg-amber-400', label: 'gentle' },
  { key: 'steep', color: 'bg-red-500', label: 'steep' },
  { key: 'extreme', color: 'bg-red-950', label: 'extreme' },
];

export function SlopeBreakdownBar({
  breakdown,
  labels,
}: {
  breakdown: SlopeBreakdown;
  labels: Labels;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.slopeBreakdown}</h2>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {SEGMENTS.map(({ key, color }) =>
          breakdown[key] > 0 ? (
            <div
              key={key}
              className={color}
              style={{ width: `${breakdown[key]}%` }}
              title={`${labels[key]}: ${breakdown[key]}%`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {SEGMENTS.map(({ key, color, label }) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className={`inline-block size-2.5 rounded-sm ${color}`} />
            {labels[label]}
            <span className="font-medium text-zinc-700 dark:text-zinc-200">{breakdown[key]}%</span>
          </span>
        ))}
      </div>
    </section>
  );
}
