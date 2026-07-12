interface Labels {
  surfaceTypes: string;
  pathTypes: string;
  surface: Record<string, string>;
  pathType: Record<string, string>;
}

const SURFACE_COLORS: Record<string, string> = {
  asphalt: 'bg-zinc-500',
  concrete: 'bg-zinc-400',
  paved: 'bg-zinc-400',
  gravel: 'bg-amber-500',
  fine_gravel: 'bg-amber-400',
  pebblestone: 'bg-amber-300',
  compacted: 'bg-yellow-600',
  dirt: 'bg-orange-700',
  earth: 'bg-orange-700',
  ground: 'bg-orange-600',
  grass: 'bg-green-500',
  unpaved: 'bg-lime-600',
  rock: 'bg-stone-500',
  sand: 'bg-yellow-300',
  mud: 'bg-brown-700',
  clay: 'bg-orange-800',
  unknown: 'bg-zinc-300',
};

function surfaceColor(surface: string) {
  return SURFACE_COLORS[surface] ?? 'bg-zinc-300';
}

export function SurfaceSection({
  dominantSurface,
  surfaceBreakdown,
  dominantPathType,
  pathTypeBreakdown,
  labels,
}: {
  dominantSurface: string | null;
  surfaceBreakdown: Record<string, number> | null;
  dominantPathType: string | null;
  pathTypeBreakdown: Record<string, number> | null;
  labels: Labels;
}) {
  return (
    <div className="space-y-6">
      {/* Surface types */}
      {dominantSurface && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{labels.surfaceTypes}</h2>
          {surfaceBreakdown && (
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {Object.entries(surfaceBreakdown).map(([surface, pct]) =>
                pct > 0 ? (
                  <div
                    key={surface}
                    className={surfaceColor(surface)}
                    style={{ width: `${pct}%` }}
                    title={`${labels.surface[surface] ?? surface}: ${pct}%`}
                  />
                ) : null,
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {surfaceBreakdown
              ? Object.entries(surfaceBreakdown).map(([surface, pct]) => (
                  <span
                    key={surface}
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <span className={`inline-block size-2.5 rounded-sm ${surfaceColor(surface)}`} />
                    {labels.surface[surface] ?? surface}
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{pct}%</span>
                  </span>
                ))
              : null}
          </div>
        </section>
      )}

      {/* Path types */}
      {dominantPathType && pathTypeBreakdown && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{labels.pathTypes}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(pathTypeBreakdown).map(([type, pct]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {labels.pathType[type] ?? type}
                <span className="text-zinc-400 dark:text-zinc-500">{pct}%</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
