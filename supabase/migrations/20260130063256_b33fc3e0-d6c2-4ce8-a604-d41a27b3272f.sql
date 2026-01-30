-- Engagement-Based Lead Scoring Tables

-- Engagement settings (global configuration)
CREATE TABLE public.engagement_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engagement_enabled BOOLEAN NOT NULL DEFAULT false,
  decay_period_days INTEGER NOT NULL DEFAULT 30, -- Points halve every X days
  cold_threshold INTEGER NOT NULL DEFAULT 20,
  warm_threshold INTEGER NOT NULL DEFAULT 50,
  hot_threshold INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Engagement types with configurable point values
CREATE TABLE public.engagement_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- email, content, web, social, event
  default_points INTEGER NOT NULL,
  current_points INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Activity',
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Engagement events/logs per lead
CREATE TABLE public.engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  engagement_type_id UUID NOT NULL REFERENCES public.engagement_types(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.engagement_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for engagement_settings
CREATE POLICY "Allow read engagement_settings" ON public.engagement_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert engagement_settings" ON public.engagement_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update engagement_settings" ON public.engagement_settings FOR UPDATE USING (true);

-- RLS Policies for engagement_types
CREATE POLICY "Allow read engagement_types" ON public.engagement_types FOR SELECT USING (true);
CREATE POLICY "Allow insert engagement_types" ON public.engagement_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update engagement_types" ON public.engagement_types FOR UPDATE USING (true);
CREATE POLICY "Allow delete engagement_types" ON public.engagement_types FOR DELETE USING (true);

-- RLS Policies for engagement_events
CREATE POLICY "Allow read engagement_events" ON public.engagement_events FOR SELECT USING (true);
CREATE POLICY "Allow insert engagement_events" ON public.engagement_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete engagement_events" ON public.engagement_events FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_engagement_events_lead_id ON public.engagement_events(lead_id);
CREATE INDEX idx_engagement_events_occurred_at ON public.engagement_events(occurred_at DESC);
CREATE INDEX idx_engagement_events_type ON public.engagement_events(engagement_type_id);

-- Insert default engagement settings
INSERT INTO public.engagement_settings (engagement_enabled, decay_period_days, cold_threshold, warm_threshold, hot_threshold)
VALUES (false, 30, 20, 50, 80);

-- Insert default engagement types with sensible point values
INSERT INTO public.engagement_types (name, category, default_points, current_points, icon, description, sort_order) VALUES
  ('Email Open', 'email', 1, 1, 'MailOpen', 'Opened a marketing or sales email', 1),
  ('Email Click', 'email', 3, 3, 'MousePointerClick', 'Clicked a link in an email', 2),
  ('Email Reply', 'email', 10, 10, 'Reply', 'Replied to an email', 3),
  ('Content Download', 'content', 5, 5, 'Download', 'Downloaded whitepaper, ebook, or gated asset', 4),
  ('Blog Read', 'content', 2, 2, 'BookOpen', 'Read a blog article', 5),
  ('Case Study View', 'web', 6, 6, 'FileText', 'Viewed a case study page', 6),
  ('Pricing Page Visit', 'web', 8, 8, 'DollarSign', 'Visited the pricing page', 7),
  ('Product Page Visit', 'web', 4, 4, 'Package', 'Visited a product page', 8),
  ('Demo Page Visit', 'web', 7, 7, 'Play', 'Visited demo request page', 9),
  ('Time on Page (5+ min)', 'web', 5, 5, 'Clock', 'Spent 5+ minutes on a key page', 10),
  ('Webinar Registration', 'event', 8, 8, 'Calendar', 'Registered for a webinar', 11),
  ('Webinar Attended', 'event', 10, 10, 'Video', 'Attended a live webinar', 12),
  ('Event Attendance', 'event', 15, 15, 'Users', 'Attended an in-person event', 13),
  ('LinkedIn Ad Click', 'social', 4, 4, 'Linkedin', 'Clicked a LinkedIn ad', 14),
  ('Social Engagement', 'social', 2, 2, 'Share2', 'Engaged with social media content', 15),
  ('Form Submission', 'web', 6, 6, 'FormInput', 'Submitted a form on the website', 16);

-- Insert sample engagement events for demo
INSERT INTO public.engagement_events (lead_id, engagement_type_id, points_earned, occurred_at, metadata) 
SELECT 
  'demo-lead-001',
  id,
  current_points,
  now() - (random() * interval '60 days'),
  '{"source": "demo"}'::jsonb
FROM public.engagement_types 
WHERE name IN ('Email Open', 'Pricing Page Visit', 'Content Download')
LIMIT 3;

INSERT INTO public.engagement_events (lead_id, engagement_type_id, points_earned, occurred_at, metadata)
SELECT 
  'demo-lead-002',
  id,
  current_points,
  now() - (random() * interval '14 days'),
  '{"source": "demo"}'::jsonb
FROM public.engagement_types 
WHERE name IN ('Webinar Attended', 'Email Click', 'Demo Page Visit', 'Form Submission')
LIMIT 4;