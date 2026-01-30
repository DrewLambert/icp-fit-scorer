import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';

interface FeatureTooltipProps {
  featureId: string;
  title: string;
  description: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
}

export function FeatureTooltip({ 
  featureId, 
  title, 
  description, 
  children, 
  position = 'bottom',
  showOnce = false 
}: FeatureTooltipProps) {
  const { hasSeenFeature, markFeatureSeen, hasSeenTour } = useOnboarding();
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const hasSeen = hasSeenFeature[featureId];
  const shouldShowHighlight = !hasSeen && hasSeenTour && !isDismissed && showOnce;
  const showTooltip = isHovered || shouldShowHighlight;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (showOnce) {
      markFeatureSeen(featureId);
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pulse indicator for unseen features */}
      {shouldShowHighlight && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
      )}
      
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 5 : position === 'bottom' ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-50 w-64 ${positionClasses[position]}`}
          >
            <div className="bg-popover border border-border/50 rounded-xl p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <h4 className="font-semibold text-foreground text-sm">{title}</h4>
                </div>
                {shouldShowHighlight && (
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
