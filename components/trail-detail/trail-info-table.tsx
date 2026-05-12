'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import type { Trail } from '@/lib/trails';

interface InfoRowProps {
  label: string;
  value: string;
  action?: React.ReactNode;
}

function InfoRow({ label, value, action }: InfoRowProps) {
  return (
    <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
      <td className="w-1/3 px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">{label}</td>
      <td className="px-4 py-3 text-zinc-900 dark:text-white">
        <span>{value}</span>
        {action && <span className="ml-3">{action}</span>}
      </td>
    </tr>
  );
}

interface TrailInfoTableProps {
  trail: Trail;
  locale: string;
  regionName?: string;
}

export function TrailInfoTable({ trail, locale, regionName }: TrailInfoTableProps) {
  const t = useTranslations('TrailPage');
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${trail.start_lat},${trail.start_lng}`;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <tbody>
          {trail.place && <InfoRow label={t('place')} value={trail.place} />}
          {regionName && <InfoRow label={t('region')} value={regionName} />}
          {trail.source && <InfoRow label={t('source')} value={trail.source} />}
          <InfoRow
            label={t('startPoint')}
            value={`${trail.start_lat.toFixed(5)}, ${trail.start_lng.toFixed(5)}`}
            action={
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
              >
                <ExternalLink className="size-3.5" />
                {t('openInMaps')}
              </a>
            }
          />
          {!trail.is_circular && (
            <InfoRow
              label={t('endPoint')}
              value={`${trail.end_lat.toFixed(5)}, ${trail.end_lng.toFixed(5)}`}
            />
          )}
          {trail.waypoint_count != null && trail.waypoint_count > 0 && (
            <InfoRow label={t('waypointCount')} value={String(trail.waypoint_count)} />
          )}
          {trail.point_count != null && (
            <InfoRow label={t('pointCount')} value={trail.point_count.toLocaleString()} />
          )}
        </tbody>
      </table>
    </section>
  );
}
