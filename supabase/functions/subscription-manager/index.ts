// ============================================================
//  AlgoScope — Subscription Manager Edge Function
//  Manual admin upgrades (no payment gateway).
//  Actions: get | upgrade (admin) | downgrade (admin)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_TIERS = ["free", "premium", "pro"];

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
    const { action, targetUserId, tier } = body as {
      action?: "get" | "upgrade" | "downgrade";
      targetUserId?: string;
      tier?: string;
    };

    if (action === "get") {
      const { data, error } = await db
        .from("profiles")
        .select("user_id, full_name, subscription_tier, is_verified, is_banned")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, profile: data });
    }

    // Admin-only actions
    const { data: isAdmin } = await db.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    if (!targetUserId) return json({ error: "missing_target_user_id" }, 400);

    let newTier = "free";
    let newPlan: string = "free";
    if (action === "upgrade") {
      newTier = tier && VALID_TIERS.includes(tier) ? tier : "premium";
      newPlan = newTier === "free" ? "free" : "premium_monthly";
    } else if (action === "downgrade") {
      newTier = "free";
      newPlan = "free";
    } else {
      return json({ error: "invalid_action" }, 400);
    }

    const { error } = await db
      .from("profiles")
      .update({ subscription_tier: newTier, updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);
    if (error) return json({ error: error.message }, 500);

    // Keep the richer `subscriptions` table in sync with the flat tier
    // flag on profiles, so the Admin Subscriptions tab and the simple
    // free/premium gate never disagree with each other.
    const now = new Date().toISOString();
    await db.from("subscriptions").upsert(
      {
        user_id: targetUserId,
        plan: newPlan,
        status: "active",
        managed_by: user.id,
        renewed_at: action === "upgrade" ? now : null,
        cancelled_at: action === "downgrade" ? now : null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    await db.from("activity_logs").insert({
      actor_user_id: user.id,
      target_user_id: targetUserId,
      action: action === "upgrade" ? "subscription_upgraded" : "subscription_downgraded",
      detail: `New plan: ${newPlan}`,
      level: "info",
    });

    return json({ success: true, tier: newTier });
  } catch (err) {
    console.error("subscription-manager error", err);
    return json({ error: "internal_error" }, 500);
  }
});
