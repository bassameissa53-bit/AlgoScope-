import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Shield, Smile, Eye } from "lucide-react";
import type { LivenessTrackingState } from "@/lib/faceLiveness";
import { submitLivenessResult, requiresLiveness } from "@/lib/liveness";
import { getDeviceId } from "@/lib/deviceFingerprint";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/layout/AppHeader";

async function loadFaceLivenessLib() {
  return import("@/lib/faceLiveness");
}

export default function Liveness() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "scanning" | "submitting" | "success" | "error" | "cameraDenied"
  >("loading");
  const [loadingStage, setLoadingStage] = useState<"camera" | "model">("camera");
  const [slowLoad, setSlowLoad] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<LivenessTrackingState>({
    faceDetected: false,
    eyesClosed: false,
    isSmiling: false,
    centered: false,
    faceSize: 0,
    blinkCount: 0,
    smileDetected: false,
    ear: 0,
    mar: 0,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRef.current?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user && mountedRef.current) {
      checkAndStart();
    } else if (!authLoading && !user && mountedRef.current) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const checkAndStart = async () => {
    try {
      const needs = await requiresLiveness();
      if (!needs) {
        navigate("/dashboard");
        return;
      }
      await startLiveness();
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not start verification");
    }
  };

  const startCamera = async (): Promise<boolean> => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      console.error("Camera access denied:", err);
      if (!mountedRef.current) return false;
      setStatus("cameraDenied");
      setError(err instanceof Error ? err.message : t("liveness.cameraDenied"));
      return false;
    }
  };

  const startLiveness = async () => {
    if (!mountedRef.current) return;
    setStatus("loading");
    setLoadingStage("camera");
    setSlowLoad(false);
    setError("");

    // Pre-check: getUserMedia requires a secure context (HTTPS/localhost)
    // and browser support. Without this check, an unsupported browser just
    // throws a generic TypeError that's harder to diagnose from the UI.
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("cameraDenied");
      setError(t("liveness.cameraUnsupported"));
      return;
    }

    const cameraReady = await startCamera();
    if (!cameraReady) return;

    setLoadingStage("model");
    const slowTimer = setTimeout(() => {
      if (mountedRef.current) setSlowLoad(true);
    }, 6000);

    try {
      const { loadFaceMesh, runLivenessCheck } = await loadFaceLivenessLib();
      await loadFaceMesh();
      clearTimeout(slowTimer);
      if (!mountedRef.current) return;
      setStatus("scanning");
      setSlowLoad(false);

      if (!videoRef.current) {
        throw new Error("Video element not ready");
      }

      stopRef.current = runLivenessCheck(videoRef.current, {
        onUpdate: (newState) => {
          if (mountedRef.current) setState(newState);
        },
        onComplete: async (result) => {
          if (!mountedRef.current) return;
          setStatus("submitting");
          if (!videoRef.current) return;

          try {
            const deviceId = getDeviceId();
            const res = await submitLivenessResult({
              videoElement: videoRef.current,
              blinkTimestamps: result.blinkTimestamps,
              smileDetected: result.smileDetected,
              deviceId,
            });

            if (!mountedRef.current) return;

            if (res.verified || res.already_verified) {
              setStatus("success");
              toast({
                title: t("liveness.successTitle"),
                description: t("liveness.successDesc"),
              });
              setTimeout(() => navigate("/dashboard"), 1200);
            } else {
              throw new Error(res.reason || "Verification failed");
            }
          } catch (submitErr) {
            if (!mountedRef.current) return;
            setStatus("error");
            setError(submitErr instanceof Error ? submitErr.message : "Submission failed");
          }
        },
        onError: (err) => {
          if (!mountedRef.current) return;
          setStatus("error");
          setError(err.message);
        },
      });
    } catch (err) {
      clearTimeout(slowTimer);
      if (!mountedRef.current) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to start liveness check");
    }
  };

  const handleRetry = () => {
    stopRef.current?.();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    startLiveness();
  };

  return (
    <div className="min-h-screen bg-background max-w-[430px] mx-auto flex flex-col">
      <AppHeader />

      <div className="flex-1 px-6 py-8 flex flex-col">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-bold gold-text">{t("liveness.title")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("liveness.subtitle")}</p>
        </div>

        <Card className="card-elevated border-0 flex-1 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-lg">{t("liveness.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border-2 ${
                state.faceDetected ? "border-primary/50 gold-glow" : "border-border/50"
              }`}
            >
              {status !== "cameraDenied" && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover [transform:scaleX(-1)]"
                />
              )}

              {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm px-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {loadingStage === "camera" ? t("liveness.loading") : t("liveness.loadingModel")}
                  </p>
                  {slowLoad && (
                    <p className="text-xs text-muted-foreground/70 mt-2 animate-fade-in">
                      {t("liveness.slowLoad")}
                    </p>
                  )}
                </div>
              )}

              {status === "scanning" && !state.faceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <p className="text-sm text-foreground px-6 text-center">
                    {t("liveness.positionFace")}
                  </p>
                </div>
              )}

              {status === "submitting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">{t("liveness.submitting")}</p>
                </div>
              )}

              {status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-2">
                    <Smile className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm font-medium text-success">{t("liveness.successTitle")}</p>
                </div>
              )}

              {(status === "error" || status === "cameraDenied") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-6 text-center">
                  <p className="text-sm text-destructive mb-4">{error}</p>
                  <Button
                    onClick={handleRetry}
                    className="gold-gradient text-primary-foreground"
                  >
                    <RefreshCw className="h-4 w-4 me-2" />
                    {t("liveness.retry")}
                  </Button>
                </div>
              )}
            </div>

            {status === "scanning" && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-xs text-center text-primary/80 font-medium">
                  {t("liveness.instructions")}
                </p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t("liveness.blinks")}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {state.blinkCount}/2
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t("liveness.smile")}</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      state.smileDetected ? "text-success" : "text-primary"
                    }`}
                  >
                    {state.smileDetected ? t("liveness.detected") : t("liveness.looking")}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              {t("liveness.privacy")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
