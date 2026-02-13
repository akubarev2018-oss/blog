'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import {
  Calendar,
  Heart,
  MessageCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { Post, Comment, Profile } from '@/lib/types/database';

interface PostWithProfile extends Post {
  profiles: Profile | null;
}

interface PostDetailProps {
  postId: string;
  initialPost: PostWithProfile;
}

export function PostDetail({ postId, initialPost }: PostDetailProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(id, username, avatar_url)')
        .eq('id', postId)
        .single();
      if (error) throw error;
      return data as PostWithProfile;
    },
    initialData: initialPost,
  });

  const { data: userLikedPost } = useQuery({
    queryKey: ['like', 'post', postId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      return !!data;
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to like');
      if (userLikedPost) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['like', 'post', postId] });
    },
  });

  const author = post?.profiles;
  const dateStr = post?.created_at
    ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <article className="max-w-3xl mx-auto">
      {post?.cover_image && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6 glass">
          <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post?.title}</h1>
      <div className="flex items-center gap-4 text-foreground/70 mb-6">
        <Link
          href={`/profile/${author?.id}`}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white overflow-hidden">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              author?.username?.slice(0, 1).toUpperCase() ?? '?'
            )}
          </div>
          <span className="font-medium">{author?.username ?? 'Аноним'}</span>
        </Link>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {dateStr}
        </span>
      </div>
      {Array.isArray(post?.tags) && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-xl text-sm bg-primary/10 text-primary"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
        <ReactMarkdown>{post?.content ?? ''}</ReactMarkdown>
      </div>

      {post?.images_urls?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {post.images_urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl overflow-hidden glass aspect-square"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-6 mb-8">
        <button
          type="button"
          onClick={() => likePostMutation.mutate()}
          disabled={likePostMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            userLikedPost
              ? 'bg-primary/20 text-primary'
              : 'glass hover:bg-primary/10'
          }`}
        >
          {likePostMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Heart className={`w-5 h-5 ${userLikedPost ? 'fill-current' : ''}`} />
          )}
          <span>Нравится</span>
        </button>
      </div>

      <CommentsSection postId={postId} />
    </article>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const supabase = createClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:user_id(id, username, avatar_url)')
        .eq('post_id', postId)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as (Comment & { profiles: Profile | null })[];
    },
  });

  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Комментарии
      </h2>
      <CommentForm postId={postId} />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <ul className="space-y-4 mt-6">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const [text, setText] = useState('');
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !text.trim()) return;
    setLoading(true);
    try {
      await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        text: text.trim(),
      });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Написать комментарий..."
        className="flex-1 px-4 py-2.5 rounded-xl glass border-0 focus:ring-2 focus:ring-primary/50"
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
      >
        Отправить
      </button>
    </form>
  );
}

function CommentItem({ comment }: { comment: Comment & { profiles: Profile | null } }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: userLiked } = useQuery({
    queryKey: ['like', 'comment', comment.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', comment.id)
        .maybeSingle();
      return !!data;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (delta: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to vote');
      if (delta === 1) {
        await supabase.from('likes').insert({ user_id: user.id, comment_id: comment.id });
      } else {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('comment_id', comment.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', comment.post_id] });
      queryClient.invalidateQueries({ queryKey: ['like', 'comment', comment.id] });
    },
  });

  const date = new Date(comment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <li className="glass rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary text-sm font-medium shrink-0">
            {comment.profiles?.username?.slice(0, 1).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{comment.profiles?.username ?? 'Аноним'}</p>
            <p className="text-sm text-foreground/80 mt-0.5">{comment.text}</p>
            <p className="text-xs text-foreground/50 mt-1">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => voteMutation.mutate(1)}
            disabled={userLiked || voteMutation.isPending}
            className="p-1 rounded hover:bg-primary/10 text-foreground/70 disabled:text-primary"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <span className="min-w-[1.5rem] text-center text-sm font-medium">{comment.likes_count}</span>
          <button
            type="button"
            onClick={() => voteMutation.mutate(-1)}
            disabled={voteMutation.isPending}
            className="p-1 rounded hover:bg-primary/10 text-foreground/70"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

