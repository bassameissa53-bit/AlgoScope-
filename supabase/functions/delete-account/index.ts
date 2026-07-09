// ============================================================
//  AlgoScope — Delete Account Edge Function (self-service)
//  Required for App Store Guideline 5.1.1(v): apps that support
//  account creation must offer in-app account deletion.
//
//  Deletes the caller's own auth.users row via the admin API.
//  All dependent rows (profiles, user_devices, analyses,
//  liveness_sessions, subscriptions, daily_usage,
//  user_course_access) cascade-delete automatically via the
//  ON DELETE CASCADE foreign keys already in the schema.
//  activity_logs rows are kept but anonymized (ON DELETE SET
//  NULL on actor_user_id/target_user_id) so the audit trail
//  survives without retaining personal linkage.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const { confirm } = body as { confirm?: string };

    // Require the client to send an explicit confirmation string so a
    // stray automated retry or a misclicked button can never delete an
    // account by accident.
    if (confirm !== "DELETE") {
      return json({ error: "confirmation_required" }, 400);
    }

    // Log the deletion request before the user row (and its FK chain)
    // disappears.
    await db.from("activity_logs").insert({
      actor_user_id: user.id,
      target_user_id: user.id,
      action: "account_deleted",
      detail: user.email ?? null,
      level: "warning",
    });

    const { error: delErr } = await db.auth.admin.deleteUser(user.id);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
