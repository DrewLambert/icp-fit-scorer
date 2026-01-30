import { lazy, Suspense } from 'react';
import { CriteriaWeightSlider } from '@/components/CriteriaWeightSlider';
import { useICPStore } from '@/stores/icpStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Loader2 } from 'lucide-react';
import { DEFAULT_CRITERIA, ScoringMode } from '@/types/icp';
import { toast } from '@/hooks/use-toast';
import { RuleBasedSettings } from '@/components/scoring-rules';

const PredictiveSettings = lazy(() => import('@/components/predictive-scoring').then(m => ({ default: m.PredictiveSettings })));
const IntentSettings = lazy(() => import('@/components/intent-scoring').then(m => ({ default: m.IntentSettings })));
const EngagementSettings = lazy(() => import('@/components/engagement-scoring').then(m => ({ default: m.EngagementSettings })));
const NegativeSettings = lazy(() => import('@/components/negative-scoring').then(m => ({ default: m.NegativeSettings })));

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 text-primary animate-spin" />
    </div>
  );
}

export default function SetupPage() {
  const { criteria, updateCriteriaWeight, setCriteria, scoringMode, setScoringMode } = useICPStore();

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValidWeight = totalWeight === 100;

  const handleReset = () => {
    setCriteria(DEFAULT_CRITERIA);
    toast({
      title: 'Criteria Reset',
      description: 'All weights have been restored to defaults.',
    });
  };

  const handleSave = () => {
    if (!isValidWeight) {
      toast({
        title: 'Invalid Configuration',
        description: `Total weight must equal 100%. Current: ${totalWeight}%`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Configuration Saved',
      description: 'Your ICP criteria have been updated.',
    });
  };

  const handleModeChange = (mode: ScoringMode) => {
    setScoringMode(mode);
    toast({
      title: mode === 'advanced' ? 'Advanced Mode Enabled' : 'Standard Mode Enabled',
      description: mode === 'advanced'
        ? 'Using GTM Partners -5 to +5 discrete scoring framework.'
        : 'Using standard 0 to 100 weighted scoring.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      <div className="space-y-4 pt-8">
        <h1 className="text-h1 text-foreground">
          Configuration
        </h1>
        <p className="text-muted-foreground max-w-xl text-body-lg">
          Configure AI-powered scoring criteria or set up rule-based lead qualification
        </p>
      </div>

      <Tabs defaultValue="ai-scoring" className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-2 mb-12 bg-transparent p-0">
          <TabsTrigger value="ai-scoring" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            AI
          </TabsTrigger>
          <TabsTrigger value="rule-based" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Rules
          </TabsTrigger>
          <TabsTrigger value="predictive" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Predictive
          </TabsTrigger>
          <TabsTrigger value="intent" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Intent
          </TabsTrigger>
          <TabsTrigger value="engagement" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Engage
          </TabsTrigger>
          <TabsTrigger value="negative" className="text-xs px-5 py-2 rounded bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Negative
          </TabsTrigger>
        </TabsList>

        {/* AI Scoring Tab */}
        <TabsContent value="ai-scoring" className="space-y-8">
          {/* Scoring Mode Toggle */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Scoring Framework
                {scoringMode === 'advanced' && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how criteria are scored during analysis
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleModeChange('standard')}
                className={`flex-1 p-5 rounded-lg text-left transition-colors duration-150 ${
                  scoringMode === 'standard'
                    ? 'bg-primary/10 ring-2 ring-primary/30'
                    : 'bg-secondary hover:bg-muted'
                }`}
              >
                <span className="font-semibold text-foreground">Standard</span>
                <p className="text-xs text-muted-foreground mt-2">
                  0 to 100 weighted scoring. Each criterion scored from 0 to its weight.
                </p>
              </button>

              <button
                onClick={() => handleModeChange('advanced')}
                className={`flex-1 p-5 rounded-lg text-left transition-colors duration-150 ${
                  scoringMode === 'advanced'
                    ? 'bg-primary/10 ring-2 ring-primary/30'
                    : 'bg-secondary hover:bg-muted'
                }`}
              >
                <span className="font-semibold text-foreground">GTM Partners</span>
                <p className="text-xs text-muted-foreground mt-2">
                  -5 to +5 discrete scores only. Forces clear fit/no-fit decisions.
                </p>
                <div className="flex gap-1 mt-3">
                  {[-5, -3, -1, 1, 3, 5].map((score) => (
                    <span
                      key={score}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        score < 0 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                      }`}
                    >
                      {score > 0 ? '+' : ''}{score}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Weight Status */}
          <div
            className={`text-center py-3 px-4 rounded inline-flex items-center gap-2 ${
              isValidWeight
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}
            style={{ display: 'block', width: 'fit-content' }}
          >
            <span className="font-semibold">Total Weight: {totalWeight}%</span>
            {!isValidWeight && (
              <span className="text-sm ml-2">
                ({totalWeight < 100 ? `${100 - totalWeight}% remaining` : `${totalWeight - 100}% over`})
              </span>
            )}
          </div>

          {/* Criteria */}
          <div>
            {criteria.map((criterion, index) => (
              <CriteriaWeightSlider
                key={criterion.id}
                criteria={criterion}
                onWeightChange={(weight) => updateCriteriaWeight(criterion.id, weight)}
                index={index}
              />
            ))}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>

            <Button
              onClick={handleSave}
              disabled={!isValidWeight}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        {/* Rule-Based Scoring Tab */}
        <TabsContent value="rule-based">
          <RuleBasedSettings />
        </TabsContent>

        {/* Predictive Scoring Tab */}
        <TabsContent value="predictive">
          <Suspense fallback={<TabLoader />}>
            <PredictiveSettings />
          </Suspense>
        </TabsContent>

        {/* Intent-Based Scoring Tab */}
        <TabsContent value="intent">
          <Suspense fallback={<TabLoader />}>
            <IntentSettings />
          </Suspense>
        </TabsContent>

        {/* Engagement-Based Scoring Tab */}
        <TabsContent value="engagement">
          <Suspense fallback={<TabLoader />}>
            <EngagementSettings />
          </Suspense>
        </TabsContent>

        {/* Negative Lead Scoring Tab */}
        <TabsContent value="negative">
          <Suspense fallback={<TabLoader />}>
            <NegativeSettings />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
