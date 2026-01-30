import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import {
  EngagementSettings,
  EngagementType,
  EngagementEvent,
  EngagementScore,
  LeadEngagementSummary,
  EngagementCategory,
  calculateDecayMultiplier,
  getTemperatureFromScore,
} from '@/types/engagement-scoring';

// Fetch engagement settings
export function useEngagementSettings() {
  return useQuery({
    queryKey: ['engagement-settings'],
    queryFn: async (): Promise<EngagementSettings> => {
      const { data, error } = await supabase
        .from('engagement_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from('engagement_settings')
          .insert({
            engagement_enabled: false,
            decay_period_days: 30,
            cold_threshold: 20,
            warm_threshold: 50,
            hot_threshold: 80,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as EngagementSettings;
      }

      return data as EngagementSettings;
    },
  });
}

// Update engagement settings
export function useUpdateEngagementSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<EngagementSettings>) => {
      const { data: existing } = await supabase
        .from('engagement_settings')
        .select('id')
        .maybeSingle();

      if (!existing) throw new Error('Settings not found');

      const { error } = await supabase
        .from('engagement_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-settings'] });
      toast({ title: 'Settings Updated', description: 'Engagement settings saved successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Fetch engagement types
export function useEngagementTypes() {
  return useQuery({
    queryKey: ['engagement-types'],
    queryFn: async (): Promise<EngagementType[]> => {
      const { data, error } = await supabase
        .from('engagement_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as EngagementType[];
    },
  });
}

// Update engagement type points
export function useUpdateEngagementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, current_points, enabled }: { id: string; current_points?: number; enabled?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (current_points !== undefined) updates.current_points = current_points;
      if (enabled !== undefined) updates.enabled = enabled;

      const { error } = await supabase
        .from('engagement_types')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-types'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Fetch engagement events for a lead
export function useLeadEngagementEvents(leadId: string) {
  return useQuery({
    queryKey: ['engagement-events', leadId],
    queryFn: async (): Promise<EngagementEvent[]> => {
      const { data, error } = await supabase
        .from('engagement_events')
        .select(`
          *,
          engagement_type:engagement_types(*)
        `)
        .eq('lead_id', leadId)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EngagementEvent[];
    },
    enabled: !!leadId,
  });
}

// Log a new engagement event
export function useLogEngagementEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      engagementTypeId,
      pointsEarned,
      occurredAt,
      metadata,
    }: {
      leadId: string;
      engagementTypeId: string;
      pointsEarned: number;
      occurredAt?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from('engagement_events').insert([{
        lead_id: leadId,
        engagement_type_id: engagementTypeId,
        points_earned: pointsEarned,
        occurred_at: occurredAt || new Date().toISOString(),
        metadata: (metadata || {}) as Json,
      }]);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['engagement-events', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['top-engaged-leads'] });
      toast({ title: 'Event Logged', description: 'Engagement event recorded successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Calculate engagement score for a lead
export function useLeadEngagementScore(leadId: string) {
  const { data: settings } = useEngagementSettings();
  const { data: events } = useLeadEngagementEvents(leadId);

  if (!settings || !events) {
    return {
      score: null,
      isLoading: true,
    };
  }

  const rawScore = events.reduce((sum, event) => sum + event.points_earned, 0);
  
  const decayedScore = Math.round(
    events.reduce((sum, event) => {
      const multiplier = calculateDecayMultiplier(event.occurred_at, settings.decay_period_days);
      return sum + event.points_earned * multiplier;
    }, 0)
  );

  const lastActivity = events.length > 0 ? events[0].occurred_at : null;

  const score: EngagementScore = {
    rawScore,
    decayedScore,
    temperature: getTemperatureFromScore(decayedScore, settings),
    eventCount: events.length,
    lastActivity,
  };

  return { score, isLoading: false };
}

// Fetch top engaged leads
export function useTopEngagedLeads(timePeriodDays: number = 30, limit: number = 10) {
  const { data: settings } = useEngagementSettings();
  const { data: types } = useEngagementTypes();

  return useQuery({
    queryKey: ['top-engaged-leads', timePeriodDays, limit],
    queryFn: async (): Promise<LeadEngagementSummary[]> => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timePeriodDays);

      const { data: events, error } = await supabase
        .from('engagement_events')
        .select(`
          *,
          engagement_type:engagement_types(*)
        `)
        .gte('occurred_at', cutoffDate.toISOString())
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      if (!settings) return [];

      // Group events by lead
      const leadEvents: Record<string, EngagementEvent[]> = {};
      for (const event of events || []) {
        const typedEvent = event as EngagementEvent;
        if (!leadEvents[typedEvent.lead_id]) {
          leadEvents[typedEvent.lead_id] = [];
        }
        leadEvents[typedEvent.lead_id].push(typedEvent);
      }

      // Calculate scores for each lead
      const summaries: LeadEngagementSummary[] = Object.entries(leadEvents).map(([leadId, leadEventList]) => {
        const rawScore = leadEventList.reduce((sum, e) => sum + e.points_earned, 0);
        const decayedScore = Math.round(
          leadEventList.reduce((sum, e) => {
            const multiplier = calculateDecayMultiplier(e.occurred_at, settings.decay_period_days);
            return sum + e.points_earned * multiplier;
          }, 0)
        );

        return {
          leadId,
          score: {
            rawScore,
            decayedScore,
            temperature: getTemperatureFromScore(decayedScore, settings),
            eventCount: leadEventList.length,
            lastActivity: leadEventList[0]?.occurred_at || null,
          },
          recentEvents: leadEventList.slice(0, 5),
        };
      });

      // Sort by decayed score and limit
      return summaries
        .sort((a, b) => b.score.decayedScore - a.score.decayedScore)
        .slice(0, limit);
    },
    enabled: !!settings,
  });
}

// Get engagement breakdown by category
export function useEngagementBreakdown(leadId: string) {
  const { data: events } = useLeadEngagementEvents(leadId);
  const { data: settings } = useEngagementSettings();

  if (!events || !settings) return null;

  const breakdown: Record<EngagementCategory, { count: number; points: number; decayedPoints: number }> = {
    email: { count: 0, points: 0, decayedPoints: 0 },
    content: { count: 0, points: 0, decayedPoints: 0 },
    web: { count: 0, points: 0, decayedPoints: 0 },
    social: { count: 0, points: 0, decayedPoints: 0 },
    event: { count: 0, points: 0, decayedPoints: 0 },
  };

  for (const event of events) {
    const category = (event.engagement_type?.category || 'web') as EngagementCategory;
    const multiplier = calculateDecayMultiplier(event.occurred_at, settings.decay_period_days);
    
    breakdown[category].count += 1;
    breakdown[category].points += event.points_earned;
    breakdown[category].decayedPoints += Math.round(event.points_earned * multiplier);
  }

  return breakdown;
}
