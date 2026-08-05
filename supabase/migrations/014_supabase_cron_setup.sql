-- Migration 014: Supabase Cron & Edge Function Automation Setup
-- Purpose: Replaces GitHub Actions scheduled collector with native Supabase Cron execution
-- Schedule: Every 5 minutes ('*/5 * * * *')

-- 1. Enable required PostgreSQL extensions if available
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: pg_cron não pôde ser ativado automaticamente. Certifique-se de habilitá-lo no painel do Supabase.';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: pg_net não pôde ser ativado automaticamente. Certifique-se de habilitá-lo no painel do Supabase.';
END $$;

-- 2. Create helper function to trigger the Supabase Edge Function
-- Independent of HTTP context or request.headers
CREATE OR REPLACE FUNCTION public.trigger_river_data_collection(
    p_edge_url text DEFAULT NULL,
    p_service_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    request_id bigint;
    edge_url text;
    auth_key text;
BEGIN
    -- 1. Determinacao robusta da URL da Edge Function
    edge_url := p_edge_url;
    IF edge_url IS NULL OR edge_url = '' THEN
        edge_url := current_setting('app.edge_function_url', true);
    END IF;
    IF edge_url IS NULL OR edge_url = '' THEN
        edge_url := current_setting('custom.edge_function_url', true);
    END IF;
    IF edge_url IS NULL OR edge_url = '' THEN
        RETURN jsonb_build_object(
            'status', 'missing_edge_function_url',
            'error_message', 'A URL da Edge Function não foi configurada nas configurações do projeto (app.edge_function_url).',
            'triggered_at', now()
        );
    END IF;

    -- 2. Determinacao da chave de autenticacao (Service Role Key / Anon Key)
    auth_key := p_service_key;
    IF auth_key IS NULL OR auth_key = '' THEN
        auth_key := current_setting('app.service_role_key', true);
    END IF;
    IF auth_key IS NULL OR auth_key = '' THEN
        auth_key := current_setting('custom.supabase_service_role_key', true);
    END IF;
    IF auth_key IS NULL OR auth_key = '' THEN
        auth_key := current_setting('custom.supabase_anon_key', true);
    END IF;

    IF auth_key IS NULL OR auth_key = '' THEN
        RETURN jsonb_build_object(
            'status', 'missing_auth_key',
            'error_message', 'Chave de autenticação não encontrada (app.service_role_key / custom.supabase_service_role_key).',
            'triggered_at', now()
        );
    END IF;

    RAISE NOTICE 'Disparando Supabase Cron para Edge Function: %', edge_url;

    -- 3. Invocação HTTP via pg_net se a extensão estiver ativa
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        SELECT net.http_post(
            url := edge_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(auth_key, ''),
                'apikey', COALESCE(auth_key, '')
            ),
            body := jsonb_build_object(
                'triggered_by', 'supabase_cron',
                'timestamp', now()
            )
        ) INTO request_id;

        RETURN jsonb_build_object(
            'status', 'dispatched',
            'net_request_id', request_id,
            'target_url', edge_url,
            'triggered_at', now()
        );
    ELSE
        RETURN jsonb_build_object(
            'status', 'pg_net_unavailable',
            'message', 'Extensão pg_net não instalada. Execute a Edge Function via webhook ou painel.',
            'triggered_at', now()
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'error_message', SQLERRM,
        'triggered_at', now()
    );
END;
$$;

-- Permissões de execução
GRANT EXECUTE ON FUNCTION public.trigger_river_data_collection(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_river_data_collection(text, text) TO postgres;

-- 3. Agendamento do Cron a cada 5 minutos ('*/5 * * * *')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove agendamento anterior para garantir idempotência
        PERFORM cron.unschedule('collect-river-data-cron');
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'collect-river-data-cron',
            '*/5 * * * *',
            'SELECT public.trigger_river_data_collection();'
        );
        RAISE NOTICE 'Supabase Cron "collect-river-data-cron" agendado a cada 5 minutos.';
    ELSE
        RAISE NOTICE 'Extensão pg_cron não instalada nesta instância. A Edge Function pode ser invocada via webhook externo.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso ao agendar cron: %', SQLERRM;
END $$;
