-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create analyses table to store chart analysis history
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chart_image_url TEXT NOT NULL,
  trading_pair TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price TEXT NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit_1 TEXT NOT NULL,
  take_profit_2 TEXT,
  take_profit_3 TEXT,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  analysis_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Analyses policies
CREATE POLICY "Users can view their own analyses"
ON public.analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
ON public.analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON public.analyses FOR DELETE
USING (auth.uid() = user_id);

-- Create daily_usage table to track free tier limits
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- Enable RLS on daily_usage
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Daily usage policies
CREATE POLICY "Users can view their own usage"
ON public.daily_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.daily_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.daily_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for chart images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chart-images', 'chart-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chart images
CREATE POLICY "Users can upload chart images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view chart images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chart-images');

CREATE POLICY "Users can delete their own chart images"
ON storage.objects FOR DELETE
USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();