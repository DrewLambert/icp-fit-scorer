// Engagement-Based Lead Scoring Types

export type EngagementCategory = 'email' | 'content' | 'web' | 'social' | 'event';
export type EngagementTemperature = 'cold' | 'warm' | 'hot';

export interface EngagementSettings {
  id: string;
  engagement_enabled: boolean;
  decay_period_days: number; // Points halve every X days
  cold_threshold: number;
  warm_threshold: number;
  hot_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface EngagementType {
  id: string;
  name: string;
  category: EngagementCategory;
  default_points: number;
  current_points: number;
  icon: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface EngagementEvent {
  id: string;
  lead_id: string;
  engagement_type_id: string;
  points_earned: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  // Joined data
  engagement_type?: EngagementType;
}

export interface EngagementScore {
  rawScore: number;
  decayedScore: number;
  temperature: EngagementTemperature;
  eventCount: number;
  lastActivity: string | null;
}

export interface LeadEngagementSummary {
  leadId: string;
  score: EngagementScore;
  recentEvents: EngagementEvent[];
}

export const CATEGORY_LABELS: Record<EngagementCategory, string> = {
  email: 'Email',
  content: 'Content',
  web: 'Website',
  social: 'Social',
  event: 'Events',
};

export const CATEGORY_ICONS: Record<EngagementCategory, string> = {
  email: 'Mail',
  content: 'FileText',
  web: 'Globe',
  social: 'Share2',
  event: 'Calendar',
};

export const TEMPERATURE_CONFIG: Record<EngagementTemperature, { label: string; color: string; icon: string }> = {
  cold: {
    label: 'Cold',
    color: 'bg-info/20 text-info border-info/30',
    icon: 'Snowflake',
  },
  warm: {
    label: 'Warm',
    color: 'bg-warning/20 text-warning border-warning/30',
    icon: 'Sun',
  },
  hot: {
    label: 'Hot',
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    icon: 'Flame',
  },
};

export const DECAY_PERIOD_OPTIONS = [
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

export function getTemperatureFromScore(
  score: number,
  settings: Pick<EngagementSettings, 'cold_threshold' | 'warm_threshold' | 'hot_threshold'>
): EngagementTemperature {
  if (score >= settings.hot_threshold) return 'hot';
  if (score >= settings.warm_threshold) return 'warm';
  return 'cold';
}

export function calculateDecayMultiplier(occurredAt: string, decayPeriodDays: number): number {
  const now = new Date();
  const eventDate = new Date(occurredAt);
  const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Points halve every decay period
  const halfLives = daysSinceEvent / decayPeriodDays;
  return Math.pow(0.5, halfLives);
}
