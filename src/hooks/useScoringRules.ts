import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScoringRule, ScoringSettings, ConditionType, RuleCategory } from '@/types/scoring-rules';
import { toast } from 'sonner';

export function useScoringRules() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [settings, setSettings] = useState<ScoringSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_rules')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Cast the data to our type (handling the enum conversion)
      const typedRules = (data || []).map(rule => ({
        ...rule,
        condition_type: rule.condition_type as ConditionType,
        category: rule.category as RuleCategory,
      })) as ScoringRule[];
      
      setRules(typedRules);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to load scoring rules');
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as ScoringSettings | null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load scoring settings');
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchRules(), fetchSettings()]);
    setIsLoading(false);
  }, [fetchRules, fetchSettings]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createRule = async (rule: Omit<ScoringRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('scoring_rules')
        .insert([rule])
        .select()
        .single();

      if (error) throw error;
      
      const typedRule = {
        ...data,
        condition_type: data.condition_type as ConditionType,
        category: data.category as RuleCategory,
      } as ScoringRule;
      
      setRules(prev => [...prev, typedRule].sort((a, b) => a.sort_order - b.sort_order));
      toast.success('Rule created successfully');
      return typedRule;
    } catch (err) {
      console.error('Error creating rule:', err);
      toast.error('Failed to create rule');
      return null;
    }
  };

  const updateRule = async (id: string, updates: Partial<ScoringRule>) => {
    try {
      const { data, error } = await supabase
        .from('scoring_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const typedRule = {
        ...data,
        condition_type: data.condition_type as ConditionType,
        category: data.category as RuleCategory,
      } as ScoringRule;
      
      setRules(prev => prev.map(r => r.id === id ? typedRule : r));
      toast.success('Rule updated successfully');
      return typedRule;
    } catch (err) {
      console.error('Error updating rule:', err);
      toast.error('Failed to update rule');
      return null;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scoring_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast.error('Failed to delete rule');
      return false;
    }
  };

  const toggleRuleEnabled = async (id: string, enabled: boolean) => {
    return updateRule(id, { enabled });
  };

  const reorderRules = async (reorderedRules: ScoringRule[]) => {
    // Optimistically update local state
    setRules(reorderedRules);
    
    try {
      // Update sort_order for each rule in the database
      const updates = reorderedRules.map((rule, index) => 
        supabase
          .from('scoring_rules')
          .update({ sort_order: index + 1 })
          .eq('id', rule.id)
      );
      
      await Promise.all(updates);
      toast.success('Rules reordered successfully');
    } catch (err) {
      console.error('Error reordering rules:', err);
      toast.error('Failed to reorder rules');
      // Refetch to restore correct order on error
      fetchRules();
    }
  };

  const updateSettings = async (updates: Partial<ScoringSettings>) => {
    try {
      if (!settings?.id) {
        // Create settings if they don't exist
        const { data, error } = await supabase
          .from('scoring_settings')
          .insert([{ 
            rule_based_enabled: updates.rule_based_enabled ?? false,
            qualification_threshold: updates.qualification_threshold ?? 50
          }])
          .select()
          .single();

        if (error) throw error;
        setSettings(data as ScoringSettings);
      } else {
        const { data, error } = await supabase
          .from('scoring_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as ScoringSettings);
      }
      
      toast.success('Settings updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      toast.error('Failed to update settings');
      return false;
    }
  };

  const toggleRuleBasedScoring = async (enabled: boolean) => {
    return updateSettings({ rule_based_enabled: enabled });
  };

  const setQualificationThreshold = async (threshold: number) => {
    return updateSettings({ qualification_threshold: threshold });
  };

  return {
    rules,
    settings,
    isLoading,
    error,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleEnabled,
    reorderRules,
    toggleRuleBasedScoring,
    setQualificationThreshold,
  };
}
