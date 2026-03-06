import { SessionProvider } from 'next-auth/react';
import { SettingsProvider } from '@/components/settings-provider';
import React from 'react';

export default function AppRoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
}
