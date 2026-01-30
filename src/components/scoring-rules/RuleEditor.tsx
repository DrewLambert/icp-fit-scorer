import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScoringRule, ConditionType, RuleCategory, CONDITION_TYPE_LABELS, CATEGORY_LABELS } from '@/types/scoring-rules';
import { Loader2 } from 'lucide-react';

interface RuleEditorProps {
  rule?: ScoringRule | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<ScoringRule, 'id' | 'created_at' | 'updated_at'>) => Promise<ScoringRule | null>;
  nextSortOrder: number;
}

const CONDITION_TYPES: ConditionType[] = [
  'job_title_contains',
  'email_domain_personal',
  'email_domain_business',
  'company_size_range',
  'industry_matches',
  'visited_pricing_page',
  'visited_product_page',
  'blog_only_engagement',
  'funding_stage',
  'region_matches',
  'custom',
];

const CATEGORIES: RuleCategory[] = ['demographic', 'firmographic', 'behavioral'];

export function RuleEditor({ rule, isOpen, onClose, onSave, nextSortOrder }: RuleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [conditionType, setConditionType] = useState<ConditionType>(rule?.condition_type || 'job_title_contains');
  const [conditionValue, setConditionValue] = useState(rule?.condition_value || '');
  const [points, setPoints] = useState(rule?.points?.toString() || '10');
  const [category, setCategory] = useState<RuleCategory>(rule?.category || 'demographic');

  const handleSave = async () => {
    if (!name.trim() || !conditionValue.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        condition_type: conditionType,
        condition_value: conditionValue.trim(),
        points: parseInt(points, 10) || 0,
        category,
        sort_order: rule?.sort_order ?? nextSortOrder,
        enabled: rule?.enabled ?? true,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getConditionPlaceholder = (): string => {
    switch (conditionType) {
      case 'job_title_contains':
        return 'VP, C-level, CEO, Director (comma-separated)';
      case 'email_domain_personal':
        return 'gmail.com, yahoo.com, hotmail.com';
      case 'company_size_range':
        return '50-200, 200-500, enterprise';
      case 'industry_matches':
        return 'SaaS, technology, healthcare';
      case 'visited_pricing_page':
        return 'true or multiple';
      case 'funding_stage':
        return 'Series A, Series B, seed';
      case 'region_matches':
        return 'North America, Europe, US';
      default:
        return 'Enter condition value';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Scoring Rule' : 'Create Scoring Rule'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VP or C-Level Title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rule evaluates"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condition Type</Label>
              <Select value={conditionType} onValueChange={(v) => setConditionType(v as ConditionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONDITION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as RuleCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition Value</Label>
            <Input
              id="condition"
              value={conditionValue}
              onChange={(e) => setConditionValue(e.target.value)}
              placeholder={getConditionPlaceholder()}
            />
            <p className="text-xs text-muted-foreground">
              Use comma-separated values for multiple matches
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="10"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              Use negative values for penalties (e.g., -10)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !conditionValue.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              rule ? 'Update Rule' : 'Create Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
