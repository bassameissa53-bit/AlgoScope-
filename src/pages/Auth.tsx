import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Mail, Lock, User, Crosshair } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { trackDevice } from "@/lib/deviceFingerprint";
import { Button } from "@/components/ui/button";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/* ── Animated Scope Logo (compact) ───────────────── */
function ScopeMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
      <defs>
        <linearGradient id="authGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(46 80% 62%)" />
          <stop offset="100%" stopColor="hsl(38 80% 45%)" />
        </linearGradient>
        <radialGradient id="authCore" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="hsl(46 90% 70%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(46 70% 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g style={{ transformOrigin: "100px 100px", animation: "auth-rot 22s linear infinite" }}>
        <circle cx="100" cy="100" r="86" fill="none" stroke="url(#authGold)" strokeWidth="1.5" opacity="0.85" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          const r2 = i % 3 === 0 ? 70 : 76;
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 82}
              y1={100 + Math.sin(a) * 82}
              x2={100 + Math.cos(a) * r2}
              y2={100 + Math.sin(a) * r2}
              stroke="hsl(46 65% 52%)"
              strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
              opacity={i % 3 === 0 ? 0.95 : 0.55}
            />
          );
        })}
      </g>
      <g style={{ transformOrigin: "100px 100px", animation: "auth-rot-rev 14s linear infinite" }}>
        <circle cx="100" cy="100" r="60" fill="none" stroke="hsl(211 80% 57%)" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
      </g>
      <line x1="100" y1="22" x2="100" y2="58" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="100" y1="142" x2="100" y2="178" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="22" y1="100" x2="58" y2="100" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <line x1="142" y1="100" x2="178" y2="100" stroke="hsl(46 65% 60%)" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="34" fill="url(#authCore)" />
      <circle cx="100" cy="100" r="5" fill="hsl(46 90% 70%)">
        <animate attributeName="r" values="5;8;5" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <style>{`
        @keyframes auth-rot { to { transform: rotate(360deg); } }
        @keyframes auth-rot-rev { to { transform: rotate(-360deg); } }
      `}</style>
    </svg>
  );
}

/* ── Google Icon (brand) ─────────────────────────── */
function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.43-1.7 4.2-5.5 4.2-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.92 3.55 14.7 2.5 12 2.5 6.94 2.5 2.85 6.59 2.85 11.66S6.94 20.82 12 20.82c6.93 0 9.5-4.86 9.5-7.39 0-.5-.05-.88-.12-1.23H12z" />
      <path fill="#FBBC05" d="M3.88 7.35l3.2 2.35C7.95 7.99 9.83 6.6 12 6.6c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.92 3.55 14.7 2.5 12 2.5 8.24 2.5 5 4.66 3.88 7.35z" opacity="0" />
    </svg>
  );
}

/* ── Inline gold-bordered input ──────────────────── */
function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }) {
  const { icon: Icon, className = "", ...rest } = props;
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-primary/70 group-focus-within:text-primary transition-colors" />
      </div>
      <input
        {...rest}
        className={`w-full h-12 ps-10 pe-3 rounded-xl bg-background/40 backdrop-blur-md
          border border-primary/25 text-sm text-foreground placeholder:text-muted-foreground/60
          outline-none transition-all
          focus:border-primary/70 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),0_0_24px_hsl(var(--primary)/0.18)]
          ${className}`}
      />
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => { trackDevice(session.user.id); }, 0);
        navigate("/dashboard");
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        trackDevice(session.user.id);
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setErrors({});
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      toast({ title: "Google Sign-In Failed", description: result.error.message ?? "Please try again.", variant: "destructive" });
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
  };

  const handleForgotPassword = async () => {
    const email = formData.email?.trim();
    if (!email || !z.string().email().safeParse(email).success) {
      toast({ title: "Enter your email first", description: "Type your email in the field above, then tap Forgot password.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a password reset link." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fe: Record<string, string> = {};
          result.error.errors.forEach(err => { fe[err.path[0] as string] = err.message; });
          setErrors(fe);
          setIsLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) {
          const msg = error.message.includes("Invalid login credentials")
            ? "Invalid email or password."
            : error.message.includes("Email not confirmed")
              ? "Please verify your email first."
              : error.message;
          toast({ title: "Login Failed", description: msg, variant: "destructive" });
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fe: Record<string, string> = {};
          result.error.errors.forEach(err => { fe[err.path[0] as string] = err.message; });
          setErrors(fe);
          setIsLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: formData.fullName },
          },
        });
        if (error) {
          const msg = error.message.includes("already registered")
            ? "This email is already registered. Please sign in."
            : error.message;
          toast({ title: "Signup Failed", description: msg, variant: "destructive" });
        } else if (data.user) {
          await supabase.from("profiles").insert({
            user_id: data.user.id,
            full_name: formData.fullName,
          });
          await supabase.from("subscriptions").insert({
            user_id: data.user.id,
            plan: "free",
            status: "active",
          });
          toast({ title: "Account Created", description: "Check your email to verify your account." });
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="max-w-[430px] mx-auto px-5 pt-10 pb-10 flex flex-col items-center">
        {/* Logo */}
        <div className="animate-float mb-4">
          <ScopeMark size={104} />
        </div>
        <span className="font-display text-[11px] font-bold gold-text tracking-[0.32em] mb-8">
          ALGOSCOPE
        </span>

        {/* Card */}
        <div className="glass w-full p-6 relative animate-fade-in">
          {/* Tabs */}
          <div className="relative grid grid-cols-2 p-1 rounded-xl bg-background/40 border border-primary/15 mb-6">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg gold-gradient gold-glow transition-transform duration-300 ease-out"
              style={{ transform: isLogin ? "translateX(2px)" : "translateX(calc(100% + 2px))" }}
            />
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`relative z-10 h-9 text-[11px] font-display font-bold tracking-[0.18em] transition-colors ${
                isLogin ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`relative z-10 h-9 text-[11px] font-display font-bold tracking-[0.18em] transition-colors ${
                !isLogin ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h1 className="font-display text-xl font-bold gold-text">
              {isLogin ? "Welcome back" : "Join AlgoScope"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isLogin ? "Sign in to access your scope" : "Start scoping the markets with AI"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div>
                <FieldInput
                  icon={User}
                  name="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
                {errors.fullName && <p className="text-[11px] text-destructive mt-1.5 ps-1">{errors.fullName}</p>}
              </div>
            )}

            <div>
              <FieldInput
                icon={Mail}
                name="email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <p className="text-[11px] text-destructive mt-1.5 ps-1">{errors.email}</p>}
            </div>

            <div>
              <FieldInput
                icon={Lock}
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              {errors.password && <p className="text-[11px] text-destructive mt-1.5 ps-1">{errors.password}</p>}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-primary hover:text-primary-glow font-semibold tracking-wide transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-gold rounded-xl text-[12px] font-bold tracking-[0.18em] mt-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
            <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
              or continue with
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 rounded-xl bg-white text-[#1f1f1f] font-semibold text-sm
              flex items-center justify-center gap-3
              border border-white/20 hover:bg-white/95 transition-all
              shadow-[0_8px_24px_-12px_rgba(255,255,255,0.4)]
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Footer text */}
          <p className="text-center text-[10px] text-muted-foreground/70 mt-5 leading-relaxed">
            By continuing you agree to our{" "}
            <span className="text-primary/80">Terms</span> and{" "}
            <span className="text-primary/80">Risk Disclaimer</span>.
          </p>
        </div>

        {/* Back to home */}
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
