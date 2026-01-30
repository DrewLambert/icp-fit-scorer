import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        {children}
      </main>
    </div>
  );
}
