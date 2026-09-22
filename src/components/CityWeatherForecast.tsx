import React, { useEffect, useState } from 'react';
import { City } from '../types';
import { fetchWeatherForecast, WeatherForecastRow } from '../lib/supabase';
import { CloudRain, Sun, CloudSun, CloudLightning, Droplets, Loader2 } from 'lucide-react';

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
        maxProbability: 0
      };
      byDay.set(dateKey, entry);
    }

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

function weatherIconFor(rainSumMm: number, probability: number) {
  if (rainSumMm >= 20 || (rainSumMm >= 8 && probability >= 70)) {
    return { Icon: CloudLightning, colorClass: 'text-violet-600 dark:text-violet-400' };
  }
  if (rainSumMm >= 1 || probability >= 40) {
    return { Icon: CloudRain, colorClass: 'text-cyan-600 dark:text-cyan-400' };
  }
  if (probability >= 15) {
    return { Icon: CloudSun, colorClass: 'text-amber-500 dark:text-amber-400' };
  }
  return { Icon: Sun, colorClass: 'text-amber-500 dark:text-amber-400' };
}

function rainDescription(rainSumMm: number, probability: number): string {
  if (rainSumMm >= 20 || (rainSumMm >= 8 && probability >= 70)) {
    return 'Chuva forte prevista, possibilidade de temporais.';
  }
  if (rainSumMm >= 5 || probability >= 60) {
    return 'Pancadas de chuva ao longo do dia.';
  }
  if (rainSumMm >= 0.5 || probability >= 20) {
    return 'Possibilidade de chuva isolada.';
  }
  return 'Sem previsão de chuva significativa.';
}

const DAYS_TO_SHOW = 3;

export const CityWeatherForecast: React.FC<CityWeatherForecastProps> = ({ selectedCity }) => {
  const [rows, setRows] = useState<WeatherForecastRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cityId = selectedCity?.id;
    if (!cityId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWeatherForecast(cityId, 160).then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedCity?.id]);

  // Só o presente em diante (a coleta guarda past_days também) e no máximo DAYS_TO_SHOW dias
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const days = groupByDay(rows).filter((d) => d.dateKey >= todayKey).slice(0, DAYS_TO_SHOW);
  const accumulatedMm = days.reduce((sum, d) => sum + d.rainSumMm, 0);

  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-5 shadow-xl transition-colors border">
      <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase mb-4 flex items-center justify-between">
        <span>Previsão do Tempo</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 lowercase">
          open-meteo
        </span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs dark:text-slate-400 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando previsão...
        </div>
      ) : days.length === 0 ? (
        <p className="text-xs dark:text-slate-400 text-slate-500 text-center py-6">
          Previsão indisponível no momento para {selectedCity.name}.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {days.map((d, i) => {
              const { Icon, colorClass } = weatherIconFor(d.rainSumMm, d.maxProbability);
              return (
                <div
                  key={d.dateKey}
                  className="flex items-center gap-3 p-2.5 rounded-xl dark:bg-slate-900/60 bg-slate-50 dark:border-slate-800 border-slate-200 border"
                >
                  <div className="w-14 shrink-0 text-left">
                    <div className="text-xs font-bold dark:text-white text-slate-900">
                      {i === 0 ? 'Hoje' : d.dayLabel}
                    </div>
                    <div className="text-[10px] dark:text-slate-400 text-slate-500">{d.dateLabel}</div>
                  </div>

                  <Icon className={`w-6 h-6 shrink-0 ${colorClass}`} />

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] dark:text-slate-300 text-slate-600 leading-snug">
                      {rainDescription(d.rainSumMm, d.maxProbability)}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Droplets className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[10px] font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                        {d.rainSumMm.toFixed(1).replace('.', ',')} mm
                      </span>
                      {d.maxProbability > 0 && (
                        <span className="text-[10px] dark:text-slate-500 text-slate-400 ml-1">
                          ({Math.round(d.maxProbability)}% chance)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <div className="text-xs font-bold dark:text-white text-slate-900">
                      {d.maxTemp !== null ? `${Math.round(d.maxTemp)}°` : '--'}
                    </div>
                    <div className="text-[10px] dark:text-slate-500 text-slate-400">
                      {d.minTemp !== null ? `${Math.round(d.minTemp)}°` : '--'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 dark:border-slate-800/80 border-slate-200 border-t flex items-center justify-between">
            <span className="text-[11px] dark:text-slate-400 text-slate-500">
              Chuva acumulada prevista ({days.length} {days.length === 1 ? 'dia' : 'dias'})
            </span>
            <span className="text-sm font-mono font-bold text-cyan-700 dark:text-cyan-300">
              {accumulatedMm.toFixed(1).replace('.', ',')} mm
            </span>
          </div>
        </>
      )}
    </div>
  );
};
