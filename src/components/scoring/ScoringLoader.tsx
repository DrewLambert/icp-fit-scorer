import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Brain, MessageSquare, Check } from 'lucide-react';

const steps = [
  { label: 'Enriching company data', icon: Search },
  { label: 'Analyzing ICP fit', icon: Brain },
  { label: 'Generating outreach', icon: MessageSquare },
];

export function ScoringLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 2500),
      setTimeout(() => setCurrentStep(2), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="relative">
        <div className="h-32 w-32 rounded-full border-4 border-primary/20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      </div>

      <div className="mt-8 space-y-3 w-full max-w-xs">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                isActive
                  ? 'text-primary font-medium'
                  : isComplete
                    ? 'text-success'
                    : 'text-muted-foreground/50'
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center">
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      key="active"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : (
                    <StepIcon key="icon" className="h-4 w-4" />
                  )}
                </AnimatePresence>
              </div>
              <span>{step.label}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
