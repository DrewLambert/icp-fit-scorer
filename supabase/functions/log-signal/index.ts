import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Valid first-party signal types
const VALID_SIGNAL_TYPES = [
  'pricing_page',
  'demo_page',
  'product_page',
  'email_open',
  'email_click',
  'email_reply',
  'trial_signup',
  'comparison_page',
] as const;

type SignalType = typeof VALID_SIGNAL_TYPES[number];

interface SignalPayload {
  lead_id: string;
  signal_type: SignalType;
  page_url?: string;
  visit_count?: number;
  metadata?: Record<string, unknown>;
  observed_at?: string;
}

interface BatchSignalPayload {
  signals: SignalPayload[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const url = new URL(req.url);
    const isBatch = url.searchParams.get('batch') === 'true';

    console.log(`[log-signal] Received ${isBatch ? 'batch' : 'single'} request`);

    if (isBatch) {
      // Handle batch signal logging
      const { signals } = body as BatchSignalPayload;

      if (!signals || !Array.isArray(signals) || signals.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid batch payload: signals array required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate all signals
      const validationErrors: string[] = [];
      const validSignals: SignalPayload[] = [];

      for (let i = 0; i < signals.length; i++) {
        const signal = signals[i];
        const errors = validateSignal(signal);
        if (errors.length > 0) {
          validationErrors.push(`Signal ${i}: ${errors.join(', ')}`);
        } else {
          validSignals.push(signal);
        }
      }

      if (validSignals.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid signals', details: validationErrors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert valid signals
      const signalsToInsert = validSignals.map(signal => ({
        lead_id: signal.lead_id,
        signal_type: signal.signal_type,
        page_url: signal.page_url || null,
        visit_count: signal.visit_count || 1,
        metadata: signal.metadata || {},
        observed_at: signal.observed_at || new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('first_party_signals')
        .insert(signalsToInsert)
        .select();

      if (error) {
        console.error('[log-signal] Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to log signals', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[log-signal] Successfully logged ${data.length} signals`);

      return new Response(
        JSON.stringify({
          success: true,
          logged: data.length,
          skipped: signals.length - validSignals.length,
          validation_errors: validationErrors.length > 0 ? validationErrors : undefined,
          signals: data,
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Handle single signal logging
      const signal = body as SignalPayload;

      const errors = validateSignal(signal);
      if (errors.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for existing signal to increment visit_count
      const { data: existing } = await supabase
        .from('first_party_signals')
        .select('id, visit_count')
        .eq('lead_id', signal.lead_id)
        .eq('signal_type', signal.signal_type)
        .eq('page_url', signal.page_url || '')
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let result;

      if (existing && !signal.visit_count) {
        // Update existing signal with incremented visit count
        const { data, error } = await supabase
          .from('first_party_signals')
          .update({
            visit_count: (existing.visit_count || 1) + 1,
            observed_at: signal.observed_at || new Date().toISOString(),
            metadata: signal.metadata || {},
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = { ...data, action: 'updated' };
        console.log(`[log-signal] Updated signal ${existing.id}, visit_count: ${result.visit_count}`);
      } else {
        // Insert new signal
        const { data, error } = await supabase
          .from('first_party_signals')
          .insert({
            lead_id: signal.lead_id,
            signal_type: signal.signal_type,
            page_url: signal.page_url || null,
            visit_count: signal.visit_count || 1,
            metadata: signal.metadata || {},
            observed_at: signal.observed_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = { ...data, action: 'created' };
        console.log(`[log-signal] Created new signal ${result.id}`);
      }

      return new Response(
        JSON.stringify({ success: true, signal: result }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[log-signal] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function validateSignal(signal: SignalPayload): string[] {
  const errors: string[] = [];

  if (!signal.lead_id || typeof signal.lead_id !== 'string') {
    errors.push('lead_id is required and must be a string');
  }

  if (!signal.signal_type) {
    errors.push('signal_type is required');
  } else if (!VALID_SIGNAL_TYPES.includes(signal.signal_type as SignalType)) {
    errors.push(`Invalid signal_type. Must be one of: ${VALID_SIGNAL_TYPES.join(', ')}`);
  }

  if (signal.visit_count !== undefined && (typeof signal.visit_count !== 'number' || signal.visit_count < 1)) {
    errors.push('visit_count must be a positive number');
  }

  if (signal.observed_at !== undefined) {
    const date = new Date(signal.observed_at);
    if (isNaN(date.getTime())) {
      errors.push('observed_at must be a valid ISO date string');
    }
  }

  return errors;
}
