import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { CITY_THRESHOLDS, getCityThresholds } from '../../src/data/cityThresholds.js';

dotenv.config();

// Configurações de Ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const DATA_SOURCES = [
  {
    name: 'niveldosrios.guerreirosdohumaita.com.br',
    url: (process.env.OFFICIAL_SOURCE_URL || 'https://niveldosrios.guerreirosdohumaita.com.br/').replace(/\/$/, '')
  },
  {
    name: 'nivelguaiba.com.br',
    url: (process.env.GUAIBASOURCE_URL || 'https://nivelguaiba.com.br/').replace(/\/$/, '')
  }
];

// Compatibility single source URL
const OFFICIAL_SOURCE_URL = DATA_SOURCES[0].url;

// Verifica se há configuração real do Supabase
const isSupabaseRealConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes('your-supabase-project') &&
  !SUPABASE_URL.includes('seu-projeto') &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_SERVICE_ROLE_KEY.includes('sua-chave')
);

// Inicialização do cliente Supabase quando houver credenciais reais
const supabase = isSupabaseRealConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

interface StationPayload {
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

interface DBStation {
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

interface DBCity {
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
}

// Auxiliar de validação de UUID
export function isValidUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
}

// CATÁLOGO OFICIAL DE CIDADES DO SISTEMA (IDs E SLUGS CANÔNICOS FIXOS E BACIA OFICIAL)
export const OFFICIAL_CATALOG_CITIES: DBCity[] = [
  // VALE DO TAQUARI
  { id: '10000000-0000-4000-8000-000000000000', name: 'Santa Tereza', slug: 'santatereza', river: 'Rio Taquari', basin: 'taquari', normal_level: 4.0, attention_level: 6.0, alert_level: 8.0, flood_level: 10.0, latitude: -29.1678, longitude: -51.7331, active: true, ordem: 0 },
  { id: '10000000-0000-4000-8000-000000000001', name: 'Muçum', slug: 'mucum', river: 'Rio Taquari', basin: 'taquari', normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0, latitude: -29.1672, longitude: -51.8661, active: true, ordem: 1 },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Encantado', slug: 'encantado', river: 'Rio Taquari', basin: 'taquari', normal_level: 6.0, attention_level: 8.0, alert_level: 10.0, flood_level: 12.0, latitude: -29.2372, longitude: -51.8708, active: true, ordem: 2 },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Roca Sales', slug: 'rocasales', river: 'Rio Taquari', basin: 'taquari', normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0, latitude: -29.2811, longitude: -51.8672, active: true, ordem: 3 },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Lajeado', slug: 'lajeado', river: 'Rio Taquari', basin: 'taquari', normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0, latitude: -29.4678, longitude: -51.9614, active: true, ordem: 4 },
  { id: '10000000-0000-4000-8000-000000000005', name: 'Estrela', slug: 'estrela', river: 'Rio Taquari', basin: 'taquari', normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0, latitude: -29.5011, longitude: -51.9614, active: true, ordem: 5 },
  { id: '10000000-0000-4000-8000-000000000007', name: 'Bom Retiro do Sul', slug: 'bomretirodosul', river: 'Rio Taquari', basin: 'taquari', normal_level: 13.0, attention_level: 15.0, alert_level: 17.0, flood_level: 19.0, latitude: -29.6019, longitude: -51.9482, active: true, ordem: 6 },
  // BACIA DO GUAÍBA
  { id: '10000000-0000-4000-8000-000000000008', name: 'Porto Alegre', slug: 'portoalegre', river: 'Rio Guaíba', basin: 'guaiba', normal_level: 1.5, attention_level: 2.1, alert_level: 2.5, flood_level: 3.0, latitude: -30.0346, longitude: -51.2177, active: true, ordem: 7 },
  { id: '10000000-0000-4000-8000-000000000009', name: 'São Leopoldo', slug: 'saoleopoldo', river: 'Rio dos Sinos', basin: 'guaiba', normal_level: 2.5, attention_level: 3.2, alert_level: 3.8, flood_level: 4.5, latitude: -29.7603, longitude: -51.1472, active: true, ordem: 8 },
  { id: '10000000-0000-4000-8000-000000000013', name: 'Gravataí', slug: 'gravatai', river: 'Rio Gravataí', basin: 'guaiba', normal_level: 2.5, attention_level: 3.25, alert_level: 4.0, flood_level: 4.75, latitude: -29.9444, longitude: -50.9919, active: true, ordem: 9 },
  { id: '10000000-0000-4000-8000-000000000017', name: 'Montenegro', slug: 'montenegro', river: 'Rio Caí', basin: 'guaiba', normal_level: 4.5, attention_level: 6.0, alert_level: 7.0, flood_level: 8.0, latitude: -29.6889, longitude: -51.4611, active: true, ordem: 10 },
  { id: '10000000-0000-4000-8000-000000000012', name: 'São Sebastião do Caí', slug: 'saosebastiaodocai', river: 'Rio Caí', basin: 'guaiba', normal_level: 5.5, attention_level: 7.0, alert_level: 8.5, flood_level: 10.0, latitude: -29.5872, longitude: -51.3767, active: true, ordem: 11 },
  { id: '10000000-0000-4000-8000-000000000018', name: 'Taquari', slug: 'taquari', river: 'Rio Taquari', basin: 'guaiba', normal_level: 5.0, attention_level: 7.0, alert_level: 9.0, flood_level: 11.0, latitude: -29.7997, longitude: -51.8592, active: true, ordem: 12 },
  { id: '10000000-0000-4000-8000-000000000010', name: 'Taquara', slug: 'taquara', river: 'Rio dos Sinos', basin: 'guaiba', normal_level: 3.0, attention_level: 4.0, alert_level: 5.0, flood_level: 6.0, latitude: -29.6506, longitude: -50.7803, active: true, ordem: 13 },
  { id: '10000000-0000-4000-8000-000000000014', name: 'Cachoeira do Sul', slug: 'cachoeiradosul', river: 'Rio Jacuí', basin: 'guaiba', normal_level: 12.0, attention_level: 14.0, alert_level: 16.0, flood_level: 18.0, latitude: -30.0392, longitude: -52.8933, active: true, ordem: 14 },
  { id: '10000000-0000-4000-8000-000000000015', name: 'Dona Francisca', slug: 'donafrancisca', river: 'Rio Jacuí', basin: 'guaiba', normal_level: 4.0, attention_level: 5.5, alert_level: 6.5, flood_level: 7.5, latitude: -29.6169, longitude: -53.3628, active: true, ordem: 15 },
  { id: '10000000-0000-4000-8000-000000000011', name: 'Feliz', slug: 'feliz', river: 'Rio Caí', basin: 'guaiba', normal_level: 4.5, attention_level: 6.0, alert_level: 7.5, flood_level: 9.0, latitude: -29.4517, longitude: -51.3050, active: true, ordem: 16 }
];

// Populate official catalog thresholds from central cityThresholds
OFFICIAL_CATALOG_CITIES.forEach((c) => {
  const th = getCityThresholds(c.name);
  c.normal_level = th.normal;
  c.attention_level = th.attention;
  c.alert_level = th.alert;
  c.flood_level = th.flood;
});

const MOCK_INITIAL_STATIONS: DBStation[] = OFFICIAL_CATALOG_CITIES.map((city, idx) => {
  const hexIdx = idx.toString(16).padStart(12, '0');
  return {
    id: `20000000-0000-4000-8000-${hexIdx}`,
    city_id: city.id,
    name: `${city.name} - Estação Central`,
    code: `${city.slug}-st1`,
    latitude: city.latitude,
    longitude: city.longitude,
    normal_level: city.normal_level,
    attention_level: city.attention_level,
    alert_level: city.alert_level,
    flood_level: city.flood_level,
    active: true,
    city
  };
});

function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Mapeamento rígido de apelidos/variações de nomes para o slug oficial
const CITY_ALIASES: Record<string, string> = {
  // Santa Tereza
  'santatereza': 'santatereza',
  'santaterezamontante': 'santatereza',
  'riosantatereza': 'santatereza',
  'estacaosantatereza': 'santatereza',

  // Muçum
  'mucum': 'mucum',
  'mucumcentro': 'mucum',
  'estacaomucum': 'mucum',

  // Encantado
  'encantado': 'encantado',
  'encantadoponte': 'encantado',
  'estacaoencantado': 'encantado',

  // Roca Sales
  'rocasales': 'rocasales',
  'estacaorocasales': 'rocasales',

  // Lajeado
  'lajeado': 'lajeado',
  'lajeadoporto': 'lajeado',
  'portodelajeado': 'lajeado',
  'lajeadocentros': 'lajeado',
  'estacaolajeado': 'lajeado',

  // Estrela
  'estrela': 'estrela',
  'estrelataquari': 'estrela',

  // Bom Retiro do Sul
  'bomretirodosul': 'bomretirodosul',
  'bomretiro': 'bomretirodosul',
  'barragembomretiro': 'bomretirodosul',

  // Porto Alegre
  'portoalegre': 'portoalegre',
  'guaiba': 'portoalegre',

  // São Leopoldo
  'saoleopoldo': 'saoleopoldo',

  // Taquara
  'taquara': 'taquara',

  // Feliz
  'feliz': 'feliz',

  // São Sebastião do Caí
  'saosebastiaodocai': 'saosebastiaodocai',

  // Gravataí
  'gravatai': 'gravatai',

  // Cachoeira do Sul
  'cachoeiradosul': 'cachoeiradosul',

  // Dona Francisca
  'donafrancisca': 'donafrancisca'
};

interface OfficialCityMatch {
  city: DBCity;
  matchedBy: 'alias' | 'exact_id' | 'exact_slug' | 'exact_name' | 'partial';
  rawInput: string;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
  * Resolve qualquer nome ou slug vindo da fonte externa para uma cidade oficial do catálogo.
  */
export function findOfficialCityMatch(rawInput: string, lat?: number, lng?: number): OfficialCityMatch | null {
  const norm = normalizeKey(rawInput);
  
  // 1. Verificação direta por id, slug ou nome normalizado das cidades oficiais
  if (norm) {
    for (const city of OFFICIAL_CATALOG_CITIES) {
      if (normalizeKey(city.id) === norm) {
        return { city, matchedBy: 'exact_id', rawInput };
      }
      if (normalizeKey(city.slug) === norm) {
        return { city, matchedBy: 'exact_slug', rawInput };
      }
      if (normalizeKey(city.name) === norm) {
        return { city, matchedBy: 'exact_name', rawInput };
      }
    }

    // 2. Verificação no mapa de apelidos/variações de nomes
    const canonicalSlug = CITY_ALIASES[norm];
    if (canonicalSlug) {
      const found = OFFICIAL_CATALOG_CITIES.find((c) => c.slug === canonicalSlug);
      if (found) {
        return { city: found, matchedBy: 'alias', rawInput };
      }
    }
  }

  // 3. Verificação por proximidade geográfica (raio 15km)
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    let closestCity: DBCity | null = null;
    let minDistance = 15;
    for (const city of OFFICIAL_CATALOG_CITIES) {
      const dist = haversineDistance(lat, lng, city.latitude, city.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = city;
      }
    }
    if (closestCity) {
      return { city: closestCity, matchedBy: 'partial', rawInput: `${rawInput} (geo:${lat},${lng})` };
    }
  }

  // 4. Verificação por inclusão parcial (ex: "lajeado - porto" contendo "lajeado")
  if (norm) {
    for (const city of OFFICIAL_CATALOG_CITIES) {
      const cNorm = normalizeKey(city.name);
      const sNorm = normalizeKey(city.slug);
      if (norm.includes(sNorm) || norm.includes(cNorm) || sNorm.includes(norm)) {
        return { city, matchedBy: 'partial', rawInput };
      }
    }
  }

  return null;
}

function findOfficialCity(rawInput: string): DBCity | null {
  const match = findOfficialCityMatch(rawInput);
  return match ? match.city : null;
}

/**
 * Requisição HTTP com mecanismo de retry e backoff exponencial
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = 3, initialDelayMs: number = 1000): Promise<Response> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`[river-updater] [Tentativa ${attempt}/${maxRetries}] Consultando fonte oficial ${url}...`);
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      if (response.status >= 500 || response.status === 429) {
        console.warn(`[river-updater] Erro temporário na resposta HTTP (${response.status}). Aguardando ${delay}ms...`);
      } else {
        throw new Error(`Falha HTTP ${response.status} ao acessar fonte oficial.`);
      }
    } catch (err: any) {
      if (attempt >= maxRetries) {
        throw new Error(`Falha após ${maxRetries} tentativas: ${err.message}`);
      }
      console.warn(`[river-updater] Erro na requisição: ${err.message}. Retentando em ${delay}ms...`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }

  throw new Error(`Excedido o número máximo de retentativas para ${url}`);
}

interface HealthCheckResult {
  healthStatus: 'sucesso' | 'warning' | 'erro';
  timeSinceLastMeasurementMinutes: number | null;
  latestMeasurementIso: string | null;
  oldestMeasurementIso: string | null;
  updatedStationsCount: number;
  totalCatalogCities: number;
  missingCities: Array<{ id: string; name: string }>;
  communicationOk: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Avalia a saúde e integridade preventiva da sincronização
 */
function evaluateSyncHealth(
  catalogCities: DBCity[],
  stationsPayload: StationPayload[],
  activeLinkedCityIds: Set<string>,
  fetchError: Error | null
): HealthCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Falhas de comunicação com a fonte oficial
  const communicationOk = fetchError === null && stationsPayload.length > 0;
  if (fetchError) {
    errors.push(`Falha de comunicação com a fonte oficial: ${fetchError.message}`);
  } else if (stationsPayload.length === 0) {
    errors.push('A fonte oficial retornou uma lista vazia de medições (0 estações).');
  }

  // 2. Tempo desde a última medição recebida
  let latestTs: number | null = null;
  let oldestTs: number | null = null;

  for (const st of stationsPayload) {
    if (st.ts) {
      const timeMs = new Date(st.ts).getTime();
      if (!isNaN(timeMs)) {
        if (latestTs === null || timeMs > latestTs) latestTs = timeMs;
        if (oldestTs === null || timeMs < oldestTs) oldestTs = timeMs;
      }
    }
  }

  let timeSinceLastMeasurementMinutes: number | null = null;
  let latestMeasurementIso: string | null = null;
  let oldestMeasurementIso: string | null = null;

  if (latestTs !== null) {
    latestMeasurementIso = new Date(latestTs).toISOString();
    oldestMeasurementIso = oldestTs !== null ? new Date(oldestTs).toISOString() : null;
    timeSinceLastMeasurementMinutes = Math.round((Date.now() - latestTs) / (1000 * 60));

    // Alerta se a medição mais recente for mais antiga do que 120 minutos
    if (timeSinceLastMeasurementMinutes > 120) {
      warnings.push(`Telemetria defasada: a medição mais recente recebida foi registrada há ${timeSinceLastMeasurementMinutes} minutos.`);
    }
  } else if (communicationOk) {
    warnings.push('Nenhuma medição recebida continha um campo de data/hora (timestamp) válido.');
  }

  // 3. Cidades sem dados recentes
  const missingCities = catalogCities
    .filter(city => !activeLinkedCityIds.has(city.id) && !activeLinkedCityIds.has(city.slug))
    .map(city => ({ id: city.id, name: city.name }));

  if (missingCities.length > 0) {
    const missingNames = missingCities.map(c => c.name).join(', ');
    warnings.push(`${missingCities.length} cidade(s) do catálogo sem dados recentes na coleta atual: ${missingNames}`);
  }

  // 4. Quantidade de estações atualizadas
  const totalCatalogCities = catalogCities.length;
  const updatedStationsCount = totalCatalogCities - missingCities.length;

  if (updatedStationsCount < totalCatalogCities && communicationOk) {
    warnings.push(`Atualização parcial: apenas ${updatedStationsCount} de ${totalCatalogCities} cidades foram atualizadas.`);
  }

  // Determinação do status de saúde final
  let healthStatus: 'sucesso' | 'warning' | 'erro' = 'sucesso';
  if (errors.length > 0) {
    healthStatus = 'erro';
  } else if (warnings.length > 0) {
    healthStatus = 'warning';
  }

  return {
    healthStatus,
    timeSinceLastMeasurementMinutes,
    latestMeasurementIso,
    oldestMeasurementIso,
    updatedStationsCount,
    totalCatalogCities,
    missingCities,
    communicationOk,
    warnings,
    errors
  };
}

function formatLastUpdated(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `Atualizado às ${timeStr}`;
}

interface SyncCleanAudit {
  duplicateCitiesRemoved: number;
  duplicateCitiesDetails: string[];
  relinkedRecordsCount: number;
}

/**
 * Consolida registros duplicados no Supabase e garante id/slug oficiais.
 */
async function syncAndCleanSupabaseTables(): Promise<{
  dbCities: DBCity[];
  dbStations: DBStation[];
  audit: SyncCleanAudit;
}> {
  const audit: SyncCleanAudit = {
    duplicateCitiesRemoved: 0,
    duplicateCitiesDetails: [],
    relinkedRecordsCount: 0
  };

  if (!isSupabaseRealConfigured || !supabase) {
    return {
      dbCities: OFFICIAL_CATALOG_CITIES,
      dbStations: MOCK_INITIAL_STATIONS,
      audit
    };
  }

  console.log('[river-updater] 1. Garantindo integridade das tabelas `cities` e `stations` no Supabase...');

  // 1. Sincroniza todas as cidades oficiais no Supabase com id (UUID) e slug canônicos
  const { data: existingDbCities } = await supabase.from('cities').select('id, slug');
  const existingSlugsSet = new Set((existingDbCities || []).map(c => c.slug));

  for (const city of OFFICIAL_CATALOG_CITIES) {
    const cityData: any = {
      name: city.name,
      slug: city.slug,
      river: city.river,
      latitude: city.latitude,
      longitude: city.longitude,
      active: true,
      ordem: city.ordem
    };
    if (isValidUuid(city.id)) {
      cityData.id = city.id;
    }

    // Se a cidade não existe no banco, inclui cotas iniciais do catálogo estático
    if (!existingSlugsSet.has(city.slug)) {
      cityData.normal_level = city.normal_level;
      cityData.attention_level = city.attention_level;
      cityData.alert_level = city.alert_level;
      cityData.flood_level = city.flood_level;
    } else {
      // Nunca atualizar estes campos se a cidade já existe
      delete cityData.normal_level;
      delete cityData.attention_level;
      delete cityData.alert_level;
      delete cityData.flood_level;
    }

    await supabase.from('cities').upsert(cityData, { onConflict: 'slug' });
  }

  // 2. Busca todas as cidades atualmente no banco para obter os registros e UUIDs oficiais
  const { data: rawCitiesData } = await supabase.from('cities').select('*');
  const allCitiesInDb = (rawCitiesData as DBCity[]) || [];

  const citiesBySlugInDb = new Map<string, DBCity>();
  for (const c of allCitiesInDb) {
    if (c.slug) citiesBySlugInDb.set(c.slug, c);
  }

  const officialSlugsSet = new Set(OFFICIAL_CATALOG_CITIES.map(c => c.slug));

  // Consolidar duplicatas e remover do banco qualquer cidade fora do catálogo oficial de 17 cidades
  for (const dbRow of allCitiesInDb) {
    if (!officialSlugsSet.has(dbRow.slug)) {
      const matchResult = findOfficialCityMatch(dbRow.slug || dbRow.name || dbRow.id);
      if (!matchResult) {
        console.warn(`[river-updater] Removendo cidade fora do catálogo oficial do banco: "${dbRow.name}" (${dbRow.slug})`);
        await supabase.from('river_levels').delete().eq('city_id', dbRow.id);
        await supabase.from('stations').delete().eq('city_id', dbRow.id);
        await supabase.from('cities').delete().eq('id', dbRow.id);
        audit.duplicateCitiesRemoved++;
        audit.duplicateCitiesDetails.push(`Removida cidade fora do catálogo oficial: "${dbRow.name}" (${dbRow.slug})`);
        continue;
      }

      const officialCatalog = matchResult.city;
      const officialDbCity = citiesBySlugInDb.get(officialCatalog.slug);
      const officialId = officialDbCity ? officialDbCity.id : officialCatalog.id;

      if (dbRow.id !== officialId && isValidUuid(officialId) && isValidUuid(dbRow.id)) {
        console.warn(`[river-updater] Remapeando registros da cidade duplicada: "${dbRow.name}" (${dbRow.id}) -> "${officialCatalog.name}" (${officialId})`);

        const { data: stData } = await supabase
          .from('stations')
          .update({ city_id: officialId })
          .eq('city_id', dbRow.id)
          .select('id');

        if (stData) audit.relinkedRecordsCount += stData.length;

        const { data: rlData } = await supabase
          .from('river_levels')
          .update({ city_id: officialId })
          .eq('city_id', dbRow.id)
          .select('id');

        if (rlData) audit.relinkedRecordsCount += rlData.length;

        await supabase.from('cities').delete().eq('id', dbRow.id);
        audit.duplicateCitiesRemoved++;
        audit.duplicateCitiesDetails.push(`Removida cidade duplicada/antiga "${dbRow.name}" (${dbRow.id}) -> Vinculada a "${officialCatalog.name}" (${officialId})`);
      }
    }
  }

  // Recarrega o estado limpo das cidades
  const { data: cleanCitiesData } = await supabase.from('cities').select('*');
  const cleanCitiesList = (cleanCitiesData as DBCity[]) || [];
  const cleanCitiesBySlugMap = new Map<string, DBCity>();
  for (const c of cleanCitiesList) {
    if (c.slug) cleanCitiesBySlugMap.set(c.slug, c);
  }

  // 3. Garante que cada cidade oficial tenha a sua estação primária no Supabase com city_id em UUID
  const canonicalStationIdsSet = new Set<string>();
  const cityToCanonicalStationMap = new Map<string, DBStation>();

  for (const catalogCity of OFFICIAL_CATALOG_CITIES) {
    const dbCity = cleanCitiesBySlugMap.get(catalogCity.slug) || catalogCity;
    const cityUuid = dbCity.id;

    if (!isValidUuid(cityUuid)) {
      console.warn(`[river-updater] Upsert da estação de "${catalogCity.name}" ignorado: city_id ("${cityUuid}") não é um UUID válido.`);
      continue;
    }

    const stationCode = `${catalogCity.slug}-st1`;
    const { data: upsertedStation } = await supabase.from('stations').upsert({
      city_id: cityUuid,
      name: `${catalogCity.name} - Estação Central`,
      code: stationCode,
      latitude: catalogCity.latitude,
      longitude: catalogCity.longitude,
      normal_level: catalogCity.normal_level || getCityThresholds(catalogCity).normal,
      attention_level: catalogCity.attention_level || getCityThresholds(catalogCity).attention,
      alert_level: catalogCity.alert_level || getCityThresholds(catalogCity).alert,
      flood_level: catalogCity.flood_level || getCityThresholds(catalogCity).flood,
      active: true
    }, { onConflict: 'code' }).select('*').single();

    if (upsertedStation) {
      canonicalStationIdsSet.add(upsertedStation.id);
      cityToCanonicalStationMap.set(cityUuid, upsertedStation as DBStation);
    }
  }

  // 4. Limpeza de estações duplicadas ou órfãs fora das 17 estações primárias
  const { data: currentStations } = await supabase.from('stations').select('*');
  const allDbStations = (currentStations as DBStation[]) || [];

  for (const st of allDbStations) {
    if (!canonicalStationIdsSet.has(st.id)) {
      console.warn(`[river-updater] Estação duplicada/antiga identificada para remoção: "${st.name}" (${st.id}, code: ${st.code})`);

      let targetCanonicalStation: DBStation | undefined;
      if (st.city_id && cityToCanonicalStationMap.has(st.city_id)) {
        targetCanonicalStation = cityToCanonicalStationMap.get(st.city_id);
      } else {
        const matchResult = findOfficialCityMatch(st.code || st.name || '');
        if (matchResult) {
          const dbCity = cleanCitiesBySlugMap.get(matchResult.city.slug);
          if (dbCity) targetCanonicalStation = cityToCanonicalStationMap.get(dbCity.id);
        }
      }

      if (targetCanonicalStation) {
        const { data: remappedLevels } = await supabase
          .from('river_levels')
          .update({ station_id: targetCanonicalStation.id, city_id: targetCanonicalStation.city_id })
          .eq('station_id', st.id)
          .select('id');

        if (remappedLevels) {
          audit.relinkedRecordsCount += remappedLevels.length;
        }
      } else {
        await supabase.from('river_levels').delete().eq('station_id', st.id);
      }

      await supabase.from('stations').delete().eq('id', st.id);
      audit.duplicateCitiesDetails.push(`Removida estação duplicada/antiga "${st.name}" (${st.id})`);
    }
  }

  // Reload final clean state
  const { data: finalCities } = await supabase.from('cities').select('*').order('ordem', { ascending: true });
  const { data: finalStations } = await supabase.from('stations').select('*').eq('active', true);

  return {
    dbCities: (finalCities as DBCity[]) || OFFICIAL_CATALOG_CITIES,
    dbStations: (finalStations as DBStation[]) || MOCK_INITIAL_STATIONS,
    audit
  };
}

/**
 * Busca medições diretamente dos endpoints reais de estações do nivelguaiba.com.br ({slug}.json)
 */
export async function fetchFromNivelGuaiba(baseUrl: string = 'https://nivelguaiba.com.br', catalogCities: DBCity[] = OFFICIAL_CATALOG_CITIES): Promise<StationPayload[]> {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const results: StationPayload[] = [];

  for (const city of catalogCities) {
    const fetchSlug = city.slug === 'estrela' ? 'lajeado' : city.slug;
    const jsonUrl = `${cleanBaseUrl}/${fetchSlug}.json`;
    const publicPageUrl = `${cleanBaseUrl}/${city.slug === 'portoalegre' ? '' : city.slug}`;
    try {
      const response = await fetchWithRetry(jsonUrl, {
        headers: {
          'User-Agent': 'RioTaquariHydrologicalUpdater/3.0 (NivelGuaibaSync)',
          'Accept': 'application/json'
        }
      }, 2, 800);

      const data = (await response.json()) as Record<string, number>;
      // 1. Ordene as chaves de data do JSON antes de selecionar a última medição
      const keys = Object.keys(data).sort();
      if (keys.length === 0) continue;

      const lastKey = keys[keys.length - 1];
      const latestLevel = Number(data[lastKey]);

      if (isNaN(latestLevel)) continue;

      let prevLevel = latestLevel;
      if (keys.length > 1) {
        const lookbackIdx = Math.max(0, keys.length - 5);
        const lookbackVal = Number(data[keys[lookbackIdx]]);
        if (!isNaN(lookbackVal)) prevLevel = lookbackVal;
      }

      const rate = Number((latestLevel - prevLevel).toFixed(2));
      let trend: 'subindo' | 'descendo' | 'estavel' = 'estavel';
      if (rate > 0.01) trend = 'subindo';
      else if (rate < -0.01) trend = 'descendo';

      let tsIso = new Date().toISOString();
      if (lastKey) {
        const parsed = new Date(lastKey.replace(' ', 'T'));
        if (!isNaN(parsed.getTime())) tsIso = parsed.toISOString();
      }

      results.push({
        city: city.name,
        slug: city.slug,
        source_slug: fetchSlug,
        source_url: publicPageUrl,
        api_endpoint: jsonUrl,
        level: latestLevel,
        rate,
        trend,
        ts: tsIso,
        source_origin: 'nivelguaiba.com.br'
      });
    } catch (err: any) {
      console.warn(`[river-updater] [nivelguaiba.com.br] Falha ao carregar endpoint ${jsonUrl}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Processo Principal de Sincronização Hidrológica
 */
async function runSync() {
  const startTime = Date.now();
  console.log(`[river-updater] =================================================`);
  console.log(`[river-updater] [${new Date().toISOString()}] INICIANDO CICLO DE TELEMETRIA`);
  console.log(`[river-updater] Fonte Oficial: ${OFFICIAL_SOURCE_URL}`);
  if (isSupabaseRealConfigured) {
    console.log(`[river-updater] Modo: BANCO SUPABASE CONECTADO (${SUPABASE_URL})`);
  } else {
    console.log(`[river-updater] Modo: SIMULAÇÃO LOCAL / VALIDAÇÃO DE FLUXO`);
  }
  console.log(`[river-updater] =================================================`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;
  const errors: string[] = [];

  const aliasNormalizations: Array<{ rawInput: string; officialName: string; matchedBy: string }> = [];
  const activeLinkedStationsSet = new Set<string>();
  const activeLinkedCityIdsSet = new Set<string>();

  try {
    // 1. PREPARAR E LIMPAR CATÁLOGO NO SUPABASE
    const { dbCities, dbStations, audit: auditClean } = await syncAndCleanSupabaseTables();
    console.log(`[river-updater] Cidades limpas no catálogo: ${dbCities.length} | Estações ativas: ${dbStations.length}`);

    // Mapeamento das cidades oficiais no banco indexado por SLUG
    const citiesBySlugMap = new Map<string, DBCity>();
    for (const c of dbCities) {
      if (c.slug) citiesBySlugMap.set(c.slug, c);
    }

    // Mapeamento de estações indexado por city_id (UUID) e por code
    const stationsByCityIdMap = new Map<string, DBStation>();
    const stationsByCodeMap = new Map<string, DBStation>();
    for (const st of dbStations) {
      if (st.city_id && !stationsByCityIdMap.has(st.city_id)) {
        stationsByCityIdMap.set(st.city_id, st);
      }
      if (st.code) {
        stationsByCodeMap.set(st.code, st);
      }
    }

    // 2. BUSCAR DADOS REAL-TIME DE MÚLTIPLAS FONTES OFICIAIS
    console.log(`[river-updater] 2. Consultando simultaneamente ${DATA_SOURCES.length} fontes oficiais...`);
    const fetchPromises = DATA_SOURCES.map(async (source) => {
      try {
        if (source.name.includes('nivelguaiba') || source.url.includes('nivelguaiba')) {
          console.log(`[river-updater] Consultando fonte [${source.name}] via endpoints de estação ({slug}.json)...`);
          const items = await fetchFromNivelGuaiba(source.url, dbCities);
          console.log(`[river-updater] Fonte [${source.name}] retornou ${items.length} medições de estações.`);
          return items;
        }

        const endpoint = `${source.url}/api/stations`;
        console.log(`[river-updater] Consultando [${source.name}]: ${endpoint}`);
        const response = await fetchWithRetry(endpoint, {
          headers: {
            'User-Agent': 'RioTaquariHydrologicalUpdater/3.0 (MultiSourceSync)',
            'Accept': 'application/json'
          }
        }, 2, 1200);

        const payload: any = await response.json();
        const items: StationPayload[] = Array.isArray(payload?.stations)
          ? payload.stations
          : Array.isArray(payload)
          ? payload
          : [];

        console.log(`[river-updater] Fonte [${source.name}] retornou ${items.length} medições.`);
        return items.map((st) => ({
          ...st,
          source_origin: source.name
        }));
      } catch (err: any) {
        console.warn(`[river-updater] Erro ao consultar fonte [${source.name}]: ${err.message}`);
        return [];
      }
    });

    const resultsNested = await Promise.all(fetchPromises);
    const stationsPayload: StationPayload[] = resultsNested.flat();

    console.log(`[river-updater] 2. Dados recebidos de todas as fontes: ${stationsPayload.length} medições em tempo real.`);

    // 3. PROCESSAR CADA MEDIÇÃO E GRAVAR EM `river_levels`
    console.log('[river-updater] 3. Sincronizando e atualizando `cities` -> `stations` -> `river_levels`...');

    for (const stPayload of stationsPayload) {
      try {
        const payloadCityName = stPayload.city || stPayload.name || '';
        const rawKey = stPayload.slug || payloadCityName;
        const sourceOrigin = stPayload.source_origin || 'niveldosrios.guerreirosdohumaita.com.br';

        if (!rawKey && typeof stPayload.lat !== 'number') continue;

        // 1. Resolver cidade canônica pelo slug/name ou coordenadas
        const matchResult = findOfficialCityMatch(rawKey, stPayload.lat, stPayload.lng);

        if (!matchResult) {
          console.warn(`[river-updater] Ignorando payload desconhecido e fora do catálogo oficial: "${rawKey}" (${sourceOrigin})`);
          continue;
        }

        const canonicalSlug = matchResult.city.slug;

        // 2. Buscar o registro oficial na tabela cities (pelo slug resolvido)
        const targetCity = citiesBySlugMap.get(canonicalSlug) || matchResult.city;

        // 3. Obter cities.id (UUID)
        const cityId = targetCity.id;

        // 4. Validação estrita de UUID antes da gravação
        if (!isValidUuid(cityId)) {
          const errMsg = `[ERRO DE VALIDAÇÃO UUID] city_id inválido ("${cityId}") para a cidade "${targetCity.name}" (slug: "${canonicalSlug}"). O insert em river_levels foi impedido.`;
          console.error(`[river-updater] ${errMsg}`);
          errors.push(errMsg);
          errorsCount++;
          continue;
        }

        // Registrar se foi feita normalização por alias/parcial
        if (
          matchResult.matchedBy === 'alias' ||
          matchResult.matchedBy === 'partial' ||
          normalizeKey(rawKey) !== normalizeKey(targetCity.name)
        ) {
          aliasNormalizations.push({
            rawInput: rawKey,
            officialName: targetCity.name,
            matchedBy: matchResult.matchedBy
          });
        }

        // 5. Obter a estação correspondente (stations)
        let matchedStation = stationsByCityIdMap.get(cityId) || stationsByCodeMap.get(`${canonicalSlug}-st1`);

        if (!matchedStation) {
          matchedStation = {
            id: `20000000-0000-4000-8000-${canonicalSlug.padEnd(12, '0').substring(0, 12)}`,
            city_id: cityId,
            name: `${targetCity.name} - Estação Central`,
            code: `${canonicalSlug}-st1`,
            latitude: targetCity.latitude,
            longitude: targetCity.longitude,
            normal_level: targetCity.normal_level || getCityThresholds(targetCity).normal,
            attention_level: targetCity.attention_level || getCityThresholds(targetCity).attention,
            alert_level: targetCity.alert_level || getCityThresholds(targetCity).alert,
            flood_level: targetCity.flood_level || getCityThresholds(targetCity).flood,
            active: true
          };
        }

        const stationId = matchedStation.id;

        if (!isValidUuid(stationId)) {
          const errMsg = `[ERRO DE VALIDAÇÃO UUID] station_id inválido ("${stationId}") para a estação "${matchedStation.name}". O insert em river_levels foi impedido.`;
          console.error(`[river-updater] ${errMsg}`);
          errors.push(errMsg);
          errorsCount++;
          continue;
        }

        activeLinkedStationsSet.add(stationId);
        activeLinkedCityIdsSet.add(cityId);
        activeLinkedCityIdsSet.add(canonicalSlug);
        if (targetCity.id) activeLinkedCityIdsSet.add(targetCity.id);
        if (matchResult.city.id) activeLinkedCityIdsSet.add(matchResult.city.id);

        const currentLevel = typeof stPayload.level === 'number' ? Number(stPayload.level.toFixed(2)) : 3.00;
        const rateInMeters = typeof stPayload.rate === 'number' ? Number((stPayload.rate / 100).toFixed(2)) : 0.00;
        const trend = stPayload.trend || (rateInMeters > 0.005 ? 'subindo' : rateInMeters < -0.005 ? 'descendo' : 'estavel');

        const th = getCityThresholds(targetCity);
        const floodThreshold = th.flood;
        const alertThreshold = th.alert;
        const attentionThreshold = th.attention;

        let statusLevel: 'normal' | 'atencao' | 'alerta' | 'inundacao' = stPayload.status || 'normal';
        if (currentLevel >= floodThreshold) statusLevel = 'inundacao';
        else if (currentLevel >= alertThreshold) statusLevel = 'alerta';
        else if (currentLevel >= attentionThreshold) statusLevel = 'atencao';

        const lastUpdatedText = formatLastUpdated();
        const recordedAt = stPayload.ts ? new Date(stPayload.ts).toISOString() : new Date().toISOString();

        if (isSupabaseRealConfigured && supabase) {
          // Atualiza registro na tabela `cities` usando o UUID correto (cityId), mantendo cotas e bacia oficiais
          const payload: Record<string, any> = {
            current_level: currentLevel,
            trend,
            rate_of_change: rateInMeters,
            status_level: statusLevel,
            last_updated: lastUpdatedText,
            updated_at: new Date().toISOString(),
            river: targetCity.river,
            basin: targetCity.basin,
            source_origin: sourceOrigin
          };

          // Nunca atualizar estes campos
          delete payload.normal_level;
          delete payload.attention_level;
          delete payload.alert_level;
          delete payload.flood_level;

          const { error: cityUpdateError } = await supabase
            .from('cities')
            .update(payload)
            .eq('id', cityId);

          if (cityUpdateError) {
            console.warn(`[river-updater] Erro ao atualizar cities (${targetCity.name}): ${cityUpdateError.message}`);
          }

          // Evita inserções duplicadas em `river_levels` dentro de um intervalo de 5 minutos
          const { data: lastReading } = await supabase
            .from('river_levels')
            .select('id, level, recorded_at')
            .eq('station_id', stationId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let isDuplicate = false;
          if (lastReading) {
            const lastTime = new Date(lastReading.recorded_at).getTime();
            const newTime = new Date(recordedAt).getTime();
            const timeDiffMinutes = Math.abs(newTime - lastTime) / (1000 * 60);

            if (lastReading.recorded_at === recordedAt || (timeDiffMinutes < 5 && Number(lastReading.level) === currentLevel)) {
              isDuplicate = true;
            }
          }

          if (isDuplicate) {
            skippedCount++;
          } else {
            // Grava river_levels com UUID correto, source_origin, basin e river_name!
            const levelPayload: any = {
              station_id: stationId,
              city_id: cityId,
              level: currentLevel,
              trend,
              rate_of_change: rateInMeters,
              recorded_at: recordedAt,
              source_origin: sourceOrigin,
              basin: targetCity.basin || 'taquari',
              river_name: targetCity.river || 'Rio Taquari'
            };

            let { error: levelInsertError } = await supabase
              .from('river_levels')
              .insert(levelPayload);

            if (levelInsertError && levelInsertError.message.includes('column')) {
              delete levelPayload.source_origin;
              delete levelPayload.basin;
              delete levelPayload.river_name;
              const resFallback = await supabase.from('river_levels').insert(levelPayload);
              levelInsertError = resFallback.error;
            }

            if (levelInsertError) {
              console.warn(`[river-updater] Erro ao gravar em river_levels (${matchedStation.name}): ${levelInsertError.message}`);
              errors.push(`Erro river_levels (${matchedStation.name}): ${levelInsertError.message}`);
              errorsCount++;
            } else {
              updatedCount++;
            }
          }
        } else {
          // Modo Simulação
          updatedCount++;
          console.log(`[river-updater] [MEDIDA] Cidade: ${targetCity.name.padEnd(18)} | Fonte: ${sourceOrigin.padEnd(38)} | Bacia: ${(targetCity.basin || '').padEnd(10)} | Nível: ${currentLevel.toFixed(2)}m | Status: ${statusLevel.toUpperCase()} | City UUID: ${cityId}`);
        }

      } catch (stError: any) {
        errorsCount++;
        const msg = `Erro no processamento da estação: ${stError.message}`;
        console.error(`[river-updater] ${msg}`);
        errors.push(msg);
      }
    }

    const durationMs = Date.now() - startTime;

    // 4. AVALIAÇÃO DO SISTEMA DE MONITORAMENTO DE SAÚDE
    const healthCheck = evaluateSyncHealth(OFFICIAL_CATALOG_CITIES, stationsPayload, activeLinkedCityIdsSet, null);

    // Determina o status final para o log (sucesso, warning ou erro)
    let finalStatus: 'sucesso' | 'warning' | 'erro' = 'sucesso';
    if (errorsCount > 0 || healthCheck.healthStatus === 'erro') {
      finalStatus = 'erro';
    } else if (healthCheck.healthStatus === 'warning') {
      finalStatus = 'warning';
    }

    const message = `Sincronização concluída com status [${finalStatus.toUpperCase()}]. ${updatedCount} medições processadas (${skippedCount} duplicatas desconsideradas) em ${durationMs}ms.`;

    console.log(`[river-updater] =================================================`);
    console.log(`[river-updater] RELATÓRIO DETALHADO DE INTEGRIDADE E SAÚDE DA EXECUÇÃO`);
    console.log(`[river-updater] -------------------------------------------------`);
    console.log(`[river-updater] • Cidades Oficiais Encontradas:   ${dbCities.length} (Catálogo Ativo: ${OFFICIAL_CATALOG_CITIES.length})`);
    console.log(`[river-updater] • Estações Vinculadas Ativas:    ${activeLinkedStationsSet.size} / ${dbStations.length}`);
    console.log(`[river-updater] • Medições Recebidas (Fonte):    ${stationsPayload.length}`);
    console.log(`[river-updater] • Normalizações por Alias:        ${aliasNormalizations.length}`);
    if (aliasNormalizations.length > 0) {
      aliasNormalizations.forEach(item => {
        console.log(`[river-updater]     - "${item.rawInput}" -> Cidade Oficial: ${item.officialName} (Mapeamento: ${item.matchedBy})`);
      });
    }
    console.log(`[river-updater] • Duplicatas Removidas/Evitadas: ${auditClean.duplicateCitiesRemoved} cidade(s) duplicada(s) limpa(s) | ${skippedCount} medição(ões) duplicada(s) ignorada(s)`);
    console.log(`[river-updater] • Vínculos Corrigidos no Banco:  ${auditClean.relinkedRecordsCount} registro(s) remapeado(s)`);
    console.log(`[river-updater] • Erros Encontrados:             ${errorsCount}`);
    if (errors.length > 0) {
      errors.forEach(err => console.log(`[river-updater]     - [ERRO] ${err}`));
    }
    console.log(`[river-updater] -------------------------------------------------`);
    console.log(`[river-updater] MONITORAMENTO PREVENTIVO DE SAÚDE DA SINCRONIZAÇÃO:`);
    console.log(`[river-updater] • Comunicação com Fonte Oficial: ${healthCheck.communicationOk ? 'OK (Sucesso)' : 'FALHA (Erro)'}`);
    console.log(`[river-updater] • Tempo desde Última Medição:   ${healthCheck.timeSinceLastMeasurementMinutes !== null ? `${healthCheck.timeSinceLastMeasurementMinutes} minuto(s) atrás (${healthCheck.latestMeasurementIso})` : 'Sem timestamp válido'}`);
    console.log(`[river-updater] • Estações/Cidades Atualizadas:  ${healthCheck.updatedStationsCount} / ${healthCheck.totalCatalogCities}`);
    console.log(`[river-updater] • Cidades Sem Dados Recentes:    ${healthCheck.missingCities.length > 0 ? healthCheck.missingCities.map(c => c.name).join(', ') : 'Nenhuma (100% atualizadas)'}`);
    if (healthCheck.warnings.length > 0) {
      console.log(`[river-updater] • Alertas de Saúde (WARNING):`);
      healthCheck.warnings.forEach(w => console.log(`[river-updater]     - [WARNING] ${w}`));
    }
    if (healthCheck.errors.length > 0) {
      console.log(`[river-updater] • Falhas de Saúde (ERROR):`);
      healthCheck.errors.forEach(e => console.log(`[river-updater]     - [ERROR] ${e}`));
    }
    console.log(`[river-updater] -------------------------------------------------`);
    console.log(`[river-updater] RESUMO GERAL: Status Final: ${finalStatus.toUpperCase()} | Tempo: ${durationMs}ms`);
    console.log(`[river-updater] =================================================`);

    if (isSupabaseRealConfigured && supabase) {
      await supabase.from('sync_logs').insert({
        sync_time: new Date().toISOString(),
        duration_ms: durationMs,
        updated_count: updatedCount,
        status: finalStatus,
        message,
        details: {
          officialCitiesCount: dbCities.length,
          activeCatalogCities: OFFICIAL_CATALOG_CITIES.length,
          linkedStationsCount: activeLinkedStationsSet.size,
          totalStationsInDb: dbStations.length,
          measurementsReceivedCount: stationsPayload.length,
          measurementsUpdatedCount: updatedCount,
          duplicateMeasurementsSkipped: skippedCount,
          duplicateCitiesRemovedCount: auditClean.duplicateCitiesRemoved,
          duplicateCitiesDetails: auditClean.duplicateCitiesDetails,
          relinkedRecordsCount: auditClean.relinkedRecordsCount,
          aliasNormalizationsCount: aliasNormalizations.length,
          aliasNormalizationsDetails: aliasNormalizations,
          errorsCount,
          errors,
          healthCheck,
          source: OFFICIAL_SOURCE_URL,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errorMessage = `Falha na execução do river-updater: ${error.message}`;
    console.error(`[river-updater] ${errorMessage}`);

    const healthCheck = evaluateSyncHealth(OFFICIAL_CATALOG_CITIES, [], new Set(), error);

    if (isSupabaseRealConfigured && supabase) {
      try {
        await supabase.from('sync_logs').insert({
          sync_time: new Date().toISOString(),
          duration_ms: durationMs,
          updated_count: 0,
          status: 'erro',
          message: errorMessage,
          details: {
            error: String(error.stack || error),
            healthCheck
          }
        });
      } catch (logErr) {
        console.error('[river-updater] Não foi possível gravar log em sync_logs:', logErr);
      }
    }

    process.exit(1);
  }
}

// Execução do serviço
runSync().then(() => {
  console.log('[river-updater] Serviço finalizado.');
  process.exit(0);
});
