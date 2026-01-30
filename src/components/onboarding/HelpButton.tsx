import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function HelpButton() {
  const { openHelp, isTourActive } = useOnboarding();

  if (isTourActive) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openHelp}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
          >
            <HelpCircle className="h-6 w-6" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Help & Guides</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
