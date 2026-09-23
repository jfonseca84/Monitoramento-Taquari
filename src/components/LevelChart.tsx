import React from 'react';
import { Timeframe, ChartDataPoint, City } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import { SURFACE_A, MUTED, SECTION_PAD, formatLevel, isValidNumber } from './homeTheme';

interface LevelChartProps {
  selectedCity: City;
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
}

// Linhas do modelo: agora, 1 a 6 h atrás e depois 8, 10 e 12 h atrás (uma leitura por hora)
const HOURS_BACK = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12];
// A leitura mais recente só é rotulada "Agora" se for de até 90 min atrás
const NOW_WINDOW_MS = 90 * 60 * 1000;

// "Nível ao longo do dia": leituras reais do histórico, mais recentes primeiro
export const LevelChart: React.FC<LevelChartProps> = ({ selectedCity, chartData }) => {
  const floodLevel = getCityThresholds(selectedCity).flood;

  // Histórico por hora (24 h), da mais recente para a mais antiga
  const hourly = (chartData || [])
    .filter((d) => isValidNumber(Number(d?.level)))
    .slice()
    .reverse();

  const rows = HOURS_BACK
    .filter((b) => b < hourly.length)
    .map((b) => {
      const p = hourly[b];
      const level = Number(p.level);
      const older = hourly[b + 1];
      const delta = older ? level - Number(older.level) : null;
      const t = new Date(p.timestamp).getTime();
      const isNow = b === 0 && !isNaN(t) && Date.now() - t <= NOW_WINDOW_MS;
      return { key: `${p.timestamp}-${b}`, label: isNow ? 'Agora' : p.time, level, delta };
    });

  return (
    <section className={`${SURFACE_A} ${SECTION_PAD} pt-14 pb-14 flex flex-col gap-[30px]`}>
      <div className="leading-[1.2]">
        <div className="text-lg font-light">Nível ao</div>
        <div className="text-[26px] font-extrabold">Longo do dia</div>
      </div>

      {rows.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>
          Ainda não há histórico suficiente para exibir as leituras do dia.
        </p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => {
            const pct = floodLevel > 0 ? Math.max(0, Math.min(100, (r.level / floodLevel) * 100)) : 0;
            const up = r.delta !== null && r.delta > 0.02;
            const down = r.delta !== null && r.delta < -0.02;
            return (
              <div
                key={r.key}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto_auto] gap-4 items-center py-3.5 border-b border-[#333C47]"
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
