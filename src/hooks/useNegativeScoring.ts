import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import {
  NegativeScoringSettings,
  NegativeScoringRule,
  DisqualifiedLead,
  TriggeredRule,
  NegativeScoreResult,
  NegativeConditionType,
} from '@/types/negative-scoring';

// Fetch negative scoring settings
export function useNegativeScoringSettings() {
  return useQuery({
    queryKey: ['negative-scoring-settings'],
    queryFn: async (): Promise<NegativeScoringSettings> => {
      const { data, error } = await supabase
        .from('negative_scoring_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('negative_scoring_settings')
          .insert({
            negative_enabled: false,
            disqualification_threshold: -25,
            subtract_from_other_models: true,
            auto_disqualify: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as NegativeScoringSettings;
      }

      return data as NegativeScoringSettings;
    },
  });
}

// Update negative scoring settings
export function useUpdateNegativeScoringSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<NegativeScoringSettings>) => {
      const { data: existing } = await supabase
        .from('negative_scoring_settings')
        .select('id')
        .maybeSingle();

      if (!existing) throw new Error('Settings not found');

      const { error } = await supabase
        .from('negative_scoring_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negative-scoring-settings'] });
      toast({ title: 'Settings Updated', description: 'Negative scoring settings saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Fetch negative scoring rules
export function useNegativeScoringRules() {
  return useQuery({
    queryKey: ['negative-scoring-rules'],
    queryFn: async (): Promise<NegativeScoringRule[]> => {
      const { data, error } = await supabase
        .from('negative_scoring_rules')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as NegativeScoringRule[];
    },
  });
}

// Create negative scoring rule
export function useCreateNegativeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<NegativeScoringRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('negative_scoring_rules').insert([rule]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negative-scoring-rules'] });
      toast({ title: 'Rule Created', description: 'Negative scoring rule added.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Update negative scoring rule
export function useUpdateNegativeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NegativeScoringRule> & { id: string }) => {
      const { error } = await supabase
        .from('negative_scoring_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negative-scoring-rules'] });
      toast({ title: 'Rule Updated', description: 'Negative scoring rule saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Delete negative scoring rule
export function useDeleteNegativeRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('negative_scoring_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negative-scoring-rules'] });
      toast({ title: 'Rule Deleted', description: 'Negative scoring rule removed.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Fetch disqualified leads
export function useDisqualifiedLeads() {
  return useQuery({
    queryKey: ['disqualified-leads'],
    queryFn: async (): Promise<DisqualifiedLead[]> => {
      const { data, error } = await supabase
        .from('disqualified_leads')
        .select('*')
        .order('disqualified_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(lead => ({
        ...lead,
        triggered_rules: (lead.triggered_rules as unknown as TriggeredRule[]) || [],
      })) as DisqualifiedLead[];
    },
  });
}

// Check if a lead is disqualified
export function useLeadDisqualification(leadId: string) {
  return useQuery({
    queryKey: ['disqualified-lead', leadId],
    queryFn: async (): Promise<DisqualifiedLead | null> => {
      const { data, error } = await supabase
        .from('disqualified_leads')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        triggered_rules: (data.triggered_rules as unknown as TriggeredRule[]) || [],
      } as DisqualifiedLead;
    },
    enabled: !!leadId,
  });
}

// Override disqualification
export function useOverrideDisqualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, reason, overriddenBy }: { leadId: string; reason: string; overriddenBy?: string }) => {
      const { error } = await supabase
        .from('disqualified_leads')
        .update({
          is_overridden: true,
          override_reason: reason,
          overridden_at: new Date().toISOString(),
          overridden_by: overriddenBy || 'user',
          updated_at: new Date().toISOString(),
        })
        .eq('lead_id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disqualified-leads'] });
      queryClient.invalidateQueries({ queryKey: ['disqualified-lead'] });
      toast({ title: 'Override Applied', description: 'Lead disqualification overridden.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Remove disqualification
export function useRemoveDisqualification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from('disqualified_leads').delete().eq('lead_id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disqualified-leads'] });
      queryClient.invalidateQueries({ queryKey: ['disqualified-lead'] });
      toast({ title: 'Removed', description: 'Lead removed from disqualified list.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Disqualify a lead
export function useDisqualifyLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, totalScore, triggeredRules }: { leadId: string; totalScore: number; triggeredRules: TriggeredRule[] }) => {
      const { error } = await supabase.from('disqualified_leads').upsert([{
        lead_id: leadId,
        total_negative_score: totalScore,
        triggered_rules: triggeredRules as unknown as Json,
        disqualified_at: new Date().toISOString(),
        is_overridden: false,
        override_reason: null,
        overridden_at: null,
        overridden_by: null,
      }], { onConflict: 'lead_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disqualified-leads'] });
      queryClient.invalidateQueries({ queryKey: ['disqualified-lead'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Calculate negative score for a lead (client-side evaluation)
export function evaluateNegativeScore(
  leadData: {
    email?: string;
    pagesVisited?: string[];
    isCompetitor?: boolean;
    isSpamSource?: boolean;
    hasFakeData?: boolean;
  },
  rules: NegativeScoringRule[],
  settings: NegativeScoringSettings
): NegativeScoreResult {
  const triggeredRules: TriggeredRule[] = [];
  let totalScore = 0;

  const enabledRules = rules.filter(r => r.enabled);

  for (const rule of enabledRules) {
    let triggered = false;

    switch (rule.condition_type as NegativeConditionType) {
      case 'personal_email':
        if (leadData.email) {
          const personalDomains = rule.condition_value.split(',').map(d => d.trim().toLowerCase());
          const emailDomain = leadData.email.split('@')[1]?.toLowerCase();
          if (emailDomain && personalDomains.includes(emailDomain)) {
            triggered = true;
          }
        }
        break;

      case 'career_page_only':
        if (leadData.pagesVisited && leadData.pagesVisited.length > 0) {
          const careerKeywords = ['career', 'jobs', 'job', 'hiring', 'openings', 'work-with-us'];
          const allCareer = leadData.pagesVisited.every(page =>
            careerKeywords.some(keyword => page.toLowerCase().includes(keyword))
          );
          if (allCareer) triggered = true;
        }
        break;

      case 'competitor':
        if (leadData.isCompetitor) triggered = true;
        break;

      case 'spam_source':
        if (leadData.isSpamSource) triggered = true;
        break;

      case 'fake_data':
        if (leadData.hasFakeData) triggered = true;
        break;

      case 'custom':
        // Custom rules would need specific logic
        break;
    }

    if (triggered) {
      triggeredRules.push({
        rule_id: rule.id,
        rule_name: rule.name,
        points: rule.points,
        reason: rule.reason_label,
      });
      totalScore += rule.points;
    }
  }

  const isDisqualified = settings.auto_disqualify && totalScore <= settings.disqualification_threshold;

  return {
    totalScore,
    triggeredRules,
    isDisqualified,
  };
}
