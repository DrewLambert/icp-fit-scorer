import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingProvider, GuidedTour, HelpButton, HelpCenter } from "@/components/onboarding";
import ScorePage from "./pages/ScorePage";
import SetupPage from "./pages/SetupPage";
import ProspectsPage from "./pages/ProspectsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OnboardingProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<ScorePage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/prospects" element={<ProspectsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
          <GuidedTour />
          <HelpCenter />
          <HelpButton />
        </BrowserRouter>
      </OnboardingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
