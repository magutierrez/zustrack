import { Mountain } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function EmptyState() {
  const t = useTranslations('HomePage');

  return (
    <div className="border-border bg-card/50 text-muted-foreground flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <Mountain className="text-muted-foreground mb-4 h-12 w-12" />
      <h2 className="mb-2 text-xl font-semibold">{t('placeholders.title')}</h2>
      <p className="max-w-md text-sm">{t('placeholders.description')}</p>
    </div>
  );
}
