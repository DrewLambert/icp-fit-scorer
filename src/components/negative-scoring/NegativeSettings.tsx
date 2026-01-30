import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, Settings2, AlertTriangle, Minus, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useNegativeScoringSettings,
  useUpdateNegativeScoringSettings,
  useNegativeScoringRules,
  useUpdateNegativeRule,
  useDeleteNegativeRule,
} from '@/hooks/useNegativeScoring';
import { NegativeRuleEditor } from './NegativeRuleEditor';
import { DisqualifiedLeadsView } from './DisqualifiedLeadsView';
import { CONDITION_TYPE_LABELS, CONDITION_TYPE_ICONS } from '@/types/negative-scoring';
import * as Icons from 'lucide-react';

export function NegativeSettings() {
  const { data: settings, isLoading: settingsLoading } = useNegativeScoringSettings();
  const { data: rules, isLoading: rulesLoading } = useNegativeScoringRules();
  const updateSettings = useUpdateNegativeScoringSettings();
  const updateRule = useUpdateNegativeRule();
  const deleteRule = useDeleteNegativeRule();

  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const handleToggle = (enabled: boolean) => {
    updateSettings.mutate({ negative_enabled: enabled });
  };

  const handleThresholdChange = (value: number) => {
    updateSettings.mutate({ disqualification_threshold: value });
  };

  const handleSubtractToggle = (enabled: boolean) => {
    updateSettings.mutate({ subtract_from_other_models: enabled });
  };

  const handleAutoDisqualifyToggle = (enabled: boolean) => {
    updateSettings.mutate({ auto_disqualify: enabled });
  };

  const handleRuleToggle = (ruleId: string, enabled: boolean) => {
    updateRule.mutate({ id: ruleId, enabled });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule.mutate(ruleId);
    }
  };

  const getIcon = (iconName: string) => {
    const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = iconMap[iconName] || Icons.AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  if (settingsLoading || rulesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-destructive/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ShieldOff className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Negative Lead Scoring</CardTitle>
                  <CardDescription>
                    Disqualify bad-fit leads with negative point deductions
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={settings?.negative_enabled ?? false}
                onCheckedChange={handleToggle}
              />
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {settings?.negative_enabled && (
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="disqualified" className="gap-2">
              <ShieldOff className="h-4 w-4" />
              Disqualified
            </TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-muted-foreground">
                {rules?.filter(r => r.enabled).length || 0} active rules
              </h3>
              <Button onClick={() => setShowRuleEditor(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-3">
              {rules?.map((rule, index) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    rule.enabled
                      ? 'bg-destructive/5 border-destructive/30'
                      : 'bg-muted/20 border-border opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => handleRuleToggle(rule.id, enabled)}
                      />
                      <div className="flex items-center gap-2 text-destructive">
                        {getIcon(CONDITION_TYPE_ICONS[rule.condition_type as keyof typeof CONDITION_TYPE_ICONS] || 'AlertTriangle')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            {rule.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{rule.reason_label}</p>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(rule.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Disqualification Settings</CardTitle>
                <CardDescription>
                  Configure when leads should be automatically disqualified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-destructive" />
                      Disqualification Threshold
                    </Label>
                    <Badge variant="outline" className="text-destructive">
                      {settings.disqualification_threshold} points
                    </Badge>
                  </div>
                  <Slider
                    value={[Math.abs(settings.disqualification_threshold)]}
                    onValueChange={([v]) => handleThresholdChange(-v)}
                    min={5}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leads with a negative score at or below {settings.disqualification_threshold} will be flagged
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-disqualify leads</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically tag leads when they hit the threshold
                      </p>
                    </div>
                    <Switch
                      checked={settings.auto_disqualify}
                      onCheckedChange={handleAutoDisqualifyToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Subtract from other models</Label>
                      <p className="text-xs text-muted-foreground">
                        Deduct negative points from other scoring model totals
                      </p>
                    </div>
                    <Switch
                      checked={settings.subtract_from_other_models}
                      onCheckedChange={handleSubtractToggle}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disqualified Leads Tab */}
          <TabsContent value="disqualified" className="mt-4">
            <DisqualifiedLeadsView />
          </TabsContent>
        </Tabs>
      )}

      {/* Rule Editor Modal */}
      {(showRuleEditor || editingRule) && (
        <NegativeRuleEditor
          ruleId={editingRule}
          onClose={() => {
            setShowRuleEditor(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}
