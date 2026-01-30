// Rule-based lead scoring types

export type RuleCategory = 'demographic' | 'firmographic' | 'behavioral';

export type ConditionType =
  | 'job_title_contains'
  | 'email_domain_personal'
  | 'email_domain_business'
  | 'company_size_range'
  | 'industry_matches'
  | 'visited_pricing_page'
  | 'visited_product_page'
  | 'blog_only_engagement'
  | 'funding_stage'
  | 'region_matches'
  | 'custom';

export interface ScoringRule {
  id: string;
  name: string;
  description: string | null;
  condition_type: ConditionType;
  condition_value: string;
  points: number;
  category: RuleCategory;
  sort_order: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScoringSettings {
  id: string;
  rule_based_enabled: boolean;
  qualification_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface RuleMatch {
  rule: ScoringRule;
  matched: boolean;
  reason?: string;
}

export interface RuleBasedScore {
  totalPoints: number;
  matchedRules: RuleMatch[];
  isQualified: boolean;
  qualificationThreshold: number;
}

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  job_title_contains: 'Job Title Contains',
  email_domain_personal: 'Personal Email Domain',
  email_domain_business: 'Business Email Domain',
  company_size_range: 'Company Size Range',
  industry_matches: 'Industry Matches',
  visited_pricing_page: 'Visited Pricing Page',
  visited_product_page: 'Visited Product Page',
  blog_only_engagement: 'Blog-Only Engagement',
  funding_stage: 'Funding Stage',
  region_matches: 'Region Matches',
  custom: 'Custom Condition',
};

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  demographic: 'Demographic',
  firmographic: 'Firmographic',
  behavioral: 'Behavioral',
};

export const CATEGORY_COLORS: Record<RuleCategory, string> = {
  demographic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  firmographic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  behavioral: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};
