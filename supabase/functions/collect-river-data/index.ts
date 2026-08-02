import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cotas Hidrológicas de Referência por Cidade
const CITY_THRESHOLDS: Record<string, { normal: number; attention: number; alert: number; flood: number }> = {
  'Santa Tereza': { normal: 4.0, attention: 6.0, alert: 8.0, flood: 10.0 },
  'Muçum': { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0 },
  'Encantado': { normal: 6.0, attention: 8.0, alert: 10.0, flood: 12.0 },
  'Roca Sales': { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0 },
  'Lajeado': { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0 },
  'Estrela': { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0 },
  'Bom Retiro do Sul': { normal: 13.0, attention: 15.0, alert: 17.0, flood: 19.0 },
  'Porto Alegre': { normal: 1.5, attention: 2.1, alert: 2.5, flood: 3.0 },
  'São Leopoldo': { normal: 2.5, attention: 3.2, alert: 3.8, flood: 4.5 },
  'Gravataí': { normal: 2.5, attention: 3.25, alert: 4.0, flood: 4.75 },
  'Montenegro': { normal: 4.5, attention: 6.0, alert: 7.0, flood: 8.0 },
  'São Sebastião do Caí': { normal: 5.5, attention: 7.0, alert: 8.5, flood: 10.0 },
  'Taquari': { normal: 5.0, attention: 7.0, alert: 9.0, flood: 11.0 },
  'Taquara': { normal: 3.0, attention: 4.0, alert: 5.0, flood: 6.0 },
  'Cachoeira do Sul': { normal: 12.0, attention: 14.0, alert: 16.0, flood: 18.0 },
  'Dona Francisca': { normal: 4.0, attention: 5.5, alert: 6.5, flood: 7.5 },
  'Feliz': { normal: 4.5, attention: 6.0, alert: 7.5, flood: 9.0 },
};

function getCityThresholds(cityName: string) {
  return CITY_THRESHOLDS[cityName] || { normal: 3.0, attention: 5.0, alert: 7.0, flood: 9.0 };
}

interface DBCity {
  id?: string;
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

// Catálogo Oficial sem UUIDs fixos (utiliza os IDs dinâmicos reais do banco de dados)
const OFFICIAL_CATALOG_CITIES: Omit<DBCity, 'id'>[] = [
  // VALE DO TAQUARI
  { name: 'Santa Tereza', slug: 'santatereza', river: 'Rio Taquari', basin: 'taquari', latitude: -29.1678, longitude: -51.7331, active: true, ordem: 0 },
  { name: 'Muçum', slug: 'mucum', river: 'Rio Taquari', basin: 'taquari', latitude: -29.1672, longitude: -51.8661, active: true, ordem: 1 },
  { name: 'Encantado', slug: 'encantado', river: 'Rio Taquari', basin: 'taquari', latitude: -29.2372, longitude: -51.8708, active: true, ordem: 2 },
  { name: 'Roca Sales', slug: 'rocasales', river: 'Rio Taquari', basin: 'taquari', latitude: -29.2811, longitude: -51.8672, active: true, ordem: 3 },
  { name: 'Lajeado', slug: 'lajeado', river: 'Rio Taquari', basin: 'taquari', latitude: -29.4678, longitude: -51.9614, active: true, ordem: 4 },
  { name: 'Estrela', slug: 'estrela', river: 'Rio Taquari', basin: 'taquari', latitude: -29.5011, longitude: -51.9614, active: true, ordem: 5 },
  { name: 'Bom Retiro do Sul', slug: 'bomretirodosul', river: 'Rio Taquari', basin: 'taquari', latitude: -29.6019, longitude: -51.9482, active: true, ordem: 6 },
  // BACIA DO GUAÍBA
  { name: 'Porto Alegre', slug: 'portoalegre', river: 'Rio Guaíba', basin: 'guaiba', latitude: -30.0346, longitude: -51.2177, active: true, ordem: 7 },
  { name: 'São Leopoldo', slug: 'saoleopoldo', river: 'Rio dos Sinos', basin: 'guaiba', latitude: -29.7603, longitude: -51.1472, active: true, ordem: 8 },
  { name: 'Gravataí', slug: 'gravatai', river: 'Rio Gravataí', basin: 'guaiba', latitude: -29.9444, longitude: -50.9919, active: true, ordem: 9 },
  { name: 'Montenegro', slug: 'montenegro', river: 'Rio Caí', basin: 'guaiba', latitude: -29.6889, longitude: -51.4611, active: true, ordem: 10 },
  { name: 'São Sebastião do Caí', slug: 'saosebastiaodocai', river: 'Rio Caí', basin: 'guaiba', latitude: -29.5872, longitude: -51.3767, active: true, ordem: 11 },
  { name: 'Taquari', slug: 'taquari', river: 'Rio Taquari', basin: 'guaiba', latitude: -29.7997, longitude: -51.8592, active: true, ordem: 12 },
  { name: 'Taquara', slug: 'taquara', river: 'Rio dos Sinos', basin: 'guaiba', latitude: -29.6506, longitude: -50.7803, active: true, ordem: 13 },
  { name: 'Cachoeira do Sul', slug: 'cachoeiradosul', river: 'Rio Jacuí', basin: 'guaiba', latitude: -30.0392, longitude: -52.8933, active: true, ordem: 14 },
  { name: 'Dona Francisca', slug: 'donafrancisca', river: 'Rio Jacuí', basin: 'guaiba', latitude: -29.6169, longitude: -53.3628, active: true, ordem: 15 },
  { name: 'Feliz', slug: 'feliz', river: 'Rio Caí', basin: 'guaiba', latitude: -29.4517, longitude: -51.3050, active: true, ordem: 16 }
];

OFFICIAL_CATALOG_CITIES.forEach((c) => {
  const th = getCityThresholds(c.name);
  c.normal_level = th.normal;
  c.attention_level = th.attention;
  c.alert_level = th.alert;
  c.flood_level = th.flood;
});

function isValidUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id.trim());
}

function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const CITY_ALIASES: Record<string, string> = {
  'santatereza': 'santatereza',
  'santaterezamontante': 'santatereza',
  'riosantatereza': 'santatereza',
  'estacaosantatereza': 'santatereza',
  'mucum': 'mucum',
  'mucumcentro': 'mucum',
  'estacaomucum': 'mucum',
  'encantado': 'encantado',
  'encantadoponte': 'encantado',
  'estacaoencantado': 'encantado',
  'rocasales': 'rocasales',
  'estacaorocasales': 'rocasales',
  'lajeado': 'lajeado',
  'lajeadoporto': 'lajeado',
  'portodelajeado': 'lajeado',
  'lajeadocentros': 'lajeado',
  'estacaolajeado': 'lajeado',
  'estrela': 'estrela',
  'estrelataquari': 'estrela',
  'bomretirodosul': 'bomretirodosul',
  'bomretiro': 'bomretirodosul',
  'barragembomretiro': 'bomretirodosul',
  'portoalegre': 'portoalegre',
  'guaiba': 'portoalegre',
  'saoleopoldo': 'saoleopoldo',
  'taquara': 'taquara',
  'feliz': 'feliz',
  'saosebastiaodocai': 'saosebastiaodocai',
  'gravatai': 'gravatai',
  'cachoeiradosul': 'cachoeiradosul',
  'donafrancisca': 'donafrancisca'
};

function findOfficialCityMatch(rawInput: string, catalogCities: DBCity[], lat?: number, lng?: number) {
  const norm = normalizeKey(rawInput);
  if (norm) {
    for (const city of catalogCities) {
      if (city.id && normalizeKey(city.id) === norm) return { city, matchedBy: 'exact_id', rawInput };
      if (normalizeKey(city.slug) === norm) return { city, matchedBy: 'exact_slug', rawInput };
      if (normalizeKey(city.name) === norm) return { city, matchedBy: 'exact_name', rawInput };
    }
    const canonicalSlug = CITY_ALIASES[norm];
    if (canonicalSlug) {
      const found = catalogCities.find((c) => c.slug === canonicalSlug);
      if (found) return { city: found, matchedBy: 'alias', rawInput };
    }
  }
  if (norm) {
    for (const city of catalogCities) {
      const cNorm = normalizeKey(city.name);
      const sNorm = normalizeKey(city.slug);
      if (norm.includes(sNorm) || norm.includes(cNorm) || sNorm.includes(norm)) {
        return { city, matchedBy: 'partial', rawInput };
      }
    }
  }
  return null;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  initialDelayMs: number = 800,
  timeoutMs: number = 10000
): Promise<Response> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      attempt++;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) return response;
      if (response.status >= 500 || response.status === 429) {
        // Retry
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn(`Timeout de ${timeoutMs}ms atingido para ${url}`);
      }
      if (attempt >= maxRetries) throw err;
    }
    await new Promise((res) => setTimeout(res, delay));
    delay *= 2;
  }
  throw new Error(`Max retries ou timeout excedido para ${url}`);
}

async function fetchFromNivelGuaiba(baseUrl: string = 'https://nivelguaiba.com.br', catalogCities: DBCity[] = []): Promise<StationPayload[]> {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  const fetchPromises = catalogCities.map(async (city) => {
    const fetchSlug = city.slug === 'estrela' ? 'lajeado' : city.slug;
    const jsonUrl = `${cleanBaseUrl}/${fetchSlug}.json`;
    const publicPageUrl = `${cleanBaseUrl}/${city.slug === 'portoalegre' ? '' : city.slug}`;
    try {
      const response = await fetchWithRetry(jsonUrl, {
        headers: { 'Accept': 'application/json' }
      }, 2, 800, 10000);

      const data = (await response.json()) as Record<string, number>;
      const keys = Object.keys(data).sort();
      if (keys.length === 0) return null;

      const lastKey = keys[keys.length - 1];
      const latestLevel = Number(data[lastKey]);
      if (isNaN(latestLevel)) return null;

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

      return {
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
      } as StationPayload;
    } catch {
      return null;
    }
  });

  const rawResults = await Promise.all(fetchPromises);
  return rawResults.filter((r): r is StationPayload => r !== null);
}

function formatLastUpdated(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `Atualizado às ${timeStr}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Método HTTP não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;
  let citiesUpdatedCount = 0;
  let sourcesSuccessCount = 0;
  let sourcesFailedCount = 0;
  const errors: string[] = [];

  const dataSources = [
    {
      name: 'niveldosrios.guerreirosdohumaita.com.br',
      url: (Deno.env.get('OFFICIAL_SOURCE_URL') || 'https://niveldosrios.guerreirosdohumaita.com.br/').replace(/\/$/, '')
    },
    {
      name: 'nivelguaiba.com.br',
      url: (Deno.env.get('GUAIBASOURCE_URL') || 'https://nivelguaiba.com.br/').replace(/\/$/, '')
    }
  ];

  try {
    // 1. Obter cidades existentes do banco sem forçar UUIDs fictícios
    const { data: existingCitiesRaw } = await supabase.from('cities').select('*');
    const existingCities = (existingCitiesRaw as DBCity[]) || [];
    const existingCitiesBySlug = new Map<string, DBCity>();

    for (const c of existingCities) {
      if (c.slug) existingCitiesBySlug.set(c.slug, c);
    }

    // 2. Garantir presença de todas as cidades do catálogo respeitando os IDs já gerados pelo banco
    const activeCities: DBCity[] = [];

    for (const catalogCity of OFFICIAL_CATALOG_CITIES) {
      let currentCity = existingCitiesBySlug.get(catalogCity.slug);

      if (!currentCity) {
        // Cidade não existe no banco -> faz upsert por slug e obtém o ID gerado pelo banco
        const { data: inserted, error: insertErr } = await supabase
          .from('cities')
          .upsert({
            name: catalogCity.name,
            slug: catalogCity.slug,
            river: catalogCity.river,
            latitude: catalogCity.latitude,
            longitude: catalogCity.longitude,
            active: true,
            ordem: catalogCity.ordem
          }, { onConflict: 'slug' })
          .select()
          .single();

        if (insertErr || !inserted) {
          console.warn(`Aviso ao criar cidade ${catalogCity.slug}: ${insertErr?.message}`);
          continue;
        }
        currentCity = inserted as DBCity;
        existingCitiesBySlug.set(catalogCity.slug, currentCity);
      }

      activeCities.push(currentCity);
    }

    // Mapas de lookup
    const citiesBySlugMap = new Map<string, DBCity>();
    for (const c of activeCities) {
      if (c.slug) citiesBySlugMap.set(c.slug, c);
    }

    // 3. Garantir estações de monitoramento vinculadas a cada ID de cidade
    for (const catalogCity of OFFICIAL_CATALOG_CITIES) {
      const dbCity = citiesBySlugMap.get(catalogCity.slug);
      if (!dbCity || !isValidUuid(dbCity.id)) continue;

      const stationCode = `${catalogCity.slug}-st1`;
      await supabase.from('stations').upsert({
        city_id: dbCity.id,
        name: `${catalogCity.name} - Estação Central`,
        code: stationCode,
        latitude: catalogCity.latitude,
        longitude: catalogCity.longitude,
        normal_level: catalogCity.normal_level || getCityThresholds(catalogCity.name).normal,
        attention_level: catalogCity.attention_level || getCityThresholds(catalogCity.name).attention,
        alert_level: catalogCity.alert_level || getCityThresholds(catalogCity.name).alert,
        flood_level: catalogCity.flood_level || getCityThresholds(catalogCity.name).flood,
        active: true
      }, { onConflict: 'code' });
    }

    const { data: rawStations } = await supabase.from('stations').select('*').eq('active', true);
    const dbStations = (rawStations as DBStation[]) || [];

    const stationsByCityIdMap = new Map<string, DBStation>();
    for (const st of dbStations) {
      if (st.city_id && !stationsByCityIdMap.has(st.city_id)) {
        stationsByCityIdMap.set(st.city_id, st);
      }
    }

    // 4. Buscar medições das fontes externas
    const fetchPromises = dataSources.map(async (source) => {
      try {
        let items: StationPayload[] = [];
        if (source.name.includes('nivelguaiba') || source.url.includes('nivelguaiba')) {
          items = await fetchFromNivelGuaiba(source.url, activeCities);
        } else {
          const endpoint = `${source.url}/api/stations`;
          const response = await fetchWithRetry(endpoint, {
            headers: { 'Accept': 'application/json' }
          }, 2, 800, 10000);

          const payload: any = await response.json();
          items = Array.isArray(payload?.stations)
            ? payload.stations
            : Array.isArray(payload)
            ? payload
            : [];

          items = items.map((st) => ({
            ...st,
            source_origin: source.name
          }));
        }
        sourcesSuccessCount++;
        return items;
      } catch (err: any) {
        sourcesFailedCount++;
        console.warn(`Aviso ao consultar fonte ${source.name}: ${err.message}`);
        return [];
      }
    });

    const resultsNested = await Promise.all(fetchPromises);
    const stationsPayload: StationPayload[] = resultsNested.flat();

    // 5. Otimização: carregar histórico recente de uma vez para evitar N+1 queries
    const allStationIds = dbStations.map((s) => s.id).filter(isValidUuid);
    const existingReadingsSet = new Set<string>();

    if (allStationIds.length > 0) {
      const { data: recentReadings } = await supabase
        .from('river_levels')
        .select('station_id, recorded_at')
        .in('station_id', allStationIds)
        .order('recorded_at', { ascending: false })
        .limit(1000);

      if (recentReadings) {
        for (const r of recentReadings) {
          existingReadingsSet.add(`${r.station_id}_${r.recorded_at}`);
        }
      }
    }

    const readingsToInsert: any[] = [];

    // 6. Atualizar estado das cidades e preparar lote de inserções históricas
    for (const stPayload of stationsPayload) {
      try {
        const payloadCityName = stPayload.city || stPayload.name || '';
        const rawKey = stPayload.slug || payloadCityName;
        const sourceOrigin = stPayload.source_origin || 'niveldosrios.guerreirosdohumaita.com.br';

        if (!rawKey && typeof stPayload.lat !== 'number') continue;

        const matchResult = findOfficialCityMatch(rawKey, activeCities, stPayload.lat, stPayload.lng);
        if (!matchResult) continue;

        const canonicalSlug = matchResult.city.slug;
        const targetCity = citiesBySlugMap.get(canonicalSlug) || matchResult.city;
        const cityId = targetCity.id;

        if (!isValidUuid(cityId)) continue;

        const matchedStation = stationsByCityIdMap.get(cityId);
        if (!matchedStation || !isValidUuid(matchedStation.id)) continue;

        const stationId = matchedStation.id;

        const currentLevel = typeof stPayload.level === 'number' ? Number(stPayload.level.toFixed(2)) : 3.00;
        const rateInMeters = typeof stPayload.rate === 'number' ? Number((stPayload.rate / 100).toFixed(2)) : 0.00;
        const trend = stPayload.trend || (rateInMeters > 0.005 ? 'subindo' : rateInMeters < -0.005 ? 'descendo' : 'estavel');

        const th = getCityThresholds(targetCity.name);
        let statusLevel: 'normal' | 'atencao' | 'alerta' | 'inundacao' = stPayload.status || 'normal';
        if (currentLevel >= th.flood) statusLevel = 'inundacao';
        else if (currentLevel >= th.alert) statusLevel = 'alerta';
        else if (currentLevel >= th.attention) statusLevel = 'atencao';

        const lastUpdatedText = formatLastUpdated();
        const recordedAt = stPayload.ts ? new Date(stPayload.ts).toISOString() : new Date().toISOString();

        // Atualizar estado atual da cidade
        const { error: cityUpdateErr } = await supabase
          .from('cities')
          .update({
            current_level: currentLevel,
            trend,
            rate_of_change: rateInMeters,
            status_level: statusLevel,
            last_updated: lastUpdatedText,
            updated_at: new Date().toISOString(),
            river: targetCity.river,
            basin: targetCity.basin,
            source_origin: sourceOrigin
          })
          .eq('id', cityId);

        if (!cityUpdateErr) {
          citiesUpdatedCount++;
        }

        // Deduplicação em memória
        const dedupeKey = `${stationId}_${recordedAt}`;
        if (existingReadingsSet.has(dedupeKey)) {
          skippedCount++;
        } else {
          existingReadingsSet.add(dedupeKey);
          readingsToInsert.push({
            station_id: stationId,
            city_id: cityId,
            level: currentLevel,
            trend,
            rate_of_change: rateInMeters,
            recorded_at: recordedAt,
            source_origin: sourceOrigin,
            basin: targetCity.basin || 'taquari',
            river_name: targetCity.river || 'Rio Taquari'
          });
        }
      } catch (stErr: any) {
        errorsCount++;
        errors.push(stErr.message);
      }
    }

    // 7. Inserção em lote (Batch Insert)
    if (readingsToInsert.length > 0) {
      const { error: batchInsertErr } = await supabase
        .from('river_levels')
        .insert(readingsToInsert);

      if (batchInsertErr) {
        errors.push(`Erro de inserção em lote: ${batchInsertErr.message}`);
        errorsCount++;
      } else {
        updatedCount = readingsToInsert.length;
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = errorsCount > 0 ? (updatedCount > 0 ? 'warning' : 'erro') : 'sucesso';
    const message = `Coleta Supabase Cron/EdgeFunction executada com status [${finalStatus.toUpperCase()}]. ${updatedCount} medições inseridas em ${durationMs}ms.`;

    // 8. Gravar histórico de sincronização com detalhes enriquecidos
    await supabase.from('sync_logs').insert({
      sync_time: new Date().toISOString(),
      duration_ms: durationMs,
      updated_count: updatedCount,
      status: finalStatus,
      message,
      details: {
        executor: 'supabase_edge_function',
        duration_ms: durationMs,
        sources_success: sourcesSuccessCount,
        sources_failed: sourcesFailedCount,
        measurements_received: stationsPayload.length,
        measurements_inserted: updatedCount,
        measurements_skipped: skippedCount,
        cities_updated: citiesUpdatedCount,
        errors,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        duration_ms: durationMs,
        updated_count: updatedCount,
        skipped_count: skippedCount,
        cities_updated: citiesUpdatedCount,
        errors_count: errorsCount,
        message,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errorMessage = `Falha na execução da Edge Function: ${error.message}`;

    await supabase.from('sync_logs').insert({
      sync_time: new Date().toISOString(),
      duration_ms: durationMs,
      updated_count: 0,
      status: 'erro',
      message: errorMessage,
      details: { executor: 'supabase_edge_function', error: error.stack || String(error) }
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        success: false,
        status: 'erro',
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
