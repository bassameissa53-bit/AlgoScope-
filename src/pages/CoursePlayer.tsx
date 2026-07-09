import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Play, Clock, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAcademy, useCourseVideos } from "@/hooks/useAcademy";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CourseInfo {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
}

export default function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess } = useAcademy();
  const { videos, loading: videosLoading } = useCourseVideos(courseId);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [loadingCourse, setLoadingCourse] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, title_ar, description, description_ar")
        .eq("id", courseId)
        .single();
      setCourse(data as CourseInfo | null);
      setLoadingCourse(false);
    };
    fetchCourse();
  }, [courseId]);

  if (authLoading || loadingCourse || videosLoading) {
    return (
      <AppLayout showNav={false}>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!course || !courseId) {
    return (
      <AppLayout showNav={false}>
        <div className="px-4 py-6 text-center">
          <p className="text-muted-foreground">Course not found</p>
          <Button variant="link" onClick={() => navigate("/academy")} className="text-primary mt-2">
            {t("academy.backToAcademy")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const accessible = hasAccess(courseId);
  const courseTitle = language === "ar" ? course.title_ar || course.title : course.title;
  const currentVideo = videos[selectedVideoIndex];

  if (!accessible) {
    return (
      <AppLayout showNav={false}>
        <div className="px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/academy")} className="mb-4">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("academy.backToAcademy")}
          </Button>
          <div className="text-center py-12">
            <Lock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">{courseTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("academy.upgradeToWatch")}</p>
            <div className="flex flex-col gap-2 items-center">
              <Button onClick={() => navigate("/plans")} className="bg-primary text-primary-foreground">
                {t("academy.upgradePlan")}
              </Button>
              <Button variant="outline" onClick={() => window.open("https://wa.me/", "_blank")}>
                {t("academy.contactWhatsApp")}
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AppLayout showNav={false}>
      <div className="px-4 py-4">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/academy")} className="mb-3">
          <ArrowLeft className="h-4 w-4 me-2" />
          {t("academy.backToAcademy")}
        </Button>

        {/* Video Player */}
        {currentVideo ? (
          <div className="rounded-xl overflow-hidden bg-black mb-4 aspect-video">
            <video
              key={currentVideo.id}
              src={currentVideo.video_url}
              controls
              autoPlay
              className="w-full h-full"
              controlsList="nodownload"
            />
          </div>
        ) : (
          <div className="rounded-xl bg-muted aspect-video flex items-center justify-center mb-4">
            <p className="text-sm text-muted-foreground">{t("academy.noVideos")}</p>
          </div>
        )}

        {/* Current video title */}
        {currentVideo && (
          <h2 className="text-base font-semibold mb-1">
            {language === "ar" ? currentVideo.title_ar || currentVideo.title : currentVideo.title}
          </h2>
        )}
        <p className="text-xs text-muted-foreground mb-4">{courseTitle}</p>

        {/* Playlist */}
        <Card className="card-elevated">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold mb-3">{t("academy.playlist")}</h3>
            <div className="space-y-1">
              {videos.map((video, idx) => {
                const videoTitle = language === "ar" ? video.title_ar || video.title : video.title;
                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoIndex(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg text-start transition-colors",
                      idx === selectedVideoIndex
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      idx === selectedVideoIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {idx === selectedVideoIndex ? (
                        <Play className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <span className="text-xs font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{videoTitle}</p>
                      {video.duration_seconds && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(video.duration_seconds)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {videos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">{t("academy.noVideos")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
