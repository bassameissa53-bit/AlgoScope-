import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, AlertTriangle, Users, CreditCard, FileText, LayoutDashboard,
  Search, ChevronDown, ChevronUp, Smartphone, Ban, ArrowUpCircle,
  CircleDot, Activity, Crown, Sparkles, LogOut, CheckCircle2, RotateCcw,
  Globe, Plus,
} from "lucide-react";

// ---------- Types ----------
type Tab = "overview" | "users" | "security" | "subscriptions" | "audit";
type FilterKey = "all" | "free" | "premium" | "banned" | "alerts";

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  phone_number: string | null;
  subscription_tier: string | null;
  is_banned: boolean | null;
  created_at: string;
  updated_at: string;
}
interface DeviceRow {
  id: string; user_id: string; device_id: string; device_model: string | null;
  is_trusted: boolean | null; is_primary: boolean | null; last_seen: string;
}
interface SubscriptionRow {
  id: string; user_id: string; plan: string; status: string;
  started_at: string; expires_at: string | null; admin_notes: string | null;
}
interface AlertRow {
  id: string; user_id: string | null; alert_type: string; severity: string;
  details: Record<string, unknown>; is_resolved: boolean; created_at: string;
}
interface BannedRow {
  id: string; entity_type: string; entity_value: string; reason: string;
  is_permanent: boolean; expires_at: string | null; created_at: string;
}
interface LogRow {
  id: string; actor_user_id: string | null; target_user_id: string | null;
  action: string; detail: string | null; level: string; created_at: string;
}

// ---------- Helpers ----------
function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [tab, setTab] = useState<Tab>("overview");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Array<{ id: string; user_id: string; pair: string; created_at: string }>>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [bannedEntities, setBannedEntities] = useState<BannedRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadSecurityData = async () => {
    const [{ data: al }, { data: be }] = await Promise.all([
      supabase.from("security_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("banned_entities").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    setAlerts((al as AlertRow[]) || []);
    setBannedEntities((be as BannedRow[]) || []);
  };

  const reloadSubscriptions = async () => {
    const { data: subs } = await supabase.from("subscriptions").select("*");
    setSubscriptions((subs as SubscriptionRow[]) || []);
  };

  const reloadLogs = async () => {
    const { data: lg } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((lg as LogRow[]) || []);
  };

  // Route protection
  useEffect(() => {
    if (adminLoading) return;
    if (!user) return navigate("/auth");
    if (!isAdmin) return navigate("/dashboard");
  }, [user, isAdmin, adminLoading, navigate]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [{ data: ps }, { data: ds }, { data: an }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_devices").select("*").order("last_seen", { ascending: false }),
        supabase.from("analyses").select("id, user_id, trading_pair, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setProfiles((ps as ProfileRow[]) || []);
      setDevices((ds as DeviceRow[]) || []);
      setRecent(((an as any[]) || []).map((r) => ({ id: r.id, user_id: r.user_id, pair: r.trading_pair, created_at: r.created_at })));

      await Promise.all([reloadSecurityData(), reloadSubscriptions(), reloadLogs()]);

      // Aggregate analysis counts per user
      const { data: counts } = await supabase.from("analyses").select("user_id");
      const map: Record<string, number> = {};
      ((counts as any[]) || []).forEach((r) => { map[r.user_id] = (map[r.user_id] || 0) + 1; });
      setUsageCounts(map);
      setLoading(false);
    })();
  }, [isAdmin]);

  // Stats
  const totalUsers = profiles.length;
  const bannedCount = profiles.filter((p) => p.is_banned).length;
  const expiredCount = subscriptions.filter((s) => s.status === "expired").length;
  const alertCount = alerts.filter((a) => !a.is_resolved).length;

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground tracking-widest uppercase">Verifying access…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm tracking-widest uppercase truncate">AlgoScope Admin</p>
            <p className="text-[9px] text-muted-foreground tracking-[0.25em] uppercase truncate">
              Control Center · Super Admin
            </p>
          </div>
          {alertCount > 0 && (
            <span className="relative inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/15 border border-destructive/40">
              <span className="absolute -left-0.5 -top-0.5 w-2 h-2 rounded-full bg-destructive animate-ping" />
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-[10px] font-semibold text-destructive">{alertCount}</span>
            </span>
          )}
          <button
            onClick={() => signOut().then(() => navigate("/"))}
            className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-primary-foreground font-display text-sm"
            title="Sign out"
          >
            {(user?.email || "?").slice(0, 1).toUpperCase()}
          </button>
        </div>

        {/* TABS */}
        <nav className="max-w-6xl mx-auto px-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutDashboard} label="Overview" />
            <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={Users} label="Users" />
            <TabBtn active={tab === "security"} onClick={() => setTab("security")} icon={Shield} label="Security" badge={alertCount} />
            <TabBtn active={tab === "subscriptions"} onClick={() => setTab("subscriptions")} icon={CreditCard} label="Subscriptions" badge={expiredCount} />
            <TabBtn active={tab === "audit"} onClick={() => setTab("audit")} icon={FileText} label="Audit Logs" />
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "overview" && (
          <OverviewTab
            totalUsers={totalUsers}
            alerts={alertCount}
            expired={expiredCount}
            banned={bannedCount}
            recent={recent}
            profiles={profiles}
            loading={loading}
            alertRows={alerts}
          />
        )}
        {tab === "users" && (
          <UsersTab
            profiles={profiles}
            devices={devices}
            usageCounts={usageCounts}
            loading={loading}
            adminId={user?.id ?? ""}
            alerts={alerts}
            onChanged={async () => {
              const { data: ps } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
              setProfiles((ps as ProfileRow[]) || []);
              await Promise.all([reloadSubscriptions(), reloadLogs(), reloadSecurityData()]);
            }}
          />
        )}
        {tab === "security" && (
          <SecurityTab
            alerts={alerts}
            bannedEntities={bannedEntities}
            profiles={profiles}
            adminId={user?.id ?? ""}
            loading={loading}
            onChanged={async () => { await Promise.all([reloadSecurityData(), reloadLogs()]); }}
          />
        )}
        {tab === "subscriptions" && (
          <SubscriptionsTab
            subscriptions={subscriptions}
            profiles={profiles}
            adminId={user?.id ?? ""}
            loading={loading}
            onChanged={async () => { await Promise.all([reloadSubscriptions(), reloadLogs()]); }}
          />
        )}
        {tab === "audit" && (
          <AuditTab logs={logs} profiles={profiles} loading={loading} />
        )}
      </main>
    </div>
  );
}

// ---------- Tab Button ----------
function TabBtn({
  active, onClick, icon: Icon, label, badge,
}: { active: boolean; onClick: () => void; icon: any; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 flex items-center gap-2 text-xs uppercase tracking-widest font-display transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
          {badge}
        </span>
      )}
      {active && <span className="absolute left-2 right-2 bottom-0 h-0.5 gold-gradient rounded-full" />}
    </button>
  );
}

// ---------- Overview ----------
function OverviewTab({
  totalUsers, alerts, expired, banned, recent, profiles, loading, alertRows,
}: {
  totalUsers: number; alerts: number; expired: number; banned: number;
  recent: Array<{ id: string; user_id: string; pair: string; created_at: string }>;
  profiles: ProfileRow[]; loading: boolean; alertRows: AlertRow[];
}) {
  const nameFor = (uid: string | null) =>
    profiles.find((p) => p.user_id === uid)?.full_name || "Trader";

  const openAlerts = alertRows.filter((a) => !a.is_resolved).slice(0, 5);
  const sevTone: Record<string, string> = {
    critical: "text-destructive", high: "text-amber-400",
    medium: "text-primary", low: "text-accent",
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Users" value={totalUsers} icon={Users} tone="gold" loading={loading} />
        <StatCard label="Active Alerts" value={alerts} icon={AlertTriangle} tone={alerts > 0 ? "red" : "muted"} loading={loading} />
        <StatCard label="Expired Plans" value={expired} icon={CreditCard} tone={expired > 0 ? "orange" : "muted"} loading={loading} />
        <StatCard label="Banned Accounts" value={banned} icon={Ban} tone={banned > 0 ? "red" : "muted"} loading={loading} />
      </div>

      {alerts > 0 && (
        <section className="glass p-5 space-y-3">
          <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Active Alerts</h3>
          <div className="space-y-2">
            {openAlerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                <span className={`relative w-2 h-2 rounded-full shrink-0 ${a.severity === "critical" ? "bg-destructive animate-pulse" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">
                    <span className="text-foreground">{nameFor(a.user_id)}</span>
                    <span className="text-muted-foreground"> — </span>
                    <span className={sevTone[a.severity] || "text-foreground"}>{a.alert_type.replace(/_/g, " ")}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-display text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Recent Activity
          </h3>
        </div>
        <div className="space-y-2">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent activity.</p>
          ) : (
            recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <CircleDot className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">
                    <span className="text-foreground">{nameFor(r.user_id)}</span>
                    <span className="text-muted-foreground"> analyzed </span>
                    <span className="text-primary font-semibold">{r.pair}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone, loading,
}: { label: string; value: number; icon: any; tone: "gold" | "red" | "orange" | "muted"; loading: boolean }) {
  const toneCls = {
    gold: "text-primary border-primary/30",
    red: "text-destructive border-destructive/40",
    orange: "text-amber-400 border-amber-400/40",
    muted: "text-muted-foreground border-border/40",
  }[tone];
  return (
    <div className={`glass p-4 border ${toneCls}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${toneCls.split(" ")[0]}`} />
      </div>
      <p className={`mt-2 font-display text-3xl ${toneCls.split(" ")[0]}`}>
        {loading ? "—" : value}
      </p>
    </div>
  );
}

// ---------- Users Tab ----------
function UsersTab({
  profiles, devices, usageCounts, loading, adminId, alerts, onChanged,
}: {
  profiles: ProfileRow[]; devices: DeviceRow[];
  usageCounts: Record<string, number>; loading: boolean;
  adminId: string; alerts: AlertRow[]; onChanged: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { type: "sub" | "ban"; user: ProfileRow }>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const alertUserIds = useMemo(
    () => new Set(alerts.filter((a) => !a.is_resolved).map((a) => a.user_id)),
    [alerts],
  );

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${p.full_name || ""} ${p.phone_number || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === "free" && p.subscription_tier !== "free") return false;
      if (filter === "premium" && (p.subscription_tier === "free" || !p.subscription_tier)) return false;
      if (filter === "banned" && !p.is_banned) return false;
      if (filter === "alerts" && !alertUserIds.has(p.user_id)) return false;
      return true;
    });
  }, [profiles, query, filter, alertUserIds]);

  const quickToggleTier = async (p: ProfileRow) => {
    const isPremium = p.subscription_tier && p.subscription_tier !== "free";
    const action = isPremium ? "downgrade" : "upgrade";
    if (!window.confirm(`${action === "upgrade" ? "Upgrade" : "Downgrade"} ${p.full_name || "this user"}?`)) return;
    setBusy(p.user_id);
    try {
      const { error } = await supabase.functions.invoke("subscription-manager", {
        body: { targetUserId: p.user_id, action },
      });
      if (error) throw error;
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const banDevice = async (deviceId: string) => {
    if (!window.confirm("Permanently ban this device? It will be blocked across all accounts.")) return;
    setBusy(deviceId);
    try {
      const { error } = await supabase.from("banned_entities").insert({
        entity_type: "device_id",
        entity_value: deviceId,
        reason: "Banned by admin from Users tab",
        is_permanent: true,
        banned_by: adminId,
      });
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        actor_user_id: adminId,
        action: "device_banned",
        detail: deviceId,
        level: "warning",
      });
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to ban device");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or phone…"
            className="pl-9 h-11 bg-muted/30 border-border/60"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterKey)}
          className="h-11 px-3 rounded-md bg-muted/30 border border-border/60 text-xs uppercase tracking-widest font-display text-foreground"
        >
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="banned">Banned</option>
          <option value="alerts">Has Alert</option>
        </select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No users match.</p>
        ) : (
          filtered.map((p) => {
            const isPremium = p.subscription_tier && p.subscription_tier !== "free";
            const userDevices = devices.filter((d) => d.user_id === p.user_id);
            const isOpen = expanded === p.user_id;
            const hasAlert = alertUserIds.has(p.user_id);
            return (
              <div key={p.user_id} className="glass overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.user_id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-sm shrink-0 ${
                    isPremium ? "gold-gradient text-primary-foreground" : "bg-muted text-secondary"
                  }`}>
                    {(p.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm truncate">{p.full_name || "Unnamed"}</p>
                      {isPremium ? (
                        <Crown className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-secondary shrink-0" />
                      )}
                      {hasAlert && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{p.phone_number || "—"}</p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        isPremium ? "bg-primary/15 text-primary" : "bg-muted text-secondary"
                      }`}>{isPremium ? "Premium" : "Free"}</span>
                      {p.is_banned && (
                        <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                          Banned
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Last seen {timeAgo(p.updated_at)}
                      </span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat label="Analyses" value={usageCounts[p.user_id] || 0} />
                      <MiniStat label="Devices" value={userDevices.length} />
                      <MiniStat
                        label="Alerts"
                        value={alerts.filter((a) => a.user_id === p.user_id && !a.is_resolved).length}
                      />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Devices</p>
                      <div className="space-y-1.5">
                        {userDevices.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No devices recorded.</p>
                        ) : userDevices.map((d) => (
                          <div key={d.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/20">
                            <Smartphone className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{d.device_model || "Unknown device"}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {d.device_id.slice(0, 12)}… · {timeAgo(d.last_seen)}
                              </p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              d.is_trusted ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                            }`}>{d.is_trusted ? "Trusted" : "New"}</span>
                            <button
                              disabled={busy === d.device_id}
                              onClick={() => banDevice(d.device_id)}
                              className="text-[10px] uppercase tracking-widest text-destructive disabled:opacity-40"
                            >
                              {busy === d.device_id ? "…" : "Ban"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <ActionBtn
                        icon={ArrowUpCircle}
                        label={busy === p.user_id ? "…" : (isPremium ? "Downgrade" : "Upgrade")}
                        tone="gold"
                        onClick={() => quickToggleTier(p)}
                      />
                      <ActionBtn icon={CreditCard} label="Subscription" tone="blue" onClick={() => setModal({ type: "sub", user: p })} />
                      <ActionBtn icon={Ban} label={p.is_banned ? "Unban" : "Ban"} tone="red" onClick={() => setModal({ type: "ban", user: p })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {modal?.type === "ban" && (
        <BanModalContent
          user={modal.user}
          adminId={adminId}
          onClose={() => setModal(null)}
          onDone={async () => { setModal(null); await onChanged(); }}
        />
      )}
      {modal?.type === "sub" && (
        <SubModalContent
          user={modal.user}
          adminId={adminId}
          onClose={() => setModal(null)}
          onDone={async () => { setModal(null); await onChanged(); }}
        />
      )}
    </div>
  );
}

// ---------- Ban / Unban modal ----------
function BanModalContent({
  user, adminId, onClose, onDone,
}: { user: ProfileRow; adminId: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState(
    "Your account has been suspended for violating our Terms of Service. Contact support for assistance.",
  );
  const [saving, setSaving] = useState(false);

  const confirmBan = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("ban-manager", {
        body: { targetUserId: user.user_id, action: "ban", reason: reason || "No reason provided" },
      });
      if (error) throw error;
      await onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to ban user");
    } finally {
      setSaving(false);
    }
  };

  const confirmUnban = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("ban-manager", {
        body: { targetUserId: user.user_id, action: "unban" },
      });
      if (error) throw error;
      await onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unban user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={user.is_banned ? "Unban User" : "Ban User"} onClose={onClose}>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center font-display text-sm shrink-0">
          {(user.full_name || "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm">{user.full_name || "Unnamed"}</p>
          <p className="text-[11px] text-muted-foreground">{user.phone_number || "—"}</p>
        </div>
      </div>

      {!user.is_banned ? (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Multi-account abuse"
              className="h-10 bg-muted/30 border-border/60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Message shown to user</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-muted/30 border border-border/60 p-2.5 text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              disabled={saving}
              onClick={confirmBan}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {saving ? "Banning…" : "Confirm Ban"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            This restores full access to the account immediately.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button disabled={saving} onClick={confirmUnban} className="flex-1 gold-gradient text-primary-foreground">
              {saving ? "Unbanning…" : "Confirm Unban"}
            </Button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ---------- Subscription management modal ----------
const PLAN_OPTIONS = ["free", "premium_monthly", "premium_yearly", "premium_lifetime"];
const STATUS_OPTIONS = ["active", "expired", "suspended", "cancelled", "trial"];

function SubModalContent({
  user, adminId, onClose, onDone,
}: { user: ProfileRow; adminId: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [plan, setPlan] = useState(user.subscription_tier === "free" || !user.subscription_tier ? "free" : "premium_monthly");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error: subErr } = await supabase.from("subscriptions").upsert(
        {
          user_id: user.user_id,
          plan,
          status,
          admin_notes: notes || null,
          managed_by: adminId,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );
      if (subErr) throw subErr;

      await supabase
        .from("profiles")
        .update({ subscription_tier: plan === "free" ? "free" : "premium", updated_at: now })
        .eq("user_id", user.user_id);

      await supabase.from("activity_logs").insert({
        actor_user_id: adminId,
        target_user_id: user.user_id,
        action: "subscription_managed",
        detail: `plan=${plan} status=${status}`,
        level: "info",
      });

      await onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Manage Subscription" onClose={onClose}>
      <p className="text-sm">{user.full_name || "User"}</p>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full h-10 px-3 rounded-md bg-muted/30 border border-border/60 text-sm"
        >
          {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full h-10 px-3 rounded-md bg-muted/30 border border-border/60 text-sm"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional…"
          className="w-full rounded-md bg-muted/30 border border-border/60 p-2.5 text-sm resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button disabled={saving} onClick={save} className="flex-1 gold-gradient text-primary-foreground">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </ModalShell>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
      <p className="font-display text-lg gold-text">{value}</p>
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, tone, onClick }: { icon: any; label: string; tone: "gold" | "blue" | "red"; onClick?: () => void }) {
  const cls = {
    gold: "border-primary/40 text-primary hover:bg-primary/10",
    blue: "border-accent/40 text-accent hover:bg-accent/10",
    red: "border-destructive/40 text-destructive hover:bg-destructive/10",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-lg border ${cls} flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-display transition-colors`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="glass-strong w-full max-w-md rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm tracking-widest uppercase">{title}</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground uppercase tracking-widest">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Security Tab ----------
function SecurityTab({
  alerts, bannedEntities, profiles, adminId, loading, onChanged,
}: {
  alerts: AlertRow[]; bannedEntities: BannedRow[]; profiles: ProfileRow[];
  adminId: string; loading: boolean; onChanged: () => Promise<void>;
}) {
  const [section, setSection] = useState<"alerts" | "blocklist">("alerts");
  const [busy, setBusy] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"ip_address" | "device_id">("ip_address");
  const [newReason, setNewReason] = useState("");

  const nameFor = (uid: string | null) =>
    profiles.find((p) => p.user_id === uid)?.full_name || "Unknown";

  const resolve = async (id: string, resolved: boolean) => {
    setBusy(id);
    try {
      await supabase.from("security_alerts").update({
        is_resolved: resolved,
        resolved_by: resolved ? adminId : null,
        resolved_at: resolved ? new Date().toISOString() : null,
      }).eq("id", id);
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  const addBlock = async () => {
    if (!newValue.trim()) return;
    setBusy("new");
    try {
      const { error } = await supabase.from("banned_entities").insert({
        entity_type: newType,
        entity_value: newValue.trim(),
        reason: newReason.trim() || "Manual block",
        is_permanent: true,
        banned_by: adminId,
      });
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        actor_user_id: adminId,
        action: "entity_blocked",
        detail: `${newType}: ${newValue.trim()}`,
        level: "warning",
      });
      setNewValue("");
      setNewReason("");
      await onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add block");
    } finally {
      setBusy(null);
    }
  };

  const unblock = async (row: BannedRow) => {
    setBusy(row.id);
    try {
      await supabase.from("banned_entities").update({
        is_active: false,
        revoked_by: adminId,
        revoked_at: new Date().toISOString(),
      }).eq("id", row.id);
      await onChanged();
    } finally {
      setBusy(null);
    }
  };

  const sevTone: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/40",
    high: "bg-amber-400/15 text-amber-400 border-amber-400/40",
    medium: "bg-primary/15 text-primary border-primary/40",
    low: "bg-accent/15 text-accent border-accent/40",
  };

  const open = alerts.filter((a) => !a.is_resolved);
  const resolved = alerts.filter((a) => a.is_resolved);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 glass p-1 rounded-lg w-fit">
        {(["alerts", "blocklist"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-display transition-colors ${
              section === s ? "gold-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "alerts" ? "Alerts" : "IP / Device Blocklist"}
          </button>
        ))}
      </div>

      {section === "alerts" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : open.length === 0 && resolved.length === 0 ? (
            <div className="glass p-8 text-center">
              <Shield className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No security alerts recorded yet.</p>
            </div>
          ) : (
            <>
              {open.map((a) => (
                <div key={a.id} className="glass p-4 space-y-2 border border-destructive/20">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${sevTone[a.severity]}`}>
                      {a.severity}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{nameFor(a.user_id)}</span>
                    <span className="text-muted-foreground"> — {a.alert_type.replace(/_/g, " ")}</span>
                  </p>
                  {Object.keys(a.details || {}).length > 0 && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {JSON.stringify(a.details)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={busy === a.id}
                      onClick={() => resolve(a.id, true)}
                      className="flex-1 h-8 text-[10px] uppercase tracking-widest gold-gradient text-primary-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                  </div>
                </div>
              ))}
              {resolved.length > 0 && (
                <details className="glass p-4">
                  <summary className="text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer">
                    Resolved ({resolved.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {resolved.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-md bg-muted/20">
                        <p className="text-xs text-muted-foreground truncate">
                          {nameFor(a.user_id)} — {a.alert_type.replace(/_/g, " ")}
                        </p>
                        <button
                          disabled={busy === a.id}
                          onClick={() => resolve(a.id, false)}
                          className="text-[10px] uppercase tracking-widest text-primary shrink-0 ml-2"
                        >
                          <RotateCcw className="h-3 w-3 inline mr-1" />Reopen
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {section === "blocklist" && (
        <div className="space-y-4">
          <div className="glass p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Add new block</p>
            <div className="flex gap-2">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "ip_address" | "device_id")}
                className="h-10 px-2 rounded-md bg-muted/30 border border-border/60 text-xs"
              >
                <option value="ip_address">IP Address</option>
                <option value="device_id">Device ID</option>
              </select>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === "ip_address" ? "e.g. 41.32.10.5" : "Device fingerprint"}
                className="flex-1 h-10 bg-muted/30 border-border/60"
              />
            </div>
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Reason (optional)"
              className="h-10 bg-muted/30 border-border/60"
            />
            <Button
              disabled={busy === "new" || !newValue.trim()}
              onClick={addBlock}
              className="w-full h-10 gold-gradient text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Block
            </Button>
          </div>

          <div className="space-y-2">
            {bannedEntities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nothing blocked right now.</p>
            ) : bannedEntities.map((b) => (
              <div key={b.id} className="glass p-3 flex items-center gap-3">
                {b.entity_type === "ip_address" ? (
                  <Globe className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <Smartphone className="h-4 w-4 text-destructive shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{b.entity_value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{b.reason}</p>
                </div>
                <button
                  disabled={busy === b.id}
                  onClick={() => unblock(b)}
                  className="text-[10px] uppercase tracking-widest text-primary shrink-0"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Subscriptions Tab ----------
function SubscriptionsTab({
  subscriptions, profiles, adminId, loading, onChanged,
}: {
  subscriptions: SubscriptionRow[]; profiles: ProfileRow[];
  adminId: string; loading: boolean; onChanged: () => Promise<void>;
}) {
  const [modalUser, setModalUser] = useState<ProfileRow | null>(null);

  const subFor = (uid: string) => subscriptions.find((s) => s.user_id === uid);
  const active = subscriptions.filter((s) => s.status === "active").length;
  const expired = subscriptions.filter((s) => s.status === "expired").length;
  const suspended = subscriptions.filter((s) => s.status === "suspended").length;

  const statusTone: Record<string, string> = {
    active: "bg-accent/15 text-accent border-accent/40",
    expired: "bg-destructive/15 text-destructive border-destructive/40",
    suspended: "bg-amber-400/15 text-amber-400 border-amber-400/40",
    cancelled: "bg-muted text-muted-foreground border-border/40",
    trial: "bg-primary/15 text-primary border-primary/40",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="glass p-3 text-center">
          <p className="font-display text-2xl gold-text">{loading ? "—" : active}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Active</p>
        </div>
        <div className="glass p-3 text-center border border-destructive/30">
          <p className="font-display text-2xl text-destructive">{loading ? "—" : expired}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Expired</p>
        </div>
        <div className="glass p-3 text-center border border-amber-400/30">
          <p className="font-display text-2xl text-amber-400">{loading ? "—" : suspended}</p>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Suspended</p>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">No users yet.</p>
        ) : (
          profiles.map((p) => {
            const sub = subFor(p.user_id);
            return (
              <div key={p.user_id} className="glass p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted text-secondary flex items-center justify-center font-display text-sm shrink-0">
                  {(p.full_name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{p.full_name || "Unnamed"}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">{(sub?.plan || "free").replace(/_/g, " ")}</span>
                    {sub && (
                      <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${statusTone[sub.status] || ""}`}>
                        {sub.status}
                      </span>
                    )}
                    {sub?.expires_at && (
                      <span className="text-[10px] text-muted-foreground">
                        until {new Date(sub.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalUser(p)}
                  className="h-8 text-[10px] uppercase tracking-widest shrink-0"
                >
                  Manage
                </Button>
              </div>
            );
          })
        )}
      </div>

      {modalUser && (
        <SubModalContent
          user={modalUser}
          adminId={adminId}
          onClose={() => setModalUser(null)}
          onDone={async () => { setModalUser(null); await onChanged(); }}
        />
      )}
    </div>
  );
}

// ---------- Audit Logs Tab ----------
function AuditTab({
  logs, profiles, loading,
}: { logs: LogRow[]; profiles: ProfileRow[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"all" | "info" | "warning" | "critical">("all");

  const nameFor = (uid: string | null) =>
    profiles.find((p) => p.user_id === uid)?.full_name || (uid ? "Trader" : "System");

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (level !== "all" && l.level !== level) return false;
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = `${l.action} ${l.detail || ""} ${nameFor(l.actor_user_id)} ${nameFor(l.target_user_id)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, query, level, profiles]);

  const levelTone: Record<string, string> = {
    info: "bg-accent",
    warning: "bg-amber-400",
    critical: "bg-destructive",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs…"
            className="pl-9 h-11 bg-muted/30 border-border/60"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as typeof level)}
          className="h-11 px-3 rounded-md bg-muted/30 border border-border/60 text-xs uppercase tracking-widest font-display text-foreground"
        >
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Showing {filtered.length} of {logs.length} entries
      </p>

      <div className="glass divide-y divide-border/30">
        {loading ? (
          <p className="text-xs text-muted-foreground p-4">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4">No log entries match.</p>
        ) : (
          filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3 p-3">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${levelTone[l.level] || "bg-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className="font-medium">{nameFor(l.actor_user_id)}</span>
                  <span className="text-muted-foreground"> · {l.action.replace(/_/g, " ")}</span>
                </p>
                {l.detail && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{l.detail}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(l.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
