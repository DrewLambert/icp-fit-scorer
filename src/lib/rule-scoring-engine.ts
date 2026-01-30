import { ScoringRule, RuleBasedScore, RuleMatch } from '@/types/scoring-rules';
import { EnrichedCompany } from '@/types/icp';

/**
 * Evaluates a lead against all enabled scoring rules
 */
export function evaluateLeadAgainstRules(
  lead: {
    jobTitle?: string;
    email?: string;
    enrichedData?: EnrichedCompany;
    behavioralSignals?: {
      visitedPricingPage?: boolean;
      visitedProductPage?: boolean;
      pricingPageVisits?: number;
      blogEngagementOnly?: boolean;
    };
  },
  rules: ScoringRule[],
  qualificationThreshold: number
): RuleBasedScore {
  const enabledRules = rules.filter(r => r.enabled);
  const matchedRules: RuleMatch[] = [];
  let totalPoints = 0;

  for (const rule of enabledRules) {
    const match = evaluateRule(rule, lead);
    matchedRules.push(match);
    
    if (match.matched) {
      totalPoints += rule.points;
    }
  }

  return {
    totalPoints,
    matchedRules,
    isQualified: totalPoints >= qualificationThreshold,
    qualificationThreshold,
  };
}

/**
 * Evaluates a single rule against lead data
 */
function evaluateRule(
  rule: ScoringRule,
  lead: {
    jobTitle?: string;
    email?: string;
    enrichedData?: EnrichedCompany;
    behavioralSignals?: {
      visitedPricingPage?: boolean;
      visitedProductPage?: boolean;
      pricingPageVisits?: number;
      blogEngagementOnly?: boolean;
    };
  }
): RuleMatch {
  const { condition_type, condition_value } = rule;
  const values = condition_value.split(',').map(v => v.trim().toLowerCase());

  switch (condition_type) {
    case 'job_title_contains': {
      const jobTitle = (lead.jobTitle || '').toLowerCase();
      const matched = values.some(v => jobTitle.includes(v));
      return {
        rule,
        matched,
        reason: matched 
          ? `Job title "${lead.jobTitle}" matches criteria` 
          : `Job title doesn't match any of: ${values.join(', ')}`,
      };
    }

    case 'email_domain_personal': {
      const email = (lead.email || '').toLowerCase();
      const domain = email.split('@')[1] || '';
      const matched = values.some(v => domain === v || domain.endsWith(`.${v}`));
      return {
        rule,
        matched,
        reason: matched 
          ? `Email uses personal domain: ${domain}` 
          : `Email uses business domain`,
      };
    }

    case 'email_domain_business': {
      const email = (lead.email || '').toLowerCase();
      const domain = email.split('@')[1] || '';
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
      const isPersonal = personalDomains.some(pd => domain === pd);
      const matched = !isPersonal && domain.length > 0;
      return {
        rule,
        matched,
        reason: matched 
          ? `Email uses business domain: ${domain}` 
          : `Email uses personal domain`,
      };
    }

    case 'company_size_range': {
      const companySize = lead.enrichedData?.companySize || '';
      const matched = values.some(v => companySize.toLowerCase().includes(v));
      return {
        rule,
        matched,
        reason: matched 
          ? `Company size "${companySize}" matches criteria` 
          : `Company size doesn't match`,
      };
    }

    case 'industry_matches': {
      const industry = (lead.enrichedData?.industry || '').toLowerCase();
      const matched = values.some(v => industry.includes(v));
      return {
        rule,
        matched,
        reason: matched 
          ? `Industry "${lead.enrichedData?.industry}" matches criteria` 
          : `Industry doesn't match`,
      };
    }

    case 'visited_pricing_page': {
      const signals = lead.behavioralSignals;
      const visitCount = signals?.pricingPageVisits || 0;
      const multiple = condition_value.toLowerCase() === 'multiple';
      const matched = multiple ? visitCount > 1 : (signals?.visitedPricingPage || false);
      return {
        rule,
        matched,
        reason: matched 
          ? `Visited pricing page ${visitCount > 1 ? 'multiple times' : ''}` 
          : `Has not visited pricing page`,
      };
    }

    case 'visited_product_page': {
      const signals = lead.behavioralSignals;
      const matched = signals?.visitedProductPage || false;
      return {
        rule,
        matched,
        reason: matched 
          ? `Visited product page` 
          : `Has not visited product page`,
      };
    }

    case 'blog_only_engagement': {
      const signals = lead.behavioralSignals;
      const matched = signals?.blogEngagementOnly || false;
      return {
        rule,
        matched,
        reason: matched 
          ? `Only engaged with blog content` 
          : `Engaged with product content`,
      };
    }

    case 'funding_stage': {
      const fundingStage = (lead.enrichedData?.fundingStage || '').toLowerCase();
      const matched = values.some(v => fundingStage.includes(v));
      return {
        rule,
        matched,
        reason: matched 
          ? `Funding stage "${lead.enrichedData?.fundingStage}" matches` 
          : `Funding stage doesn't match`,
      };
    }

    case 'region_matches': {
      const region = (lead.enrichedData?.region || '').toLowerCase();
      const matched = values.some(v => region.includes(v));
      return {
        rule,
        matched,
        reason: matched 
          ? `Region "${lead.enrichedData?.region}" matches` 
          : `Region doesn't match`,
      };
    }

    case 'custom':
    default: {
      // Custom rules are evaluated as always false unless extended
      return {
        rule,
        matched: false,
        reason: 'Custom rule - requires manual evaluation',
      };
    }
  }
}

/**
 * Format points with + or - prefix
 */
export function formatPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`;
}

/**
 * Get qualification status label
 */
export function getQualificationLabel(isQualified: boolean): string {
  return isQualified ? 'Sales Qualified' : 'Marketing Qualified';
}
