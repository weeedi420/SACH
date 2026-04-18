
-- Add AI summary and key points columns to stories
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS key_points jsonb;

-- Add unique constraint on coverages.url to prevent duplicates (only for non-null URLs)
CREATE UNIQUE INDEX IF NOT EXISTS coverages_url_unique ON public.coverages (url) WHERE url IS NOT NULL;
