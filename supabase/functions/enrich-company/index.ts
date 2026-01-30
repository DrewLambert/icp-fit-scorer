import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EnrichRequest {
  url: string;
}

interface EnrichedCompany {
  companyName: string;
  description: string;
  industry: string;
  companySize: string;
  estimatedRevenue: string;
  fundingStage: string;
  techStack: string[];
  region: string;
  website: string;
  rawContent: string;
  dataSources: string[];
}

interface DataSource {
  name: string;
  content: string;
  metadata?: Record<string, unknown>;
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace("www.", "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

// Helper: Extract company name from domain
function companyNameFromDomain(domain: string): string {
  return domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Scrape a URL with Firecrawl
async function scrapeUrl(url: string, apiKey: string): Promise<{ markdown: string; metadata: Record<string, unknown> } | null> {
  try {
    console.log(`  Scraping: ${url}`);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.log(`  Scrape failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    const metadata = data.data?.metadata || data.metadata || {};
    
    if (markdown.length < 100) {
      console.log(`  Scrape returned insufficient content: ${markdown.length} chars`);
      return null;
    }
    
    console.log(`  Scrape success: ${markdown.length} chars`);
    return { markdown, metadata };
  } catch (error) {
    console.log(`  Scrape error:`, error);
    return null;
  }
}

// Search for a company page on a specific site
async function searchForCompanyPage(
  companyName: string, 
  site: string, 
  apiKey: string
): Promise<string | null> {
  try {
    console.log(`  Searching ${site} for: ${companyName}`);
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `site:${site} "${companyName}" company`,
        limit: 3,
      }),
    });

    if (!response.ok) {
      console.log(`  Search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.data || [];
    
    if (results.length > 0) {
      // Prefer company pages over individual profiles
      const companyPage = results.find((r: { url: string }) => 
        r.url.includes("/company/") || r.url.includes("/organization/")
      ) || results[0];
      
      console.log(`  Found: ${companyPage.url}`);
      return companyPage.url;
    }
    
    console.log(`  No results found`);
    return null;
  } catch (error) {
    console.log(`  Search error:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured. Please connect Firecrawl in Settings.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { url } = await req.json() as EnrichRequest;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const domain = extractDomain(formattedUrl);
    const companyName = companyNameFromDomain(domain);
    
    console.log("=== WATERFALL ENRICHMENT START ===");
    console.log(`Company: ${companyName} | Domain: ${domain}`);

    const dataSources: DataSource[] = [];

    // ============================================
    // WATERFALL: Try data sources in priority order
    // ============================================

    // 1. LinkedIn Company Page (highest quality for company info)
    console.log("\n[1/3] LinkedIn Company Page");
    const linkedinUrl = await searchForCompanyPage(companyName, "linkedin.com", FIRECRAWL_API_KEY);
    if (linkedinUrl) {
      const linkedinData = await scrapeUrl(linkedinUrl, FIRECRAWL_API_KEY);
      if (linkedinData) {
        dataSources.push({
          name: "LinkedIn",
          content: linkedinData.markdown,
          metadata: linkedinData.metadata,
        });
      }
    }

    // 2. Crunchbase (funding, revenue signals)
    console.log("\n[2/3] Crunchbase");
    const crunchbaseUrl = await searchForCompanyPage(companyName, "crunchbase.com", FIRECRAWL_API_KEY);
    if (crunchbaseUrl) {
      const crunchbaseData = await scrapeUrl(crunchbaseUrl, FIRECRAWL_API_KEY);
      if (crunchbaseData) {
        dataSources.push({
          name: "Crunchbase",
          content: crunchbaseData.markdown,
          metadata: crunchbaseData.metadata,
        });
      }
    }

    // 3. Company Website (always try as fallback/supplement)
    console.log("\n[3/3] Company Website");
    const websiteData = await scrapeUrl(formattedUrl, FIRECRAWL_API_KEY);
    if (websiteData) {
      dataSources.push({
        name: "Website",
        content: websiteData.markdown,
        metadata: websiteData.metadata,
      });
    }

    // ============================================
    // Validate we have at least some data
    // ============================================
    if (dataSources.length === 0) {
      throw new Error("Could not gather data from any source. Please check the URL and try again.");
    }

    console.log(`\n=== SOURCES COLLECTED: ${dataSources.map(s => s.name).join(", ")} ===`);

    // ============================================
    // AI: Synthesize all sources into structured data
    // ============================================
    console.log("\nStep 4: AI synthesis of all sources");

    const combinedContent = dataSources.map(source => 
      `=== ${source.name.toUpperCase()} ===\n${source.content.slice(0, 4000)}`
    ).join("\n\n");

    const systemPrompt = `You are a B2B company research analyst performing waterfall data enrichment. You have data from multiple sources (LinkedIn, Crunchbase, company website). Synthesize ALL sources to extract the most accurate and complete company profile.

PRIORITIZATION RULES:
- LinkedIn: Best for company size, employee count, industry classification
- Crunchbase: Best for funding stage, revenue signals, founding date, investors
- Website: Best for product description, tech stack, current messaging

Cross-reference sources when possible. If sources conflict, prefer LinkedIn > Crunchbase > Website for factual data.

Respond ONLY with valid JSON:
{
  "companyName": "Official Company Name",
  "description": "One clear sentence about what they do and who they serve",
  "industry": "Primary industry (e.g., B2B SaaS, FinTech, DevTools, MarTech)",
  "companySize": "Employee count (e.g., '150 employees' or '50-100 employees')",
  "estimatedRevenue": "Revenue estimate with reasoning (e.g., '$10-25M ARR' or 'Series A, likely $2-5M ARR')",
  "fundingStage": "Most recent funding (e.g., 'Series B ($45M)' or 'Bootstrapped')",
  "techStack": ["Technology1", "Technology2", "Technology3"],
  "region": "Headquarters location (e.g., 'San Francisco, CA, USA')"
}`;

    const userPrompt = `Synthesize company data from these ${dataSources.length} sources:

COMPANY DOMAIN: ${domain}

${combinedContent}

Extract the most complete and accurate company profile by combining insights from all sources.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Step 5: Parsing AI response");

    // Parse JSON from response
    let enrichedData: EnrichedCompany;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr.trim());
      
      enrichedData = {
        companyName: parsed.companyName || companyName,
        description: parsed.description || "",
        industry: parsed.industry || "Unknown",
        companySize: parsed.companySize || "Unknown",
        estimatedRevenue: parsed.estimatedRevenue || "Unknown",
        fundingStage: parsed.fundingStage || "Unknown",
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        region: parsed.region || "Unknown",
        website: formattedUrl,
        rawContent: combinedContent.slice(0, 3000),
        dataSources: dataSources.map(s => s.name),
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to extract company data from AI response");
    }

    console.log("=== WATERFALL ENRICHMENT COMPLETE ===");
    console.log(`Company: ${enrichedData.companyName}`);
    console.log(`Sources: ${enrichedData.dataSources.join(", ")}`);

    return new Response(JSON.stringify({ success: true, data: enrichedData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in enrich-company function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
