import type { Trail } from '@/lib/trails';
import { TrailDetailPageClient } from './trail-detail-page-client';

export function TrailDetailView({ trail, locale }: { trail: Trail; locale: string }) {
  return <TrailDetailPageClient trail={trail} locale={locale} />;
}
