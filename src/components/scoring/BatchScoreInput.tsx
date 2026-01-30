import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  RotateCcw, 
  Loader2, 
  ListChecks, 
  Link, 
  Zap,
  Check,
  X,
  Globe
} from 'lucide-react';
import { EnrichedCompany } from '@/types/icp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BatchScoreInputProps {
  value: string;
  onChange: (value: string) => void;
  onScore: () => void;
  onReset: () => void;
  isScoring: boolean;
  hasResults: boolean;
  companyCount: number;
  enrichedCompanies: EnrichedCompany[];
  onEnrichedCompanies: (companies: EnrichedCompany[]) => void;
}

// URL detection regex
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/\S*)?$/;

function isUrl(line: string): boolean {
  return URL_REGEX.test(line.trim());
}

interface EnrichmentProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

export function BatchScoreInput({
  value,
  onChange,
  onScore,
  onReset,
  isScoring,
  hasResults,
  companyCount,
  enrichedCompanies,
  onEnrichedCompanies,
}: BatchScoreInputProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState<EnrichmentProgress | null>(null);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  const lines = value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const urlLines = lines.filter(isUrl);
  const textLines = lines.filter(l => !isUrl(l));
  const hasUrls = urlLines.length > 0;
  const allAreUrls = urlLines.length === lines.length && lines.length > 0;

  const handleEnrichAll = async () => {
    if (urlLines.length === 0) return;

    setIsEnriching(true);
    setEnrichProgress({ total: urlLines.length, completed: 0, failed: 0, current: '' });
    setFailedUrls([]);
    onEnrichedCompanies([]);

    const enriched: EnrichedCompany[] = [];
    const failed: string[] = [];

    for (let i = 0; i < urlLines.length; i++) {
      const url = urlLines[i];
      setEnrichProgress(prev => prev ? { ...prev, current: url } : null);

      try {
        const { data, error } = await supabase.functions.invoke<{ success: boolean; data: EnrichedCompany; error?: string }>('enrich-company', {
          body: { url },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Enrichment failed');
        }

        enriched.push(data.data);
        setEnrichProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
      } catch (err) {
        console.error(`Failed to enrich ${url}:`, err);
        failed.push(url);
        setEnrichProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
      }

      // Delay between requests
      if (i < urlLines.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    onEnrichedCompanies(enriched);
    setFailedUrls(failed);
    setIsEnriching(false);
    setEnrichProgress(null);

    if (enriched.length > 0) {
      toast({
        title: 'Enrichment Complete',
        description: `Enriched ${enriched.length} companies${failed.length > 0 ? `, ${failed.length} failed` : ''}.`,
      });
    } else {
      toast({
        title: 'Enrichment Failed',
        description: 'Could not enrich any URLs. Please check the URLs and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClearEnriched = () => {
    onEnrichedCompanies([]);
    setFailedUrls([]);
  };

  const handleScoreEnriched = () => {
    // Convert enriched companies to text format for scoring
    const enrichedText = enrichedCompanies.map(c => 
      `${c.companyName} - ${c.companySize}, ${c.industry}, ${c.fundingStage}, ${c.estimatedRevenue}, Tech: ${c.techStack.slice(0, 5).join(', ')}`
    ).join('\n');
    
    onChange(enrichedText);
    onEnrichedCompanies([]);
    
    // Trigger score after state update
    setTimeout(() => onScore(), 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasUrls 
            ? 'Paste company URLs to auto-enrich, or enter company details directly.'
            : 'Enter one company per line with relevant details.'}
        </p>
        {companyCount > 0 && (
          <div className="flex items-center gap-3">
            {hasUrls && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Link className="h-3 w-3" />
                {urlLines.length} URLs
              </span>
            )}
            <span className="text-sm font-medium text-primary flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              {companyCount} {companyCount === 1 ? 'company' : 'companies'}
            </span>
          </div>
        )}
      </div>
      
      {/* Input - seamless with ambient glow */}
      <div className="input-glow rounded-2xl transition-all duration-300">
        <Textarea
          placeholder="Paste multiple companies or URLs, one per line...

Examples:
hubspot.com
notion.so
linear.app

Or enter details directly:
HubSpot - 7000 employees, Marketing SaaS, Series E
Stripe - 8000 employees, FinTech, $95B valuation"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px] bg-secondary/30 border-border/30 resize-none font-mono text-sm rounded-2xl"
          disabled={isScoring || isEnriching || enrichedCompanies.length > 0}
        />
      </div>

      {/* Enrichment Progress - seamless */}
      <AnimatePresence>
        {isEnriching && enrichProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Enriching URLs...</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {enrichProgress.completed + enrichProgress.failed} / {enrichProgress.total}
              </span>
            </div>
            
            <div className="w-full bg-secondary/50 rounded-full h-1.5">
              <motion.div
                className="bg-primary h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((enrichProgress.completed + enrichProgress.failed) / enrichProgress.total) * 100}%` 
                }}
              />
            </div>
            
            {enrichProgress.current && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                {enrichProgress.current}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enriched Companies Preview - flowing list */}
      <AnimatePresence>
        {enrichedCompanies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span className="text-sm font-medium text-success">
                  {enrichedCompanies.length} Companies Enriched
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearEnriched}
                className="h-7 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
            
            <div className="space-y-0 max-h-[280px] overflow-y-auto">
              {enrichedCompanies.map((company, index) => (
                <motion.div
                  key={company.website}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-row"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{company.companyName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>{company.industry}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{company.companySize}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>{company.fundingStage}</span>
                    </p>
                  </div>
                  {company.dataSources && (
                    <div className="flex gap-1 shrink-0">
                      {company.dataSources.map(source => (
                        <span key={source} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {failedUrls.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <X className="h-3 w-3" />
                Failed: {failedUrls.join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4">
        {hasResults && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            New Batch
          </Button>
        )}

        {/* Show Enrich button when URLs detected and not yet enriched */}
        {hasUrls && enrichedCompanies.length === 0 && !hasResults && (
          <Button
            variant="ghost"
            onClick={handleEnrichAll}
            disabled={isEnriching || isScoring}
            className="gap-2 text-primary hover:bg-primary/10"
          >
            {isEnriching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Auto-Enrich ({urlLines.length})
              </>
            )}
          </Button>
        )}
        
        {/* Score button */}
        <Button
          onClick={enrichedCompanies.length > 0 ? handleScoreEnriched : onScore}
          disabled={isScoring || isEnriching || (companyCount === 0 && enrichedCompanies.length === 0)}
          className="gap-2 bg-primary hover:bg-primary/90 min-w-[160px] rounded-full px-8"
        >
          {isScoring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Score All ({enrichedCompanies.length > 0 ? enrichedCompanies.length : companyCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
