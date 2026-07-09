import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  thumbnail_url: string | null;
  sort_order: number;
}

export interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  title_ar: string;
  video_url: string;
  sort_order: number;
  duration_seconds: number | null;
}

export function useAcademy() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessibleCourseIds, setAccessibleCourseIds] = useState<Set<string>>(new Set());
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchAccess();
      fetchTier();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("sort_order");
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  const fetchAccess = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_course_access")
      .select("course_id")
      .eq("user_id", user.id);
    setAccessibleCourseIds(new Set((data || []).map((d: any) => d.course_id)));
  };

  const fetchTier = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();
    if (data) setUserTier(data.subscription_tier);
  };

  const hasAccess = (courseId: string) => {
    return userTier === "unlimited" || accessibleCourseIds.has(courseId);
  };

  return { courses, loading, hasAccess, userTier };
}

export function useCourseVideos(courseId: string | undefined) {
  const [videos, setVideos] = useState<CourseVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("course_videos")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order");
      setVideos((data as CourseVideo[]) || []);
      setLoading(false);
    };
    fetch();
  }, [courseId]);

  return { videos, loading };
}
