import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProspectScore, Tier } from '@/types/icp';
import { ChevronDown, Trash2, Zap, TrendingUp, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ProspectRowProps {
  prospect: ProspectScore;
  onDelete: (id: string) => void;
  isComparing?: boolean;
  onToggleCompare?: () => void;
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

export function ProspectRow({ 
  prospect, 
  onDelete, 
  isComparing,
  onToggleCompare 
}: ProspectRowProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = tierColors[prospect.tier];
  const TierIcon = tierIcons[prospect.tier];

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div 
        className="inline-row cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        {onToggleCompare && (
          <input
            type="checkbox"
            checked={isComparing}
            onChange={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
            className="h-4 w-4 rounded border-border bg-secondary accent-primary"
          />
        )}
        
        {/* Tier Badge */}
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

        <span className="text-xs text-muted-foreground hidden sm:block">
          {new Date(prospect.createdAt).toLocaleDateString()}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(prospect.id);
          }}
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="pl-14 pr-4 pb-6 space-y-6"
        >
          {/* Signal breakdown - no card wrapper */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label">Signal Breakdown</span>
              {prospect.scoringMode === 'advanced' && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">GTM Partners</Badge>
              )}
            </div>
            <div className="space-y-0">
              {[...prospect.criteriaBreakdown]
                .sort((a, b) => {
                  if (prospect.scoringMode === 'advanced' && a.advancedScore !== undefined && b.advancedScore !== undefined) {
                    return b.advancedScore - a.advancedScore;
                  }
                  return (b.score / b.maxScore) - (a.score / a.maxScore);
                })
                .map((criteria) => {
                  const hasAdvancedScore = prospect.scoringMode === 'advanced' && criteria.advancedScore !== undefined;
                  const percentage = Math.round((criteria.score / criteria.maxScore) * 100);
                  const isPoor = percentage < 40;
                  const isModerate = percentage >= 40 && percentage < 70;
                  const isNegative = hasAdvancedScore && criteria.advancedScore! < 0;
                  
                  const getColor = () => {
                    if (hasAdvancedScore) {
                      return isNegative ? 'text-destructive' : 'text-success';
                    }
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
                        {hasAdvancedScore ? (
                          <>
                            {criteria.advancedScore! > 0 ? '+' : ''}{criteria.advancedScore}
                          </>
                        ) : (
                          <>
                            {isPoor ? '−' : '+'}{criteria.score}
                            <span className="text-muted-foreground font-normal">/{criteria.maxScore}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Total */}
            <div className="organic-divider !my-4" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">
                {prospect.scoringMode === 'advanced' ? 'Net Score' : 'Total'}
              </span>
              {prospect.scoringMode === 'advanced' ? (
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${
                    prospect.criteriaBreakdown.reduce((sum, c) => sum + (c.advancedScore || 0), 0) >= 0 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {(() => {
                      const total = prospect.criteriaBreakdown.reduce((sum, c) => sum + (c.advancedScore || 0), 0);
                      return total > 0 ? `+${total}` : total;
                    })()}
                  </span>
                  <span className="text-xs text-muted-foreground">(max +{prospect.criteriaBreakdown.length * 5})</span>
                </div>
              ) : (
                <span className="font-mono font-bold text-primary">{prospect.totalScore}/100</span>
              )}
            </div>
          </div>
          
          {/* Outreach - flowing sections */}
          <div className="space-y-4">
            <span className="section-label">Outreach</span>
            {prospect.outreach ? (
              <div className="space-y-3">
                {[
                  { label: 'Subject', content: prospect.outreach.subjectLine, color: 'text-primary' },
                  { label: 'Opening', content: prospect.outreach.openingLine, color: 'text-success' },
                  { label: 'Value Hook', content: prospect.outreach.valueHook, color: 'text-warning' },
                  { label: 'CTA', content: prospect.outreach.cta, color: 'text-primary' },
                ].map((item) => (
                  <div key={item.label} className="py-2 border-b border-border/20 last:border-0">
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${item.color}`}>{item.label}</p>
                    <p className="text-foreground text-sm">{item.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-1">Opening Line</p>
                <p className="text-foreground italic">"{prospect.openingLine}"</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
