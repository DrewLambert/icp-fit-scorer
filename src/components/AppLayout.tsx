import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow orbs - organic floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-primary/[0.025] rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
