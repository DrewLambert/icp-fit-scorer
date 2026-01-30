import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProspectScore, Tier } from '@/types/icp';
import { Save, CheckCircle2, XCircle, ChevronDown, Zap, TrendingUp, Clock } from 'lucide-react';
import { useState } from 'react';

interface BatchResultsProps {
  results: ProspectScore[];
  failedCompanies: string[];
  onSaveAll: () => void;
  onSaveOne: (prospect: ProspectScore) => void;
}

const tierColors: Record<Tier, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30' },
  B: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  C: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30' },
  D: { bg: 'bg-destructive/15', text: 'text-destructive', border: 'border-destructive/30' },
};

const tierIcons: Record<Tier, typeof Zap> = {
  A: Zap,
  B: TrendingUp,
  C: Clock,
  D: XCircle,
};

export function BatchResults({
  results,
  failedCompanies,
  onSaveAll,
  onSaveOne,
}: BatchResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort by tier (A first) then by score within tier
  const sortedResults = [...results].sort((a, b) => {
    const tierOrder = { A: 0, B: 1, C: 2, D: 3 };
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[a.tier] - tierOrder[b.tier];
    }
    return b.totalScore - a.totalScore;
  });

  // Group counts
  const tierCounts = results.reduce((acc, r) => {
    acc[r.tier] = (acc[r.tier] || 0) + 1;
    return acc;
  }, {} as Record<Tier, number>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Batch Results</h2>
          <div className="flex items-center gap-3 text-sm">
            {(['A', 'B', 'C', 'D'] as Tier[]).map(tier => (
              tierCounts[tier] ? (
                <span key={tier} className={`flex items-center gap-1 ${tierColors[tier].text}`}>
                  <span className="font-semibold">Tier {tier}:</span> {tierCounts[tier]}
                </span>
              ) : null
            ))}
            {failedCompanies.length > 0 && (
              <span className="text-muted-foreground">
                {failedCompanies.length} failed
              </span>
            )}
          </div>
        </div>
        
        {results.length > 0 && (
          <Button
            onClick={onSaveAll}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            Save All ({results.length})
          </Button>
        )}
      </div>

      {/* Results List - flowing rows, no cards */}
      <div className="space-y-0">
        {sortedResults.map((prospect, index) => {
          const colors = tierColors[prospect.tier];
          const TierIcon = tierIcons[prospect.tier];
          
          return (
            <motion.div
              key={prospect.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div
                className="inline-row cursor-pointer group"
                onClick={() => setExpandedId(expandedId === prospect.id ? null : prospect.id)}
              >
                <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${colors.bg}`}>
                  <span className={`font-display text-xl font-bold ${colors.text}`}>
                    {prospect.tier}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {prospect.companyName}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <TierIcon className="h-3 w-3" />
                    {prospect.tierDefinition.action}
                  </p>
                </div>

                <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                  {prospect.totalScore}/100
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveOne(prospect);
                  }}
                  className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Save className="h-4 w-4" />
                </Button>

                <motion.div
                  animate={{ rotate: expandedId === prospect.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </div>

              {expandedId === prospect.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pl-14 pr-4 pb-6 space-y-4"
                >
                  {/* Signal breakdown - flowing list */}
                  <div className="pt-4 space-y-0">
                    {[...prospect.criteriaBreakdown]
                      .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
                      .map((criteria) => {
                        const percentage = Math.round((criteria.score / criteria.maxScore) * 100);
                        const isPoor = percentage < 40;
                        const isModerate = percentage >= 40 && percentage < 70;
                        
                        const getColor = () => {
                          if (isPoor) return 'text-destructive';
                          if (isModerate) return 'text-warning';
                          return 'text-success';
                        };
                        
                        return (
                          <div
                            key={criteria.criteriaId}
                            className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground">{criteria.criteriaName}</span>
                              <p className="text-xs text-muted-foreground truncate">{criteria.reasoning}</p>
                            </div>
                            <div className={`font-mono text-sm font-semibold shrink-0 ml-3 ${getColor()}`}>
                              {isPoor ? '−' : '+'}{criteria.score}
                              <span className="text-muted-foreground font-normal">/{criteria.maxScore}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Opening line - subtle, no card */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Opening Line</p>
                    <p className="text-sm italic text-foreground">"{prospect.openingLine}"</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Failed Companies - inline, subtle */}
        {failedCompanies.map((company, index) => (
          <motion.div
            key={`failed-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (results.length + index) * 0.05 }}
            className="inline-row opacity-50"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-destructive/15">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">{company}</p>
            </div>
            <Badge variant="outline" className="text-destructive border-destructive/30">
              Failed
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
