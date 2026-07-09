// ============================================================
//  AlgoScope — Device Guard Edge Function
//  Registers / validates device fingerprint per user
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_DEVICES = 2;

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authErr } = await db.auth.getUser(jwt);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { deviceId, deviceModel } = body as { deviceId?: string; deviceModel?: string };
    if (!deviceId) return json({ error: "missing_device_id" }, 400);

    // Check ban status
    const { data: profile } = await db
      .from("profiles")
      .select("is_banned")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile?.is_banned) return json({ error: "banned" }, 403);

    // Find existing device
    const { data: existing } = await db
      .from("user_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      await db.from("user_devices").update({ last_seen: now }).eq("id", existing.id);
      return json({ success: true, trusted: existing.is_trusted, primary: existing.is_primary });
    }

    // Count existing devices
    const { count } = await db
      .from("user_devices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= MAX_DEVICES) {
      return json({ error: "device_limit_exceeded", limit: MAX_DEVICES }, 403);
    }

    const isPrimary = (count ?? 0) === 0;
    const { error: insErr } = await db.from("user_devices").insert({
      user_id: user.id,
      device_id: deviceId,
      device_model: deviceModel ?? null,
      is_primary: isPrimary,
      is_trusted: isPrimary,
      first_seen: now,
      last_seen: now,
    });
    if (insErr) return json({ error: "insert_failed", details: insErr.message }, 500);

    return json({ success: true, registered: true, primary: isPrimary });
  } catch (err) {
    console.error("device-guard error", err);
    return json({ error: "internal_error" }, 500);
  }
});
