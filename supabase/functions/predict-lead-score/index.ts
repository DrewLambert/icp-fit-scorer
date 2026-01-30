import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadData {
  industry?: string;
  companySize?: string;
  jobTitle?: string;
  sourceChannel?: string;
  fundingStage?: string;
  region?: string;
  engagementScore?: number;
}

interface FeatureWeights {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const leadData: LeadData = await req.json();

    // Check if predictive scoring is enabled
    const { data: settings } = await supabase
      .from("predictive_settings")
      .select("*")
      .limit(1)
      .single();

    if (!settings?.predictive_enabled) {
      return new Response(
        JSON.stringify({ error: "Predictive scoring is not enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get trained model weights
    const { data: modelState } = await supabase
      .from("predictive_model_state")
      .select("*")
      .limit(1)
      .single();

    if (!modelState || modelState.training_status !== "trained") {
      return new Response(
        JSON.stringify({ error: "Model is not trained yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const weights = modelState.feature_weights as FeatureWeights;
    
    // Calculate predictive score
    const score = calculatePredictiveScore(leadData, weights);
    const confidence = calculateConfidence(leadData, weights);

    console.log(`Predicted score for lead: ${score.toFixed(1)}% (confidence: ${confidence})`);

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(score),
        confidence,
        factors: getScoreFactors(leadData, weights),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Prediction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculatePredictiveScore(lead: LeadData, weights: FeatureWeights): number {
  let score = 0;
  let factorCount = 0;

  // Industry weight
  const industry = (lead.industry || "").toLowerCase();
  if (weights.industry[industry] !== undefined) {
    score += weights.industry[industry] * 100;
    factorCount++;
  }

  // Company size weight
  const companySize = (lead.companySize || "").toLowerCase();
  if (weights.company_size[companySize] !== undefined) {
    score += weights.company_size[companySize] * 100;
    factorCount++;
  }

  // Job title weight (mapped to seniority)
  const title = (lead.jobTitle || "").toLowerCase();
  let seniority = "other";
  if (title.includes("ceo") || title.includes("cto") || title.includes("cfo") || 
      title.includes("cmo") || title.includes("cro") || title.includes("coo") ||
      title.includes("chief")) {
    seniority = "c-level";
  } else if (title.includes("vp") || title.includes("vice president")) {
    seniority = "vp";
  } else if (title.includes("director")) {
    seniority = "director";
  } else if (title.includes("manager")) {
    seniority = "manager";
  } else if (title.includes("founder") || title.includes("owner")) {
    seniority = "founder";
  } else if (title.includes("analyst") || title.includes("lead")) {
    seniority = "individual";
  }
  if (weights.job_title[seniority] !== undefined) {
    score += weights.job_title[seniority] * 100;
    factorCount++;
  }

  // Source channel weight
  const source = (lead.sourceChannel || "").toLowerCase();
  if (weights.source_channel[source] !== undefined) {
    score += weights.source_channel[source] * 100;
    factorCount++;
  }

  // Funding stage weight
  const funding = (lead.fundingStage || "").toLowerCase();
  if (weights.funding_stage[funding] !== undefined) {
    score += weights.funding_stage[funding] * 100;
    factorCount++;
  }

  // Region weight
  const region = (lead.region || "").toLowerCase();
  if (weights.region[region] !== undefined) {
    score += weights.region[region] * 100;
    factorCount++;
  }

  // Calculate average of categorical factors
  const categoricalScore = factorCount > 0 ? score / factorCount : weights.base_conversion_rate * 100;

  // Engagement score contribution
  const engagement = lead.engagementScore ?? 50;
  const engagementDiff = engagement - weights.engagement_score_avg;
  const engagementBonus = (engagementDiff / 100) * weights.engagement_score_weight * 100;

  // Final score: weighted combination
  const finalScore = categoricalScore * 0.85 + engagementBonus + (weights.base_conversion_rate * 15);

  return Math.max(0, Math.min(100, finalScore));
}

function calculateConfidence(lead: LeadData, weights: FeatureWeights): 'high' | 'medium' | 'low' {
  let matchedFactors = 0;
  
  if (lead.industry && weights.industry[(lead.industry || "").toLowerCase()]) matchedFactors++;
  if (lead.companySize && weights.company_size[(lead.companySize || "").toLowerCase()]) matchedFactors++;
  if (lead.sourceChannel && weights.source_channel[(lead.sourceChannel || "").toLowerCase()]) matchedFactors++;
  if (lead.fundingStage && weights.funding_stage[(lead.fundingStage || "").toLowerCase()]) matchedFactors++;
  if (lead.region && weights.region[(lead.region || "").toLowerCase()]) matchedFactors++;
  if (lead.jobTitle) matchedFactors++;

  if (matchedFactors >= 5) return 'high';
  if (matchedFactors >= 3) return 'medium';
  return 'low';
}

function getScoreFactors(lead: LeadData, weights: FeatureWeights): Array<{ factor: string; impact: string; value: string }> {
  const factors: Array<{ factor: string; impact: string; value: string }> = [];

  // Industry
  const industry = (lead.industry || "").toLowerCase();
  if (weights.industry[industry] !== undefined) {
    const convRate = weights.industry[industry];
    factors.push({
      factor: 'Industry',
      impact: convRate > weights.base_conversion_rate ? 'positive' : convRate < weights.base_conversion_rate ? 'negative' : 'neutral',
      value: lead.industry || 'Unknown',
    });
  }

  // Company size
  const companySize = (lead.companySize || "").toLowerCase();
  if (weights.company_size[companySize] !== undefined) {
    const convRate = weights.company_size[companySize];
    factors.push({
      factor: 'Company Size',
      impact: convRate > weights.base_conversion_rate ? 'positive' : convRate < weights.base_conversion_rate ? 'negative' : 'neutral',
      value: lead.companySize || 'Unknown',
    });
  }

  // Job title
  if (lead.jobTitle) {
    const title = lead.jobTitle.toLowerCase();
    let seniority = 'other';
    if (title.includes("ceo") || title.includes("cto") || title.includes("chief")) seniority = "c-level";
    else if (title.includes("vp")) seniority = "vp";
    else if (title.includes("director")) seniority = "director";
    else if (title.includes("manager")) seniority = "manager";
    else if (title.includes("founder")) seniority = "founder";
    
    if (weights.job_title[seniority] !== undefined) {
      const convRate = weights.job_title[seniority];
      factors.push({
        factor: 'Seniority',
        impact: convRate > weights.base_conversion_rate ? 'positive' : convRate < weights.base_conversion_rate ? 'negative' : 'neutral',
        value: seniority.charAt(0).toUpperCase() + seniority.slice(1),
      });
    }
  }

  // Source channel
  const source = (lead.sourceChannel || "").toLowerCase();
  if (weights.source_channel[source] !== undefined) {
    const convRate = weights.source_channel[source];
    factors.push({
      factor: 'Source',
      impact: convRate > weights.base_conversion_rate ? 'positive' : convRate < weights.base_conversion_rate ? 'negative' : 'neutral',
      value: lead.sourceChannel || 'Unknown',
    });
  }

  // Engagement
  if (lead.engagementScore !== undefined) {
    factors.push({
      factor: 'Engagement',
      impact: lead.engagementScore > weights.engagement_score_avg ? 'positive' : lead.engagementScore < weights.engagement_score_avg ? 'negative' : 'neutral',
      value: `${lead.engagementScore}%`,
    });
  }

  return factors;
}
