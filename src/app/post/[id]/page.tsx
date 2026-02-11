import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostDetail } from '@/components/PostDetail';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles:user_id(id, username, avatar_url)')
    .eq('id', id)
    .single();

  if (error || !post) notFound();

  return <PostDetail postId={id} initialPost={post} />;
}
