-- Intent scoring settings table
CREATE TABLE public.intent_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_enabled BOOLEAN NOT NULL DEFAULT false,
  in_market_threshold INTEGER NOT NULL DEFAULT 50,
  first_party_weight NUMERIC NOT NULL DEFAULT 0.7,
  third_party_weight NUMERIC NOT NULL DEFAULT 0.3,
  -- Individual signal weights (first-party)
  pricing_page_weight INTEGER NOT NULL DEFAULT 25,
  demo_page_weight INTEGER NOT NULL DEFAULT 30,
  product_page_weight INTEGER NOT NULL DEFAULT 15,
  email_open_weight INTEGER NOT NULL DEFAULT 5,
  email_click_weight INTEGER NOT NULL DEFAULT 10,
  email_reply_weight INTEGER NOT NULL DEFAULT 20,
  trial_signup_weight INTEGER NOT NULL DEFAULT 35,
  -- Individual signal weights (third-party)
  g2_research_weight INTEGER NOT NULL DEFAULT 20,
  trustradius_weight INTEGER NOT NULL DEFAULT 20,
  competitor_research_weight INTEGER NOT NULL DEFAULT 15,
  intent_provider_weight INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- First-party intent signals table
CREATE TABLE public.first_party_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('pricing_page', 'demo_page', 'product_page', 'email_open', 'email_click', 'email_reply', 'trial_signup', 'comparison_page')),
  page_url TEXT,
  visit_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Third-party intent signals table
CREATE TABLE public.third_party_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('g2_research', 'trustradius_research', 'competitor_comparison', 'intent_provider', 'capterra_research', 'other')),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
  notes TEXT,
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_first_party_signals_lead_id ON public.first_party_signals(lead_id);
CREATE INDEX idx_first_party_signals_observed_at ON public.first_party_signals(observed_at DESC);
CREATE INDEX idx_third_party_signals_lead_id ON public.third_party_signals(lead_id);
CREATE INDEX idx_third_party_signals_observed_at ON public.third_party_signals(observed_at DESC);

-- Enable RLS
ALTER TABLE public.intent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.first_party_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intent_settings
CREATE POLICY "Allow public read on intent_settings" ON public.intent_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on intent_settings" ON public.intent_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on intent_settings" ON public.intent_settings FOR UPDATE USING (true);

-- RLS Policies for first_party_signals
CREATE POLICY "Allow public read on first_party_signals" ON public.first_party_signals FOR SELECT USING (true);
CREATE POLICY "Allow public insert on first_party_signals" ON public.first_party_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on first_party_signals" ON public.first_party_signals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on first_party_signals" ON public.first_party_signals FOR DELETE USING (true);

-- RLS Policies for third_party_signals
CREATE POLICY "Allow public read on third_party_signals" ON public.third_party_signals FOR SELECT USING (true);
CREATE POLICY "Allow public insert on third_party_signals" ON public.third_party_signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on third_party_signals" ON public.third_party_signals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on third_party_signals" ON public.third_party_signals FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_intent_settings_updated_at
  BEFORE UPDATE ON public.intent_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.intent_settings (intent_enabled) VALUES (false);

-- Insert sample first-party signals for demo
INSERT INTO public.first_party_signals (lead_id, signal_type, page_url, visit_count, observed_at) VALUES
  ('demo-lead-1', 'pricing_page', '/pricing', 3, now() - interval '2 days'),
  ('demo-lead-1', 'demo_page', '/demo', 2, now() - interval '1 day'),
  ('demo-lead-1', 'email_click', NULL, 1, now() - interval '12 hours'),
  ('demo-lead-1', 'product_page', '/features', 5, now() - interval '3 days');

-- Insert sample third-party signals for demo
INSERT INTO public.third_party_signals (lead_id, source_name, signal_type, confidence_level, notes, observed_at) VALUES
  ('demo-lead-1', 'G2', 'g2_research', 'high', 'Viewed product comparison page', now() - interval '5 days'),
  ('demo-lead-1', 'Bombora', 'intent_provider', 'medium', 'Surge score detected for CRM category', now() - interval '3 days');