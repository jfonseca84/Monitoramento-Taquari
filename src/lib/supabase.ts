import { createClient } from '@supabase/supabase-js';
import { City, Station, NewsItem, AlertItem, SystemLog, Sponsor, LevelTrend, LevelStatus, AdminUser, AlertSubscriber, AlertNotification, AlertStats, AlertHistoryItem, AlertDispatchItem, CityCamera } from '../types';
import { INITIAL_CITIES, INITIAL_STATIONS, INITIAL_NEWS, INITIAL_ALERTS, INITIAL_LOGS, INITIAL_SPONSORS, INITIAL_CITY_CAMERAS, INITIAL_SUBSCRIBERS, generateHistoryForCity, calculateStatusLevel } from '../data/initialData';
import { getCityThresholds } from '../data/cityThresholds';
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
  private subscribers: AlertSubscriber[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_subscribers');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [...INITIAL_SUBSCRIBERS];
  })();
  private notifications: AlertNotification[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  })();
  private history: AlertHistoryItem[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_alert_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  })();
  private dispatches: AlertDispatchItem[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_alert_dispatches');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {}
    return [];
  })();

  private saveSubscribers() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_subscribers', JSON.stringify(this.subscribers));
      }
    } catch (e) {}
  }

  private saveNotifications() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_notifications', JSON.stringify(this.notifications));
      }
    } catch (e) {}
  }

  private saveHistory() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_alert_history', JSON.stringify(this.history));
      }
    } catch (e) {}
  }

  private saveDispatches() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_alert_dispatches', JSON.stringify(this.dispatches));
      }
    } catch (e) {}
  }

  getSubscribers(citySlug?: string, neighborhood?: string): AlertSubscriber[] {
    let list = [...this.subscribers];
    if (citySlug && citySlug !== 'all' && citySlug !== 'todas') {
      list = list.filter(s => s.city_slug === citySlug || s.cidade === citySlug);
    }
    if (neighborhood) list = list.filter(s => s.neighborhood.toLowerCase().includes(neighborhood.toLowerCase()));
    return list;
  }

  addSubscriber(data: Omit<AlertSubscriber, 'id' | 'created_at'>): AlertSubscriber {
    const newSub: AlertSubscriber = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString()
    };
    this.subscribers.unshift(newSub);
    this.saveSubscribers();
    return newSub;
  }

  updateSubscriber(id: string, updates: Partial<AlertSubscriber>): AlertSubscriber | null {
    const idx = this.subscribers.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.subscribers[idx] = { ...this.subscribers[idx], ...updates };
      this.saveSubscribers();
      return this.subscribers[idx];
    }
    return null;
  }

  deleteSubscriber(id: string): void {
    this.subscribers = this.subscribers.filter(s => s.id !== id);
    this.saveSubscribers();
  }

  getNotifications(citySlug?: string): AlertNotification[] {
    let list = [...this.notifications];
    if (citySlug) list = list.filter(n => n.city_slug === citySlug);
    return list;
  }

  addNotification(data: Omit<AlertNotification, 'id' | 'sent_at'>): AlertNotification {
    const newNotif: AlertNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sent_at: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    this.saveNotifications();
    return newNotif;
  }

  confirmNotification(notificationId: string): boolean {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.confirmed_at = new Date().toISOString();
      this.saveNotifications();
      return true;
    }
    return false;
  }

  getAlertHistory(cidade?: string): AlertHistoryItem[] {
    let list = [...this.history];
    if (cidade && cidade !== 'todas') {
      list = list.filter(h => h.cidade === cidade);
    }
    return list;
  }

  addAlertHistory(data: Omit<AlertHistoryItem, 'id' | 'criado_em'>): AlertHistoryItem {
    const newItem: AlertHistoryItem = {
      ...data,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      criado_em: new Date().toISOString()
    };
    this.history.unshift(newItem);
    this.saveHistory();
    return newItem;
  }

  approveAlertHistory(id: string, adminUser?: string): boolean {
    const item = this.history.find(h => h.id === id);
    if (item) {
      item.enviado = true;
      item.aprovado_por = adminUser || 'Administrador';
      item.aprovado_em = new Date().toISOString();
      this.saveHistory();
      return true;
    }
    return false;
  }

  getDispatches(alertHistoryId?: string): AlertDispatchItem[] {
    if (alertHistoryId) {
      return this.dispatches.filter(d => d.alert_history_id === alertHistoryId);
    }
    return [...this.dispatches];
  }

  addDispatches(items: Omit<AlertDispatchItem, 'id' | 'criado_em'>[]): AlertDispatchItem[] {
    const created: AlertDispatchItem[] = [];
    for (const item of items) {
      // Avoid duplicate dispatch for same alert_history_id, subscriber_id, canal
      const exists = this.dispatches.some(
        d => d.alert_history_id === item.alert_history_id &&
             d.subscriber_id === item.subscriber_id &&
             d.canal === item.canal
      );
      if (!exists) {
        const newItem: AlertDispatchItem = {
          ...item,
          id: `dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          criado_em: new Date().toISOString()
        };
        this.dispatches.push(newItem);
        created.push(newItem);
      }
    }
    if (created.length > 0) {
      this.saveDispatches();
    }
    return created;
  }

  processDispatches(alertHistoryId?: string): { processedCount: number; dispatches: AlertDispatchItem[] } {
    let count = 0;
    const now = new Date().toISOString();
    this.dispatches.forEach(d => {
      if (d.status === 'pendente' && (!alertHistoryId || d.alert_history_id === alertHistoryId)) {
        d.status = 'enviado';
        d.enviado_em = now;
        count++;
      }
    });
    if (count > 0) {
      this.saveDispatches();
    }
    const result = alertHistoryId ? this.dispatches.filter(d => d.alert_history_id === alertHistoryId) : [...this.dispatches];
    return { processedCount: count, dispatches: result };
  }
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

  private cameras: CityCamera[] = (() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taquari_city_cameras');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [...INITIAL_CITY_CAMERAS];
  })();

  private saveCameras() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('taquari_city_cameras', JSON.stringify(this.cameras));
      }
    } catch (e) {}
  }

  getCamerasByCity(citySlug: string): CityCamera[] {
    if (!citySlug) return [];
    return this.cameras
      .filter((c) => c.city_slug === citySlug && (c.ativo ?? true))
      .sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
  }

  getAllCamerasAdmin(citySlug?: string): CityCamera[] {
    if (citySlug && citySlug !== 'all') {
      return this.cameras.filter((c) => c.city_slug === citySlug);
    }
    return [...this.cameras];
  }

  addCamera(cameraData: Omit<CityCamera, 'id'>): CityCamera {
    const newCamera: CityCamera = {
      ...cameraData,
      id: `cam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };
    this.cameras.push(newCamera);
    this.saveCameras();
    return newCamera;
  }

  updateCamera(id: string, updates: Partial<CityCamera>): CityCamera {
    const idx = this.cameras.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.cameras[idx] = {
        ...this.cameras[idx],
        ...updates,
        atualizado_em: new Date().toISOString()
      };
      this.saveCameras();
      return { ...this.cameras[idx] };
    }
    throw new Error('Camera not found');
  }

  deleteCamera(id: string): void {
    this.cameras = this.cameras.filter((c) => c.id !== id);
    this.saveCameras();
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

    // Threshold levels: prioritize database custom values set by admin, fallback to official catalog
    const thresholds = getCityThresholds(dbCity || initCity);
    const normal_level = thresholds.normal;
    const attention_level = thresholds.attention;
    const alert_level = thresholds.alert;
    const flood_level = thresholds.flood;

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
      name: (dbCity?.name && dbCity.name.trim() !== '') ? dbCity.name : initCity.name,
      slug: initCity.slug,
      river: (dbCity?.river && dbCity.river.trim() !== '') ? dbCity.river : (initCity.river || 'Rio Taquari'),
      basin: (dbCity?.basin && dbCity.basin.trim() !== '') ? dbCity.basin : (initCity.basin || 'taquari'),
      description: (dbCity?.description && dbCity.description.trim() !== '') ? dbCity.description : (initCity.description || ''),
      image: (dbCity?.image && typeof dbCity.image === 'string' && dbCity.image.trim() !== '') ? dbCity.image : ((dbCity?.image_url && typeof dbCity.image_url === 'string' && dbCity.image_url.trim() !== '') ? dbCity.image_url : (initCity.image || '')),
      camera_image: (dbCity?.camera_image && typeof dbCity.camera_image === 'string' && dbCity.camera_image.trim() !== '') ? dbCity.camera_image : ((dbCity?.camera_image_url && typeof dbCity.camera_image_url === 'string' && dbCity.camera_image_url.trim() !== '') ? dbCity.camera_image_url : (initCity.camera_image || '')),
      camera_url: (dbCity?.camera_url && typeof dbCity.camera_url === 'string' && dbCity.camera_url.trim() !== '') ? dbCity.camera_url : (initCity.camera_url || ''),
      latitude: Number(dbCity?.latitude || initCity.latitude) || -29.4678,
      longitude: Number(dbCity?.longitude || initCity.longitude) || -51.9614,
      active: dbCity?.active !== false,
      ordem: typeof dbCity?.ordem === 'number' ? dbCity.ordem : index,
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
      const normal_level = thresholds.normal;
      const attention_level = thresholds.attention;
      const alert_level = thresholds.alert;
      const flood_level = thresholds.flood;

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
  let updatedCity: City;

  if (isSupabaseConfigured && supabase) {
    const payload: any = { ...cityData, updated_at: new Date().toISOString() };
    if (cityData.image) {
      payload.image_url = cityData.image;
    }
    if (cityData.camera_image) {
      payload.camera_image_url = cityData.camera_image;
    }

    if (cityData.id) {
      let { data, error } = await supabase
        .from('cities')
        .update(payload)
        .eq('id', cityData.id)
        .select()
        .maybeSingle();

      if ((error || !data) && cityData.slug) {
        const slugRes = await supabase
          .from('cities')
          .update(payload)
          .eq('slug', cityData.slug)
          .select()
          .maybeSingle();
        if (slugRes.data) {
          data = slugRes.data;
          error = slugRes.error;
        }
      }

      if (data) {
        updatedCity = {
          ...data,
          image: data.image || data.image_url || cityData.image || '',
          camera_image: data.camera_image || data.camera_image_url || cityData.camera_image || ''
        } as City;
      } else {
        if (error) {
          console.error('Erro ao atualizar cidade no Supabase:', error);
        }
        updatedCity = localStore.updateCity(cityData.id, cityData);
      }
    } else {
      const { data, error } = await supabase
        .from('cities')
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        updatedCity = {
          ...data,
          image: data.image || data.image_url || cityData.image || '',
          camera_image: data.camera_image || data.camera_image_url || cityData.camera_image || ''
        } as City;
      } else {
        if (error) {
          console.error('Erro ao inserir cidade no Supabase:', error);
        }
        updatedCity = localStore.addCity(cityData as any);
      }
    }
  } else {
    if (cityData.id) {
      updatedCity = localStore.updateCity(cityData.id, cityData);
    } else {
      updatedCity = localStore.addCity(cityData as any);
    }
  }

  // Ensure LocalStore is also updated in case of fallback or offline cache
  if (updatedCity && updatedCity.id) {
    try {
      localStore.updateCity(updatedCity.id, updatedCity);
    } catch (_) {
      try { localStore.addCity(updatedCity); } catch (e) {}
    }
  }

  if (typeof updatedCity.current_level === 'number' && updatedCity.current_level > 0) {
    try {
      await processHydrologicalMeasurement(updatedCity.slug || updatedCity.name, updatedCity.current_level);
    } catch (e) {
      console.warn('Erro ao processar evento de medição para alerta:', e);
    }
  }

  return updatedCity;
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
export async function fetchCamerasByCity(citySlug: string): Promise<CityCamera[]> {
  if (!citySlug) return [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('city_cameras')
        .select('*')
        .eq('city_slug', citySlug)
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true });
      if (!error && data && data.length > 0) return data as CityCamera[];
    } catch (e) {
      console.warn('Supabase fetchCamerasByCity failed:', e);
    }
  }
  return localStore.getCamerasByCity(citySlug);
}

export async function fetchCameras(citySlug?: string): Promise<CityCamera[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('city_cameras').select('*').order('ordem_exibicao', { ascending: true });
      if (citySlug && citySlug !== 'all') {
        query = query.eq('city_slug', citySlug);
      }
      const { data, error } = await query;
      if (!error && data) return data as CityCamera[];
    } catch (e) {
      console.warn('Supabase fetchCameras failed:', e);
    }
  }
  return localStore.getAllCamerasAdmin(citySlug);
}

export async function saveCamera(cameraData: Partial<CityCamera>): Promise<CityCamera> {
  const payload = {
    city_slug: cameraData.city_slug || 'lajeado',
    nome: cameraData.nome || 'Nova Câmera',
    descricao: cameraData.descricao || '',
    url_stream: cameraData.url_stream || '',
    url_thumbnail: cameraData.url_thumbnail || '',
    tipo: cameraData.tipo || 'YouTube',
    localizacao: cameraData.localizacao || '',
    latitude: cameraData.latitude !== undefined ? cameraData.latitude : null,
    longitude: cameraData.longitude !== undefined ? cameraData.longitude : null,
    ordem_exibicao: Number(cameraData.ordem_exibicao) || 1,
    ativo: cameraData.ativo ?? true,
    atualizado_em: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      if (cameraData.id) {
        const { data, error } = await supabase
          .from('city_cameras')
          .update(payload)
          .eq('id', cameraData.id)
          .select()
          .single();
        if (!error && data) {
          localStore.updateCamera(cameraData.id, data as CityCamera);
          return data as CityCamera;
        }
      } else {
        const { data, error } = await supabase
          .from('city_cameras')
          .insert({ ...payload, criado_em: new Date().toISOString() })
          .select()
          .single();
        if (!error && data) {
          localStore.addCamera(data as CityCamera);
          return data as CityCamera;
        }
      }
    } catch (e) {
      console.warn('Supabase saveCamera exception:', e);
    }
  }

  if (cameraData.id) {
    return localStore.updateCamera(cameraData.id, cameraData);
  }
  return localStore.addCamera(payload as any);
}

export async function deleteCamera(cameraId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('city_cameras').delete().eq('id', cameraId);
    } catch (e) {
      console.warn('Supabase deleteCamera exception:', e);
    }
  }
  localStore.deleteCamera(cameraId);
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
        user_email: user?.email || 'sistema',
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
/**
 * Verifies if an authenticated Supabase user has administrative privileges in `admin_users`.
 * 
 * SECURITY AUDIT RULES:
 * 1. Common users authenticated in Supabase Auth DO NOT automatically get admin access.
 * 2. An admin profile is returned ONLY IF:
 *    - The user_id UUID exists in `admin_users`, OR
 *    - The user's email was pre-authorized in `admin_users` (in which case user_id is linked).
 * 3. Returns `null` if the user is not an authorized administrator.
 */
export async function verifyAdminUserProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}): Promise<AdminUser | null> {
  const email = (authUser.email || '').toLowerCase().trim();

  // Local/demo fallback when Supabase keys are not set
  if (!isSupabaseConfigured || !supabase) {
    return {
      id: authUser.id,
      user_id: authUser.id,
      nome: authUser.user_metadata?.nome || authUser.user_metadata?.full_name || (email ? email.split('@')[0] : 'Administrador Local'),
      email: email,
      nivel_acesso: 'administrador',
      criado_em: new Date().toISOString()
    };
  }

  try {
    // 1. Check by user_id UUID in admin_users
    const { data: profileByUid, error: uidError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (!uidError && profileByUid) {
      return profileByUid as AdminUser;
    }

    // 2. Check if email is pre-authorized in admin_users
    if (email) {
      const { data: profileByEmail, error: emailError } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (!emailError && profileByEmail) {
        // Link user_id UUID to pre-authorized admin row
        const { data: updatedProfile, error: updateError } = await supabase
          .from('admin_users')
          .update({ user_id: authUser.id })
          .eq('id', profileByEmail.id)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          return updatedProfile as AdminUser;
        }
        return { ...profileByEmail, user_id: authUser.id } as AdminUser;
      }
    }
  } catch (err) {
    console.error('Error verifying admin permissions:', err);
  }

  // Strictly return null for unauthorized users! No auto-insertion.
  return null;
}

// Deprecated alias for backwards compatibility
export async function ensureAdminUserProfile(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}): Promise<AdminUser | null> {
  return verifyAdminUserProfile(authUser);
}

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

  // Fallback if no data
  return [];
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

// ==========================================
// PREVENTIVE ALERT SUBSCRIBERS & NOTIFICATIONS
// ==========================================

export async function subscribeToAlerts(
  data: Partial<AlertSubscriber>
): Promise<AlertSubscriber> {
  const nomeCompleto = data.nome_completo || data.name || 'Morador';
  const cidade = data.cidade || data.city_slug || 'lajeado';
  const bairro = data.bairro || data.neighborhood || 'Centro';
  const cotaResidencia = Number(data.cota_residencia) || 19.0;
  const receberAlertas = data.receber_alertas ?? data.active ?? true;

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        nome_completo: nomeCompleto,
        name: nomeCompleto,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        cidade: cidade,
        city_slug: cidade,
        bairro: bairro,
        neighborhood: bairro,
        cota_residencia: cotaResidencia,
        receber_alertas: receberAlertas,
        active: receberAlertas,
        resides_in_risk_area: data.resides_in_risk_area ?? true,
        receive_attention: data.receive_attention ?? true,
        receive_alert: data.receive_alert ?? true,
        receive_flood: data.receive_flood ?? true,
        criado_em: new Date().toISOString()
      };

      const { data: res, error } = await supabase
        .from('alert_subscribers')
        .insert([payload])
        .select()
        .single();

      if (!error && res) {
        return res as AlertSubscriber;
      } else if (error) {
        console.warn('Supabase subscribeToAlerts error:', error);
      }
    } catch (e) {
      console.warn('Exception in subscribeToAlerts:', e);
    }
  }

  return localStore.addSubscriber({
    nome_completo: nomeCompleto,
    name: nomeCompleto,
    email: data.email,
    whatsapp: data.whatsapp,
    cidade: cidade,
    city_slug: cidade,
    bairro: bairro,
    neighborhood: bairro,
    cota_residencia: cotaResidencia,
    receber_alertas: receberAlertas,
    active: receberAlertas,
    resides_in_risk_area: data.resides_in_risk_area ?? true,
    receive_attention: data.receive_attention ?? true,
    receive_alert: data.receive_alert ?? true,
    receive_flood: data.receive_flood ?? true
  });
}

export async function fetchAlertSubscribers(
  citySlug?: string,
  neighborhood?: string
): Promise<AlertSubscriber[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('alert_subscribers').select('*').order('created_at', { ascending: false });
      if (citySlug && citySlug !== 'todas') {
        query = query.or(`cidade.eq.${citySlug},city_slug.eq.${citySlug}`);
      }
      if (neighborhood) {
        query = query.or(`bairro.ilike.%${neighborhood}%,neighborhood.ilike.%${neighborhood}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          nome_completo: item.nome_completo || item.name || 'Morador',
          cidade: item.cidade || item.city_slug || 'lajeado',
          bairro: item.bairro || item.neighborhood || 'Centro',
          cota_residencia: item.cota_residencia != null ? Number(item.cota_residencia) : 19.0,
          receber_alertas: item.receber_alertas ?? item.active ?? true,
          criado_em: item.criado_em || item.created_at || new Date().toISOString()
        })) as AlertSubscriber[];
      }
    } catch (e) {
      console.warn('Exception in fetchAlertSubscribers:', e);
    }
  }

  return localStore.getSubscribers(citySlug, neighborhood).map(item => ({
    ...item,
    nome_completo: item.nome_completo || item.name || 'Morador',
    cidade: item.cidade || item.city_slug || 'lajeado',
    bairro: item.bairro || item.neighborhood || 'Centro',
    cota_residencia: item.cota_residencia != null ? Number(item.cota_residencia) : 19.0,
    receber_alertas: item.receber_alertas ?? item.active ?? true,
    criado_em: item.criado_em || item.created_at || new Date().toISOString()
  }));
}

export async function saveAlertSubscriber(subscriberData: Partial<AlertSubscriber>): Promise<AlertSubscriber> {
  const payload = {
    nome_completo: subscriberData.nome_completo || subscriberData.name || 'Morador',
    name: subscriberData.nome_completo || subscriberData.name || 'Morador',
    email: subscriberData.email || '',
    whatsapp: subscriberData.whatsapp || '',
    cidade: subscriberData.cidade || subscriberData.city_slug || 'lajeado',
    city_slug: subscriberData.cidade || subscriberData.city_slug || 'lajeado',
    bairro: subscriberData.bairro || subscriberData.neighborhood || 'Centro',
    neighborhood: subscriberData.bairro || subscriberData.neighborhood || 'Centro',
    rua: subscriberData.rua || '',
    numero: subscriberData.numero || '',
    complemento: subscriberData.complemento || '',
    cota_residencia: Number(subscriberData.cota_residencia || 0),
    receber_alertas: subscriberData.receber_alertas ?? subscriberData.active ?? true,
    active: subscriberData.receber_alertas ?? subscriberData.active ?? true,
    atualizado_em: new Date().toISOString()
  };

  if (subscriberData.id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('alert_subscribers')
          .update(payload)
          .eq('id', subscriberData.id)
          .select()
          .single();
        if (!error && data) {
          localStore.updateSubscriber(subscriberData.id, data as AlertSubscriber);
          return data as AlertSubscriber;
        }
      } catch (e) {
        console.warn('Supabase saveAlertSubscriber update error:', e);
      }
    }
    const updated = localStore.updateSubscriber(subscriberData.id, payload);
    if (updated) return updated;
  } else {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('alert_subscribers')
          .insert({ ...payload, criado_em: new Date().toISOString(), created_at: new Date().toISOString() })
          .select()
          .single();
        if (!error && data) {
          localStore.addSubscriber(data as AlertSubscriber);
          return data as AlertSubscriber;
        }
      } catch (e) {
        console.warn('Supabase saveAlertSubscriber insert error:', e);
      }
    }
    return localStore.addSubscriber(payload as any);
  }
  return subscriberData as AlertSubscriber;
}

export async function toggleSubscriberActive(id: string, active: boolean): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('alert_subscribers').update({ active, receber_alertas: active, atualizado_em: new Date().toISOString() }).eq('id', id);
    } catch (e) {
      console.warn('Exception in toggleSubscriberActive:', e);
    }
  }
  localStore.updateSubscriber(id, { active, receber_alertas: active });
}

export async function deleteSubscriber(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('alert_subscribers').delete().eq('id', id);
    } catch (e) {
      console.warn('Exception in deleteSubscriber:', e);
    }
  }
  localStore.deleteSubscriber(id);
}

/**
 * Future Alert Dispatch helper logic:
 * Filters subscribers whose registered risk cota is <= current river level.
 */
export async function findMatchingSubscribersForCityLevel(
  cidade: string,
  nivelAtual: number
): Promise<AlertSubscriber[]> {
  const allSubscribers = await fetchAlertSubscribers(cidade);
  return allSubscribers.filter(sub => {
    const active = sub.receber_alertas ?? sub.active ?? true;
    const cota = Number(sub.cota_residencia || 0);
    return active && cota > 0 && cota <= nivelAtual;
  });
}

export async function fetchAlertNotifications(citySlug?: string): Promise<AlertNotification[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('alert_notifications').select('*, alert_subscribers(name)').order('sent_at', { ascending: false });
      if (citySlug) query = query.eq('city_slug', citySlug);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((n: any) => ({
          ...n,
          subscriber_name: n.alert_subscribers?.name || 'Morador'
        })) as AlertNotification[];
      }
    } catch (e) {
      console.warn('Exception in fetchAlertNotifications:', e);
    }
  }
  return localStore.getNotifications(citySlug);
}

export async function confirmAlertNotification(notificationId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('alert_notifications')
        .update({ confirmed_at: now })
        .eq('id', notificationId);
      if (!error) return true;
    } catch (e) {
      console.warn('Exception in confirmAlertNotification:', e);
    }
  }
  return localStore.confirmNotification(notificationId);
}

export async function getAlertStats(): Promise<AlertStats[]> {
  const cities = await fetchCities();
  const notifications = await fetchAlertNotifications();

  return cities.map(city => {
    const cityNotifs = notifications.filter(n => n.city_slug === city.slug);
    const sent_count = cityNotifs.length;
    const confirmed_count = cityNotifs.filter(n => Boolean(n.confirmed_at)).length;
    const confirmation_rate = sent_count > 0 ? Math.round((confirmed_count / sent_count) * 100) : 0;

    return {
      city_slug: city.slug,
      city_name: city.name,
      sent_count,
      confirmed_count,
      confirmation_rate
    };
  });
}

export async function checkAndTriggerRiverLevelAlerts(
  citySlug: string,
  newLevel: number,
  previousStatus: LevelStatus,
  currentStatus: LevelStatus,
  customMessage?: string
): Promise<number> {
  if (currentStatus === 'normal' && !customMessage) {
    return 0;
  }

  const allSubscribers = await fetchAlertSubscribers(citySlug);
  const eligibleSubscribers = allSubscribers.filter(s => {
    if (!s.active || !s.resides_in_risk_area) return false;
    if (currentStatus === 'atencao' && !s.receive_attention) return false;
    if (currentStatus === 'alerta' && !s.receive_alert) return false;
    if (currentStatus === 'inundacao' && !s.receive_flood) return false;
    return true;
  });

  if (eligibleSubscribers.length === 0) return 0;

  const statusLabel = currentStatus === 'inundacao' ? 'INUNDAÇÃO' : currentStatus.toUpperCase();
  const defaultMsg = customMessage || `ALERTA PREVENTIVO: O nível do Rio em ${citySlug} atingiu ${newLevel.toFixed(2)}m (Status: ${statusLabel}). Moradores em áreas de risco devem acompanhar as orientações da Defesa Civil.`;

  let sentCount = 0;

  for (const sub of eligibleSubscribers) {
    const channel = sub.whatsapp && sub.email ? 'both' : sub.whatsapp ? 'whatsapp' : 'email';
    const notifData = {
      subscriber_id: sub.id,
      city_slug: citySlug,
      alert_type: (currentStatus === 'normal' ? 'atencao' : currentStatus) as 'atencao' | 'alerta' | 'inundacao',
      river_level: newLevel,
      message: defaultMsg,
      channel: channel as 'email' | 'whatsapp' | 'both',
      subscriber_name: sub.name
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('alert_notifications').insert({
          subscriber_id: sub.id,
          city_slug: citySlug,
          alert_type: currentStatus === 'normal' ? 'atencao' : currentStatus,
          river_level: newLevel,
          message: defaultMsg,
          channel,
          sent_at: new Date().toISOString()
        });
      } catch (e) {
        localStore.addNotification(notifData);
      }
    } else {
      localStore.addNotification(notifData);
    }

    const emailEndpoint = getEnvVar('VITE_EMAIL_SERVICE_URL');
    const whatsappEndpoint = getEnvVar('VITE_WHATSAPP_API_URL');

    if (emailEndpoint && sub.email) {
      try {
        fetch(emailEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: sub.email, name: sub.name, message: defaultMsg })
        }).catch(() => {});
      } catch (e) {}
    }

    if (whatsappEndpoint && sub.whatsapp) {
      try {
        fetch(whatsappEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: sub.whatsapp, name: sub.name, message: defaultMsg })
        }).catch(() => {});
      } catch (e) {}
    }

    sentCount++;
  }

  return sentCount;
}

/**
 * Structuring sendHydrologicalAlert function for future message dispatch (WhatsApp / Email).
 * Receives city, current river level, alert type, and affected subscribers list.
 * Currently registers the execution log record into `alert_history`.
 */
export async function sendHydrologicalAlert(
  cidade: string,
  nivelAtual: number,
  tipoAlerta: 'atenção' | 'alerta' | 'inundação',
  moradoresAtingidos: AlertSubscriber[],
  cotaDisparada?: number,
  mensagemCustom?: string
): Promise<AlertHistoryItem> {
  const cotaVal = cotaDisparada ?? nivelAtual;
  const quantidade = moradoresAtingidos.length;
  const defaultMsg = mensagemCustom || `[SIMULAÇÃO / REGISTRO] Alerta de ${tipoAlerta.toUpperCase()} para ${cidade}: Nível ${nivelAtual.toFixed(2)}m (Cota ${cotaVal.toFixed(2)}m). ${quantidade} moradores elegíveis na faixa de risco.`;

  const payload = {
    cidade,
    nivel_rio: nivelAtual,
    cota_disparada: cotaVal,
    quantidade_usuarios_atingidos: quantidade,
    mensagem: defaultMsg,
    tipo_alerta: tipoAlerta,
    enviado: true
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alert_history')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return data as AlertHistoryItem;
      } else if (error) {
        console.warn('Supabase alert_history insert error:', error);
      }
    } catch (e) {
      console.warn('Exception in sendHydrologicalAlert:', e);
    }
  }

  return localStore.addAlertHistory(payload);
}

export async function fetchAlertHistory(cidade?: string): Promise<AlertHistoryItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('alert_history').select('*').order('criado_em', { ascending: false });
      if (cidade && cidade !== 'todas') {
        query = query.eq('cidade', cidade);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as AlertHistoryItem[];
      }
    } catch (e) {
      console.warn('Exception in fetchAlertHistory:', e);
    }
  }

  return localStore.getAlertHistory(cidade);
}

export async function fetchAlertDispatches(alertHistoryId?: string): Promise<AlertDispatchItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('alert_dispatches').select('*').order('criado_em', { ascending: false });
      if (alertHistoryId) {
        query = query.eq('alert_history_id', alertHistoryId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data as AlertDispatchItem[];
      }
    } catch (e) {
      console.warn('Supabase fetchAlertDispatches error:', e);
    }
  }
  return localStore.getDispatches(alertHistoryId);
}

export async function dispatchHydrologicalAlert(
  alertHistoryId: string,
  subscribersOverride?: AlertSubscriber[]
): Promise<AlertDispatchItem[]> {
  const history = await fetchAlertHistory();
  const alertItem = history.find(h => h.id === alertHistoryId);
  if (!alertItem) {
    console.warn('Alert history item not found for dispatching:', alertHistoryId);
    return [];
  }

  const cityName = alertItem.cidade;
  const citySlug = alertItem.cidade.toLowerCase();
  
  let allSubs: AlertSubscriber[] = subscribersOverride || [];
  if (!subscribersOverride) {
    allSubs = await fetchAlertSubscribers(citySlug);
  }

  const affectedSubscribers = allSubs.filter(s => {
    const matchesCity = (s.cidade || s.city_slug) === citySlug || (s.cidade || s.city_slug) === cityName.toLowerCase();
    const active = s.receber_alertas ?? s.active ?? true;
    const cota = Number(s.cota_residencia || 0);
    return matchesCity && active && cota > 0 && cota <= alertItem.nivel_rio;
  });

  const dispatchPayloads: Omit<AlertDispatchItem, 'id' | 'criado_em'>[] = [];

  for (const sub of affectedSubscribers) {
    const subName = sub.nome_completo || sub.name || 'Morador';
    const whatsapp = sub.whatsapp || (sub as any).phone || (sub as any).telefone;
    const email = sub.email;

    if (whatsapp) {
      dispatchPayloads.push({
        alert_history_id: alertHistoryId,
        subscriber_id: sub.id,
        subscriber_name: subName,
        canal: 'whatsapp',
        destino: whatsapp,
        mensagem: alertItem.mensagem,
        status: 'pendente',
        tentativa: 1
      });
    }

    if (email) {
      dispatchPayloads.push({
        alert_history_id: alertHistoryId,
        subscriber_id: sub.id,
        subscriber_name: subName,
        canal: 'email',
        destino: email,
        mensagem: alertItem.mensagem,
        status: 'pendente',
        tentativa: 1
      });
    }
  }

  if (dispatchPayloads.length === 0) {
    return [];
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const existing = await fetchAlertDispatches(alertHistoryId);
      const newPayloads = dispatchPayloads.filter(p => 
        !existing.some(e => e.subscriber_id === p.subscriber_id && e.canal === p.canal)
      );

      if (newPayloads.length > 0) {
        const { data, error } = await supabase
          .from('alert_dispatches')
          .insert(newPayloads)
          .select();
        if (!error && data) {
          return data as AlertDispatchItem[];
        }
      } else {
        return existing;
      }
    } catch (e) {
      console.warn('Supabase dispatchHydrologicalAlert exception:', e);
    }
  }

  return localStore.addDispatches(dispatchPayloads);
}

export async function processDispatchQueue(
  alertHistoryId?: string
): Promise<{ processedCount: number; dispatches: AlertDispatchItem[] }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('alert_dispatches')
        .update({ status: 'enviado', enviado_em: now })
        .eq('status', 'pendente');

      if (alertHistoryId) {
        query = query.eq('alert_history_id', alertHistoryId);
      }

      const { data, error } = await query.select();
      if (!error && data) {
        const dispatches = await fetchAlertDispatches(alertHistoryId);
        return { processedCount: data.length, dispatches };
      }
    } catch (e) {
      console.warn('Supabase processDispatchQueue exception:', e);
    }
  }

  return localStore.processDispatches(alertHistoryId);
}

export async function approveAlertHistory(
  id: string,
  adminUser?: string,
  subscribersOverride?: AlertSubscriber[]
): Promise<boolean> {
  const adminName = adminUser || 'Administrador';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('alert_history')
        .update({ enviado: true, aprovado_por: adminName, aprovado_em: now })
        .eq('id', id);
      if (!error) {
        await dispatchHydrologicalAlert(id, subscribersOverride);
        return true;
      }
    } catch (e) {
      console.warn('Supabase approveAlertHistory error:', e);
    }
  }

  const success = localStore.approveAlertHistory(id, adminName);
  if (success) {
    await dispatchHydrologicalAlert(id, subscribersOverride);
  }
  return success;
}

/**
 * Serviço de monitoramento de eventos hidrológicos.
 * Integração automática com a Central de Alertas ao registrar nova medição.
 * Se houver mudança de categoria/cota (Normal -> Atenção -> Alerta -> Inundação),
 * cria um registro pendente em alert_history (enviado: false).
 * Não envia mensagens reais ainda e não duplica alertas para a mesma faixa/categoria.
 */
export async function processHydrologicalMeasurement(
  citySlugOrName: string,
  newLevel: number,
  subscribersOverride?: AlertSubscriber[]
): Promise<AlertHistoryItem | null> {
  const cities = await fetchCities();
  const cityObj = cities.find(c => 
    c.slug.toLowerCase() === citySlugOrName.toLowerCase() || 
    c.name.toLowerCase() === citySlugOrName.toLowerCase()
  );
  const cityName = cityObj?.name || citySlugOrName;
  const citySlug = cityObj?.slug || citySlugOrName.toLowerCase();

  const thresholds = getCityThresholds(cityObj || citySlug);

  let currentCategory: 'normal' | 'atenção' | 'alerta' | 'inundação' = 'normal';
  let cotaDisparada = 0;

  if (newLevel >= thresholds.flood) {
    currentCategory = 'inundação';
    cotaDisparada = Math.floor(newLevel);
    if (cotaDisparada < thresholds.flood) {
      cotaDisparada = thresholds.flood;
    }
  } else if (newLevel >= thresholds.alert) {
    currentCategory = 'alerta';
    cotaDisparada = thresholds.alert;
  } else if (newLevel >= thresholds.attention) {
    currentCategory = 'atenção';
    cotaDisparada = thresholds.attention;
  }

  if (currentCategory === 'normal') {
    return null;
  }

  const history = await fetchAlertHistory(cityName);
  const cityHistory = history.filter(h => 
    h.cidade.toLowerCase() === cityName.toLowerCase() || 
    h.cidade.toLowerCase() === citySlug.toLowerCase()
  );

  if (cityHistory.length > 0) {
    const lastAlert = cityHistory[0];
    if (
      lastAlert.tipo_alerta === currentCategory && 
      Number(lastAlert.cota_disparada) === cotaDisparada
    ) {
      return null;
    }
  }

  let allSubs: AlertSubscriber[] = subscribersOverride || [];
  if (!subscribersOverride) {
    allSubs = await fetchAlertSubscribers(citySlug);
  }

  const affectedSubscribers = allSubs.filter(s => {
    const matchesCity = (s.cidade || s.city_slug) === citySlug || (s.cidade || s.city_slug) === cityName.toLowerCase();
    const active = s.receber_alertas ?? s.active ?? true;
    const cota = Number(s.cota_residencia || 0);
    return matchesCity && active && cota > 0 && cota <= newLevel;
  });

  const quantidade = affectedSubscribers.length;
  const mensagem = `[MONITORAMENTO AUTOMÁTICO] Alteração de Nível Hidrológico em ${cityName}: Rio atingiu ${newLevel.toFixed(2)}m (Cota do Alerta: ${cotaDisparada.toFixed(2)}m - Categoria: ${currentCategory.toUpperCase()}). ${quantidade} morador(es) na faixa de risco.`;

  const payload = {
    cidade: cityName,
    nivel_rio: newLevel,
    cota_disparada: cotaDisparada,
    quantidade_usuarios_atingidos: quantidade,
    mensagem,
    tipo_alerta: currentCategory,
    enviado: false
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('alert_history')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        return data as AlertHistoryItem;
      }
    } catch (e) {
      console.warn('Supabase alert_history insert exception:', e);
    }
  }

  return localStore.addAlertHistory(payload);
}

