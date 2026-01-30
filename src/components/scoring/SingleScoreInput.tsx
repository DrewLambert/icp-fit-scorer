import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, Loader2, Link, Wand2, HelpCircle } from 'lucide-react';
import { EnrichedCompany, OutreachTone } from '@/types/icp';
import { EnrichedDataCard } from './EnrichedDataCard';
import { ToneSelector } from '@/components/ToneSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SingleScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  onScore: (tone: OutreachTone) => void;
  onReset: () => void;
  isScoring: boolean;
  hasResult: boolean;
  enrichedData: EnrichedCompany | null;
  onEnrichedData: (data: EnrichedCompany | null) => void;
}

// URL detection regex
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

function isValidUrl(text: string): boolean {
  const trimmed = text.trim();
  // Check if the input looks like a URL (domain-like pattern)
  if (URL_REGEX.test(trimmed)) return true;
  // Also check for common domain patterns without protocol
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.[a-z]{2,}$/i.test(trimmed)) return true;
  return false;
}

export function SingleScoreInput({
  value,
  onChange,
  onScore,
  onReset,
  isScoring,
  hasResult,
  enrichedData,
  onEnrichedData,
}: SingleScoreInputProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<OutreachTone>('casual');

  // Detect URL in input
  useEffect(() => {
    const trimmed = value.trim();
    if (isValidUrl(trimmed) && !enrichedData) {
      setDetectedUrl(trimmed);
    } else {
      setDetectedUrl(null);
    }
  }, [value, enrichedData]);

  const handleEnrich = async () => {
    if (!detectedUrl) return;

    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-company', {
        body: { url: detectedUrl },
      });

      if (error) {
        console.error('Enrichment error:', error);
        toast.error('Failed to enrich company data. Try entering details manually.');
        return;
      }

      if (data?.error) {
        console.error('Enrichment API error:', data.error);
        toast.error(data.error);
        return;
      }

      if (data?.success && data?.data) {
        const enriched = data.data as EnrichedCompany;
        onEnrichedData(enriched);
        
        // Build a rich description for scoring
        const description = [
          enriched.companyName,
          enriched.description,
          `Industry: ${enriched.industry}`,
          `Size: ${enriched.companySize}`,
          `Revenue: ${enriched.estimatedRevenue}`,
          `Funding: ${enriched.fundingStage}`,
          `Region: ${enriched.region}`,
          enriched.techStack.length > 0 ? `Tech Stack: ${enriched.techStack.join(', ')}` : '',
        ].filter(Boolean).join('\n');
        
        onChange(description);
        toast.success(`Enriched data for ${enriched.companyName}`);
      }
    } catch (err) {
      console.error('Enrichment exception:', err);
      toast.error('Failed to connect to enrichment service');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleReset = () => {
    onEnrichedData(null);
    onReset();
  };

  return (
    <div className="space-y-8">
      {/* Enriched Data Display */}
      {enrichedData && (
        <EnrichedDataCard data={enrichedData} />
      )}

      {/* Input Area - seamless, ambient glow on focus */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Company Information</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">
                Enter a company URL to auto-enrich, or paste a description with details like industry, size, and funding stage.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative input-glow rounded-2xl transition-all duration-300">
          <Textarea
            placeholder={enrichedData 
              ? "Enriched data loaded. Click 'Score Prospect' to analyze."
              : `Paste a company URL to auto-enrich, or describe manually...

Examples:
  stripe.com
  https://hubspot.com
  Acme Corp - B2B SaaS, 150 employees, Series B`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[140px] bg-secondary/30 border-border/30 resize-none rounded-2xl text-base"
            disabled={isScoring || isEnriching}
          />

          {/* URL Detection Indicator */}
          {detectedUrl && !isEnriching && !enrichedData && (
            <div className="absolute top-3 right-3">
              <Button
                size="sm"
                onClick={handleEnrich}
                className="gap-1.5 bg-primary/90 hover:bg-primary text-xs h-7 rounded-sm"
              >
                <Wand2 className="h-3 w-3" />
                Auto-Enrich
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enrichment Loading State */}
      {isEnriching && (
        <div className="flex items-center gap-3 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Enriching company data...</p>
            <p className="text-xs text-muted-foreground">Scraping website and extracting company signals</p>
          </div>
        </div>
      )}

      {/* Tone Selector */}
      <ToneSelector
        value={selectedTone}
        onChange={setSelectedTone}
        disabled={isScoring || isEnriching}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        {(hasResult || enrichedData) && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        )}
        
        <Button
          onClick={() => onScore(selectedTone)}
          disabled={isScoring || isEnriching || !value.trim()}
          className="gap-2 bg-primary hover:bg-primary/90 min-w-[160px] rounded-sm px-8"
        >
          {isScoring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Score Prospect
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
