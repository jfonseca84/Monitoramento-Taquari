export type LevelStatus = 'normal' | 'atencao' | 'alerta' | 'inundacao';
export type LevelTrend = 'subindo' | 'descendo' | 'estavel';
export type Timeframe = '24h' | '7d' | '30d' | '12m' | 'all';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface City {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  camera_image: string;
  camera_url: string;
  latitude: number;
  longitude: number;
  active: boolean;
  ordem?: number;
  station_id?: string;
  river?: string;
  basin?: string; // 'taquari' | 'guaiba' | 'uruguai'
  current_level?: number;
  trend?: LevelTrend;
  rate_of_change?: number; // m/h
  status_level?: LevelStatus;
  last_updated?: string;
  updated_at?: string;
  normal_level?: number;
  attention_level?: number;
  alert_level?: number;
  flood_level?: number;
}

export interface Station {
  id: string;
  city_id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  normal_level: number; // e.g. 3.00m
  attention_level: number; // 3.00m
  alert_level: number; // 6.00m
  flood_level: number; // 8.50m
  sensor_type: string;
  precision_cm: number;
  active: boolean;
  updated_at?: string;
}

export interface RiverLevelReading {
  id: string;
  station_id: string;
  city_id: string;
  level: number;
  trend: LevelTrend;
  rate_of_change: number;
  recorded_at: string;
  created_at?: string;
}

export interface ChartDataPoint {
  time: string;
  timestamp: string;
  level: number;
  normal: number;
  attention: number;
  alert: number;
  flood: number;
}

export interface StationDailyStats {
  max: number;
  max_time: string;
  min: number;
  min_time: string;
  avg: number;
  diff_last: number;
  rate_of_change: number;
  trend: LevelTrend;
}

export interface AlertItem {
  id: string;
  city_id: string;
  city_name?: string;
  title: string;
  description: string;
  level: LevelStatus;
  active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface NewsItem {
  id: string;
  city_id?: string;
  category: 'Defesa Civil' | 'Prefeituras' | 'Meteorologia' | 'Infraestrutura' | 'Comunicados';
  title: string;
  summary: string;
  content: string;
  image: string;
  author: string;
  date: string;
  published: boolean;
}

export interface GalleryItem {
  id: string;
  city_id: string;
  title: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface TechnicalDetails {
  dataSource: string;
  updateFrequency: string;
  sensorPrecision: string;
  coordinates: string;
  sensorType: string;
}

export interface SyncStatus {
  last_sync: string;
  success: boolean;
  source_url: string;
  records_processed: number;
  error_message?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website?: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

