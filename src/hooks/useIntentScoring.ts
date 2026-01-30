import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  IntentSettings, 
  FirstPartySignal, 
  ThirdPartySignal,
  IntentSignal,
  IntentScore,
  FirstPartySignalType,
  ThirdPartySignalType,
  ConfidenceLevel,
} from '@/types/intent-scoring';
import { toast } from 'sonner';

export function useIntentScoring(leadId?: string) {
  const [settings, setSettings] = useState<IntentSettings | null>(null);
  const [firstPartySignals, setFirstPartySignals] = useState<FirstPartySignal[]>([]);
  const [thirdPartySignals, setThirdPartySignals] = useState<ThirdPartySignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('intent_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as IntentSettings | null);
    } catch (err) {
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    if (!leadId) return;

    try {
      const [firstPartyRes, thirdPartyRes] = await Promise.all([
        supabase
          .from('first_party_signals')
          .select('*')
          .eq('lead_id', leadId)
          .order('observed_at', { ascending: false }),
        supabase
          .from('third_party_signals')
          .select('*')
          .eq('lead_id', leadId)
          .order('observed_at', { ascending: false }),
      ]);

      if (firstPartyRes.error) throw firstPartyRes.error;
      if (thirdPartyRes.error) throw thirdPartyRes.error;

      setFirstPartySignals((firstPartyRes.data || []) as FirstPartySignal[]);
      setThirdPartySignals((thirdPartyRes.data || []) as ThirdPartySignal[]);
    } catch (err) {
    }
  }, [leadId]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSettings(), fetchSignals()]);
    setIsLoading(false);
  }, [fetchSettings, fetchSignals]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleIntentScoring = async (enabled: boolean) => {
    try {
      if (!settings?.id) {
        const { data, error } = await supabase
          .from('intent_settings')
          .insert([{ intent_enabled: enabled }])
          .select()
          .single();
        if (error) throw error;
        setSettings(data as IntentSettings);
      } else {
        const { data, error } = await supabase
          .from('intent_settings')
          .update({ intent_enabled: enabled })
          .eq('id', settings.id)
          .select()
          .single();
        if (error) throw error;
        setSettings(data as IntentSettings);
      }
      toast.success(enabled ? 'Intent scoring enabled' : 'Intent scoring disabled');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const updateSettings = async (updates: Partial<IntentSettings>) => {
    try {
      if (!settings?.id) return;
      
      const { data, error } = await supabase
        .from('intent_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      setSettings(data as IntentSettings);
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const addFirstPartySignal = async (signal: {
    lead_id: string;
    signal_type: FirstPartySignalType;
    page_url?: string;
    visit_count?: number;
    observed_at?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('first_party_signals')
        .insert([signal])
        .select()
        .single();

      if (error) throw error;
      setFirstPartySignals(prev => [data as FirstPartySignal, ...prev]);
      toast.success('Signal added');
      return data;
    } catch (err) {
      toast.error('Failed to add signal');
      return null;
    }
  };

  const addThirdPartySignal = async (signal: {
    lead_id: string;
    source_name: string;
    signal_type: ThirdPartySignalType;
    confidence_level: ConfidenceLevel;
    notes?: string;
    observed_at?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('third_party_signals')
        .insert([signal])
        .select()
        .single();

      if (error) throw error;
      setThirdPartySignals(prev => [data as ThirdPartySignal, ...prev]);
      toast.success('Third-party signal added');
      return data;
    } catch (err) {
      console.error('Error adding signal:', err);
      toast.error('Failed to add signal');
      return null;
    }
  };

  const deleteFirstPartySignal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('first_party_signals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setFirstPartySignals(prev => prev.filter(s => s.id !== id));
      toast.success('Signal removed');
    } catch (err) {
      console.error('Error deleting signal:', err);
      toast.error('Failed to remove signal');
    }
  };

  const deleteThirdPartySignal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('third_party_signals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setThirdPartySignals(prev => prev.filter(s => s.id !== id));
      toast.success('Signal removed');
    } catch (err) {
      console.error('Error deleting signal:', err);
      toast.error('Failed to remove signal');
    }
  };

  // Calculate intent score
  const calculateIntentScore = useCallback((): IntentScore => {
    if (!settings) {
      return { score: 0, isInMarket: false, firstPartyScore: 0, thirdPartyScore: 0, signalCount: 0 };
    }

    // Calculate first-party score
    let firstPartyScore = 0;
    for (const signal of firstPartySignals) {
      const weight = getFirstPartyWeight(signal.signal_type, settings);
      const multiplier = Math.min(signal.visit_count, 5); // Cap at 5 visits
      firstPartyScore += weight * (1 + (multiplier - 1) * 0.2); // Diminishing returns
    }

    // Calculate third-party score
    let thirdPartyScore = 0;
    for (const signal of thirdPartySignals) {
      const weight = getThirdPartyWeight(signal.signal_type, settings);
      const confidenceMultiplier = signal.confidence_level === 'high' ? 1 : signal.confidence_level === 'medium' ? 0.7 : 0.4;
      thirdPartyScore += weight * confidenceMultiplier;
    }

    // Apply category weights
    const weightedFirstParty = firstPartyScore * settings.first_party_weight;
    const weightedThirdParty = thirdPartyScore * settings.third_party_weight;

    // Total score (capped at 100)
    const totalScore = Math.min(100, Math.round(weightedFirstParty + weightedThirdParty));

    return {
      score: totalScore,
      isInMarket: totalScore >= settings.in_market_threshold,
      firstPartyScore: Math.round(firstPartyScore),
      thirdPartyScore: Math.round(thirdPartyScore),
      signalCount: firstPartySignals.length + thirdPartySignals.length,
    };
  }, [settings, firstPartySignals, thirdPartySignals]);

  // Get timeline of all signals sorted chronologically
  const getTimeline = useCallback((): IntentSignal[] => {
    const timeline: IntentSignal[] = [
      ...firstPartySignals.map(s => ({ ...s, source: 'first_party' as const })),
      ...thirdPartySignals.map(s => ({ ...s, source: 'third_party' as const })),
    ];

    return timeline.sort((a, b) => 
      new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime()
    );
  }, [firstPartySignals, thirdPartySignals]);

  return {
    settings,
    firstPartySignals,
    thirdPartySignals,
    isLoading,
    intentScore: calculateIntentScore(),
    timeline: getTimeline(),
    toggleIntentScoring,
    updateSettings,
    addFirstPartySignal,
    addThirdPartySignal,
    deleteFirstPartySignal,
    deleteThirdPartySignal,
    refetch,
  };
}

function getFirstPartyWeight(type: FirstPartySignalType, settings: IntentSettings): number {
  const weights: Record<FirstPartySignalType, number> = {
    pricing_page: settings.pricing_page_weight,
    demo_page: settings.demo_page_weight,
    product_page: settings.product_page_weight,
    email_open: settings.email_open_weight,
    email_click: settings.email_click_weight,
    email_reply: settings.email_reply_weight,
    trial_signup: settings.trial_signup_weight,
    comparison_page: settings.product_page_weight, // Use product page weight
  };
  return weights[type] || 10;
}

function getThirdPartyWeight(type: ThirdPartySignalType, settings: IntentSettings): number {
  const weights: Record<ThirdPartySignalType, number> = {
    g2_research: settings.g2_research_weight,
    trustradius_research: settings.trustradius_weight,
    competitor_comparison: settings.competitor_research_weight,
    intent_provider: settings.intent_provider_weight,
    capterra_research: settings.trustradius_weight, // Use trustradius weight
    other: 10,
  };
  return weights[type] || 10;
}
