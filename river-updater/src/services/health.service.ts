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

export interface SourceHealth {
  lastAttemptAt: string;
  lastOkAt: string | null;
  lastStationCount: number;
  lastDurationMs: number;
  consecutiveFailures: number;
  lastError: string | null;
}

export interface StationFreshness {
  slug: string;
  source: string;
  observedAt: string;
  ageMinutes: number;
}

// Acima disso a estação é considerada sem leitura recente (a ANA publica a cada 15 min)
export const STATION_STALE_MINUTES = 60;

export class HealthService {
  private static PREFIX = 'HealthService';
  private static sources: Record<string, SourceHealth> = {};
  private static stations: StationFreshness[] = [];
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

  public static recordSource(name: string, ok: boolean, stationCount: number, durationMs: number, error?: string): void {
    const prev = this.sources[name];
    const now = new Date().toISOString();
    this.sources[name] = {
      lastAttemptAt: now,
      lastOkAt: ok ? now : prev?.lastOkAt ?? null,
      lastStationCount: ok ? stationCount : prev?.lastStationCount ?? 0,
      lastDurationMs: durationMs,
      consecutiveFailures: ok ? 0 : (prev?.consecutiveFailures ?? 0) + 1,
      lastError: ok ? null : error ?? null,
    };
  }

  /** Guarda a idade da leitura mais recente de cada estação (a melhor entre as fontes que informam a hora). */
  public static setStationFreshness(payloads: Array<{ slug?: string; ts?: string; source_origin?: string }>): void {
    const best = new Map<string, StationFreshness>();
    const now = Date.now();
    for (const p of payloads) {
      const ms = p.ts ? new Date(p.ts).getTime() : NaN;
      if (!p.slug || isNaN(ms)) continue;
      const cur = best.get(p.slug);
      if (!cur || ms > new Date(cur.observedAt).getTime()) {
        best.set(p.slug, {
          slug: p.slug,
          source: p.source_origin || '?',
          observedAt: new Date(ms).toISOString(),
          ageMinutes: Math.max(0, Math.round((now - ms) / 60000)),
        });
      }
    }
    this.stations = Array.from(best.values()).sort((a, b) => b.ageMinutes - a.ageMinutes);
    const stale = this.stations.filter((s) => s.ageMinutes > STATION_STALE_MINUTES);
    if (stale.length > 0) {
      LoggerService.warn(
        'STATION',
        `${stale.length} estação(ões) sem leitura nova há mais de ${STATION_STALE_MINUTES} min: ` +
          stale.map((s) => `${s.slug} (${s.ageMinutes} min, ${s.source})`).join('; ')
      );
    }
  }

  public static getSources(): Record<string, SourceHealth> {
    return { ...this.sources };
  }

  public static getStations(): StationFreshness[] {
    return [...this.stations];
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
