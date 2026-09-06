import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { StationPropagationNode } from './PropagacaoOndaView';
import { Waves, Plus, Minus, RotateCcw, Activity, Navigation, MapPin, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';

interface PropagationRealMapProps {
  nodes: StationPropagationNode[];
  activeStationId: string;
  onSelectStation: (stationId: string) => void;
}

export interface DiagramStation {
  id: string;
  name: string;
  riverName: string;
  lat: number;
  lng: number;
  trend: 'up' | 'down' | 'stable';
  variation: string;
  cota: string;
  color: string;
  flowTime?: string;
  isMainFocus?: boolean;
}

export interface DiagramRiverPath {
  id: string;
  name: string;
  coordinates: [number, number][];
  color: string;
  weight: number;
}

// Real Geographic Coordinates for Bacia do Rio Taquari-Antas Stations (RS, Brazil)
export const TAQUARI_BASIN_STATIONS: DiagramStation[] = [
  {
    id: 'santatereza',
    name: 'Santa Tereza',
    riverName: 'Rio das Antas (Cabeceira)',
    lat: -29.1678,
    lng: -51.7381,
    trend: 'up',
    variation: '12.80 m',
    cota: '13.50 m',
    color: '#06b6d4',
    flowTime: '08:10'
  },
  {
    id: 'mucum',
    name: 'Muçum',
    riverName: 'Rio Taquari / Antas',
    lat: -29.1683,
    lng: -51.8703,
    trend: 'up',
    variation: '19.42 m',
    cota: '18.00 m',
    color: '#10b981',
    flowTime: '11:40'
  },
  {
    id: 'encantado',
    name: 'Encantado',
    riverName: 'Rio Taquari',
    lat: -29.2361,
    lng: -51.8731,
    trend: 'up',
    variation: '16.80 m',
    cota: '12.00 m',
    color: '#eab308',
    flowTime: '16:00'
  },
  {
    id: 'rocasales',
    name: 'Roca Sales',
    riverName: 'Rio Taquari',
    lat: -29.2831,
    lng: -51.8683,
    trend: 'up',
    variation: '13.10 m',
    cota: '18.00 m',
    color: '#f97316',
    flowTime: '13:00'
  },
  {
    id: 'lajeado',
    name: 'Lajeado',
    riverName: 'Rio Taquari (Médio Taquari)',
    lat: -29.4669,
    lng: -51.9614,
    trend: 'down',
    variation: '22.31 m',
    cota: '19.00 m',
    color: '#f43f5e',
    flowTime: '17:30',
    isMainFocus: true
  },
  {
    id: 'estrela',
    name: 'Estrela',
    riverName: 'Rio Taquari',
    lat: -29.5019,
    lng: -51.9608,
    trend: 'down',
    variation: '11.80 m',
    cota: '19.00 m',
    color: '#a855f7',
    flowTime: '20:20'
  },
  {
    id: 'cruzeiro',
    name: 'Cruzeiro do Sul',
    riverName: 'Rio Taquari',
    lat: -29.5133,
    lng: -51.9861,
    trend: 'down',
    variation: '10.50 m',
    cota: '19.00 m',
    color: '#38bdf8',
    flowTime: '21:50'
  },
  {
    id: 'bomretirodosul',
    name: 'Bom Retiro do Sul',
    riverName: 'Rio Taquari (Foz / Jusante)',
    lat: -29.6064,
    lng: -51.9442,
    trend: 'down',
    variation: '9.45 m',
    cota: '19.00 m',
    color: '#6366f1',
    flowTime: '23:10'
  }
];

// Main Rivers and Tributaries Polylines
export const TAQUARI_BASIN_RIVERS: DiagramRiverPath[] = [
  {
    id: 'rio-taquari-main',
    name: 'Calha Principal do Rio Taquari-Antas',
    coordinates: [
      [-29.1678, -51.7381], // Santa Tereza
      [-29.1683, -51.8703], // Muçum
      [-29.2361, -51.8731], // Encantado
      [-29.2831, -51.8683], // Roca Sales
      [-29.4669, -51.9614], // Lajeado
      [-29.5019, -51.9608], // Estrela
      [-29.5133, -51.9861], // Cruzeiro do Sul
      [-29.6064, -51.9442], // Bom Retiro do Sul
      [-29.7200, -51.8800]  // Foz -> Rio Jacuí
    ],
    color: '#38bdf8',
    weight: 5
  },
  {
    id: 'rio-carreiro',
    name: 'Rio Carreiro (Afluente Norte)',
    coordinates: [
      [-28.9800, -51.7800],
      [-29.0800, -51.8200],
      [-29.1683, -51.8703] // Confluência em Muçum
    ],
    color: '#06b6d4',
    weight: 3
  },
  {
    id: 'rio-guapore',
    name: 'Rio Guaporé (Afluente Oeste)',
    coordinates: [
      [-29.0200, -52.0500],
      [-29.1200, -51.9500],
      [-29.2361, -51.8731] // Confluência em Encantado
    ],
    color: '#a855f7',
    weight: 3
  },
  {
    id: 'rio-forqueta',
    name: 'Rio Forqueta (Afluente Sul-Oeste)',
    coordinates: [
      [-29.3500, -52.2000],
      [-29.4200, -52.1000],
      [-29.4669, -51.9614] // Confluência em Lajeado
    ],
    color: '#f59e0b',
    weight: 3
  }
];

type MapStyle = 'dark' | 'satellite' | 'topo';

export const PropagationRealMap: React.FC<PropagationRealMapProps> = ({
  nodes,
  activeStationId,
  onSelectStation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);

  // Tile URL mapping
  const getTileUrl = (style: MapStyle) => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  const getTileAttribution = (style: MapStyle) => {
    switch (style) {
      case 'satellite':
        return '&copy; Esri &mdash; Source: Esri';
      case 'topo':
      case 'dark':
      default:
        return '&copy; OpenStreetMap contributors &copy; CARTO';
    }
  };

  // Bounds for Taquari Valley fit
  const basinBounds: L.LatLngBoundsExpression = [
    [-29.10, -52.10],
    [-29.68, -51.65]
  ];

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-29.38, -51.88],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    const initialTile = L.tileLayer(getTileUrl('dark'), {
      maxZoom: 18,
      attribution: getTileAttribution('dark')
    }).addTo(map);

    tileLayerRef.current = initialTile;
    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Render River Streams Polylines
    TAQUARI_BASIN_RIVERS.forEach((river) => {
      L.polyline(river.coordinates, {
        color: river.color,
        weight: river.weight,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Glow backing
      L.polyline(river.coordinates, {
        color: river.color,
        weight: river.weight * 2.5,
        opacity: 0.25,
        lineCap: 'round'
      }).addTo(map);
    });

    // Fit bounds smoothly on initial load
    map.fitBounds(basinBounds, { padding: [15, 15] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Map Style Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 18,
      attribution: getTileAttribution(mapStyle)
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // 3. Render City Point Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const activeNodeIds = nodes.map(n => n.id);

    TAQUARI_BASIN_STATIONS.forEach((station) => {
      const isTarget = station.id === activeStationId || activeStationId.includes(station.id);
      const isHovered = hoveredStationId === station.id;
      const isIncluded = activeNodeIds.some(id => id === station.id || station.id.includes(id) || id.includes(station.id));

      // Clean City Point Marker Icon (No popup overlay clutter!)
      const pointIconHtml = `
        <div class="relative flex items-center cursor-pointer group">
          <!-- PULSING GLOW FOR TARGET OR HOVERED NODES -->
          ${isTarget ? `
            <span class="absolute -inset-2 rounded-full bg-rose-500/50 animate-ping"></span>
            <span class="absolute -inset-1 rounded-full bg-rose-500/70 blur-xs"></span>
          ` : isHovered ? `
            <span class="absolute -inset-2 rounded-full bg-cyan-400/50 animate-pulse"></span>
          ` : isIncluded ? `
            <span class="absolute -inset-1 rounded-full bg-cyan-400/20 blur-xs"></span>
          ` : ''}

          <!-- CITY POINT CIRCLE -->
          <div class="relative w-4 h-4 rounded-full border-2 border-slate-950 shadow-2xl flex items-center justify-center transition-transform ${isHovered ? 'scale-140 ring-2 ring-cyan-400' : 'group-hover:scale-125'}"
               style="background-color: ${isTarget ? '#f43f5e' : isIncluded ? station.color : '#475569'};">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>

          <!-- CITY NAME LABEL BADGE -->
          <div class="ml-2 px-2 py-0.5 rounded-md backdrop-blur-md border text-[11px] font-black tracking-wide whitespace-nowrap shadow-xl transition-all ${
            isTarget 
              ? 'bg-rose-950/90 border-rose-500 text-white ring-1 ring-rose-500/60' 
              : isHovered
              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/80 scale-105'
              : isIncluded 
              ? 'bg-slate-950/85 border-slate-700/80 text-slate-100 group-hover:border-cyan-500 group-hover:text-cyan-200' 
              : 'bg-slate-950/60 border-slate-800/60 text-slate-400'
          }">
            <span>${station.name}</span>
            ${isTarget ? '<span class="ml-1 text-[8px] bg-rose-600 text-white px-1 rounded font-mono">DESTINO</span>' : ''}
          </div>
        </div>
      `;

      const customDivIcon = L.divIcon({
        html: pointIconHtml,
        className: 'custom-city-marker',
        iconSize: [110, 24],
        iconAnchor: [8, 12]
      });

      const marker = L.marker([station.lat, station.lng], { icon: customDivIcon });

      // Hover triggers updating the right card!
      marker.on('mouseover', () => {
        setHoveredStationId(station.id);
      });

      marker.on('mouseout', () => {
        setHoveredStationId(null);
      });

      // Click sets station as Target DESTINO
      marker.on('click', () => {
        onSelectStation(station.id);
        setHoveredStationId(station.id);
      });

      marker.addTo(markersGroupRef.current);
    });
  }, [nodes, activeStationId, hoveredStationId, onSelectStation]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetBounds = () => {
    mapInstanceRef.current?.fitBounds(basinBounds, { padding: [15, 15] });
  };

  // Determine which station details to display in the Right Panel Card
  const currentFocusedId = hoveredStationId || activeStationId;
  const currentStationRaw = TAQUARI_BASIN_STATIONS.find(s => s.id === currentFocusedId) || TAQUARI_BASIN_STATIONS[4]; // Default Lajeado
  
  const matchedNode = nodes.find(n => n.id === currentStationRaw.id || currentStationRaw.id.includes(n.id) || n.id.includes(currentStationRaw.id));
  const isTargetStation = currentStationRaw.id === activeStationId || activeStationId.includes(currentStationRaw.id);
  const isIncludedInPropagation = nodes.some(n => n.id === currentStationRaw.id || currentStationRaw.id.includes(n.id) || n.id.includes(currentStationRaw.id));

  const dynamicLevel = matchedNode?.currentLevel ? `${matchedNode.currentLevel.toFixed(2).replace('.', ',')} m` : currentStationRaw.variation;
  const dynamicTime = matchedNode ? (matchedNode.peakTimeObserved || matchedNode.peakTimePredicted) : currentStationRaw.flowTime;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch select-none">
      
      {/* LEFT COLUMN: REAL MAP CANVAS (COMPACT SIZE) */}
      <div className="lg:col-span-7 xl:col-span-8 relative h-[440px] bg-slate-100 dark:bg-[#030816] border border-slate-300 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex flex-col justify-between">
        
        {/* REAL LEAFLET MAP CANVAS */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* MAP TOP CONTROLS & TITLE */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          
          {/* TITLE BADGE */}
          <div className="flex items-center gap-2 bg-white/95 dark:bg-[#081023]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 px-3 py-1.5 rounded-xl shadow-lg dark:shadow-2xl pointer-events-auto">
            <Waves className="w-4 h-4 text-sky-500 dark:text-sky-400 animate-pulse shrink-0" />
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase">
              Mapa Real • Vale do Taquari
            </span>
          </div>

          {/* MAP STYLES & ZOOM CONTROLS */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            
            {/* MAP STYLE TOGGLES */}
            <div className="flex items-center gap-1 bg-white/95 dark:bg-[#081023]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-lg dark:shadow-2xl">
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  mapStyle === 'dark' ? 'bg-cyan-500 text-slate-950 font-extrabold shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Escuro
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  mapStyle === 'satellite' ? 'bg-cyan-500 text-slate-950 font-extrabold shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Satélite
              </button>
              <button
                onClick={() => setMapStyle('topo')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  mapStyle === 'topo' ? 'bg-cyan-500 text-slate-950 font-extrabold shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Terreno
              </button>
            </div>

            {/* ZOOM BUTTONS */}
            <div className="flex items-center gap-1 bg-white/95 dark:bg-[#081023]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-lg dark:shadow-2xl">
              <button
                onClick={handleZoomIn}
                title="Aumentar Zoom"
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Diminuir Zoom"
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={handleResetBounds}
                title="Centralizar Vale do Taquari"
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

          </div>

        </div>

        {/* MAP BOTTOM HINT */}
        <div className="absolute bottom-2 left-3 right-3 z-10 bg-white/95 dark:bg-[#081023]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 shadow-lg dark:shadow-2xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse shrink-0" />
            <span>Passe o mouse nos pontos para ver os dados no card ao lado</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
            Clique no ponto para selecionar Destino
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: DEDICATED STATION DETAILS CARD */}
      <div className="lg:col-span-5 xl:col-span-4 h-[440px] bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl flex flex-col justify-between">
        
        {/* CARD HEADER */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase leading-tight">
                Dados da Estação
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                {hoveredStationId ? '📍 Estação sob o cursor' : '🎯 Estação de Destino Ativa'}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md uppercase border ${
            isTargetStation 
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
              : isIncludedInPropagation 
              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800' 
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}>
            {isTargetStation ? 'DESTINO' : isIncludedInPropagation ? 'MONTANTE' : 'JUSANTE'}
          </span>
        </div>

        {/* CITY NAME & RIVER TITLE */}
        <div className="my-1.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentStationRaw.name}
            </h2>
            <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-md">
              {currentStationRaw.id.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            {currentStationRaw.riverName}
          </p>
        </div>

        {/* METRICS GRID 2x2 */}
        <div className="grid grid-cols-2 gap-2 my-1">
          
          {/* METRIC 1: NÍVEL TELEMÉTRICO */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Nível Telemétrico
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight my-0.5">
              {dynamicLevel}
            </span>
            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-medium block">
              Medição em Tempo Real
            </span>
          </div>

          {/* METRIC 2: COTA DE ALERTA */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Cota Referência
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight my-0.5">
              {currentStationRaw.cota}
            </span>
            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-medium block">
              Limite Transbordamento
            </span>
          </div>

          {/* METRIC 3: TENDÊNCIA E VARIAÇÃO */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tendência / Pico
            </span>
            <div className="flex items-center gap-1 my-0.5">
              {currentStationRaw.trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400 stroke-[3]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-sky-600 dark:text-sky-400 stroke-[3]" />
              )}
              <span className={`text-base font-black font-mono ${currentStationRaw.trend === 'up' ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>
                {currentStationRaw.variation}
              </span>
            </div>
            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-medium block">
              {currentStationRaw.trend === 'up' ? 'Elevação d\'água' : 'Recuo (Vazante)'}
            </span>
          </div>

          {/* METRIC 4: HORÁRIO DO PICO / CHEGADA */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Horário do Pico
            </span>
            <div className="flex items-center gap-1 my-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-base font-black text-cyan-700 dark:text-cyan-300 font-mono tracking-tight">
                {dynamicTime || '--:--'}
              </span>
            </div>
            <span className="text-[9px] text-slate-600 dark:text-slate-300 font-medium block">
              Pico Observado/Previsto
            </span>
          </div>

        </div>

        {/* TARGET DESTINATION ACTION BUTTON */}
        <div className="my-1">
          {!isTargetStation ? (
            <button
              onClick={() => onSelectStation(currentStationRaw.id)}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <TargetIcon className="w-4 h-4" />
              Fixar {currentStationRaw.name} como Destino
            </button>
          ) : (
            <div className="w-full py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Estação Atual Definida como Destino Principal</span>
            </div>
          )}
        </div>

        {/* BOTTOM QUICK CITY TABS SELECTOR */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Cidades da Bacia (Passe o mouse ou Clique):
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {TAQUARI_BASIN_STATIONS.map((st) => {
              const isSelected = st.id === currentStationRaw.id;
              const isTarget = st.id === activeStationId || activeStationId.includes(st.id);

              return (
                <button
                  key={st.id}
                  onMouseEnter={() => setHoveredStationId(st.id)}
                  onMouseLeave={() => setHoveredStationId(null)}
                  onClick={() => {
                    onSelectStation(st.id);
                    setHoveredStationId(st.id);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-1 ring-cyan-300' 
                      : isTarget
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {st.name}
                  {isTarget && ' 🎯'}
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

// Target Icon Helper
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
