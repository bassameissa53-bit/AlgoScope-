import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, AlertTriangle, Trash2 } from "lucide-react";

export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setError("");
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnErr } = await supabase.functions.invoke("delete-account", {
        body: { confirm: "DELETE" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (fnErr || data?.error) throw new Error(data?.error || fnErr?.message);

      await signOut();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
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

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-lg tracking-wide text-destructive">
              {t("deleteAccount.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="glass p-4 space-y-2 border border-destructive/20">
              <p className="text-sm font-medium">{t("deleteAccount.whatHappens")}</p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>{t("deleteAccount.point1")}</li>
                <li>{t("deleteAccount.point2")}</li>
                <li>{t("deleteAccount.point3")}</li>
                <li>{t("deleteAccount.point4")}</li>
              </ul>
            </div>
            <Button
              onClick={() => setStep(2)}
              variant="outline"
              className="w-full h-12 border-destructive/50 text-destructive hover:bg-destructive/10 font-display tracking-widest text-xs uppercase"
            >
              {t("deleteAccount.continue")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("deleteAccount.typeToConfirm")}</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-12 bg-muted/30 border-destructive/40 text-center font-display tracking-widest"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                {t("deleteAccount.cancel")}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-display tracking-widest text-xs uppercase"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? t("deleteAccount.deleting") : t("deleteAccount.confirmDelete")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
