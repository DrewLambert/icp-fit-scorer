import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnboardingState {
  hasSeenTour: boolean;
  hasSeenFeature: Record<string, boolean>;
  currentStep: number;
  isTourActive: boolean;
  isHelpOpen: boolean;
}

interface OnboardingContextType extends OnboardingState {
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  markFeatureSeen: (featureId: string) => void;
  openHelp: () => void;
  closeHelp: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = 'fitch-onboarding';

const defaultState: OnboardingState = {
  hasSeenTour: false,
  hasSeenFeature: {},
  currentStep: 0,
  isTourActive: false,
  isHelpOpen: false,
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed, isTourActive: false, isHelpOpen: false };
      }
    } catch (e) {
      console.error('Failed to load onboarding state:', e);
    }
    return defaultState;
  });

  // Auto-start tour for first-time users
  useEffect(() => {
    if (!state.hasSeenTour && !state.isTourActive) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, isTourActive: true }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.hasSeenTour, state.isTourActive]);

  // Persist state
  useEffect(() => {
    const { isTourActive, isHelpOpen, currentStep, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state]);

  const startTour = () => setState(prev => ({ ...prev, isTourActive: true, currentStep: 0 }));
  const endTour = () => setState(prev => ({ ...prev, isTourActive: false, hasSeenTour: true, currentStep: 0 }));
  const nextStep = () => setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  const goToStep = (step: number) => setState(prev => ({ ...prev, currentStep: step }));
  const markFeatureSeen = (featureId: string) => setState(prev => ({
    ...prev,
    hasSeenFeature: { ...prev.hasSeenFeature, [featureId]: true }
  }));
  const openHelp = () => setState(prev => ({ ...prev, isHelpOpen: true }));
  const closeHelp = () => setState(prev => ({ ...prev, isHelpOpen: false }));
  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState, isTourActive: true });
  };

  return (
    <OnboardingContext.Provider value={{
      ...state,
      startTour,
      endTour,
      nextStep,
      prevStep,
      goToStep,
      markFeatureSeen,
      openHelp,
      closeHelp,
      resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
