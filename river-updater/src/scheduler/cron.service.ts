import cron, { ScheduledTask } from 'node-cron';
import { LoggerService } from '../logs/logger.service.js';
import { RiverCollector } from '../collectors/river.collector.js';
import { HealthService } from '../services/health.service.js';
import { CacheService } from '../services/cache.service.js';

export class CronService {
  private static PREFIX = 'CronService';
  private static cronTask: ScheduledTask | null = null;
  private static isExecuting = false;

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
