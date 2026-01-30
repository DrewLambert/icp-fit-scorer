import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function ScoringLoader() {
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
      <p className="mt-6 text-muted-foreground">AI is analyzing company fit...</p>
    </motion.div>
  );
}
