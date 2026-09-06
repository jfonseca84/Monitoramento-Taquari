import cron, { ScheduledTask } from 'node-cron';
import { LoggerService } from '../logs/logger.service.js';
import { RiverCollector } from '../collectors/river.collector.js';
import { WeatherCollector } from '../collectors/weather.collector.js';
import { HealthService } from '../services/health.service.js';
import { CacheService } from '../services/cache.service.js';
import { NewsCollector } from '../collectors/news.collector.js';
import { SupabaseService } from '../services/supabase.service.js';

const WEATHER_CRON_EXPRESSION = '*/30 * * * *';

export class CronService {
  private static PREFIX = 'CronService';
  private static cronTask: ScheduledTask | null = null;
  private static weatherCronTask: ScheduledTask | null = null;
  private static isExecuting = false;
  private static isWeatherExecuting = false;

  public static getCronExpression(): string {
    return process.env.CRON_INTERVAL || '*/5 * * * *';
  }

  public static isTaskRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * Executa um ciclo completo de coleta com proteção de concorrência (mutex)
   */
  public static async runOnce(isManual: boolean = false): Promise<{
    success: boolean;
    durationMs: number;
    updatedCount: number;
    skippedCount: number;
    citiesUpdatedCount: number;
    errorsCount: number;
    errors: string[];
    status: 'sucesso' | 'warning' | 'erro' | 'locked';
  }> {
    if (this.isExecuting) {
      const msg = 'BLOQUEIO DE CONCORRÊNCIA: Uma coleta anterior ainda está em andamento. Nova execução ignorada.';
      LoggerService.warn(this.PREFIX, msg);
      HealthService.setLocked(true);
      return {
        success: false,
        durationMs: 0,
        updatedCount: 0,
        skippedCount: 0,
        citiesUpdatedCount: 0,
        errorsCount: 1,
        errors: [msg],
        status: 'locked'
      };
    }

    this.isExecuting = true;
    HealthService.markExecutionStart();

    const triggerType = isManual ? '[MODO MANUAL]' : '[SCHEDULER]';
    LoggerService.info('SYNC', 'Buscando dados hidrológicos');

    try {
      const result = await RiverCollector.executeCollection();

      if (result.success) {
        LoggerService.info('SYNC', 'Dados salvos no Supabase com sucesso');
        HealthService.markExecutionSuccess(result.durationMs);

        // Executar verificação programada de fontes de notícias ativas
        try {
          await NewsCollector.checkAndCollectNews();
        } catch (newsErr: any) {
          LoggerService.warn('SYNC', `Aviso na coleta de notícias: ${newsErr?.message || newsErr}`);
        }

        // Renovação automática do cache em memória após atualização do worker
        try {
          await CacheService.refreshTelemetryCache();
        } catch (cacheErr: any) {
          LoggerService.warn('SYNC', `Erro ao renovar cache pós-coleta: ${cacheErr?.message || cacheErr}`);
        }
      } else {
        LoggerService.error('ERROR', `Falha na sincronização: ${result.errors.join('; ')}`);
        HealthService.markExecutionFailure(result.errors.join('; '), result.durationMs);
      }

      this.isExecuting = false;
      return result;
    } catch (err: any) {
      this.isExecuting = false;
      const errMsg = err.message || 'Erro desconhecido na execução do coletor';
      LoggerService.error('ERROR', `Falha na sincronização: ${errMsg}`);
      HealthService.markExecutionFailure(errMsg, 0);
      return {
        success: false,
        durationMs: 0,
        updatedCount: 0,
        skippedCount: 0,
        citiesUpdatedCount: 0,
        errorsCount: 1,
        errors: [errMsg],
        status: 'erro'
      };
    }
  }

  /**
   * Executa um ciclo de coleta de dados meteorológicos (chuva, umidade do solo, previsão).
   * Roda em intervalo próprio, mais espaçado que a coleta de nível dos rios.
   */
  public static async runWeatherOnce(): Promise<void> {
    if (this.isWeatherExecuting) {
      LoggerService.warn(this.PREFIX, 'Coleta de clima anterior ainda em andamento. Ciclo ignorado.');
      return;
    }

    this.isWeatherExecuting = true;
    LoggerService.info('WEATHER', 'Buscando dados meteorológicos (chuva, umidade do solo, previsão)');

    try {
      const cities = await SupabaseService.fetchExistingCities();
      const result = await WeatherCollector.executeCollection(cities);

      if (result.errorsCount > 0) {
        LoggerService.warn('WEATHER', `Coleta concluída com avisos: ${result.errors.join('; ')}`);
      }
      LoggerService.info(
        'WEATHER',
        `Clima atualizado para ${result.citiesProcessed}/${cities.length} cidades, ${result.forecastsInserted} pontos de previsão (${result.durationMs}ms)`
      );
    } catch (err: any) {
      LoggerService.error('WEATHER', `Falha na coleta meteorológica: ${err.message || err}`);
    } finally {
      this.isWeatherExecuting = false;
    }
  }

  public static startWeatherScheduler(): void {
    LoggerService.info('WEATHER', `Agendador de clima iniciado com intervalo: ${WEATHER_CRON_EXPRESSION}`);
    this.weatherCronTask = cron.schedule(WEATHER_CRON_EXPRESSION, async () => {
      await this.runWeatherOnce();
    });
  }

  public static stopWeatherScheduler(): void {
    if (this.weatherCronTask) {
      this.weatherCronTask.stop();
      LoggerService.info('WEATHER', 'Agendador de clima interrompido.');
    }
  }

  /**
   * Inicializa o agendador interno node-cron (padrão: a cada 5 minutos)
   */
  public static startScheduler(): void {
    const cronExpr = this.getCronExpression();

    if (!cron.validate(cronExpr)) {
      LoggerService.error('ERROR', `Expressão cron inválida no CRON_INTERVAL: "${cronExpr}". Usando padrão "*/5 * * * *"`);
    }

    const validExpression = cron.validate(cronExpr) ? cronExpr : '*/5 * * * *';

    LoggerService.info('SCHEDULER', `Agendador iniciado com intervalo: ${validExpression}`);

    this.cronTask = cron.schedule(validExpression, async () => {
      await this.runOnce(false);
      this.updateNextExecutionTime();
    });

    this.updateNextExecutionTime();
  }

  public static stopScheduler(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      LoggerService.info('SCHEDULER', 'Agendador cron interrompido.');
    }
  }

  private static updateNextExecutionTime(): void {
    const nextRun = new Date(Date.now() + 5 * 60 * 1000);
    HealthService.setNextRunAt(nextRun);
    LoggerService.info(
      'SCHEDULER',
      'Próxima sincronização em 5 minutos'
    );
  }
}
