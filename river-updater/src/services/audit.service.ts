import { SupabaseService } from './supabase.service.js';
import { LoggerService } from '../logs/logger.service.js';

export interface AuditRecord {
  durationMs: number;
  updatedCount: number;
  skippedCount: number;
  citiesUpdatedCount: number;
  sourcesSuccessCount: number;
  sourcesFailedCount: number;
  measurementsReceived: number;
  errorsCount: number;
  errors: string[];
  status: 'sucesso' | 'warning' | 'erro';
  executor?: string;
}

export class AuditService {
  private static PREFIX = 'AuditService';

  public static async recordExecution(audit: AuditRecord): Promise<void> {
    const executor = audit.executor || 'river-monitor-worker';
    const message = `Coleta [${executor}] executada com status [${audit.status.toUpperCase()}]. ${audit.updatedCount} medições inseridas em ${audit.durationMs}ms.`;

    const details = {
      executor,
      duration_ms: audit.durationMs,
      sources_success: audit.sourcesSuccessCount,
      sources_failed: audit.sourcesFailedCount,
      measurements_received: audit.measurementsReceived,
      measurements_inserted: audit.updatedCount,
      measurements_skipped: audit.skippedCount,
      cities_updated: audit.citiesUpdatedCount,
      errors_count: audit.errorsCount,
      errors: audit.errors,
      timestamp: new Date().toISOString()
    };

    LoggerService.info(this.PREFIX, message);

    await SupabaseService.insertSyncLog({
      sync_time: new Date().toISOString(),
      duration_ms: audit.durationMs,
      updated_count: audit.updatedCount,
      status: audit.status,
      message,
      details
    });
  }
}
