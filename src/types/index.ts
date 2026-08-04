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
  basin?: string; // 'taquari' | 'guaiba'
  basin_section?: 'cabeceira' | 'montante' | 'medio' | 'jusante'; // Seção da bacia
  classification?: 'rio_principal' | 'afluente' | 'cabeceira'; // Classificação do trecho
  station_type?: string; // Ex: Telemétrica SGB/SACE, Radar, Fluviométrica
  municipality?: string; // Município da estação
  influence_notes?: string; // Relação de influência na bacia
  source_origin?: string; // Origem da coleta (ex: SGB/SACE, nivelguaiba.com.br, etc.)
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
  source_origin?: string;
  basin?: string;
  river_name?: string;
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

export type NewsSourceType = 'rss' | 'api' | 'html';
export type NewsSourceFrequency = 'hourly' | 'multiple_daily' | 'daily' | 'weekly' | 'manual';

export interface NewsSourceSchedule {
  times?: string[]; // e.g. ["08:00", "18:00"]
  time?: string; // e.g. "08:00"
  day_of_week?: number; // 0 = Domingo, 1 = Segunda, etc.
  count_per_day?: number;
}

export interface NewsSource {
  id: string;
  nome: string;
  descricao?: string;
  url: string;
  tipo: NewsSourceType;
  ativo: boolean;
  frequencia: NewsSourceFrequency;
  horarios_configurados?: NewsSourceSchedule;
  categoria_padrao?: 'Alertas' | 'Monitoramento' | 'Comunicados' | 'Meteorologia' | string;
  keywords_incluir?: string;
  keywords_ignorar?: string;
  importar_todas?: boolean;
  ultima_verificacao?: string | null;
  proxima_verificacao?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

export interface NewsItem {
  id: string;
  city_id?: string;
  category: 'Defesa Civil' | 'Prefeituras' | 'Meteorologia' | 'Infraestrutura' | 'Comunicados' | 'Alertas' | 'Monitoramento' | string;
  title: string;
  summary: string;
  content: string;
  image: string;
  author: string;
  date: string;
  published: boolean;
  link_original?: string;
  fonte?: string;
  source_id?: string;
  created_at?: string;
  is_critical?: boolean;
  manter_permanente?: boolean;
  exibir_no_menu?: boolean;
  prioridade?: 'baixa' | 'media' | 'alta';
  expires_at?: string;
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

export interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  nivel_acesso: 'administrador' | 'editor';
  criado_em?: string;
}

export interface AlertSubscriber {
  id: string;
  nome_completo: string;
  email?: string;
  whatsapp?: string;
  cidade: string;
  bairro: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  cota_residencia: number;
  receber_alertas: boolean;
  criado_em?: string;
  atualizado_em?: string;

  // Aliases for compatibility
  name?: string;
  city_slug?: string;
  neighborhood?: string;
  resides_in_risk_area?: boolean;
  receive_attention?: boolean;
  receive_alert?: boolean;
  receive_flood?: boolean;
  active?: boolean;
  created_at?: string;
}

export interface AlertNotification {
  id: string;
  subscriber_id: string;
  city_slug: string;
  alert_type: 'atencao' | 'alerta' | 'inundacao';
  river_level: number;
  message: string;
  channel: 'email' | 'whatsapp' | 'both';
  sent_at: string;
  confirmed_at?: string;
  subscriber_name?: string;
}

export interface AlertHistoryItem {
  id: string;
  cidade: string;
  nivel_rio: number;
  cota_disparada: number;
  quantidade_usuarios_atingidos: number;
  mensagem: string;
  tipo_alerta: 'atenção' | 'alerta' | 'inundação';
  enviado: boolean;
  criado_em: string;
  aprovado_por?: string;
  aprovado_em?: string;
}

export type DispatchChannel = 'whatsapp' | 'email' | 'sms' | 'push';
export type DispatchStatus = 'pendente' | 'enviado' | 'erro';

export interface AlertDispatchItem {
  id: string;
  alert_history_id: string;
  subscriber_id: string;
  subscriber_name?: string;
  canal: DispatchChannel;
  destino: string;
  mensagem: string;
  status: DispatchStatus;
  tentativa: number;
  enviado_em?: string;
  erro_detalhe?: string;
  criado_em: string;
}

export interface AlertStats {
  city_slug: string;
  city_name: string;
  sent_count: number;
  confirmed_count: number;
  confirmation_rate: number;
}

export interface CityCamera {
  id: string;
  city_slug: string;
  nome: string;
  descricao?: string;
  url_stream: string;
  url_thumbnail?: string;
  tipo: 'MJPEG' | 'HLS' | 'YouTube' | 'RTSP' | 'Imagem Estática' | string;
  localizacao?: string;
  latitude?: number;
  longitude?: number;
  ordem_exibicao: number;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

export interface SiteSettings {
  id?: string;
  site_name: string;
  site_subtitle: string;
  site_description: string;
  logo_url: string | null;
  favicon_url: string | null;
  about_badge?: string;
  about_title?: string;
  about_text?: string;
  about_feature1_title?: string;
  about_feature1_text?: string;
  about_feature2_title?: string;
  about_feature2_text?: string;
  about_feature3_title?: string;
  about_feature3_text?: string;
  updated_at?: string;
}

export type CotaAttachmentType = 'imagem' | 'video' | 'pdf';

export interface CotaAttachment {
  id: string;
  cota_id: string;
  tipo: CotaAttachmentType;
  titulo: string;
  url: string;
  descricao?: string;
  ordem?: number;
  created_at?: string;
}

export interface CotaAnalise {
  id: string;
  cota_m: number;
  titulo: string;
  resumo_ia: string;
  descricao: string;
  observacoes?: string;
  nivel_risco: LevelStatus;
  status: 'publicado' | 'rascunho';
  ordem?: number;
  anexos?: CotaAttachment[];
  pdf_oficial_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistoricalFlood {
  id: string;
  nome: string;
  data: string;
  cota_m: number;
  detalhes: string;
  cidade_referencia: string;
}

export interface ProjectionParameter {
  id: string;
  horas: number;
  variacao_estimada_m: number;
  confianca_porcentagem: number;
  fator_chuva_upstream: number;
  modelo_nome: string;
}

