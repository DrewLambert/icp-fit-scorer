// Predictive lead scoring types

export interface PredictiveSettings {
  id: string;
  predictive_enabled: boolean;
  min_deals_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface PredictiveModelState {
  id: string;
  feature_weights: FeatureWeights;
  total_records: number;
  won_records: number;
  lost_records: number;
  accuracy_score: number | null;
  last_trained_at: string | null;
  training_status: 'untrained' | 'training' | 'trained' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureWeights {
  industry: Record<string, number>;
  company_size: Record<string, number>;
  job_title: Record<string, number>;
  source_channel: Record<string, number>;
  funding_stage: Record<string, number>;
  region: Record<string, number>;
  engagement_score_avg: number;
  engagement_score_weight: number;
  base_conversion_rate: number;
}

export interface HistoricalDeal {
  id: string;
  company_name: string;
  industry: string | null;
  company_size: string | null;
  job_title: string | null;
  source_channel: string | null;
  engagement_score: number;
  funding_stage: string | null;
  region: string | null;
  deal_value: number | null;
  days_to_close: number | null;
  outcome: 'won' | 'lost';
  closed_at: string;
  created_at: string;
}

export interface PredictiveScore {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    value: string;
  }>;
}

export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'bg-success/20 text-success border-success/30';
    case 'medium':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'low':
      return 'bg-muted text-muted-foreground border-border';
  }
}

export function getImpactColor(impact: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive':
      return 'text-success';
    case 'negative':
      return 'text-destructive';
    case 'neutral':
      return 'text-muted-foreground';
  }
}

export function getImpactIcon(impact: 'positive' | 'negative' | 'neutral'): string {
  switch (impact) {
    case 'positive':
      return 'TrendingUp';
    case 'negative':
      return 'TrendingDown';
    case 'neutral':
      return 'Minus';
  }
}
