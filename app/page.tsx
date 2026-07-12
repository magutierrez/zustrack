import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'zustrack' };

export default function RootPage() {
  redirect('/app/setup');
}
