import React, { useEffect, useMemo, useState } from 'react';
import { City } from '../types';
import { fetchWeatherForecast, fetchLatestWeatherReading, fetchWeatherBundle, WeatherForecastRow, WeatherReadingRow } from '../lib/supabase';
import { Loader2, CloudRain, CloudDrizzle, Cloud, CloudSun, CloudMoon, Sun, Moon, Droplet, History, CalendarDays, Clock, Mountain, Sprout, TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { SECTION_PAD, basinOfCity } from './homeTheme';

interface CityWeatherForecastProps {
  selectedCity: City;
  cities?: City[];
}

interface DayForecast {
  dateKey: string;
  dayLabel: string;
  dateLabel: string;
  maxTemp: number | null;
  minTemp: number | null;
  rainSumMm: number;
  maxProbability: number;
  probSum: number;
  probCount: number;
  hours: number;
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Agrupa as leituras horárias (weather_forecasts) em dias corridos no fuso de Brasília
function groupByDay(rows: WeatherForecastRow[]): DayForecast[] {
  const byDay = new Map<string, DayForecast>();

  for (const row of rows) {
    const d = new Date(row.forecast_for);
    const dateKey = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD estável para agrupar
    const weekday = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
    const dateLabel = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });

    let entry = byDay.get(dateKey);
    if (!entry) {
      entry = {
        dateKey,
        dayLabel: DAY_LABELS.find((l) => weekday.startsWith(l.toLowerCase())) || weekday,
        dateLabel,
        maxTemp: null,
        minTemp: null,
        rainSumMm: 0,
        maxProbability: 0,
        probSum: 0,
        probCount: 0,
        hours: 0,
      };
      byDay.set(dateKey, entry);
    }
    entry.hours += 1;

    if (typeof row.temperature_2m === 'number' && !isNaN(row.temperature_2m)) {
      entry.maxTemp = entry.maxTemp === null ? row.temperature_2m : Math.max(entry.maxTemp, row.temperature_2m);
      entry.minTemp = entry.minTemp === null ? row.temperature_2m : Math.min(entry.minTemp, row.temperature_2m);
    }
    if (typeof row.precipitation_mm === 'number' && !isNaN(row.precipitation_mm)) {
      entry.rainSumMm += row.precipitation_mm;
    }
    if (typeof row.precipitation_probability === 'number' && !isNaN(row.precipitation_probability)) {
      entry.maxProbability = Math.max(entry.maxProbability, row.precipitation_probability);
      entry.probSum += row.precipitation_probability;
      entry.probCount += 1;
    }
  }

  return Array.from(byDay.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

// Condição do tempo estimada a partir da chuva prevista (mm) e da probabilidade de chuva:
// sem chuva não há ícone de chuva; quanto maior a probabilidade, mais nuvens
interface Condition { label: string; Icon: LucideIcon }
function conditionFor(rainMm: number, probability: number, night = false): Condition {
  if (rainMm >= 20) return { label: 'Chuva forte', Icon: CloudRain };
  if (rainMm >= 5) return { label: 'Chuva', Icon: CloudRain };
  if (rainMm >= 0.3) return { label: 'Chuva fraca', Icon: CloudDrizzle };
  if (probability >= 50) return { label: 'Nublado', Icon: Cloud };
  if (probability >= 20) return { label: 'Sol entre nuvens', Icon: night ? CloudMoon : CloudSun };
  return night ? { label: 'Céu limpo', Icon: Moon } : { label: 'Ensolarado', Icon: Sun };
}
const dayCondition = (d: DayForecast) => conditionFor(d.rainSumMm, d.probCount ? d.probSum / d.probCount : 0);
const fmtTemp = (v: number | null | undefined) => (typeof v === 'number' && !isNaN(v) ? `${Math.round(v)}°` : '--');

// Soma a chuva prevista (mm) nas próximas `hours` horas a partir de agora
function sumWindow(rows: WeatherForecastRow[], hours: number): number | null {
  const now = Date.now();
  let total = 0;
  let hasAny = false;
  for (const r of rows) {
    const t = new Date(r.forecast_for).getTime();
    if (isNaN(t) || t < now || t > now + hours * 3600000) continue;
    if (typeof r.precipitation_mm === 'number' && !isNaN(r.precipitation_mm)) {
      total += r.precipitation_mm;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}
const avg = (vals: (number | null | undefined)[]): number | null => {
  const v = vals.filter((x): x is number => typeof x === 'number' && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

// Umidade do solo (m³/m³, camada 9–27 cm) em faixas simples: solo saturado repassa a chuva ao rio
function soilLevel(v: number | null | undefined): { label: string; pct: string } | null {
  if (typeof v !== 'number' || isNaN(v)) return null;
  return { label: v >= 0.35 ? 'Saturado' : v >= 0.2 ? 'Úmido' : 'Seco', pct: `${Math.round(v * 100)}%` };
}

// measured = quantas estações de cabeceira têm chuva medida em pluviômetro (ANA); 0 = só estimativa do modelo
interface HeadwaterRain { r24: number | null; r72: number | null; f72: number | null; measured: number }
const isMeasured = (r?: WeatherReadingRow | null) => /ana/.test(r?.source ?? '');

const DAYS_TO_SHOW = 5;
// A coleta de clima roda a cada 30 min e a leitura horária pode ter até ~30 min a mais de idade.
// Acima de 90 min (2 ciclos seguidos sem atualizar) a leitura deixa de ser tratada como atual.
// Mesmo corte usado pelo coletor (STALE_AFTER_MIN em weather.collector.ts).
const STALE_AFTER_MIN = 90;
// Dias futuros só entram com a previsão (quase) completa, para não subestimar a chuva do dia
const MIN_HOURS_FOR_FULL_DAY = 20;

const fmtMm = (v: number) => v.toFixed(1).replace('.', ',');

export const CityWeatherForecast: React.FC<CityWeatherForecastProps> = ({ selectedCity, cities = [] }) => {
  const [rows, setRows] = useState<WeatherForecastRow[]>([]);
  const [reading, setReading] = useState<WeatherReadingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [headRain, setHeadRain] = useState<HeadwaterRain | null>(null);

  // Estações de cabeceira da bacia da cidade selecionada (a chuva lá em cima chega depois à cidade)
  const basinKey = basinOfCity(selectedCity?.slug);
  const headwaters = useMemo(
    () => cities.filter((c) => basinKey && basinOfCity(c.slug) === basinKey && c.basin_section === 'cabeceira'),
    [cities, basinKey]
  );
  const headKey = headwaters.map((c) => c.id).join(',');

  useEffect(() => {
    let cancelled = false;
    if (!headwaters.length) {
      setHeadRain(null);
      return;
    }
    setHeadRain(null);
    // 1) Resumo pronto no cache do worker (0 consultas ao Supabase)
    const cityIdForBundle = selectedCity?.id;
    const fromServer = cityIdForBundle ? fetchWeatherBundle(cityIdForBundle, headwaters.map((c) => c.id)) : Promise.resolve(null);
    fromServer.then((bundle) => {
      if (cancelled) return;
      if (bundle?.headwaters) {
        const h = bundle.headwaters;
        setHeadRain({ r24: h.r24, r72: h.r72, f72: h.f72, measured: h.measured });
        return;
      }
      // 2) Sem o cache do worker: consulta direta como antes
      loadHeadwatersDirect();
    });

    function loadHeadwatersDirect() {
    Promise.all(
      headwaters.map((c) => Promise.all([fetchLatestWeatherReading(c.id), fetchWeatherForecast(c.id, 100)]))
    ).then((res) => {
      if (cancelled) return;
      // Prefere a chuva medida em pluviômetro; sem nenhuma estação medida, usa a estimativa do modelo
      const measured = res.filter(([r]) => isMeasured(r));
      const use = measured.length ? measured : res;
      setHeadRain({
        r24: avg(use.map(([r]) => r?.rain_24h_mm)),
        r72: avg(use.map(([r]) => r?.rain_72h_mm)),
        f72: avg(res.map(([, f]) => sumWindow(f, 72))),
        measured: measured.length
      });
    });
    }
    return () => { cancelled = true; };
  }, [headKey]);

  useEffect(() => {
    let cancelled = false;
    setSelectedIdx(0);
    const cityId = selectedCity?.id;
    if (!cityId) {
      setRows([]);
      setReading(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setRows([]);
    setReading(null);
    // Cache do worker primeiro; se falhar, consulta direta ao Supabase como antes
    const load = async () => {
      const bundle = await fetchWeatherBundle(cityId, headwaters.map((c) => c.id));
      if (bundle) return [bundle.forecast, bundle.reading] as const;
      return Promise.all([fetchWeatherForecast(cityId, 160), fetchLatestWeatherReading(cityId)]);
    };
    load().then(([forecast, latest]) => {
      if (!cancelled) {
        setRows(forecast);
        setReading(latest);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedCity?.id]);

  // Só o presente em diante (a coleta guarda past_days também) e no máximo DAYS_TO_SHOW dias
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const days = groupByDay(rows)
    .filter((d) => d.dateKey === todayKey || (d.dateKey > todayKey && d.hours >= MIN_HOURS_FOR_FULL_DAY))
    .slice(0, DAYS_TO_SHOW);

  // Horário mais recente entre a previsão e a coleta de chuva medida, para mostrar que os dados são atuais
  const lastUpdateMs = Math.max(
    reading?.recorded_at ? new Date(reading.recorded_at).getTime() : 0,
    rows.reduce((max, r) => {
      const t = r.issued_at ? new Date(r.issued_at).getTime() : 0;
      return !isNaN(t) && t > max ? t : max;
    }, 0)
  );
  // Idade da leitura: a última linha do banco pode ser antiga se uma coleta falhou; ela continua visível,
  // mas não é apresentada como se fosse de agora
  const ageMin = lastUpdateMs ? Math.max(0, Math.round((Date.now() - lastUpdateMs) / 60000)) : null;
  const isStale = ageMin !== null && ageMin > STALE_AFTER_MIN;
  const lastUpdateLabel = lastUpdateMs
    ? new Date(lastUpdateMs)
        .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        .replace(', ', ' às ')
    : null;
  const fmtAgo = (m: number) => (m < 1 ? 'há menos de 1 min' : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`);

  const rain24h = reading?.rain_24h_mm;
  const rain72h = reading?.rain_72h_mm;
  const hasMeasuredRain = typeof rain24h === 'number' || typeof rain72h === 'number';

  // Chuva PREVISTA daqui para frente (janela corrida a partir de agora, não por dia-calendário,
  // para poder comparar com o "medida" acima na mesma base: últimas Xh vs. próximas Xh)
  const nowMs = Date.now();
  const sumForecastWindow = (hours: number) => {
    let total = 0;
    let hasAny = false;
    for (const r of rows) {
      const t = new Date(r.forecast_for).getTime();
      if (isNaN(t) || t < nowMs || t > nowMs + hours * 60 * 60 * 1000) continue;
      if (typeof r.precipitation_mm === 'number' && !isNaN(r.precipitation_mm)) {
        total += r.precipitation_mm;
        hasAny = true;
      }
    }
    return hasAny ? Number(total.toFixed(1)) : null;
  };
  const rain72hForecast = sumForecastWindow(72);
  const hasForecastRain = rain72hForecast !== null;
  const hasRainData = hasMeasuredRain || hasForecastRain;

  const accumulated = [
    { label: 'Últimas 24h', value: typeof rain24h === 'number' ? rain24h : null, Icon: History },
    { label: 'Últimas 72h', value: typeof rain72h === 'number' ? rain72h : null, Icon: CalendarDays },
    { label: 'Próx. 72h (previsão)', value: rain72hForecast, Icon: Clock }
  ];

  const CARD = 'rounded-2xl border border-[var(--hm-line)] bg-[var(--hm-a)]';

  // Indicadores complementares para o rio: chuva nas cabeceiras, solo e reação do rio nas cabeceiras
  const soil = soilLevel(reading?.soil_moisture_9_27cm ?? reading?.soil_moisture_3_9cm);
  const headRate = avg(headwaters.map((c) => c.rate_of_change));
  const river =
    headRate === null
      ? null
      : headRate > 0.02
        ? { label: 'Subindo', Icon: TrendingUp }
        : headRate < -0.02
          ? { label: 'Descendo', Icon: TrendingDown }
          : { label: 'Estável', Icon: Minus };
  const fmtRate = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')} m/h`;
  // Celular: sem cartão, rótulo em cima, valor em negrito, centralizado e separado dos vizinhos por linha fina.
  // A partir de sm: cartão com ícone, como antes.
  const Chip: React.FC<{ Icon: LucideIcon; label: string; mobileLabel: string; value: React.ReactNode; sub?: string; mobileSub?: string; title?: string }> = ({ Icon, label, mobileLabel, value, sub, mobileSub, title }) => (
    <div
      title={title}
      className="min-w-0 flex-1 flex flex-col items-center justify-center text-center px-1 max-sm:not-first:border-l max-sm:border-[var(--hm-line)] sm:flex-row sm:text-left sm:gap-2.5 sm:rounded-xl sm:border sm:border-[var(--hm-line)] sm:bg-[var(--hm-a)] sm:px-3 sm:py-2 sm:min-w-[150px]"
    >
      <Icon className="hidden sm:block w-5 h-5 text-[var(--hm-accent)] shrink-0" strokeWidth={1.6} />
      <div className="leading-tight min-w-0">
        <div className="text-[11px] font-semibold text-[var(--hm-text)] sm:font-normal sm:text-[var(--hm-muted)]">
          <span className="sm:hidden">{mobileLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
        <div className="text-[20px] sm:text-base font-extrabold">{value}</div>
        {sub && (
          <div className="text-[11px] text-[var(--hm-muted)]">
            <span className="sm:hidden">{mobileSub ?? sub}</span>
            <span className="hidden sm:inline">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
  const chips = [
    headwaters.length > 0 && headRain && (headRain.r24 !== null || headRain.r72 !== null || headRain.f72 !== null) && (
      <Chip
        key="chuva"
        Icon={Mountain}
        label={headRain.measured > 0 ? 'Chuva medida nas cabeceiras (24h)' : 'Chuva estimada nas cabeceiras (24h)'}
        title={headRain.measured > 0 ? `Média de ${headRain.measured} pluviômetro(s) da ANA; previsão: modelo Open-Meteo` : 'Estimativa do modelo Open-Meteo (sem pluviômetro nas cabeceiras)'}
        value={headRain.r24 !== null ? <>{fmtMm(headRain.r24)}<span className="text-xs font-normal text-[var(--hm-muted)] ml-1">mm</span></> : '--'}
        mobileLabel="Chuva 24h"
        sub={`72h: ${headRain.r72 !== null ? fmtMm(headRain.r72) : '--'} mm · prev. 72h: ${headRain.f72 !== null ? fmtMm(headRain.f72) : '--'} mm`}
        mobileSub={`72h: ${headRain.r72 !== null ? fmtMm(headRain.r72) : '--'} · prev.: ${headRain.f72 !== null ? fmtMm(headRain.f72) : '--'}`}
      />
    ),
    soil && <Chip key="solo" Icon={Sprout} label="Solo (umidade)" mobileLabel="Solo" value={soil.label} sub={soil.pct} />,
    river && headRate !== null && <Chip key="rio" Icon={river.Icon} label="Rio nas cabeceiras" mobileLabel="Rio" value={river.label} sub={fmtRate(headRate)} />
  ].filter(Boolean);

  // Texto de leitura da previsão do DIA SELECIONADO (regras simples; é uma estimativa do modelo, não um alerta).
  // O Vale usa a chuva prevista para aquele dia; as cabeceiras só têm o total das próximas 72h, então entram só nos 3 primeiros dias.
  const buildOutlook = (day: DayForecast | undefined, idx: number): string | null => {
    if (!day) return null;
    const cab = headwaters.length > 0 && idx <= 2 ? headRain?.f72 ?? null : null;
    const v = day.rainSumMm;
    const c = cab ?? 0;
    const mm = (x: number) => `${fmtMm(x)} mm`;
    const worst = Math.max(v, c);
    const cityName = selectedCity?.name ?? 'a cidade';
    const when = day.dateKey === todayKey ? 'hoje' : idx === 1 ? 'amanhã' : `${day.dayLabel.toLowerCase()} (${day.dateLabel})`;
    const span = idx === 0 ? 'hoje e nos três próximos dias' : 'os próximos dias';

    // Em que parte do dia a chuva do Vale está prevista (só as horas que ainda vão acontecer, se for hoje)
    const PERIODS = [
      { name: 'de madrugada', from: 0, to: 6 },
      { name: 'pela manhã', from: 6, to: 12 },
      { name: 'à tarde', from: 12, to: 17 },
      { name: 'ao fim da tarde', from: 17, to: 19 },
      { name: 'no início da noite', from: 19, to: 22 },
      { name: 'no fim da noite', from: 22, to: 24 }
    ];
    const perMm = PERIODS.map(() => 0);
    for (const r of rows) {
      const t = new Date(r.forecast_for);
      if (isNaN(t.getTime()) || typeof r.precipitation_mm !== 'number') continue;
      if (t.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) !== day.dateKey) continue;
      if (day.dateKey === todayKey && t.getTime() < nowMs - 60 * 60 * 1000) continue;
      const h = Number(t.toLocaleString('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false })) % 24;
      const i = PERIODS.findIndex((p) => h >= p.from && h < p.to);
      if (i >= 0) perMm[i] += r.precipitation_mm;
    }
    const totalPer = perMm.reduce((x, y) => x + y, 0);
    const rainy = PERIODS.filter((_, i) => totalPer >= 0.5 && perMm[i] >= totalPer * 0.25).map((p) => p.name);
    const timing = rainy.length ? `, com chuva prevista ${rainy.join(' e ')}` : '';

    if (worst < 5) return `Sem chuva significativa prevista para ${when} (${mm(v)} em ${cityName}).${cab !== null ? ` Nas cabeceiras, a previsão é de ${mm(c)} nas próximas 72h.` : ''} Sem risco de alagamento ou de enchente por chuva nesse período.`;

    const where =
      c >= 10 && v < 10
        ? `Chuva prevista para ${span}, podendo chegar a ${mm(c)} em 72h nas cabeceiras. No Vale, ${when} tem pouco volume previsto (${mm(v)})${timing}. Essa água chega ao rio depois, então o nível em ${cityName} pode subir com atraso de horas ou dias.`
        : v >= 10 && c < 10
          ? `Chuva prevista para ${when} no Vale: ${mm(v)} em ${cityName}${timing}${cab !== null ? `, com pouco volume nas cabeceiras (${mm(c)} em 72h)` : ''}. O efeito tende a ser local e mais rápido.`
          : v < 10 && c < 10
            ? `Chuva fraca prevista para ${when}: ${mm(v)} no Vale${timing}.${cab !== null ? ` Nas cabeceiras, a previsão é de ${mm(c)} nas próximas 72h.` : ''}`
            : `Chuva prevista para ${span}, podendo chegar a ${mm(c)} em 72h nas cabeceiras e ${mm(v)} no Vale ${when}${timing}. As duas regiões contribuem, e o rio pode subir de forma mais forte.`;

    const risk =
      worst < 15
        ? 'Volume baixo: no máximo poças e acúmulo pontual de água; enchente é improvável.'
        : worst < 40
          ? 'Volume moderado: podem ocorrer alagamentos pontuais em áreas baixas e o rio pode subir; enchente de pequeno porte só se o solo já estiver encharcado.'
          : worst < 80
            ? 'Volume alto: há possibilidade de alagamentos e de enchente de pequeno a médio porte, principalmente com solo saturado.'
            : 'Volume muito alto: risco de enchente de médio a grande porte. Acompanhe os níveis e os avisos da Defesa Civil.';

    return `${where} ${risk} Estimativa do modelo, que pode mudar a cada atualização.`;
  };

  // Resumo do topo: dia selecionado (hoje = agora; demais dias = máxima/mínima)
  const activeIdx = Math.min(selectedIdx, Math.max(0, days.length - 1));
  const activeDay = days[activeIdx];
  const isTodayActive = !!activeDay && activeDay.dateKey === todayKey;
  const outlook = buildOutlook(activeDay, activeIdx);
  const nearestRow = rows.reduce<WeatherForecastRow | null>((best, r) => {
    const t = new Date(r.forecast_for).getTime();
    if (isNaN(t)) return best;
    return !best || Math.abs(t - nowMs) < Math.abs(new Date(best.forecast_for).getTime() - nowMs) ? r : best;
  }, null);
  const brtHour = Number(new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false })) % 24;
  const isNight = brtHour < 6 || brtHour >= 18;
  const headline = !activeDay
    ? null
    : isTodayActive
      ? {
          temp: typeof reading?.temperature === 'number' ? reading.temperature : nearestRow?.temperature_2m ?? activeDay.maxTemp,
          sub: typeof reading?.apparent_temperature === 'number' ? `Sensação de ${fmtTemp(reading.apparent_temperature)}` : null,
          when: ageMin === null ? 'Agora' : isStale ? 'Desatualizado' : `Atualizado ${fmtAgo(ageMin)}`,
          cond: conditionFor(
            nearestRow?.precipitation_mm ?? 0,
            nearestRow?.precipitation_probability ?? (activeDay.probCount ? activeDay.probSum / activeDay.probCount : 0),
            isNight
          )
        }
      : { temp: activeDay.maxTemp, sub: `Mínima de ${fmtTemp(activeDay.minTemp)}`, when: 'O dia todo', cond: dayCondition(activeDay) };
  const dayName = (d: DayForecast, i: number) => (d.dateKey === todayKey ? 'Hoje' : i === 1 ? 'Amanhã' : d.dayLabel);
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setSelectedIdx(Math.min(days.length - 1, activeIdx + 1));
    else if (e.key === 'ArrowLeft') setSelectedIdx(Math.max(0, activeIdx - 1));
    else return;
    e.preventDefault();
  };

  return (
    <section
      className={`${SECTION_PAD} pt-7 sm:pt-8 pb-8 sm:pb-10 flex flex-col gap-4 text-[var(--hm-text)] relative overflow-hidden bg-[var(--hm-b)]`}
    >
      <svg aria-hidden className="pointer-events-none absolute -top-6 right-0 w-[70%] max-w-[900px] opacity-10" viewBox="0 0 900 160" fill="none">
        <path d="M0 110C120 40 220 150 360 90S600 10 720 70s130 20 180-30" stroke="#4F9BD0" strokeWidth="2" />
        <path d="M0 130C130 60 240 165 380 108S620 30 740 90s120 10 160-20" stroke="#4F9BD0" strokeWidth="1.5" />
      </svg>

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="self-stretch w-px bg-[var(--hm-line)]" />
          <div className="leading-[1.2]">
            <div className="text-sm font-light">Previsão para</div>
            <div className="text-[20px] sm:text-[22px] font-extrabold leading-[1.15]">Os próximos dias</div>
            <div className="text-xs text-[var(--hm-muted)] mt-1">Acompanhe a previsão de chuva e o impacto no nível do rio.</div>
          </div>
        </div>
      </div>

      {/* PREVISÃO DO TEMPO: resumo do dia selecionado + faixa de 5 dias com indicador móvel */}
      {!loading && days.length > 0 && headline && (
        <div className={`relative ${CARD}`}>
          <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[var(--hm-b)] rounded-t-2xl">
            <div className="flex items-center gap-4">
              <headline.cond.Icon className="w-14 h-14 text-[var(--hm-muted)] shrink-0" strokeWidth={1.4} />
              <div className="leading-tight">
                <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--hm-muted)] mb-1">{selectedCity.name}</div>
                <div className="text-[44px] font-extrabold leading-none">{fmtTemp(headline.temp)}</div>
                {headline.sub && <div className="text-sm text-[var(--hm-muted)] mt-1">{headline.sub}</div>}
              </div>
            </div>
            <div className="text-right leading-tight">
              <div className={`text-sm ${isStale && isTodayActive ? 'font-semibold text-[#E9C145]' : 'text-[var(--hm-muted)]'}`}>{headline.when}</div>
              <div className="text-lg font-extrabold">{headline.cond.label}</div>
              {isStale && isTodayActive && lastUpdateLabel && (
                <div className="text-xs text-[#E9C145] mt-0.5">Última leitura: {lastUpdateLabel}</div>
              )}
            </div>
          </div>

          <div className="h-px bg-[var(--hm-line)]" />

          <div
            role="tablist"
            aria-label="Dias da previsão"
            onKeyDown={onTabKey}
            className="relative grid bg-[var(--hm-b)] rounded-b-2xl"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((d, i) => {
              const c = dayCondition(d);
              const active = i === activeIdx;
              return (
                <button
                  key={d.dateKey}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex flex-col items-center gap-1.5 pt-4 pb-5 first:rounded-bl-2xl last:rounded-br-2xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    active ? 'bg-[var(--hm-sel-bg)] text-[var(--hm-sel-text)]' : 'hover:bg-[var(--hm-hover)]'
                  }`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-wide">{dayName(d, i)}</span>
                  <span className={`text-xs ${active ? 'text-[color-mix(in_srgb,var(--hm-sel-text)_65%,transparent)]' : 'text-[var(--hm-muted)]'}`}>{d.dateLabel}</span>
                  <c.Icon className={`w-9 h-9 my-1 ${active ? 'text-[var(--hm-sel-text)]' : 'text-[var(--hm-muted)]'}`} strokeWidth={1.4} />
                  <span className="text-sm font-extrabold">
                    {fmtTemp(d.maxTemp)} <span className={`font-normal ${active ? 'text-[color-mix(in_srgb,var(--hm-sel-text)_65%,transparent)]' : 'text-[var(--hm-muted)]'}`}>/ {fmtTemp(d.minTemp)}</span>
                  </span>
                </button>
              );
            })}
            <div
              aria-hidden
              className="absolute -bottom-[11px] z-10 w-0 h-0 border-x-[11px] border-x-transparent border-t-[11px] border-t-[var(--hm-sel-bg)] transition-[left] duration-300 ease-out"
              style={{ left: `${((activeIdx + 0.5) / days.length) * 100}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>
      )}

      {!loading && days.length > 0 && outlook && (
        <div className="relative px-1 py-1">
          {/* Título com a barrinha antes e o texto fora de cartão (padrão do site) */}
          <div className="flex items-stretch gap-2">
            <span className="w-[3px] shrink-0 rounded-full bg-[var(--hm-text)]" />
            <div className="text-[17px] font-extrabold leading-tight">Leitura da previsão</div>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--hm-soft)]">{outlook}</p>
        </div>
      )}

      {!loading && days.length > 0 && chips.length > 0 && (
        <>
          {/* Celular: linha horizontal separa os blocos; título acima, sem cartão */}
          <div aria-hidden className="sm:hidden relative h-px bg-[var(--hm-line)]" />
          <div className="sm:hidden relative -mb-2 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-[var(--hm-accent)] shrink-0" strokeWidth={1.8} />
            <span className="text-sm font-semibold">Cabeceiras, solo e rio</span>
          </div>
          <div className="relative flex w-full items-stretch sm:flex-wrap sm:gap-2">{chips}</div>
        </>
      )}

      {loading ? (
        <div className="relative flex items-center gap-2 py-6 text-sm text-[var(--hm-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando previsão...
        </div>
      ) : days.length === 0 && !hasRainData ? (
        <p className="relative text-sm text-[var(--hm-muted)]">
          Previsão indisponível no momento para {selectedCity.name}.
        </p>
      ) : (
        <>
          {/* CHUVA ACUMULADA: medida (24h/72h) e prevista (72h à frente) */}
          {hasRainData && (
            <>
              {/* Celular: o título fica ACIMA do cartão, com linha horizontal separando do bloco anterior */}
              <div aria-hidden className="sm:hidden relative h-px bg-[var(--hm-line)]" />
              <div className="sm:hidden relative -mb-2 flex items-center gap-2">
                <Droplet className="w-4 h-4 text-[var(--hm-accent)] shrink-0" strokeWidth={1.8} />
                <span className="text-sm font-semibold">Histórico de chuva acumulada</span>
              </div>
              <div className="relative flex sm:flex-nowrap items-center sm:gap-x-4 sm:rounded-2xl sm:border sm:border-[var(--hm-line)] sm:bg-[var(--hm-a)] sm:overflow-hidden sm:py-3 sm:px-4">
                {/* Telas maiores: título dentro do cartão, ao lado dos valores */}
                <div className="hidden sm:flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-[var(--hm-chip)] flex items-center justify-center shrink-0">
                    <Droplet className="w-4 h-4 text-[var(--hm-accent)]" strokeWidth={1.8} />
                  </span>
                  <div className="text-sm font-semibold leading-tight">Histórico de chuva acumulada</div>
                </div>
                {/* Celular: só os 3 dados, em UMA linha, separados por linha fina e ocupando o cartão todo. A partir de sm: com ícone. */}
                <div className="flex w-full items-stretch sm:contents">
                  {accumulated.map(({ label, value, Icon }, i) => (
                    <div
                      key={label}
                      title={label}
                      className={`min-w-0 flex-1 flex flex-col items-center justify-center text-center px-1 ${i > 0 ? 'border-l border-[var(--hm-line)]' : ''} sm:flex-none sm:flex-row sm:items-center sm:text-left sm:gap-2 sm:shrink-0 sm:border-l sm:border-[var(--hm-line)] sm:pl-4 sm:pr-0`}
                    >
                      <span className="hidden sm:flex w-8 h-8 rounded-full bg-[var(--hm-chip)] items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[var(--hm-accent)]" strokeWidth={1.6} />
                      </span>
                      <div className="leading-tight min-w-0">
                        <div className="text-[11px] font-semibold text-[var(--hm-text)] sm:text-[13px] sm:font-normal sm:text-[var(--hm-accent)] whitespace-nowrap">
                          <span className="sm:hidden">{label.replace(' (previsão)', '')}</span>
                          <span className="hidden sm:inline">{label}</span>
                        </div>
                        <div className="whitespace-nowrap">
                          <span className="text-[20px] sm:text-xl font-extrabold tracking-[-0.02em]">{value !== null ? fmtMm(value) : '--'}</span>
                          {value !== null && <span className="text-xs text-[var(--hm-muted)] ml-1">mm</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};
