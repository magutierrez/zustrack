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
import type { TrailMapLayerType } from '@/lib/types';

interface TrailLayerControlProps {
  mapType: TrailMapLayerType;
  setMapType: (type: TrailMapLayerType) => void;
}

export function TrailLayerControl({ mapType, setMapType }: TrailLayerControlProps) {
  const t = useTranslations('TrailMap');

  return (
    <div className="absolute top-14 right-3 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="h-10 w-10 shadow-md">
            <Layers className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[170px]">
          <DropdownMenuRadioGroup
            value={mapType}
            onValueChange={(v) => setMapType(v as TrailMapLayerType)}
          >
            <DropdownMenuRadioItem value="ign-raster">
              {t('layers.ignRaster')}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ign-base">{t('layers.ignBase')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="osm">{t('layers.osm')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="pnoa">{t('layers.pnoa')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="opentopomap">
              {t('layers.opentopomap')}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
