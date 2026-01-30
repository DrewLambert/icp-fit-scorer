// Intent-based lead scoring types

export type FirstPartySignalType = 
  | 'pricing_page' 
  | 'demo_page' 
  | 'product_page' 
  | 'email_open' 
  | 'email_click' 
  | 'email_reply' 
  | 'trial_signup' 
  | 'comparison_page';

export type ThirdPartySignalType = 
  | 'g2_research' 
  | 'trustradius_research' 
  | 'competitor_comparison' 
  | 'intent_provider' 
  | 'capterra_research' 
  | 'other';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface IntentSettings {
  id: string;
  intent_enabled: boolean;
  in_market_threshold: number;
  first_party_weight: number;
  third_party_weight: number;
  // First-party weights
  pricing_page_weight: number;
  demo_page_weight: number;
  product_page_weight: number;
  email_open_weight: number;
  email_click_weight: number;
  email_reply_weight: number;
  trial_signup_weight: number;
  // Third-party weights
  g2_research_weight: number;
  trustradius_weight: number;
  competitor_research_weight: number;
  intent_provider_weight: number;
  created_at: string;
  updated_at: string;
}

export interface FirstPartySignal {
  id: string;
  lead_id: string;
  signal_type: FirstPartySignalType;
  page_url: string | null;
  visit_count: number;
  metadata: Record<string, unknown>;
  observed_at: string;
  created_at: string;
}

export interface ThirdPartySignal {
  id: string;
  lead_id: string;
  source_name: string;
  signal_type: ThirdPartySignalType;
  confidence_level: ConfidenceLevel;
  notes: string | null;
  observed_at: string;
  created_at: string;
}

export type IntentSignal = 
  | (FirstPartySignal & { source: 'first_party' })
  | (ThirdPartySignal & { source: 'third_party' });

export interface IntentScore {
  score: number;
  isInMarket: boolean;
  firstPartyScore: number;
  thirdPartyScore: number;
  signalCount: number;
}

export const FIRST_PARTY_SIGNAL_LABELS: Record<FirstPartySignalType, string> = {
  pricing_page: 'Pricing Page Visit',
  demo_page: 'Demo Page Visit',
  product_page: 'Product Page Visit',
  email_open: 'Email Open',
  email_click: 'Email Click',
  email_reply: 'Email Reply',
  trial_signup: 'Trial/Demo Signup',
  comparison_page: 'Comparison Page Visit',
};

export const THIRD_PARTY_SIGNAL_LABELS: Record<ThirdPartySignalType, string> = {
  g2_research: 'G2 Research',
  trustradius_research: 'TrustRadius Research',
  competitor_comparison: 'Competitor Comparison',
  intent_provider: 'Intent Provider Signal',
  capterra_research: 'Capterra Research',
  other: 'Other Signal',
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export function getSignalIcon(type: FirstPartySignalType | ThirdPartySignalType): string {
  const icons: Record<string, string> = {
    pricing_page: 'DollarSign',
    demo_page: 'Play',
    product_page: 'Package',
    email_open: 'Mail',
    email_click: 'MousePointerClick',
    email_reply: 'Reply',
    trial_signup: 'UserPlus',
    comparison_page: 'GitCompare',
    g2_research: 'Search',
    trustradius_research: 'Search',
    competitor_comparison: 'GitCompare',
    intent_provider: 'Zap',
    capterra_research: 'Search',
    other: 'Activity',
  };
  return icons[type] || 'Activity';
}
