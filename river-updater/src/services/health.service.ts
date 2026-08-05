import { LoggerService } from '../logs/logger.service.js';

export interface HealthState {
  version: string;
  status: 'running' | 'idle' | 'executing' | 'error' | 'locked';
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastRunDurationMs: number;
  totalExecutions: number;
  totalErrors: number;
  nextRunAt: string | null;
  cronExpression: string;
  isLocked: boolean;
}

export class HealthService {
  private static PREFIX = 'HealthService';
  private static state: HealthState = {
    version: process.env.WORKER_VERSION || '1.0.0',
    status: 'idle',
    lastSuccessAt: null,
    lastFailureAt: null,
    lastRunDurationMs: 0,
    totalExecutions: 0,
    totalErrors: 0,
    nextRunAt: null,
    cronExpression: process.env.CRON_INTERVAL || '*/5 * * * *',
    isLocked: false,
  };

  public static getHealth(): HealthState {
    return { ...this.state };
  }

  public static setNextRunAt(nextDate: Date | string | null): void {
    this.state.nextRunAt = nextDate ? new Date(nextDate).toISOString() : null;
  }

  public static setLocked(locked: boolean): void {
    this.state.isLocked = locked;
    if (locked) {
      this.state.status = 'locked';
    }
  }

  public static markExecutionStart(): void {
    this.state.status = 'executing';
    this.state.totalExecutions++;
  }

  public static markExecutionSuccess(durationMs: number): void {
    this.state.status = 'idle';
    this.state.lastSuccessAt = new Date().toISOString();
    this.state.lastRunDurationMs = durationMs;
    this.state.isLocked = false;
    LoggerService.info(
      this.PREFIX,
      `Health Check [OK]: Última execução bem-sucedida às ${this.state.lastSuccessAt} (${durationMs}ms)`
    );
  }

  public static markExecutionFailure(errMessage: string, durationMs: number = 0): void {
    this.state.status = 'error';
    this.state.lastFailureAt = new Date().toISOString();
    this.state.lastRunDurationMs = durationMs;
    this.state.totalErrors++;
    this.state.isLocked = false;
    LoggerService.error(
      this.PREFIX,
      `Health Check [FALHA]: Registrada falha às ${this.state.lastFailureAt}: ${errMessage}`
    );
  }
}
