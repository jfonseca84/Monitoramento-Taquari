import { localStore, supabase, isSupabaseConfigured } from '../lib/supabase';

export const OFFICIAL_SOURCE_URL = 'https://niveldosrios.guerreirosdohumaita.com.br/';

export interface SyncResult {
  success: boolean;
  timestamp: string;
  source: string;
  processedCount: number;
  updatedCount: number;
  message: string;
  errors?: string[];
  readings?: any[];
}

export class RiverCollectorService {
  private sourceUrl: string;

  constructor(sourceUrl: string = OFFICIAL_SOURCE_URL) {
    this.sourceUrl = sourceUrl.endsWith('/') ? sourceUrl : `${sourceUrl}/`;
  }

  /**
   * Client-side helper to query latest river stations directly from Supabase
   */
  async fetchLiveStations(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('cities').select('*').order('ordem', { ascending: true });
      if (data) return data;
    }
    return localStore.getCities();
  }
}

export const riverCollector = new RiverCollectorService();
