'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import type { GPXData } from '@/lib/types';
import { parseGPX } from '@/lib/gpx-parser';
import { cn } from '@/lib/utils';

// UI Components from main app
import { GPXUpload } from '@/components/gpx-upload';
import { WikilocImport } from '@/components/wikiloc-import';
import { StravaImport } from '@/components/strava-import';
import { SavedRoutesList } from '@/components/saved-routes-list';
import { Button } from '@/components/ui/button';
import { Bike, Footprints, ArrowRight, FileUp, History, Globe, Activity, Sun, Moon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';
import { useTheme } from 'next-themes';
import { UserMenu } from '@/app/_components/user-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SetupPageClientProps {
  session: Session | null;
}

export function SetupPageClient({ session: serverSession }: SetupPageClientProps) {
  const { data: clientSession } = useSession();
  const session = clientSession || serverSession;
  const t = useTranslations('SetupPage');
  const tRouteConfig = useTranslations('RouteConfigPanel');
  const router = useRouter();

  const [selectedGpxData, setSelectedGpxData] = useState<GPXData | null>(null);
  const [selectedSavedRouteId, setSelectedSavedRouteId] = useState<string | null>(null);
  const [selectedGpxFileName, setSelectedGpxFileName] = useState<string | null>(null);
  const [rawGpxContent, setRawGpxContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activityType, setActivityType] = useState<'cycling' | 'walking'>('cycling');
  const { theme, setTheme } = useTheme();

  const { routes: savedRoutes, saveRoute, refresh } = useSavedRoutes(); // to show saved routes

  // Refresh routes list whenever this component is mounted (e.g. navigation from /route)
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handlers for GPX and Saved Routes
  const handleGPXLoaded = (content: string, fileName: string, savedRouteId?: string) => {
    try {
      const data = parseGPX(content);
      if (data.points.length < 2) {
        setError(t('errors.insufficientPoints'));
        return;
      }
      setSelectedGpxData(data);
      setSelectedGpxFileName(fileName);
      setRawGpxContent(content);
      setSelectedSavedRouteId(savedRouteId || null);
      setError(null);
    } catch {
      setError(t('errors.readError'));
    }
  };

  const handleStravaRouteLoaded = (
    content: string,
    fileName: string,
    detectedActivityType?: 'cycling' | 'walking',
  ) => {
    handleGPXLoaded(content, fileName);
    if (detectedActivityType) setActivityType(detectedActivityType);
  };

  const handleClearGPX = () => {
    setSelectedGpxData(null);
    setSelectedGpxFileName(null);
    setRawGpxContent(null);
    setSelectedSavedRouteId(null);
    setError(null);
  };

  const handleAnalyzeRoute = async () => {
    // Use a robust identifier that works for all providers
    const userIdentifier = session?.user?.email || session?.user?.id;

    if (!userIdentifier) {
      console.error('SetupPage: Analysis blocked - No user identifier in session', {
        sessionStatus: clientSession ? 'loaded' : 'loading/server',
        user: session?.user,
      });
      setError('Session error: Could not identify user. Please try logging out and in again.');
      return;
    }

    if (!selectedGpxData || !rawGpxContent) {
      console.warn('SetupPage: Analysis blocked - Missing route data', {
        hasGpxData: !!selectedGpxData,
        hasRawContent: !!rawGpxContent,
        fileName: selectedGpxFileName,
      });
      setError(t('errors.noRouteSelected'));
      return;
    }

    try {
      const distance = selectedGpxData.totalDistance || 0;
      if (distance <= 0) {
        console.error('SetupPage: Invalid route distance', distance);
        setError(t('errors.readError'));
        return;
      }

      console.log('SetupPage: Saving route for analysis...', {
        name: selectedGpxFileName,
        identifier: userIdentifier,
        activity: activityType,
      });

      const routeId = await saveRoute(
        selectedGpxFileName || 'Unnamed Route',
        rawGpxContent,
        activityType,
        distance,
        selectedGpxData.totalElevationGain || 0,
        selectedGpxData.totalElevationLoss || 0,
      );

      if (routeId) {
        const params = new URLSearchParams();
        params.set('routeId', routeId);
        params.set('name', selectedGpxFileName || 'Unnamed Route');
        params.set('activity', activityType);
        router.push(`/app/route?${params.toString()}`);
      } else {
        setError(t('errors.saveError'));
      }
    } catch (err) {
      console.error('SetupPage: Unexpected error during analysis:', err);
      setError(t('errors.unknownError'));
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <LocaleSwitcher />
        <UserMenu
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
        />
      </div>

      <div className="border-border bg-card w-full max-w-2xl rounded-xl border p-6 shadow-xl">
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold">{t('title')}</h1>

        <Tabs defaultValue="gpx" className="mb-8 w-full">
          <TabsList className="custom-scrollbar mb-6 flex w-full items-center justify-start overflow-x-auto overflow-y-hidden md:grid md:grid-cols-4 md:justify-center">
            <TabsTrigger value="gpx" className="min-w-fit gap-2 md:w-full">
              <FileUp className="h-4 w-4" />
              <span>{t('uploadGPX')}</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="min-w-fit gap-2 md:w-full">
              <History className="h-4 w-4" />
              <span>{t('savedRoutes')}</span>
            </TabsTrigger>
            <TabsTrigger value="wikiloc" className="min-w-fit gap-2 md:w-full">
              <Globe className="h-4 w-4" />
              <span>{t('wikiloc')}</span>
            </TabsTrigger>
            <TabsTrigger value="strava" className="min-w-fit gap-2 md:w-full">
              <Activity className="h-4 w-4" />
              <span>{t('strava')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gpx" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-sm font-semibold">
                {t('selectRouteSource')}
              </Label>
              <GPXUpload
                onFileLoaded={handleGPXLoaded}
                fileName={selectedGpxFileName}
                onClear={handleClearGPX}
              />
            </div>
          </TabsContent>

          <TabsContent value="wikiloc" className="flex flex-col gap-4">
            <WikilocImport onRouteLoaded={handleGPXLoaded} />
          </TabsContent>

          <TabsContent value="saved" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-sm font-semibold">
                {t('savedRoutes')}
              </Label>
              <SavedRoutesList
                onLoadRoute={handleGPXLoaded}
                selectedRouteId={selectedSavedRouteId}
              />
            </div>
          </TabsContent>

          <TabsContent value="strava" className="flex flex-col gap-4">
            <StravaImport onRouteLoaded={handleStravaRouteLoaded} />
          </TabsContent>
        </Tabs>

        <div className="mb-8">
          {selectedGpxData && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-3">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {tRouteConfig('activity')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActivityType('cycling')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                      activityType === 'cycling'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Bike className="h-4 w-4" />
                    {tRouteConfig('cycling')}
                  </button>
                  <button
                    onClick={() => setActivityType('walking')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                      activityType === 'walking'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Footprints className="h-4 w-4" />
                    {tRouteConfig('walking')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 mt-auto mb-6 shrink-0 rounded-lg border p-3">
            <p className="text-destructive text-xs">{error}</p>
          </div>
        )}

        <Button
          onClick={handleAnalyzeRoute}
          disabled={!selectedGpxData}
          className="h-12 w-full gap-2 text-lg"
        >
          {t('analyzeRoute')} <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
