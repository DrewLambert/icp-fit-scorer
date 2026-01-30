import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingProvider, GuidedTour, HelpButton, HelpCenter } from "@/components/onboarding";

const ScorePage = lazy(() => import("./pages/ScorePage"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const ProspectsPage = lazy(() => import("./pages/ProspectsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ScorePage />} />
                    <Route path="/setup" element={<SetupPage />} />
                    <Route path="/prospects" element={<ProspectsPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ErrorBoundary>
            <GuidedTour />
            <HelpCenter />
            <HelpButton />
          </BrowserRouter>
        </OnboardingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
