import { LoggerService } from '../logs/logger.service.js';

export interface RawStationPayload {
  id?: string;
  code?: string;
  slug?: string;
  city?: string;
  name?: string;
  river?: string;
  level: number;
  rate?: number;
  trend?: 'subindo' | 'descendo' | 'estavel';
  status?: 'normal' | 'atencao' | 'alerta' | 'inundacao';
  flood?: number;
  alert?: number;
  attention?: number;
  normal?: number;
  ts?: string;
  lat?: number;
  lng?: number;
  url?: string;
  source_origin?: string;
  source_slug?: string;
  source_url?: string;
  api_endpoint?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedPayload?: RawStationPayload;
}

export class ValidationService {
  private static PREFIX = 'ValidationService';

  /**
   * Valida se uma medição recebida da fonte externa atende a todos os critérios técnicos
   */
  public static validateMeasurement(payload: any): ValidationResult {
    const errors: string[] = [];

    if (!payload || typeof payload !== 'object') {
      return { isValid: false, errors: ['Payload é nulo ou inválido'] };
    }

    // 1. Validar Nome/Município ou Slug
    const cityName = payload.city || payload.name || payload.slug || '';
    if (!cityName || typeof cityName !== 'string' || cityName.trim().length === 0) {
      errors.push('Município/Estação inválido ou ausente no payload');
    }

    // 2. Validar Nível Hidrológico
    const rawLevel = payload.level;
    const numLevel = Number(rawLevel);

    if (rawLevel === undefined || rawLevel === null || isNaN(numLevel)) {
      errors.push(`Nível hidrológico inválido (${rawLevel})`);
    } else if (numLevel < -5.0 || numLevel > 40.0) {
      errors.push(`Nível fora do limite plausível (-5m a 40m): ${numLevel}m`);
    }

    // 3. Validar Timestamp (Data e Horário)
    let validTimestampIso = new Date().toISOString();
    if (payload.ts) {
      const parsedDate = new Date(payload.ts);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Timestamp com formato de data inválido: ${payload.ts}`);
      } else {
        validTimestampIso = parsedDate.toISOString();
      }
    }

    // 4. Validar Tendência
    let trend: 'subindo' | 'descendo' | 'estavel' = 'estavel';
    if (['subindo', 'descendo', 'estavel'].includes(payload.trend)) {
      trend = payload.trend;
    } else if (typeof payload.rate === 'number') {
      if (payload.rate > 0.005) trend = 'subindo';
      else if (payload.rate < -0.005) trend = 'descendo';
    }

    if (errors.length > 0) {
      LoggerService.debug(this.PREFIX, `Payload reprovado na validação para ${cityName}: ${errors.join(', ')}`);
      return { isValid: false, errors };
    }

    const sanitizedPayload: RawStationPayload = {
      ...payload,
      city: cityName.trim(),
      level: Number(numLevel.toFixed(2)),
      rate: typeof payload.rate === 'number' ? Number(payload.rate.toFixed(4)) : 0.0,
      trend,
      ts: validTimestampIso,
      source_origin: payload.source_origin || 'fonte_oficial'
    };

    return { isValid: true, errors: [], sanitizedPayload };
  }

  /**
   * Verifica duplicidade de medições antes da inserção
   */
  public static isDuplicateReading(stationId: string, recordedAt: string, existingReadingsSet: Set<string>): boolean {
    const key = `${stationId}_${recordedAt}`;
    return existingReadingsSet.has(key);
  }
}
