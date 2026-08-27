-- ==============================================================================
-- WALLET AGENT PLATFORM: SUPABASE STORAGE BUCKETS & POLICIES MIGRATION
-- ==============================================================================

-- 1. CREATE STORAGE BUCKETS IF THEY DON'T EXIST
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kyc_documents', 'kyc_documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('deposit_receipts', 'deposit_receipts', true, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. STORAGE RLS POLICIES FOR kyc_documents (Private)
CREATE POLICY "Agents can upload own KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc_documents');

CREATE POLICY "Agents can view own KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc_documents');

-- 3. STORAGE RLS POLICIES FOR deposit_receipts (Public)
CREATE POLICY "Public read for deposit receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'deposit_receipts');

CREATE POLICY "Authenticated users upload deposit receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deposit_receipts');

-- 4. STORAGE RLS POLICIES FOR avatars (Public)
CREATE POLICY "Public read for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
