'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pointsToGPX } from '@/lib/gpx-parser';

interface WikilocImportProps {
  onRouteLoaded: (content: string, fileName: string) => void;
}

export function WikilocImport({ onRouteLoaded }: WikilocImportProps) {
  const t = useTranslations('SetupPage');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

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
      } else {
        throw new Error('No points found in the route');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Label className="text-muted-foreground text-sm font-semibold">{t('wikilocTitle')}</Label>
        <p className="text-muted-foreground text-xs">{t('wikilocDescription')}</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder={t('wikilocPlaceholder')}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleImport();
              }}
            />
          </div>
          <Button onClick={handleImport} disabled={isLoading || !url.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('importWikiloc')}
          </Button>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    </div>
  );
}
