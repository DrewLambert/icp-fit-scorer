import { motion } from 'framer-motion';
import { PredictiveScore, getConfidenceColor, getImpactColor } from '@/types/predictive-scoring';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Brain } from 'lucide-react';

interface PredictiveScoreDisplayProps {
  score: PredictiveScore;
  compact?: boolean;
}

export function PredictiveScoreDisplay({ score, compact = false }: PredictiveScoreDisplayProps) {
  const getScoreColor = (value: number): string => {
    if (value >= 70) return 'text-success';
    if (value >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const ImpactIcon = ({ impact }: { impact: 'positive' | 'negative' | 'neutral' }) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      case 'neutral':
        return <Minus className="h-3 w-3" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-400" />
        <span className={`font-mono font-bold text-lg ${getScoreColor(score.score)}`}>
          {score.score}%
        </span>
        <Badge variant="outline" className={getConfidenceColor(score.confidence)}>
          {score.confidence}
        </Badge>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Conversion Probability
              </p>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-2xl ${getScoreColor(score.score)}`}>
                  {score.score}%
                </span>
                <Badge variant="outline" className={getConfidenceColor(score.confidence)}>
                  {score.confidence} confidence
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {score.factors.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Contributing Factors
          </p>
          <div className="space-y-2">
            {score.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center gap-2">
                  <div className={getImpactColor(factor.impact)}>
                    <ImpactIcon impact={factor.impact} />
                  </div>
                  <span className="text-sm text-foreground">{factor.factor}</span>
                </div>
                <span className="text-sm text-muted-foreground">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
