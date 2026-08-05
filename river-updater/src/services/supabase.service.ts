import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { LoggerService } from '../logs/logger.service.js';

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'river-updater/.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  dotenv.config();
}

export interface DBCity {
  id: string;
  name: string;
  slug: string;
  river?: string;
  basin?: string;
  normal_level?: number;
  attention_level?: number;
  alert_level?: number;
  flood_level?: number;
  latitude: number;
  longitude: number;
  active: boolean;
  ordem?: number;
  source_origin?: string;
  current_level?: number;
  trend?: string;
  rate_of_change?: number;
  status_level?: string;
  last_updated?: string;
  updated_at?: string;
}

export interface DBStation {
  id: string;
  city_id: string;
  name: string;
  code: string | null;
  latitude: number;
  longitude: number;
  normal_level: number;
  attention_level: number;
  alert_level: number;
  flood_level: number;
  active: boolean;
  city?: DBCity | null;
}

export class SupabaseService {
  private static PREFIX = 'SupabaseService';
  private static clientInstance: SupabaseClient | null = null;

  public static getClient(): SupabaseClient {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas no ambiente.');
    }

    this.clientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    return this.clientInstance;
  }

  public static async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const client = this.getClient();
      const { error } = await client.from('cities').select('id').limit(1);
      if (error) {
        return { ok: false, message: `Erro ao consultar tabela 'cities': ${error.message}` };
      }
      return { ok: true, message: 'Conexão com Supabase restabelecida e validada com sucesso.' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Erro de conexão com Supabase' };
    }
  }

  public static async fetchExistingCities(): Promise<DBCity[]> {
    const client = this.getClient();
    const { data, error } = await client.from('cities').select('*');
    if (error) {
      LoggerService.error(this.PREFIX, `Erro ao buscar cidades: ${error.message}`);
      throw error;
    }
    return (data as DBCity[]) || [];
  }

  public static async upsertCatalogCity(catalogCity: Omit<DBCity, 'id'>): Promise<DBCity | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('cities')
      .upsert(
        {
          name: catalogCity.name,
          slug: catalogCity.slug,
          river: catalogCity.river,
          latitude: catalogCity.latitude,
          longitude: catalogCity.longitude,
          active: true,
          ordem: catalogCity.ordem,
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) {
      LoggerService.warn(this.PREFIX, `Aviso ao upsert de cidade ${catalogCity.slug}: ${error.message}`);
      return null;
    }
    return data as DBCity;
  }

  public static async ensureStations(catalogCities: { name: string; slug: string; latitude: number; longitude: number; normal_level?: number; attention_level?: number; alert_level?: number; flood_level?: number }[], citiesBySlugMap: Map<string, DBCity>): Promise<void> {
    const client = this.getClient();
    for (const catalogCity of catalogCities) {
      const dbCity = citiesBySlugMap.get(catalogCity.slug);
      if (!dbCity || !dbCity.id) continue;

      const stationCode = `${catalogCity.slug}-st1`;
      await client.from('stations').upsert(
        {
          city_id: dbCity.id,
          name: `${catalogCity.name} - Estação Central`,
          code: stationCode,
          latitude: catalogCity.latitude,
          longitude: catalogCity.longitude,
          normal_level: catalogCity.normal_level || 3.0,
          attention_level: catalogCity.attention_level || 5.0,
          alert_level: catalogCity.alert_level || 7.0,
          flood_level: catalogCity.flood_level || 9.0,
          active: true,
        },
        { onConflict: 'code' }
      );
    }
  }

  public static async fetchActiveStations(): Promise<DBStation[]> {
    const client = this.getClient();
    const { data, error } = await client.from('stations').select('*').eq('active', true);
    if (error) {
      LoggerService.error(this.PREFIX, `Erro ao carregar estações ativas: ${error.message}`);
      return [];
    }
    return (data as DBStation[]) || [];
  }

  public static async fetchRecentStationReadings(stationId: string, limit: number = 30): Promise<any[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('river_levels')
      .select('level, recorded_at')
      .eq('station_id', stationId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  }

  public static async fetchRecentReadingsSet(stationIds: string[]): Promise<Set<string>> {
    const existingSet = new Set<string>();
    if (stationIds.length === 0) return existingSet;

    const client = this.getClient();
    const { data, error } = await client
      .from('river_levels')
      .select('station_id, recorded_at')
      .in('station_id', stationIds)
      .order('recorded_at', { ascending: false })
      .limit(2000);

    if (!error && data) {
      for (const row of data) {
        if (!row.recorded_at) continue;
        existingSet.add(`${row.station_id}_${row.recorded_at}`);
        try {
          const isoDate = new Date(row.recorded_at).toISOString();
          existingSet.add(`${row.station_id}_${isoDate}`);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return existingSet;
  }

  public static async updateCityState(cityId: string, payload: {
    current_level: number;
    trend: string;
    rate_of_change: number;
    status_level: string;
    last_updated: string;
    updated_at: string;
    river?: string;
    basin?: string;
    source_origin?: string;
  }): Promise<boolean> {
    const client = this.getClient();
    const { error } = await client
      .from('cities')
      .update(payload)
      .eq('id', cityId);

    if (error) {
      LoggerService.warn(this.PREFIX, `Erro ao atualizar cidade ${cityId}: ${error.message}`);
      return false;
    }
    return true;
  }

  public static async batchInsertRiverLevels(readings: any[]): Promise<boolean> {
    if (readings.length === 0) return true;
    const client = this.getClient();
    const { error } = await client.from('river_levels').upsert(readings, {
      onConflict: 'station_id, recorded_at',
      ignoreDuplicates: true,
    });
    if (error) {
      const { error: fallbackErr } = await client.from('river_levels').insert(readings);
      if (fallbackErr) {
        LoggerService.error(this.PREFIX, `Erro na inserção em lote de river_levels: ${fallbackErr.message}`);
        return false;
      }
    }
    return true;
  }

  public static async insertSyncLog(syncData: {
    sync_time: string;
    duration_ms: number;
    updated_count: number;
    status: 'sucesso' | 'warning' | 'erro';
    message: string;
    details: Record<string, any>;
  }): Promise<void> {
    try {
      const client = this.getClient();
      await client.from('sync_logs').insert(syncData);
    } catch (err: any) {
      LoggerService.warn(this.PREFIX, `Falha ao gravar sync_logs: ${err.message}`);
    }
  }
}
