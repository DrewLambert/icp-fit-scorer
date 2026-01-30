import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Cpu, 
  TrendingUp, 
  Globe,
  LucideIcon,
} from 'lucide-react';
import { CriteriaScore } from '@/types/icp';
import { useICPStore } from '@/stores/icpStore';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Building2,
  DollarSign,
  Cpu,
  TrendingUp,
  Globe,
};

import { ScoringMode } from '@/types/icp';

interface SignalBreakdownProps {
  breakdown: CriteriaScore[];
  totalScore: number;
  scoringMode?: ScoringMode; // Pass mode from result instead of store
}

interface SignalRowProps {
  criteria: CriteriaScore;
  index: number;
  isAdvanced: boolean;
}

function SignalRow({ criteria, index, isAdvanced }: SignalRowProps) {
  const Icon = iconMap[criteria.icon] || Building2;
  
  // For advanced mode, use the advancedScore directly
  const advancedScore = criteria.advancedScore;
  const hasAdvancedScore = isAdvanced && advancedScore !== undefined;
  
  // Standard mode calculations
  const percentage = Math.round((criteria.score / criteria.maxScore) * 100);
  const isModerate = percentage >= 40 && percentage < 70;
  const isPoor = percentage < 40;
  
  // For advanced mode, determine color based on sign
  const advancedIsNegative = hasAdvancedScore && advancedScore < 0;
  
  const getContributionColor = () => {
    if (hasAdvancedScore) {
      return advancedIsNegative ? 'text-destructive' : 'text-success';
    }
    if (isPoor) return 'text-destructive';
    if (isModerate) return 'text-warning';
    return 'text-success';
  };

  const getContributionBg = () => {
    if (hasAdvancedScore) {
      return advancedIsNegative ? 'bg-destructive/10' : 'bg-success/10';
    }
    if (isPoor) return 'bg-destructive/10';
    if (isModerate) return 'bg-warning/10';
    return 'bg-success/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${getContributionBg()}`}>
          <Icon className={`h-4 w-4 ${getContributionColor()}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {criteria.criteriaName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {criteria.reasoning}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {hasAdvancedScore ? (
          // Advanced mode: show -5 to +5 score prominently
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-sm font-bold ${getContributionBg()} ${getContributionColor()}`}>
            {advancedScore > 0 ? '+' : ''}{advancedScore}
          </div>
        ) : (
          // Standard mode: show contribution
          <>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-sm font-semibold ${getContributionBg()} ${getContributionColor()}`}>
              {isPoor ? '−' : '+'}{criteria.score}
            </div>
            <span className="text-xs text-muted-foreground">
              / {criteria.maxScore}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function SignalBreakdown({ breakdown, totalScore, scoringMode }: SignalBreakdownProps) {
  const store = useICPStore();
  // Use passed scoringMode if available, otherwise fall back to store
  const isAdvanced = (scoringMode ?? store.scoringMode) === 'advanced';
  
  // Sort by score percentage (best matches first)
  const sortedBreakdown = [...breakdown].sort((a, b) => {
    if (isAdvanced && a.advancedScore !== undefined && b.advancedScore !== undefined) {
      return b.advancedScore - a.advancedScore;
    }
    const aPercent = a.score / a.maxScore;
    const bPercent = b.score / b.maxScore;
    return bPercent - aPercent;
  });

  const maxPossible = breakdown.reduce((sum, c) => sum + c.maxScore, 0);
  
  // Calculate advanced mode totals
  const advancedTotal = isAdvanced 
    ? breakdown.reduce((sum, c) => sum + (c.advancedScore || 0), 0)
    : null;
  const advancedMax = isAdvanced ? breakdown.length * 5 : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fluid-section"
    >
      {/* Header - minimal, no box */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-foreground">
          Signal Breakdown
        </h3>
        <span className="section-label">
          {isAdvanced ? 'GTM Partners' : 'Scoring Receipt'}
        </span>
      </div>
      
      {/* Signals - inline rows, no cards */}
      <div className="space-y-0">
        {sortedBreakdown.map((criteria, index) => (
          <SignalRow 
            key={criteria.criteriaId} 
            criteria={criteria} 
            index={index} 
            isAdvanced={isAdvanced}
          />
        ))}
      </div>
      
      {/* Total - subtle divider, not boxed */}
      <div className="organic-divider" />
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-foreground">
          {isAdvanced ? 'Net Score' : 'Total Score'}
        </span>
        <div className="flex items-center gap-2">
          {isAdvanced && advancedTotal !== null ? (
            <>
              <span className={`font-mono text-xl font-bold ${advancedTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                {advancedTotal > 0 ? '+' : ''}{advancedTotal}
              </span>
              <span className="text-sm text-muted-foreground">
                (max +{advancedMax})
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-xl font-bold text-primary">
                {totalScore}
              </span>
              <span className="text-sm text-muted-foreground">
                / {maxPossible}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
