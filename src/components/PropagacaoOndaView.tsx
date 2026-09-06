import React, { useState, useMemo } from 'react';
import { 
  Waves, 
  Clock, 
  Info, 
  Activity, 
  X, 
  CheckCircle2, 
  Zap, 
  BarChart2,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { City } from '../types';
import { PropagationRealMap } from './PropagationRealMap';

interface PropagacaoOndaViewProps {
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  availableCities?: City[];
}

export interface StationPropagationNode {
  id: string;
  name: string;
  river: string;
  distanceKm: number;
  timeToArrival: string;
  currentLevel: number;
  peakLevelPredicted: number;
  deltaLevel: number;
  peakFlowPredicted: number;
  normalThreshold: number;
  attentionThreshold: number;
  warningThreshold: number;
  floodThreshold: number;
  status: 'normal' | 'atencao' | 'alerta' | 'inundacao';
  trend: 'subindo' | 'estavel' | 'descendo';
  peakTimeObserved?: string;
  peakTimePredicted?: string;
  positionOnMap: { top: string; left: string };
  isMontante: boolean;
}

export interface HydrologicalStation {
  id: string;
  name: string;
  river: string;
  distanceKm: number;
  color: string;
  currentLevel: number;
  rateOfChange: string;
  trend: 'up' | 'down' | 'stable';
  waveStatus: 'Passou o pico' | 'Em elevação' | 'A caminho' | 'Aguardando';
  predictedPeakLevel: number;
  predictedPeakLevelRange: string;
  predictedPeakTime: string;
  predictedPeakTimeRange: string;
  estimatedArrival: string;
  pairwiseStats?: {
    nextStationId: string;
    nextStationName: string;
    transitTime: string;
    medianTime: string;
    rangeMinMax: string;
  };
}

// 1. OFFICIAL BASIN TOPOLOGICAL STATIONS DATASET (TAQUARI-ANTAS HYDROGRAPHIC NETWORK)
// Ordered strictly from HEADWATER (Montante / Alto Taquari) to MOUTH (Jusante / Foz)
export const HYDROLOGICAL_STATIONS: HydrologicalStation[] = [
  {
    id: 'santatereza',
    name: 'Santa Tereza',
    river: 'Rio das Antas (Cabeceira / Montante)',
    distanceKm: 0,
    color: '#06b6d4', // Cyan
    currentLevel: 12.80,
    rateOfChange: '+0,32 m',
    trend: 'up',
    waveStatus: 'Passou o pico',
    predictedPeakLevel: 13.50,
    predictedPeakLevelRange: '13,1 - 13,8 m',
    predictedPeakTime: '08:10',
    predictedPeakTimeRange: '07:50 - 08:30',
    estimatedArrival: '07:30 (30/05)',
    pairwiseStats: {
      nextStationId: 'mucum',
      nextStationName: 'Muçum',
      transitTime: '3h 30min',
      medianTime: '3h 20min',
      rangeMinMax: '2h 40 - 4h 10'
    }
  },
  {
    id: 'mucum',
    name: 'Muçum',
    river: 'Rio Taquari / Antas',
    distanceKm: 28,
    color: '#10b981', // Emerald Green
    currentLevel: 19.42,
    rateOfChange: '+0,24 m',
    trend: 'up',
    waveStatus: 'Passou o pico',
    predictedPeakLevel: 20.40,
    predictedPeakLevelRange: '20,1 - 20,8 m',
    predictedPeakTime: '11:40',
    predictedPeakTimeRange: '11:20 - 12:10',
    estimatedArrival: '09:30 (30/05)',
    pairwiseStats: {
      nextStationId: 'encantado',
      nextStationName: 'Encantado',
      transitTime: '4h 20min',
      medianTime: '4h 05min',
      rangeMinMax: '3h 10 - 6h 20'
    }
  },
  {
    id: 'encantado',
    name: 'Encantado',
    river: 'Rio Taquari',
    distanceKm: 51,
    color: '#eab308', // Amber
    currentLevel: 16.80,
    rateOfChange: '+0,18 m',
    trend: 'up',
    waveStatus: 'Em elevação',
    predictedPeakLevel: 17.60,
    predictedPeakLevelRange: '17,2 - 18,1 m',
    predictedPeakTime: '16:00',
    predictedPeakTimeRange: '15:40 - 16:30',
    estimatedArrival: 'Atingida (10:20)',
    pairwiseStats: {
      nextStationId: 'rocasales',
      nextStationName: 'Roca Sales',
      transitTime: '2h 45min',
      medianTime: '2h 40min',
      rangeMinMax: '2h 00 - 3h 50'
    }
  },
  {
    id: 'rocasales',
    name: 'Roca Sales',
    river: 'Rio Taquari',
    distanceKm: 71,
    color: '#f97316', // Orange
    currentLevel: 13.10,
    rateOfChange: '+0,15 m',
    trend: 'up',
    waveStatus: 'Em elevação',
    predictedPeakLevel: 14.90,
    predictedPeakLevelRange: '14,5 - 15,4 m',
    predictedPeakTime: '13:00',
    predictedPeakTimeRange: '12:30 - 13:45',
    estimatedArrival: '12:45 - 13:30',
    pairwiseStats: {
      nextStationId: 'lajeado',
      nextStationName: 'Lajeado',
      transitTime: '3h 10min',
      medianTime: '3h 05min',
      rangeMinMax: '2h 20 - 4h 10'
    }
  },
  {
    id: 'lajeado',
    name: 'Lajeado',
    river: 'Rio Taquari (Médio Taquari)',
    distanceKm: 95,
    color: '#f43f5e', // Rose
    currentLevel: 22.31,
    rateOfChange: '+0,14 m',
    trend: 'up',
    waveStatus: 'A caminho',
    predictedPeakLevel: 26.20,
    predictedPeakLevelRange: '25,8 - 27,1 m',
    predictedPeakTime: '17:30',
    predictedPeakTimeRange: '17:10 - 18:00',
    estimatedArrival: '16:30 - 17:20',
    pairwiseStats: {
      nextStationId: 'estrela',
      nextStationName: 'Estrela',
      transitTime: '2h 50min',
      medianTime: '2h 45min',
      rangeMinMax: '2h 00 - 3h 40'
    }
  },
  {
    id: 'estrela',
    name: 'Estrela',
    river: 'Rio Taquari',
    distanceKm: 101,
    color: '#a855f7', // Purple
    currentLevel: 11.80,
    rateOfChange: '+0,08 m',
    trend: 'up',
    waveStatus: 'A caminho',
    predictedPeakLevel: 22.10,
    predictedPeakLevelRange: '21,6 - 22,8 m',
    predictedPeakTime: '20:20',
    predictedPeakTimeRange: '19:50 - 20:50',
    estimatedArrival: '19:20 - 20:10',
    pairwiseStats: {
      nextStationId: 'cruzeiro',
      nextStationName: 'Cruzeiro do Sul',
      transitTime: '1h 40min',
      medianTime: '1h 30min',
      rangeMinMax: '1h 10 - 2h 10'
    }
  },
  {
    id: 'cruzeiro',
    name: 'Cruzeiro do Sul',
    river: 'Rio Taquari',
    distanceKm: 112,
    color: '#38bdf8', // Sky Blue
    currentLevel: 10.50,
    rateOfChange: '+0,06 m',
    trend: 'up',
    waveStatus: 'A caminho',
    predictedPeakLevel: 20.40,
    predictedPeakLevelRange: '19,8 - 21,2 m',
    predictedPeakTime: '21:50',
    predictedPeakTimeRange: '21:20 - 22:20',
    estimatedArrival: '21:00 - 21:40',
    pairwiseStats: {
      nextStationId: 'bomretirodosul',
      nextStationName: 'Bom Retiro do Sul',
      transitTime: '1h 20min',
      medianTime: '1h 15min',
      rangeMinMax: '1h 00 - 1h 40'
    }
  },
  {
    id: 'bomretirodosul',
    name: 'Bom Retiro do Sul',
    river: 'Rio Taquari (Foz / Jusante)',
    distanceKm: 128,
    color: '#6366f1', // Indigo
    currentLevel: 9.45,
    rateOfChange: '+0,05 m',
    trend: 'stable',
    waveStatus: 'A caminho',
    predictedPeakLevel: 18.70,
    predictedPeakLevelRange: '18,2 - 19,3 m',
    predictedPeakTime: '23:10',
    predictedPeakTimeRange: '22:40 - 23:45',
    estimatedArrival: '22:10 - 23:00'
  }
];

// Helper to normalize station ID from external sidebar/city selection
export function normalizeStationId(rawId?: string): string {
  if (!rawId) return 'lajeado';
  const clean = rawId.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.includes('santatereza') || clean.includes('santa')) return 'santatereza';
  if (clean.includes('mucum')) return 'mucum';
  if (clean.includes('encantado')) return 'encantado';
  if (clean.includes('rocasales') || clean.includes('roca')) return 'rocasales';
  if (clean.includes('lajeado')) return 'lajeado';
  if (clean.includes('estrela')) return 'estrela';
  if (clean.includes('cruzeiro')) return 'cruzeiro';
  if (clean.includes('bomretiro') || clean.includes('bom')) return 'bomretirodosul';
  if (clean.includes('taquari') || clean.includes('mariante')) return 'bomretirodosul';
  if (clean.includes('riopardo') || clean.includes('pardo')) return 'bomretirodosul';
  return 'lajeado';
}

// 2. CHART TIME SERIES DATA (OBSERVED BEFORE AGORA, PROJECTED AFTER AGORA)
const HYDROGRAPHIC_TIME_SERIES = [
  {
    time: '00:00 30/05',
    isAgora: false,
    santatereza_obs: 5.20,
    mucum_obs: 4.80,
    encantado_obs: 4.50,
    rocasales_obs: 4.20,
    lajeado_obs: 4.00,
    estrela_obs: 3.90,
    cruzeiro_obs: 3.85,
    bomRetiro_obs: 3.80
  },
  {
    time: '06:00 30/05',
    isAgora: false,
    santatereza_obs: 12.80,
    mucum_obs: 11.20,
    encantado_obs: 7.80,
    rocasales_obs: 5.60,
    lajeado_obs: 4.50,
    estrela_obs: 4.20,
    cruzeiro_obs: 4.10,
    bomRetiro_obs: 4.00
  },
  {
    time: '12:00 30/05', // AGORA VERTICAL LINE STAMP
    isAgora: true,
    santatereza_obs: 12.80,
    santatereza_proj: 12.80,

    mucum_obs: 19.42,
    mucum_proj: 19.42,

    encantado_obs: 16.80,
    encantado_proj: 16.80,

    rocasales_obs: 13.10,
    rocasales_proj: 13.10,

    lajeado_obs: 7.20,
    lajeado_proj: 7.20,

    estrela_obs: 6.10,
    estrela_proj: 6.10,

    cruzeiro_obs: 5.80,
    cruzeiro_proj: 5.80,

    bomRetiro_obs: 5.20,
    bomRetiro_proj: 5.20
  },
  {
    time: '18:00 30/05',
    isAgora: false,
    santatereza_proj: 10.20,
    mucum_proj: 20.40, // Peak Muçum
    encantado_proj: 17.60, // Peak Encantado
    rocasales_proj: 14.20,
    lajeado_proj: 11.50,
    estrela_proj: 9.80,
    cruzeiro_proj: 8.50,
    bomRetiro_proj: 7.60
  },
  {
    time: '00:00 31/05',
    isAgora: false,
    santatereza_proj: 8.10,
    mucum_proj: 18.20,
    encantado_proj: 16.50,
    rocasales_proj: 14.90, // Peak Roca Sales
    lajeado_proj: 15.80,
    estrela_proj: 13.20,
    cruzeiro_proj: 11.80,
    bomRetiro_proj: 10.40
  },
  {
    time: '06:00 31/05',
    isAgora: false,
    santatereza_proj: 6.80,
    mucum_proj: 15.10,
    encantado_proj: 14.80,
    rocasales_proj: 13.80,
    lajeado_proj: 21.40,
    estrela_proj: 17.60,
    cruzeiro_proj: 15.20,
    bomRetiro_proj: 13.80
  },
  {
    time: '12:00 31/05',
    isAgora: false,
    santatereza_proj: 5.90,
    mucum_proj: 12.80,
    encantado_proj: 12.90,
    rocasales_proj: 12.10,
    lajeado_proj: 25.40,
    estrela_proj: 21.00,
    cruzeiro_proj: 18.50,
    bomRetiro_proj: 16.50
  },
  {
    time: '18:00 31/05',
    isAgora: false,
    santatereza_proj: 5.20,
    mucum_proj: 10.50,
    encantado_proj: 11.10,
    rocasales_proj: 10.80,
    lajeado_proj: 26.20, // Peak Lajeado (26,2 m)
    estrela_proj: 22.10, // Peak Estrela
    cruzeiro_proj: 20.40, // Peak Cruzeiro
    bomRetiro_proj: 18.20
  },
  {
    time: '00:00 01/06',
    isAgora: false,
    santatereza_proj: 4.80,
    mucum_proj: 8.90,
    encantado_proj: 9.40,
    rocasales_proj: 9.20,
    lajeado_proj: 23.50,
    estrela_proj: 20.80,
    cruzeiro_proj: 19.80,
    bomRetiro_proj: 18.70 // Peak Bom Retiro do Sul
  }
];

export const PropagacaoOndaView: React.FC<PropagacaoOndaViewProps> = ({
  selectedStationId = 'lajeado',
  onSelectStation
}) => {
  // Local Destination Selection State
  const [destinationId, setDestinationId] = useState<string>(() => normalizeStationId(selectedStationId));
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7d');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Sync external station selection changes when sidebar city changes
  React.useEffect(() => {
    if (selectedStationId) {
      const normalized = normalizeStationId(selectedStationId);
      if (normalized !== destinationId) {
        setDestinationId(normalized);
      }
    }
  }, [selectedStationId]);

  const handleDestinationChange = (id: string) => {
    const normalized = normalizeStationId(id);
    setDestinationId(normalized);
    if (onSelectStation) {
      onSelectStation(normalized);
    }
  };

  // 3. HYDROLOGICAL TOPOLOGICAL CHAIN CALCULATOR: getUpstreamChain(destination)
  // Treats the selected station strictly as the DESTINATION of the analysis.
  // Returns all antecedent upstream stations contributing to the destination, excluding downstream stations.
  const destinationStation = useMemo(() => {
    const norm = normalizeStationId(destinationId);
    return HYDROLOGICAL_STATIONS.find(s => s.id === norm) || HYDROLOGICAL_STATIONS[4]; // Default Lajeado
  }, [destinationId]);

  const destinationIndex = useMemo(() => {
    const idx = HYDROLOGICAL_STATIONS.findIndex(s => s.id === destinationStation.id);
    return idx >= 0 ? idx : 4;
  }, [destinationStation]);

  // Antecedent Upstream Chain (from Headwater up to DESTINO)
  const activeChain = useMemo(() => {
    return HYDROLOGICAL_STATIONS.slice(0, destinationIndex + 1);
  }, [destinationIndex]);

  // Downstream Excluded Stations (after DESTINO)
  const downstreamExcludedChain = useMemo(() => {
    return HYDROLOGICAL_STATIONS.slice(destinationIndex + 1);
  }, [destinationIndex]);

  // Map nodes formatted for PropagationRealMap
  const nodesForMap = useMemo(() => {
    return activeChain.map((st, idx) => ({
      id: st.id,
      name: st.name,
      river: st.river,
      distanceKm: st.distanceKm,
      timeToArrival: st.estimatedArrival,
      currentLevel: st.currentLevel,
      peakLevelPredicted: st.predictedPeakLevel,
      deltaLevel: parseFloat(st.rateOfChange.replace(/[^\d.,]/g, '').replace(',', '.')) || 0.15,
      peakFlowPredicted: 1200,
      normalThreshold: 5,
      attentionThreshold: 10,
      warningThreshold: 15,
      floodThreshold: 19,
      status: 'atencao' as const,
      trend: 'subindo' as const,
      peakTimeObserved: st.predictedPeakTime,
      positionOnMap: { top: '50%', left: '50%' },
      isMontante: idx < activeChain.length - 1
    }));
  }, [activeChain]);

  // 4. DYNAMIC COMPUTATION OF TOP SUMMARY METRICS FOR SELECTED DESTINATION
  const summaryData = useMemo(() => {
    const dest = destinationStation;
    const isHeadwater = destinationIndex === 0;

    // Wave status text
    const waveStatusText = isHeadwater
      ? 'Estação de Cabeceira'
      : dest.waveStatus === 'Passou o pico'
      ? 'Pico Ocorrido'
      : dest.waveStatus === 'Em elevação'
      ? 'Onda em Elevação'
      : 'Onda a Caminho';

    const waveOriginText = isHeadwater
      ? 'Santa Tereza é a primeira estação monitorada desta cadeia.'
      : `Detectada na montante (${activeChain[0].name})`;

    // Immediate Upstream Station
    const immediateUpstream = isHeadwater ? null : activeChain[destinationIndex - 1];

    // Cumulative transit time calculation from headwater to destination
    let totalTransitMinutes = 0;
    for (let i = 0; i < activeChain.length - 1; i++) {
      const st = activeChain[i];
      if (st.pairwiseStats?.transitTime) {
        const match = st.pairwiseStats.transitTime.match(/(\d+)h\s*(\d+)?/);
        if (match) {
          const h = parseInt(match[1], 10) || 0;
          const m = parseInt(match[2], 10) || 0;
          totalTransitMinutes += h * 60 + m;
        }
      }
    }

    const h = Math.floor(totalTransitMinutes / 60);
    const m = totalTransitMinutes % 60;
    const totalTransitTime = isHeadwater ? '0h 00min' : `${h}h ${m < 10 ? '0' : ''}${m}min`;
    const totalWindowEta = isHeadwater ? 'Ponto de Origem' : dest.estimatedArrival;

    // Confidence score calculation
    let confidencePercent = 98 - (destinationIndex * 2);
    if (confidencePercent < 80) confidencePercent = 80;
    let confidenceLabel = isHeadwater ? 'Observado' : confidencePercent >= 90 ? 'Muito Alta' : 'Alta';

    return {
      isHeadwater,
      waveStatusText,
      waveOriginText,
      immediateUpstream,
      nextStationName: dest.name,
      nextStationEta: dest.estimatedArrival,
      totalTransitTime,
      totalWindowEta,
      predictedLevelRange: dest.predictedPeakLevelRange,
      predictedPeakTimeRange: dest.predictedPeakTimeRange,
      confidencePercent,
      confidenceLabel
    };
  }, [destinationStation, destinationIndex, activeChain]);

  return (
    <div className="flex flex-col gap-4 w-full bg-white dark:bg-[#030816] text-slate-900 dark:text-white p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl dark:shadow-2xl font-sans transition-colors">
      
      {/* ============================================================ */}
      {/* 1. HEADER BAR: TITLE, SUBTITLE & TOP DROPDOWN CONTROLS */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-2">
            <Waves className="w-5 h-5 text-emerald-500 dark:text-emerald-400 animate-pulse" />
            <span>PROPAGAÇÃO DA ONDA DE CHEIA • DESTINO: {destinationStation.name.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Análise hidrológica recalculada dinamicamente com base no destino selecionado e sua cadeia de montante.
          </p>
        </div>

        {/* TOP CONTROLS (DESTINATION SELECTOR & PERIOD) */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* DESTINATION SELECTOR */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#081023] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-md">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">Destino da Análise:</span>
            <select
              value={destinationStation.id}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 text-xs font-black py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700/80 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {HYDROLOGICAL_STATIONS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.id === destinationStation.id ? '(DESTINO)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* PERIOD SELECTOR */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#081023] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-md">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700/80 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="3d">Últimos 3 dias</option>
              <option value="24h">Últimas 24 horas</option>
            </select>
          </div>
        </div>
      </div>

      {/* HEADWATER INFORMATIONAL NOTICE (IF SANTA TEREZA IS DESTINATION) */}
      {summaryData.isHeadwater && (
        <div className="bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 p-3 rounded-2xl flex items-center gap-3 text-xs text-cyan-900 dark:text-cyan-200 shadow-md">
          <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div>
            <strong className="font-bold text-slate-900 dark:text-white block">Santa Tereza é a primeira estação monitorada desta cadeia hidrológica.</strong>
            <span>Não existem estações de montante cadastradas para esta análise. O dashboard exibe as leituras e previsões exclusivas desta estação de origem.</span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TOP SUMMARY CARDS (6 DYNAMIC HORIZONTAL CARDS) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        
        {/* CARD 1: ONDA ATUAL */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>ONDA ATUAL</span>
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block tracking-tight leading-tight">
              {summaryData.waveStatusText}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 leading-snug">
              {summaryData.waveOriginText}
            </span>
          </div>
        </div>

        {/* CARD 2: ESTAÇÃO A MONTANTE */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ESTAÇÃO A MONTANTE
          </div>
          <div className="my-1.5">
            {summaryData.immediateUpstream ? (
              <>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block tracking-tight leading-tight">
                  {summaryData.immediateUpstream.name}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                  <span>{summaryData.immediateUpstream.currentLevel.toFixed(2).replace('.', ',')} m</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold">↑ {summaryData.immediateUpstream.rateOfChange}</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-base sm:text-lg font-black text-slate-500 dark:text-slate-400 block tracking-tight leading-tight">
                  Cabeceira
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                  Primeiro ponto monitorado
                </span>
              </>
            )}
          </div>
        </div>

        {/* CARD 3: PRÓXIMA CHEGADA EM DESTINO */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={`CHEGADA EM ${destinationStation.name.toUpperCase()}`}>
            CHEGADA EM {destinationStation.name.toUpperCase()}
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 block tracking-tight leading-tight">
              {destinationStation.name}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold block mt-1 leading-snug">
              Estimativa<br />
              <strong className="text-slate-800 dark:text-slate-100">{summaryData.nextStationEta}</strong>
            </span>
          </div>
        </div>

        {/* CARD 4: TEMPO TOTAL ATÉ DESTINO (DYNAMIC TITLE) */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={`TEMPO TOTAL ATÉ ${destinationStation.name.toUpperCase()}`}>
            TEMPO TOTAL ATÉ {destinationStation.name.toUpperCase()}
          </div>
          <div className="my-1.5">
            <span className="text-lg sm:text-xl font-black text-orange-600 dark:text-orange-400 block tracking-tight leading-tight">
              {summaryData.totalTransitTime}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold block mt-1 leading-snug">
              Janela estimada<br />
              <strong className="text-slate-800 dark:text-slate-100">{summaryData.totalWindowEta}</strong>
            </span>
          </div>
        </div>

        {/* CARD 5: NÍVEL PREVISTO EM DESTINO (DYNAMIC TITLE) */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={`NÍVEL PREVISTO EM ${destinationStation.name.toUpperCase()}`}>
            NÍVEL PREVISTO EM {destinationStation.name.toUpperCase()}
          </div>
          <div className="my-1.5">
            <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 block tracking-tight leading-tight">
              {summaryData.predictedLevelRange}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold block mt-1 leading-snug">
              Pico estimado entre<br />
              <strong className="text-slate-800 dark:text-slate-100">{summaryData.predictedPeakTimeRange}</strong>
            </span>
          </div>
        </div>

        {/* CARD 6: CONFIANÇA DA PROJEÇÃO EM DESTINO */}
        <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={`CONFIANÇA EM ${destinationStation.name.toUpperCase()}`}>
            CONFIANÇA DA PROJEÇÃO
          </div>
          <div className="my-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {summaryData.confidencePercent}%
              </span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {summaryData.confidenceLabel}
              </span>
            </div>
            {/* PROGRESS GAUGE BAR */}
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 mt-2 border border-slate-300 dark:border-slate-800 overflow-hidden">
              <div 
                className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                style={{ width: `${summaryData.confidencePercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* MAP VIEW SECTION (BACIA DO RIO TAQUARI) */}
      <div className="w-full">
        <PropagationRealMap 
          nodes={nodesForMap}
          activeStationId={destinationStation.id}
          onSelectStation={handleDestinationChange}
        />
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN SECTION: CHEGADA DA ONDA E NÍVEL PREVISTO NAS ESTAÇÕES */}
      {/* (LEFT: HYDROGRAPHIC TEMPORAL RECHARTS CHART | RIGHT: HISTORICAL PROPAGATION PANEL) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT CHART COLUMN (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          
          {/* CHART TITLE & ACTION BUTTON */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                CHEGADA DA ONDA E NÍVEL PREVISTO • DESTINO: {destinationStation.name.toUpperCase()}
              </h3>
              <button 
                onClick={() => setIsDetailsModalOpen(true)}
                className="text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 cursor-pointer transition-colors"
                title="Informações sobre a metodologia da projeção"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* DETAILS BUTTON */}
            <button
              onClick={() => setIsDetailsModalOpen(true)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-[#040814] hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-cyan-700 dark:text-cyan-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Detalhes da propagação</span>
            </button>
          </div>

          {/* CHART LEGEND STRIP */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-2 flex-wrap gap-2 px-1">
            {/* LINE STYLES LEGEND */}
            <div className="flex items-center gap-4 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-slate-700 dark:bg-slate-200 rounded" /> Observado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-slate-500 dark:bg-slate-300 border-b border-dashed border-slate-400 dark:border-slate-200" /> Previsto
              </span>
            </div>

            {/* UPSTREAM STATIONS ONLY DOT LEGEND */}
            <div className="flex items-center gap-2 text-[10.5px] font-bold flex-wrap">
              <span className="text-slate-500 dark:text-slate-400 font-normal">Estações Consideradas:</span>
              {activeChain.map((st) => {
                const isDest = st.id === destinationStation.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleDestinationChange(st.id)}
                    className={`flex items-center gap-1 transition-transform cursor-pointer px-2 py-0.5 rounded-md ${
                      isDest 
                        ? 'bg-rose-100 dark:bg-rose-950/90 border border-rose-300 dark:border-rose-500/90 text-rose-800 dark:text-white font-extrabold shadow-md' 
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                    <span>{st.name}</span>
                    {isDest && <span className="text-[9px] bg-rose-600 text-white px-1 rounded font-mono">DESTINO</span>}
                  </button>
                );
              })}

              {downstreamExcludedChain.length > 0 && (
                <span className="text-[9.5px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                  ({downstreamExcludedChain.length} jusante excluídas)
                </span>
              )}
            </div>
          </div>

          {/* RECHARTS COMPOSED CHART CONTAINER */}
          <div className="h-64 sm:h-72 w-full relative my-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={HYDROGRAPHIC_TIME_SERIES} margin={{ top: 25, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} vertical={false} />
                
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                  dy={3}
                />

                <YAxis 
                  domain={[0, 30]} 
                  ticks={[0.00, 5.00, 10.00, 15.00, 20.00, 25.00, 30.00]}
                  stroke="#64748b" 
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  tickFormatter={(val) => val.toFixed(2).replace('.', ',')}
                />

                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px', 
                    fontSize: '11px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
                  }} 
                />

                {/* VERTICAL DIVIDER LINE FOR "AGORA" */}
                <ReferenceLine 
                  x="12:00 30/05" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  label={{ 
                    value: 'AGORA', 
                    fill: '#38bdf8', 
                    fontSize: 11, 
                    fontWeight: 900, 
                    position: 'top',
                    dy: -12
                  }} 
                />

                {/* DYNAMIC LINES: RENDERED EXCLUSIVELY FOR ACTIVE UPSTREAM CHAIN */}
                {activeChain.map((st) => {
                  const isDest = st.id === destinationStation.id;
                  const keyObs = `${st.id === 'bomretirodosul' ? 'bomRetiro' : st.id}_obs`;
                  const keyProj = `${st.id === 'bomretirodosul' ? 'bomRetiro' : st.id}_proj`;

                  return (
                    <React.Fragment key={st.id}>
                      <Line 
                        type="monotone" 
                        dataKey={keyObs} 
                        name={`${st.name} (Observado)`} 
                        stroke={st.color} 
                        strokeWidth={isDest ? 4 : 2} 
                        dot={false} 
                        isAnimationActive={false} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey={keyProj} 
                        name={`${st.name} (Previsto)`} 
                        stroke={st.color} 
                        strokeWidth={isDest ? 4 : 2} 
                        strokeDasharray="4 4" 
                        dot={false} 
                        isAnimationActive={false} 
                      />
                    </React.Fragment>
                  );
                })}

              </ComposedChart>
            </ResponsiveContainer>

            {/* PEAKS OVERLAY BADGES ON CHART: ONLY FOR UPSTREAM CADEIA */}
            <div className="absolute top-2 left-0 right-0 pointer-events-none flex justify-around text-[10px] font-black">
              {activeChain.map((st) => {
                const isDest = st.id === destinationStation.id;
                return (
                  <span 
                    key={st.id} 
                    className={`px-2 py-0.5 rounded shadow-lg transition-all ${
                      isDest 
                        ? 'bg-rose-100 dark:bg-rose-950/95 border border-rose-300 dark:border-rose-500 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/50 animate-pulse font-extrabold' 
                        : 'bg-slate-100 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st.name}: {st.predictedPeakLevel.toFixed(1).replace('.', ',')} m ({st.predictedPeakTime})
                  </span>
                );
              })}
            </div>
          </div>

          {/* AXIS LABEL FOOTER */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <span>Nível (m) vs. Tempo (Horários) • Exibindo exclusivamente cadeia até {destinationStation.name}</span>
            <span>Eixo Temporal: Observado (Esquerda de AGORA) | Projetado (Direita de AGORA)</span>
          </div>

        </div>

        {/* RIGHT SIDE PANEL: TEMPO DE PROPAGAÇÃO HISTÓRICO (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>TEMPO DE PROPAGAÇÃO HISTÓRICO</span>
              </h3>
            </div>

            {/* PAIRWISE SEGMENT STATS LIST (EXCLUSIVELY UPSTREAM PAIRS) */}
            <div className="space-y-3">
              {activeChain.length <= 1 ? (
                <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-cyan-900 dark:text-cyan-200 text-xs leading-relaxed">
                  <strong>Santa Tereza é a primeira estação monitorada desta cadeia.</strong>
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-300/80 mt-1">Não existem trechos a montante cadastrados para esta análise de propagação.</p>
                </div>
              ) : (
                activeChain.slice(0, -1).map((st) => {
                  if (!st.pairwiseStats) return null;
                  const stats = st.pairwiseStats;

                  return (
                    <div 
                      key={st.id} 
                      className="p-2.5 rounded-xl border bg-slate-50 dark:bg-[#040814] border-slate-200 dark:border-slate-700/90 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {st.name} → {stats.nextStationName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-cyan-700 dark:text-cyan-300">
                          {stats.transitTime}
                        </span>
                      </div>

                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium pl-4">
                        Mediana: <strong className="text-slate-800 dark:text-slate-200 font-mono">{stats.medianTime}</strong> ({stats.rangeMinMax})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            * Metodologia baseada nas medianas históricas de transição de cheias pareadas no Rio Taquari (2016 - 2024). Estações a jusante de {destinationStation.name} foram desconsideradas do cálculo.
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. LOWER SECTION: 2 COLUMNS */}
      {/* (LEFT: LINHA DO TEMPO DA ONDA | RIGHT: RESUMO POR ESTAÇÃO) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT COLUMN: LINHA DO TEMPO DA ONDA (EVENTO ATUAL) (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>LINHA DO TEMPO DA ONDA (CADEIA DE MONTANTE)</span>
            </h3>
          </div>

          {/* STEPPER TIMELINE FLOW FOR ACTIVE UPSTREAM CHAIN */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 my-2">
            {activeChain.map((st) => {
              const isDest = st.id === destinationStation.id;
              const isPassed = st.waveStatus === 'Passou o pico' || st.waveStatus === 'Em elevação';

              return (
                <div 
                  key={st.id}
                  onClick={() => handleDestinationChange(st.id)}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between text-center transition-all cursor-pointer ${
                    isDest 
                      ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 shadow-lg shadow-rose-950/20 dark:shadow-rose-950/50 ring-2 ring-rose-500/40' 
                      : isPassed
                      ? 'bg-slate-50 dark:bg-[#040814] border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      : 'bg-slate-50/50 dark:bg-[#040814]/50 border-slate-200 dark:border-slate-800/60 hover:opacity-100'
                  }`}
                >
                  <div className="text-xs font-black text-slate-900 dark:text-white mb-1 truncate" title={st.name}>
                    {st.name} {isDest ? '★' : ''}
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                    08:30
                  </div>

                  {/* WAVE STATUS BADGE */}
                  <div className="my-1">
                    {st.waveStatus === 'Passou o pico' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 block truncate">
                        Detectada
                      </span>
                    )}
                    {st.waveStatus === 'Em elevação' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 block truncate">
                        Atingida
                      </span>
                    )}
                    {st.waveStatus === 'A caminho' && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded block truncate ${
                        isDest 
                          ? 'bg-rose-600 text-white border border-rose-400 animate-pulse' 
                          : 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {isDest ? 'DESTINO' : 'Estimada'}
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] font-mono text-slate-700 dark:text-slate-300 font-bold mt-1 leading-tight">
                    {st.estimatedArrival}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            Exibindo unicamente a linha do tempo da onda até o destino {destinationStation.name}.
          </div>
        </div>

        {/* RIGHT COLUMN: RESUMO POR ESTAÇÃO (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>RESUMO POR ESTAÇÃO (CADEIA ATIVA)</span>
            </h3>
          </div>

          {/* TABLE FOR ACTIVE UPSTREAM CHAIN */}
          <div className="overflow-x-auto my-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase">
                  <th className="py-1.5 px-2">Estação</th>
                  <th className="py-1.5 px-2 text-right">Nível Atual (m)</th>
                  <th className="py-1.5 px-2 text-center">Variação 1h</th>
                  <th className="py-1.5 px-2">Status da Onda</th>
                  <th className="py-1.5 px-2 text-right">Pico Previsto (m)</th>
                  <th className="py-1.5 px-2 text-right">Chegada Estimada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {activeChain.map((st) => {
                  const isDest = st.id === destinationStation.id;

                  return (
                    <tr 
                      key={st.id}
                      onClick={() => handleDestinationChange(st.id)}
                      className={`cursor-pointer transition-colors ${
                        isDest 
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-slate-900 dark:text-white font-bold' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <td className="py-2 px-2 font-black flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                        <span>{st.name}</span>
                        {isDest && (
                          <span className="text-[9px] bg-rose-500 text-white px-1 rounded font-mono uppercase">DESTINO</span>
                        )}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold">
                        {st.currentLevel.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-2 px-2 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        ↑ {st.rateOfChange}
                      </td>

                      <td className="py-2 px-2 font-bold">
                        {st.waveStatus === 'Passou o pico' && (
                          <span className="text-emerald-600 dark:text-emerald-400">Passou o pico</span>
                        )}
                        {st.waveStatus === 'Em elevação' && (
                          <span className="text-amber-600 dark:text-amber-400">Em elevação</span>
                        )}
                        {st.waveStatus === 'A caminho' && (
                          <span className={isDest ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-600 dark:text-slate-300'}>
                            A caminho
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        {st.predictedPeakLevel.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-2 px-2 text-right font-mono text-slate-600 dark:text-slate-300">
                        {st.estimatedArrival}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            Valores telemétricos atualizados em tempo real. Estações a jusante de {destinationStation.name} não constam na tabela.
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 5. FOOTER INFO & TENDENCY SYMBOLS */}
      {/* ============================================================ */}
      <div className="bg-slate-50 dark:bg-[#081023] border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            Projeções calculadas exclusivamente para o destino <strong>{destinationStation.name}</strong> a partir da cadeia de montante ativa.
          </span>
        </div>

        {/* TENDENCY LEGEND */}
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
          <span className="flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">↑</span> Subindo
          </span>
          <span className="flex items-center gap-1">
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">↓</span> Descendo
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-600 dark:text-sky-400 font-extrabold">→</span> Estável
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. MODAL DETALHES DA PROPAGAÇÃO ("COMO CHEGAMOS A ESTA PROJEÇÃO?") */}
      {/* ============================================================ */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#040814]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-700 dark:text-cyan-400 shadow-md">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    COMO CHEGAMOS A ESTA PROJEÇÃO?
                  </h3>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono block">
                    Metodologia de Modelagem Hidrológica & Topologia de Montante
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
              <p>
                O motor hidrológico considera a estação selecionada (<strong>{destinationStation.name}</strong>) como o <strong>DESTINO DA ANÁLISE</strong>. Todas as estações situadas a jusante deste ponto são automaticamente excluídas para garantir máxima precisão do tempo de resposta.
              </p>

              <div className="space-y-2.5 bg-slate-50 dark:bg-[#040814] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">Topologia Antecedente Ativa</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Considera {activeChain.length} estação(ões) de montante: {activeChain.map(s => s.name).join(' → ')}.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">Exclusão Hidrológica de Jusante</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {downstreamExcludedChain.length > 0 
                        ? `Estações desconsideradas (${downstreamExcludedChain.map(s => s.name).join(', ')}).`
                        : 'Nenhuma estação excluída, pois a foz da bacia foi selecionada.'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white block mb-0.5">Soma de Tempos de Trânsito Pareados</strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">A estimativa de tempo total ({summaryData.totalTransitTime}) é acumulada ao longo das medianas históricas pareadas.</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-cyan-900 dark:text-cyan-200 text-[11px]">
                <strong>Índice de Confiança Atual: {summaryData.confidencePercent}% ({summaryData.confidenceLabel})</strong><br />
                Calculado com base na densidade de telemetria da cadeia de montante.
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#040814] flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
