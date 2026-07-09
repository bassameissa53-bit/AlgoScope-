import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, Mail, Check } from "lucide-react";

export default function EditProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setPhone((data as any).phone_number || "");
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setError("");
    if (!fullName.trim()) {
      setError(t("editProfile.nameRequired"));
      return;
    }
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    setTimeout(() => navigate("/profile"), 900);
  };

  return (
    <AppLayout showNav={false}>
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full glass flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div>
          <h1 className="font-display text-lg tracking-wide">{t("editProfile.title")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("editProfile.subtitle")}</p>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">…</p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("editProfile.fullName")}
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("editProfile.fullNamePlaceholder")}
                className="h-12 bg-muted/30 border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("editProfile.phone")}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 1xx xxx xxxx"
                type="tel"
                className="h-12 bg-muted/30 border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("editProfile.email")}
              </label>
              <div className="h-12 px-3 rounded-md bg-muted/15 border border-border/40 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/70">{t("editProfile.emailLocked")}</p>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full h-12 gold-gradient text-primary-foreground font-display tracking-widest text-xs uppercase"
            >
              {saved ? (
                <><Check className="h-4 w-4 mr-2" />{t("editProfile.saved")}</>
              ) : saving ? (
                t("editProfile.saving")
              ) : (
                t("editProfile.save")
              )}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
