import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configurações de Ambiente
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OFFICIAL_SOURCE_URL = (process.env.OFFICIAL_SOURCE_URL || 'https://niveldosrios.guerreirosdohumaita.com.br/').replace(/\/$/, '');

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
  normal_level?: number;
  attention_level?: number;
  alert_level?: number;
  flood_level?: number;
  latitude: number;
  longitude: number;
  active: boolean;
}

// Estações padrão em memória para execução de teste/simulação quando Supabase remoto não estiver configurado
const MOCK_INITIAL_CITIES: DBCity[] = [
  { id: 'c1', name: 'Lajeado', slug: 'lajeado', river: 'Rio Taquari', normal_level: 3.0, attention_level: 3.0, alert_level: 6.0, flood_level: 19.0, latitude: -29.4669, longitude: -51.9611, active: true },
  { id: 'c2', name: 'Encantado', slug: 'encantado', river: 'Rio Taquari', normal_level: 3.0, attention_level: 3.0, alert_level: 6.0, flood_level: 12.0, latitude: -29.2361, longitude: -51.8697, active: true },
  { id: 'c3', name: 'Muçum', slug: 'mucum', river: 'Rio Taquari', normal_level: 3.0, attention_level: 3.0, alert_level: 6.0, flood_level: 18.0, latitude: -29.1667, longitude: -51.8706, active: true },
  { id: 'c4', name: 'Bom Retiro do Sul', slug: 'bomretirodosul', river: 'Rio Taquari', normal_level: 3.0, attention_level: 3.0, alert_level: 6.0, flood_level: 19.0, latitude: -29.6039, longitude: -51.9469, active: true },
  { id: 'c5', name: 'Roca Sales', slug: 'rocasales', river: 'Rio Taquari', normal_level: 3.0, attention_level: 3.0, alert_level: 6.0, flood_level: 18.0, latitude: -29.2587, longitude: -51.8277, active: true },
  { id: 'c6', name: 'Porto Alegre', slug: 'portoalegre', river: 'Rio Guaíba', normal_level: 1.5, attention_level: 2.0, alert_level: 2.5, flood_level: 3.0, latitude: -30.0346, longitude: -51.2177, active: true },
  { id: 'c7', name: 'São Leopoldo', slug: 'saoleopoldo', river: 'Rio dos Sinos', normal_level: 2.5, attention_level: 3.5, alert_level: 4.0, flood_level: 4.5, latitude: -29.7603, longitude: -51.1472, active: true },
  { id: 'c8', name: 'Taquara', slug: 'taquara', river: 'Rio dos Sinos', normal_level: 2.0, attention_level: 4.0, alert_level: 5.0, flood_level: 6.0, latitude: -29.6506, longitude: -50.7803, active: true },
  { id: 'c9', name: 'Feliz', slug: 'feliz', river: 'Rio Caí', normal_level: 2.5, attention_level: 5.0, alert_level: 7.0, flood_level: 9.0, latitude: -29.4517, longitude: -51.3050, active: true },
  { id: 'c10', name: 'São Sebastião do Caí', slug: 'saosebastiaodocai', river: 'Rio Caí', normal_level: 3.0, attention_level: 6.0, alert_level: 8.0, flood_level: 10.0, latitude: -29.5872, longitude: -51.3767, active: true },
  { id: 'c11', name: 'Gravataí', slug: 'gravatai', river: 'Rio Gravataí', normal_level: 2.0, attention_level: 3.0, alert_level: 4.0, flood_level: 4.75, latitude: -29.9444, longitude: -50.9919, active: true },
  { id: 'c12', name: 'Cachoeira do Sul', slug: 'cachoeiradosul', river: 'Rio Jacuí', normal_level: 8.0, attention_level: 12.0, alert_level: 15.0, flood_level: 18.0, latitude: -30.0392, longitude: -52.8933, active: true },
  { id: 'c13', name: 'Dona Francisca', slug: 'donafrancisca', river: 'Rio Jacuí', normal_level: 3.0, attention_level: 5.0, alert_level: 6.0, flood_level: 7.5, latitude: -29.6169, longitude: -53.3628, active: true },
  { id: 'c14', name: 'Rio Pardo', slug: 'riopardo', river: 'Rio Jacuí', normal_level: 5.0, attention_level: 8.0, alert_level: 10.0, flood_level: 12.5, latitude: -29.9897, longitude: -52.3697, active: true }
];

const MOCK_INITIAL_STATIONS: DBStation[] = MOCK_INITIAL_CITIES.map((city, idx) => ({
  id: `st-${idx + 1}`,
  city_id: city.id,
  name: `${city.name} - Estação Central`,
  code: `${city.slug}-st1`,
  latitude: city.latitude,
  longitude: city.longitude,
  normal_level: city.normal_level || 3.0,
  attention_level: city.attention_level || 3.0,
  alert_level: city.alert_level || 6.0,
  flood_level: city.flood_level || 8.5,
  active: true,
  city
}));

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

function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]/g, '');
}

function formatLastUpdated(): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  return `Atualizado às ${timeStr}`;
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
    console.log(`[river-updater] (Para persistência remota no Supabase, defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY reais)`);
  }
  console.log(`[river-updater] =================================================`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;
  const errors: string[] = [];

  try {
    let dbCities: DBCity[] = [];
    let dbStations: DBStation[] = [];

    if (isSupabaseRealConfigured && supabase) {
      console.log('[river-updater] 1. Lendo catálogo de cidades e estações do Supabase...');
      const { data: citiesData } = await supabase.from('cities').select('*');
      dbCities = (citiesData as DBCity[]) || [];

      const { data: stationsData } = await supabase
        .from('stations')
        .select('*, city:cities(*)')
        .eq('active', true)
        .order('created_at', { ascending: true });

      dbStations = (stationsData as DBStation[]) || [];

      // Se a tabela stations estiver vazia no Supabase, inicializa a partir de cidades
      if (dbStations.length === 0 && dbCities.length > 0) {
        console.warn('[river-updater] Nenhuma estação em `stations`. Inicializando a partir de `cities`...');
        for (const city of dbCities) {
          const code = `${normalizeKey(city.slug)}-st1`;
          await supabase.from('stations').upsert({
            city_id: city.id,
            name: `${city.name} - Estação Central`,
            code,
            latitude: city.latitude || -29.4678,
            longitude: city.longitude || -51.9614,
            normal_level: city.normal_level || 3.00,
            attention_level: city.attention_level || 3.00,
            alert_level: city.alert_level || 6.00,
            flood_level: city.flood_level || 8.50,
            active: true
          }, { onConflict: 'code' });
        }

        const { data: reloaded } = await supabase
          .from('stations')
          .select('*, city:cities(*)')
          .eq('active', true)
          .order('created_at', { ascending: true });

        dbStations = (reloaded as DBStation[]) || [];
      }
    } else {
      console.log('[river-updater] 1. Carregando mapa de estações hidrológicas do catálogo do sistema...');
      dbCities = MOCK_INITIAL_CITIES;
      dbStations = MOCK_INITIAL_STATIONS;
    }

    console.log(`[river-updater] Cidades no catálogo: ${dbCities.length} | Estações ativas: ${dbStations.length}`);

    // Mapeamentos indexados
    const citiesBySlugMap = new Map<string, DBCity>();
    for (const c of dbCities) {
      if (c.slug) citiesBySlugMap.set(normalizeKey(c.slug), c);
      if (c.name) citiesBySlugMap.set(normalizeKey(c.name), c);
    }

    // Associa cada city_id à primeira estação ativa encontrada
    const stationsByCityIdMap = new Map<string, DBStation>();
    for (const st of dbStations) {
      if (st.city_id && !stationsByCityIdMap.has(st.city_id)) {
        stationsByCityIdMap.set(st.city_id, st);
      }
    }

    // 2. BUSCAR DADOS REAL-TIME DA FONTE OFICIAL
    const endpoint = `${OFFICIAL_SOURCE_URL}/api/stations`;
    const response = await fetchWithRetry(endpoint, {
      headers: {
        'User-Agent': 'RioTaquariHydrologicalUpdater/2.0 (ServiceRole)',
        'Accept': 'application/json'
      }
    }, 3, 1500);

    const payload: any = await response.json();
    const stationsPayload: StationPayload[] = Array.isArray(payload?.stations)
      ? payload.stations
      : Array.isArray(payload)
      ? payload
      : [];

    console.log(`[river-updater] 2. Dados recebidos da fonte oficial: ${stationsPayload.length} medições em tempo real.`);

    // 3. PROCESSAR CADA MEDIÇÃO E GRAVAR EM `river_levels`
    console.log('[river-updater] 3. Sincronizando e atualizando `cities` -> `stations` -> `river_levels`...');

    for (const stPayload of stationsPayload) {
      try {
        const payloadCityName = stPayload.city || stPayload.name || '';
        const payloadSlug = stPayload.slug ? normalizeKey(stPayload.slug) : normalizeKey(payloadCityName);

        if (!payloadSlug && !payloadCityName) continue;

        // 1. Localiza a cidade pelo slug ou nome
        let targetCity: DBCity | null = citiesBySlugMap.get(payloadSlug) || citiesBySlugMap.get(normalizeKey(payloadCityName)) || null;

        if (!targetCity && isSupabaseRealConfigured && supabase) {
          // Busca no Supabase por slug ou nome
          const { data: foundCity } = await supabase
            .from('cities')
            .select('*')
            .or(`slug.eq.${payloadSlug},name.ilike.%${payloadCityName}%`)
            .limit(1)
            .maybeSingle();

          if (foundCity) {
            targetCity = foundCity;
          } else {
            // Se não existe no banco, cria a cidade em `cities`
            const rawName = payloadCityName || stPayload.slug || 'Nova Cidade';
            const { data: newCity } = await supabase
              .from('cities')
              .upsert({
                name: rawName,
                slug: payloadSlug,
                river: stPayload.river || 'Rio Taquari',
                latitude: stPayload.lat || -29.4678,
                longitude: stPayload.lng || -51.9614,
                active: true
              }, { onConflict: 'slug' })
              .select('*')
              .single();

            targetCity = newCity;
          }

          if (targetCity) {
            citiesBySlugMap.set(payloadSlug, targetCity);
            citiesBySlugMap.set(normalizeKey(targetCity.name), targetCity);
          }
        } else if (!targetCity) {
          // Modo simulação local
          const rawName = payloadCityName || stPayload.slug || 'Nova Cidade';
          targetCity = {
            id: `c-dyn-${payloadSlug}`,
            name: rawName,
            slug: payloadSlug,
            river: stPayload.river || 'Rio Taquari',
            latitude: stPayload.lat || -29.4678,
            longitude: stPayload.lng || -51.9614,
            active: true
          };
          citiesBySlugMap.set(payloadSlug, targetCity);
        }

        if (!targetCity || !targetCity.id) continue;
        const cityId = targetCity.id;

        // 2. Busca a primeira estação ativa da cidade pelo relacionamento stations.city_id = cities.id
        let matchedStation: DBStation | null = stationsByCityIdMap.get(cityId) || null;

        if (!matchedStation && isSupabaseRealConfigured && supabase) {
          const { data: stRows } = await supabase
            .from('stations')
            .select('*, city:cities(*)')
            .eq('city_id', cityId)
            .eq('active', true)
            .order('created_at', { ascending: true })
            .limit(1);

          if (stRows && stRows.length > 0) {
            matchedStation = stRows[0] as DBStation;
          } else {
            // Se não houver estação ativa cadastrada para esta cidade, cria a primeira
            const stationCode = `${payloadSlug}-st1`;
            const { data: newSt } = await supabase
              .from('stations')
              .upsert({
                city_id: cityId,
                name: `${targetCity.name} - Estação Central`,
                code: stationCode,
                latitude: stPayload.lat || targetCity.latitude || -29.4678,
                longitude: stPayload.lng || targetCity.longitude || -51.9614,
                normal_level: targetCity.normal_level || 3.00,
                attention_level: targetCity.attention_level || 3.00,
                alert_level: targetCity.alert_level || 6.00,
                flood_level: stPayload.flood || targetCity.flood_level || 8.50,
                active: true
              }, { onConflict: 'code' })
              .select('*, city:cities(*)')
              .single();

            if (newSt) {
              matchedStation = newSt as DBStation;
            }
          }

          if (matchedStation) {
            stationsByCityIdMap.set(cityId, matchedStation);
          }
        } else if (!matchedStation) {
          // Modo simulação local
          matchedStation = {
            id: `st-dyn-${payloadSlug}`,
            city_id: cityId,
            name: `${targetCity.name} - Estação Central`,
            code: `${payloadSlug}-st1`,
            latitude: stPayload.lat || targetCity.latitude || -29.4678,
            longitude: stPayload.lng || targetCity.longitude || -51.9614,
            normal_level: targetCity.normal_level || 3.00,
            attention_level: targetCity.attention_level || 3.00,
            alert_level: targetCity.alert_level || 6.00,
            flood_level: stPayload.flood || targetCity.flood_level || 8.50,
            active: true,
            city: targetCity
          };
          stationsByCityIdMap.set(cityId, matchedStation);
        }

        if (!matchedStation || !matchedStation.id) {
          console.warn(`[river-updater] Aviso: Não foi possível obter estação ativa para a cidade ${targetCity.name}`);
          continue;
        }

        const stationId = matchedStation.id;


        const currentLevel = typeof stPayload.level === 'number' ? Number(stPayload.level.toFixed(2)) : 3.00;
        const rateInMeters = typeof stPayload.rate === 'number' ? Number((stPayload.rate / 100).toFixed(2)) : 0.00;
        const trend = stPayload.trend || (rateInMeters > 0.005 ? 'subindo' : rateInMeters < -0.005 ? 'descendo' : 'estavel');

        const floodThreshold = matchedStation.flood_level || targetCity?.flood_level || 8.50;
        const alertThreshold = matchedStation.alert_level || targetCity?.alert_level || 6.00;
        const attentionThreshold = matchedStation.attention_level || targetCity?.attention_level || 3.00;

        let statusLevel: 'normal' | 'atencao' | 'alerta' | 'inundacao' = stPayload.status || 'normal';
        if (currentLevel >= floodThreshold) statusLevel = 'inundacao';
        else if (currentLevel >= alertThreshold) statusLevel = 'alerta';
        else if (currentLevel >= attentionThreshold) statusLevel = 'atencao';

        const lastUpdatedText = formatLastUpdated();
        const recordedAt = stPayload.ts ? new Date(stPayload.ts).toISOString() : new Date().toISOString();

        if (isSupabaseRealConfigured && supabase) {
          // Atualiza `cities`
          await supabase
            .from('cities')
            .update({
              current_level: currentLevel,
              trend,
              rate_of_change: rateInMeters,
              status_level: statusLevel,
              last_updated: lastUpdatedText,
              updated_at: new Date().toISOString()
            })
            .eq('id', cityId);

          // Verifica duplicata em `river_levels`
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
            const { error: levelInsertError } = await supabase
              .from('river_levels')
              .insert({
                station_id: stationId,
                city_id: cityId,
                level: currentLevel,
                trend,
                rate_of_change: rateInMeters,
                recorded_at: recordedAt
              });

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
          console.log(`[river-updater] [MEDIDA] Estação: ${matchedStation.name.padEnd(28)} | Nível: ${currentLevel.toFixed(2)}m | Tendência: ${trend.padEnd(8)} | Status: ${statusLevel.toUpperCase()} | Rio: ${stPayload.river || targetCity?.river || 'N/A'}`);
        }

      } catch (stError: any) {
        errorsCount++;
        const msg = `Erro no processamento da estação: ${stError.message}`;
        console.error(`[river-updater] ${msg}`);
        errors.push(msg);
      }
    }

    const durationMs = Date.now() - startTime;
    const status = errorsCount === 0 ? 'sucesso' : updatedCount > 0 ? 'warning' : 'erro';
    const message = `Sincronização concluída com sucesso. Total de ${updatedCount} leituras processadas e vinculadas a river_levels (${skippedCount} duplicatas desconsideradas) em ${durationMs}ms.`;

    console.log(`[river-updater] =================================================`);
    console.log(`[river-updater] RESUMO DA EXECUÇÃO:`);
    console.log(`[river-updater] Status final: ${status.toUpperCase()}`);
    console.log(`[river-updater] Estações no catálogo: ${dbStations.length}`);
    console.log(`[river-updater] Estações na fonte oficial: ${stationsPayload.length}`);
    console.log(`[river-updater] Registros vinculados a river_levels: ${updatedCount}`);
    console.log(`[river-updater] Duplicatas ignoradas: ${skippedCount}`);
    console.log(`[river-updater] Erros registrados: ${errorsCount}`);
    console.log(`[river-updater] Tempo total de execução: ${durationMs}ms`);
    console.log(`[river-updater] =================================================`);

    if (isSupabaseRealConfigured && supabase) {
      await supabase.from('sync_logs').insert({
        sync_time: new Date().toISOString(),
        duration_ms: durationMs,
        updated_count: updatedCount,
        status,
        message,
        details: {
          updated: updatedCount,
          skippedDuplicates: skippedCount,
          errorsCount,
          errors,
          stationsReceivedCount: stationsPayload.length,
          source: OFFICIAL_SOURCE_URL,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    const errorMessage = `Falha na execução do river-updater: ${error.message}`;
    console.error(`[river-updater] ${errorMessage}`);

    if (isSupabaseRealConfigured && supabase) {
      try {
        await supabase.from('sync_logs').insert({
          sync_time: new Date().toISOString(),
          duration_ms: durationMs,
          updated_count: 0,
          status: 'erro',
          message: errorMessage,
          details: { error: String(error.stack || error) }
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
