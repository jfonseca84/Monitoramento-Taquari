import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { LoggerService } from './logs/logger.service.js';
import { SupabaseService } from './services/supabase.service.js';
import { CronService } from './scheduler/cron.service.js';
import { HealthService } from './services/health.service.js';

// Carrega variáveis de ambiente locais sem sobrescrever as variáveis injetadas na Railway
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

const PORT = Number(process.env.PORT) || 3000;

function startHttpServer() {
  const server = http.createServer((req, res) => {
    const url = req.url || '/';

    // Headers CORS e JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === '/health' || url === '/') {
      const healthInfo = HealthService.getHealth();
      const response = {
        status: 'online',
        service: 'river-monitor-worker',
        timestamp: new Date().toISOString(),
        version: process.env.WORKER_VERSION || '1.0.0',
        worker: {
          scheduler: 'active',
          lastSuccessAt: healthInfo.lastSuccessAt,
          lastFailureAt: healthInfo.lastFailureAt,
          nextRunAt: healthInfo.nextRunAt,
          status: healthInfo.status,
          totalExecutions: healthInfo.totalExecutions,
          totalErrors: healthInfo.totalErrors
        }
      };
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Rota não encontrada', path: url }));
  });

  server.listen(PORT, '0.0.0.0', () => {
    LoggerService.info('HTTP', `Servidor HTTP rodando na porta ${PORT} (0.0.0.0:${PORT})`);
  });

  return server;
}

async function bootstrapWorker() {
  LoggerService.info('WORKER', 'Iniciando processo river-monitor-worker');
  LoggerService.info('WORKER', `Sistema de Monitoramento Hidrológico - Rio Taquari (v${process.env.WORKER_VERSION || '1.0.0'})`);

  // 1. Validar conexão com Supabase antes de abrir o servidor HTTP
  LoggerService.info('WORKER', 'Validando credenciais e conexão com o Supabase...');
  const connTest = await SupabaseService.testConnection();

  if (!connTest.ok) {
    LoggerService.error('ERROR', `Erro na inicialização do worker: ${connTest.message}`);
    LoggerService.error('ERROR', 'Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Railway.');
    process.exit(1);
  }

  LoggerService.info('WORKER', connTest.message);

  // 2. Somente após validação do Supabase com sucesso, iniciar o servidor HTTP (Railway Port Binding)
  const httpServer = startHttpServer();

  // 3. Executar ciclo inicial imediato de sincronização
  LoggerService.info('WORKER', 'Executando sincronização inicial de inicialização...');
  await CronService.runOnce(false);

  // 4. Ativar Agendador Interno (node-cron)
  CronService.startScheduler();

  // 5. Manter o processo continuamente ativo (Heartbeat a cada 5 minutos para validação rápida pós-deploy; alterar para 3600000 em prod estável)
  setInterval(() => {
    LoggerService.info('WORKER', 'Serviço em execução contínua 24/7 (Heartbeat OK)');
  }, 300000);

  // 6. Tratar desligamento gracioso
  const gracefulShutdown = (signal: string) => {
    LoggerService.info('WORKER', `Sinal ${signal} recebido. Encerrando river-monitor-worker graciosamente...`);
    CronService.stopScheduler();
    httpServer.close(() => {
      LoggerService.info('HTTP', 'Servidor HTTP encerrado com sucesso.');
      process.exit(0);
    });

    setTimeout(() => process.exit(0), 3000);
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

