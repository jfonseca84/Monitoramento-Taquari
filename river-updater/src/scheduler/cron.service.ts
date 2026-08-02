import cron, { ScheduledTask } from 'node-cron';
import dotenv from 'dotenv';
import { LoggerService } from '../logs/logger.service.js';
import { RiverCollector } from '../collectors/river.collector.js';
import { HealthService } from '../services/health.service.js';

dotenv.config();

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

    const triggerType = isManual ? '[MODO MANUAL - SYNC]' : '[AGENDADOR CRON]';
    LoggerService.info(this.PREFIX, `${triggerType} Iniciando ciclo de atualização de dados dos rios...`);

    try {
      const result = await RiverCollector.executeCollection();

      if (result.success) {
        HealthService.markExecutionSuccess(result.durationMs);
      } else {
        HealthService.markExecutionFailure(result.errors.join('; '), result.durationMs);
      }

      this.isExecuting = false;
      return result;
    } catch (err: any) {
      this.isExecuting = false;
      const errMsg = err.message || 'Erro desconhecido na execução do coletor';
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
   * Inicializa o agendador interno node-cron
   */
  public static startScheduler(): void {
    const cronExpr = this.getCronExpression();

    if (!cron.validate(cronExpr)) {
      LoggerService.error(this.PREFIX, `Expressão cron inválida no CRON_INTERVAL: "${cronExpr}". Usando padrão "*/5 * * * *"`);
    }

    const validExpression = cron.validate(cronExpr) ? cronExpr : '*/5 * * * *';

    LoggerService.info(this.PREFIX, `=================================================`);
    LoggerService.info(this.PREFIX, `Iniciando Agendador Interno do Framework (node-cron)`);
    LoggerService.info(this.PREFIX, `Intervalo Configurado: ${validExpression}`);
    LoggerService.info(this.PREFIX, `=================================================`);

    this.cronTask = cron.schedule(validExpression, async () => {
      await this.runOnce(false);
      this.updateNextExecutionTime();
    });

    this.updateNextExecutionTime();
  }

  public static stopScheduler(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      LoggerService.info(this.PREFIX, 'Agendador cron interrompido.');
    }
  }

  private static updateNextExecutionTime(): void {
    // Calcula estimativa da próxima execução (5 minutos por padrão)
    const nextRun = new Date(Date.now() + 5 * 60 * 1000);
    HealthService.setNextRunAt(nextRun);
    LoggerService.info(
      this.PREFIX,
      `Próxima verificação agendada prevista para: ${nextRun.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (${nextRun.toISOString()})`
    );
  }
}
