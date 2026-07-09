// ============================================================
//  AlgoScope — Ban Manager Edge Function (admin-only)
//  Actions: ban | unban | list
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

    // Admin check via has_role
    const { data: isAdmin } = await db.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId, reason } = body as {
      action?: "ban" | "unban" | "list";
      targetUserId?: string;
      reason?: string;
    };

    if (action === "list") {
      const { data, error } = await db
        .from("profiles")
        .select("user_id, full_name, is_banned, banned_at, banned_reason")
        .eq("is_banned", true)
        .order("banned_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, banned: data });
    }

    if (!targetUserId) return json({ error: "missing_target_user_id" }, 400);

    if (action === "ban") {
      const { error } = await db
        .from("profiles")
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);
      if (error) return json({ error: error.message }, 500);

      await db.from("activity_logs").insert({
        actor_user_id: user.id,
        target_user_id: targetUserId,
        action: "user_banned",
        detail: reason ?? "No reason provided",
        level: "warning",
      });

      return json({ success: true, banned: true });
    }

    if (action === "unban") {
      const { error } = await db
        .from("profiles")
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);
      if (error) return json({ error: error.message }, 500);

      await db.from("activity_logs").insert({
        actor_user_id: user.id,
        target_user_id: targetUserId,
        action: "user_unbanned",
        detail: null,
        level: "info",
      });

      return json({ success: true, banned: false });
    }

    return json({ error: "invalid_action" }, 400);
  } catch (err) {
    console.error("ban-manager error", err);
    return json({ error: "internal_error" }, 500);
  }
});
