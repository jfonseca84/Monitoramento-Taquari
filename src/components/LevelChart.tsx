import React, { useEffect, useState } from 'react';
import { Timeframe, ChartDataPoint, City } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import { SURFACE_A, MUTED, SECTION_PAD, formatLevel, isRealHistory, isValidNumber } from './homeTheme';

interface LevelChartProps {
  selectedCity: City;
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
}

interface Reading {
  level: number;
  recorded_at: string;
}

const HOURS_TO_SHOW = 12;
const TZ = 'America/Sao_Paulo';

// Leituras brutas de river_levels pelo endpoint de histórico que o worker já expõe.
// timeframe=12h traz todas as leituras da janela; "all" traz as mais recentes existentes.
async function fetchReadings(cityId: string, timeframe: '12h' | 'all', version?: number): Promise<Reading[] | null> {
  try {
    const res = await fetch(
      `/api/history?cityId=${encodeURIComponent(cityId)}&timeframe=${timeframe}&v=${encodeURIComponent(String(version ?? ''))}`
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows
      .map((r: any) => ({ level: Number(r?.level), recorded_at: r?.recorded_at }))
      .filter((r: Reading) => isValidNumber(r.level) && typeof r.recorded_at === 'string' && !isNaN(new Date(r.recorded_at).getTime()));
  } catch {
    return null;
  }
}

// Uma leitura por hora (a última medição de cada hora, no horário de Brasília), da mais recente para a mais antiga
function lastReadingPerHour(readings: Reading[]): Reading[] {
  const byHour = new Map<string, Reading>();
  for (const r of readings) {
    const d = new Date(r.recorded_at);
    const key = `${d.toLocaleDateString('en-CA', { timeZone: TZ })}-${d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit' })}`;
    const prev = byHour.get(key);
    if (!prev || new Date(prev.recorded_at).getTime() < d.getTime()) byHour.set(key, r);
  }
  return Array.from(byHour.values()).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
}

// "Nível ao longo do dia": últimas 12 horas de leituras reais, mais recentes primeiro
export const LevelChart: React.FC<LevelChartProps> = ({ selectedCity, chartData }) => {
  const floodLevel = getCityThresholds(selectedCity).flood;
  const [hourly, setHourly] = useState<Reading[] | null>(null);

  useEffect(() => {
    let alive = true;
    setHourly(null);
    (async () => {
      let readings = await fetchReadings(selectedCity.id, '12h', selectedCity.current_level);
      // Sem leitura nas últimas 12 h (estação parada): mostra as 12 horas mais recentes que existirem
      if (readings && readings.length === 0) {
        readings = await fetchReadings(selectedCity.id, 'all', selectedCity.current_level);
      }
      // Sem o endpoint do worker: usa o histórico do banco já carregado (nunca o ilustrativo)
      if (!readings) {
        readings = isRealHistory(chartData)
          ? chartData.map((p) => ({ level: Number(p.level), recorded_at: p.timestamp }))
          : [];
      }
      if (alive) setHourly(lastReadingPerHour(readings).slice(0, HOURS_TO_SHOW + 1));
    })();
    return () => {
      alive = false;
    };
    // chartData só é usado como alternativa quando o endpoint não responde
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity.id, selectedCity.current_level]);

  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const rows = (hourly || []).slice(0, HOURS_TO_SHOW).map((r, i, list) => {
    const d = new Date(r.recorded_at);
    const time = d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    const sameDay = d.toLocaleDateString('en-CA', { timeZone: TZ }) === todayKey;
    const label = sameDay ? time : `${d.toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' })} ${time}`;
    // Variação em relação à leitura real da hora anterior
    const older = (hourly || [])[i + 1] ?? list[i + 1];
    const delta = older ? r.level - older.level : null;
    return { key: `${r.recorded_at}-${i}`, label, level: r.level, delta };
  });

  return (
    <section className={`${SURFACE_A} ${SECTION_PAD} pt-14 pb-14 flex flex-col gap-[30px]`}>
      <div className="leading-[1.2]">
        <div className="text-lg font-light">Nível ao</div>
        <div className="text-[26px] font-extrabold">Longo do dia</div>
      </div>

      {hourly === null ? (
        <p className={`text-sm ${MUTED}`}>Carregando leituras...</p>
      ) : rows.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>Nenhuma leitura registrada para esta estação.</p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => {
            const pct = floodLevel > 0 ? Math.max(0, Math.min(100, (r.level / floodLevel) * 100)) : 0;
            const up = r.delta !== null && r.delta > 0.005;
            const down = r.delta !== null && r.delta < -0.005;
            return (
              <div
                key={r.key}
                className="grid grid-cols-[minmax(64px,auto)_minmax(0,1fr)_auto_auto] gap-4 items-center py-3.5 border-b border-[#333C47]"
              >
                <span className="text-base font-extrabold tracking-[-0.02em] whitespace-nowrap">{r.label}</span>
                <div className="h-1.5 bg-[#38414C] rounded-[3px] overflow-hidden">
                  <div className="h-full bg-[#3E9BD6]" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[13px] font-semibold whitespace-nowrap" style={{ color: up ? '#F2A65A' : '#7DCB9A' }}>
                  {r.delta === null ? '' : `${up ? '▲ +' : down ? '▼ ' : '■ '}${formatLevel(r.delta)}`}
                </span>
                <span className="text-2xl font-extrabold tracking-[-0.03em] text-right whitespace-nowrap">
                  {formatLevel(r.level)} m
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
