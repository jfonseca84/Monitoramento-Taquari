import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { LoggerService } from './logs/logger.service.js';
import { SupabaseService } from './services/supabase.service.js';
import { CronService } from './scheduler/cron.service.js';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env'), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

const PREFIX = 'WorkerMain';

async function bootstrapWorker() {
  LoggerService.info(PREFIX, '=================================================');
  LoggerService.info(PREFIX, '  RIVER MONITOR WORKER (backend-service)');
  LoggerService.info(PREFIX, '  Sistema de Monitoramento Hidrológico - Rio Taquari');
  LoggerService.info(PREFIX, `  Versão: ${process.env.WORKER_VERSION || '1.0.0'}`);
  LoggerService.info(PREFIX, '=================================================');

  // 1. Validar conexão com Supabase
  LoggerService.info(PREFIX, 'Validando credenciais e conexão com o Supabase...');
  const connTest = await SupabaseService.testConnection();

  if (!connTest.ok) {
    LoggerService.error(PREFIX, `[ERRO CRÍTICO DE INICIALIZAÇÃO]: ${connTest.message}`);
    LoggerService.error(PREFIX, 'Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
    process.exit(1);
  }

  LoggerService.info(PREFIX, connTest.message);

  // 2. Executar ciclo inicial imediato de sincronização
  LoggerService.info(PREFIX, 'Executando sincronização inicial de inicialização...');
  await CronService.runOnce(false);

  // 3. Ativar Agendador Interno
  CronService.startScheduler();

  // 4. Tratar desligamento gracioso
  const gracefulShutdown = (signal: string) => {
    LoggerService.info(PREFIX, `Sinal ${signal} recebido. Encerrando river-monitor-worker graciosamente...`);
    CronService.stopScheduler();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrapWorker().catch((err) => {
  LoggerService.error(PREFIX, `Erro fatal na inicialização do worker: ${err.message}`);
  process.exit(1);
});
