import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "algoscope_device_id";

/**
 * Generate a stable device fingerprint based on browser characteristics.
 * Persisted in localStorage so the same browser/device keeps the same ID.
 */
function generateDeviceId(): string {
  const fp = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || "n",
    // @ts-ignore
    navigator.deviceMemory || "n",
  ].join("|");

  // djb2 hash -> hex
  let hash = 5381;
  for (let i = 0; i < fp.length; i++) {
    hash = ((hash << 5) + hash) + fp.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `dev_${Math.abs(hash).toString(16)}_${rand}`;
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return generateDeviceId();
  }
}

export function getDeviceModel(): string {
  const ua = navigator.userAgent;
  let os = "Unknown OS";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  return `${os} • ${browser}${isMobile ? " (Mobile)" : " (Desktop)"}`;
}

/**
 * Upsert the current device into user_devices for the given user.
 * Safe to call on every login/signup; updates last_seen on repeat visits.
 */
export async function trackDevice(userId: string): Promise<void> {
  try {
    const device_id = getDeviceId();
    const device_model = getDeviceModel();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("user_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("device_id", device_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_devices")
        .update({ last_seen: now, device_model })
        .eq("id", existing.id);

      await supabase.from("activity_logs").insert({
        actor_user_id: userId,
        target_user_id: userId,
        action: "login",
        detail: device_model,
        level: "info",
        device_id,
      });
      return;
    }

    // First time we've seen this device for this user.
    const { count } = await supabase
      .from("user_devices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    await supabase.from("user_devices").insert({
      user_id: userId,
      device_id,
      device_model,
      first_seen: now,
      last_seen: now,
    });

    await supabase.from("activity_logs").insert({
      actor_user_id: userId,
      target_user_id: userId,
      action: "login",
      detail: `${device_model} (new device)`,
      level: (count ?? 0) > 0 ? "warning" : "info",
      device_id,
    });

    // A brand-new device on an account that already had one is worth a
    // flag for admin review — most genuine users only add a second
    // device occasionally, so it's a reasonable, low-noise signal.
    if ((count ?? 0) > 0) {
      await supabase.from("security_alerts").insert({
        user_id: userId,
        alert_type: "new_ip_login",
        severity: "medium",
        details: { device_id, device_model, existing_device_count: count },
      });
    }
  } catch (err) {
    console.error("Device tracking failed:", err);
  }
}
