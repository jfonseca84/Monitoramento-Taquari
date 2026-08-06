import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { City } from '../types';
import { MapPin, Navigation, Plus, Minus } from 'lucide-react';

interface InteractiveMapProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  cities,
  selectedCity,
  onSelectCity
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'sat' | 'dark'>('sat');
  const [selectedBasin, setSelectedBasin] = useState<'taquari' | 'guaiba' | 'all'>('taquari');

  // Sync basin when selected city changes if city is from another basin
  useEffect(() => {
    if (selectedCity && selectedCity.basin && selectedBasin !== 'all' && selectedCity.basin !== selectedBasin) {
      setSelectedBasin(selectedCity.basin as 'taquari' | 'guaiba');
    }
  }, [selectedCity]);

  // Display active catalog cities filtered by selected basin
  const displayCities = cities.filter((c) => {
    if (c.active === false || !c.latitude || !c.longitude) return false;
    if (selectedBasin === 'all') return true;
    return (c.basin || 'taquari') === selectedBasin;
  });

  // Tile layer URLs
  const satTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    // Center of Vale do Taquari (Lajeado / Encantado area)
    const map = L.map(mapContainerRef.current, {
      center: [-29.38, -51.88],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    const initialTileUrl = mapType === 'sat' ? satTileUrl : darkTileUrl;
    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }

    const newUrl = mapType === 'sat' ? satTileUrl : darkTileUrl;
    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  }, [mapType]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    (Object.values(markersRef.current) as L.Marker[]).forEach((m) => m.remove());
    markersRef.current = {};

    displayCities.forEach((city) => {
      if (!city.latitude || !city.longitude) return;

      const isSelected = selectedCity.id === city.id || selectedCity.slug === city.slug;
      const levelFormatted = typeof city.current_level === 'number' && !isNaN(city.current_level)
        ? `${city.current_level.toFixed(2).replace('.', ',')}m`
        : '--';

      let statusBg = '#10B981'; // normal green
      if (city.status_level === 'inundacao') statusBg = '#EF4444'; // red
      else if (city.status_level === 'alerta') statusBg = '#F97316'; // orange
      else if (city.status_level === 'atencao') statusBg = '#F59E0B'; // yellow

      // Custom DivIcon for Leaflet
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center group cursor-pointer" style="transform: translate(-10px, -10px);">
            ${isSelected ? '<div class="absolute -inset-2 rounded-full bg-cyan-400/40 animate-ping"></div>' : ''}
            
            <div class="w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-lg ${
              isSelected ? 'bg-cyan-400 border-white ring-4 ring-cyan-400/50' : 'bg-slate-900 border-slate-400'
            }">
              <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${statusBg};"></div>
            </div>

            <div class="ml-2 flex items-center gap-1.5 bg-slate-950/95 border ${
              isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/90' : 'border-slate-700'
            } px-2 py-0.5 rounded-xl shadow-2xl backdrop-blur-md text-nowrap pointer-events-auto">
              <span class="text-[11px] font-black ${isSelected ? 'text-cyan-300' : 'text-slate-100'}">${city.name}</span>
              <span class="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-1 py-0.2 rounded">${levelFormatted}</span>
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([city.latitude, city.longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .on('click', () => {
          onSelectCity(city);
        });

      markersRef.current[city.id] = marker;
    });
  }, [displayCities, selectedCity]);

  // Center map when selected city changes
  useEffect(() => {
    if (mapRef.current && selectedCity.latitude && selectedCity.longitude) {
      mapRef.current.panTo([selectedCity.latitude, selectedCity.longitude], { animate: true });
    }
  }, [selectedCity]);

  // Handle map resizing automatically
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleBasinChange = (basin: 'taquari' | 'guaiba' | 'all') => {
    setSelectedBasin(basin);
    if (!mapRef.current) return;
    if (basin === 'taquari') {
      mapRef.current.setView([-29.38, -51.88], 10, { animate: true });
    } else if (basin === 'guaiba') {
      mapRef.current.setView([-29.80, -51.30], 9, { animate: true });
    } else {
      mapRef.current.setView([-29.55, -51.60], 9, { animate: true });
    }
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (selectedBasin === 'taquari') {
      mapRef.current.setView([-29.38, -51.88], 10, { animate: true });
    } else if (selectedBasin === 'guaiba') {
      mapRef.current.setView([-29.80, -51.30], 9, { animate: true });
    } else {
      mapRef.current.setView([-29.55, -51.60], 9, { animate: true });
    }
  };

  return (
    <div className="w-full dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-3.5 sm:p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[500px] transition-all border">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 z-10 shrink-0 border-b dark:border-slate-800/80 border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold dark:text-slate-100 text-slate-800 tracking-wider uppercase flex items-center gap-2">
              <span>
                MAPA HIDROLÓGICO REGIONAL — {selectedBasin === 'taquari' ? 'BACIA DO RIO TAQUARI' : selectedBasin === 'guaiba' ? 'BACIA DE PORTO ALEGRE' : 'TODAS AS BACIAS'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualização geoespacial telemétrica das {displayCities.length} estações ativas {selectedBasin === 'taquari' ? 'na Bacia do Taquari' : selectedBasin === 'guaiba' ? 'na Bacia de Porto Alegre' : 'no Rio Grande do Sul'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden xl:inline-flex text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {displayCities.length} Estações On-line
          </span>

          {/* BACIA SELECTOR SWITCH */}
          <div className="flex items-center dark:bg-slate-900 bg-slate-100 dark:border-slate-800 border-slate-200 border rounded-xl p-1 text-[11px] sm:text-xs font-bold overflow-x-auto max-w-full no-scrollbar">
            <button
              onClick={() => handleBasinChange('taquari')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedBasin === 'taquari'
                  ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Bacia do Taquari
            </button>
            <button
              onClick={() => handleBasinChange('guaiba')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedBasin === 'guaiba'
                  ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Bacia de Porto Alegre
            </button>
            <button
              onClick={() => handleBasinChange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedBasin === 'all'
                  ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todas
            </button>
          </div>

          {/* SATELLITE / DARK MAP SWITCH */}
          <div className="flex items-center dark:bg-slate-900 bg-slate-100 dark:border-slate-800 border-slate-200 border rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setMapType('sat')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mapType === 'sat' ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Satélite
            </button>
            <button
              onClick={() => setMapType('dark')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mapType === 'dark' ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold' : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Mapa Escuro
            </button>
          </div>
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden dark:border-slate-800 border-slate-300 border dark:bg-[#070F22] bg-slate-100 grow z-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* MAP CONTROLS OVERLAY */}
        <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-1.5">
          <button 
            onClick={handleRecenter}
            title="Recentrar no Vale do Taquari"
            className="w-9 h-9 dark:bg-slate-900/90 bg-white/90 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-xl flex items-center justify-center dark:border-slate-700 border-slate-300 border shadow-xl text-xs transition-colors cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </button>
          <button 
            onClick={handleZoomIn}
            title="Aumentar Zoom"
            className="w-9 h-9 dark:bg-slate-900/90 bg-white/90 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-xl flex items-center justify-center dark:border-slate-700 border-slate-300 border shadow-xl text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 dark:text-slate-200 text-slate-800" />
          </button>
          <button 
            onClick={handleZoomOut}
            title="Diminuir Zoom"
            className="w-9 h-9 dark:bg-slate-900/90 bg-white/90 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-xl flex items-center justify-center dark:border-slate-700 border-slate-300 border shadow-xl text-xs transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4 dark:text-slate-200 text-slate-800" />
          </button>
        </div>
      </div>

    </div>
  );
};
