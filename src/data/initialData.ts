import { City, Station, NewsItem, AlertItem, SystemLog, LevelStatus, Sponsor, CityCamera } from '../types';
import { getBrasiliaLastUpdatedString } from '../lib/dateUtils';
import { CITY_THRESHOLDS, getCityThresholds, HydrologicalThresholds } from './cityThresholds';

export { CITY_THRESHOLDS, getCityThresholds };
export type { HydrologicalThresholds };

export function calculateStatusLevel(
  currentLevel: number,
  thresholds: { normal: number; attention: number; alert: number; flood: number },
  trend?: string,
  rateOfChange?: number
): LevelStatus {
  const level = Number(currentLevel) || 0;

  // Regra de segurança de confirmação dupla para alerta vermelho (inundação):
  // 1. Nível atual atingiu ou ultrapassou a cota de inundação;
  // 2. Tendência de subida ('subindo') ou estabilidade/persistência (rateOfChange >= 0).
  // Se o nível estiver caindo ('descendo'), fica em cota de alerta (amarelo).
  if (level >= thresholds.flood) {
    if (!trend || trend === 'subindo' || (trend === 'estavel' && (rateOfChange ?? 0) >= 0)) {
      return 'inundacao';
    }
    return 'alerta';
  }

  if (level >= thresholds.alert) return 'alerta';
  if (level >= thresholds.attention) return 'atencao';
  return 'normal';
}

export const INITIAL_CITIES: City[] = [
  // --- VALE DO TAQUARI (7 CIDADES) ---
  {
    id: '10000000-0000-4000-8000-000000000000',
    name: 'Santa Tereza',
    slug: 'santatereza',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação de monitoramento do Rio Taquari em Santa Tereza (nivelguaiba.com.br/santatereza).',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/santatereza',
    latitude: -29.1678,
    longitude: -51.7331,
    active: true,
    ordem: 0,
    station_id: 'santatereza-st1',
    current_level: 5.08,
    trend: 'descendo',
    rate_of_change: -0.05,
    status_level: 'normal',
    last_updated: getBrasiliaLastUpdatedString(),
    normal_level: 4.00,
    attention_level: 6.00,
    alert_level: 8.00,
    flood_level: 10.00
  },
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Muçum',
    slug: 'mucum',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação de medição de nível no alto Taquari em Muçum (nivelguaiba.com.br/mucum).',
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/mucum',
    latitude: -29.1672,
    longitude: -51.8661,
    active: true,
    ordem: 1,
    station_id: 'mucum-st1',
    current_level: 5.06,
    trend: 'descendo',
    rate_of_change: -0.08,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 12.00,
    attention_level: 14.00,
    alert_level: 16.00,
    flood_level: 18.00
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Encantado',
    slug: 'encantado',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação montante monitorando a calha do Rio Taquari em Encantado (nivelguaiba.com.br/encantado).',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/encantado',
    latitude: -29.2372,
    longitude: -51.8708,
    active: true,
    ordem: 2,
    station_id: 'encantado-st1',
    current_level: 3.08,
    trend: 'descendo',
    rate_of_change: -0.06,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 6.00,
    attention_level: 8.00,
    alert_level: 10.00,
    flood_level: 12.00
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Roca Sales',
    slug: 'rocasales',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação hidrométrica do Rio Taquari em Roca Sales.',
    image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://niveldosrios.guerreirosdohumaita.com.br/',
    latitude: -29.2811,
    longitude: -51.8672,
    active: true,
    ordem: 3,
    station_id: 'rocasales-st1',
    current_level: 7.50,
    trend: 'descendo',
    rate_of_change: -0.14,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 12.00,
    attention_level: 14.00,
    alert_level: 16.00,
    flood_level: 18.00
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Lajeado',
    slug: 'lajeado',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação principal no Porto de Lajeado (nivelguaiba.com.br/lajeado).',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/lajeado',
    latitude: -29.4678,
    longitude: -51.9614,
    active: true,
    ordem: 4,
    station_id: 'lajeado-st1',
    current_level: 13.59,
    trend: 'descendo',
    rate_of_change: -0.05,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 13.00,
    attention_level: 15.00,
    alert_level: 17.00,
    flood_level: 19.00
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Estrela',
    slug: 'estrela',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação de medição do Rio Taquari em Estrela (vinculada aos mesmos dados de Lajeado).',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/lajeado',
    latitude: -29.5011,
    longitude: -51.9614,
    active: true,
    ordem: 5,
    station_id: 'estrela-st1',
    current_level: 13.59,
    trend: 'descendo',
    rate_of_change: -0.05,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 13.00,
    attention_level: 15.00,
    alert_level: 17.00,
    flood_level: 19.00
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    name: 'Bom Retiro do Sul',
    slug: 'bomretirodosul',
    river: 'Rio Taquari',
    basin: 'taquari',
    description: 'Estação de medição junto à barragem de Bom Retiro do Sul (nivelguaiba.com.br/bomretirodosul).',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/bomretirodosul',
    latitude: -29.6019,
    longitude: -51.9482,
    active: true,
    ordem: 6,
    station_id: 'bomretiro-st1',
    current_level: 8.12,
    trend: 'descendo',
    rate_of_change: -0.22,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 13.00,
    attention_level: 15.00,
    alert_level: 17.00,
    flood_level: 19.00
  },

  // --- BACIA DO GUAÍBA (10 CIDADES) ---
  {
    id: '10000000-0000-4000-8000-000000000008',
    name: 'Porto Alegre',
    slug: 'portoalegre',
    river: 'Rio Guaíba',
    basin: 'guaiba',
    description: 'Cais Mauá / Usina do Gasômetro - Nível do Rio Guaíba (nivelguaiba.com.br).',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/',
    latitude: -30.0346,
    longitude: -51.2177,
    active: true,
    ordem: 7,
    station_id: 'portoalegre-st1',
    current_level: 1.53,
    trend: 'estavel',
    rate_of_change: 0.00,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 1.50,
    attention_level: 2.10,
    alert_level: 2.50,
    flood_level: 3.00
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    name: 'São Leopoldo',
    slug: 'saoleopoldo',
    river: 'Rio dos Sinos',
    basin: 'guaiba',
    description: 'Estação do Rio dos Sinos em São Leopoldo (nivelguaiba.com.br/saoleopoldo).',
    image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/saoleopoldo',
    latitude: -29.7603,
    longitude: -51.1472,
    active: true,
    ordem: 8,
    station_id: 'saoleopoldo-st1',
    current_level: 2.39,
    trend: 'estavel',
    rate_of_change: 0.00,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 2.50,
    attention_level: 3.20,
    alert_level: 3.80,
    flood_level: 4.50
  },
  {
    id: '10000000-0000-4000-8000-000000000013',
    name: 'Gravataí',
    slug: 'gravatai',
    river: 'Rio Gravataí',
    basin: 'guaiba',
    description: 'Estação de medição do Rio Gravataí (nivelguaiba.com.br/gravatai).',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/gravatai',
    latitude: -29.9419,
    longitude: -51.0022,
    active: true,
    ordem: 9,
    station_id: 'gravatai-st1',
    current_level: 2.10,
    trend: 'estavel',
    rate_of_change: 0.00,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 2.50,
    attention_level: 3.25,
    alert_level: 4.00,
    flood_level: 4.75
  },
  {
    id: '10000000-0000-4000-8000-000000000017',
    name: 'Montenegro',
    slug: 'montenegro',
    river: 'Rio Caí',
    basin: 'guaiba',
    description: 'Estação do Rio Caí em Montenegro (nivelguaiba.com.br/montenegro).',
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/montenegro',
    latitude: -29.6889,
    longitude: -51.4611,
    active: true,
    ordem: 10,
    station_id: 'montenegro-st1',
    current_level: 3.80,
    trend: 'descendo',
    rate_of_change: -0.05,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 4.50,
    attention_level: 6.00,
    alert_level: 7.00,
    flood_level: 8.00
  },
  {
    id: '10000000-0000-4000-8000-000000000012',
    name: 'São Sebastião do Caí',
    slug: 'saosebastiaodocai',
    river: 'Rio Caí',
    basin: 'guaiba',
    description: 'Estação do Rio Caí em São Sebastião do Caí (nivelguaiba.com.br/saosebastiaodocai).',
    image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/saosebastiaodocai',
    latitude: -29.5872,
    longitude: -51.3781,
    active: true,
    ordem: 11,
    station_id: 'saosebastiaodocai-st1',
    current_level: 5.36,
    trend: 'descendo',
    rate_of_change: -0.06,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 5.50,
    attention_level: 7.00,
    alert_level: 8.50,
    flood_level: 10.00
  },
  {
    id: '10000000-0000-4000-8000-000000000018',
    name: 'Taquari',
    slug: 'taquari',
    river: 'Rio Taquari',
    basin: 'guaiba',
    description: 'Estação do Rio Taquari no município de Taquari (nivelguaiba.com.br/taquari).',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/taquari',
    latitude: -29.7997,
    longitude: -51.8592,
    active: true,
    ordem: 12,
    station_id: 'taquari-st1',
    current_level: 4.80,
    trend: 'descendo',
    rate_of_change: -0.08,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 5.00,
    attention_level: 7.00,
    alert_level: 9.00,
    flood_level: 11.00
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    name: 'Taquara',
    slug: 'taquara',
    river: 'Rio dos Sinos',
    basin: 'guaiba',
    description: 'Estação do Rio dos Sinos em Taquara (nivelguaiba.com.br/taquara).',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/taquara',
    latitude: -29.6511,
    longitude: -50.7812,
    active: true,
    ordem: 13,
    station_id: 'taquara-st1',
    current_level: 2.10,
    trend: 'estavel',
    rate_of_change: 0.00,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 3.00,
    attention_level: 4.00,
    alert_level: 5.00,
    flood_level: 6.00
  },
  {
    id: '10000000-0000-4000-8000-000000000014',
    name: 'Cachoeira do Sul',
    slug: 'cachoeiradosul',
    river: 'Rio Jacuí',
    basin: 'guaiba',
    description: 'Estação do Rio Jacuí em Cachoeira do Sul (nivelguaiba.com.br/cachoeiradosul).',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/cachoeiradosul',
    latitude: -30.0381,
    longitude: -52.8931,
    active: true,
    ordem: 14,
    station_id: 'cachoeira-st1',
    current_level: 8.63,
    trend: 'subindo',
    rate_of_change: 0.43,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 12.00,
    attention_level: 14.00,
    alert_level: 16.00,
    flood_level: 18.00
  },
  {
    id: '10000000-0000-4000-8000-000000000015',
    name: 'Dona Francisca',
    slug: 'donafrancisca',
    river: 'Rio Jacuí',
    basin: 'guaiba',
    description: 'Estação de monitoramento da Usina Dona Francisca no Rio Jacuí (nivelguaiba.com.br/donafrancisca).',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/donafrancisca',
    latitude: -29.6219,
    longitude: -53.3512,
    active: true,
    ordem: 15,
    station_id: 'donafrancisca-st1',
    current_level: 8.73,
    trend: 'descendo',
    rate_of_change: -0.04,
    status_level: 'inundacao',
    last_updated: 'Atualizando...',
    normal_level: 4.00,
    attention_level: 5.50,
    alert_level: 6.50,
    flood_level: 7.50
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    name: 'Feliz',
    slug: 'feliz',
    river: 'Rio Caí',
    basin: 'guaiba',
    description: 'Estação hidrométrica do Rio Caí no município de Feliz (nivelguaiba.com.br/feliz).',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    camera_url: 'https://nivelguaiba.com.br/feliz',
    latitude: -29.4528,
    longitude: -51.3056,
    active: true,
    ordem: 16,
    station_id: 'feliz-st1',
    current_level: 4.66,
    trend: 'descendo',
    rate_of_change: -0.13,
    status_level: 'normal',
    last_updated: 'Atualizando...',
    normal_level: 4.50,
    attention_level: 6.00,
    alert_level: 7.50,
    flood_level: 9.00
  }
];

// Populate thresholds from official CITY_THRESHOLDS catalog and ensure last_updated is set
INITIAL_CITIES.forEach((c) => {
  const th = getCityThresholds(c.name);
  c.normal_level = th.normal;
  c.attention_level = th.attention;
  c.alert_level = th.alert;
  c.flood_level = th.flood;
  if (!c.last_updated || c.last_updated === 'Atualizando...') {
    c.last_updated = getBrasiliaLastUpdatedString();
  }
});

export const INITIAL_STATIONS: Station[] = INITIAL_CITIES.map((c) => ({
  id: c.station_id || `${c.id}-st1`,
  city_id: c.id,
  name: `Estação Hidrométrica - ${c.name}`,
  code: `STA-${c.name.substring(0, 3).toUpperCase()}-01`,
  latitude: c.latitude,
  longitude: c.longitude,
  normal_level: c.normal_level,
  attention_level: c.attention_level,
  alert_level: c.alert_level,
  flood_level: c.flood_level,
  sensor_type: 'Radar Hidrométrico',
  precision_cm: 1.0,
  active: true,
  updated_at: '2025-07-29T10:35:00Z'
}));

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    city_id: 'lajeado',
    category: 'Defesa Civil',
    title: 'Defesa Civil monitora elevação do nível do Rio Taquari',
    summary: 'Equipes seguem em alerta devido à previsão de chuvas para os próximos dias na região alta da bacia.',
    content: 'A Defesa Civil Regional ativou o protocolo de monitoramento contínuo em virtude do volume pluvial acumulado na serra gaúcha. As leituras das últimas duas horas indicam uma taxa moderada de subida de 8 cm/h na estação de Lajeado.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    author: 'Defesa Civil Lajeado',
    date: 'há 2 horas',
    published: true
  },
  {
    id: 'news-2',
    city_id: 'lajeado',
    category: 'Prefeituras',
    title: 'Prefeitura de Lajeado reforça orientações à população',
    summary: 'Evite áreas de risco e fique atento aos comunicados oficiais da Defesa Civil do município.',
    content: 'A Prefeitura Municipal de Lajeado recomenda que moradores próximos à cota de atenção mantenham-se informados através deste portal oficial e sigam as rotas pré-estabelecidas caso haja alteração de cota.',
    image: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=600&q=80',
    author: 'Assessoria de Imprensa',
    date: 'há 5 horas',
    published: true
  },
  {
    id: 'news-3',
    city_id: 'mucum',
    category: 'Defesa Civil',
    title: 'Novo boletim meteorológico indica mais chuvas',
    summary: 'Previsão indica acumulado significativo entre quarta e sexta-feira nas cabeceiras dos rios.',
    content: 'Os modelos meteorológicos indicam nova frente fria trazendo acumulados entre 40mm e 80mm nas próximas 48 horas. Os radares mantêm a calha em estado de vigilância.',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    author: 'Defesa Civil Estadual',
    date: 'há 1 dia',
    published: true
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'alert-1',
    city_id: 'lajeado',
    city_name: 'Lajeado',
    title: 'Nível em Cota de Atenção (3,12 m)',
    description: 'O nível ultrapassou a cota de atenção de 3,00 metros. Monitore atualizações a cada 5 minutos.',
    level: 'atencao',
    active: true,
    created_at: '2025-07-29T08:00:00Z'
  },
  {
    id: 'alert-2',
    city_id: 'encantado',
    city_name: 'Encantado',
    title: 'Atenção na foz do Rio Forqueta',
    description: 'Subida constante acompanhando o fluxo montante de Muçum.',
    level: 'atencao',
    active: true,
    created_at: '2025-07-29T09:15:00Z'
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    level: 'info',
    service: 'riverCollector',
    message: 'Sincronização realizada com sucesso via fonte oficial.',
    details: { updated_cities: 7, response_time_ms: 142, source: 'niveldosrios.guerreirosdohumaita.com.br' },
    created_at: '2025-07-29T10:35:00Z'
  },
  {
    id: 'log-2',
    level: 'info',
    service: 'riverCollector',
    message: 'Nível registrado para Lajeado: 3,12 m (Tendência: subindo)',
    details: { station: 'Lajeado - Porto', level: 3.12 },
    created_at: '2025-07-29T10:30:00Z'
  }
];

// Generates realistic reading points for a city based on requested timeframe
export function generateHistoryForCity(cityId: string, currentLevel: number, timeframe: string = '24h') {
  const points = [];
  const now = new Date();
  const thresholds = getCityThresholds(cityId);

  let numSteps = 24;
  let stepIntervalMs = 60 * 60 * 1000; // 1 hour for 24h

  if (timeframe === '7d') {
    numSteps = 28; // Every 6 hours over 7 days
    stepIntervalMs = 6 * 60 * 60 * 1000;
  } else if (timeframe === '30d') {
    numSteps = 30; // Every day over 30 days
    stepIntervalMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === '12m') {
    numSteps = 52; // Every week over 12 months
    stepIntervalMs = 7 * 24 * 60 * 60 * 1000;
  } else if (timeframe === 'all') {
    numSteps = 60; // Every 12 days over 2 years
    stepIntervalMs = 12 * 24 * 60 * 60 * 1000;
  }

  for (let i = numSteps; i >= 0; i--) {
    const time = new Date(now.getTime() - i * stepIntervalMs);
    let timeStr = '';

    if (timeframe === '24h') {
      timeStr = time.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      timeStr = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }) + ' ' + time.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '30d') {
      timeStr = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
    } else if (timeframe === '12m') {
      timeStr = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short', year: '2-digit' });
    } else {
      timeStr = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    const progress = (numSteps - i) / numSteps;
    const wave1 = Math.sin(progress * Math.PI * 2) * 0.8;
    const wave2 = Math.cos(progress * Math.PI * 4) * 0.4;
    const baseLevel = Math.max(0.8, currentLevel - 1.2 + wave1 + wave2);
    const noise = (i === 0) ? 0 : (Math.sin(i * 0.7) * 0.05);
    const val = parseFloat((baseLevel + noise).toFixed(2));

    points.push({
      time: timeStr,
      timestamp: time.toISOString(),
      level: val,
      normal: thresholds.normal,
      attention: thresholds.attention,
      alert: thresholds.alert,
      flood: thresholds.flood
    });
  }

  return points;
}

export const INITIAL_SPONSORS: Sponsor[] = Array.from({ length: 20 }, (_, i) => ({
  id: `sponsor-${i + 1}`,
  name: `Patrocinador ${i + 1}`,
  logo_url: '',
  website: '',
  display_order: i + 1,
  active: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

export const INITIAL_CITY_CAMERAS: CityCamera[] = [
  // --- LAJEADO (3 CÂMERAS) ---
  {
    id: 'cam-lajeado-1',
    city_slug: 'lajeado',
    nome: 'Lajeado – Ponte BR-386 (Rio Taquari - Cam 1)',
    descricao: 'Monitoramento direto do fluxo d\'água e pilares da ponte da BR-386 entre Lajeado e Estrela.',
    url_stream: 'https://www.youtube.com/embed/LzBIB6nhh5U',
    url_thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Lajeado / Estrela - BR-386',
    latitude: -29.4678,
    longitude: -51.9614,
    ordem_exibicao: 1,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-lajeado-2',
    city_slug: 'lajeado',
    nome: 'Lajeado – Orla do Taquari / Parque do Engenho',
    descricao: 'Visão do leito do rio e nivelamento próximo às áreas urbanas ribeirinhas de Lajeado.',
    url_stream: 'https://www.youtube.com/embed/ylO0bn3ot4k',
    url_thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Lajeado - Orla / Centro',
    latitude: -29.4620,
    longitude: -51.9580,
    ordem_exibicao: 2,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-lajeado-3',
    city_slug: 'lajeado',
    nome: 'Lajeado – Ponto de Controle de Cheia',
    descricao: 'Ângulo ampliado de elevação e correnteza do Rio Taquari em tempo real.',
    url_stream: 'https://www.youtube.com/embed/Tk53sxWvn2g',
    url_thumbnail: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Lajeado - Ponto de Controle',
    latitude: -29.4650,
    longitude: -51.9600,
    ordem_exibicao: 3,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },

  // --- PORTO ALEGRE (6 CÂMERAS) ---
  {
    id: 'cam-poa-1',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Cais Mauá (Guaíba - Cam 1)',
    descricao: 'Monitoramento do nível do Lago Guaíba no Cais Mauá e pórticos centrais.',
    url_stream: 'https://www.youtube.com/embed/LzBIB6nhh5U',
    url_thumbnail: 'https://images.unsplash.com/photo-1511497584788-876761c11969?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Centro Histórico - Cais Mauá',
    latitude: -30.0277,
    longitude: -51.2287,
    ordem_exibicao: 1,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-poa-2',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Usina do Gasômetro',
    descricao: 'Visão panorâmica da Orla do Guaíba e Usina do Gasômetro.',
    url_stream: 'https://www.youtube.com/embed/ylO0bn3ot4k',
    url_thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Orla do Guaíba - Trecho 1',
    latitude: -30.0340,
    longitude: -51.2410,
    ordem_exibicao: 2,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-poa-3',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Ilha da Pintada',
    descricao: 'Acompanhamento do avanço do rio nas Ilhas de Porto Alegre.',
    url_stream: 'https://www.youtube.com/embed/Tk53sxWvn2g',
    url_thumbnail: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Arquipélago - Ilha da Pintada',
    latitude: -30.0200,
    longitude: -51.2550,
    ordem_exibicao: 3,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-poa-4',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Ilha dos Marinheiros',
    descricao: 'Monitoramento do leito d\'água no arquipélago urbano.',
    url_stream: 'https://www.youtube.com/embed/7zVgbMDkgio',
    url_thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Arquipélago - Ilha dos Marinheiros',
    latitude: -30.0150,
    longitude: -51.2600,
    ordem_exibicao: 4,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-poa-5',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Ponte do Guaíba (Travessia)',
    descricao: 'Visão do tráfego e cota da nova ponte sobre o Guaíba na BR-290.',
    url_stream: 'https://www.youtube.com/embed/AfgJqYFBOjw',
    url_thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'BR-290 - Ponte do Guaíba',
    latitude: -30.0050,
    longitude: -51.2200,
    ordem_exibicao: 5,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },
  {
    id: 'cam-poa-6',
    city_slug: 'porto-alegre',
    nome: 'Porto Alegre – Zona Sul / Orla de Ipanema',
    descricao: 'Visão do comportamento do Guaíba no calçadão de Ipanema.',
    url_stream: 'https://www.youtube.com/embed/LzBIB6nhh5U',
    url_thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Zona Sul - Ipanema',
    latitude: -30.1300,
    longitude: -51.2400,
    ordem_exibicao: 6,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },

  // --- MUÇUM (1 CÂMERA) ---
  {
    id: 'cam-mucum-1',
    city_slug: 'mucum',
    nome: 'Muçum – Ponte do Rio Taquari',
    descricao: 'Monitoramento da cabeceira e ponte ferroviária do Rio Taquari em Muçum.',
    url_stream: 'https://www.youtube.com/embed/AfgJqYFBOjw',
    url_thumbnail: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Muçum - Ponte Central',
    latitude: -29.1672,
    longitude: -51.8661,
    ordem_exibicao: 1,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  },

  // --- ESTRELA (1 CÂMERA) ---
  {
    id: 'cam-estrela-1',
    city_slug: 'estrela',
    nome: 'Estrela – Cais do Porto',
    descricao: 'Transmissão no Cais do Porto de Estrela, acompanhando a régua física e atracadouro.',
    url_stream: 'https://www.youtube.com/embed/AfgJqYFBOjw',
    url_thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    tipo: 'YouTube',
    localizacao: 'Estrela - Cais do Porto',
    latitude: -29.5000,
    longitude: -51.9667,
    ordem_exibicao: 1,
    ativo: true,
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }
];

export const INITIAL_SUBSCRIBERS: any[] = [
  {
    id: 'sub-001',
    nome_completo: 'Carlos Eduardo Silva',
    email: 'carlos.silva@gmail.com',
    whatsapp: '(51) 99876-1234',
    cidade: 'lajeado',
    bairro: 'Centro',
    rua: 'Rua Bento Gonçalves',
    numero: '450',
    complemento: 'Apto 201',
    cota_residencia: 19.5,
    receber_alertas: true,
    criado_em: '2026-05-10T14:20:00.000Z'
  },
  {
    id: 'sub-002',
    nome_completo: 'Mariana Santos Oliveira',
    email: 'mariana.oliveira@hotmail.com',
    whatsapp: '(51) 99123-4567',
    cidade: 'lajeado',
    bairro: 'Centro',
    rua: 'Rua Júlio de Castilhos',
    numero: '890',
    complemento: 'Casa',
    cota_residencia: 18.0,
    receber_alertas: true,
    criado_em: '2026-05-12T09:15:00.000Z'
  },
  {
    id: 'sub-003',
    nome_completo: 'Roberto Albuquerque',
    email: 'roberto.alb@yahoo.com.br',
    whatsapp: '(51) 98456-7890',
    cidade: 'lajeado',
    bairro: 'Universitário',
    rua: 'Av. Senador Alberto Pasqualini',
    numero: '1200',
    complemento: 'Bloco B / 304',
    cota_residencia: 22.0,
    receber_alertas: true,
    criado_em: '2026-05-15T16:45:00.000Z'
  },
  {
    id: 'sub-004',
    nome_completo: 'Fernanda Lima',
    email: 'nanda.lima@outlook.com',
    whatsapp: '(51) 99765-4321',
    cidade: 'lajeado',
    bairro: 'Americano',
    rua: 'Rua Oswaldo Aranha',
    numero: '310',
    complemento: 'Sobrado',
    cota_residencia: 20.0,
    receber_alertas: true,
    criado_em: '2026-05-18T11:30:00.000Z'
  },
  {
    id: 'sub-005',
    nome_completo: 'João Pedro Schmidt',
    email: 'jpschmidt@gmail.com',
    whatsapp: '(51) 98112-2334',
    cidade: 'lajeado',
    bairro: 'Navegantes',
    rua: 'Rua Praia da Orla',
    numero: '105',
    complemento: 'Casa de madeira',
    cota_residencia: 17.5,
    receber_alertas: true,
    criado_em: '2026-05-20T08:00:00.000Z'
  },
  {
    id: 'sub-006',
    nome_completo: 'Luciana Becker',
    email: 'luciana.becker@uol.com.br',
    whatsapp: '(51) 99334-4556',
    cidade: 'lajeado',
    bairro: 'Conservas',
    rua: 'Rua Carlos Fett Filho',
    numero: '78',
    complemento: 'Fundos',
    cota_residencia: 19.0,
    receber_alertas: true,
    criado_em: '2026-05-22T10:10:00.000Z'
  },
  {
    id: 'sub-007',
    nome_completo: 'Anelise Schneider',
    email: 'anelise.sch@gmail.com',
    whatsapp: '(51) 99556-6778',
    cidade: 'estrela',
    bairro: 'Centro',
    rua: 'Rua Fernando Abott',
    numero: '220',
    complemento: 'Sala 3',
    cota_residencia: 19.0,
    receber_alertas: true,
    criado_em: '2026-05-25T13:40:00.000Z'
  },
  {
    id: 'sub-008',
    nome_completo: 'Marcelo Kich',
    email: 'marcelokich@gmail.com',
    whatsapp: '(51) 98778-8990',
    cidade: 'estrela',
    bairro: 'Imigrantes',
    rua: 'Rua Geraldo Pereira',
    numero: '512',
    complemento: '',
    cota_residencia: 21.0,
    receber_alertas: true,
    criado_em: '2026-05-28T17:15:00.000Z'
  },
  {
    id: 'sub-009',
    nome_completo: 'Cláudio Zang',
    email: 'claudio.zang@ig.com.br',
    whatsapp: '(51) 99900-1122',
    cidade: 'mucum',
    bairro: 'Centro',
    rua: 'Rua General Osório',
    numero: '140',
    complemento: 'Sobrado 02',
    cota_residencia: 18.5,
    receber_alertas: true,
    criado_em: '2026-06-01T09:00:00.000Z'
  },
  {
    id: 'sub-010',
    nome_completo: 'Beatriz Farias',
    email: 'bia.farias@hotmail.com',
    whatsapp: '(51) 98223-3445',
    cidade: 'encantado',
    bairro: 'Navegantes',
    rua: 'Rua Guerino Lucca',
    numero: '300',
    complemento: 'Casa',
    cota_residencia: 19.2,
    receber_alertas: true,
    criado_em: '2026-06-03T11:20:00.000Z'
  },
  {
    id: 'sub-011',
    nome_completo: 'Valdir Fontana',
    email: 'valdir.fontana@terra.com.br',
    whatsapp: '(51) 99445-5667',
    cidade: 'roca-sales',
    bairro: 'Centro',
    rua: 'Rua Emílio Chaves',
    numero: '85',
    complemento: 'Apto 101',
    cota_residencia: 16.8,
    receber_alertas: true,
    criado_em: '2026-06-05T15:00:00.000Z'
  },
  {
    id: 'sub-012',
    nome_completo: 'Gisele Rossi',
    email: 'gi.rossi@gmail.com',
    whatsapp: '(51) 98667-7889',
    cidade: 'porto-alegre',
    bairro: 'Menino Deus',
    rua: 'Av. Praia de Belas',
    numero: '1450',
    complemento: 'Apto 702',
    cota_residencia: 3.2,
    receber_alertas: true,
    criado_em: '2026-06-08T18:30:00.000Z'
  },
  {
    id: 'sub-013',
    nome_completo: 'Henrique Dornelles',
    email: 'henrique.dornelles@ufrgs.br',
    whatsapp: '(51) 99889-9001',
    cidade: 'porto-alegre',
    bairro: 'Sarandi',
    rua: 'Rua Francisco Silveira Bitencourt',
    numero: '890',
    complemento: 'Casa',
    cota_residencia: 2.8,
    receber_alertas: true,
    criado_em: '2026-06-10T08:45:00.000Z'
  },
  {
    id: 'sub-014',
    nome_completo: 'Juliana Costa',
    email: 'ju.costa@gmail.com',
    whatsapp: '(51) 99112-3344',
    cidade: 'lajeado',
    bairro: 'Olarias',
    rua: 'Rua Cristiano Schneider',
    numero: '67',
    complemento: 'Fundos',
    cota_residencia: 20.35,
    receber_alertas: false,
    criado_em: '2026-06-12T10:00:00.000Z'
  },
  {
    id: 'sub-015',
    nome_completo: 'Sérgio Ramos',
    email: 'sergio.ramos@bol.com.br',
    whatsapp: '(51) 98334-5566',
    cidade: 'cruzeiro-do-sul',
    bairro: 'Paso de Estrela',
    rua: 'Rua São Rafael',
    numero: '410',
    complemento: '',
    cota_residencia: 19.8,
    receber_alertas: true,
    criado_em: '2026-06-15T14:10:00.000Z'
  }
];

