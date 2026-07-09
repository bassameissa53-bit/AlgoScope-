import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LogOut, Shield, Crown, Sparkles, ChevronRight,
  User as UserIcon, Lock, Phone, ShieldCheck,
  Bell, Palette, Clock, Globe,
  HelpCircle, MessageCircle, FileText, Star, Trash2,
} from "lucide-react";

interface Stats {
  count: number;
  accuracy: number;
  bestRR: number;
}

const APP_VERSION = "1.0.0";

function parseNum(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isFinite(n) ? n : null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ count: 0, accuracy: 0, bestRR: 0 });
  const [tier, setTier] = useState<string>("free");
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, subscription_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setTier((profile as any).subscription_tier || "free");
      }

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: rows } = await supabase
        .from("analyses")
        .select("entry_price, stop_loss, take_profit_3, take_profit_1, confidence_score")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString());

      const list = rows || [];
      const count = list.length;
      const conf = list.map((r: any) => r.confidence_score).filter((n: any) => typeof n === "number");
      const accuracy = conf.length ? Math.round(conf.reduce((a: number, b: number) => a + b, 0) / conf.length) : 0;
      let bestRR = 0;
      for (const r of list as any[]) {
        const e = parseNum(r.entry_price);
        const sl = parseNum(r.stop_loss);
        const tp = parseNum(r.take_profit_3) ?? parseNum(r.take_profit_1);
        if (e == null || sl == null || tp == null) continue;
        const risk = Math.abs(e - sl);
        const reward = Math.abs(tp - e);
        if (risk > 0) bestRR = Math.max(bestRR, reward / risk);
      }
      setStats({ count, accuracy, bestRR: Math.round(bestRR * 10) / 10 });
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initial = (fullName || user?.email || "?").slice(0, 1).toUpperCase();
  const isPremium = tier !== "free";

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-5 relative z-10 pb-28">
        {/* HERO */}
        <section className="glass p-6 text-center space-y-4">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl font-bold ${
              isPremium
                ? "gold-gradient text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                : "bg-muted text-secondary"
            }`}
          >
            {initial}
          </div>
          <div className="space-y-0.5">
            <p className="font-display text-lg tracking-wide">{fullName || t("profile.trader")}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isPremium ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/40">
                <Crown className="h-3 w-3 text-primary" />
                <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  ✦ Premium Member
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border">
                <Sparkles className="h-3 w-3 text-secondary" />
                <span className="text-[10px] uppercase tracking-widest text-secondary">Free Tier</span>
              </span>
            )}
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/40">
                <Shield className="h-3 w-3 text-accent" />
                <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
                  Super Admin
                </span>
              </span>
            )}
          </div>
          {!isPremium && (
            <Button
              onClick={() => navigate("/plans")}
              className="w-full btn-gold font-display tracking-widest text-xs uppercase h-11"
            >
              ✦ Upgrade to Premium
            </Button>
          )}
        </section>

        {/* STATS */}
        <section className="glass p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              This Month
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCell label="Analyses" value={loading ? "—" : String(stats.count)} />
            <StatCell label="Accuracy" value={loading ? "—" : `${stats.accuracy}%`} />
            <StatCell label="Best R:R" value={loading ? "—" : stats.bestRR ? `${stats.bestRR}x` : "—"} />
          </div>
        </section>

        {/* ACCOUNT */}
        <SettingsSection label="Account">
          <SettingsRow
            icon={UserIcon}
            label="Personal Information"
            subtitle="Name, email, profile"
            onClick={() => navigate("/profile/edit")}
          />
          <SettingsRow
            icon={Lock}
            label="Change Password"
            subtitle="Update your password"
            onClick={() => navigate("/profile/change-password")}
          />
          <SettingsRow icon={Phone} label="Phone Number" subtitle="Add or change phone" onClick={() => navigate("/profile/edit")} />
          <SettingsRow icon={ShieldCheck} label="Two-Factor Auth" subtitle="Extra account security" />
        </SettingsSection>

        {/* PREFERENCES */}
        <SettingsSection label="Preferences">
          <SettingsRow icon={Bell} label="Notifications" subtitle="Push and email alerts" />
          <SettingsRow icon={Palette} label="Theme" subtitle="Dark (default)" />
          <SettingsRow icon={Clock} label="Default Timeframe" subtitle="H1 / H4 / D1" />
          <SettingsRow
            icon={Globe}
            label="Language"
            subtitle={language === "en" ? "English" : "العربية"}
            trailing={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(language === "en" ? "ar" : "en");
                }}
                className="text-[10px] uppercase tracking-widest text-primary font-semibold px-2 py-1 rounded-md border border-primary/40"
              >
                {language === "en" ? "AR" : "EN"}
              </button>
            }
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          />
        </SettingsSection>

        {/* SUPPORT */}
        <SettingsSection label="Support">
          <SettingsRow icon={HelpCircle} label="Help & FAQ" subtitle="Common questions" />
          <SettingsRow
            icon={MessageCircle}
            label="Contact Support"
            subtitle="We're here to help"
            onClick={() => navigate("/contact")}
          />
          <SettingsRow icon={FileText} label="Terms & Risk Disclaimer" subtitle="Legal information" />
          <SettingsRow icon={Star} label="Rate AlgoScope" subtitle="Share your feedback" />
        </SettingsSection>

        {/* ADMIN */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 border border-accent/50 bg-accent/10 hover:bg-accent/15 transition-colors font-display tracking-widest text-xs uppercase text-accent"
          >
            <Shield className="h-4 w-4" />
            Open Admin Panel →
          </button>
        )}

        {/* DANGER ZONE */}
        <button
          onClick={() => navigate("/profile/delete")}
          className="w-full p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-destructive">{t("profile.deleteAccount")}</p>
            <p className="text-[11px] text-muted-foreground">{t("profile.deleteAccountSubtitle")}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* SIGN OUT */}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full h-12 border border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/15 hover:text-destructive font-display tracking-widest text-xs uppercase"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>

        {/* FOOTER */}
        <div className="pt-2 text-center space-y-0.5">
          <p className="text-[10px] text-muted-foreground/70 tracking-widest uppercase">
            AlgoScope · v{APP_VERSION}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} AlgoScope · For educational purposes only
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
      <p className="font-display text-xl gold-text">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="glass p-5 space-y-3">
      <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground/80">
        {label}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  trailing,
  onClick,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
    </button>
  );
}
