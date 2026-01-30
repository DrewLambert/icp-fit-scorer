import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Minus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  useNegativeScoringRules,
  useCreateNegativeRule,
  useUpdateNegativeRule,
} from '@/hooks/useNegativeScoring';
import {
  NegativeConditionType,
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_DESCRIPTIONS,
  DEFAULT_PERSONAL_EMAIL_DOMAINS,
} from '@/types/negative-scoring';

interface NegativeRuleEditorProps {
  ruleId?: string | null;
  onClose: () => void;
}

export function NegativeRuleEditor({ ruleId, onClose }: NegativeRuleEditorProps) {
  const { data: rules } = useNegativeScoringRules();
  const createRule = useCreateNegativeRule();
  const updateRule = useUpdateNegativeRule();

  const existingRule = ruleId ? rules?.find(r => r.id === ruleId) : null;

  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState<NegativeConditionType>('custom');
  const [conditionValue, setConditionValue] = useState('');
  const [points, setPoints] = useState(-10);
  const [reasonLabel, setReasonLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (existingRule) {
      setName(existingRule.name);
      setConditionType(existingRule.condition_type as NegativeConditionType);
      setConditionValue(existingRule.condition_value);
      setPoints(existingRule.points);
      setReasonLabel(existingRule.reason_label);
      setDescription(existingRule.description || '');
    }
  }, [existingRule]);

  useEffect(() => {
    // Auto-fill defaults for certain condition types
    if (!existingRule && conditionType === 'personal_email' && !conditionValue) {
      setConditionValue(DEFAULT_PERSONAL_EMAIL_DOMAINS.join(','));
    }
  }, [conditionType, existingRule]);

  const handleSubmit = () => {
    if (!name || !reasonLabel) return;

    const ruleData = {
      name,
      condition_type: conditionType,
      condition_value: conditionValue,
      points,
      reason_label: reasonLabel,
      description: description || null,
      enabled: true,
      sort_order: (rules?.length || 0) + 1,
    };

    if (existingRule) {
      updateRule.mutate({ id: existingRule.id, ...ruleData }, { onSuccess: onClose });
    } else {
      createRule.mutate(ruleData, { onSuccess: onClose });
    }
  };

  const conditionTypes = Object.entries(CONDITION_TYPE_LABELS) as [NegativeConditionType, string][];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingRule ? 'Edit Rule' : 'Add Negative Rule'}</DialogTitle>
          <DialogDescription>
            Define conditions that deduct points from leads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal Email Domain"
            />
          </div>

          <div className="space-y-2">
            <Label>Condition Type</Label>
            <Select value={conditionType} onValueChange={(v) => setConditionType(v as NegativeConditionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionTypes.map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {CONDITION_TYPE_DESCRIPTIONS[conditionType]}
            </p>
          </div>

          {(conditionType === 'personal_email' || conditionType === 'custom') && (
            <div className="space-y-2">
              <Label>
                {conditionType === 'personal_email' ? 'Email Domains (comma-separated)' : 'Condition Value'}
              </Label>
              <Textarea
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder={
                  conditionType === 'personal_email'
                    ? 'gmail.com, yahoo.com, hotmail.com'
                    : 'Enter condition value...'
                }
                rows={3}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-destructive" />
                Point Deduction
              </Label>
              <Badge variant="outline" className="text-destructive border-destructive/30">
                {points} points
              </Badge>
            </div>
            <Slider
              value={[Math.abs(points)]}
              onValueChange={([v]) => setPoints(-v)}
              min={1}
              max={50}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason Label</Label>
            <Input
              value={reasonLabel}
              onChange={(e) => setReasonLabel(e.target.value)}
              placeholder="e.g., Uses personal email"
            />
            <p className="text-xs text-muted-foreground">
              Short label shown when this rule triggers
            </p>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why this rule matters..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !reasonLabel || createRule.isPending || updateRule.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {existingRule ? 'Save Changes' : 'Create Rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
