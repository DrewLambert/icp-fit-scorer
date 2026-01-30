import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useScoringRules } from '@/hooks/useScoringRules';
import { ScoringRule } from '@/types/scoring-rules';
import { SortableRuleCard } from './SortableRuleCard';
import { RuleEditor } from './RuleEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Calculator, Target, Loader2 } from 'lucide-react';

export function RuleBasedSettings() {
  const {
    rules,
    settings,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleEnabled,
    reorderRules,
    toggleRuleBasedScoring,
    setQualificationThreshold,
  } = useScoringRules();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState(settings?.qualification_threshold?.toString() || '50');
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(rules, oldIndex, newIndex).map((rule, index) => ({
        ...rule,
        sort_order: index + 1,
      }));
      reorderRules(reordered);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEditRule = (rule: ScoringRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSaveRule = async (ruleData: Omit<ScoringRule, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingRule) {
      return updateRule(editingRule.id, ruleData);
    }
    return createRule(ruleData);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteRule(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleThresholdBlur = async () => {
    const value = parseInt(thresholdInput, 10);
    if (!isNaN(value) && value !== settings?.qualification_threshold) {
      setIsUpdatingThreshold(true);
      await setQualificationThreshold(value);
      setIsUpdatingThreshold(false);
    }
  };

  const nextSortOrder = rules.length > 0 ? Math.max(...rules.map(r => r.sort_order)) + 1 : 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Rule-Based Lead Scoring
                {settings?.rule_based_enabled && (
                  <Badge className="bg-success/20 text-success border-success/30">Active</Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Assign fixed point values based on predefined criteria
              </p>
            </div>
          </div>

          <Switch
            checked={settings?.rule_based_enabled || false}
            onCheckedChange={toggleRuleBasedScoring}
          />
        </div>

        {/* Qualification Threshold */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <Target className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <Label htmlFor="threshold" className="text-sm font-medium">
              Qualification Threshold
            </Label>
            <p className="text-xs text-muted-foreground">
              Leads scoring at or above this value are marked "Sales Qualified"
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="threshold"
              type="number"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              onBlur={handleThresholdBlur}
              className="w-20 text-center"
            />
            {isUpdatingThreshold && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">points</span>
          </div>
        </div>
      </motion.div>

      {/* Rules Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground">
          Scoring Rules ({rules.length})
        </h4>
        <Button onClick={handleCreateRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass-card"
          >
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground mb-2">No scoring rules yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create rules to automatically score leads based on their attributes
            </p>
            <Button onClick={handleCreateRule} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Rule
            </Button>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rules.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {rules.map((rule, index) => (
                <SortableRuleCard
                  key={rule.id}
                  rule={rule}
                  index={index}
                  onToggle={toggleRuleEnabled}
                  onEdit={handleEditRule}
                  onDelete={(id) => setDeleteConfirmId(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Rule Editor Dialog */}
      <RuleEditor
        rule={editingRule}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveRule}
        nextSortOrder={nextSortOrder}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scoring Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
