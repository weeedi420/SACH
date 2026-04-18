import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setBookmarkedIds(new Set()); return; }
    setLoading(true);
    supabase
      .from("bookmarks")
      .select("story_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setBookmarkedIds(new Set((data || []).map((b: any) => b.story_id)));
        setLoading(false);
      });
  }, [user]);

  const toggleBookmark = useCallback(async (storyId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(storyId);
    if (isBookmarked) {
      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(storyId); return n; });
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("story_id", storyId);
    } else {
      setBookmarkedIds((prev) => new Set(prev).add(storyId));
      await supabase.from("bookmarks").insert({ user_id: user.id, story_id: storyId });
    }
  }, [user, bookmarkedIds]);

  const isBookmarked = useCallback((storyId: string) => bookmarkedIds.has(storyId), [bookmarkedIds]);

  return { toggleBookmark, isBookmarked, loading };
}
