import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreatePostForm } from '@/components/CreatePostForm';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Create a post</h1>
      <CreatePostForm />
    </div>
  );
}
