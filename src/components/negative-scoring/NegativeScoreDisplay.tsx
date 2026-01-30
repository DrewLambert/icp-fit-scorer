import { motion } from 'framer-motion';
import { ShieldOff, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NegativeScoreResult, TriggeredRule } from '@/types/negative-scoring';

interface NegativeScoreDisplayProps {
  score: NegativeScoreResult;
  showDetails?: boolean;
  compact?: boolean;
}

export function NegativeScoreDisplay({ score, showDetails = true, compact = false }: NegativeScoreDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (score.triggeredRules.length === 0) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle className="h-4 w-4" />
        <span>No negative signals</span>
      </div>
    );
  }

  if (compact) {
    return (
      <Badge 
        className={`${
          score.isDisqualified 
            ? 'bg-destructive/20 text-destructive border-destructive/30' 
            : 'bg-warning/20 text-warning border-warning/30'
        }`}
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {score.totalScore} pts
      </Badge>
    );
  }

  return (
    <Card className={`border ${score.isDisqualified ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
      <CardHeader className="py-3 px-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {score.isDisqualified ? (
              <ShieldOff className="h-5 w-5 text-destructive" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            <CardTitle className="text-sm font-medium">
              {score.isDisqualified ? 'Disqualified' : 'Negative Signals'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={score.isDisqualified ? 'text-destructive' : 'text-warning'}>
              {score.totalScore} pts
            </Badge>
            <Badge variant="outline">
              {score.triggeredRules.length} rules
            </Badge>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && showDetails && (
        <CardContent className="pt-0 pb-4">
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            {score.triggeredRules.map((rule, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded bg-secondary/30"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <span className="text-sm font-medium">{rule.rule_name}</span>
                    <p className="text-xs text-muted-foreground">{rule.reason}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-destructive">
                  {rule.points}
                </Badge>
              </div>
            ))}
          </motion.div>
        </CardContent>
      )}
    </Card>
  );
}
