import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { User } from 'lucide-react';
import type { Post } from '@/lib/types/database';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError || !profile) notFound();

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.username?.slice(0, 1).toUpperCase() ?? '?'
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {profile.username}
          </h1>
          <p className="text-foreground/70 mt-1">Vlog profile</p>
        </div>
      </div>
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Posts</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {(posts as (Post & { profiles: { username: string; avatar_url: string | null } | null })[]).map(
            (post) => (
              <PostCard key={post.id} post={post} />
            )
          )}
        </div>
        {(!posts || posts.length === 0) && (
          <p className="text-foreground/60">No posts yet.</p>
        )}
      </section>
    </div>
  );
}
