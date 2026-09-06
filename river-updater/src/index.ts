import http from 'http';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { LoggerService } from './logs/logger.service.js';
import { SupabaseService } from './services/supabase.service.js';
import { CronService } from './scheduler/cron.service.js';
import { HealthService } from './services/health.service.js';
import { CacheService } from './services/cache.service.js';
import { NewsCollector } from './collectors/news.collector.js';

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

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function startHttpServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const publicDir = path.resolve(process.cwd(), 'public');

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Headers CORS padrão
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Endpoint exclusivo de saúde do Worker
    if (pathname === '/health') {
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
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(response, null, 2));
      return;
    }

    // API ENDPOINTS COM CACHE EM MEMÓRIA DE ALTA PERFORMANCE
    if (pathname === '/api/chat' || pathname === '/api/gemini/chat') {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { askHydrologicalAssistant } = await import('../../src/server/geminiService.js');
            const { question, context } = JSON.parse(body || '{}');
            const answer = await askHydrologicalAssistant(question, context);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ text: answer }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err?.message || 'Erro ao processar requisição do assistente' }));
          }
        });
        return;
      }
    }

    if (pathname === '/api/telemetry' || pathname === '/api/bootstrap') {
      CacheService.getTelemetryData()
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
          });
          res.end(JSON.stringify(data));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro ao buscar telemetria', details: err?.message || err }));
        });
      return;
    }

    if (pathname === '/api/cities') {
      CacheService.getTelemetryData()
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300'
          });
          res.end(JSON.stringify(data.cities));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || err }));
        });
      return;
    }

    if (pathname === '/api/news') {
      CacheService.getTelemetryData()
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=120'
          });
          res.end(JSON.stringify(data.news));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || err }));
        });
      return;
    }

    if (pathname === '/api/news/collect') {
      const sourceId = parsedUrl.searchParams.get('sourceId') || undefined;
      NewsCollector.checkAndCollectNews(sourceId)
        .then((result) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache'
          });
          res.end(JSON.stringify({ success: true, ...result }));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || err }));
        });
      return;
    }

    if (pathname === '/api/alerts') {
      CacheService.getTelemetryData()
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60'
          });
          res.end(JSON.stringify(data.alerts));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || err }));
        });
      return;
    }

    if (pathname === '/api/history') {
      const cityId = parsedUrl.searchParams.get('cityId') || '';
      const timeframe = parsedUrl.searchParams.get('timeframe') || '24h';
      if (!cityId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'cityId é obrigatório' }));
        return;
      }
      CacheService.getCityHistory(cityId, timeframe)
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=180'
          });
          res.end(JSON.stringify(data));
        })
        .catch((err) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || err }));
        });
      return;
    }

    // Servir arquivos estáticos do Frontend (dist e public) com Políticas de Cache
    const tryServeStaticFile = (targetPath: string, onNotFound: () => void) => {
      fs.stat(targetPath, (err, stats) => {
        if (!err && stats.isFile()) {
          const ext = path.extname(targetPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          
          const headers: Record<string, string> = {
            'Content-Type': contentType,
            'Last-Modified': stats.mtime.toUTCString(),
            'ETag': `"${stats.size}-${stats.mtime.getTime()}"`,
          };

          if (pathname === '/index.html' || ext === '.html' || pathname === '/sitemap.xml' || pathname === '/robots.txt') {
            headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
          } else if (pathname.startsWith('/assets/') || ['.js', '.css', '.woff2', '.woff', '.ttf', '.wasm'].includes(ext)) {
            headers['Cache-Control'] = 'public, max-age=31536000, immutable';
          } else {
            headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=3600';
          }

          const ifNoneMatch = req.headers['if-none-match'];
          const ifModifiedSince = req.headers['if-modified-since'];

          if (ifNoneMatch === headers['ETag'] || (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime)) {
            res.writeHead(304, headers);
            res.end();
            return;
          }

          res.writeHead(200, headers);
          fs.createReadStream(targetPath).pipe(res);
          return;
        }
        onNotFound();
      });
    };

    let filePath = path.join(distDir, pathname);

    // Segurança contra Directory Traversal
    if (!filePath.startsWith(distDir)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Acesso negado' }));
      return;
    }

    // 1. Tenta servir de distDir
    tryServeStaticFile(filePath, () => {
      // 2. Se não estiver em distDir, tenta servir de publicDir
      const publicFilePath = path.join(publicDir, pathname);
      if (publicFilePath.startsWith(publicDir)) {
        tryServeStaticFile(publicFilePath, () => {
          handleFallback();
        });
      } else {
        handleFallback();
      }
    });

    function handleFallback() {
      const ext = path.extname(pathname).toLowerCase();
      // Arquivos estáticos explícitos ou de SEO não devem cair na página HTML do SPA
      if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || (ext && ext !== '.html')) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      // Se for rota de navegação do SPA (ex: /, /centro-de-analises, /meteorologia), serve index.html
      const indexPath = path.join(distDir, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><title>Rio Taquari - Worker Online</title></head>
            <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
              <h1>🌊 Monitoramento Hidrológico do Rio Taquari</h1>
              <p>O backend worker está <strong>ONLINE</strong> e rodando perfeitamente na Railway.</p>
              <p>Acesse o health-check em <a href="/health" style="color: #38bdf8;">/health</a>.</p>
              <p><em>Aguardando build do frontend em <code>/dist</code>...</em></p>
            </body>
            </html>
          `);
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        });
        res.end(content);
      });
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    LoggerService.info('HTTP', `Servidor HTTP rodando na porta ${PORT} (0.0.0.0:${PORT})`);
  });

  return server;
}

async function bootstrapWorker() {
  LoggerService.info('WORKER', 'Iniciando processo river-monitor-worker');
  LoggerService.info('WORKER', `Sistema de Monitoramento Hidrológico - Rio Taquari (v${process.env.WORKER_VERSION || '1.0.0'})`);

  // 1. Iniciar o servidor HTTP imediatamente para garantir Port Binding e Healthcheck no Railway
  const httpServer = startHttpServer();

  // 2. Validar conexão com Supabase
  LoggerService.info('WORKER', 'Validando credenciais e conexão com o Supabase...');
  const connTest = await SupabaseService.testConnection();

  if (!connTest.ok) {
    LoggerService.error('ERROR', `Alerta na inicialização do worker: ${connTest.message}`);
    LoggerService.error('ERROR', 'Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Railway.');
  } else {
    LoggerService.info('WORKER', connTest.message);
  }

  // 3. Executar ciclo inicial imediato de sincronização (se Supabase OK)
  if (connTest.ok) {
    LoggerService.info('WORKER', 'Executando sincronização inicial de inicialização...');
    try {
      await CronService.runOnce(false);
    } catch (syncErr: any) {
      LoggerService.error('WORKER', `Falha na sincronização inicial: ${syncErr?.message || syncErr}`);
    }
  }

  // 4. Ativar Agendador Interno (node-cron)
  CronService.startScheduler();
  CronService.startWeatherScheduler();

  // Coleta meteorológica inicial (não bloqueia o boot em caso de falha)
  if (connTest.ok) {
    CronService.runWeatherOnce().catch((err) => {
      LoggerService.warn('WORKER', `Falha na coleta meteorológica inicial: ${err?.message || err}`);
    });
  }

  // 5. Manter o processo continuamente ativo (Heartbeat a cada 5 minutos)
  setInterval(() => {
    LoggerService.info('WORKER', 'Serviço em execução contínua 24/7 (Heartbeat OK)');
  }, 300000);

  // 6. Tratar desligamento gracioso
  const gracefulShutdown = (signal: string) => {
    LoggerService.info('WORKER', `Sinal ${signal} recebido. Encerrando river-monitor-worker graciosamente...`);
    CronService.stopScheduler();
    CronService.stopWeatherScheduler();
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

