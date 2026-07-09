import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";

export default function Plans() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const freeFeatures = [
    t("plans.feature.analyses5"),
    t("plans.feature.basicSignals"),
    t("plans.feature.standardSpeed"),
    t("plans.feature.7dayHistory"),
  ];

  const premiumFeatures = [
    t("plans.feature.unlimitedAnalyses"),
    t("plans.feature.extendedTargets"),
    t("plans.feature.priorityProcessing"),
    t("plans.feature.fullHistory"),
    t("plans.feature.advancedInsights"),
  ];

  return (
    <AppLayout showNav={false}>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full glass flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-2">{t("plans.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("plans.subtitle")}
          </p>
        </div>

        {/* Free Plan */}
        <Card className="card-elevated mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                {t("plans.free")}
              </CardTitle>
              <Badge variant="secondary">{t("plans.currentPlan")}</Badge>
            </div>
            <p className="text-2xl font-bold">$0</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="card-elevated gold-border gold-glow relative overflow-hidden">
          <div className="absolute top-0 end-0 w-20 h-20 gold-gradient opacity-20 blur-2xl" />
          <CardHeader className="pb-4 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="gold-text">{t("plans.premium")}</span>
              </CardTitle>
              <Badge className="gold-gradient text-primary-foreground border-0">
                Recommended
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">$29</span>
              <span className="text-muted-foreground text-sm">/{t("plans.perMonth").replace("شهرياً", "month")}</span>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <ul className="space-y-3 mb-6">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {/* No payment gateway yet — upgrades are granted manually by an
                admin after the user reaches out, so this routes to Contact
                rather than a disabled "coming soon" dead end. */}
            <Button
              onClick={() => navigate("/contact")}
              className="w-full gold-gradient text-primary-foreground font-semibold"
            >
              {t("plans.requestUpgrade")}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {t("plans.manualUpgradeNote")}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
