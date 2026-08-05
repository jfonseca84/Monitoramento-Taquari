-- Migration 017: Comprehensive Security Hardening & Strict RLS Enforcement
-- Target: Supabase / PostgreSQL
-- Purpose: Protects all system tables against unauthorized REST API / F12 console manipulation.
-- Replaces insecure `auth.role() = 'authenticated'` checks with strict `public.is_admin()` verification.

-- 1. SECURITY DEFINER FUNCTION FOR REAL ADMIN AUTHORIZATION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Service role always has administrative clearance
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- 2. Check if current authenticated user UID or Email exists in public.admin_users
  IF auth.role() = 'authenticated' THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.admin_users 
      WHERE (user_id IS NOT NULL AND user_id = auth.uid())
         OR (email IS NOT NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt()->>'email', '')))
    );
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permission on is_admin() function
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2. HARDENING RLS POLICIES ACROSS ALL TABLES

-- CITIES
DROP POLICY IF EXISTS "Admin write cities" ON public.cities;
CREATE POLICY "Admin write cities" ON public.cities 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- STATIONS
DROP POLICY IF EXISTS "Admin write stations" ON public.stations;
CREATE POLICY "Admin write stations" ON public.stations 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- RIVER LEVELS
DROP POLICY IF EXISTS "Admin write river levels" ON public.river_levels;
DROP POLICY IF EXISTS "Admin write river_levels" ON public.river_levels;
CREATE POLICY "Admin write river levels" ON public.river_levels 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- SPONSORS
DROP POLICY IF EXISTS "Admin write sponsors" ON public.sponsors;
CREATE POLICY "Admin write sponsors" ON public.sponsors 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- CAMERAS
DROP POLICY IF EXISTS "Admin write cameras" ON public.cameras;
CREATE POLICY "Admin write cameras" ON public.cameras 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- NEWS
DROP POLICY IF EXISTS "Admin write news" ON public.news;
CREATE POLICY "Admin write news" ON public.news 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- NEWS SOURCES
DROP POLICY IF EXISTS "Allow full access for authenticated/service_role on news_sources" ON public.news_sources;
DROP POLICY IF EXISTS "Admin write news_sources" ON public.news_sources;
CREATE POLICY "Admin write news_sources" ON public.news_sources 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ALERTS
DROP POLICY IF EXISTS "Admin write alerts" ON public.alerts;
CREATE POLICY "Admin write alerts" ON public.alerts 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- SETTINGS
DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
CREATE POLICY "Admin write settings" ON public.settings 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- SITE SETTINGS
DROP POLICY IF EXISTS "Admin write access for site_settings" ON public.site_settings;
CREATE POLICY "Admin write access for site_settings" ON public.site_settings 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- LOGS / SYNC LOGS / AUDIT LOGS
DROP POLICY IF EXISTS "Admin write logs" ON public.logs;
DROP POLICY IF EXISTS "Admin write sync_logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Admin write audit_logs" ON public.audit_logs;

CREATE POLICY "Admin write sync_logs" ON public.sync_logs 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin write audit_logs" ON public.audit_logs 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ADMIN USERS
DROP POLICY IF EXISTS "Admin write admin_users" ON public.admin_users;
CREATE POLICY "Admin write admin_users" ON public.admin_users 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- STORAGE BUCKETS OBJECTS
DROP POLICY IF EXISTS "Admin bucket object write" ON storage.objects;
DROP POLICY IF EXISTS "Admin bucket object update" ON storage.objects;
DROP POLICY IF EXISTS "Admin bucket object delete" ON storage.objects;

CREATE POLICY "Admin bucket object write" ON storage.objects 
  FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin bucket object update" ON storage.objects 
  FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admin bucket object delete" ON storage.objects 
  FOR DELETE 
  USING (public.is_admin());
