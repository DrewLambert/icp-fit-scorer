-- Create historical_deals table to store closed deals for training
CREATE TABLE public.historical_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  job_title TEXT,
  source_channel TEXT,
  engagement_score INTEGER DEFAULT 0,
  funding_stage TEXT,
  region TEXT,
  deal_value DECIMAL(12,2),
  days_to_close INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
  closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictive_model_state to store trained model weights
CREATE TABLE public.predictive_model_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_weights JSONB NOT NULL DEFAULT '{}',
  total_records INTEGER NOT NULL DEFAULT 0,
  won_records INTEGER NOT NULL DEFAULT 0,
  lost_records INTEGER NOT NULL DEFAULT 0,
  accuracy_score DECIMAL(5,2),
  last_trained_at TIMESTAMP WITH TIME ZONE,
  training_status TEXT DEFAULT 'untrained' CHECK (training_status IN ('untrained', 'training', 'trained', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predictive_settings for configuration
CREATE TABLE public.predictive_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  predictive_enabled BOOLEAN NOT NULL DEFAULT false,
  min_deals_threshold INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historical_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_model_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_settings ENABLE ROW LEVEL SECURITY;

-- Create public policies (demo app without auth)
CREATE POLICY "Allow public read on historical_deals" ON public.historical_deals FOR SELECT USING (true);
CREATE POLICY "Allow public insert on historical_deals" ON public.historical_deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on historical_deals" ON public.historical_deals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on historical_deals" ON public.historical_deals FOR DELETE USING (true);

CREATE POLICY "Allow public read on predictive_model_state" ON public.predictive_model_state FOR SELECT USING (true);
CREATE POLICY "Allow public insert on predictive_model_state" ON public.predictive_model_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on predictive_model_state" ON public.predictive_model_state FOR UPDATE USING (true);

CREATE POLICY "Allow public read on predictive_settings" ON public.predictive_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on predictive_settings" ON public.predictive_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on predictive_settings" ON public.predictive_settings FOR UPDATE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_predictive_model_state_updated_at
BEFORE UPDATE ON public.predictive_model_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_settings_updated_at
BEFORE UPDATE ON public.predictive_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.predictive_settings (predictive_enabled, min_deals_threshold)
VALUES (false, 50);

-- Insert initial model state
INSERT INTO public.predictive_model_state (feature_weights, training_status)
VALUES ('{}', 'untrained');

-- Insert sample historical deals for demonstration (30 won, 20 lost)
INSERT INTO public.historical_deals (company_name, industry, company_size, job_title, source_channel, engagement_score, funding_stage, region, deal_value, days_to_close, outcome, closed_at)
VALUES 
  ('TechCorp', 'SaaS', '50-200', 'VP Sales', 'inbound', 85, 'Series B', 'North America', 45000, 30, 'won', now() - interval '60 days'),
  ('DataFlow Inc', 'Technology', '200-500', 'CTO', 'referral', 90, 'Series C', 'North America', 120000, 45, 'won', now() - interval '55 days'),
  ('CloudFirst', 'SaaS', '50-200', 'Director', 'paid ads', 75, 'Series A', 'Europe', 35000, 25, 'won', now() - interval '50 days'),
  ('ScaleUp Pro', 'B2B Services', '200-500', 'CEO', 'inbound', 95, 'Series B', 'North America', 80000, 35, 'won', now() - interval '48 days'),
  ('GrowthLabs', 'Technology', '50-200', 'VP Marketing', 'content', 80, 'Seed', 'Europe', 28000, 40, 'won', now() - interval '45 days'),
  ('Enterprise AI', 'Technology', '500+', 'CRO', 'outbound', 88, 'Series C', 'North America', 200000, 60, 'won', now() - interval '42 days'),
  ('StartupHub', 'SaaS', '10-50', 'Founder', 'referral', 70, 'Seed', 'North America', 15000, 20, 'won', now() - interval '40 days'),
  ('MidMarket Co', 'B2B Services', '200-500', 'VP Operations', 'inbound', 82, 'Series B', 'Europe', 55000, 38, 'won', now() - interval '38 days'),
  ('InnovateTech', 'SaaS', '50-200', 'CMO', 'paid ads', 78, 'Series A', 'North America', 42000, 28, 'won', now() - interval '35 days'),
  ('DataDriven', 'Technology', '200-500', 'Director', 'content', 85, 'Series B', 'North America', 65000, 32, 'won', now() - interval '32 days'),
  ('CloudNative', 'SaaS', '50-200', 'VP Engineering', 'inbound', 92, 'Series B', 'Europe', 48000, 22, 'won', now() - interval '30 days'),
  ('B2B Solutions', 'B2B Services', '200-500', 'CEO', 'referral', 88, 'Series C', 'North America', 95000, 42, 'won', now() - interval '28 days'),
  ('TechForward', 'Technology', '50-200', 'CTO', 'outbound', 75, 'Series A', 'Europe', 38000, 35, 'won', now() - interval '25 days'),
  ('SaaSify', 'SaaS', '10-50', 'VP Sales', 'inbound', 82, 'Seed', 'North America', 22000, 18, 'won', now() - interval '22 days'),
  ('GrowthEngine', 'Technology', '200-500', 'Director', 'paid ads', 79, 'Series B', 'North America', 72000, 45, 'won', now() - interval '20 days'),
  ('LocalBiz', 'Retail', '10-50', 'Owner', 'cold call', 35, 'Bootstrapped', 'North America', 5000, 90, 'lost', now() - interval '58 days'),
  ('OldSchool Inc', 'Manufacturing', '500+', 'Manager', 'trade show', 40, 'Bootstrapped', 'Europe', 8000, 120, 'lost', now() - interval '52 days'),
  ('TinyStartup', 'Consumer', '1-10', 'Founder', 'organic', 25, 'Pre-seed', 'Asia', 2000, 15, 'lost', now() - interval '47 days'),
  ('BudgetCo', 'Retail', '10-50', 'Manager', 'cold email', 30, 'Bootstrapped', 'South America', 3500, 60, 'lost', now() - interval '44 days'),
  ('LegacySystems', 'Manufacturing', '200-500', 'IT Director', 'trade show', 45, 'Bootstrapped', 'Europe', 12000, 150, 'lost', now() - interval '41 days'),
  ('SmallShop', 'Retail', '1-10', 'Owner', 'cold call', 20, 'Bootstrapped', 'North America', 1500, 30, 'lost', now() - interval '39 days'),
  ('NoFit Corp', 'Healthcare', '50-200', 'Manager', 'paid ads', 50, 'Series A', 'Asia', 18000, 80, 'lost', now() - interval '36 days'),
  ('WrongStage', 'Technology', '1-10', 'Founder', 'organic', 55, 'Pre-seed', 'Europe', 4000, 25, 'lost', now() - interval '33 days'),
  ('MismatchCo', 'Consumer', '10-50', 'Marketing Lead', 'content', 42, 'Seed', 'South America', 6000, 55, 'lost', now() - interval '31 days'),
  ('LowIntent', 'B2B Services', '50-200', 'Analyst', 'organic', 38, 'Series A', 'North America', 15000, 95, 'lost', now() - interval '27 days'),
  ('QuickWin', 'SaaS', '50-200', 'VP Product', 'referral', 87, 'Series A', 'North America', 52000, 24, 'won', now() - interval '18 days'),
  ('FastGrow', 'Technology', '200-500', 'CMO', 'inbound', 91, 'Series B', 'Europe', 78000, 28, 'won', now() - interval '15 days'),
  ('RocketScale', 'SaaS', '50-200', 'CEO', 'referral', 94, 'Series B', 'North America', 110000, 32, 'won', now() - interval '12 days'),
  ('TechLeader', 'Technology', '500+', 'CTO', 'inbound', 89, 'Series C', 'North America', 185000, 55, 'won', now() - interval '10 days'),
  ('CloudPro', 'SaaS', '200-500', 'VP Sales', 'paid ads', 83, 'Series B', 'Europe', 62000, 30, 'won', now() - interval '8 days'),
  ('BadTiming', 'Retail', '10-50', 'Manager', 'cold email', 28, 'Bootstrapped', 'Asia', 2500, 45, 'lost', now() - interval '24 days'),
  ('NoMatch', 'Healthcare', '200-500', 'Director', 'trade show', 48, 'Series A', 'Europe', 25000, 110, 'lost', now() - interval '21 days'),
  ('WrongBudget', 'Consumer', '1-10', 'Owner', 'organic', 32, 'Pre-seed', 'North America', 1000, 20, 'lost', now() - interval '17 days'),
  ('SlowMover', 'Manufacturing', '50-200', 'Manager', 'cold call', 44, 'Bootstrapped', 'South America', 9000, 140, 'lost', now() - interval '14 days'),
  ('NotReady', 'B2B Services', '10-50', 'Analyst', 'content', 36, 'Seed', 'Asia', 5500, 75, 'lost', now() - interval '11 days');