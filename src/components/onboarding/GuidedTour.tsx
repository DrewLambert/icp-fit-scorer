import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingProvider';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Target, Settings, Users, Zap, HelpCircle } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to Fitch',
    description: 'Your AI-powered lead scoring platform. Let\'s take a quick tour to help you get started and make the most of your experience.',
    icon: <Zap className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Score Prospects',
    description: 'Enter a company name or URL to instantly analyze how well they match your Ideal Customer Profile. You can score one company at a time or batch process multiple companies.',
    icon: <Target className="h-8 w-8 text-primary" />,
    highlight: 'score',
  },
  {
    title: 'Configure Your ICP',
    description: 'Customize scoring criteria weights, set up rule-based scoring, enable predictive models, and configure intent & engagement tracking in the Setup page.',
    icon: <Settings className="h-8 w-8 text-primary" />,
    highlight: 'setup',
  },
  {
    title: 'Manage Prospects',
    description: 'View all your scored companies, compare up to 3 prospects side-by-side, and track engagement metrics in the Prospects page.',
    icon: <Users className="h-8 w-8 text-primary" />,
    highlight: 'prospects',
  },
  {
    title: 'Need Help?',
    description: 'Click the help button anytime to access guides, tutorials, and tips. You can also restart this tour from the help menu.',
    icon: <HelpCircle className="h-8 w-8 text-primary" />,
  },
];

export function GuidedTour() {
  const { isTourActive, currentStep, nextStep, prevStep, endTour } = useOnboarding();

  if (!isTourActive) return null;

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={endTour}
        />
        
        {/* Tour Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg fluid-card p-8"
        >
          {/* Close button */}
          <button
            onClick={endTour}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-primary' 
                    : index < currentStep 
                      ? 'w-3 bg-primary/50' 
                      : 'w-3 bg-secondary'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 glow-effect"
            >
              {step.icon}
            </motion.div>
            
            <motion.h2
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-foreground"
            >
              {step.title}
            </motion.h2>
            
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground leading-relaxed"
            >
              {step.description}
            </motion.p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={isFirst}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {tourSteps.length}
            </span>
            
            {isLast ? (
              <Button onClick={endTour} className="gap-2">
                Get Started
                <Zap className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
