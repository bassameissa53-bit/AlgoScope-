-- Add verification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS liveness_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS liveness_locked_until TIMESTAMPTZ;

-- Liveness sessions log
CREATE TABLE IF NOT EXISTS public.liveness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','passed','failed','timeout')),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  failure_reason TEXT,
  device_id TEXT,
  ip_address INET,
  frame_hash TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.liveness_sessions TO authenticated;
GRANT ALL ON public.liveness_sessions TO service_role;

ALTER TABLE public.liveness_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own liveness sessions"
  ON public.liveness_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own liveness sessions"
  ON public.liveness_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all liveness sessions"
  ON public.liveness_sessions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_liveness_user ON public.liveness_sessions(user_id, status);