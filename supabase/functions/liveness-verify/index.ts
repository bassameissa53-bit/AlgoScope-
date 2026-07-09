// ============================================================
//  AlgoScope — Face Liveness Verification Edge Function
//  Supports: AWS Rekognition (production) | Score-based (MVP)
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

// ── Config ────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 30;
const MIN_CONFIDENCE = 0.75;

// ── AWS Rekognition (set in Supabase Secrets) ─────────
const AWS_REGION = Deno.env.get("AWS_REGION") ?? "eu-west-1";
const AWS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID") ?? "";
const AWS_SECRET = Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "";
const USE_AWS = AWS_KEY_ID !== "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authErr } = await db.auth.getUser(jwt);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // ── Body ──────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const {
      frameBase64,
      deviceId,
      frameHash,
      blinkTimestamps,
      smileDetected,
    } = body as {
      frameBase64?: string;
      deviceId?: string;
      frameHash?: string;
      blinkTimestamps?: number[];
      smileDetected?: boolean;
    };
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";

    // ── Load profile ──────────────────────────────────
    const { data: profile, error: profileErr } = await db
      .from("profiles")
      .select("is_verified, liveness_attempts, liveness_locked_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr) return json({ error: "profile_lookup_failed" }, 500);

    if (profile?.is_verified) {
      return json({ success: true, already_verified: true });
    }

    if (
      profile?.liveness_locked_until &&
      new Date(profile.liveness_locked_until) > new Date()
    ) {
      return json(
        { error: "locked", unlocks_at: profile.liveness_locked_until },
        429,
      );
    }

    const attempt = (profile?.liveness_attempts ?? 0) + 1;

    // ── Liveness check ────────────────────────────────
    let confidence = 0;
    let passed = false;
    let reason = "";

    if (USE_AWS) {
      try {
        const awsResult = await callRekognitionLiveness(
          frameBase64 ?? "",
          AWS_REGION,
          AWS_KEY_ID,
          AWS_SECRET,
        );
        confidence = awsResult.confidence / 100;
        passed = confidence >= MIN_CONFIDENCE;
        if (!passed) reason = "low_confidence";
      } catch {
        reason = "aws_error";
      }
    } else {
      // MVP Fallback: motion + frame validation
      const hasRealMotion =
        Array.isArray(blinkTimestamps) && blinkTimestamps.length >= 2;
      const timeDelta = hasRealMotion
        ? blinkTimestamps![1] - blinkTimestamps![0]
        : 0;
      const validTiming = timeDelta > 200 && timeDelta < 3000;

      passed =
        hasRealMotion && validTiming && !!smileDetected && !!frameHash;
      confidence = passed ? 0.82 : 0.3;
      if (!passed) reason = "liveness_failed";
    }

    // ── Record session ────────────────────────────────
    await db.from("liveness_sessions").insert({
      user_id: user.id,
      status: passed ? "passed" : "failed",
      attempt_number: attempt,
      failure_reason: passed ? null : reason,
      device_id: deviceId,
      ip_address: ip,
      frame_hash: frameHash,
      confidence,
    });

    if (passed) {
      await db
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          liveness_attempts: attempt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await db.from("activity_logs").insert({
        actor_user_id: user.id,
        target_user_id: user.id,
        action: "liveness_passed",
        detail: `Identity verified on attempt ${attempt}`,
        level: "info",
        ip_address: ip,
        device_id: deviceId,
      });

      return json({ success: true, confidence, verified: true });
    }

    // ── Handle failure ────────────────────────────────
    const updates: Record<string, unknown> = {
      liveness_attempts: attempt,
      updated_at: new Date().toISOString(),
    };
    const lockedOut = attempt >= MAX_ATTEMPTS;
    if (lockedOut) {
      updates.liveness_locked_until = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000,
      ).toISOString();
    }
    await db.from("profiles").update(updates).eq("user_id", user.id);

    await db.from("activity_logs").insert({
      actor_user_id: user.id,
      target_user_id: user.id,
      action: lockedOut ? "liveness_lockout" : "liveness_failed",
      detail: `Attempt ${attempt}/${MAX_ATTEMPTS} failed (${reason})`,
      level: lockedOut ? "critical" : "warning",
      ip_address: ip,
      device_id: deviceId,
    });

    // A user hitting the attempt ceiling is exactly the brute-force
    // pattern the admin Security tab needs to surface — raise a real
    // alert here instead of leaving it implicit in the logs only.
    if (lockedOut) {
      await db.from("security_alerts").insert({
        user_id: user.id,
        alert_type: "brute_force",
        severity: "critical",
        details: {
          context: "liveness_verification",
          attempts: attempt,
          device_id: deviceId,
          ip,
        },
      });
    }

    return json(
      {
        success: false,
        reason,
        attempt,
        attempts_left: Math.max(0, MAX_ATTEMPTS - attempt),
        locked: lockedOut,
      },
      403,
    );
  } catch (err) {
    console.error("liveness-verify error", err);
    return json({ error: "internal_error" }, 500);
  }
});

// ── Placeholder for AWS Rekognition call ──────────────
async function callRekognitionLiveness(
  _frame: string,
  _region: string,
  _key: string,
  _secret: string,
): Promise<{ confidence: number }> {
  // TODO: Replace with actual AWS SDK call
  // See: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html
  throw new Error("AWS not configured");
}
