-- Migration 020: Enable Supabase Realtime on tables the frontend subscribes to
-- Purpose: The frontend (subscribeToRealtimeChanges in src/lib/supabase.ts) listens for
-- postgres_changes on river_levels, cities and alerts to refresh the UI live, without
-- requiring the user to reload the page. No prior migration ever added these tables to
-- the supabase_realtime publication, so those events were never emitted and the page
-- only picked up new data on its periodic fallback poll or a manual refresh.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'river_levels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.river_levels;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso ao adicionar river_levels ao supabase_realtime: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso ao adicionar cities ao supabase_realtime: %', SQLERRM;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso ao adicionar alerts ao supabase_realtime: %', SQLERRM;
END $$;
