import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { City, ChartDataPoint, Timeframe, LevelStatus } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import { getBrasiliaLastUpdatedString } from '../lib/dateUtils';
import { X, ExternalLink, MapPin, ArrowUpRight, ArrowDownRight, Minus, Waves, Activity, AlertCircle } from 'lucide-react';
import { StatusDot } from './StatusDot';

interface RiverLevelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: City;
  chartData: ChartDataPoint[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  onNavigateToMap?: () => void;
}

export const RiverLevelDetailModal: React.FC<RiverLevelDetailModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  chartData,
  timeframe,
  setTimeframe,
  onNavigateToMap
}) => {
  if (!isOpen) return null;

  const currentLevel = Number(selectedCity.current_level) || 3.12;
  const thresholds = getCityThresholds(selectedCity);
  const floodLevel = thresholds.flood;
  const alertLevel = thresholds.alert;
  const attentionLevel = thresholds.attention;

  // Calculate occupation percentage relative to flood level
  const safeFloodLevel = floodLevel > 0 ? floodLevel : 10.0;
  const occupationPercent = Math.min(100, Math.max(0, Math.round((currentLevel / safeFloodLevel) * 100)));

  // Calculate difference from flood level
  const marginDiff = currentLevel - floodLevel;
  const marginDiffStr = marginDiff >= 0
    ? `+${marginDiff.toFixed(2).replace('.', ',')} m`
    : `${marginDiff.toFixed(2).replace('.', ',')} m`;
  const isAboveFlood = marginDiff >= 0;

  // Format levels
  const currentLevelStr = currentLevel.toFixed(2).replace('.', ',');
  const floodLevelStr = floodLevel.toFixed(2).replace('.', ',');

  // Trend rate formatted
  const rateChange = typeof selectedCity.rate_of_change === 'number' && !isNaN(selectedCity.rate_of_change) ? selectedCity.rate_of_change : 0;
  const rateCmHourVal = Number((rateChange * 100).toFixed(1));
  const rateCmHourStr = Math.abs(rateCmHourVal).toString().replace('.0', '').replace('.', ',');
  const trendFormatted = `${rateCmHourVal > 0 ? '+' : rateCmHourVal < 0 ? '-' : ''}${rateCmHourStr} cm/h`;

  // Min & Max in history
  const levelsInSeries = (chartData || [])
    .map((d) => Number(d.level))
    .filter((lvl) => typeof lvl === 'number' && !isNaN(lvl));
  const minSeries = levelsInSeries.length > 0 ? Math.min(...levelsInSeries) : currentLevel * 0.8;
  const maxSeries = levelsInSeries.length > 0 ? Math.max(...levelsInSeries) : currentLevel * 1.05;
  const minSeriesStr = minSeries.toFixed(2).replace('.', ',');
  const maxSeriesStr = maxSeries.toFixed(2).replace('.', ',');

  // Period total variation
  const firstLevelInSeries = levelsInSeries.length > 0 ? levelsInSeries[0] : currentLevel;
  const variation = currentLevel - firstLevelInSeries;
  const variationStr = `${variation >= 0 ? '+' : ''}${variation.toFixed(2).replace('.', ',')} m`;

  // Status Badge styling
  const getStatusBadge = (status?: LevelStatus) => {
    switch (status) {
      case 'inundacao':
        return {
          pill: 'bg-red-500/20 text-red-400 border-red-500/60',
          dot: 'bg-red-500 shadow-red-500',
          label: 'INUNDAÇÃO',
          text: 'Cota de inundação atingida'
        };
      case 'alerta':
        return {
          pill: 'bg-orange-500/20 text-orange-400 border-orange-500/60',
          dot: 'bg-orange-500 shadow-orange-500',
          label: 'ALERTA',
          text: 'Acima da cota de alerta - atenção redobrada'
        };
      case 'atencao':
        return {
          pill: 'bg-amber-500/20 text-amber-300 border-amber-500/60',
          dot: 'bg-amber-400 shadow-amber-400',
          label: 'ATENÇÃO',
          text: 'Acima da cota de atenção - monitorando elevação'
        };
      default:
        return {
          pill: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60',
          dot: 'bg-emerald-400 shadow-emerald-400',
          label: 'NORMAL',
          text: 'Nível dentro da calha normal do rio'
        };
    }
  };

  const statusInfo = getStatusBadge(selectedCity.status_level);

  // Timeframe pill options
  const timeframes: { id: Timeframe; label: string }[] = [
    { id: '24h', label: '24 HORAS' },
    { id: '7d', label: '7 DIAS' },
    { id: '30d', label: '30 DIAS' },
    { id: '12m', label: '12 MESES' },
    { id: 'all', label: 'TODO PERÍODO' }
  ];

  // Source URL
  const sourceUrl = selectedCity.camera_url || `https://nivelguaiba.com.br/${selectedCity.slug}`;
  const sourceName = sourceUrl.includes('niveluruguay')
    ? 'niveluruguay.com.br'
    : 'nivelguaiba.com.br';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-4 md:p-6 shadow-2xl relative text-slate-100 my-auto custom-scrollbar">
        
        {/* TOP STATUS & CLOSE HEADER */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`px-3 py-0.5 rounded-full border text-[11px] font-extrabold tracking-wider flex items-center gap-1.5 ${statusInfo.pill}`}>
                <StatusDot status={selectedCity.status_level} size="sm" />
                <span>{statusInfo.label}</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {selectedCity.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span className="text-slate-300 font-medium">
                {selectedCity.river || 'Rio Taquari'}
              </span>
              <span>•</span>
              <span>atualizado {selectedCity.last_updated && selectedCity.last_updated !== 'Atualizando...' ? selectedCity.last_updated : getBrasiliaLastUpdatedString()}</span>
            </div>
            <p className="text-xs font-semibold text-red-400/90 mt-1">
              {statusInfo.text}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HERO LEVEL & COOTA OCCUPATION BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* LEFT: BIG LEVEL & TREND */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-sans">
                {currentLevelStr}
              </span>
              <span className="text-2xl font-bold text-slate-300">m</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-cyan-400">
              {selectedCity.trend === 'subindo' ? (
                <ArrowUpRight className="w-4 h-4 text-sky-400" />
              ) : selectedCity.trend === 'descendo' ? (
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <Minus className="w-4 h-4 text-slate-400" />
              )}
              <span>{trendFormatted}</span>
            </div>
          </div>

          {/* RIGHT: OCUPAÇÃO DA COTA PROGRESS BAR */}
          <div className="flex-1 max-w-md bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Ocupação da cota</span>
              <span className="text-red-400 font-extrabold text-sm">{occupationPercent}%</span>
            </div>

            {/* PROGRESS TRACK */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isAboveFlood
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-lg shadow-red-500/50'
                    : selectedCity.status_level === 'alerta'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                }`}
                style={{ width: `${occupationPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2">
              <span>0 m</span>
              <span>cota {floodLevelStr} m</span>
            </div>
          </div>
        </div>

        {/* ELEVATION HISTORY CHART */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs md:text-sm font-bold text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Histórico de elevação <span className="text-slate-500 font-normal">• {chartData.length} leituras</span>
              </h3>
            </div>

            {/* LEGEND & TIMEFRAME SELECTOR */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> nível
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 border-b border-dashed border-red-400 inline-block" /> cota de inundação
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                {timeframes.map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      timeframe === tf.id
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RECHARTS AREA CHART */}
          <div className="w-full h-48 md:h-56 relative">
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

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="modalLevelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isAboveFlood ? '#EF4444' : '#0284C7'} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={isAboveFlood ? '#991B1B' : '#0284C7'} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
                  itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }}
                />
                <ReferenceLine
                  y={floodLevel}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{ value: `Cota (${floodLevelStr}m)`, fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke={isAboveFlood ? '#EF4444' : '#38BDF8'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#modalLevelGrad)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
            <span>mín {minSeriesStr} m</span>
            <span>máx {maxSeriesStr} m</span>
          </div>
        </div>

        {/* 10 METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {/* CARD 1: NÍVEL ATUAL */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">NÍVEL ATUAL</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-red-400 font-mono">{currentLevelStr} m</span>
            </div>
          </div>

          {/* CARD 2: COTA DE INUNDAÇÃO */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">COTA DE INUNDAÇÃO</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-white font-mono">{floodLevelStr} m</span>
            </div>
          </div>

          {/* CARD 3: MARGEM P/ TRANSBORDO */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">MARGEM P/ TRANSBORDO</span>
            <div className="mt-2">
              <span className={`text-xl md:text-2xl font-extrabold font-mono ${isAboveFlood ? 'text-red-400' : 'text-emerald-400'}`}>
                {marginDiffStr}
              </span>
              <p className="text-[10px] text-slate-400">{isAboveFlood ? 'acima da cota' : 'abaixo da cota'}</p>
            </div>
          </div>

          {/* CARD 4: TENDÊNCIA */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TENDÊNCIA</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-cyan-400 font-mono">{trendFormatted}</span>
            </div>
          </div>

          {/* CARD 5: VARIAÇÃO NO PERÍODO */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">VARIAÇÃO NO PERÍODO</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">{variationStr}</span>
              <p className="text-[10px] text-slate-400">{chartData.length} leituras</p>
            </div>
          </div>

          {/* CARD 6: MÍN / MÁX (SÉRIE) */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">MÍN / MÁX (SÉRIE)</span>
            <div className="mt-2">
              <span className="text-lg md:text-xl font-extrabold text-white font-mono">{minSeriesStr} / {maxSeriesStr} m</span>
            </div>
          </div>

          {/* CARD 7: RECORDE HISTÓRICO */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">RECORDE HISTÓRICO</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">33,66 m</span>
              <p className="text-[10px] text-slate-400">01/05/2024</p>
            </div>
          </div>

          {/* CARD 8: OCUPAÇÃO DA COTA */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">OCUPAÇÃO DA COTA</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-red-400 font-mono">{occupationPercent} %</span>
            </div>
          </div>

          {/* CARD 9: CHUVA HOJE */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">CHUVA HOJE</span>
            <div className="mt-2">
              <span className="text-xl md:text-2xl font-extrabold text-slate-100 font-mono">0.0 mm</span>
              <p className="text-[10px] text-slate-400">prev. 0.0 mm</p>
            </div>
          </div>

          {/* CARD 10: ÚLTIMA LEITURA / SITUAÇÃO */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">SITUAÇÃO</span>
            <div className="mt-2">
              <span className="text-lg font-extrabold text-red-400 font-sans">{statusInfo.label}</span>
              <p className="text-[10px] text-slate-400">{selectedCity.last_updated || 'ao vivo'}</p>
            </div>
          </div>
        </div>

        {/* FOOTER EXTERNAL LINKS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs font-semibold">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver fonte no {sourceName}</span>
          </a>

          {onNavigateToMap && (
            <button
              onClick={() => {
                onClose();
                onNavigateToMap();
              }}
              className="text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Ver no mapa</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
