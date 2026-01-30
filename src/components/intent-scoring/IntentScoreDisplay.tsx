import { motion } from 'framer-motion';
import { IntentScore } from '@/types/intent-scoring';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Eye, Zap } from 'lucide-react';

interface IntentScoreDisplayProps {
  score: IntentScore;
  compact?: boolean;
}

export function IntentScoreDisplay({ score, compact = false }: IntentScoreDisplayProps) {
  const getScoreColor = (value: number): string => {
    if (value >= 70) return 'text-success';
    if (value >= 40) return 'text-warning';
    return 'text-muted-foreground';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-orange-400" />
        <span className={`font-mono font-bold text-lg ${getScoreColor(score.score)}`}>
          {score.score}
        </span>
        {score.isInMarket && (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
            <Zap className="h-3 w-3" />
            In-Market
          </Badge>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-orange-500/5 to-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Target className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Intent Score
              </p>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-2xl ${getScoreColor(score.score)}`}>
                  {score.score}
                </span>
                {score.isInMarket && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
                    <Zap className="h-3 w-3" />
                    In-Market
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">First-Party</span>
          </div>
          <span className="font-mono font-semibold">{score.firstPartyScore}</span>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Third-Party</span>
          </div>
          <span className="font-mono font-semibold">{score.thirdPartyScore}</span>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Signals</span>
          </div>
          <span className="font-mono font-semibold">{score.signalCount}</span>
        </div>
      </div>
    </motion.div>
  );
}
