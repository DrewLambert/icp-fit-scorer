import { motion } from 'framer-motion';
import { RuleBasedScore } from '@/types/scoring-rules';
import { Badge } from '@/components/ui/badge';
import { formatPoints, getQualificationLabel } from '@/lib/rule-scoring-engine';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types/scoring-rules';

interface RuleScoreDisplayProps {
  score: RuleBasedScore;
  compact?: boolean;
}

export function RuleScoreDisplay({ score, compact = false }: RuleScoreDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const matchedRules = score.matchedRules.filter(m => m.matched);
  const unmatchedRules = score.matchedRules.filter(m => !m.matched);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono font-bold text-lg ${
          score.totalPoints >= 0 ? 'text-success' : 'text-destructive'
        }`}>
          {formatPoints(score.totalPoints)}
        </span>
        <Badge
          variant="outline"
          className={score.isQualified 
            ? 'bg-success/20 text-success border-success/30' 
            : 'bg-muted text-muted-foreground border-border'
          }
        >
          {getQualificationLabel(score.isQualified)}
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
      <div className="p-4 border-b border-border/50 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`font-mono font-bold text-2xl ${
              score.totalPoints >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatPoints(score.totalPoints)}
            </span>
            <div>
              <Badge
                variant="outline"
                className={score.isQualified 
                  ? 'bg-success/20 text-success border-success/30' 
                  : 'bg-muted text-muted-foreground border-border'
                }
              >
                {getQualificationLabel(score.isQualified)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Threshold: {score.qualificationThreshold} points
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? 'Hide' : 'Show'} Rules
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Matched Rules */}
          {matchedRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Matched Rules ({matchedRules.length})
              </h4>
              <div className="space-y-2">
                {matchedRules.map(({ rule, reason }) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded bg-success/5 border border-success/20"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={CATEGORY_COLORS[rule.category]}>
                        {CATEGORY_LABELS[rule.category]}
                      </Badge>
                      <span className="text-sm text-foreground">{rule.name}</span>
                    </div>
                    <span className={`font-mono font-semibold ${
                      rule.points >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatPoints(rule.points)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched Rules */}
          {unmatchedRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                Not Matched ({unmatchedRules.length})
              </h4>
              <div className="space-y-1">
                {unmatchedRules.map(({ rule }) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded bg-secondary/30 text-muted-foreground"
                  >
                    <span className="text-sm">{rule.name}</span>
                    <span className="font-mono text-sm">
                      {formatPoints(rule.points)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
