import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Upload,
  Loader2,
  LogOut,
  TrendingUp,
  TrendingDown,
  Crosshair,
  Sparkles,
  X,
  Zap,
  ChevronRight,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { requiresLiveness } from "@/lib/liveness";
import { cn } from "@/lib/utils";

type Tier = "free" | "premium" | "unlimited";

interface AnalysisResult {
  direction: "BUY" | "SELL";
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2?: string;
  takeProfit3?: string;
  confidence: number;
  tradingPair?: string;
  timeframe?: string;
  session?: string;
  marketStructure?: string;
  ictConcepts?: string[];
  notes?: string;
}

interface RecentAnalysis {
  id: string;
  trading_pair: string | null;
  direction: string;
  entry_price: string | null;
  stop_loss: string | null;
  take_profit_1: string | null;
  created_at: string;
}

const DAILY_LIMIT = 5;

// ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
      <span className="font-display text-[10px] tracking-[0.3em] text-primary/80">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] tracking-widest uppercase mb-1.5">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className="gold-text font-bold">{shown}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 gold-gradient transition-[width] duration-[1200ms] ease-out"
          style={{ width: `${shown}%` }}
        />
        <div className="absolute inset-0 shimmer opacity-40 pointer-events-none" />
      </div>
    </div>
  );
}

function BiasBadge({ dir }: { dir: "BUY" | "SELL" }) {
  const bullish = dir === "BUY";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wider",
        bullish
          ? "bg-success/10 border-success/30 text-success"
          : "bg-danger/10 border-danger/30 text-danger"
      )}
    >
      {bullish ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {bullish ? "BULLISH" : "BEARISH"}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [chartPreview, setChartPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [dailyUsage, setDailyUsage] = useState(0);
  const [userTier, setUserTier] = useState<Tier>("free");
  const [userName, setUserName] = useState("");
  const [recent, setRecent] = useState<RecentAnalysis[] | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Liveness + initial fetch
  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        if (await requiresLiveness()) {
          navigate("/liveness");
          return;
        }
      } catch (e) {
        console.error("Liveness check error:", e);
      }
      fetchAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchAll = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const [usage, profile, recentRows] = await Promise.all([
      supabase
        .from("daily_usage")
        .select("analysis_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("subscription_tier, full_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("analyses")
        .select("id, trading_pair, direction, entry_price, stop_loss, take_profit_1, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setDailyUsage(usage.data?.analysis_count || 0);
    if (profile.data?.subscription_tier) setUserTier(profile.data.subscription_tier as Tier);
    if (profile.data?.full_name) setUserName(profile.data.full_name.split(" ")[0]);
    setRecent((recentRows.data as RecentAnalysis[]) || []);
  };

  // File handling
  const acceptFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Upload an image (JPG, PNG).", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    if (userTier === "free" && dailyUsage >= DAILY_LIMIT) {
      toast({ title: "Daily limit reached", description: "Upgrade to continue.", variant: "destructive" });
      return;
    }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setChartPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyUsage, userTier]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const removePreview = () => {
    setPendingFile(null);
    setChartPreview(null);
    setResult(null);
  };

  const analyze = async () => {
    if (!user || !pendingFile) return;
    setIsAnalyzing(true);
    setScanProgress(0);
    setResult(null);

    const progressTimer = setInterval(() => {
      setScanProgress((p) => (p < 92 ? p + Math.random() * 7 : p));
    }, 350);

    try {
      const ext = pendingFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chart-images").upload(fileName, pendingFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("chart-images").getPublicUrl(fileName);

      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.readAsDataURL(pendingFile);
      });

      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;

      const res: AnalysisResult = {
        direction: data.direction,
        entry: data.entry,
        stopLoss: data.stopLoss,
        takeProfit1: data.takeProfit1,
        takeProfit2: data.takeProfit2,
        takeProfit3: data.takeProfit3,
        confidence: data.confidence,
        tradingPair: data.tradingPair,
        timeframe: data.timeframe,
        session: data.session,
        marketStructure: data.marketStructure,
        ictConcepts: data.ictConcepts || data.concepts,
        notes: data.notes,
      };
      setResult(res);
      setScanProgress(100);

      await supabase.from("analyses").insert({
        user_id: user.id,
        chart_image_url: urlData.publicUrl,
        trading_pair: res.tradingPair || null,
        direction: res.direction,
        entry_price: res.entry,
        stop_loss: res.stopLoss,
        take_profit_1: res.takeProfit1,
        take_profit_2: res.takeProfit2 || null,
        take_profit_3: res.takeProfit3 || null,
        confidence_score: res.confidence,
        analysis_notes: res.notes || null,
      });

      const today = new Date().toISOString().split("T")[0];
      await supabase.from("daily_usage").upsert(
        { user_id: user.id, usage_date: today, analysis_count: dailyUsage + 1 },
        { onConflict: "user_id,usage_date" }
      );
      setDailyUsage((p) => p + 1);
      fetchAll();

      toast({ title: "Analysis complete", description: `${res.direction} · ${res.confidence}%` });
    } catch (err) {
      console.error(err);
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressTimer);
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerRight={
        <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      }
    >
      <div className="px-4 py-5 space-y-5">
        {/* ── Greeting ───────────────────────────── */}
        <div className="animate-fade-in">
          <p className="text-xs text-muted-foreground tracking-wide">
            {greeting}, {userName || "Trader"} <span className="ml-1">👋</span>
          </p>
          <h1 className="font-display text-2xl font-bold tracking-wider mt-1 gold-text">
            ANALYSIS CENTER
          </h1>
        </div>

        {/* ── Free tier banner ───────────────────── */}
        {userTier === "free" && (
          <div className="glass p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Today</p>
              <p className="text-sm font-semibold">
                <span className="gold-text">{Math.max(0, DAILY_LIMIT - dailyUsage)}</span>
                <span className="text-muted-foreground"> of {DAILY_LIMIT} free</span>
              </p>
            </div>
            <Button
              onClick={() => navigate("/profile")}
              className="btn-gold h-9 px-4 rounded-xl text-xs font-bold tracking-wider"
            >
              ✦ UPGRADE
            </Button>
          </div>
        )}

        {/* ── AI Vision Engine ───────────────────── */}
        <section>
          <SectionLabel>AI VISION ENGINE</SectionLabel>

          <div className="glass p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isAnalyzing}
            />

            {/* State 1 — Idle */}
            {!chartPreview && !isAnalyzing && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center transition-all",
                  dragOver
                    ? "border-primary bg-primary/5 gold-glow"
                    : "border-primary/30 animate-pulse-gold hover:border-primary/60"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 animate-float">
                  <Crosshair className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold">Drop your chart here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG · JPG · up to 10MB</p>
              </div>
            )}

            {/* State 3/4 — Selected / Scanning */}
            {chartPreview && (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-border/60">
                  <img
                    src={chartPreview}
                    alt="Chart"
                    className={cn(
                      "w-full h-48 object-cover transition-all",
                      isAnalyzing && "brightness-50 saturate-50"
                    )}
                  />
                  {isAnalyzing && (
                    <>
                      <div className="scan-beam" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-2 text-accent font-display tracking-[0.25em] text-xs">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          SCANNING CHART…
                        </div>
                        <p className="text-[10px] text-muted-foreground tracking-wider">
                          Detecting ICT structures
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {isAnalyzing ? (
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-accent transition-[width] duration-300"
                      style={{ width: `${scanProgress}%`, boxShadow: "var(--shadow-blue)" }}
                    />
                  </div>
                ) : !result ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={removePreview}
                      className="rounded-xl border-border/60"
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                    <Button onClick={analyze} className="btn-gold rounded-xl font-bold tracking-wider">
                      <Zap className="h-4 w-4 mr-1" /> Analyze Now
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={removePreview}
                    className="w-full rounded-xl border-border/60"
                  >
                    New Analysis
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Analysis Result ────────────────────── */}
        {result && (
          <section className="space-y-4 animate-fade-in">
            {/* Header card */}
            <div className="glass p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <BiasBadge dir={result.direction} />
                  <p className="mt-2 text-sm text-foreground/90 leading-snug">
                    {result.marketStructure || "Market structure analyzed"}
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.tradingPair && <Pill>{result.tradingPair}</Pill>}
                {result.timeframe && <Pill>{result.timeframe}</Pill>}
                {result.session && <Pill>{result.session}</Pill>}
              </div>

              <ConfidenceMeter value={result.confidence} />
            </div>

            {/* Trade signals */}
            <div className="glass p-4 space-y-2">
              <SectionLabel>TRADE SIGNALS</SectionLabel>
              <SignalRow label="Entry Zone" value={result.entry} tone="neutral" />
              <SignalRow label="Stop Loss" value={result.stopLoss} tone="danger" />
              <SignalRow label="Take Profit 1" value={result.takeProfit1} tone="success" />
              {result.takeProfit2 && <SignalRow label="Take Profit 2" value={result.takeProfit2} tone="success" />}
              {result.takeProfit3 && <SignalRow label="Take Profit 3" value={result.takeProfit3} tone="success" />}
            </div>

            {/* Concepts */}
            {result.ictConcepts && result.ictConcepts.length > 0 && (
              <div className="glass p-4">
                <SectionLabel>ICT CONCEPTS DETECTED</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {result.ictConcepts.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-accent/15 border border-accent/30 text-accent"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk disclaimer */}
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 flex gap-2">
              <ShieldAlert className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                For educational purposes only. Not financial advice. Trade at your own risk and use proper risk management.
              </p>
            </div>
          </section>
        )}

        {/* ── Recent analyses (only when no active result) ── */}
        {!result && (
          <section>
            <SectionLabel>RECENT ANALYSES</SectionLabel>
            <div className="glass p-3">
              {recent === null ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="py-8 text-center">
                  <Crosshair className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No analyses yet. Drop a chart to begin.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-border/40">
                    {recent.map((a) => (
                      <li key={a.id} className="py-2.5 flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border",
                            a.direction === "BUY"
                              ? "bg-success/10 border-success/30 text-success"
                              : "bg-danger/10 border-danger/30 text-danger"
                          )}
                        >
                          {a.direction === "BUY" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {a.trading_pair || "Chart"}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(a.created_at)}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {rr(a.entry_price, a.stop_loss, a.take_profit_1)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/history"
                    className="mt-2 flex items-center justify-center gap-1 text-xs text-primary font-semibold py-2 hover:gap-2 transition-all"
                  >
                    See All <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider bg-secondary/10 border border-secondary/20 text-secondary">
      {children}
    </span>
  );
}

function SignalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "danger" | "success";
}) {
  const styles = {
    neutral: "bg-muted/40 border-border/40 text-foreground",
    danger: "bg-danger/10 border-danger/20 text-danger",
    success: "bg-success/10 border-success/20 text-success",
  }[tone];
  return (
    <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl border", styles)}>
      <span className="text-[11px] tracking-wider uppercase opacity-80">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function rr(entry: string | null, sl: string | null, tp: string | null): string {
  const e = parseFloat(entry || "");
  const s = parseFloat(sl || "");
  const t = parseFloat(tp || "");
  if (!isFinite(e) || !isFinite(s) || !isFinite(t)) return "—";
  const risk = Math.abs(e - s);
  const reward = Math.abs(t - e);
  if (risk === 0) return "—";
  return `R:R ${(reward / risk).toFixed(2)}`;
}
