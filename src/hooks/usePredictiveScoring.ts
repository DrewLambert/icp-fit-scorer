import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  PredictiveSettings, 
  PredictiveModelState, 
  HistoricalDeal,
  FeatureWeights 
} from '@/types/predictive-scoring';
import { toast } from 'sonner';

export function usePredictiveScoring() {
  const [settings, setSettings] = useState<PredictiveSettings | null>(null);
  const [modelState, setModelState] = useState<PredictiveModelState | null>(null);
  const [dealCount, setDealCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('predictive_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as PredictiveSettings | null);
    } catch (err) {
    }
  }, []);

  const fetchModelState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('predictive_model_state')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Cast the data properly with unknown intermediate
      if (data) {
        setModelState({
          ...data,
          feature_weights: data.feature_weights as unknown as FeatureWeights,
          training_status: data.training_status as PredictiveModelState['training_status'],
        } as PredictiveModelState);
      }
    } catch (err) {
    }
  }, []);

  const fetchDealCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('historical_deals')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setDealCount(count || 0);
    } catch (err) {
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSettings(), fetchModelState(), fetchDealCount()]);
    setIsLoading(false);
  }, [fetchSettings, fetchModelState, fetchDealCount]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const togglePredictiveScoring = async (enabled: boolean) => {
    try {
      if (!settings?.id) {
        const { data, error } = await supabase
          .from('predictive_settings')
          .insert([{ predictive_enabled: enabled }])
          .select()
          .single();
        if (error) throw error;
        setSettings(data as PredictiveSettings);
      } else {
        const { data, error } = await supabase
          .from('predictive_settings')
          .update({ predictive_enabled: enabled })
          .eq('id', settings.id)
          .select()
          .single();
        if (error) throw error;
        setSettings(data as PredictiveSettings);
      }
      toast.success(enabled ? 'Predictive scoring enabled' : 'Predictive scoring disabled');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const updateMinThreshold = async (threshold: number) => {
    try {
      if (!settings?.id) return;
      
      const { data, error } = await supabase
        .from('predictive_settings')
        .update({ min_deals_threshold: threshold })
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      setSettings(data as PredictiveSettings);
      toast.success('Threshold updated');
    } catch (err) {
      toast.error('Failed to update threshold');
    }
  };

  const trainModel = async () => {
    setIsTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('train-predictive-model', {});

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`Model trained successfully! Accuracy: ${data.accuracy?.toFixed(1)}%`);
      await fetchModelState();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to train model');
    } finally {
      setIsTraining(false);
    }
  };

  const hasEnoughData = dealCount >= (settings?.min_deals_threshold || 50);

  return {
    settings,
    modelState,
    dealCount,
    isLoading,
    isTraining,
    hasEnoughData,
    togglePredictiveScoring,
    updateMinThreshold,
    trainModel,
    refetch,
  };
}
