'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2, Bike, Footprints, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  activityType: 'cycling' | 'walking';
  distance: number;
  elevationGain: number;
  date: string;
}

interface StravaRoute {
  // id_str from Strava API — kept as string to avoid 64-bit precision loss
  id: string;
  name: string;
  activityType: 'cycling' | 'walking';
  distance: number;
  elevationGain: number;
}

interface StravaImportProps {
  onRouteLoaded: (content: string, fileName: string, activityType?: 'cycling' | 'walking') => void;
}

export function StravaImport({ onRouteLoaded }: StravaImportProps) {
  const t = useTranslations('SetupPage');
  const { data: session } = useSession();
  const isStravaConnected = session?.provider === 'strava';

  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [routes, setRoutes] = useState<StravaRoute[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStravaConnected) return;

    setLoadingList(true);
    setError(null);

    Promise.all([
      fetch('/api/strava/activities').then((r) => r.json()),
      fetch('/api/strava/routes').then((r) => r.json()),
    ])
      .then(([acts, rts]) => {
        if (Array.isArray(acts)) setActivities(acts);
        if (Array.isArray(rts)) setRoutes(rts);
      })
      .catch(() => setError(t('stravaImportError')))
      .finally(() => setLoadingList(false));
  }, [isStravaConnected, t]);

  const handleImport = async (type: 'activity' | 'route', item: StravaActivity | StravaRoute) => {
    setImportingId(String(item.id));
    setError(null);

    try {
      const params = new URLSearchParams({ type, id: String(item.id), name: item.name });
      const res = await fetch(`/api/strava/gpx?${params}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.expired ? t('stravaSessionExpired') : t('stravaImportError'));
        return;
      }

      const gpxContent = await res.text();
      onRouteLoaded(gpxContent, `${item.name}.gpx`, item.activityType);
    } catch {
      setError(t('stravaImportError'));
    } finally {
      setImportingId(null);
    }
  };

  if (!isStravaConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Activity className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground max-w-xs text-center text-sm">
          {t('stravaConnectDesc')}
        </p>
        <Button onClick={() => signIn('strava', { redirectTo: '/app/setup' })} className="gap-2">
          {t('stravaConnect')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="activities">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activities">{t('stravaActivities')}</TabsTrigger>
          <TabsTrigger value="routes">{t('stravaRoutes')}</TabsTrigger>
        </TabsList>

        {loadingList ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="activities" className="mt-3">
              {activities.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {t('stravaNoActivities')}
                </p>
              ) : (
                <ul className="custom-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  {activities.map((a) => (
                    <li key={a.id}>
                      <button
                        className="border-border bg-secondary hover:border-primary/30 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all disabled:opacity-50"
                        onClick={() => handleImport('activity', a)}
                        disabled={importingId === String(a.id)}
                      >
                        {a.activityType === 'cycling' ? (
                          <Bike className="text-muted-foreground h-4 w-4 shrink-0" />
                        ) : (
                          <Footprints className="text-muted-foreground h-4 w-4 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {a.distance} km · +{a.elevationGain} m ·{' '}
                            {new Date(a.date).toLocaleDateString()}
                          </p>
                        </div>
                        {importingId === String(a.id) && (
                          <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="routes" className="mt-3">
              {routes.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  {t('stravaNoRoutes')}
                </p>
              ) : (
                <ul className="custom-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                  {routes.map((r) => (
                    <li key={r.id}>
                      <button
                        className="border-border bg-secondary hover:border-primary/30 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all disabled:opacity-50"
                        onClick={() => handleImport('route', r)}
                        disabled={importingId === String(r.id)}
                      >
                        {r.activityType === 'cycling' ? (
                          <Bike className="text-muted-foreground h-4 w-4 shrink-0" />
                        ) : (
                          <Footprints className="text-muted-foreground h-4 w-4 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {r.distance} km · +{r.elevationGain} m
                          </p>
                        </div>
                        {importingId === String(r.id) && (
                          <Loader2 className="text-muted-foreground h-4 w-4 shrink-0 animate-spin" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
