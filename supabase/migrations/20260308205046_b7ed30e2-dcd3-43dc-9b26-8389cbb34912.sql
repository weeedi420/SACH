
-- Clean junk summaries from video page coverages
UPDATE public.coverages 
SET summary = headline
WHERE summary ILIKE '%Facebook%Twitter%whatsapp%'
   OR summary ILIKE '%Play%Mute%Current Time%'
   OR summary ILIKE '%Captions Settings%'
   OR summary ILIKE '%Play Video%Mute%'
   OR summary ILIKE '%stream type%remaining time%';

-- Clear full_content for video-page coverages (shows/videos URLs)
UPDATE public.coverages 
SET full_content = NULL
WHERE url ILIKE '%/shows/%'
   OR url ILIKE '%/videos/%'
   OR url ILIKE '%/watch/%'
   OR url ILIKE '%/live/%'
   OR url ILIKE '%/programs/%';

-- Also clean summaries for those video URLs
UPDATE public.coverages 
SET summary = headline
WHERE (url ILIKE '%/shows/%'
   OR url ILIKE '%/videos/%'
   OR url ILIKE '%/watch/%')
  AND (summary ILIKE '%Facebook%' OR summary ILIKE '%Play%' OR length(summary) < 50);
