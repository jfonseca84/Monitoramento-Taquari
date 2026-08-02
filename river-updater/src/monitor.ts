import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes('your-supabase-project') &&
  !SUPABASE_URL.includes('seu-projeto') &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_SERVICE_ROLE_KEY.includes('sua-chave')
);

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

async function runHealthMonitor() {
  console.log(`=================================================`);
  console.log(`[GitHub Auditor] INICIANDO AUDITORIA E MONITORAMENTO DE TELEMETRIA`);
  console.log(`[GitHub Auditor] Data/Hora: ${new Date().toISOString()}`);
  console.log(`=================================================`);

  if (!isSupabaseConfigured || !supabase) {
    console.warn(`[GitHub Auditor] Supabase não configurado ou credenciais ausentes. Auditoria em modo simulação.`);
    process.exit(0);
  }

  try {
    // 1. Verificar último registro em sync_logs
    const { data: latestLogs, error: logErr } = await supabase
      .from('sync_logs')
      .select('*')
      .order('sync_time', { ascending: false })
      .limit(1);

    if (logErr) {
      console.error(`[GitHub Auditor] Erro ao consultar sync_logs: ${logErr.message}`);
    }

    const latestLog = latestLogs?.[0];
    let isStagnant = false;
    let timeDiffMinutes = null;

    if (latestLog) {
      const lastSyncTime = new Date(latestLog.sync_time).getTime();
      timeDiffMinutes = Math.round((Date.now() - lastSyncTime) / (1000 * 60));
      console.log(`[GitHub Auditor] Última execução registrada no Supabase Cron:`);
      console.log(`  - Horário: ${latestLog.sync_time} (${timeDiffMinutes} minuto(s) atrás)`);
      console.log(`  - Status:  ${latestLog.status.toUpperCase()}`);
      console.log(`  - Mensagem: ${latestLog.message}`);

      if (timeDiffMinutes > 30) {
        isStagnant = true;
        console.warn(`[GitHub Auditor] ⚠️ ALERTA: A coleta do Supabase Cron está estagnada há mais de 30 minutos!`);
      }
    } else {
      console.warn(`[GitHub Auditor] Nenhum registro de sincronização encontrado em sync_logs.`);
      isStagnant = true;
    }

    // 2. Verificar últimas atualizações na tabela cities
    const { data: citiesData, error: cityErr } = await supabase
      .from('cities')
      .select('name, slug, updated_at, last_updated, current_level')
      .eq('active', true);

    let outdatedCitiesCount = 0;
    if (cityErr) {
      console.error(`[GitHub Auditor] Erro ao consultar tabela cities: ${cityErr.message}`);
    } else if (citiesData && citiesData.length > 0) {
      console.log(`\n[GitHub Auditor] Estado das Cidades na Tabela 'cities':`);
      const nowMs = Date.now();
      for (const city of citiesData) {
        if (!city.updated_at) continue;
        const updatedAtMs = new Date(city.updated_at).getTime();
        const diffMin = Math.round((nowMs - updatedAtMs) / (1000 * 60));

        if (diffMin > 45) {
          outdatedCitiesCount++;
          console.error(`[GitHub Auditor] ❌ CRITICAL: ${city.name} sem atualização há ${diffMin} minutos. (Nível: ${city.current_level}m)`);
        } else {
          console.log(`  - ${city.name}: atualizado há ${diffMin} min (${city.current_level}m)`);
        }
      }
    }

    // 3. Verificar últimas medições por cidade em river_levels
    const { data: latestLevels, error: levelErr } = await supabase
      .from('river_levels')
      .select('recorded_at, city_id, level')
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (levelErr) {
      console.error(`[GitHub Auditor] Erro ao consultar river_levels: ${levelErr.message}`);
    } else if (latestLevels && latestLevels.length > 0) {
      const newestReading = latestLevels[0];
      const newestTime = new Date(newestReading.recorded_at).getTime();
      const readingDiffMin = Math.round((Date.now() - newestTime) / (1000 * 60));

      console.log(`\n[GitHub Auditor] Estado das Medições Recentes no Banco:`);
      console.log(`  - Medição mais recente: ${newestReading.recorded_at} (${readingDiffMin} min atrás)`);
      console.log(`  - Nível: ${newestReading.level}m`);

      if (readingDiffMin > 45) {
        console.warn(`[GitHub Auditor] ⚠️ ATENÇÃO: Nenhuma nova medição foi inserida nos últimos 45 minutos.`);
      }
    }

    console.log(`-------------------------------------------------`);
    if (isStagnant || outdatedCitiesCount > 0) {
      console.warn(`[GitHub Auditor] RESULTADO DA AUDITORIA: [ALERTA DE FALHA DETECTADO]`);
      if (isStagnant) {
        console.warn(`[GitHub Auditor] - O agendamento do Supabase Cron ou a Edge Function não registraram sincronizações nos últimos 30 minutos.`);
      }
      if (outdatedCitiesCount > 0) {
        console.warn(`[GitHub Auditor] - ${outdatedCitiesCount} cidade(s) ativa(s) estão desatualizadas há mais de 45 minutos.`);
      }
      console.warn(`[GitHub Auditor] IMPORTANTE: O monitor do GitHub Actions NÃO realizará gravação ou coleta direta para manter a separação de responsabilidades.`);
      console.log(`=================================================`);
      process.exit(1);
    } else {
      console.log(`[GitHub Auditor] RESULTADO DA AUDITORIA: [SISTEMA SAUDÁVEL E EM OPERAÇÃO]`);
      console.log(`[GitHub Auditor] Supabase Cron e Edge Function ativos e operando normalmente.`);
      console.log(`=================================================`);
      process.exit(0);
    }

  } catch (err: any) {
    console.error(`[GitHub Auditor] Falha na auditoria: ${err.message}`);
    process.exit(1);
  }
}

runHealthMonitor();
