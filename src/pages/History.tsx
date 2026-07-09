import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, ChevronRight, History as HistoryIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Analysis {
  id: string;
  chart_image_url: string;
  trading_pair: string | null;
  direction: "BUY" | "SELL";
  entry_price: string;
  stop_loss: string;
  take_profit_1: string;
  take_profit_2: string | null;
  take_profit_3: string | null;
  confidence_score: number;
  analysis_notes: string | null;
  created_at: string;
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnalyses(data as Analysis[]);
    }
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">{t("history.title")}</h1>
            <LanguageSwitcher />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{t("history.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("history.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {analyses.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">{t("history.noAnalyses")}</p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              {t("history.startAnalyzing")}
            </p>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                {t("history.goToDashboard")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <Card 
                key={analysis.id} 
                className="card-elevated overflow-hidden cursor-pointer transition-all"
                onClick={() => toggleExpand(analysis.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Chart Thumbnail */}
                    <img 
                      src={analysis.chart_image_url} 
                      alt="Chart" 
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          className={analysis.direction === "BUY" 
                            ? "bg-success/20 text-success border-0 text-xs" 
                            : "bg-danger/20 text-danger border-0 text-xs"
                          }
                        >
                          {analysis.direction === "BUY" ? (
                            <TrendingUp className="h-3 w-3 me-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 me-1" />
                          )}
                          {analysis.direction}
                        </Badge>
                        <span className="text-xs text-primary font-medium">
                          {analysis.confidence_score}%
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {analysis.trading_pair || "Chart Analysis"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(analysis.created_at), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <ChevronRight 
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedId === analysis.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {expandedId === analysis.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">{t("dashboard.entry")}</p>
                          <p className="font-mono text-sm">{analysis.entry_price}</p>
                        </div>
                        <div className="p-2 bg-danger/10 rounded-lg">
                          <p className="text-xs text-danger">{t("dashboard.stopLoss")}</p>
                          <p className="font-mono text-sm text-danger">{analysis.stop_loss}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="p-2 bg-success/10 rounded-lg flex justify-between">
                          <span className="text-xs text-success">TP1</span>
                          <span className="font-mono text-sm text-success">{analysis.take_profit_1}</span>
                        </div>
                        {analysis.take_profit_2 && (
                          <div className="p-2 bg-success/10 rounded-lg flex justify-between">
                            <span className="text-xs text-success">TP2</span>
                            <span className="font-mono text-sm text-success">{analysis.take_profit_2}</span>
                          </div>
                        )}
                        {analysis.take_profit_3 && (
                          <div className="p-2 bg-success/10 rounded-lg flex justify-between">
                            <span className="text-xs text-success">TP3</span>
                            <span className="font-mono text-sm text-success">{analysis.take_profit_3}</span>
                          </div>
                        )}
                      </div>

                      {analysis.analysis_notes && (
                        <p className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
                          {analysis.analysis_notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
