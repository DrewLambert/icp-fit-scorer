import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ICPCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

type ScoringMode = 'standard' | 'advanced';
type OutreachTone = 'casual' | 'formal' | 'challenger';

interface ScoreRequest {
  companyInfo: string;
  criteria: ICPCriteria[];
  scoringMode?: ScoringMode;
  outreachTone?: OutreachTone;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { companyInfo, criteria, scoringMode = 'standard', outreachTone = 'casual' } = await req.json() as ScoreRequest;

    if (!companyInfo || !criteria || criteria.length === 0) {
      return new Response(
        JSON.stringify({ error: "Company info and criteria are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdvanced = scoringMode === 'advanced';
    
    // Tone-specific instructions for outreach generation
    const toneInstructions: Record<OutreachTone, string> = {
      casual: `Write in a CASUAL, friendly tone:
- Use conversational language like you're talking to a peer
- Keep it light and approachable
- Use contractions (you're, we're, let's)
- Can include light humor or personality
- Example: "Hey! Noticed you're scaling fast..."`,
      formal: `Write in a FORMAL, professional tone:
- Use polished, enterprise-appropriate language
- Maintain professional distance while being warm
- Avoid slang or overly casual expressions
- Structure sentences properly with no contractions
- Example: "I hope this message finds you well. I was impressed to learn..."`,
      challenger: `Write in a CHALLENGER, provocative tone:
- Be bold and pattern-interrupt with unexpected statements
- Challenge assumptions or conventional thinking
- Create urgency with insight-led statements
- Use confident, direct language
- Example: "Most companies in your space are leaving money on the table by..."`,
    };

    // Different prompts for different scoring modes
    const systemPrompt = isAdvanced 
      ? `You are an ICP (Ideal Customer Profile) scoring expert for B2B sales using the GTM Partners framework.

You will analyze company information and score them using ONLY these discrete values: -5, -3, -1, +1, +3, +5

Scoring Guidelines (GTM Partners Framework):
- +5: Perfect fit. This is exactly what we're looking for.
- +3: Strong fit. Meets criteria with minor gaps.
- +1: Slight positive. Some alignment but not strong.
- -1: Slight negative. Minor misalignment with criteria.
- -3: Poor fit. Significant gaps or concerns.
- -5: Disqualifying. Complete misalignment or red flag.

IMPORTANT: You MUST use only these 6 values. No zeros, no in-between scores. Force a clear decision.

Also extract the company name and generate a FULL personalized cold outreach block with:
1. Subject line (compelling, under 50 chars, creates curiosity)
2. Opening line (personalized hook based on company intel)
3. Value hook (1-2 sentences connecting their situation to your value)
4. CTA (specific, low-friction next step)

${toneInstructions[outreachTone]}

Respond ONLY with valid JSON in this exact format:
{
  "companyName": "extracted company name",
  "criteriaScores": [
    {
      "criteriaId": "criterion id",
      "advancedScore": -5 or -3 or -1 or 1 or 3 or 5,
      "reasoning": "brief explanation of why this score"
    }
  ],
  "outreach": {
    "subjectLine": "compelling subject line",
    "openingLine": "personalized opening hook",
    "valueHook": "1-2 sentence value proposition",
    "cta": "specific call to action"
  }
}`
      : `You are an ICP (Ideal Customer Profile) scoring expert for B2B sales. You analyze company information and score them against specific criteria.

You will receive company information and a list of scoring criteria with their weights. For each criterion, provide:
1. A score from 0 to the maximum weight (the weight is the max score for that criterion)
2. A brief reasoning (1 sentence) explaining the score

Also generate a FULL personalized cold outreach block with:
1. Subject line (compelling, under 50 chars, creates curiosity)
2. Opening line (personalized hook based on company intel)
3. Value hook (1-2 sentences connecting their situation to your value)
4. CTA (specific, low-friction next step)

${toneInstructions[outreachTone]}

IMPORTANT: Extract the company name from the provided information. If not clear, use the first few words or "Unknown Company".

Respond ONLY with valid JSON in this exact format:
{
  "companyName": "extracted company name",
  "criteriaScores": [
    {
      "criteriaId": "criterion id",
      "score": number (0 to weight),
      "reasoning": "brief explanation"
    }
  ],
  "outreach": {
    "subjectLine": "compelling subject line",
    "openingLine": "personalized opening hook",
    "valueHook": "1-2 sentence value proposition",
    "cta": "specific call to action"
  }
}`;

    const userPrompt = isAdvanced
      ? `Analyze this company using the GTM Partners -5 to +5 framework:

COMPANY INFORMATION:
${companyInfo}

SCORING CRITERIA (score each from -5 to +5, using ONLY: -5, -3, -1, +1, +3, +5):
${criteria.map(c => `- ${c.name} (ID: ${c.id}): ${c.description}`).join('\n')}

Return the JSON response with GTM Partners scores (-5 to +5) for each criterion.`
      : `Analyze this company and score against the ICP criteria:

COMPANY INFORMATION:
${companyInfo}

SCORING CRITERIA (score each from 0 to its weight):
${criteria.map(c => `- ${c.name} (ID: ${c.id}, Max Score: ${c.weight}): ${c.description}`).join('\n')}

Return the JSON response with scores for each criterion and a personalized opening line.`;

    console.log(`Calling Lovable AI Gateway for ICP scoring (${scoringMode} mode)...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received, parsing...");

    // Parse the JSON from the response (handle markdown code blocks)
    let parsedResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Build the full response with criteria details
    let totalScore: number;
    const criteriaBreakdown = criteria.map(c => {
      const scoreData = parsedResult.criteriaScores?.find(
        (s: { criteriaId: string }) => s.criteriaId === c.id
      );
      
      if (isAdvanced) {
        // Advanced mode: use -5 to +5 scores
        const advancedScore = scoreData?.advancedScore ?? 1;
        // Normalize to 0-weight scale for compatibility: (-5 to +5) -> (0 to weight)
        // -5 = 0, +5 = weight
        const normalizedScore = Math.round(((advancedScore + 5) / 10) * c.weight);
        
        return {
          criteriaId: c.id,
          criteriaName: c.name,
          score: normalizedScore,
          maxScore: c.weight,
          weight: c.weight,
          reasoning: scoreData?.reasoning ?? "Analysis not available",
          icon: getIconForCriteria(c.id),
          advancedScore: advancedScore,
        };
      } else {
        // Standard mode: 0 to weight
        return {
          criteriaId: c.id,
          criteriaName: c.name,
          score: Math.min(scoreData?.score ?? 0, c.weight),
          maxScore: c.weight,
          weight: c.weight,
          reasoning: scoreData?.reasoning ?? "Analysis not available",
          icon: getIconForCriteria(c.id),
        };
      }
    });

    totalScore = criteriaBreakdown.reduce((sum, c) => sum + c.score, 0);

    // Build outreach block with fallbacks
    const outreach = parsedResult.outreach || {
      subjectLine: "Quick question about your growth",
      openingLine: parsedResult.openingLine || "I'd love to connect and share how we can help your team.",
      valueHook: "Based on what I've seen, there might be an opportunity to accelerate your goals.",
      cta: "Would a 15-minute call this week work to explore this?"
    };

    const result = {
      companyName: parsedResult.companyName || "Unknown Company",
      totalScore,
      criteriaBreakdown,
      openingLine: outreach.openingLine, // Legacy compatibility
      outreach,
      scoringMode,
      outreachTone,
    };

    console.log(`Scoring complete (${scoringMode}). Total score:`, totalScore);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in score-prospect function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getIconForCriteria(id: string): string {
  const iconMap: Record<string, string> = {
    "company-size": "Users",
    "industry": "Building2",
    "revenue": "DollarSign",
    "tech-stack": "Cpu",
    "funding-stage": "TrendingUp",
    "region": "Globe",
  };
  return iconMap[id] || "Building2";
}
