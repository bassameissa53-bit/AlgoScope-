CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_id TEXT NOT NULL,
    device_model TEXT,
    is_trusted BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own devices" ON public.user_devices;
CREATE POLICY "Users can manage their own devices"
  ON public.user_devices
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all devices" ON public.user_devices;
CREATE POLICY "Admins can manage all devices"
  ON public.user_devices
  FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON public.user_devices(device_id);