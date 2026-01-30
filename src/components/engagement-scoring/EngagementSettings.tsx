import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Settings2, Clock, Thermometer, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useEngagementSettings,
  useUpdateEngagementSettings,
  useEngagementTypes,
  useUpdateEngagementType,
} from '@/hooks/useEngagementScoring';
import { CATEGORY_LABELS, DECAY_PERIOD_OPTIONS, EngagementCategory } from '@/types/engagement-scoring';
import { toast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';

export function EngagementSettings() {
  const { data: settings, isLoading: settingsLoading } = useEngagementSettings();
  const { data: types, isLoading: typesLoading } = useEngagementTypes();
  const updateSettings = useUpdateEngagementSettings();
  const updateType = useUpdateEngagementType();

  const [localSettings, setLocalSettings] = useState<typeof settings | null>(null);
  const [localTypes, setLocalTypes] = useState<typeof types | null>(null);

  // Initialize local state when data loads
  if (settings && !localSettings) {
    setLocalSettings(settings);
  }
  if (types && !localTypes) {
    setLocalTypes(types);
  }

  const handleToggle = (enabled: boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, engagement_enabled: enabled });
    updateSettings.mutate({ engagement_enabled: enabled });
  };

  const handleDecayChange = (value: string) => {
    if (!localSettings) return;
    const decayDays = parseInt(value);
    setLocalSettings({ ...localSettings, decay_period_days: decayDays });
  };

  const handleThresholdChange = (field: 'cold_threshold' | 'warm_threshold' | 'hot_threshold', value: number) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handlePointsChange = (typeId: string, points: number) => {
    if (!localTypes) return;
    setLocalTypes(localTypes.map(t => t.id === typeId ? { ...t, current_points: points } : t));
  };

  const handleTypeToggle = (typeId: string, enabled: boolean) => {
    if (!localTypes) return;
    setLocalTypes(localTypes.map(t => t.id === typeId ? { ...t, enabled } : t));
    updateType.mutate({ id: typeId, enabled });
  };

  const handleSaveSettings = () => {
    if (!localSettings) return;
    updateSettings.mutate({
      decay_period_days: localSettings.decay_period_days,
      cold_threshold: localSettings.cold_threshold,
      warm_threshold: localSettings.warm_threshold,
      hot_threshold: localSettings.hot_threshold,
    });
  };

  const handleSavePoints = () => {
    if (!localTypes || !types) return;
    const changes = localTypes.filter(lt => {
      const original = types.find(t => t.id === lt.id);
      return original && original.current_points !== lt.current_points;
    });

    changes.forEach(change => {
      updateType.mutate({ id: change.id, current_points: change.current_points });
    });

    if (changes.length > 0) {
      toast({ title: 'Points Updated', description: `Updated ${changes.length} engagement type(s).` });
    }
  };

  const handleResetPoints = () => {
    if (!localTypes) return;
    setLocalTypes(localTypes.map(t => ({ ...t, current_points: t.default_points })));
  };

  const isLoading = settingsLoading || typesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const categories = [...new Set(localTypes?.map(t => t.category) || [])] as EngagementCategory[];

  const getIcon = (iconName: string) => {
    const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = iconMap[iconName] || Icons.Activity;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Engagement-Based Scoring</CardTitle>
                  <CardDescription>
                    Rank leads by interaction frequency with recency decay
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={localSettings?.engagement_enabled ?? false}
                onCheckedChange={handleToggle}
              />
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {localSettings?.engagement_enabled && (
        <Tabs defaultValue="decay" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="decay" className="gap-2">
              <Clock className="h-4 w-4" />
              Decay
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Points
            </TabsTrigger>
          </TabsList>

          {/* Decay Settings */}
          <TabsContent value="decay" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Recency Decay</CardTitle>
                <CardDescription>
                  Points decrease over time so recent activity counts more
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Half-life Period</Label>
                  <Select
                    value={String(localSettings.decay_period_days)}
                    onValueChange={handleDecayChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DECAY_PERIOD_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Points halve every {localSettings.decay_period_days} days. A lead inactive for{' '}
                    {localSettings.decay_period_days * 2} days keeps 25% of their score.
                  </p>
                </div>
                <Button onClick={handleSaveSettings} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save Decay Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threshold Settings */}
          <TabsContent value="thresholds" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base">Temperature Thresholds</CardTitle>
                <CardDescription>
                  Define score ranges for Cold, Warm, and Hot leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icons.Snowflake className="h-4 w-4 text-info" />
                      Cold (below)
                    </Label>
                    <Badge variant="outline">{localSettings.cold_threshold}</Badge>
                  </div>
                  <Slider
                    value={[localSettings.cold_threshold]}
                    onValueChange={([v]) => handleThresholdChange('cold_threshold', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icons.Sun className="h-4 w-4 text-warning" />
                      Warm (at or above)
                    </Label>
                    <Badge variant="outline">{localSettings.warm_threshold}</Badge>
                  </div>
                  <Slider
                    value={[localSettings.warm_threshold]}
                    onValueChange={([v]) => handleThresholdChange('warm_threshold', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Icons.Flame className="h-4 w-4 text-destructive" />
                      Hot (at or above)
                    </Label>
                    <Badge variant="outline">{localSettings.hot_threshold}</Badge>
                  </div>
                  <Slider
                    value={[localSettings.hot_threshold]}
                    onValueChange={([v]) => handleThresholdChange('hot_threshold', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <Button onClick={handleSaveSettings} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save Thresholds
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Point Values */}
          <TabsContent value="points" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Engagement Point Values</CardTitle>
                    <CardDescription>Configure points per interaction type</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleResetPoints} className="gap-2">
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {categories.map(category => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </h4>
                    <div className="space-y-2">
                      {localTypes
                        ?.filter(t => t.category === category)
                        .map(type => (
                          <div
                            key={type.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              type.enabled ? 'bg-secondary/30' : 'bg-muted/20 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={type.enabled}
                                onCheckedChange={(enabled) => handleTypeToggle(type.id, enabled)}
                              />
                              <div className="flex items-center gap-2">
                                {getIcon(type.icon)}
                                <span className="text-sm font-medium">{type.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={type.current_points}
                                onChange={(e) => handlePointsChange(type.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-center text-sm rounded border bg-background"
                                min={0}
                                max={100}
                                disabled={!type.enabled}
                              />
                              <span className="text-xs text-muted-foreground">pts</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                <Button onClick={handleSavePoints} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save Point Values
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
