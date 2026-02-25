'use client';

import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MapLayerType } from './use-map-style';

interface LayerControlProps {
  mapType: MapLayerType;
  setMapType: (type: MapLayerType) => void;
}

export function LayerControl({ mapType, setMapType }: LayerControlProps) {
  const t = useTranslations('RouteMap');

  return (
    <div className="absolute top-3 right-3 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-10 w-10 shadow-md">
            <Layers className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={mapType}
            onValueChange={(v) => setMapType(v as MapLayerType)}
          >
            <DropdownMenuRadioItem value="standard">{t('layers.standard')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="topography">
              {t('layers.topography')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="satellite">{t('layers.satellite')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="hybrid">{t('layers.hybrid')}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
