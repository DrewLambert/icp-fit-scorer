// Negative Lead Scoring Types

export type NegativeConditionType = 
  | 'personal_email'
  | 'career_page_only'
  | 'competitor'
  | 'spam_source'
  | 'fake_data'
  | 'custom';

export interface NegativeScoringSettings {
  id: string;
  negative_enabled: boolean;
  disqualification_threshold: number;
  subtract_from_other_models: boolean;
  auto_disqualify: boolean;
  created_at: string;
  updated_at: string;
}

export interface NegativeScoringRule {
  id: string;
  name: string;
  condition_type: NegativeConditionType;
  condition_value: string;
  points: number; // Negative value
  reason_label: string;
  description: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TriggeredRule {
  rule_id?: string;
  rule_name: string;
  points: number;
  reason: string;
}

export interface DisqualifiedLead {
  id: string;
  lead_id: string;
  total_negative_score: number;
  triggered_rules: TriggeredRule[];
  disqualified_at: string;
  is_overridden: boolean;
  override_reason: string | null;
  overridden_at: string | null;
  overridden_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NegativeScoreResult {
  totalScore: number;
  triggeredRules: TriggeredRule[];
  isDisqualified: boolean;
}

export const CONDITION_TYPE_LABELS: Record<NegativeConditionType, string> = {
  personal_email: 'Personal Email Domain',
  career_page_only: 'Career Page Only',
  competitor: 'Known Competitor',
  spam_source: 'Spam Source',
  fake_data: 'Fake/Inconsistent Data',
  custom: 'Custom Rule',
};

export const CONDITION_TYPE_ICONS: Record<NegativeConditionType, string> = {
  personal_email: 'Mail',
  career_page_only: 'Briefcase',
  competitor: 'Shield',
  spam_source: 'AlertTriangle',
  fake_data: 'FileWarning',
  custom: 'Settings',
};

export const CONDITION_TYPE_DESCRIPTIONS: Record<NegativeConditionType, string> = {
  personal_email: 'Matches leads using personal email domains like Gmail, Yahoo, Hotmail',
  career_page_only: 'Detects leads who only visit career/jobs pages',
  competitor: 'Flags leads from known competitor companies',
  spam_source: 'Identifies leads from known spam sources or bots',
  fake_data: 'Catches leads with fake, gibberish, or inconsistent form data',
  custom: 'Create a custom rule with your own conditions',
};

export const DEFAULT_PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
  'msn.com',
  'protonmail.com',
];
