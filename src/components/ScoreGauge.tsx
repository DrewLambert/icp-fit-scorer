import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Tier, TierDefinition, getTierFromScore } from '@/types/icp';
import { Zap, TrendingUp, Clock, XCircle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  animate?: boolean;
}

const tierColors: Record<Tier, { stroke: string; glow: string; bg: string }> = {
  A: { 
    stroke: 'hsl(var(--success))', 
    glow: 'hsl(var(--success) / 0.3)',
    bg: 'hsl(var(--success) / 0.15)'
  },
  B: { 
    stroke: 'hsl(var(--primary))', 
    glow: 'hsl(var(--primary) / 0.3)',
    bg: 'hsl(var(--primary) / 0.15)'
  },
  C: { 
    stroke: 'hsl(var(--warning))', 
    glow: 'hsl(var(--warning) / 0.3)',
    bg: 'hsl(var(--warning) / 0.15)'
  },
  D: { 
    stroke: 'hsl(var(--destructive))', 
    glow: 'hsl(var(--destructive) / 0.3)',
    bg: 'hsl(var(--destructive) / 0.15)'
  },
};

const tierIcons: Record<Tier, typeof Zap> = {
  A: Zap,
  B: TrendingUp,
  C: Clock,
  D: XCircle,
};

export function ScoreGauge({ score, size = 280, animate = true }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const tierDef = getTierFromScore(score);
  const colors = tierColors[tierDef.tier];
  const TierIcon = tierIcons[tierDef.tier];

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();
    const startScore = 0;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + (score - startScore) * eased);
      
      setDisplayScore(current);
      
      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, animate]);

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{
            filter: `drop-shadow(0 0 24px ${colors.glow})`,
          }}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
            className="opacity-50"
          />
          
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span 
              className="font-display text-7xl font-bold"
              style={{ color: colors.stroke }}
            >
              {tierDef.tier}
            </span>
          </motion.div>
          <motion.span
            className="mt-1 text-2xl font-medium tabular-nums text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {displayScore}/100
          </motion.span>
        </div>
      </div>

      {/* Tier Action Badge */}
      <motion.div
        className="mt-6 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div 
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ 
            backgroundColor: colors.bg,
            color: colors.stroke,
          }}
        >
          <TierIcon className="h-4 w-4" />
          {tierDef.action}
        </div>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          {tierDef.description}
        </p>
      </motion.div>
    </motion.div>
  );
}
