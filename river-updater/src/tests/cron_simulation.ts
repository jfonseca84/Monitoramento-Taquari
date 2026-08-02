import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CronService } from '../scheduler/cron.service.js';
import { LoggerService } from '../logs/logger.service.js';
import { SupabaseService } from '../services/supabase.service.js';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

async function simulateCronCycles() {
  console.log('\n=================================================');
  console.log('[SIMULAÇÃO DE CRON INTERNO] RIVER MONITOR WORKER');
  console.log('=================================================\n');

  // 1. Validar Conexão
  const conn = await SupabaseService.testConnection();
  if (!conn.ok) {
    console.error(`❌ Conexão falhou: ${conn.message}`);
    process.exit(1);
  }
  console.log(`✅ Supabase: ${conn.message}\n`);

  // CICLO 1
  console.log('--- Executando Ciclo 1 de Coleta ---');
  const res1 = await CronService.runOnce(false);
  console.log(`Resultado Ciclo 1: Status=${res1.status.toUpperCase()}, Inseridos=${res1.updatedCount}, Ignorados=${res1.skippedCount}, Cidades=${res1.citiesUpdatedCount}\n`);

  // CICLO 2 (Simulação de tentativa concorrente durante processamento)
  console.log('--- Executando Teste de Trava de Concorrência (Mutex Lock) ---');
  const p1 = CronService.runOnce(false);
  const p2 = CronService.runOnce(false); // Esta deve retornar 'locked'
  const [resLock1, resLock2] = await Promise.all([p1, p2]);

  console.log(`Resultado Execução Principal: Status=${resLock1.status.toUpperCase()}`);
  console.log(`Resultado Execução Bloqueada: Status=${resLock2.status.toUpperCase()} (Esperado: LOCKED)\n`);

  // CICLO 3 (Execução consecutiva após término para testar deduplicação)
  console.log('--- Executando Ciclo 3 de Coleta (Testando Deduplicação) ---');
  const res3 = await CronService.runOnce(false);
  console.log(`Resultado Ciclo 3: Status=${res3.status.toUpperCase()}, Inseridos=${res3.updatedCount}, Ignorados=${res3.skippedCount}, Cidades=${res3.citiesUpdatedCount}\n`);

  console.log('=================================================');
  console.log('SIMULAÇÃO CONCLUÍDA COM SUCESSO');
  console.log('=================================================\n');

  if (resLock2.status === 'locked' && (res1.status === 'sucesso' || res1.status === 'warning') && (res3.status === 'sucesso' || res3.status === 'warning')) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

simulateCronCycles();
