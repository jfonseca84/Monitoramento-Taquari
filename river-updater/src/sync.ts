import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CronService } from './scheduler/cron.service.js';
import { LoggerService } from './logs/logger.service.js';
import { SupabaseService } from './services/supabase.service.js';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

async function runManualSync() {
  LoggerService.info('SyncCLI', '=================================================');
  LoggerService.info('SyncCLI', '  EXECUÇÃO MANUAL DE COLETA (npm run sync)');
  LoggerService.info('SyncCLI', '=================================================');

  // Testar conexão
  const connTest = await SupabaseService.testConnection();
  if (!connTest.ok) {
    LoggerService.error('SyncCLI', `Falha de conexão com o Supabase: ${connTest.message}`);
    process.exit(1);
  }

  LoggerService.info('SyncCLI', connTest.message);

  const result = await CronService.runOnce(true);

  LoggerService.info('SyncCLI', '-------------------------------------------------');
  LoggerService.info('SyncCLI', `Status Final: ${result.status.toUpperCase()}`);
  LoggerService.info('SyncCLI', `Tempo de Execução: ${result.durationMs}ms`);
  LoggerService.info('SyncCLI', `Medições Inseridas: ${result.updatedCount}`);
  LoggerService.info('SyncCLI', `Medições Ignoradas (Duplicadas): ${result.skippedCount}`);
  LoggerService.info('SyncCLI', `Cidades Atualizadas: ${result.citiesUpdatedCount}`);
  LoggerService.info('SyncCLI', `Total de Erros: ${result.errorsCount}`);

  if (result.errors.length > 0) {
    LoggerService.warn('SyncCLI', 'Detalhamento de erros/avisos:');
    result.errors.forEach((err, idx) => LoggerService.warn('SyncCLI', `  ${idx + 1}. ${err}`));
  }

  LoggerService.info('SyncCLI', '=================================================');

  if (result.status === 'erro') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runManualSync();
