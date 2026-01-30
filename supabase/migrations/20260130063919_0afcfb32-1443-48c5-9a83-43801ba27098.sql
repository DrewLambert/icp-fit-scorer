-- Negative Lead Scoring Tables

-- Negative scoring settings
CREATE TABLE public.negative_scoring_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negative_enabled BOOLEAN NOT NULL DEFAULT false,
  disqualification_threshold INTEGER NOT NULL DEFAULT -25,
  subtract_from_other_models BOOLEAN NOT NULL DEFAULT true,
  auto_disqualify BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Negative scoring rules
CREATE TABLE public.negative_scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- personal_email, career_page_only, competitor, spam_source, fake_data, custom
  condition_value TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL, -- Negative value (e.g., -10, -15)
  reason_label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disqualified leads tracking
CREATE TABLE public.disqualified_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  total_negative_score INTEGER NOT NULL,
  triggered_rules JSONB NOT NULL DEFAULT '[]', -- Array of {rule_id, rule_name, points, reason}
  disqualified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_overridden BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  overridden_at TIMESTAMP WITH TIME ZONE,
  overridden_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Enable RLS
ALTER TABLE public.negative_scoring_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negative_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disqualified_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for negative_scoring_settings
CREATE POLICY "Allow read negative_scoring_settings" ON public.negative_scoring_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert negative_scoring_settings" ON public.negative_scoring_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update negative_scoring_settings" ON public.negative_scoring_settings FOR UPDATE USING (true);

-- RLS Policies for negative_scoring_rules
CREATE POLICY "Allow read negative_scoring_rules" ON public.negative_scoring_rules FOR SELECT USING (true);
CREATE POLICY "Allow insert negative_scoring_rules" ON public.negative_scoring_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update negative_scoring_rules" ON public.negative_scoring_rules FOR UPDATE USING (true);
CREATE POLICY "Allow delete negative_scoring_rules" ON public.negative_scoring_rules FOR DELETE USING (true);

-- RLS Policies for disqualified_leads
CREATE POLICY "Allow read disqualified_leads" ON public.disqualified_leads FOR SELECT USING (true);
CREATE POLICY "Allow insert disqualified_leads" ON public.disqualified_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update disqualified_leads" ON public.disqualified_leads FOR UPDATE USING (true);
CREATE POLICY "Allow delete disqualified_leads" ON public.disqualified_leads FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_negative_rules_enabled ON public.negative_scoring_rules(enabled);
CREATE INDEX idx_disqualified_leads_lead_id ON public.disqualified_leads(lead_id);
CREATE INDEX idx_disqualified_leads_overridden ON public.disqualified_leads(is_overridden);

-- Insert default settings
INSERT INTO public.negative_scoring_settings (negative_enabled, disqualification_threshold, subtract_from_other_models, auto_disqualify)
VALUES (false, -25, true, true);

-- Insert default negative scoring rules
INSERT INTO public.negative_scoring_rules (name, condition_type, condition_value, points, reason_label, description, sort_order) VALUES
  ('Personal Email Domain', 'personal_email', 'gmail.com,yahoo.com,hotmail.com,outlook.com,aol.com,icloud.com', -10, 'Uses personal email', 'Lead is using a personal email domain instead of a business email', 1),
  ('Career Page Only', 'career_page_only', '', -15, 'Job seeker behavior', 'Lead only engages with career or jobs pages, likely a job seeker', 2),
  ('Known Competitor', 'competitor', '', -20, 'Competitor detected', 'Lead is flagged as a competitor or from a competing company', 3),
  ('Spam Source', 'spam_source', '', -20, 'Known spam source', 'Lead originates from a known spam source or bot activity', 4),
  ('Fake/Inconsistent Data', 'fake_data', '', -30, 'Data quality issue', 'Multiple form submissions with fake, gibberish, or inconsistent data', 5);

-- Insert sample disqualified lead for demo
INSERT INTO public.disqualified_leads (lead_id, total_negative_score, triggered_rules)
VALUES (
  'demo-disqualified-001',
  -35,
  '[{"rule_name": "Personal Email Domain", "points": -10, "reason": "Uses personal email"}, {"rule_name": "Career Page Only", "points": -15, "reason": "Job seeker behavior"}, {"rule_name": "Spam Source", "points": -10, "reason": "Known spam source"}]'::jsonb
);