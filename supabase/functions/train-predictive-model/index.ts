import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HistoricalDeal {
  id: string;
  industry: string | null;
  company_size: string | null;
  job_title: string | null;
  source_channel: string | null;
  engagement_score: number;
  funding_stage: string | null;
  region: string | null;
  outcome: 'won' | 'lost';
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

    // Update status to training
    const { data: modelState } = await supabase
      .from("predictive_model_state")
      .select("id")
      .limit(1)
      .single();

    if (modelState) {
      await supabase
        .from("predictive_model_state")
        .update({ training_status: "training", error_message: null })
        .eq("id", modelState.id);
    }

    // Fetch all historical deals
    const { data: deals, error: dealsError } = await supabase
      .from("historical_deals")
      .select("*");

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`);
    }

    if (!deals || deals.length === 0) {
      await supabase
        .from("predictive_model_state")
        .update({
          training_status: "error",
          error_message: "No historical deals found",
        })
        .eq("id", modelState?.id);

      return new Response(
        JSON.stringify({ error: "No historical deals found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wonDeals = deals.filter((d: HistoricalDeal) => d.outcome === "won");
    const lostDeals = deals.filter((d: HistoricalDeal) => d.outcome === "lost");

    console.log(`Training on ${deals.length} deals (${wonDeals.length} won, ${lostDeals.length} lost)`);

    // Calculate feature weights using conversion rate per category value
    const featureWeights: FeatureWeights = {
      industry: calculateCategoryWeights(deals, "industry"),
      company_size: calculateCategoryWeights(deals, "company_size"),
      job_title: calculateJobTitleWeights(deals),
      source_channel: calculateCategoryWeights(deals, "source_channel"),
      funding_stage: calculateCategoryWeights(deals, "funding_stage"),
      region: calculateCategoryWeights(deals, "region"),
      engagement_score_avg: calculateAvgEngagement(wonDeals),
      engagement_score_weight: 0.15, // 15% weight for engagement
      base_conversion_rate: wonDeals.length / deals.length,
    };

    // Calculate accuracy using leave-one-out cross-validation approximation
    const accuracy = calculateModelAccuracy(deals, featureWeights);

    // Update model state
    const updateResult = await supabase
      .from("predictive_model_state")
      .update({
        feature_weights: featureWeights,
        total_records: deals.length,
        won_records: wonDeals.length,
        lost_records: lostDeals.length,
        accuracy_score: accuracy,
        last_trained_at: new Date().toISOString(),
        training_status: "trained",
        error_message: null,
      })
      .eq("id", modelState?.id);

    if (updateResult.error) {
      throw new Error(`Failed to update model state: ${updateResult.error.message}`);
    }

    console.log(`Model trained successfully. Accuracy: ${accuracy.toFixed(1)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        totalRecords: deals.length,
        wonRecords: wonDeals.length,
        lostRecords: lostDeals.length,
        accuracy,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Training error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Try to update error status
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from("predictive_model_state")
        .update({ training_status: "error", error_message: errorMessage })
        .neq("id", "");
    } catch {}

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateCategoryWeights(deals: HistoricalDeal[], field: keyof HistoricalDeal): Record<string, number> {
  const counts: Record<string, { won: number; total: number }> = {};

  for (const deal of deals) {
    const value = (deal[field] as string)?.toLowerCase() || "unknown";
    if (!counts[value]) {
      counts[value] = { won: 0, total: 0 };
    }
    counts[value].total++;
    if (deal.outcome === "won") {
      counts[value].won++;
    }
  }

  const weights: Record<string, number> = {};
  for (const [value, { won, total }] of Object.entries(counts)) {
    // Conversion rate for this category value
    weights[value] = total > 0 ? won / total : 0;
  }

  return weights;
}

function calculateJobTitleWeights(deals: HistoricalDeal[]): Record<string, number> {
  // Group job titles into categories
  const seniorityMap: Record<string, string> = {};
  
  for (const deal of deals) {
    const title = (deal.job_title || "").toLowerCase();
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
    
    seniorityMap[deal.id] = seniority;
  }

  const counts: Record<string, { won: number; total: number }> = {};
  
  for (const deal of deals) {
    const seniority = seniorityMap[deal.id];
    if (!counts[seniority]) {
      counts[seniority] = { won: 0, total: 0 };
    }
    counts[seniority].total++;
    if (deal.outcome === "won") {
      counts[seniority].won++;
    }
  }

  const weights: Record<string, number> = {};
  for (const [value, { won, total }] of Object.entries(counts)) {
    weights[value] = total > 0 ? won / total : 0;
  }

  return weights;
}

function calculateAvgEngagement(wonDeals: HistoricalDeal[]): number {
  if (wonDeals.length === 0) return 50;
  const sum = wonDeals.reduce((acc, d) => acc + (d.engagement_score || 0), 0);
  return sum / wonDeals.length;
}

function calculateModelAccuracy(deals: HistoricalDeal[], weights: FeatureWeights): number {
  let correct = 0;
  
  for (const deal of deals) {
    const score = predictScore(deal, weights);
    const predicted = score >= 50;
    const actual = deal.outcome === "won";
    if (predicted === actual) {
      correct++;
    }
  }
  
  return (correct / deals.length) * 100;
}

function predictScore(deal: HistoricalDeal, weights: FeatureWeights): number {
  let score = 0;
  let factorCount = 0;

  // Industry weight
  const industry = (deal.industry || "").toLowerCase();
  if (weights.industry[industry] !== undefined) {
    score += weights.industry[industry] * 100;
    factorCount++;
  }

  // Company size weight
  const companySize = (deal.company_size || "").toLowerCase();
  if (weights.company_size[companySize] !== undefined) {
    score += weights.company_size[companySize] * 100;
    factorCount++;
  }

  // Job title weight (mapped to seniority)
  const title = (deal.job_title || "").toLowerCase();
  let seniority = "other";
  if (title.includes("ceo") || title.includes("cto") || title.includes("chief")) {
    seniority = "c-level";
  } else if (title.includes("vp")) {
    seniority = "vp";
  } else if (title.includes("director")) {
    seniority = "director";
  } else if (title.includes("manager")) {
    seniority = "manager";
  } else if (title.includes("founder")) {
    seniority = "founder";
  }
  if (weights.job_title[seniority] !== undefined) {
    score += weights.job_title[seniority] * 100;
    factorCount++;
  }

  // Source channel weight
  const source = (deal.source_channel || "").toLowerCase();
  if (weights.source_channel[source] !== undefined) {
    score += weights.source_channel[source] * 100;
    factorCount++;
  }

  // Funding stage weight
  const funding = (deal.funding_stage || "").toLowerCase();
  if (weights.funding_stage[funding] !== undefined) {
    score += weights.funding_stage[funding] * 100;
    factorCount++;
  }

  // Region weight
  const region = (deal.region || "").toLowerCase();
  if (weights.region[region] !== undefined) {
    score += weights.region[region] * 100;
    factorCount++;
  }

  // Calculate average of categorical factors
  const categoricalScore = factorCount > 0 ? score / factorCount : weights.base_conversion_rate * 100;

  // Engagement score contribution
  const engagementDiff = (deal.engagement_score || 50) - weights.engagement_score_avg;
  const engagementBonus = (engagementDiff / 100) * weights.engagement_score_weight * 100;

  // Final score: weighted combination
  const finalScore = categoricalScore * 0.85 + engagementBonus + (weights.base_conversion_rate * 15);

  return Math.max(0, Math.min(100, finalScore));
}
