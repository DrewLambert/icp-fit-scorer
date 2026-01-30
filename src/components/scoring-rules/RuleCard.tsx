import { motion } from 'framer-motion';
import { ScoringRule, CATEGORY_LABELS, CATEGORY_COLORS, CONDITION_TYPE_LABELS } from '@/types/scoring-rules';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { formatPoints } from '@/lib/rule-scoring-engine';

interface RuleCardProps {
  rule: ScoringRule;
  index: number;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: ScoringRule) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function RuleCard({ rule, index, onToggle, onEdit, onDelete, dragHandleProps }: RuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-4 ${!rule.enabled ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div 
          className="flex items-center gap-2 pt-1 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground transition-colors"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{rule.name}</h4>
            <Badge variant="outline" className={CATEGORY_COLORS[rule.category]}>
              {CATEGORY_LABELS[rule.category]}
            </Badge>
          </div>

          {rule.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              {rule.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {CONDITION_TYPE_LABELS[rule.condition_type]}:
            </span>
            <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-foreground">
              {rule.condition_value}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-mono font-semibold text-lg ${
            rule.points >= 0 ? 'text-success' : 'text-destructive'
          }`}>
            {formatPoints(rule.points)}
          </span>

          <Switch
            checked={rule.enabled}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(rule)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(rule.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
