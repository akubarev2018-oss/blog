'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Post } from '@/lib/types/database';
import { PostCard } from './PostCard';
import { Search, Loader2 } from 'lucide-react';

const PAGE_SIZE = 9;

function useAllTags() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['posts-tags'],
    queryFn: async () => {
      const { data } = await supabase.from('posts').select('tags');
      const set = new Set<string>();
      data?.forEach((row) => (row.tags as string[] || []).forEach((t) => set.add(t)));
      return Array.from(set).sort();
    },
  });
}

export function Feed() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const supabase = createClient();

  const { data: allTags = [] } = useAllTags();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['posts', search, selectedTag],
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('posts')
        .select('*, profiles:user_id(username, avatar_url)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      if (search.trim()) {
        q = q.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`);
      }
      if (selectedTag) {
        q = q.contains('tags', [selectedTag]);
      }
      const { data: rows, error } = await q;
      if (error) throw error;
      return { rows: rows as (Post & { profiles: { username: string; avatar_url: string | null } | null })[], next: (pageParam + PAGE_SIZE) };
    },
    getNextPageParam: (lastPage) => (lastPage.rows.length === PAGE_SIZE ? lastPage.next : undefined),
    initialPageParam: 0,
  });

  const posts = useMemo(
    () => data?.pages?.flatMap((p) => p.rows) ?? [],
    [data?.pages]
  );

  const loadMoreRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !hasNextPage || isFetchingNextPage) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) fetchNextPage();
        },
        { rootMargin: '100px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  if (status === 'pending') {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
          <input
            type="search"
            placeholder="Поиск по постам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border-0 focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedTag === null
                ? 'bg-primary text-white'
                : 'glass hover:bg-primary/10'
            }`}
          >
            Все
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedTag === tag
                  ? 'bg-secondary text-white'
                  : 'glass hover:bg-secondary/10'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-foreground/60 py-12">Пока нет постов. Будьте первым!</p>
      )}

      <div ref={loadMoreRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
