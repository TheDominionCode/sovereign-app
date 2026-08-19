-- Public storage bucket for user-uploaded images (avatars, My Why, vision board).
-- Public = images are served via URL without auth. Writes/deletes are user-scoped.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload files under their own user_id folder
CREATE POLICY "users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can replace/update their own files
CREATE POLICY "users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public bucket: anyone can read (required for the img src URLs to work)
CREATE POLICY "public images are readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-images');
