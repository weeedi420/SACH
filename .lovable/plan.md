
What I found from the read-only audit

1. The live app the user is seeing is not the same bundle as the current source.
- The current `src/pages/Index.tsx` does not contain the old “Trending in Pakistan / All Stories / Blindspots” layout the user pasted.
- The network snapshot still shows an old stories request shape (`order=published_at.desc&limit=50`) instead of the newer `fetchStories()` logic in `src/lib/api.ts`.
- That means a stale frontend bundle/cache is still being served.

2. The feed freshness logic is broken in the scraper.
- In `supabase/functions/scrape-news/index.ts`, when a new article matches an existing story, it inserts a new coverage but does not update `stories.published_at`.
- So the story row stays 7–9 days old even if fresh coverage is added.
- Since the frontend orders/filters from `stories`, users keep seeing the same old feed.

3. The scraper is throwing away most fetched articles.
- It does:
  `const topArticles = allArticles.slice(0, 12);`
  then
  `allArticles = await aiBatchVerify(topArticles);`
- So after fetching ~150 articles, it keeps only the first 12 for the rest of the pipeline.
- That starves the feed and makes refreshes look broken.

4. Static fallback content is masking failures.
- `Index.tsx` and `Trending.tsx` still fall back to `src/data/stories.ts` when DB data is empty.
- That makes the app appear “working” even when live data is stale or missing.

5. Junk cleanup is incomplete.
- Network snapshots still show CDATA and AP navigation boilerplate in live summaries/content.
- So the current cleaner/gating rules are not strict enough before insert/update.

Implementation plan

1. Fix the freshness model first
- Update the scraper so every matched coverage insert also updates the parent story freshness.
- Best fix: add an `effective_published_at` field (or reuse `published_at` consistently) and always set it to the latest real article/coverage timestamp.
- Backfill existing stories so old rows with fresh coverages become current again.
- Update `self-heal` to recompute freshness after merges.

2. Fix the scraper pipeline so it processes all good articles
- Stop replacing the full article list with only the first 12 verified items.
- New flow:
  - fetch all
  - deterministic junk filter on all
  - AI verify priority/borderline items in batches
  - keep the rest if they pass strict non-AI rules
- Keep AI throttling, but do not let rate limits collapse the whole run.

3. Harden content quality gates
- Reject coverage containing CDATA wrappers, AP/Reuters nav blocks, “Enable accessibility”, “Login or register”, “TOP STORIES”, newsletter menus, video UI text, and similar boilerplate.
- Sanitize both story titles and coverage summaries before insert.
- If cleaned content is still junk, skip that coverage entirely.

4. Remove misleading fallbacks and show real live states
- Remove `fallbackStories` from feed/trending pages.
- Replace with:
  - loading state
  - empty state
  - error state
  - “last updated” / “refresh in progress” status
- This prevents old sample content from hiding pipeline failures.

5. Make refresh reliable instead of waiting on a long function
- Refactor `scrape-news` to return quickly and continue work in the background.
- Store run status in a small backend table (queued/running/success/failed, last_success_at, error).
- Change the Refresh button to:
  - start a run
  - poll run status
  - refetch stories when complete
- Keep the automatic 3-hour schedule, but make the UI observable.

6. Force the actual new frontend to load everywhere
- Bump cache version again.
- Make sure the refresh/status UI is in the live home page bundle.
- Verify preview + published + mobile are all serving the new request shape and not the old homepage.

Files/backend areas to change
- `supabase/functions/scrape-news/index.ts`
- `supabase/functions/self-heal/index.ts`
- `src/lib/api.ts`
- `src/pages/Index.tsx`
- `src/pages/Trending.tsx`
- `src/main.tsx`
- new migration for freshness/status fields
- backend scheduled job setup/backfill

Technical details
```text
Current broken path:
fetch 150+ -> keep first 12 only -> maybe match old stories -> insert coverage only -> story row stays old -> homepage keeps showing same old feed

Fixed path:
fetch all -> junk filter all -> AI verify in throttled batches -> insert/update coverages -> update story freshness -> UI polls job status -> feed reorders with fresh data
```

Verification I will do after approval
- Confirm homepage network request now matches current source, not the old bundle.
- Confirm latest story rows have current freshness timestamps.
- Confirm manual refresh shows queued/running/completed and actually changes feed order.
- Confirm scheduled runs are updating `last_success_at`.
- Confirm no CDATA / AP navigation junk appears in story cards on mobile and desktop.
