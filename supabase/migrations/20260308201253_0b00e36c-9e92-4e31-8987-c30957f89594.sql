
-- Add is_international to coverages
ALTER TABLE public.coverages ADD COLUMN is_international boolean NOT NULL DEFAULT false;

-- Add importance_score and is_breaking to stories
ALTER TABLE public.stories ADD COLUMN importance_score integer NOT NULL DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN is_breaking boolean NOT NULL DEFAULT false;

-- Create claims table
CREATE TABLE public.claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  text text NOT NULL,
  category text NOT NULL DEFAULT 'factual',
  confidence integer NOT NULL DEFAULT 50,
  explanation text NOT NULL DEFAULT '',
  supporting_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  contradicting_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Public read policy for claims
CREATE POLICY "Anyone can read claims" ON public.claims FOR SELECT USING (true);
