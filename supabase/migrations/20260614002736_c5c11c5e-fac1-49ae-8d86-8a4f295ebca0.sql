DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ban_entity_type') THEN
    CREATE TYPE public.ban_entity_type AS ENUM ('user_id','device_id','ip_address');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_plan') THEN
    CREATE TYPE public.sub_plan AS ENUM ('free','premium_monthly','premium_yearly','premium_lifetime');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_status') THEN
    CREATE TYPE public.sub_status AS ENUM ('active','expired','suspended','cancelled','trial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
    CREATE TYPE public.alert_type AS ENUM ('concurrent_login','brute_force','new_ip_login','vpn_detected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
    CREATE TYPE public.alert_severity AS ENUM ('low','medium','high','critical');
  END IF;
END $$;