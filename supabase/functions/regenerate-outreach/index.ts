import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type OutreachTone = 'casual' | 'formal' | 'challenger';

interface RegenerateRequest {
  companyName: string;
  companyDescription: string;
  tone: OutreachTone;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { companyName, companyDescription, tone } = await req.json() as RegenerateRequest;

    if (!companyName || !companyDescription || !tone) {
      return new Response(
        JSON.stringify({ error: "Company name, description, and tone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const systemPrompt = `You are an expert cold email copywriter for B2B sales. You will generate a personalized outreach block for a specific company.

Generate a FULL personalized cold outreach block with:
1. Subject line (compelling, under 50 chars, creates curiosity)
2. Opening line (personalized hook based on company intel)
3. Value hook (1-2 sentences connecting their situation to your value)
4. CTA (specific, low-friction next step)

${toneInstructions[tone]}

Respond ONLY with valid JSON in this exact format:
{
  "subjectLine": "compelling subject line",
  "openingLine": "personalized opening hook",
  "valueHook": "1-2 sentence value proposition",
  "cta": "specific call to action"
}`;

    const userPrompt = `Generate a ${tone} outreach block for this company:

COMPANY: ${companyName}
DETAILS: ${companyDescription}

Return the JSON response with the outreach block.`;

    console.log(`Regenerating outreach for ${companyName} with ${tone} tone...`);

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
        temperature: 0.8, // Slightly higher for variety
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

    // Parse the JSON from the response
    let outreach;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      outreach = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log(`Outreach regenerated successfully for ${companyName}`);

    return new Response(JSON.stringify({ success: true, outreach, tone }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in regenerate-outreach function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
