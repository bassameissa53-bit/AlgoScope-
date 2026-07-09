import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, Check, Eye, EyeOff } from "lucide-react";

export default function ChangePassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const strength = newPass.length >= 12 ? "strong" : newPass.length >= 8 ? "medium" : newPass.length > 0 ? "weak" : "";
  const strengthColor = { weak: "bg-destructive", medium: "bg-amber-400", strong: "bg-accent", "": "bg-muted" }[strength];
  const strengthWidth = { weak: "33%", medium: "66%", strong: "100%", "": "0%" }[strength];

  const handleSave = async () => {
    setError("");
    if (newPass.length < 8) {
      setError(t("changePassword.tooShort"));
      return;
    }
    if (newPass !== confirmPass) {
      setError(t("changePassword.mismatch"));
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPass });
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
          <h1 className="font-display text-lg tracking-wide">{t("changePassword.title")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("changePassword.subtitle")}</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("changePassword.newPassword")}
            </label>
            <div className="relative">
              <Input
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 bg-muted/30 border-border/60 pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPass && (
              <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${strengthColor}`}
                  style={{ width: strengthWidth }}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("changePassword.confirmPassword")}
            </label>
            <Input
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 bg-muted/30 border-border/60"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={saving || saved || !newPass || !confirmPass}
            className="w-full h-12 gold-gradient text-primary-foreground font-display tracking-widest text-xs uppercase"
          >
            {saved ? (
              <><Check className="h-4 w-4 mr-2" />{t("changePassword.saved")}</>
            ) : saving ? (
              t("changePassword.saving")
            ) : (
              t("changePassword.save")
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
