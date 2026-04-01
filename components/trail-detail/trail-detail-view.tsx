import type { Trail } from '@/lib/trails';
import { TrailDetailPageClient } from './trail-detail-page-client';

export function TrailDetailView({
  trail,
  locale,
  isAuthenticated,
}: {
  trail: Trail;
  locale: string;
  isAuthenticated: boolean;
}) {
  return <TrailDetailPageClient trail={trail} locale={locale} isAuthenticated={isAuthenticated} />;
}
