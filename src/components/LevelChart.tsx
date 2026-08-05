import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Timeframe, ChartDataPoint, City } from '../types';
import { getCityThresholds } from '../data/cityThresholds';

interface LevelChartProps {
  selectedCity: City;
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
}

export const LevelChart: React.FC<LevelChartProps> = ({
  selectedCity,
  chartData,
  timeframe,
  setTimeframe
}) => {
  const timeframes: { id: Timeframe; label: string }[] = [
    { id: '6h', label: '6 HORAS' },
    { id: '12h', label: '12 HORAS' },
    { id: '24h', label: '24 HORAS' },
    { id: '7d', label: '7 DIAS' },
    { id: '30d', label: '30 DIAS' },
    { id: 'all', label: 'TODO PERÍODO' }
  ];

  const currentLevel = Number(selectedCity?.current_level) || 3.12;

  const thresholds = getCityThresholds(selectedCity);
  const floodLevel = thresholds.flood;
  const alertLevel = thresholds.alert;
  const attentionLevel = thresholds.attention;
  const normalLevel = thresholds.normal;

  const validLevels = (chartData || [])
    .map((d) => Number(d?.level))
    .filter((lvl) => typeof lvl === 'number' && !isNaN(lvl));

  const maxDataLevel = validLevels.length > 0 ? Math.max(...validLevels, currentLevel, floodLevel) : Math.max(currentLevel, floodLevel);
  const minDataLevel = validLevels.length > 0 ? Math.min(...validLevels, currentLevel, normalLevel) : Math.min(currentLevel, normalLevel);

  const calcYMin = Math.max(0, Math.floor(minDataLevel - 1));
  const calcYMax = Math.ceil(maxDataLevel + 2);
  const yMin = isFinite(calcYMin) ? calcYMin : 0;
  const yMax = isFinite(calcYMax) ? calcYMax : 20;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const levelVal = data.level;

      let statusLabel = 'Normal';
      let statusColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

      if (levelVal >= floodLevel) {
        statusLabel = 'Inundação';
        statusColor = 'text-red-400 bg-red-950/80 border-red-800';
      } else if (levelVal >= alertLevel) {
        statusLabel = 'Alerta';
        statusColor = 'text-orange-400 bg-orange-950/80 border-orange-800';
      } else if (levelVal >= attentionLevel) {
        statusLabel = 'Atenção';
        statusColor = 'text-amber-300 bg-amber-950/80 border-amber-800';
      }

      return (
        <div className="dark:bg-[#0F172A] bg-white dark:border-slate-700 border-slate-300 p-3 rounded-xl shadow-2xl text-xs font-sans">
          <p className="dark:text-slate-400 text-slate-600 mb-1 font-mono">Horário: <span className="dark:text-white text-slate-900 font-semibold">{label}</span></p>
          <div className="flex items-center gap-2 my-1">
            <span className="dark:text-slate-300 text-slate-700">Nível do Rio:</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold text-sm">
              {levelVal.toFixed(2).replace('.', ',')} m
            </span>
          </div>
          <span className={`inline-block px-2 py-0.5 mt-1 rounded-md border text-[10px] font-bold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-5 lg:p-6 shadow-2xl flex flex-col justify-between transition-colors">
      
      {/* HEADER & PERIOD SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xs font-bold dark:text-slate-400 text-slate-500 tracking-wider uppercase">
            HISTÓRICO DE LEITURAS DA ESTAÇÃO
          </h3>
          <p className="text-sm font-bold dark:text-white text-slate-900 mt-0.5">
            Evolução do Nível ({selectedCity.name})
          </p>
        </div>

        {/* TIMEFRAME BUTTONS */}
        <div className="flex items-center gap-1 overflow-x-auto touch-pan-x max-w-full no-scrollbar dark:bg-slate-900/80 bg-slate-100 p-1 rounded-xl dark:border-slate-800 border-slate-200 border w-full sm:w-auto">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                timeframe === tf.id
                  ? 'dark:bg-[#1E293B] bg-white text-cyan-700 dark:text-cyan-400 dark:border-cyan-800 border-cyan-300 border shadow-md'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* RECHARTS CANVAS */}
      <div className="relative w-full h-[260px] sm:h-[300px]">
        
        {/* INSUFFICIENT DATA OVERLAY */}
        {(!chartData || chartData.length < 2) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs rounded-2xl text-center p-4 border border-slate-800/60">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-2 animate-pulse" />
            <p className="text-xs sm:text-sm font-bold text-slate-200">
              Ainda não há histórico suficiente para exibir este período.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              As medições telemétricas estão sendo registradas continuamente.
            </p>
          </div>
        )}

        {/* CURRENT LEVEL BADGE OVER CHART */}
        <div className="absolute right-4 top-2 z-10 bg-cyan-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-lg shadow-lg shadow-cyan-900/50 border border-cyan-400/50 animate-bounce">
          {currentLevel.toFixed(2).replace('.', ',')} m
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              minTickGap={25}
              axisLine={{ stroke: '#1E293B' }}
            />

            <YAxis
              domain={[yMin, yMax]}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1E293B' }}
              tickFormatter={(val) => `${val.toFixed(2)}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* REFERENCE LINES FOR THRESHOLDS */}
            <ReferenceLine
              y={floodLevel}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={alertLevel}
              stroke="#F97316"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={attentionLevel}
              stroke="#EAB308"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={normalLevel}
              stroke="#22C55E"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* AREA UNDER LINE */}
            <Area
              type="monotone"
              dataKey="level"
              stroke="none"
              fill="url(#levelGradient)"
            />

            {/* MAIN GLOWING BLUE LINE */}
            <Line
              type="monotone"
              dataKey="level"
              stroke="#38BDF8"
              strokeWidth={3}
              dot={{ r: 3, fill: '#38BDF8', stroke: '#0284C7', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#38BDF8', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* CHART THRESHOLDS LEGEND AT BOTTOM */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 pt-3 dark:border-slate-800/80 border-slate-200 border-t text-[11px] font-medium dark:text-slate-300 text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-red-500 rounded-full" />
          <span>Inundação ({floodLevel.toFixed(2).replace('.', ',')}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-orange-500 rounded-full" />
          <span>Alerta ({alertLevel.toFixed(2).replace('.', ',')}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
          <span>Atenção ({attentionLevel.toFixed(2).replace('.', ',')}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-400 rounded-full" />
          <span>Normal ({normalLevel.toFixed(2).replace('.', ',')}m)</span>
        </div>
      </div>

    </div>
  );
};
