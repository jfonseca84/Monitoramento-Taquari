import { createClient } from '@supabase/supabase-js';
import { City, Station, NewsItem, AlertItem, SystemLog, Sponsor, LevelTrend, LevelStatus, AdminUser } from '../types';
import { INITIAL_CITIES, INITIAL_STATIONS, INITIAL_NEWS, INITIAL_ALERTS, INITIAL_LOGS, INITIAL_SPONSORS, generateHistoryForCity, getCityThresholds, calculateStatusLevel } from '../data/initialData';
import { BRASILIA_TIMEZONE, getBrasiliaLastUpdatedString, getBrasiliaTimeString } from './dateUtils';

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key] || '';
    }
  } catch (e) {
    // Environment fallback
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// LOCAL PERSISTENT STORE (Fallback when Supabase keys are not set)
// ==========================================
class LocalStore {
  private cities: City[] = [...INITIAL_CITIES];
  private stations: Station[] = [...INITIAL_STATIONS];
  private news: NewsItem[] = [...INITIAL_NEWS];
  private alerts: AlertItem[] = [...INITIAL_ALERTS];
  private logs: SystemLog[] = [...INITIAL_LOGS];
  private sponsors: Sponsor[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_sponsors');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [...INITIAL_SPONSORS];
  })();

  private saveSponsors() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_sponsors', JSON.stringify(this.sponsors));
      }
    } catch (e) {}
  }

  getCities(): City[] {
    return this.cities.map((c) => ({ ...c }));
  }

  getCityById(idOrSlug: string): City | undefined {
    return this.cities.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  }

  updateCity(id: string, updates: Partial<City>): City {
    const idx = this.cities.findIndex((c) => c.id === id || c.slug === id);
    if (idx !== -1) {
      this.cities[idx] = { ...this.cities[idx], ...updates };
      return { ...this.cities[idx] };
    }
    throw new Error('City not found');
  }

  addCity(city: Omit<City, 'id'>): City {
    const id = city.slug || `city-${Date.now()}`;
    const newCity: City = { ...city, id };
    this.cities.push(newCity);
    return newCity;
  }

  deleteCity(id: string): void {
    this.cities = this.cities.filter((c) => c.id !== id && c.slug !== id);
  }

  getNews(): NewsItem[] {
    return this.news.map((n) => ({ ...n }));
  }

  addNews(newsItem: Omit<NewsItem, 'id' | 'date'>): NewsItem {
    const newItem: NewsItem = {
      ...newsItem,
      id: `news-${Date.now()}`,
      date: 'há alguns minutos',
      published: true
    };
    this.news.unshift(newItem);
    return { ...newItem };
  }

  deleteNews(id: string): void {
    this.news = this.news.filter((n) => n.id !== id);
  }

  getAlerts(): AlertItem[] {
    return this.alerts.map((a) => ({ ...a }));
  }

  addAlert(alertItem: Omit<AlertItem, 'id' | 'created_at'>): AlertItem {
    const newAlert: AlertItem = {
      ...alertItem,
      id: `alert-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.alerts.unshift(newAlert);
    return { ...newAlert };
  }

  deleteAlert(id: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== id);
  }

  getSponsors(activeOnly: boolean = true): Sponsor[] {
    const list = this.sponsors.map((s) => ({ ...s }));
    if (!activeOnly) {
      return list.sort((a, b) => a.display_order - b.display_order);
    }
    return list.filter((s) => s.active).sort((a, b) => a.display_order - b.display_order);
  }

  addSponsor(sponsor: Omit<Sponsor, 'id' | 'created_at' | 'updated_at'>): Sponsor {
    const newSponsor: Sponsor = {
      ...sponsor,
      id: `sponsor-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.sponsors.push(newSponsor);
    this.saveSponsors();
    return { ...newSponsor };
  }

  updateSponsor(id: string, updates: Partial<Sponsor>): Sponsor {
    const idx = this.sponsors.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sponsors[idx] = { ...this.sponsors[idx], ...updates, updated_at: new Date().toISOString() };
      this.saveSponsors();
      return { ...this.sponsors[idx] };
    }
    return this.addSponsor(updates as any);
  }

  deleteSponsor(id: string): void {
    this.sponsors = this.sponsors.filter((s) => s.id !== id);
    this.saveSponsors();
  }

  getLogs(): SystemLog[] {
    return this.logs.map((l) => ({ ...l }));
  }

  addLog(log: Omit<SystemLog, 'id' | 'created_at'>): SystemLog {
    const newLog: SystemLog = {
      ...log,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.logs.unshift(newLog);
    return { ...newLog };
  }
}

export const localStore = new LocalStore();

// ==========================================
// SUPABASE STORAGE HELPER
// ==========================================
export async function uploadStorageImage(
  bucketName: 'cidades' | 'patrocinadores' | 'noticias' | 'logos' | 'cameras',
  file: File
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    // Data URL fallback for local preview mode
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, { cacheControl: '3600', upsert: true });

  if (uploadError) {
    console.error(`Error uploading image to bucket ${bucketName}:`, uploadError);
    // Data URL fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
}

// ==========================================
// CITIES QUERY & MUTATIONS
// ==========================================
function normalizeCityKey(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function fetchCities(): Promise<City[]> {
  let dbCities: any[] = [];
  let latestRiverLevelsMap = new Map<string, any>();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch cities from Supabase
      const { data: cData, error: cError } = await supabase
        .from('cities')
        .select('*')
        .order('ordem', { ascending: true });

      if (!cError && cData) {
        dbCities = cData;
      }

      // 2. Fetch recent river_levels measurements for the latest readings
      const { data: rData, error: rError } = await supabase
        .from('river_levels')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(300);

      if (!rError && rData && rData.length > 0) {
        for (const row of rData) {
          if (row.city_id && !latestRiverLevelsMap.has(row.city_id)) {
            latestRiverLevelsMap.set(row.city_id, row);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase fetchCities failed, falling back to catalog merge:', e);
    }
  }

  // Index DB cities by normalized keys (slug, id, name)
  const dbCityMap = new Map<string, any>();
  for (const c of dbCities) {
    if (c.slug) dbCityMap.set(normalizeCityKey(c.slug), c);
    if (c.id) dbCityMap.set(normalizeCityKey(c.id), c);
    if (c.name) dbCityMap.set(normalizeCityKey(c.name), c);
  }

  const matchedDbCityKeys = new Set<string>();

  // Map each city in INITIAL_CITIES (preserving official names, order, images, thresholds)
  const mergedCities: City[] = INITIAL_CITIES.map((initCity, index) => {
    const slugKey = normalizeCityKey(initCity.slug);
    const idKey = normalizeCityKey(initCity.id);
    const nameKey = normalizeCityKey(initCity.name);

    const dbCity = dbCityMap.get(slugKey) || dbCityMap.get(idKey) || dbCityMap.get(nameKey);

    if (dbCity) {
      if (dbCity.slug) matchedDbCityKeys.add(normalizeCityKey(dbCity.slug));
      if (dbCity.id) matchedDbCityKeys.add(normalizeCityKey(dbCity.id));
      if (dbCity.name) matchedDbCityKeys.add(normalizeCityKey(dbCity.name));
    }

    const cityDbId = dbCity?.id || initCity.id;
    const latestMeasurement = latestRiverLevelsMap.get(cityDbId) || latestRiverLevelsMap.get(initCity.id);

    // Threshold levels: prioritize database values set by admin, fallback to initial catalog defaults
    const normal_level = Number(dbCity?.normal_level ?? initCity.normal_level) || 3.0;
    const attention_level = Number(dbCity?.attention_level ?? initCity.attention_level) || 6.0;
    const alert_level = Number(dbCity?.alert_level ?? initCity.alert_level) || 8.0;
    const flood_level = Number(dbCity?.flood_level ?? initCity.flood_level) || 10.0;

    // Real-time Telemetry
    const rawLevel = latestMeasurement?.level ?? dbCity?.current_level ?? initCity.current_level;
    const current_level = typeof rawLevel === 'number' && !isNaN(rawLevel) ? rawLevel : (Number(rawLevel) || 3.12);

    const rawRate = latestMeasurement?.rate_of_change ?? dbCity?.rate_of_change ?? initCity.rate_of_change;
    const rate_of_change = typeof rawRate === 'number' && !isNaN(rawRate) ? rawRate : (Number(rawRate) || 0);

    const trend = (latestMeasurement?.trend || dbCity?.trend || initCity.trend || 'estavel') as LevelTrend;

    const rawLastUpdated = latestMeasurement?.recorded_at || dbCity?.updated_at || dbCity?.last_updated || initCity.last_updated;
    const last_updated = rawLastUpdated && rawLastUpdated !== 'Atualizando...'
      ? getBrasiliaLastUpdatedString(rawLastUpdated)
      : getBrasiliaLastUpdatedString();

    const status_level = calculateStatusLevel(current_level, { normal: normal_level, attention: attention_level, alert: alert_level, flood: flood_level });

    return {
      ...initCity,
      id: cityDbId,
      name: initCity.name, // ALWAYS keep official catalog display name!
      slug: initCity.slug,
      river: initCity.river || dbCity?.river || 'Rio Taquari',
      basin: initCity.basin || dbCity?.basin || 'taquari',
      description: initCity.description || dbCity?.description || '',
      image: initCity.image || dbCity?.image || '',
      camera_image: initCity.camera_image || dbCity?.camera_image || '',
      camera_url: initCity.camera_url || dbCity?.camera_url || '',
      latitude: Number(initCity.latitude || dbCity?.latitude) || -29.4678,
      longitude: Number(initCity.longitude || dbCity?.longitude) || -51.9614,
      active: dbCity?.active !== false,
      ordem: index,
      station_id: dbCity?.station_id || initCity.station_id,
      current_level,
      rate_of_change,
      trend,
      status_level,
      last_updated,
      updated_at: rawLastUpdated,
      normal_level,
      attention_level,
      alert_level,
      flood_level
    };
  });

  // Append any extra DB cities that were not in INITIAL_CITIES
  let extraCount = 0;
  for (const dbCity of dbCities) {
    const slugKey = normalizeCityKey(dbCity.slug);
    const idKey = normalizeCityKey(dbCity.id);
    const nameKey = normalizeCityKey(dbCity.name);

    if (!matchedDbCityKeys.has(slugKey) && !matchedDbCityKeys.has(idKey) && !matchedDbCityKeys.has(nameKey)) {
      matchedDbCityKeys.add(slugKey);
      matchedDbCityKeys.add(idKey);
      matchedDbCityKeys.add(nameKey);

      const latestMeasurement = latestRiverLevelsMap.get(dbCity.id);
      const thresholds = getCityThresholds(dbCity);
      const normal_level = Number(dbCity.normal_level ?? thresholds.normal) || 3.0;
      const attention_level = Number(dbCity.attention_level ?? thresholds.attention) || 3.0;
      const alert_level = Number(dbCity.alert_level ?? thresholds.alert) || 6.0;
      const flood_level = Number(dbCity.flood_level ?? thresholds.flood) || 8.5;

      const rawLevel = latestMeasurement?.level ?? dbCity.current_level;
      const current_level = typeof rawLevel === 'number' && !isNaN(rawLevel) ? rawLevel : (Number(rawLevel) || 3.0);
      const rawRate = latestMeasurement?.rate_of_change ?? dbCity.rate_of_change;
      const rate_of_change = typeof rawRate === 'number' && !isNaN(rawRate) ? rawRate : (Number(rawRate) || 0);
      const trend = (latestMeasurement?.trend || dbCity.trend || 'estavel') as LevelTrend;
      const rawLastUpdated = latestMeasurement?.recorded_at || dbCity.updated_at || dbCity.last_updated;
      const status_level = calculateStatusLevel(current_level, { normal: normal_level, attention: attention_level, alert: alert_level, flood: flood_level });

      mergedCities.push({
        id: dbCity.id,
        name: dbCity.name || 'Nova Estação',
        slug: dbCity.slug || dbCity.id,
        river: dbCity.river || 'Rio Taquari',
        basin: dbCity.basin || 'taquari',
        description: dbCity.description || 'Estação de monitoramento hidrológico.',
        image: dbCity.image || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        camera_image: dbCity.camera_image || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        camera_url: dbCity.camera_url || '',
        latitude: Number(dbCity.latitude) || -29.4678,
        longitude: Number(dbCity.longitude) || -51.9614,
        active: dbCity.active !== false,
        ordem: 100 + extraCount,
        station_id: dbCity.station_id,
        current_level,
        rate_of_change,
        trend,
        status_level,
        last_updated: getBrasiliaLastUpdatedString(rawLastUpdated),
        updated_at: rawLastUpdated,
        normal_level,
        attention_level,
        alert_level,
        flood_level
      });
      extraCount++;
    }
  }

  return mergedCities;
}


export async function saveCity(cityData: Partial<City>): Promise<City> {
  if (isSupabaseConfigured && supabase) {
    if (cityData.id) {
      const { data, error } = await supabase
        .from('cities')
        .update({ ...cityData, updated_at: new Date().toISOString() })
        .eq('id', cityData.id)
        .select()
        .single();
      if (!error && data) return data as City;
    } else {
      const { data, error } = await supabase
        .from('cities')
        .insert({ ...cityData })
        .select()
        .single();
      if (!error && data) return data as City;
    }
  }

  if (cityData.id) {
    return localStore.updateCity(cityData.id, cityData);
  }
  return localStore.addCity(cityData as any);
}

export async function deleteCity(cityId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('cities').delete().eq('id', cityId);
  }
  localStore.deleteCity(cityId);
}

// ==========================================
// SPONSORS QUERY & MUTATIONS
// ==========================================
export async function fetchSponsors(all: boolean = false): Promise<Sponsor[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('sponsors').select('*').order('display_order', { ascending: true });
      if (!all) {
        query = query.eq('active', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as Sponsor[];
      }
    } catch (e) {
      console.warn('Supabase fetchSponsors failed, falling back to localStore:', e);
    }
  }
  return localStore.getSponsors(!all);
}

export async function saveSponsor(sponsorData: Partial<Sponsor>): Promise<Sponsor> {
  if (isSupabaseConfigured && supabase) {
    if (sponsorData.id && !sponsorData.id.startsWith('sponsor-')) {
      const { data, error } = await supabase
        .from('sponsors')
        .update({ ...sponsorData, updated_at: new Date().toISOString() })
        .eq('id', sponsorData.id)
        .select()
        .single();
      if (!error && data) return data as Sponsor;
    } else {
      const { id, ...toInsert } = sponsorData;
      const { data, error } = await supabase
        .from('sponsors')
        .insert(toInsert)
        .select()
        .single();
      if (!error && data) return data as Sponsor;
    }
  }

  if (sponsorData.id) {
    return localStore.updateSponsor(sponsorData.id, sponsorData);
  }
  return localStore.addSponsor(sponsorData as any);
}

export async function deleteSponsor(sponsorId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('sponsors').delete().eq('id', sponsorId);
  }
  localStore.deleteSponsor(sponsorId);
}

// ==========================================
// CAMERAS QUERY & MUTATIONS
// ==========================================
export async function fetchCameras(cityId?: string): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('cameras').select('*, cities(name, slug)').order('display_order', { ascending: true });
      if (cityId) query = query.eq('city_id', cityId);
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchCameras failed:', e);
    }
  }
  return [];
}

export async function saveCamera(cameraData: any): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    if (cameraData.id) {
      const { data, error } = await supabase
        .from('cameras')
        .update({ ...cameraData, updated_at: new Date().toISOString() })
        .eq('id', cameraData.id)
        .select()
        .single();
      if (!error && data) return data;
    } else {
      const { data, error } = await supabase
        .from('cameras')
        .insert(cameraData)
        .select()
        .single();
      if (!error && data) return data;
    }
  }
  return cameraData;
}

export async function deleteCamera(cameraId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('cameras').delete().eq('id', cameraId);
  }
}

// ==========================================
// NEWS QUERY & MUTATIONS
// ==========================================
export async function fetchNews(): Promise<NewsItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as NewsItem[];
      }
    } catch (e) {
      console.warn('Supabase fetchNews failed, using localStore:', e);
    }
  }
  return localStore.getNews();
}

export async function saveNews(newsData: Partial<NewsItem>): Promise<NewsItem> {
  if (isSupabaseConfigured && supabase) {
    if (newsData.id && !newsData.id.startsWith('news-')) {
      const { data, error } = await supabase
        .from('news')
        .update(newsData)
        .eq('id', newsData.id)
        .select()
        .single();
      if (!error && data) return data as NewsItem;
    } else {
      const { id, ...toInsert } = newsData;
      const { data, error } = await supabase
        .from('news')
        .insert(toInsert)
        .select()
        .single();
      if (!error && data) return data as NewsItem;
    }
  }
  return localStore.addNews(newsData as any);
}

export async function deleteNews(newsId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('news').delete().eq('id', newsId);
  }
  localStore.deleteNews(newsId);
}

// ==========================================
// ALERTS QUERY & MUTATIONS
// ==========================================
export async function fetchAlerts(): Promise<AlertItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as AlertItem[];
      }
    } catch (e) {
      console.warn('Supabase fetchAlerts failed, using localStore:', e);
    }
  }
  return localStore.getAlerts();
}

export async function saveAlert(alertData: Partial<AlertItem>): Promise<AlertItem> {
  if (isSupabaseConfigured && supabase) {
    if (alertData.id && !alertData.id.startsWith('alert-')) {
      const { data, error } = await supabase
        .from('alerts')
        .update(alertData)
        .eq('id', alertData.id)
        .select()
        .single();
      if (!error && data) return data as AlertItem;
    } else {
      const { id, ...toInsert } = alertData;
      const { data, error } = await supabase
        .from('alerts')
        .insert(toInsert)
        .select()
        .single();
      if (!error && data) return data as AlertItem;
    }
  }
  return localStore.addAlert(alertData as any);
}

export async function deleteAlert(alertId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('alerts').delete().eq('id', alertId);
  }
  localStore.deleteAlert(alertId);
}

// ==========================================
// SYNC LOGS & AUDIT LOGS
// ==========================================
export async function fetchSyncLogs(): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchSyncLogs error:', e);
    }
  }
  return [];
}

export async function fetchAuditLogs(): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase fetchAuditLogs error:', e);
    }
  }
  return localStore.getLogs();
}

export async function addAuditLog(action: string, entity: string, message: string, details?: any): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser())?.data?.user;
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email || 'admin@taquari.gov.br',
        action,
        entity,
        message,
        details
      });
    } catch (e) {
      // Ignore
    }
  }
  localStore.addLog({
    level: 'info',
    service: entity,
    message: `[${action}] ${message}`,
    details
  });
}

// ==========================================
// SETTINGS
// ==========================================
export async function fetchSettings(): Promise<Record<string, any>> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (!error && data) {
        const result: Record<string, any> = {};
        data.forEach((s) => {
          result[s.key] = s.value;
        });
        return result;
      }
    } catch (e) {
      console.warn('Supabase fetchSettings error:', e);
    }
  }
  return {
    site_name: 'Rio Taquari - Monitoramento Hidrológico',
    update_frequency_minutes: 15,
    official_source_url: 'https://niveldosrios.guerreirosdohumaita.com.br/',
    emergency_contacts: { defesa_civil: '199', bombeiros: '193', brigada: '190' }
  };
}

export async function saveSetting(key: string, value: any, description?: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('settings').upsert({ key, value, description, updated_at: new Date().toISOString() });
  }
}

// ==========================================
// CITY HISTORY & TELEMETRY QUERY
// ==========================================
export async function fetchRiverLevels(cityId: string, limit: number = 50) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: city } = await supabase.from('cities').select('id, name, slug').or(`id.eq.${cityId},slug.eq.${cityId}`).maybeSingle();
      const targetCityId = city?.id || cityId;

      const { data, error } = await supabase
        .from('river_levels')
        .select('*, station:stations(name, code)')
        .eq('city_id', targetCityId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchRiverLevels error:', e);
    }
  }
  return [];
}

export async function fetchCityHistory(cityId: string, timeframe: string) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: city } = await supabase.from('cities').select('*').or(`id.eq.${cityId},slug.eq.${cityId}`).limit(1).maybeSingle();
      if (city) {
        const { data: levels } = await supabase
          .from('river_levels')
          .select('*')
          .eq('city_id', city.id)
          .order('recorded_at', { ascending: true })
          .limit(48);

        if (levels && levels.length > 0) {
          const thresholds = getCityThresholds(city);
          return levels.map((l) => {
            const dateObj = new Date(l.recorded_at);
            const timeStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString('pt-BR', { timeZone: BRASILIA_TIMEZONE, hour: '2-digit', minute: '2-digit' })
              : String(l.recorded_at);

            return {
              time: timeStr,
              timestamp: l.recorded_at,
              level: Number(l.level),
              normal: city.normal_level ?? thresholds.normal,
              attention: city.attention_level ?? thresholds.attention,
              alert: city.alert_level ?? thresholds.alert,
              flood: city.flood_level ?? thresholds.flood
            };
          });
        }
      }
    } catch (e) {
      console.warn('Supabase fetchCityHistory failed, generating fallback:', e);
    }
  }

  const cities = await fetchCities();
  const city = cities.find((c) => c.id === cityId || c.slug === cityId);
  const currentVal = city?.current_level || 3.12;
  return generateHistoryForCity(cityId, currentVal);
}

// ==========================================
// SAVE CITY THRESHOLDS (COTAS HIDROLÓGICAS)
// ==========================================
export async function saveCityThresholds(
  cityId: string,
  thresholds: { normal_level: number; attention_level: number; alert_level: number; flood_level: number }
): Promise<void> {
  const { normal_level, attention_level, alert_level, flood_level } = thresholds;

  if (normal_level >= attention_level || attention_level >= alert_level || alert_level >= flood_level) {
    throw new Error('Validação de cotas falhou: deve seguir normal < atenção < alerta < inundação.');
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Update city thresholds
      const { error: cityError } = await supabase
        .from('cities')
        .update({
          normal_level,
          attention_level,
          alert_level,
          flood_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', cityId);

      if (cityError) console.warn('Supabase city threshold update error:', cityError);

      // 2. Update linked stations
      const { error: stationError } = await supabase
        .from('stations')
        .update({
          normal_level,
          attention_level,
          alert_level,
          flood_level,
          updated_at: new Date().toISOString()
        })
        .eq('city_id', cityId);

      if (stationError) console.warn('Supabase station threshold update error:', stationError);
    } catch (e) {
      console.error('Error saving city thresholds to Supabase:', e);
    }
  }

  // Update local store fallback
  try {
    localStore.updateCity(cityId, {
      normal_level,
      attention_level,
      alert_level,
      flood_level
    });
  } catch (e) {}
}

// ==========================================
// ADMIN USERS MANAGEMENT (admin_users)
// ==========================================
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!error && data) {
        return data as AdminUser[];
      }
    } catch (e) {
      console.warn('Supabase fetchAdminUsers error:', e);
    }
  }

  // Fallback default admin users
  return [
    {
      id: '1',
      user_id: '00000000-0000-0000-0000-000000000001',
      nome: 'Administrador Geral',
      email: 'admin@taquari.gov.br',
      nivel_acesso: 'administrador',
      criado_em: new Date().toISOString()
    }
  ];
}

export async function saveAdminUser(userData: {
  id?: string;
  user_id?: string;
  nome: string;
  email: string;
  nivel_acesso: 'administrador' | 'editor';
}): Promise<AdminUser | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        ...(userData.id ? { id: userData.id } : {}),
        user_id: userData.user_id || userData.id || '00000000-0000-0000-0000-000000000000',
        nome: userData.nome,
        email: userData.email,
        nivel_acesso: userData.nivel_acesso,
        criado_em: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('admin_users')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        return data as AdminUser;
      } else if (error) {
        console.error('Supabase saveAdminUser error:', error);
      }
    } catch (e) {
      console.error('Exception in saveAdminUser:', e);
    }
  }

  return {
    id: userData.id || `admin-${Date.now()}`,
    user_id: userData.user_id || `user-${Date.now()}`,
    nome: userData.nome,
    email: userData.email,
    nivel_acesso: userData.nivel_acesso,
    criado_em: new Date().toISOString()
  };
}

export async function deleteAdminUser(adminId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('admin_users').delete().eq('id', adminId);
    } catch (e) {
      console.error('Error deleting admin user from Supabase:', e);
    }
  }
}

