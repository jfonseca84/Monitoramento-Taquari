import React, { useEffect, useState } from 'react';
import { City } from '../types';
import { fetchWeatherForecast, fetchLatestWeatherReading, WeatherForecastRow, WeatherReadingRow } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import { SURFACE_B, LINE, MUTED, SECTION_PAD } from './homeTheme';

interface CityWeatherForecastProps {
  selectedCity: City;
}

interface DayForecast {
  dateKey: string;
  dayLabel: string;
  dateLabel: string;
  maxTemp: number | null;
  minTemp: number | null;
  rainSumMm: number;
  maxProbability: number;
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
        hours: 0
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
    }
  }

  return Array.from(byDay.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

const DAYS_TO_SHOW = 7;
// Dias futuros só entram com a previsão (quase) completa, para não subestimar a chuva do dia
const MIN_HOURS_FOR_FULL_DAY = 20;
// Escala mínima das barras (mm), para que poucos milímetros não pareçam um temporal
const MIN_BAR_SCALE_MM = 10;

const fmtMm = (v: number) => v.toFixed(1).replace('.', ',');

export const CityWeatherForecast: React.FC<CityWeatherForecastProps> = ({ selectedCity }) => {
  const [rows, setRows] = useState<WeatherForecastRow[]>([]);
  const [reading, setReading] = useState<WeatherReadingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
  const barScaleMm = Math.max(MIN_BAR_SCALE_MM, ...days.map((d) => d.rainSumMm));

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
    if (diffMin < 1) return 'atualizado agora';
    if (diffMin < 60) return `atualizado há ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    return `atualizado há ${diffH}h`;
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
    { label: 'Últimas 24h', sub: 'medida', value: typeof rain24h === 'number' ? rain24h : null },
    { label: 'Últimas 72h', sub: 'medida', value: typeof rain72h === 'number' ? rain72h : null },
    { label: 'Próximas 72h', sub: 'prevista', value: rain72hForecast }
  ];

  return (
    <section className={`${SURFACE_B} ${SECTION_PAD} pt-12 sm:pt-14 pb-14 sm:pb-16 flex flex-col gap-[30px]`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="leading-[1.2]">
          <div className="text-lg font-light">Chuva prevista para</div>
          <div className="text-[26px] font-extrabold">Os próximos dias</div>
        </div>
        {updatedLabel && (
          <span className={`text-xs ${MUTED}`}>Open-Meteo · {updatedLabel}</span>
        )}
      </div>

      {loading ? (
        <div className={`flex items-center gap-2 py-6 text-sm ${MUTED}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando previsão...
        </div>
      ) : days.length === 0 && !hasRainData ? (
        <p className={`text-sm ${MUTED}`}>
          Previsão indisponível no momento para {selectedCity.name}.
        </p>
      ) : (
        <>
          {/* COLUNAS POR DIA: chuva prevista (mm) */}
          {days.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(72px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-4 items-end">
              {days.map((d) => {
                const pct = Math.max(2, Math.min(100, (d.rainSumMm / barScaleMm) * 100));
                const isToday = d.dateKey === todayKey;
                return (
                  <div
                    key={d.dateKey}
                    className="flex flex-col gap-2.5 items-start"
                    title={d.maxProbability > 0 ? `${Math.round(d.maxProbability)}% de chance de chuva` : undefined}
                  >
                    <span className="text-[15px] font-extrabold whitespace-nowrap">{fmtMm(d.rainSumMm)} mm</span>
                    <div className="w-full h-[120px] flex items-end bg-[#2A323B] rounded-[3px]">
                      <div className="w-full bg-[#4F9BD0] rounded-[3px]" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-extrabold leading-none">{isToday ? 'Hoje' : d.dayLabel.slice(0, 3)}</span>
                    <span className={`text-xs -mt-1.5 ${MUTED}`}>{d.dateLabel}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* CHUVA ACUMULADA: medida (24h/72h) e prevista (72h à frente) */}
          {hasRainData && (
            <div className={`flex flex-col gap-3 pt-5 border-t ${LINE}`}>
              <div className="text-sm font-light">
                Chuva <strong className="font-extrabold">acumulada</strong>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-5">
                {accumulated.map((a) => (
                  <div key={a.label} className="flex flex-col gap-0.5 border-l-[3px] border-[#4F9BD0] pl-3">
                    <span className="text-xs font-semibold text-[#C4C8CD]">
                      {a.label} <span className="font-normal">({a.sub})</span>
                    </span>
                    <span className="text-xl font-extrabold tracking-[-0.02em]">
                      {a.value !== null ? `${fmtMm(a.value)} mm` : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
