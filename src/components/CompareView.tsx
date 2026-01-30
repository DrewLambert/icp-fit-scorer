import { motion } from 'framer-motion';
import { ProspectScore, Tier } from '@/types/icp';
import { ScoreGauge } from './ScoreGauge';
import { X, Zap, TrendingUp, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompareViewProps {
  prospects: ProspectScore[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

const tierColors: Record<Tier, string> = {
  A: 'text-success',
  B: 'text-primary',
  C: 'text-warning',
  D: 'text-destructive',
};

const tierIcons: Record<Tier, typeof Zap> = {
  A: Zap,
  B: TrendingUp,
  C: Clock,
  D: XCircle,
};

export function CompareView({ prospects, onRemove, onClose }: CompareViewProps) {
  if (prospects.length < 2) return null;

  // Sort by tier for comparison
  const sorted = [...prospects].sort((a, b) => {
    const tierOrder = { A: 0, B: 1, C: 2, D: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card w-full max-w-6xl max-h-[90vh] overflow-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-sm px-6 py-4">
          <h2 className="text-xl font-bold">Compare Prospects</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${sorted.length}, 1fr)` }}>
            {sorted.map((prospect) => {
              const TierIcon = tierIcons[prospect.tier];
              
              return (
                <div key={prospect.id} className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {prospect.companyName}
                    </h3>
                    <ScoreGauge score={prospect.totalScore} size={160} animate={false} />
                  </div>

                  <div className="space-y-3">
                    {prospect.criteriaBreakdown.map((criteria) => {
                      const percentage = Math.round((criteria.score / criteria.maxScore) * 100);
                      
                      return (
                        <div key={criteria.criteriaId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{criteria.criteriaName}</span>
                            <span className="font-medium">{criteria.score}/{criteria.maxScore}</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentage >= 80 ? 'bg-success' :
                                percentage >= 60 ? 'bg-primary' :
                                percentage >= 40 ? 'bg-warning' : 'bg-destructive'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onRemove(prospect.id)}
                  >
                    Remove from comparison
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
