
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_urdu TEXT,
  topic TEXT NOT NULL DEFAULT 'Politics',
  region TEXT NOT NULL DEFAULT 'National',
  is_trending BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT,
  bias_distribution JSONB NOT NULL DEFAULT '{"establishment":0,"government":0,"opposition":0,"independent":0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coverages table
CREATE TABLE public.coverages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scrape log table
CREATE TABLE public.scrape_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sources_scraped INTEGER DEFAULT 0,
  stories_found INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS (public read, no user writes needed - only edge function writes via service role)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_log ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Anyone can read stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Anyone can read coverages" ON public.coverages FOR SELECT USING (true);
CREATE POLICY "Anyone can read scrape_log" ON public.scrape_log FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX idx_stories_published_at ON public.stories(published_at DESC);
CREATE INDEX idx_stories_topic ON public.stories(topic);
CREATE INDEX idx_stories_region ON public.stories(region);
CREATE INDEX idx_stories_trending ON public.stories(is_trending) WHERE is_trending = true;
CREATE INDEX idx_coverages_story_id ON public.coverages(story_id);
CREATE INDEX idx_coverages_source_id ON public.coverages(source_id);
