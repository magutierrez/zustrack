import type { Trail, TrailSummary } from '@/lib/trails';
import { getSimilarTrails } from '@/lib/trails';
import { TrailDetailPageClient } from './trail-detail-page-client';

export async function TrailDetailView({
  trail,
  locale,
}: {
  trail: Trail;
  locale: string;
}) {
  const similarTrails: TrailSummary[] = await getSimilarTrails(
    trail.country,
    trail.id,
    trail.difficulty_score,
  );

  return (
    <TrailDetailPageClient
      trail={trail}
      locale={locale}
      similarTrails={similarTrails}
    />
  );
}
