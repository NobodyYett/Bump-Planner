-- Bloom: Infancy Mode schema updates (share-safe; no secrets)

BEGIN;

-- pregnancy_profiles: add infancy fields
ALTER TABLE IF EXISTS public.pregnancy_profiles
  ADD COLUMN IF NOT EXISTS baby_birth_date date NULL,
  ADD COLUMN IF NOT EXISTS app_mode text NOT NULL DEFAULT 'pregnancy',
  ADD COLUMN IF NOT EXISTS infancy_onboarding_complete boolean NOT NULL DEFAULT false;

-- feeding_logs: track feedings (mom + partner can access via RLS)
CREATE TABLE IF NOT EXISTS public.feeding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fed_at timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('breast', 'bottle', 'formula')),
  side text NULL CHECK (side IN ('left', 'right', 'both')),
  duration_minutes integer NULL,
  amount_oz numeric NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- index for "latest feedings for a user"
CREATE INDEX IF NOT EXISTS feeding_logs_user_fed_at_idx
  ON public.feeding_logs (user_id, fed_at DESC);

-- RLS
ALTER TABLE public.feeding_logs ENABLE ROW LEVEL SECURITY;

-- Partner access check via existing partner_access table
DROP POLICY IF EXISTS feeding_logs_select ON public.feeding_logs;
CREATE POLICY feeding_logs_select
  ON public.feeding_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.partner_access pa
      WHERE pa.user_id = feeding_logs.user_id
        AND pa.partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS feeding_logs_insert ON public.feeding_logs;
CREATE POLICY feeding_logs_insert
  ON public.feeding_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.partner_access pa
      WHERE pa.user_id = feeding_logs.user_id
        AND pa.partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS feeding_logs_update ON public.feeding_logs;
CREATE POLICY feeding_logs_update
  ON public.feeding_logs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.partner_access pa
      WHERE pa.user_id = feeding_logs.user_id
        AND pa.partner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.partner_access pa
      WHERE pa.user_id = feeding_logs.user_id
        AND pa.partner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS feeding_logs_delete ON public.feeding_logs;
CREATE POLICY feeding_logs_delete
  ON public.feeding_logs
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.partner_access pa
      WHERE pa.user_id = feeding_logs.user_id
        AND pa.partner_id = auth.uid()
    )
  );

COMMIT;
