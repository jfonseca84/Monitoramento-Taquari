import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Info, 
  Download, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Waves, 
  CloudRain, 
  Zap, 
  Clock, 
  TrendingUp, 
  Activity, 
  Database, 
  Layers,
  BarChart2,
  Table as TableIcon,
  ArrowRight,
  Link,
  Navigation
} from 'lucide-react';
import { LAJEADO_HISTORICAL_FLOODS, HistoricalFloodEvent } from '../data/historicalFloodsData';

interface HistoricoEnchentesViewProps {
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

export const HistoricoEnchentesView: React.FC<HistoricoEnchentesViewProps> = ({
  selectedStationId = 'lajeado',
  onSelectStation
}) => {
  // Active Station & Filter States
  const [stationId, setStationId] = useState<string>(selectedStationId);
  const [timeFilter, setTimeFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grafico' | 'tabela'>('grafico');

  // Currently selected historical event (defaults to Maio/2024 Recorde)
  const defaultEvent = LAJEADO_HISTORICAL_FLOODS.find(e => e.isRecord) || LAJEADO_HISTORICAL_FLOODS[0];
  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEvent.id);

  // Ref for horizontal scroll container of the main chart
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Scroll metrics state for precise custom scrollbar tracking
  const [scrollMetrics, setScrollMetrics] = useState({ scrollLeft: 0, scrollWidth: 1, clientWidth: 1 });
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);

  // Filter events by period selection
  const events = useMemo(() => {
    let list = [...LAJEADO_HISTORICAL_FLOODS];
    if (timeFilter === '10anos') {
      list = list.filter(e => e.year >= 2015);
    } else if (timeFilter === 'maiores28') {
      list = list.filter(e => e.maxLevel >= 28.0);
    }
    return list;
  }, [timeFilter]);

  // Selected Event Object
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events.find(e => e.isRecord) || events[0];
  }, [events, selectedEventId]);

  // Handle Station selection change
  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStationId(val);
    if (onSelectStation) onSelectStation(val);
  };

  // Update scroll metrics when container scrolls or resizes
  const updateScrollMetrics = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollMetrics({ scrollLeft, scrollWidth, clientWidth });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollMetrics);
      window.addEventListener('resize', updateScrollMetrics);
      updateScrollMetrics();
      const timer = setTimeout(updateScrollMetrics, 120);
      return () => {
        el.removeEventListener('scroll', updateScrollMetrics);
        window.removeEventListener('resize', updateScrollMetrics);
        clearTimeout(timer);
      };
    }
  }, [events, viewMode]);

  // Calculated scroll parameters
  const maxScroll = Math.max(0, scrollMetrics.scrollWidth - scrollMetrics.clientWidth);
  const visibleRatio = scrollMetrics.scrollWidth > 0 ? scrollMetrics.clientWidth / scrollMetrics.scrollWidth : 1;
  const thumbWidthPercent = maxScroll > 0 ? Math.max(15, Math.min(80, visibleRatio * 100)) : 100;
  const scrollRatio = maxScroll > 0 ? Math.max(0, Math.min(1, scrollMetrics.scrollLeft / maxScroll)) : 0;
  const thumbLeftPercent = scrollRatio * (100 - thumbWidthPercent);

  // Scroll controls for main chart
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const scrollToRatio = (ratio: number) => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const targetLeft = ratio * (scrollWidth - clientWidth);
      scrollContainerRef.current.scrollLeft = targetLeft;
    }
  };

  const handlePointerDownTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingTrack(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      scrollToRatio(ratio);
    }
  };

  const handlePointerMoveTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTrack && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      scrollToRatio(ratio);
    }
  };

  const handlePointerUpTrack = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTrack) {
      setIsDraggingTrack(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Key events for Duration chart (Selected event + major benchmarks)
  const durationEvents = useMemo(() => {
    const benchmarks = ['lajeado-2024-05', 'lajeado-2023-09', 'lajeado-2023-11', 'lajeado-2020-07', 'lajeado-1941-05'];
    let result = LAJEADO_HISTORICAL_FLOODS.filter(e => benchmarks.includes(e.id));
    
    // Ensure selected event is included if not in top benchmarks
    if (selectedEvent && !result.some(e => e.id === selectedEvent.id)) {
      result = [selectedEvent, ...result.slice(0, 4)];
    }
    return result;
  }, [selectedEvent]);

  // Wave propagation estimates relative to selected event
  const propagationData = useMemo(() => {
    if (selectedEvent.id === 'lajeado-2025-10' || selectedEvent.monthYear.includes('2025')) {
      return {
        lajeado: { inicio: '27/10 10:00', pico: '28/10 20:30', nivelPico: '26,90 m' },
        estrela: { chegada: '28/10 23:40', pico: '29/10 09:10', nivelPico: '23,30 m' },
        taquari: { chegada: '29/10 04:20', pico: '29/10 16:50', nivelPico: '20,40 m' },
        bomRetiro: { chegada: '29/10 08:50', pico: '29/10 20:10', nivelPico: '17,60 m' },
        cachoeira: { chegada: '29/10 18:30', pico: '30/10 07:30', nivelPico: '15,10 m' },
        tempoTotal: '21h 30min',
        atenuacaoTotal: '-11,80 m'
      };
    }

    const lvl = selectedEvent.maxLevel;
    const peakStr = selectedEvent.peakDateTime || '04/05/2024 14:30';
    const startStr = selectedEvent.startDate || '03/05/2024 02:00';
    const atenuacao = (lvl - 15.10).toFixed(2).replace('.', ',');

    return {
      lajeado: {
        inicio: startStr,
        pico: peakStr,
        nivelPico: `${lvl.toFixed(2).replace('.', ',')} m`
      },
      estrela: {
        chegada: 'Chegada +3h',
        pico: 'Pico +12h',
        nivelPico: `${(lvl * 0.866).toFixed(2).replace('.', ',')} m`
      },
      taquari: {
        chegada: 'Chegada +7h',
        pico: 'Pico +20h',
        nivelPico: `${(lvl * 0.758).toFixed(2).replace('.', ',')} m`
      },
      bomRetiro: {
        chegada: 'Chegada +12h',
        pico: 'Pico +24h',
        nivelPico: `${(lvl * 0.654).toFixed(2).replace('.', ',')} m`
      },
      cachoeira: {
        chegada: 'Chegada +22h',
        pico: 'Pico +35h',
        nivelPico: `${(lvl * 0.561).toFixed(2).replace('.', ',')} m`
      },
      tempoTotal: '21h 30min',
      atenuacaoTotal: `-${atenuacao} m`
    };
  }, [selectedEvent]);

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full animate-fadeIn">
      
      {/* ============================================================ */}
      {/* 1. CABEÇALHO DA ANÁLISE */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-md dark:shadow-2xl transition-colors">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
            HISTÓRICO DE ENCHENTES – {stationId.toUpperCase()} / RIO TAQUARI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Análise dos eventos históricos de cheias registrados na estação de {stationId === 'lajeado' ? 'Lajeado' : stationId}.
          </p>
        </div>

        {/* CONTROLES SUPERIORES DIREITOS */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* SELEÇÃO DE ESTAÇÃO */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Estação:</span>
            <select
              value={stationId}
              onChange={handleStationChange}
              className="bg-transparent text-slate-900 dark:text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="lajeado" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Lajeado</option>
              <option value="mucum" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Muçum</option>
              <option value="encantado" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Encantado</option>
              <option value="estrela" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Estrela</option>
              <option value="santa_tereza" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Santa Tereza</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-1" />
          </div>

          {/* SELEÇÃO DE PERÍODO */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Período:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="todos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos os registros</option>
              <option value="10anos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Últimos 10 anos</option>
              <option value="maiores28" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cheias acima de 28m</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-1" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ÁREA DOS DOIS GRÁFICOS (PRINCIPAL + DURAÇÃO SIDEBAR) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

        {/* ---------------------------------------------------------- */}
        {/* GRÁFICO PRINCIPAL — NÍVEL DO RIO / EVENTOS HISTÓRICOS (8 COLS) */}
        {/* ---------------------------------------------------------- */}
        <div className="lg:col-span-8 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-md dark:shadow-2xl flex flex-col justify-between h-full transition-colors">
          
          {/* PAINEL CABEÇALHO DO GRÁFICO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                NÍVEL DO RIO – EVENTOS HISTÓRICOS
              </h2>
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" />
            </div>

            {/* BOTÕES DE MODO E DOWNLOAD */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode('grafico')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'grafico'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Gráfico</span>
                </button>
                <button
                  onClick={() => setViewMode('tabela')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === 'tabela'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>Tabela</span>
                </button>
              </div>

              <button 
                title="Exportar Dados Históricos"
                className="p-1.5 bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LEGENDA DO GRÁFICO */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              <span>Recorde</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
              <span>Cheia 1941</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
              <span>Picos históricos</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-4 border-b border-dashed border-slate-400" />
              <span>Nível observado</span>
            </div>
          </div>

          {/* ÁREA PRINCIPAL DO GRÁFICO / TABELA */}
          {viewMode === 'grafico' ? (
            <div className="relative flex flex-col">
              {/* EIXO Y + CONTAINER DE BARRAS COM ROLAGEM HORIZONTAL */}
              <div className="relative flex items-end pt-1 pb-1">
                
                {/* EIXO Y FIXO À ESQUERDA (12 A 34 INTEGRALMENTE) */}
                <div className="flex flex-col justify-between h-[210px] pr-2 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 select-none shrink-0 border-r border-slate-200 dark:border-slate-800/80">
                  <span>Nível (m)</span>
                  <span>34,00 —</span>
                  <span>30,00 —</span>
                  <span>25,00 —</span>
                  <span>20,00 —</span>
                  <span>15,00 —</span>
                  <span>12,00 —</span>
                  <span>0,00 —</span>
                </div>

                {/* CONTAINER COM ROLAGEM HORIZONTAL DAS BARRAS (SEM SCROLLBAR PADRÃO) */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-end gap-3 sm:gap-4 px-3 h-[225px] scroll-smooth"
                >
                  {/* LINHAS DE GRADE HORIZONTAIS DE FUNDO */}
                  <div className="absolute left-14 right-0 top-6 bottom-8 pointer-events-none flex flex-col justify-between opacity-15">
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                  </div>

                  {events.map((evt) => {
                    const isSelected = selectedEvent.id === evt.id;
                    const maxScale = 34.0;
                    const heightPercent = Math.min(100, Math.max(8, (evt.maxLevel / maxScale) * 100));

                    // Bar color classification
                    let barBg = 'bg-blue-600 hover:bg-blue-500';
                    let barGlow = '';
                    let textValColor = 'text-slate-700 dark:text-slate-200';

                    if (evt.isRecord) {
                      barBg = 'bg-red-500 hover:bg-red-400';
                      barGlow = 'shadow-[0_0_12px_rgba(239,68,68,0.8)]';
                      textValColor = 'text-red-600 dark:text-red-400 font-extrabold';
                    } else if (evt.is1941Cheia) {
                      barBg = 'bg-amber-400 hover:bg-amber-300';
                      barGlow = 'shadow-[0_0_10px_rgba(251,191,36,0.8)]';
                      textValColor = 'text-amber-600 dark:text-amber-400 font-bold';
                    }

                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`group relative flex flex-col items-center justify-end h-[210px] w-[36px] sm:w-[40px] shrink-0 cursor-pointer transition-transform duration-200 hover:scale-[1.03] ${
                          isSelected ? 'z-10' : 'z-0'
                        }`}
                      >
                        {/* RÓTULO DO VALOR ACIMA DA BARRA */}
                        <span className={`text-[9px] font-mono mb-1 leading-none select-none text-center whitespace-nowrap ${textValColor} ${
                          isSelected ? 'scale-110 font-bold' : ''
                        }`}>
                          {evt.maxLevel.toFixed(2).replace('.', ',')}
                        </span>

                        {/* CORPO DA BARRA (SLIM BAR - EXACT 20px WIDTH) */}
                        <div
                          className={`w-[20px] rounded-t-[3px] transition-all duration-300 ${barBg} ${barGlow} ${
                            isSelected 
                              ? 'ring-2 ring-cyan-500 dark:ring-cyan-300 ring-offset-2 ring-offset-white dark:ring-offset-[#081023] brightness-125' 
                              : 'opacity-90 hover:opacity-100'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* RÓTULO DO EIXO X (MÊS / ANO) */}
                        <div className="mt-1.5 text-center select-none">
                          <span className={`block text-[9px] font-bold leading-tight ${
                            isSelected ? 'text-cyan-700 dark:text-cyan-300 underline' : 'text-slate-800 dark:text-slate-300'
                          }`}>
                            {evt.month}
                          </span>
                          <span className={`block text-[8px] font-mono leading-tight ${
                            isSelected ? 'text-cyan-700 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            /{evt.year}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROLAGEM HORIZONTAL VISUAL (CUSTOM SCROLL CONTROL BAR) */}
              <div className="mt-1 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 px-1">
                <button
                  onClick={scrollLeft}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Rolar para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* TRACK VISUAL INTERATIVO COM SLIDER */}
                <div 
                  ref={trackRef}
                  onPointerDown={handlePointerDownTrack}
                  onPointerMove={handlePointerMoveTrack}
                  onPointerUp={handlePointerUpTrack}
                  onPointerCancel={handlePointerUpTrack}
                  className="flex-1 bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-full h-3.5 relative overflow-hidden flex items-center px-1 cursor-pointer select-none"
                >
                  <div className="w-full bg-slate-200 dark:bg-slate-800/60 rounded-full h-2 relative">
                    <div 
                      className="absolute top-0 bottom-0 bg-blue-500/80 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] hover:bg-blue-400 transition-colors"
                      style={{ 
                        width: `${thumbWidthPercent}%`, 
                        left: `${thumbLeftPercent}%` 
                      }} 
                    />
                  </div>
                </div>

                <button
                  onClick={scrollRight}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Rolar para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* RODAPÉ INFORMATIVO */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                * Dados referentes à estação fluviométrica de {stationId === 'lajeado' ? 'Lajeado' : stationId}. Atualizado em 30/05/2025 09:45
              </p>
            </div>
          ) : (
            /* MODO TABELA */
            <div className="flex flex-col gap-1">
              <div className="overflow-y-auto overflow-x-auto h-[280px] max-h-[280px] rounded-lg border border-slate-200 dark:border-slate-800/80 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_#f8fafc] dark:[scrollbar-color:#1e293b_#040814]">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 relative">
                  <thead className="bg-slate-100 dark:bg-[#040814] text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-md">
                    <tr>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Mês / Ano</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Nível Máximo (m)</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Data / Hora do Pico</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Duração</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Chuva (mm)</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Vazão (m³/s)</th>
                      <th className="p-2.5 bg-slate-100 dark:bg-[#040814]">Classificação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium bg-white dark:bg-[#081023]">
                    {events.map((evt) => {
                      const isSelected = selectedEvent.id === evt.id;
                      return (
                        <tr 
                          key={evt.id}
                          onClick={() => setSelectedEventId(evt.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-cyan-300 font-bold' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <td className="p-2.5 font-bold">{evt.monthYear}</td>
                          <td className="p-2.5 font-mono text-cyan-700 dark:text-cyan-400 font-bold">{evt.maxLevel.toFixed(2).replace('.', ',')} m</td>
                          <td className="p-2.5">{evt.peakDateTime}</td>
                          <td className="p-2.5">{evt.durationFormatted}</td>
                          <td className="p-2.5">{evt.accumulatedRainMm} mm</td>
                          <td className="p-2.5">{evt.avgFlowM3s.toLocaleString('pt-BR')} m³/s</td>
                          <td className="p-2.5">
                            {evt.isRecord ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/40">
                                RECORDE
                              </span>
                            ) : evt.is1941Cheia ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40">
                                CHEIA 1941
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40">
                                HISTÓRICA
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ INFORMATIVO */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                * Dados referentes à estação fluviométrica de {stationId === 'lajeado' ? 'Lajeado' : stationId}. Atualizado em 30/05/2025 09:45
              </p>
            </div>
          )}

          {/* INFORMAÇÕES DO EVENTO SELECIONADO (INTEGRADO DIRETAMENTE DENTRO DO CARD PRINCIPAL) */}
          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2.5 mt-2.5 flex flex-col gap-2">
            
            {/* TÍTULO */}
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200 truncate">
                INFORMAÇÕES DO EVENTO: <span className="text-red-600 dark:text-red-400 font-extrabold">{selectedEvent.monthYear.toUpperCase()}</span> {selectedEvent.isRecord ? '(RECORDE HISTÓRICO)' : selectedEvent.is1941Cheia ? '(CHEIA 1941)' : ''}
              </h2>
            </div>

            {/* GRID DE CARDS COMPACTOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5">
              
              {/* CARD 1: NÍVEL MÁXIMO */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
                    <Droplets className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Nível Máx</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 tracking-tight leading-none block">
                    {selectedEvent.maxLevel.toFixed(2).replace('.', ',')} m
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    {selectedEvent.peakDateTime}
                  </span>
                </div>
              </div>

              {/* CARD 2: NÍVEL MÉDIO */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                    <Info className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Nível Médio</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none block">
                    {selectedEvent.avgLevel.toFixed(2).replace('.', ',')} m
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    Evento
                  </span>
                </div>
              </div>

              {/* CARD 3: ELEVAÇÃO TOTAL */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <TrendingUp className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Elevação</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none block">
                    +{selectedEvent.totalElevation.toFixed(2).replace('.', ',')} m
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    início ao pico
                  </span>
                </div>
              </div>

              {/* CARD 4: CHUVA ACUMULADA */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 shrink-0">
                    <CloudRain className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Chuva Acum</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-cyan-700 dark:text-cyan-300 tracking-tight leading-none block">
                    {selectedEvent.accumulatedRainMm.toFixed(1).replace('.', ',')} mm
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    {selectedEvent.accumulatedRainPeriod}
                  </span>
                </div>
              </div>

              {/* CARD 5: INTENSIDADE MÁXIMA 24H */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 shrink-0">
                    <Zap className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Máx 24h</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none block">
                    {selectedEvent.maxRain24hMm.toFixed(1).replace('.', ',')} mm
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    {selectedEvent.maxRain24hDate}
                  </span>
                </div>
              </div>

              {/* CARD 6: VAZÃO MÉDIA */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 shrink-0">
                    <Waves className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Vazão Média</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-teal-700 dark:text-teal-300 tracking-tight leading-none block">
                    {selectedEvent.avgFlowM3s.toLocaleString('pt-BR')} m³/s
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    Evento
                  </span>
                </div>
              </div>

              {/* CARD 7: VOLUME ESCOADO */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                    <Database className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Vol Escoado</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300 tracking-tight leading-none block">
                    {selectedEvent.volumeDischargedBillionM3.toFixed(2).replace('.', ',')} bi m³
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    Estimado
                  </span>
                </div>
              </div>

              {/* CARD 8: DURAÇÃO DO EVENTO */}
              <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-lg p-1.5 sm:p-2 flex flex-col justify-between min-h-[52px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                  <span className="p-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">Duração</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none block">
                    {selectedEvent.durationFormatted}
                  </span>
                  <span className="text-[8px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                    Início a fim
                  </span>
                </div>
              </div>

            </div>

            {/* BANNER DESCRITIVO INFERIOR */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/80 rounded-lg px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300">
              <Info className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <p className="leading-tight truncate">
                {selectedEvent.description || `O evento de ${selectedEvent.monthYear} atingiu a cota máxima de ${selectedEvent.maxLevel.toFixed(2)} m na estação de Lajeado.`}
              </p>
            </div>

          </div>

        </div>

        {/* ---------------------------------------------------------- */}
        {/* GRÁFICO LATERAL — DURAÇÃO DAS ENCHENTES (4 COLS) */}
        {/* ---------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-md dark:shadow-2xl flex flex-col justify-between h-full transition-colors">
          
          <div className="flex flex-col flex-1 justify-between">
            {/* CABEÇALHO */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    DURAÇÃO DAS ENCHENTES
                  </h2>
                  <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" />
                </div>
                <button title="Download" className="p-1 bg-slate-100 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* LEGENDA DURAÇÃO */}
              <div className="flex items-center gap-2.5 flex-wrap text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Início</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Pico (hora)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Fim</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-3 border-b border-slate-400" />
                  <span>Duração</span>
                </div>
              </div>
            </div>

            {/* LISTA DE TIMELINES DE EVENTOS (PREENCHE A ALTURA PROPORCIONALMENTE) */}
            <div className="flex-1 flex flex-col justify-evenly py-1 gap-1">
              {durationEvents.map((evt) => {
                const isSelected = selectedEvent.id === evt.id;
                return (
                  <div 
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`p-1.5 sm:p-2 px-2.5 rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-500/40' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-900 dark:text-cyan-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {evt.monthYear}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                        {evt.durationFormatted}
                      </span>
                    </div>

                    {/* RÓTULOS DE DATAS E HORAS SOBRE A LINHA */}
                    <div className="grid grid-cols-3 text-[9px] font-mono text-slate-500 dark:text-slate-400 text-center mb-1">
                      <span className="text-left">{evt.shortStart}</span>
                      <span className="text-center">{evt.shortPeak}</span>
                      <span className="text-right">{evt.shortEnd}</span>
                    </div>

                    {/* BARRA DE TIMELINE COM 3 PONTOS (INÍCIO, PICO, FIM) */}
                    <div className="relative h-2 flex items-center">
                      {/* LINHA DE CONEXÃO DA BARRA */}
                      <div className="absolute left-0 right-0 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 shadow-[0_0_6px_rgba(37,99,235,0.4)]" />
                      
                      {/* PONTO DE INÍCIO (VERDE) */}
                      <div className="absolute left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
                      
                      {/* PONTO DE PICO (AMARELO) */}
                      <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white dark:border-slate-900 shadow-[0_0_6px_rgba(251,191,36,0.8)] shrink-0" />
                      
                      {/* PONTO DE FIM (VERMELHO) */}
                      <div className="absolute right-0 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-slate-900 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EIXO X INFERIOR DA DURAÇÃO */}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 px-1">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-0.5 font-medium">
              Duração (dias)
            </p>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. PROPAGAÇÃO DA ONDA DE CHEIA (CARD INFERIOR LARGURA TOTAL) */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-md dark:shadow-2xl flex flex-col gap-3.5 transition-colors">
        
        {/* CABEÇALHO DA PROPAGAÇÃO */}
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              PROPAGAÇÃO DA ONDA DE CHEIA
            </h2>
            <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Propagação estimada do evento selecionado ({selectedEvent.monthYear})
          </p>
        </div>

        {/* FLUXO DE ESTAÇÕES EM SEQUÊNCIA */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
          
          {/* ESTAÇÃO 1: LAJEADO */}
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex-1 min-w-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Lajeado</span>
            </div>
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Início</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.lajeado.inicio}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Pico</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.lajeado.pico}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Nível pico</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{propagationData.lajeado.nivelPico}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="hidden lg:block w-4 h-4 text-blue-500 shrink-0 mx-0.5" />

          {/* ESTAÇÃO 2: ESTRELA */}
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex-1 min-w-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span>Estrela</span>
            </div>
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Chegada est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.estrela.chegada}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Pico est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.estrela.pico}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Nível pico</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{propagationData.estrela.nivelPico}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="hidden lg:block w-4 h-4 text-blue-500 shrink-0 mx-0.5" />

          {/* ESTAÇÃO 3: TAQUARI */}
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex-1 min-w-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Taquari</span>
            </div>
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Chegada est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.taquari.chegada}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Pico est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.taquari.pico}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Nível pico</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{propagationData.taquari.nivelPico}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="hidden lg:block w-4 h-4 text-blue-500 shrink-0 mx-0.5" />

          {/* ESTAÇÃO 4: BOM RETIRO DO SUL */}
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex-1 min-w-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-xs sm:text-sm text-lime-600 dark:text-lime-400">
              <span className="w-2 h-2 rounded-full bg-lime-500 shrink-0" />
              <span className="truncate">Bom Retiro do Sul</span>
            </div>
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Chegada est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.bomRetiro.chegada}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Pico est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.bomRetiro.pico}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Nível pico</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{propagationData.bomRetiro.nivelPico}</span>
              </div>
            </div>
          </div>

          <ArrowRight className="hidden lg:block w-4 h-4 text-blue-500 shrink-0 mx-0.5" />

          {/* ESTAÇÃO 5: CACHOEIRA DO SUL */}
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/90 rounded-xl p-3 flex-1 min-w-[150px] flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-2 font-bold text-xs sm:text-sm text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">Cachoeira do Sul</span>
            </div>
            <div className="space-y-1 text-[10px] sm:text-[11px] font-medium">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Chegada est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.cachoeira.chegada}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Pico est.</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{propagationData.cachoeira.pico}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Nível pico</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{propagationData.cachoeira.nivelPico}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ESTATÍSTICAS INFERIORES DE PROPAGAÇÃO */}
        <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 sm:p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
          
          {/* STAT 1: DISTÂNCIA TOTAL */}
          <div className="flex items-center gap-2.5">
            <Link className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">Distância total</span>
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">118 km</span>
            </div>
          </div>

          {/* STAT 2: TEMPO TOTAL DE PROPAGAÇÃO */}
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">Tempo total de propagação</span>
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">{propagationData.tempoTotal}</span>
            </div>
          </div>

          {/* STAT 3: VELOCIDADE MÉDIA DA ONDA */}
          <div className="flex items-center gap-2.5">
            <Navigation className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">Velocidade média da onda</span>
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">5,5 km/h</span>
            </div>
          </div>

          {/* STAT 4: ATENUAÇÃO TOTAL */}
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">Atenuação total</span>
              <span className="text-xs sm:text-sm lg:text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">{propagationData.atenuacaoTotal}</span>
              <span className="text-[9px] text-slate-400 block leading-none">(Lajeado → Cachoeira do Sul)</span>
            </div>
          </div>

          {/* STAT 5: INFORMAÇÃO COMPLEMENTAR */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
              Valores estimados com base em eventos históricos e níveis atuais observados.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
