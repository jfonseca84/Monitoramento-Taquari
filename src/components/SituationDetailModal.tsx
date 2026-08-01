import React, { useState } from 'react';
import { City } from '../types';
import { calculateStatusLevel, getCityThresholds } from '../data/initialData';
import { getBrasiliaTimeString } from '../lib/dateUtils';
import {
  X,
  Radio,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Activity,
  PhoneCall,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MapPin,
  Waves
} from 'lucide-react';

interface SituationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  initialCity?: City | null;
  onSelectCityForChart?: (city: City) => void;
}

export const SituationDetailModal: React.FC<SituationDetailModalProps> = ({
  isOpen,
  onClose,
  cities,
  initialCity,
  onSelectCityForChart
}) => {
  if (!isOpen || !cities || cities.length === 0) return null;

  // Sort cities by status criticality (most critical first)
  const statusWeight = { inundacao: 4, alerta: 3, atencao: 2, normal: 1 };
  const sortedCities = [...cities].sort((a, b) => {
    const threshA = getCityThresholds(a);
    const threshB = getCityThresholds(b);
    const statusA = calculateStatusLevel(a.current_level || 0, threshA);
    const statusB = calculateStatusLevel(b.current_level || 0, threshB);
    const weightA = statusWeight[statusA] || 1;
    const weightB = statusWeight[statusB] || 1;

    if (weightB !== weightA) return weightB - weightA;
    return (b.current_level || 0) - (a.current_level || 0);
  });

  const [selectedCityId, setSelectedCityId] = useState<string>(
    initialCity?.id || sortedCities[0]?.id || ''
  );

  const activeCity = cities.find((c) => c.id === selectedCityId) || sortedCities[0];
  const activeThresholds = getCityThresholds(activeCity);
  const activeStatus = calculateStatusLevel(activeCity.current_level || 0, activeThresholds);

  const currentLevel = activeCity.current_level || 0;
  const rateOfChange = activeCity.rate_of_change || 0; // m/h

  // Hourly variations calculations
  const var1hMeters = rateOfChange;
  const var1hCm = Math.round(var1hMeters * 100);

  const var6hMeters = rateOfChange * 6;
  const var6hCm = Math.round(var6hMeters * 100);

  // Future mathematical projections (3h, 6h, 12h)
  const proj3h = Math.max(0, currentLevel + rateOfChange * 3);
  const proj6h = Math.max(0, currentLevel + rateOfChange * 6);
  const proj12h = Math.max(0, currentLevel + rateOfChange * 12);

  // Status color helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'inundacao':
        return {
          bg: 'bg-red-500/20 text-red-300 border-red-500/50',
          icon: <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />,
          label: 'RISCO DE INUNDAÇÃO'
        };
      case 'alerta':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'COTA DE ALERTA'
        };
      case 'atencao':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
          label: 'COTA DE ATENÇÃO'
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'SITUAÇÃO NORMAL'
        };
    }
  };

  const statusBadge = getStatusBadge(activeStatus);

  // Trend formatting
  const getTrendIcon = (trend?: string) => {
    if (trend === 'subindo') return <TrendingUp className="w-5 h-5 text-rose-400" />;
    if (trend === 'descendo') return <TrendingDown className="w-5 h-5 text-emerald-400" />;
    return <Minus className="w-5 h-5 text-slate-400" />;
  };

  const getTrendLabel = (trend?: string) => {
    if (trend === 'subindo') return 'Subindo';
    if (trend === 'descendo') return 'Descendo';
    return 'Estável';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Painel de Situação do Vale do Taquari
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Central telemétrica de monitoramento em tempo real das bacias hidrográficas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CITY SELECTOR TABS (SORTED BY CRITICALITY PRECEDENCE) */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/50 overflow-x-auto no-scrollbar flex items-center gap-2">
          {sortedCities.map((city) => {
            const thresh = getCityThresholds(city);
            const cStatus = calculateStatusLevel(city.current_level || 0, thresh);
            const isSelected = city.id === activeCity.id;

            let dotColor = 'bg-emerald-400';
            if (cStatus === 'inundacao') dotColor = 'bg-red-500 animate-ping';
            else if (cStatus === 'alerta' || cStatus === 'atencao') dotColor = 'bg-amber-400';

            return (
              <button
                key={city.id}
                onClick={() => setSelectedCityId(city.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span>{city.name}</span>
                <span className="font-mono text-[11px] opacity-80">
                  {(city.current_level || 0).toFixed(2).replace('.', ',')}m
                </span>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* PRIMARY CITY STATUS BANNER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">{activeCity.name}</h3>
                <span className="text-xs text-slate-400 font-mono">({activeCity.river || 'Rio Taquari'})</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Atualizado às {getBrasiliaTimeString(activeCity.updated_at || activeCity.last_updated)}</span>
                </div>
              </div>
            </div>

            {/* BIG LEVEL DISPLAY */}
            <div className="flex items-baseline gap-2 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800/80 w-full md:w-auto justify-between md:justify-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nível Atual</span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">
                {currentLevel.toFixed(2).replace('.', ',')} <span className="text-lg text-slate-300">m</span>
              </span>
            </div>
          </div>

          {/* TELEMETRY VARIATION METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* TENDÊNCIA */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Tendência</span>
              <div className="flex items-center gap-2 mt-2">
                {getTrendIcon(activeCity.trend)}
                <span className="text-sm font-bold text-slate-100">{getTrendLabel(activeCity.trend)}</span>
              </div>
            </div>

            {/* VELOCIDADE / HORA */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Velocidade Atual</span>
              <div className="flex items-center gap-1.5 mt-2 font-mono">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-300">
                  {var1hCm > 0 ? `+${var1hCm}` : var1hCm} cm/h
                </span>
              </div>
            </div>

            {/* ÚLTIMA HORA */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Última 1 Hora</span>
              <div className="flex items-center gap-1.5 mt-2 font-mono">
                <span className={`text-sm font-bold ${var1hCm > 0 ? 'text-rose-400' : var1hCm < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {var1hCm > 0 ? `+${var1hCm}` : var1hCm} cm
                </span>
              </div>
            </div>

            {/* ÚLTIMAS 6 HORAS */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Últimas 6 Horas</span>
              <div className="flex items-center gap-1.5 mt-2 font-mono">
                <span className={`text-sm font-bold ${var6hCm > 0 ? 'text-rose-400' : var6hCm < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {var6hCm > 0 ? `+${var6hCm}` : var6hCm} cm
                </span>
              </div>
            </div>

          </div>

          {/* HYDROLOGICAL THRESHOLD PROGRESS GAUGE */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                Cotas Hidrológicas ({activeCity.name})
              </span>
              <span className="font-mono text-cyan-400 font-bold">{currentLevel.toFixed(2)}m</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                <div className="text-[10px] text-slate-400 uppercase">Normal</div>
                <div className="font-mono font-bold mt-0.5">{activeThresholds.normal.toFixed(2)}m</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-950/40 border border-yellow-800/50 text-yellow-300">
                <div className="text-[10px] text-slate-400 uppercase">Atenção</div>
                <div className="font-mono font-bold mt-0.5">{activeThresholds.attention.toFixed(2)}m</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300">
                <div className="text-[10px] text-slate-400 uppercase">Alerta</div>
                <div className="font-mono font-bold mt-0.5">{activeThresholds.alert.toFixed(2)}m</div>
              </div>
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300">
                <div className="text-[10px] text-slate-400 uppercase">Inundação</div>
                <div className="font-mono font-bold mt-0.5">{activeThresholds.flood.toFixed(2)}m</div>
              </div>
            </div>
          </div>

          {/* PROJECTION SECTION ("TENDÊNCIA ESTIMADA") */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tendência Estimada</h4>
                  <p className="text-xs text-slate-400">
                    Projeção matemática telemétrica baseada na velocidade recente (+/- m/h)
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                PREPARED FOR AI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Próximas 3 Horas</span>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {proj3h.toFixed(2).replace('.', ',')} m
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  {rateOfChange >= 0 ? `+${(rateOfChange * 3).toFixed(2)}m` : `${(rateOfChange * 3).toFixed(2)}m`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Próximas 6 Horas</span>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {proj6h.toFixed(2).replace('.', ',')} m
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  {rateOfChange >= 0 ? `+${(rateOfChange * 6).toFixed(2)}m` : `${(rateOfChange * 6).toFixed(2)}m`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Próximas 12 Horas</span>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {proj12h.toFixed(2).replace('.', ',')} m
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  {rateOfChange >= 0 ? `+${(rateOfChange * 12).toFixed(2)}m` : `${(rateOfChange * 12).toFixed(2)}m`}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span>
                Com base na velocidade atual ({rateOfChange > 0 ? '+' : ''}{rateOfChange.toFixed(2)} m/h), tendência estimada para as próximas 3 horas: <strong className="text-cyan-300">{proj3h.toFixed(2).replace('.', ',')} m</strong>.
              </span>
            </div>
          </div>

          {/* EMERGENCY CONTACTS FOOTER STRIP */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-200/90">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Em caso de emergência ou cota de risco atingida, contate a Defesa Civil.</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold shrink-0">
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                DEFESA CIVIL 199
              </span>
              <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                BOMBEIROS 193
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          {onSelectCityForChart && (
            <button
              onClick={() => {
                onSelectCityForChart(activeCity);
                onClose();
              }}
              className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
            >
              <span>Ver Gráfico Histórico de {activeCity.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors ml-auto"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
