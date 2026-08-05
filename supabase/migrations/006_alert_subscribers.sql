-- Migration 006: Preventive Risk Area Alert Subscribers and Notifications

CREATE TABLE IF NOT EXISTS public.alert_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    city_slug TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    resides_in_risk_area BOOLEAN DEFAULT false,
    receive_attention BOOLEAN DEFAULT true,
    receive_alert BOOLEAN DEFAULT true,
    receive_flood BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID REFERENCES public.alert_subscribers(id) ON DELETE CASCADE,
    city_slug TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    river_level NUMERIC(6,2) NOT NULL,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'email',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_subscribers:
-- Public insert allowed for subscription form
DROP POLICY IF EXISTS "Public insert alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "Public insert alert_subscribers" ON public.alert_subscribers 
    FOR INSERT WITH CHECK (true);

-- Admin & Service Role full access for alert_subscribers
DROP POLICY IF EXISTS "Admin write/read alert_subscribers" ON public.alert_subscribers;
CREATE POLICY "Admin write/read alert_subscribers" ON public.alert_subscribers 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- RLS Policies for alert_notifications:
-- Public can update confirmed_at timestamp
DROP POLICY IF EXISTS "Public update alert_notifications confirmation" ON public.alert_notifications;
CREATE POLICY "Public update alert_notifications confirmation" ON public.alert_notifications 
    FOR UPDATE USING (true) WITH CHECK (true);

-- Public read for notification check
DROP POLICY IF EXISTS "Public select alert_notifications" ON public.alert_notifications;
CREATE POLICY "Public select alert_notifications" ON public.alert_notifications 
    FOR SELECT USING (true);

-- Admin & Service Role full access for alert_notifications
DROP POLICY IF EXISTS "Admin write/read alert_notifications" ON public.alert_notifications;
CREATE POLICY "Admin write/read alert_notifications" ON public.alert_notifications 
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
