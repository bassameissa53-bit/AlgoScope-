import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

type Course = {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  emoji: string;
  category: string;
  required_role: string;
  lesson_count: number;
  duration_minutes: number;
  sort_order: number;
};

const CATEGORIES = ["All", "Foundation", "ICT Core", "Advanced", "Live"];

export default function Academy() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [accessIds, setAccessIds] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState<string>("free");
  const [activeCat, setActiveCat] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: cs }, profileRes, accessRes] = await Promise.all([
        supabase.from("courses").select("*").order("sort_order"),
        user
          ? supabase.from("profiles").select("subscription_tier").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as any),
        user
          ? supabase.from("user_course_access").select("course_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] } as any),
      ]);
      setCourses((cs as Course[]) || []);
      if (profileRes?.data?.subscription_tier) setTier(profileRes.data.subscription_tier);
      setAccessIds(new Set(((accessRes?.data as any[]) || []).map((r) => r.course_id)));
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const isPremium = tier !== "free";

  const filtered = useMemo(() => {
    if (activeCat === "All") return courses;
    return courses.filter((c) => c.category === activeCat);
  }, [courses, activeCat]);

  const hasAccess = (c: Course) =>
    c.required_role === "free" || isPremium || accessIds.has(c.id);

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-[#F4D67A] via-[#D4AF37] to-[#A88527] bg-clip-text text-transparent">
              Academy
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide">
              Institutional ICT Mastery
            </p>
          </div>
          {isPremium ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Sparkles className="h-3 w-3" /> PREMIUM
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-white/10 bg-white/5 text-muted-foreground">
              FREE TIER
            </span>
          )}
        </div>

        {/* Paywall */}
        {!isPremium && (
          <div className="glass rounded-2xl p-5 mb-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#D4AF37]/10 blur-3xl" />
            <div className="flex items-start gap-3 relative">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#D4AF37]/10 border border-[#D4AF37]/30 shrink-0">
                <Lock className="h-5 w-5 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  Unlock the Full Academy
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Premium access to every ICT course, live market breakdowns,
                  and pro-level strategy playbooks.
                </p>
                <button
                  onClick={() => navigate("/contact")}
                  className="btn-gold mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide"
                >
                  CONTACT FOR UPGRADE <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="-mx-5 px-5 mb-5 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map((cat) => {
              const active = activeCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-gradient-to-r from-[#F4D67A] to-[#A88527] text-[#0a0a0b] shadow-[0_0_18px_-4px_rgba(212,175,55,0.6)]"
                      : "bg-white/[0.03] text-muted-foreground border border-white/10 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No courses in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const accessible = hasAccess(c);
              const title = language === "ar" ? c.title_ar || c.title : c.title;
              return (
                <div key={c.id} className="relative">
                  <button
                    disabled={!accessible}
                    onClick={() => accessible && navigate(`/academy/${c.id}`)}
                    className={`w-full text-left glass rounded-2xl p-4 flex items-center gap-4 transition-all ${
                      accessible
                        ? "hover:border-[#D4AF37]/40 hover:bg-white/[0.05] active:scale-[0.99]"
                        : "opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/5 flex items-center justify-center text-2xl shrink-0">
                      {c.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">
                        {c.category}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mt-0.5 truncate">
                        {title}
                      </h3>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {c.duration_minutes > 0 ? `${c.duration_minutes} min` : "—"} ·{" "}
                        {c.lesson_count} {c.lesson_count === 1 ? "lesson" : "lessons"}
                      </div>
                      {accessible && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border border-[hsl(var(--success))]/30">
                          Start Course →
                        </div>
                      )}
                    </div>
                  </button>

                  {!accessible && (
                    <div className="absolute inset-0 rounded-2xl backdrop-blur-[2px] bg-black/40 flex items-center justify-center pointer-events-none">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-black/70 border border-[#D4AF37]/40 text-[#D4AF37]">
                        <Lock className="h-3 w-3" /> Premium Required
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
