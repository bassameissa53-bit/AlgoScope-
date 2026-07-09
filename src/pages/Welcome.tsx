import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  ScanLine,
  Target,
  Brain,
  ShieldCheck,
  Zap,
  Crosshair,
  TrendingUp,
  Layers,
  Activity,
  Waves,
  GitBranch,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/* ─────────────────────────────────────────────
   Animated Scope / Crosshair Logo (SVG)
   ───────────────────────────────────────────── */
function ScopeLogo({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="drop-shadow-[0_0_40px_hsl(var(--primary)/0.45)]"
    >
      <defs>
        <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(46 80% 62%)" />
          <stop offset="50%" stopColor="hsl(46 65% 52%)" />
          <stop offset="100%" stopColor="hsl(38 80% 45%)" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="hsl(46 90% 70%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(46 70% 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer rotating ring with ticks */}
      <g style={{ transformOrigin: "100px 100px", animation: "scope-rot 24s linear infinite" }}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="url(#goldRing)" strokeWidth="1.5" opacity="0.85" />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 * Math.PI) / 180;
          const x1 = 100 + Math.cos(a) * 82;
          const y1 = 100 + Math.sin(a) * 82;
          const r2 = i % 3 === 0 ? 72 : 76;
          const x2 = 100 + Math.cos(a) * r2;
          const y2 = 100 + Math.sin(a) * r2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(46 65% 52%)"
              strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
              opacity={i % 3 === 0 ? 0.95 : 0.55}
            />
          );
        })}
      </g>

      {/* Counter-rotating inner ring */}
      <g style={{ transformOrigin: "100px 100px", animation: "scope-rot-rev 16s linear infinite" }}>
        <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(211 80% 57%)" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
      </g>

      {/* Crosshair */}
      <line x1="100" y1="20" x2="100" y2="60" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="100" y1="140" x2="100" y2="180" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="20" y1="100" x2="60" y2="100" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="140" y1="100" x2="180" y2="100" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />

      {/* Core */}
      <circle cx="100" cy="100" r="36" fill="url(#coreGlow)" />
      <circle cx="100" cy="100" r="6" fill="hsl(46 90% 70%)">
        <animate attributeName="r" values="6;9;6" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.6;1" dur="2.4s" repeatCount="indefinite" />
      </circle>

      <style>{`
        @keyframes scope-rot { to { transform: rotate(360deg); } }
        @keyframes scope-rot-rev { to { transform: rotate(-360deg); } }
      `}</style>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Live Candlestick Chart with Entry / SL / TP
   ───────────────────────────────────────────── */
function CandleChart() {
  // Hand-tuned OHLC sequence so it always reads as a clean ICT setup
  const candles = [
    { o: 60, h: 70, l: 55, c: 65, bull: true },
    { o: 65, h: 72, l: 58, c: 60, bull: false },
    { o: 60, h: 68, l: 50, c: 54, bull: false },
    { o: 54, h: 58, l: 42, c: 46, bull: false },
    { o: 46, h: 52, l: 40, c: 50, bull: true },
    { o: 50, h: 58, l: 48, c: 56, bull: true },
    { o: 56, h: 64, l: 54, c: 62, bull: true },
    { o: 62, h: 78, l: 60, c: 76, bull: true },
    { o: 76, h: 90, l: 74, c: 88, bull: true },
    { o: 88, h: 100, l: 84, c: 96, bull: true },
    { o: 96, h: 112, l: 94, c: 110, bull: true },
    { o: 110, h: 124, l: 106, c: 120, bull: true },
  ];

  const W = 360;
  const H = 220;
  const padX = 18;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const minP = 30;
  const maxP = 140;
  const y = (p: number) => padY + innerH - ((p - minP) / (maxP - minP)) * innerH;

  const cw = innerW / candles.length;
  const bw = cw * 0.6;

  const entryY = y(56);
  const slY = y(42);
  const tp1Y = y(86);
  const tp2Y = y(108);
  const tp3Y = y(128);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="bull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(152 70% 55%)" />
            <stop offset="100%" stopColor="hsl(152 60% 40%)" />
          </linearGradient>
          <linearGradient id="bear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 75% 60%)" />
            <stop offset="100%" stopColor="hsl(0 70% 45%)" />
          </linearGradient>
          <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(46 65% 52%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(46 65% 52%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={padY + innerH * f}
            y2={padY + innerH * f}
            stroke="hsl(46 30% 50% / 0.08)"
            strokeDasharray="2 4"
          />
        ))}

        {/* Candles */}
        {candles.map((c, i) => {
          const cx = padX + cw * i + cw / 2;
          const fill = c.bull ? "url(#bull)" : "url(#bear)";
          const stroke = c.bull ? "hsl(152 70% 55%)" : "hsl(0 75% 60%)";
          const top = y(c.h);
          const bot = y(c.l);
          const bodyTop = y(Math.max(c.o, c.c));
          const bodyBot = y(Math.min(c.o, c.c));
          return (
            <g key={i} style={{ opacity: 0, animation: `candle-in 0.45s ease-out ${i * 0.08}s forwards` }}>
              <line x1={cx} x2={cx} y1={top} y2={bot} stroke={stroke} strokeWidth="1.2" />
              <rect
                x={cx - bw / 2}
                y={bodyTop}
                width={bw}
                height={Math.max(bodyBot - bodyTop, 2)}
                fill={fill}
                rx="1.5"
              />
            </g>
          );
        })}

        {/* Entry / SL / TP lines */}
        {[
          { yy: slY, color: "hsl(0 75% 60%)", label: "SL", side: "left" },
          { yy: entryY, color: "hsl(46 80% 60%)", label: "ENTRY", side: "left" },
          { yy: tp1Y, color: "hsl(211 80% 60%)", label: "TP1", side: "right" },
          { yy: tp2Y, color: "hsl(211 80% 60%)", label: "TP2", side: "right" },
          { yy: tp3Y, color: "hsl(211 80% 60%)", label: "TP3", side: "right" },
        ].map((l) => (
          <g key={l.label}>
            <line
              x1={padX}
              x2={W - padX}
              y1={l.yy}
              y2={l.yy}
              stroke={l.color}
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.85"
            />
            <rect
              x={l.side === "left" ? padX : W - padX - 36}
              y={l.yy - 8}
              width="36"
              height="14"
              rx="3"
              fill={l.color}
              opacity="0.9"
            />
            <text
              x={l.side === "left" ? padX + 18 : W - padX - 18}
              y={l.yy + 2}
              fontSize="9"
              textAnchor="middle"
              fontFamily="Orbitron, sans-serif"
              fontWeight="700"
              fill="#0A0A0B"
            >
              {l.label}
            </text>
          </g>
        ))}
      </svg>

      {/* AI scan beam overlay */}
      <div className="scan-beam" />

      <style>{`
        @keyframes candle-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sticky Nav — becomes glass on scroll
   ───────────────────────────────────────────── */
function StickyNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass glass-nav rounded-none border-x-0 border-t-0"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[430px] mx-auto flex items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center gold-glow">
            <Crosshair className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[13px] font-bold gold-text tracking-[0.22em]">
            ALGOSCOPE
          </span>
        </a>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link to="/auth">
            <Button
              size="sm"
              className="h-8 px-3 text-[11px] font-bold btn-gold rounded-lg tracking-wider"
            >
              SIGN IN
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
   Landing Page
   ───────────────────────────────────────────── */
export default function Welcome() {
  const services = [
    {
      icon: Brain,
      title: "AI Vision Analysis",
      desc: "Gemini 2.5 Pro reads your chart like an institutional analyst — structure, liquidity, intent.",
      accent: "hsl(46 65% 52%)",
    },
    {
      icon: Target,
      title: "Precision Levels",
      desc: "Exact Entry, Stop Loss, and 3 Take Profit targets calibrated to current market structure.",
      accent: "hsl(211 80% 57%)",
    },
    {
      icon: ShieldCheck,
      title: "Risk-First Logic",
      desc: "Confidence scoring and invalidation criteria built into every signal. No guesswork.",
      accent: "hsl(240 7% 80%)",
    },
  ];

  const steps = [
    { icon: Upload, title: "Upload", desc: "Drop a chart screenshot of any pair, any timeframe." },
    { icon: ScanLine, title: "Analyze", desc: "AI scans price action, liquidity pools, and FVGs in seconds." },
    { icon: TrendingUp, title: "Execute", desc: "Receive a complete trade plan: Entry, SL, TP1–TP3." },
  ];

  const concepts = [
    { icon: GitBranch, label: "Market Structure", sub: "MSS / BOS / CHoCH" },
    { icon: Waves, label: "Liquidity", sub: "Sweeps & Pools" },
    { icon: Layers, label: "Order Blocks", sub: "Bullish / Bearish" },
    { icon: Activity, label: "Fair Value Gaps", sub: "Imbalance Zones" },
    { icon: Target, label: "Premium / Discount", sub: "Optimal Trade Entry" },
    { icon: Zap, label: "Killzones", sub: "Session Timing" },
  ];

  return (
    <div id="top" className="relative min-h-screen w-full overflow-x-hidden">
      <StickyNav />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-5 max-w-[430px] mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="animate-float">
            <ScopeLogo size={180} />
          </div>

          <span className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] uppercase tracking-[0.25em] text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-gold" />
            AI Forex Analyst · v2
          </span>

          <h1 className="font-display mt-6 text-[34px] leading-[1.05] font-extrabold tracking-tight">
            <span className="block gold-text">PRECISION</span>
            <span className="block text-foreground/90 text-[22px] font-semibold tracking-[0.2em] my-2">
              MEETS
            </span>
            <span className="block gold-text">INTELLIGENCE</span>
          </h1>

          <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-[320px]">
            The institutional-grade AI analyst built for serious traders.
            Upload a chart. Get a complete trade plan.
          </p>

          <div className="mt-7 w-full space-y-3">
            <Link to="/auth" className="block">
              <Button className="w-full h-13 py-4 text-sm font-bold btn-gold rounded-2xl tracking-[0.15em]">
                START FREE ANALYSIS
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground/80">
              5 free analyses daily · No credit card · Cancel anytime
            </p>
          </div>
        </div>

        {/* Live candle chart card */}
        <div className="mt-10 glass p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-display text-[10px] tracking-[0.2em] text-secondary">
                LIVE · XAUUSD · M15
              </span>
            </div>
            <span className="text-[10px] text-accent font-mono">SCANNING…</span>
          </div>
          <CandleChart />
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { l: "ENTRY", v: "2,348.50", c: "text-primary" },
              { l: "SL", v: "2,341.20", c: "text-destructive" },
              { l: "TP3", v: "2,372.80", c: "text-accent" },
            ].map((x) => (
              <div key={x.l} className="rounded-lg bg-muted/40 border border-border/40 px-2 py-1.5">
                <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{x.l}</div>
                <div className={`font-mono text-xs font-bold ${x.c}`}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────── */}
      <section className="px-5 max-w-[430px] mx-auto py-12">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.3em] text-primary font-display mb-2">
            WHAT WE DO
          </p>
          <h2 className="font-display text-2xl font-bold gold-text">
            Built for the 1%
          </h2>
        </div>

        <div className="space-y-4">
          {services.map((s, i) => (
            <div
              key={s.title}
              className="glass p-5 relative group transition-all duration-300 hover:gold-glow animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border"
                  style={{
                    background: `${s.accent}15`,
                    borderColor: `${s.accent}40`,
                    boxShadow: `0 0 20px ${s.accent}25`,
                  }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.accent }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-foreground mb-1.5 tracking-wide">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────── */}
      <section className="px-5 max-w-[430px] mx-auto py-12">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.3em] text-primary font-display mb-2">
            HOW IT WORKS
          </p>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Three steps to a <span className="gold-text">trade plan</span>
          </h2>
        </div>

        <div className="relative space-y-4">
          {/* Connector line */}
          <div className="absolute left-7 top-6 bottom-6 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />

          {steps.map((step, i) => (
            <div
              key={step.title}
              className="glass p-4 flex items-center gap-4 relative animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-xl gold-gradient flex items-center justify-center gold-glow">
                  <step.icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.2} />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-background border border-primary/50 flex items-center justify-center">
                  <span className="font-display text-[10px] font-bold gold-text">
                    0{i + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-foreground tracking-wide">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ICT Concepts Grid ────────────────────────── */}
      <section className="px-5 max-w-[430px] mx-auto py-12">
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.3em] text-accent font-display mb-2">
            METHODOLOGY
          </p>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Speaks <span className="tri-text">your language</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-[280px] mx-auto">
            Trained on the full ICT framework. Reads charts the way you do.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {concepts.map((c, i) => (
            <div
              key={c.label}
              className="glass p-4 text-center hover:gold-glow transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-lg mx-auto mb-2.5 bg-primary/10 border border-primary/25 flex items-center justify-center">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="font-display text-[12px] font-bold text-foreground tracking-wide leading-tight">
                {c.label}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {c.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="px-5 max-w-[430px] mx-auto py-16">
        <div className="glass-strong relative overflow-hidden p-7 text-center">
          {/* Ambient glow */}
          <div
            className="absolute -top-20 -left-20 w-60 h-60 rounded-full blur-3xl pointer-events-none"
            style={{ background: "hsl(46 65% 52% / 0.25)" }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none"
            style={{ background: "hsl(211 80% 57% / 0.2)" }}
          />

          <div className="relative">
            <Crosshair className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse-gold rounded-full p-1" />
            <h2 className="font-display text-2xl font-bold gold-text mb-3 leading-tight">
              Stop guessing.
              <br /> Start scoping.
            </h2>
            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto mb-6">
              Join the traders who replaced indicators with intelligence.
            </p>
            <Link to="/auth" className="block">
              <Button className="w-full h-14 text-sm font-bold btn-gold rounded-2xl tracking-[0.18em] animate-pulse-gold">
                ENTER ALGOSCOPE
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground/70 mt-4 tracking-wider">
              Free forever plan · Upgrade anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 max-w-[430px] mx-auto pb-10 pt-2 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded gold-gradient flex items-center justify-center">
            <Crosshair className="h-3 w-3 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[10px] tracking-[0.25em] gold-text font-bold">
            ALGOSCOPE
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()} AlgoScope · Precision Intelligence for Traders
        </p>
      </footer>
    </div>
  );
}
