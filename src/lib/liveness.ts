import { supabase } from "@/integrations/supabase/client";

export interface LivenessSubmission {
  videoElement: HTMLVideoElement;
  blinkTimestamps: number[];
  smileDetected: boolean;
  deviceId: string;
}

export interface LivenessResult {
  success: boolean;
  verified?: boolean;
  already_verified?: boolean;
  confidence?: number;
  reason?: string;
  attempt?: number;
  attempts_left?: number;
  locked?: boolean;
  unlocks_at?: string;
  error?: string;
}

/** Capture one frame, hash it, and submit to the liveness-verify edge function. */
export async function submitLivenessResult({
  videoElement,
  blinkTimestamps,
  smileDetected,
  deviceId,
}: LivenessSubmission): Promise<LivenessResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  // Capture a single frame from the video
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(videoElement, 0, 0);

  // Hash the frame (we send the hash, NOT the raw image)
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", 0.75),
  );
  if (!blob) throw new Error("Frame capture failed");

  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const frameHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { data, error } = await supabase.functions.invoke("liveness-verify", {
    body: {
      frameHash,
      blinkTimestamps,
      smileDetected,
      deviceId,
      // frameBase64: canvas.toDataURL("image/jpeg", 0.75), // only for AWS
    },
  });

  if (error) throw error;
  const result = data as LivenessResult;

  if (result.verified) {
    await supabase.auth.updateUser({ data: { is_verified: true } });
  }

  return result;
}

/** Guard: returns true when the current user still needs to complete liveness. */
export async function requiresLiveness(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  return !profile?.is_verified;
}
