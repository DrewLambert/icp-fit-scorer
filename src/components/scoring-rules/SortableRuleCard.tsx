import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScoringRule } from '@/types/scoring-rules';
import { RuleCard } from './RuleCard';

interface SortableRuleCardProps {
  rule: ScoringRule;
  index: number;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: ScoringRule) => void;
  onDelete: (id: string) => void;
}

export function SortableRuleCard({ rule, index, onToggle, onEdit, onDelete }: SortableRuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <RuleCard
        rule={rule}
        index={index}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
