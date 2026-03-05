'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search, CheckCircle2, MapPin, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pointsToGPX } from '@/lib/gpx-parser';

interface WikilocImportProps {
  onRouteLoaded: (content: string, fileName: string) => void;
}

interface ImportedRoute {
  name: string;
  pointCount: number;
}

export function WikilocImport({ onRouteLoaded }: WikilocImportProps) {
  const t = useTranslations('SetupPage');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedRoute, setImportedRoute] = useState<ImportedRoute | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setImportedRoute(null);

    try {
      const response = await fetch(`/api/wikiloc?url=${encodeURIComponent(url.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import route');
      }

      if (data.points && data.points.length > 0) {
        const name = data.name || 'Wikiloc Route';
        const gpxContent = pointsToGPX(data.points, name);
        onRouteLoaded(gpxContent, `${name}.gpx`);
        setImportedRoute({ name, pointCount: data.points.length });
      } else {
        throw new Error('No points found in the route');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label className="text-muted-foreground text-sm font-semibold">{t('wikilocTitle')}</Label>
        <p className="text-muted-foreground text-xs">{t('wikilocDescription')}</p>
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder={t('wikilocPlaceholder')}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setImportedRoute(null);
              }}
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleImport();
              }}
            />
          </div>
          <Button
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className="shrink-0"
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('importWikiloc')}
          </Button>
        </div>

        {error && <p className="text-destructive text-xs">{error}</p>}

        {importedRoute && (
          <div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">{importedRoute.name}</p>
              <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {t('wikilocPoints', { count: importedRoute.pointCount })}
                </span>
                <span className="flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  wikiloc.com
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
