'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';

const BUCKET = 'post-images';

export function CreatePostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [bodyFiles, setBodyFiles] = useState<File[]>([]);
  const [bodyPreviews, setBodyPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const tags = tagsInput
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim().toLowerCase())
    .filter(Boolean);

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const onBodyImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setBodyFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setBodyPreviews((prev) => [...prev, url]);
    });
  };

  const removeBodyImage = (index: number) => {
    setBodyFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(bodyPreviews[index]);
    setBodyPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let coverUrl: string | null = null;
      if (coverFile) {
        coverUrl = await uploadFile(
          coverFile,
          `${user.id}/${Date.now()}-cover-${coverFile.name}`
        );
      }

      const imageUrls: string[] = [];
      for (let i = 0; i < bodyFiles.length; i++) {
        const url = await uploadFile(
          bodyFiles[i],
          `${user.id}/${Date.now()}-${i}-${bodyFiles[i].name}`
        );
        imageUrls.push(url);
      }

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        cover_image: coverUrl,
        images_urls: imageUrls,
        tags,
      });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts-tags'] });
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 glass p-6 rounded-2xl">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Your post title"
          className="w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Tags (space or comma separated)</label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="travel tech life"
          className="w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Cover image</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/50 cursor-pointer hover:bg-primary/5 transition-colors">
            <Upload className="w-5 h-5 text-primary" />
            <span>Choose cover</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onCoverChange}
            />
          </label>
          {coverPreview && (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-primary/10">
              <img src={coverPreview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview(null);
                  URL.revokeObjectURL(coverPreview);
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Content (Markdown)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          placeholder="Write your story in **Markdown**..."
          className="w-full px-4 py-2.5 rounded-xl border border-primary/30 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 font-mono text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Body images (optional)</label>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-secondary/50 cursor-pointer hover:bg-secondary/5 transition-colors inline-flex">
          <ImagePlus className="w-5 h-5 text-secondary" />
          <span>Add images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onBodyImagesChange}
          />
        </label>
        {bodyPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {bodyPreviews.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary/10">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeBodyImage(i)}
                  className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/50 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {loading ? 'Publishing...' : 'Publish'}
      </button>
    </form>
  );
}
