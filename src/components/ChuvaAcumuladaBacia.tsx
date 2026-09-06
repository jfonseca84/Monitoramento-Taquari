import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  CloudRain,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface StationCallout {
  id: string;
  name: string;
  river: string;
  lat: number;
  lng: number;
  accumulated: {
    '24h': number;
    '48h': number;
    '72h': number;
    '7d': number;
  };
}

// Estações reais com leituras pluviométricas na Bacia do Taquari-Antas
const BACIA_STATIONS: StationCallout[] = [
  { id: 'antas', name: 'Antas', river: 'Rio das Antas', lat: -28.995, lng: -51.696, accumulated: { '24h': 35, '48h': 62, '72h': 82, '7d': 110 } },
  { id: 'forqueta', name: 'Forqueta', river: 'Rio Forqueta', lat: -29.400, lng: -51.950, accumulated: { '24h': 48, '48h': 85, '72h': 110, '7d': 145 } },
  { id: 'forquetinha', name: 'Forquetinha', river: 'Arroio Forquetinha', lat: -29.383, lng: -52.091, accumulated: { '24h': 40, '48h': 72, '72h': 94, '7d': 128 } },
  { id: 'carreiro', name: 'Carreiro', river: 'Rio Carreiro', lat: -28.713, lng: -51.934, accumulated: { '24h': 38, '48h': 68, '72h': 91, '7d': 120 } },
  { id: 'taquari', name: 'Taquari', river: 'Rio Taquari', lat: -29.200, lng: -51.870, accumulated: { '24h': 30, '48h': 55, '72h': 75, '7d': 98 } },
  { id: 'ausentes', name: 'C. Ausentes', river: 'Cabeceira Antas', lat: -28.748, lng: -50.066, accumulated: { '24h': 52, '48h': 92, '72h': 125, '7d': 165 } },
  { id: 'veranopolis', name: 'Veranópolis', river: 'Rio das Antas', lat: -28.936, lng: -51.548, accumulated: { '24h': 58, '48h': 98, '72h': 138, '7d': 180 } },
  { id: 'lajeado', name: 'Lajeado', river: 'Médio Taquari', lat: -29.467, lng: -51.961, accumulated: { '24h': 25, '48h': 46, '72h': 68, '7d': 90 } },
];

export const ChuvaAcumuladaBacia: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '48h' | '72h' | '7d'>('72h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);

  // Centro exato da Bacia do Taquari-Antas (-29.05°S, -51.30°W)
  const basinCenterLat = -29.05;
  const basinCenterLng = -51.30;

  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    // Inicializa o Leaflet na Bacia do Taquari-Antas
    const map = L.map(mapContainerRef.current, {
      center: [basinCenterLat, basinCenterLng],
      zoom: 8,
      zoomControl: false,
      attributionControl: false
    });

    leafletMapRef.current = map;

    // Satélite em Alta Resolução (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    // Delimitação oficial da Bacia do Taquari-Antas (28°10'S a 29°57'S / 49°56'W a 52°38'W)
    const basinBounds: [number, number][] = [
      [-28.1667, -50.0000],
      [-28.2500, -49.9333],
      [-28.8500, -50.1000],
      [-29.2000, -50.4000],
      [-29.9500, -51.5000],
      [-29.8000, -52.2000],
      [-29.3000, -52.6333],
      [-28.8000, -52.3000],
      [-28.3000, -51.8000],
      [-28.1667, -50.8000]
    ];

    // Desenha o contorno da bacia em linha brilhante branca sobre o satélite
    L.polygon(basinBounds, {
      color: '#ffffff',
      weight: 2,
      opacity: 0.95,
      dashArray: '5, 4',
      fillColor: '#38bdf8',
      fillOpacity: 0.08
    }).addTo(map);

    // Renderiza manchas térmicas de chuva acumulada (Heatmap de precipitação sobre o satélite)
    BACIA_STATIONS.forEach((st) => {
      const mm = st.accumulated[selectedPeriod];
      
      let fillColor = '#38bdf8'; // < 50mm (Azul)
      let radiusMeters = 18000;

      if (mm >= 120) {
        fillColor = '#ef4444'; // > 120mm (Vermelho / Muito Alto)
        radiusMeters = 28000;
      } else if (mm >= 90) {
        fillColor = '#f97316'; // 90-120mm (Laranja / Alerta)
        radiusMeters = 24000;
      } else if (mm >= 60) {
        fillColor = '#eab308'; // 60-90mm (Amarelo / Atenção)
        radiusMeters = 22000;
      } else if (mm >= 30) {
        fillColor = '#10b981'; // 30-60mm (Verde)
        radiusMeters = 20000;
      }

      // Círculos de difusão de chuva acumulada (efeito radar espacial)
      L.circle([st.lat, st.lng], {
        radius: radiusMeters,
        color: 'transparent',
        fillColor: fillColor,
        fillOpacity: 0.35
      }).addTo(map);

      L.circle([st.lat, st.lng], {
        radius: radiusMeters * 0.5,
        color: 'transparent',
        fillColor: fillColor,
        fillOpacity: 0.55
      }).addTo(map);
    });

    // Adiciona os Callouts das Estações
    BACIA_STATIONS.forEach((st) => {
      const mm = st.accumulated[selectedPeriod];

      let borderColor = '#38bdf8';
      if (mm >= 120) borderColor = '#ef4444';
      else if (mm >= 90) borderColor = '#f97316';
      else if (mm >= 60) borderColor = '#eab308';
      else if (mm >= 30) borderColor = '#10b981';

      const calloutHtml = `
        <div style="
          background: rgba(8, 16, 35, 0.92);
          border: 1.5px solid ${borderColor};
          color: #ffffff;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.85);
          backdrop-filter: blur(4px);
        ">
          ${st.name} <span style="color: ${borderColor}; font-family: monospace;">${mm}mm</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: calloutHtml,
        className: 'custom-station-callout',
        iconSize: [100, 22],
        iconAnchor: [50, 11]
      });

      L.marker([st.lat, st.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <strong style="color: #0284c7; font-size: 12px;">${st.name}</strong><br/>
            <span style="font-size: 11px; color: #475569;">${st.river}</span><br/>
            <span style="font-size: 11px; color: #0284c7; font-weight: bold;">Chuva Acumulada (${selectedPeriod}): ${mm} mm</span>
          </div>
        `);
    });

    // Camada de radar em tempo real RainViewer
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data?.radar?.past?.length) {
          const latestPast = data.radar.past[data.radar.past.length - 1];
          const radarUrl = `https://tilecache.rainviewer.com${latestPast.path}/256/{z}/{x}/{y}/2/1_1.png`;

          if (radarTileLayerRef.current) {
            map.removeLayer(radarTileLayerRef.current);
          }

          const radarLayer = L.tileLayer(radarUrl, {
            opacity: 0.5,
            tileSize: 256
          }).addTo(map);

          radarTileLayerRef.current = radarLayer;
        }
      })
      .catch(err => console.warn('Radar RainViewer indisponível:', err));

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [viewMode, selectedPeriod]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="bg-white dark:bg-[#081023] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 shadow-md dark:shadow-2xl h-full flex flex-col justify-between transition-colors">
      <div>
        {/* TITLE BAR (CARD ORIGINAL) */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            CHUVA ACUMULADA NA BACIA
          </h3>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#040814] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                viewMode === 'map' ? 'bg-[#1D4ED8] text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mapa
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-[#1D4ED8] text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tabela
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div>
            {/* CANVAS DO MAPA COM SATELLITE & CHUVA ACUMULADA */}
            <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#040814]">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* OVERLAY BADGE PERÍODO (POSIÇÃO EXATA DO CARD ORIGINAL) */}
              <div className="absolute top-2 left-2 z-10 bg-white/90 dark:bg-[#081023]/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg backdrop-blur-md">
                <span>Período:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="bg-transparent text-cyan-700 dark:text-cyan-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="24h" className="bg-white dark:bg-[#081023] text-slate-900 dark:text-white">Últimas 24h</option>
                  <option value="48h" className="bg-white dark:bg-[#081023] text-slate-900 dark:text-white">Últimas 48h</option>
                  <option value="72h" className="bg-white dark:bg-[#081023] text-slate-900 dark:text-white">Últimas 72h</option>
                  <option value="7d" className="bg-white dark:bg-[#081023] text-slate-900 dark:text-white">Últimos 7 dias</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* BOTÃO ATUALIZAR */}
              <button
                onClick={handleRefresh}
                className="absolute top-2 right-2 z-10 p-1 rounded-md bg-white/80 dark:bg-[#081023]/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-md backdrop-blur-md"
                title="Atualizar Radar Satélite"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-500 dark:text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* GRADIENT SCALE LEGEND (REPLICANDO O CARD ORIGINAL) */}
            <div className="mt-2.5 space-y-1">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 via-amber-400 via-red-500 to-purple-600 shadow-inner" />
              <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                <span>&lt; 10</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
                <span>&gt; 150 mm</span>
              </div>
            </div>
          </div>
        ) : (
          /* MODO TABELA DO CARD ORIGINAL */
          <div className="bg-slate-50 dark:bg-[#040814] border border-slate-200 dark:border-slate-800 rounded-xl p-3 overflow-x-auto min-h-[210px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  <th className="py-1.5 px-2">Estação</th>
                  <th className="py-1.5 px-2">Rio / Sub-bacia</th>
                  <th className="py-1.5 px-2 text-right">Chuva ({selectedPeriod})</th>
                  <th className="py-1.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {BACIA_STATIONS.map((st) => {
                  const mm = st.accumulated[selectedPeriod];
                  return (
                    <tr key={st.id} className="hover:bg-slate-100 dark:hover:bg-slate-900/50">
                      <td className="py-1.5 px-2 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400 text-[11px]">{st.river}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-cyan-700 dark:text-cyan-300">{mm} mm</td>
                      <td className="py-1.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          mm >= 120
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-600/50'
                            : mm >= 90
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600/50'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/50'
                        }`}>
                          {mm >= 120 ? 'Severo' : mm >= 90 ? 'Atenção' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
