'use client';

import Link from 'next/link';
import type { Post } from '@/lib/types/database';
import { Calendar, User } from 'lucide-react';

interface PostCardProps {
  post: Post & { profiles: { username: string; avatar_url: string | null } | null };
}

export function PostCard({ post }: PostCardProps) {
  const author = post.profiles;
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/post/${post.id}`}
      className="group block glass rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-foreground/30 text-4xl font-bold">
            Vlog
          </div>
        )}
      </div>
      <div className="p-4">
        <h2 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        <div className="flex items-center gap-3 mt-2 text-sm text-foreground/60">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {author?.username ?? 'Аноним'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {date}
          </span>
        </div>
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-lg text-xs bg-primary/10 text-primary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
