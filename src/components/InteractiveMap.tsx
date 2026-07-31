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

  // Filter to display Bacia do Rio Taquari stations
  const taquariCities = cities.filter(
    (c) => c.basin === 'taquari' || c.river?.toLowerCase().includes('taquari') || c.river?.toLowerCase().includes('santa tereza')
  );

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

    taquariCities.forEach((city) => {
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
  }, [taquariCities, selectedCity]);

  // Center map when selected city changes
  useEffect(() => {
    if (mapRef.current && selectedCity.latitude && selectedCity.longitude) {
      mapRef.current.panTo([selectedCity.latitude, selectedCity.longitude], { animate: true });
    }
  }, [selectedCity]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([-29.38, -51.88], 10, { animate: true });
    }
  };

  return (
    <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden h-[480px]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 z-10 shrink-0">
        <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>MAPA DA BACIA DO RIO TAQUARI</span>
        </h3>

        {/* SATELLITE / DARK MAP SWITCH */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold self-start sm:self-auto">
          <button
            onClick={() => setMapType('sat')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mapType === 'sat' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satélite
          </button>
          <button
            onClick={() => setMapType('dark')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mapType === 'dark' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mapa Escuro
          </button>
        </div>
      </div>

      {/* LEAFLET MAP CONTAINER */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070F22] grow z-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* MAP CONTROLS OVERLAY */}
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1">
          <button 
            onClick={handleRecenter}
            title="Recentrar no Vale do Taquari"
            className="w-8 h-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center border border-slate-700 shadow-lg text-xs transition-colors"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
          </button>
          <button 
            onClick={handleZoomIn}
            title="Aumentar Zoom"
            className="w-8 h-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center border border-slate-700 shadow-lg text-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-200" />
          </button>
          <button 
            onClick={handleZoomOut}
            title="Diminuir Zoom"
            className="w-8 h-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center justify-center border border-slate-700 shadow-lg text-xs transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

    </div>
  );
};
