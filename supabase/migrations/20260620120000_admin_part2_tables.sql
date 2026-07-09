-- ============================================================
-- Admin Panel Part 2: Subscriptions, Security Alerts,
-- Banned Entities (device/IP level), and Audit Log tables.
--
-- The enums used below (sub_plan, sub_status, alert_type,
-- alert_severity, ban_entity_type) were already created in
-- migration 20260614002736 but never used by any table until now.
-- ============================================================

-- ── subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.sub_plan NOT NULL DEFAULT 'free',
  status public.sub_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  renewed_at TIMESTAMPTZ,
  managed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Reuses public.update_updated_at_column(), already defined in
-- migration 20260203121056.
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill: give every existing profile a subscriptions row that matches
-- their current subscription_tier, so no one is left without a record.
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT
  p.user_id,
  CASE WHEN p.subscription_tier = 'premium'
       THEN 'premium_monthly'::public.sub_plan
       ELSE 'free'::public.sub_plan
  END,
  'active'::public.sub_status
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.user_id
);


-- ── security_alerts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own alerts" ON public.security_alerts;
CREATE POLICY "Users can insert their own alerts"
  ON public.security_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.security_alerts;
CREATE POLICY "Admins can manage all alerts"
  ON public.security_alerts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_open ON public.security_alerts(is_resolved, severity);


-- ── banned_entities (device / IP level bans) ───────────────
CREATE TABLE IF NOT EXISTS public.banned_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.ban_entity_type NOT NULL,
  entity_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  ban_message TEXT,
  is_permanent BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  banned_by UUID REFERENCES auth.users(id),
  revoked_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_value)
);

GRANT SELECT ON public.banned_entities TO authenticated;
GRANT ALL ON public.banned_entities TO service_role;

ALTER TABLE public.banned_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage banned entities" ON public.banned_entities;
CREATE POLICY "Admins can manage banned entities"
  ON public.banned_entities FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_banned_entity ON public.banned_entities(entity_type, entity_value, is_active);

-- Reusable lookup for device/IP bans (mirrors has_role()/is_admin() style
-- already used in this project). Edge functions can call this with the
-- service role to block a banned device or IP before it ever reaches
-- business logic.
CREATE OR REPLACE FUNCTION public.is_entity_banned(_device_id TEXT, _ip TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_entities
    WHERE is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        (entity_type = 'device_id' AND entity_value = _device_id) OR
        (_ip IS NOT NULL AND entity_type = 'ip_address' AND entity_value = _ip)
      )
  );
$$;


-- ── activity_logs (audit trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info','warning','critical')),
  ip_address TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own logs" ON public.activity_logs;
CREATE POLICY "Users can insert their own logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id);

DROP POLICY IF EXISTS "Admins full access to logs" ON public.activity_logs;
CREATE POLICY "Admins full access to logs"
  ON public.activity_logs FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_actor ON public.activity_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.activity_logs(level);
