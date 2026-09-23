import React from 'react';
import { Timeframe, ChartDataPoint, City } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import { SURFACE_A, LINE, MUTED, SECTION_PAD, formatLevel, isValidNumber } from './homeTheme';

interface LevelChartProps {
  selectedCity: City;
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
}

const MAX_LIST_ROWS = 12;

// "Nível ao longo do dia": leituras reais do histórico, mais recentes primeiro
export const LevelChart: React.FC<LevelChartProps> = ({
  selectedCity,
  chartData,
  timeframe,
  setTimeframe
}) => {
  const timeframes: { id: Timeframe; label: string }[] = [
    { id: '6h', label: '6 h' },
    { id: '12h', label: '12 h' },
    { id: '24h', label: '24 h' },
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'all', label: 'Tudo' }
  ];

  const floodLevel = getCityThresholds(selectedCity).flood;

  const points = (chartData || []).filter((d) => isValidNumber(Number(d?.level)));

  // Variação de cada leitura em relação à anterior
  const rows = points
    .map((p, i) => {
      const level = Number(p.level);
      const prev = i > 0 ? Number(points[i - 1].level) : null;
      return { key: `${p.timestamp}-${i}`, time: p.time, level, delta: prev !== null ? level - prev : null };
    })
    .reverse()
    .slice(0, MAX_LIST_ROWS);

  return (
    <section className={`${SURFACE_A} ${SECTION_PAD} py-12 sm:py-14 flex flex-col gap-[30px]`}>

      {/* TÍTULO & SELETOR DE PERÍODO */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="leading-[1.2]">
          <div className="text-lg font-light">Nível ao</div>
          <div className="text-[26px] font-extrabold">Longo do dia</div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto touch-pan-x max-w-full no-scrollbar">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              aria-pressed={timeframe === tf.id}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-[4px] text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                timeframe === tf.id ? 'bg-white text-[#2B333D]' : `${MUTED} hover:bg-[#3A434E]`
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>
          Ainda não há histórico suficiente para exibir este período. As medições são registradas continuamente.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => {
            const pct = floodLevel > 0 ? Math.max(0, Math.min(100, (r.level / floodLevel) * 100)) : 0;
            const up = r.delta !== null && r.delta > 0.005;
            const down = r.delta !== null && r.delta < -0.005;
            return (
              <div
                key={r.key}
                className={`grid grid-cols-[64px_minmax(0,1fr)_auto_auto] sm:grid-cols-[96px_minmax(0,1fr)_auto_auto] gap-3 sm:gap-4 items-center py-3.5 border-b ${LINE}`}
              >
                <span className="text-sm sm:text-base font-extrabold tracking-[-0.02em] whitespace-nowrap">{r.time}</span>
                <div className="h-1.5 bg-[#38414C] rounded-[3px] overflow-hidden">
                  <div className="h-full bg-[#5AA9D6]" style={{ width: `${pct}%` }} />
                </div>
                <span
                  className="text-[13px] font-semibold whitespace-nowrap"
                  style={{ color: up ? '#F2B872' : '#8FD4A8' }}
                >
                  {r.delta === null ? '' : `${up ? '▲ +' : down ? '▼ ' : '■ '}${formatLevel(r.delta)}`}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-[-0.03em] text-right whitespace-nowrap">
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
