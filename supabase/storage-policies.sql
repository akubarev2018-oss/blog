-- =============================================
-- Vlog Platform - Storage Bucket & Policies
-- Run this in Supabase SQL Editor after schema.sql
-- =============================================

-- Create storage bucket for post images (if not exists via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload to post-images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

-- Policy: Users can update/delete their own uploads (optional: use auth.uid() in path or metadata)
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
