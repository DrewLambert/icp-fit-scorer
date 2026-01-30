-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for rule categories
CREATE TYPE rule_category AS ENUM ('demographic', 'firmographic', 'behavioral');

-- Create enum for condition types
CREATE TYPE condition_type AS ENUM (
  'job_title_contains',
  'email_domain_personal',
  'email_domain_business',
  'company_size_range',
  'industry_matches',
  'visited_pricing_page',
  'visited_product_page',
  'blog_only_engagement',
  'funding_stage',
  'region_matches',
  'custom'
);

-- Create scoring_settings table for global settings
CREATE TABLE public.scoring_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_based_enabled BOOLEAN NOT NULL DEFAULT false,
  qualification_threshold INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scoring_rules table
CREATE TABLE public.scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type condition_type NOT NULL,
  condition_value TEXT NOT NULL,
  points INTEGER NOT NULL,
  category rule_category NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scoring_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (no auth required for this demo)
CREATE POLICY "Allow public read on scoring_settings" 
ON public.scoring_settings FOR SELECT USING (true);

CREATE POLICY "Allow public insert on scoring_settings" 
ON public.scoring_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on scoring_settings" 
ON public.scoring_settings FOR UPDATE USING (true);

CREATE POLICY "Allow public read on scoring_rules" 
ON public.scoring_rules FOR SELECT USING (true);

CREATE POLICY "Allow public insert on scoring_rules" 
ON public.scoring_rules FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on scoring_rules" 
ON public.scoring_rules FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on scoring_rules" 
ON public.scoring_rules FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_scoring_settings_updated_at
BEFORE UPDATE ON public.scoring_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scoring_rules_updated_at
BEFORE UPDATE ON public.scoring_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.scoring_settings (rule_based_enabled, qualification_threshold)
VALUES (false, 50);

-- Insert default starter rules
INSERT INTO public.scoring_rules (name, description, condition_type, condition_value, points, category, sort_order, enabled)
VALUES 
  ('VP or C-Level Title', 'Add points for executive-level contacts', 'job_title_contains', 'VP,C-level,CEO,CFO,CTO,COO,CMO,CRO,Chief', 10, 'demographic', 1, true),
  ('Pricing Page Visits', 'High intent signal from pricing page engagement', 'visited_pricing_page', 'multiple', 15, 'behavioral', 2, true),
  ('Blog-Only Engagement', 'Deduct points for leads who only read blog content', 'blog_only_engagement', 'true', -5, 'behavioral', 3, true),
  ('Personal Email Domain', 'Deduct points for non-business email addresses', 'email_domain_personal', 'gmail.com,yahoo.com,hotmail.com,outlook.com,aol.com,icloud.com', -10, 'firmographic', 4, true);