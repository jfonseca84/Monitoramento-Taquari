-- Migration 018: Additional RLS Hardening for Auxiliary Alert and Camera Tables
-- Target: Supabase / PostgreSQL
-- Purpose: Extends strict public.is_admin() validation to alert_subscribers, alert_notifications, alert_history, alert_dispatches, and city_cameras without modifying previous migration history.

-- ALERT SUBSCRIBERS
DROP POLICY IF EXISTS "Admin write/read alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "Admin write/read alert_subscribers" ON public.alert_subscribers 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ALERT NOTIFICATIONS
DROP POLICY IF EXISTS "Admin write/read alert_notifications" ON public.alert_notifications;
CREATE POLICY "Admin write/read alert_notifications" ON public.alert_notifications 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ALERT HISTORY
DROP POLICY IF EXISTS "Admin write alert_history" ON public.alert_history;
CREATE POLICY "Admin write alert_history" ON public.alert_history 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- ALERT DISPATCHES
DROP POLICY IF EXISTS "Admin write alert_dispatches" ON public.alert_dispatches;
CREATE POLICY "Admin write alert_dispatches" ON public.alert_dispatches 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

-- CITY CAMERAS
DROP POLICY IF EXISTS "Admin write city_cameras" ON public.city_cameras;
CREATE POLICY "Admin write city_cameras" ON public.city_cameras 
  FOR ALL 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());
