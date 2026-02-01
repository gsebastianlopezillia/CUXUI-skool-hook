-- Run this in Supabase Dashboard → SQL Editor (once per project).
-- Safe to run multiple times (idempotent).
-- Before first run: create bucket "media" in Dashboard → Storage → New bucket, set it Public.
-- If your bucket has another name, replace 'media' below and in supabase-config.js (SUPABASE_BUCKET).
--
-- Comportamiento: archivos visibles por cualquiera (quien tenga el link); solo usuarios logueados pueden subir.
-- Usuarios solo desde Supabase: en Auth → Providers → Email desactivar "Enable email signups".

-- Table: file metadata (replaces Firestore collection "files")
CREATE TABLE IF NOT EXISTS public.files (
  id text PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  size bigint NOT NULL,
  type text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  deleted_at timestamptz
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Add deleted_at if table already existed (idempotent)
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- RLS: users see and manage only their own non-deleted rows
DROP POLICY IF EXISTS "Users can read own files" ON public.files;
CREATE POLICY "Users can read own files"
  ON public.files FOR SELECT
  USING (auth.uid() = owner_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own files" ON public.files;
CREATE POLICY "Users can insert own files"
  ON public.files FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: WITH CHECK (true) porque en PATCH parcial PostgREST envía solo columnas modificadas
-- y RLS evalúa el "nuevo" row sin owner_id, fallando auth.uid() = owner_id. USING ya limita a filas propias.
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
CREATE POLICY "Users can update own files"
  ON public.files FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own files" ON public.files;
CREATE POLICY "Users can delete own files"
  ON public.files FOR DELETE
  USING (auth.uid() = owner_id);

-- RPC: soft-delete sin depender de RLS en PATCH (evita 403 en UPDATE parcial)
CREATE OR REPLACE FUNCTION public.soft_delete_file(file_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.files
  SET deleted_at = now()
  WHERE id = file_id AND owner_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.soft_delete_file(text) TO authenticated;

-- Storage: solo autenticados pueden subir; cualquiera puede leer (URLs públicas).
-- Políticas por bucket: si usás otro nombre, agregá un bloque igual con tu bucket_id.

DROP POLICY IF EXISTS "Authenticated can upload to media" ON storage.objects;
CREATE POLICY "Authenticated can upload to media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
DROP POLICY IF EXISTS "Authenticated can delete own in media" ON storage.objects;
CREATE POLICY "Authenticated can delete own in media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated can upload to CUXUI-Skool-Router" ON storage.objects;
CREATE POLICY "Authenticated can upload to CUXUI-Skool-Router"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'CUXUI-Skool-Router');
DROP POLICY IF EXISTS "Public read CUXUI-Skool-Router" ON storage.objects;
CREATE POLICY "Public read CUXUI-Skool-Router"
  ON storage.objects FOR SELECT TO public USING (bucket_id = 'CUXUI-Skool-Router');
DROP POLICY IF EXISTS "Authenticated can delete own in CUXUI-Skool-Router" ON storage.objects;
CREATE POLICY "Authenticated can delete own in CUXUI-Skool-Router"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'CUXUI-Skool-Router' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text);
