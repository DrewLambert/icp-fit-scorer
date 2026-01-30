import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from '@/components/ScoreGauge';
import { SignalBreakdown } from '@/components/SignalBreakdown';
import { OutreachBlock } from '@/components/OutreachBlock';
import { RuleScoreDisplay } from '@/components/scoring-rules/RuleScoreDisplay';
import { ProspectScore, OutreachTone, OutreachBlock as OutreachBlockType } from '@/types/icp';
import { RuleBasedScore } from '@/types/scoring-rules';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface ScoreResultProps {
  result: ProspectScore;
  ruleBasedScore?: RuleBasedScore | null;
  onSave: () => void;
  onUpdateOutreach?: (outreach: OutreachBlockType, tone: OutreachTone) => void;
}

export function ScoreResult({ result, ruleBasedScore, onSave, onUpdateOutreach }: ScoreResultProps) {
  const [currentOutreach, setCurrentOutreach] = useState(result.outreach);
  const [currentTone, setCurrentTone] = useState(result.outreachTone);

  const handleRegenerate = async (tone: OutreachTone): Promise<OutreachBlockType | null> => {
    try {
      const { data, error } = await supabase.functions.invoke<{ 
        success: boolean; 
        outreach: OutreachBlockType; 
        tone: OutreachTone;
        error?: string;
      }>('regenerate-outreach', {
        body: {
          companyName: result.companyName,
          companyDescription: result.companyDescription,
          tone,
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to regenerate');
      }

      setCurrentOutreach(data.outreach);
      setCurrentTone(data.tone);
      
      if (onUpdateOutreach) {
        onUpdateOutreach(data.outreach, data.tone);
      }

      toast.success(`Regenerated with ${tone} tone`);
      return data.outreach;
    } catch (err) {
      console.error('Regenerate error:', err);
      toast.error('Failed to regenerate outreach');
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Score Display */}
      <div className="flex flex-col items-center">
        <ScoreGauge score={result.totalScore} />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-6"
        >
          <Button
            onClick={onSave}
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="h-5 w-5" />
            Save to Prospects
          </Button>
        </motion.div>
      </div>

      {/* Rule-Based Score Display */}
      {ruleBasedScore && ruleBasedScore.matchedRules.length > 0 && (
        <RuleScoreDisplay score={ruleBasedScore} />
      )}

      {/* Signal Breakdown - Receipt Style */}
      <SignalBreakdown 
        breakdown={result.criteriaBreakdown} 
        totalScore={result.totalScore}
        scoringMode={result.scoringMode}
      />

      {/* Full Outreach Block */}
      <OutreachBlock 
        outreach={currentOutreach || {
          subjectLine: "Quick question",
          openingLine: result.openingLine,
          valueHook: "I believe there's an opportunity here.",
          cta: "Would a quick call work?"
        }} 
        companyName={result.companyName}
        companyDescription={result.companyDescription}
        currentTone={currentTone}
        onRegenerate={handleRegenerate}
        legacyOpeningLine={result.openingLine}
      />
    </motion.div>
  );
}
