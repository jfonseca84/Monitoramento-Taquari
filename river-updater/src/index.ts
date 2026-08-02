import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { LoggerService } from './logs/logger.service.js';
import { SupabaseService } from './services/supabase.service.js';
import { CronService } from './scheduler/cron.service.js';

// Carrega variáveis de ambiente sem sobrescrever variáveis injetadas em produção (ex: Railway)
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

async function bootstrapWorker() {
  LoggerService.info('WORKER', 'Serviço iniciado');
  LoggerService.info('WORKER', `Iniciando Monitoramento Hidrológico - Rio Taquari (v${process.env.WORKER_VERSION || '1.0.0'})`);

  // 1. Validar conexão com Supabase
  LoggerService.info('WORKER', 'Validando credenciais e conexão com o Supabase...');
  const connTest = await SupabaseService.testConnection();

  if (!connTest.ok) {
    LoggerService.error('ERROR', `Erro na inicialização do worker: ${connTest.message}`);
    LoggerService.error('ERROR', 'Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Railway.');
    process.exit(1);
  }

  LoggerService.info('WORKER', connTest.message);

  // 2. Executar ciclo inicial imediato de sincronização
  LoggerService.info('WORKER', 'Executando sincronização inicial de inicialização...');
  await CronService.runOnce(false);

  // 3. Ativar Agendador Interno (node-cron)
  CronService.startScheduler();

  // 4. Manter o processo continuamente ativo (Heartbeat a cada 5 minutos para validação rápida pós-deploy; ajustar para 3600000 em prod estável)
  setInterval(() => {
    LoggerService.info('WORKER', 'Serviço em execução contínua 24/7 (Heartbeat OK)');
  }, 300000);

  // 5. Tratar desligamento gracioso
  const gracefulShutdown = (signal: string) => {
    LoggerService.info('WORKER', `Sinal ${signal} recebido. Encerrando river-monitor-worker graciosamente...`);
    CronService.stopScheduler();
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Captura global de exceções para evitar queda do processo
process.on('uncaughtException', (err) => {
  LoggerService.error('ERROR', `Exceção não tratada capturada no worker: ${err.message}`);
});

process.on('unhandledRejection', (reason: any) => {
  LoggerService.error('ERROR', `Rejeição de promessa não tratada: ${reason?.message || reason}`);
});

bootstrapWorker().catch((err) => {
  LoggerService.error('ERROR', `Falha na inicialização do worker: ${err.message}`);
  process.exit(1);
});

