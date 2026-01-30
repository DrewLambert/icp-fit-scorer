import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePredictiveScoring } from '@/hooks/usePredictiveScoring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  TrendingUp,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PredictiveSettings() {
  const {
    settings,
    modelState,
    dealCount,
    isLoading,
    isTraining,
    hasEnoughData,
    togglePredictiveScoring,
    updateMinThreshold,
    trainModel,
  } = usePredictiveScoring();

  const [thresholdInput, setThresholdInput] = useState(
    settings?.min_deals_threshold?.toString() || '50'
  );

  const handleThresholdBlur = () => {
    const value = parseInt(thresholdInput, 10);
    if (!isNaN(value) && value !== settings?.min_deals_threshold) {
      updateMinThreshold(value);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const minThreshold = settings?.min_deals_threshold || 50;
  const dataProgress = Math.min(100, (dealCount / minThreshold) * 100);

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Predictive Lead Scoring
                {settings?.predictive_enabled && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    AI-Powered
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Predict conversion likelihood using historical deal patterns
              </p>
            </div>
          </div>

          <Switch
            checked={settings?.predictive_enabled || false}
            onCheckedChange={togglePredictiveScoring}
            disabled={!hasEnoughData && !settings?.predictive_enabled}
          />
        </div>

        {/* Data Threshold Section */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Training Data</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {dealCount} / {minThreshold} deals
            </span>
          </div>

          <Progress value={dataProgress} className="h-2" />

          {!hasEnoughData ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">Insufficient Data</p>
                <p className="text-xs text-muted-foreground">
                  Need at least {minThreshold} closed deals to generate predictions. 
                  Currently have {dealCount} deals.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Sufficient data for training</span>
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="min-threshold" className="text-sm whitespace-nowrap">
                Min deals threshold:
              </Label>
              <Input
                id="min-threshold"
                type="number"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                onBlur={handleThresholdBlur}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Model Status Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">Model Status</h4>
          <Button
            onClick={trainModel}
            disabled={isTraining || !hasEnoughData}
            className="gap-2"
          >
            {isTraining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {modelState?.training_status === 'trained' ? 'Recalculate' : 'Train Model'}
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              {modelState?.training_status === 'trained' ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : modelState?.training_status === 'training' ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : modelState?.training_status === 'error' ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">Status</span>
            </div>
            <p className="font-medium text-foreground capitalize">
              {modelState?.training_status || 'Untrained'}
            </p>
          </div>

          {/* Last Trained */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Trained</span>
            </div>
            <p className="font-medium text-foreground">
              {modelState?.last_trained_at
                ? formatDistanceToNow(new Date(modelState.last_trained_at), { addSuffix: true })
                : 'Never'}
            </p>
          </div>

          {/* Records Used */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Records Used</span>
            </div>
            <p className="font-medium text-foreground">
              {modelState?.total_records || 0}
              <span className="text-xs text-muted-foreground ml-1">
                ({modelState?.won_records || 0} won, {modelState?.lost_records || 0} lost)
              </span>
            </p>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Accuracy</span>
            </div>
            <p className="font-medium text-foreground">
              {modelState?.accuracy_score != null
                ? `${modelState.accuracy_score.toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {modelState?.training_status === 'error' && modelState?.error_message && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Training Error</p>
                <p className="text-xs text-muted-foreground">{modelState.error_message}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h4 className="font-semibold text-foreground mb-3">How It Works</h4>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            The predictive model analyzes patterns in your historical closed-won and closed-lost 
            deals to calculate conversion probability for new leads.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="font-medium text-foreground mb-1">Attributes Analyzed</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Industry & Company Size</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Job Title / Seniority</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Source Channel</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Funding Stage & Region</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Engagement Score</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="font-medium text-foreground mb-1">Output</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />0-100% conversion probability</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Confidence level indicator</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Factor-by-factor breakdown</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Positive/negative signals</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
