
-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  description TEXT,
  description_ar TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_videos table
CREATE TABLE public.course_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_access table (grants per-user access to courses)
CREATE TABLE public.user_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID,
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

-- Courses: everyone can view courses (cards shown to all, content gated)
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
-- Admin can manage courses
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (is_admin());

-- Course videos: viewable by users who have access or are admin
CREATE POLICY "Users with access can view videos" ON public.course_videos FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.user_course_access
      WHERE user_course_access.course_id = course_videos.course_id
        AND user_course_access.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_tier = 'unlimited'
    )
  );
-- Admin can manage videos
CREATE POLICY "Admins can manage videos" ON public.course_videos FOR ALL USING (is_admin());

-- User course access: users can see their own access
CREATE POLICY "Users can view their own access" ON public.user_course_access FOR SELECT
  USING (auth.uid() = user_id);
-- Admin can manage all access
CREATE POLICY "Admins can manage access" ON public.user_course_access FOR ALL USING (is_admin());

-- Create index for performance
CREATE INDEX idx_course_videos_course_id ON public.course_videos(course_id);
CREATE INDEX idx_user_course_access_user ON public.user_course_access(user_id);
CREATE INDEX idx_user_course_access_course ON public.user_course_access(course_id);

-- Insert sample courses
INSERT INTO public.courses (title, title_ar, description, description_ar, sort_order) VALUES
  ('Masterclass Level 1', 'الماستركلاس - المستوى الأول', 'Learn the fundamentals of technical analysis and chart reading', 'تعلم أساسيات التحليل الفني وقراءة الرسوم البيانية', 1),
  ('Advanced Liquidity Concepts', 'مفاهيم السيولة المتقدمة', 'Deep dive into liquidity zones, order blocks, and institutional trading', 'غوص عميق في مناطق السيولة وكتل الأوامر والتداول المؤسسي', 2),
  ('Smart Money Strategy', 'استراتيجية الأموال الذكية', 'Master the smart money concepts used by institutional traders', 'أتقن مفاهيم الأموال الذكية المستخدمة من قبل المتداولين المؤسسيين', 3);
