import React, { useEffect, useMemo, useState } from 'react';
import { City } from '../types';
import { fetchWeatherForecast, fetchLatestWeatherReading, WeatherForecastRow, WeatherReadingRow } from '../lib/supabase';
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
    Promise.all([fetchWeatherForecast(cityId, 160), fetchLatestWeatherReading(cityId)]).then(([forecast, latest]) => {
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
  const updatedLabel = (() => {
    if (!lastUpdateMs) return null;
    const diffMin = Math.round((Date.now() - lastUpdateMs) / 60000);
    if (diffMin < 1) return 'coletado há menos de 1 min';
    if (diffMin < 60) return `coletado há ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    return `coletado há ${diffH}h`;
  })();

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

  const CARD = 'rounded-2xl border border-[#3A434E] bg-[#2B333D]';

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
  const Chip: React.FC<{ Icon: LucideIcon; label: string; value: React.ReactNode; sub?: string; title?: string }> = ({ Icon, label, value, sub, title }) => (
    <div title={title} className="flex items-center gap-2.5 rounded-xl border border-[#3A434E] bg-[#2B333D] px-3 py-2 min-w-[150px] flex-1">
      <Icon className="w-5 h-5 text-[#7DB6DC] shrink-0" strokeWidth={1.6} />
      <div className="leading-tight">
        <div className="text-[11px] text-[#B4B9BF]">{label}</div>
        <div className="text-base font-extrabold">{value}</div>
        {sub && <div className="text-[11px] text-[#B4B9BF]">{sub}</div>}
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
        value={headRain.r24 !== null ? <>{fmtMm(headRain.r24)}<span className="text-xs font-normal text-[#B4B9BF] ml-1">mm</span></> : '--'}
        sub={`72h: ${headRain.r72 !== null ? fmtMm(headRain.r72) : '--'} mm · prev. 72h: ${headRain.f72 !== null ? fmtMm(headRain.f72) : '--'} mm`}
      />
    ),
    soil && <Chip key="solo" Icon={Sprout} label="Solo (umidade)" value={soil.label} sub={soil.pct} />,
    river && headRate !== null && <Chip key="rio" Icon={river.Icon} label="Rio nas cabeceiras" value={river.label} sub={fmtRate(headRate)} />
  ].filter(Boolean);

  // Resumo do topo: dia selecionado (hoje = agora; demais dias = máxima/mínima)
  const activeIdx = Math.min(selectedIdx, Math.max(0, days.length - 1));
  const activeDay = days[activeIdx];
  const isTodayActive = !!activeDay && activeDay.dateKey === todayKey;
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
          when: 'Agora',
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
      className={`${SECTION_PAD} pt-12 sm:pt-14 pb-14 sm:pb-16 flex flex-col gap-6 text-white relative overflow-hidden bg-[#222931]`}
    >
      <svg aria-hidden className="pointer-events-none absolute -top-6 right-0 w-[70%] max-w-[900px] opacity-10" viewBox="0 0 900 160" fill="none">
        <path d="M0 110C120 40 220 150 360 90S600 10 720 70s130 20 180-30" stroke="#4F9BD0" strokeWidth="2" />
        <path d="M0 130C130 60 240 165 380 108S620 30 740 90s120 10 160-20" stroke="#4F9BD0" strokeWidth="1.5" />
      </svg>

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="self-stretch w-px bg-[#3A434E]" />
          <div className="leading-[1.2]">
            <div className="text-lg font-light">Previsão para</div>
            <div className="text-[30px] sm:text-[34px] font-extrabold leading-[1.1]">Os próximos dias</div>
            <div className="text-sm text-[#B4B9BF] mt-1.5">Acompanhe a previsão de chuva e o impacto no nível do rio.</div>
          </div>
        </div>
        {updatedLabel && (
          <div className={`${CARD} flex items-center gap-3 px-4 py-3`}>
            <span className="w-11 h-11 rounded-full bg-[#343D48] flex items-center justify-center">
              <CloudRain className="w-6 h-6 text-[#4F9BD0]" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Fonte: Open-Meteo</div>
              <div className="text-xs text-[#B4B9BF]">{updatedLabel}</div>
            </div>
          </div>
        )}
      </div>

      {/* PREVISÃO DO TEMPO: resumo do dia selecionado + faixa de 5 dias com indicador móvel */}
      {!loading && days.length > 0 && headline && (
        <div className={`relative ${CARD}`}>
          <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#222931] rounded-t-2xl">
            <div className="flex items-center gap-4">
              <headline.cond.Icon className="w-14 h-14 text-[#B4B9BF] shrink-0" strokeWidth={1.4} />
              <div className="leading-tight">
                <div className="text-xs font-extrabold uppercase tracking-wide text-[#B4B9BF] mb-1">{selectedCity.name}</div>
                <div className="text-[44px] font-extrabold leading-none">{fmtTemp(headline.temp)}</div>
                {headline.sub && <div className="text-sm text-[#B4B9BF] mt-1">{headline.sub}</div>}
              </div>
            </div>
            <div className="text-right leading-tight">
              <div className="text-sm text-[#B4B9BF]">{headline.when}</div>
              <div className="text-lg font-extrabold">{headline.cond.label}</div>
            </div>
          </div>

          <div className="h-px bg-[#3A434E]" />

          <div
            role="tablist"
            aria-label="Dias da previsão"
            onKeyDown={onTabKey}
            className="relative grid bg-[#222931] rounded-b-2xl"
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
                    active ? 'bg-white text-black' : 'hover:bg-[#262E37]'
                  }`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-wide">{dayName(d, i)}</span>
                  <span className={`text-xs ${active ? 'text-neutral-600' : 'text-[#B4B9BF]'}`}>{d.dateLabel}</span>
                  <c.Icon className={`w-9 h-9 my-1 ${active ? 'text-black' : 'text-[#B4B9BF]'}`} strokeWidth={1.4} />
                  <span className="text-sm font-extrabold">
                    {fmtTemp(d.maxTemp)} <span className={`font-normal ${active ? 'text-neutral-600' : 'text-[#B4B9BF]'}`}>/ {fmtTemp(d.minTemp)}</span>
                  </span>
                </button>
              );
            })}
            <div
              aria-hidden
              className="absolute -bottom-[11px] z-10 w-0 h-0 border-x-[11px] border-x-transparent border-t-[11px] border-t-white transition-[left] duration-300 ease-out"
              style={{ left: `${((activeIdx + 0.5) / days.length) * 100}%`, transform: 'translateX(-50%)' }}
            />
          </div>
        </div>
      )}

      {!loading && days.length > 0 && chips.length > 0 && <div className="relative flex flex-wrap gap-2">{chips}</div>}

      {loading ? (
        <div className="relative flex items-center gap-2 py-6 text-sm text-[#B4B9BF]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando previsão...
        </div>
      ) : days.length === 0 && !hasRainData ? (
        <p className="relative text-sm text-[#B4B9BF]">
          Previsão indisponível no momento para {selectedCity.name}.
        </p>
      ) : (
        <>
          {/* CHUVA ACUMULADA: medida (24h/72h) e prevista (72h à frente) */}
          {hasRainData && (
            <div className={`relative ${CARD} px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3`}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="w-8 h-8 rounded-full bg-[#343D48] flex items-center justify-center shrink-0">
                  <Droplet className="w-4 h-4 text-[#4F9BD0]" strokeWidth={1.8} />
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Histórico de chuva acumulada</div>
                  <div className="text-[11px] text-[#B4B9BF]">{isMeasured(reading) ? 'Medido: ANA · previsão: Open-Meteo.' : 'Modelo Open-Meteo, não é pluviômetro.'}</div>
                </div>
              </div>
              {accumulated.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center gap-2 shrink-0 sm:border-l border-[#3A434E] sm:pl-4">
                  <span className="w-8 h-8 rounded-full bg-[#343D48] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#7DB6DC]" strokeWidth={1.6} />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[13px] text-[#4F9BD0] whitespace-nowrap">{label}</div>
                    <div className="whitespace-nowrap">
                      <span className="text-xl font-extrabold tracking-[-0.02em]">{value !== null ? fmtMm(value) : '--'}</span>
                      {value !== null && <span className="text-xs text-[#B4B9BF] ml-1">mm</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
