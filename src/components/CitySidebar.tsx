import React, { useState } from 'react';
import { City } from '../types';
import { Waves, Search } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { ConnectionStatusType } from '../lib/supabase';

interface CitySidebarProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
  onOpenInfoModal?: () => void;
  connectionStatus?: ConnectionStatusType;
  lastUpdatedText?: string;
}

export const CitySidebar: React.FC<CitySidebarProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  onOpenInfoModal,
  connectionStatus = 'online',
  lastUpdatedText = ''
}) => {
  const [activeBasin, setActiveBasin] = useState<'taquari' | 'guaiba'>('taquari');
  const [searchTerm, setSearchTerm] = useState('');

  // Strict list of allowed Vale do Taquari cities / SGB stations
  const TAQUARI_SLUGS = [
    'santatereza',
    'linhajosejulio',
    'passocarreiro',
    'linhacolombo',
    'passotainhas',
    'barradofao',
    'mucum',
    'encantado',
    'rocasales',
    'lajeado',
    'estrela',
    'cruzeirodosul',
    'bomretirodosul',
    'portomariante',
    'taquari'
  ];
  
  // Strict list of allowed Bacia do Guaíba cities
  const GUAIBA_SLUGS = ['portoalegre', 'saoleopoldo', 'gravatai', 'montenegro', 'saosebastiaodocai', 'taquara', 'cachoeiradosul', 'donafrancisca', 'feliz'];

  // Filter cities strictly by official classification catalog
  const taquariCities = cities.filter((c) => TAQUARI_SLUGS.includes(c.slug));
  const guaibaCities = cities.filter((c) => GUAIBA_SLUGS.includes(c.slug));

  // Get current list according to active tab or search
  let displayedCities = activeBasin === 'guaiba' ? guaibaCities : taquariCities;

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    displayedCities = cities.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.river && c.river.toLowerCase().includes(term)) ||
        c.slug.toLowerCase().includes(term)
    );
  }

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-5 shrink-0">
      
      {/* CITIES / STATIONS LIST */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 shadow-xl transition-colors">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <h2 className="text-xs font-bold dark:text-slate-200 text-slate-800 tracking-wider uppercase">
              Estações
            </h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            5 min
          </span>
        </div>

        {/* SEARCH BOX */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar cidade..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs dark:text-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* BASIN SELECTOR TABS */}
        {!searchTerm && (
          <div className="flex items-center gap-1 dark:bg-slate-900/90 bg-slate-100 p-1 rounded-xl mb-3 dark:border-slate-800 border-slate-200 text-[11px] font-semibold border">
            <button
              onClick={() => setActiveBasin('taquari')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                activeBasin === 'taquari'
                  ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              Vale do Taquari
            </button>
            <button
              onClick={() => setActiveBasin('guaiba')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                activeBasin === 'guaiba'
                  ? 'dark:bg-cyan-950 bg-cyan-100 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 border-cyan-300 border shadow-sm font-bold'
                  : 'dark:text-slate-400 text-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              Bacia do Guaíba
            </button>
          </div>
        )}

        {/* CITY / STATION BUTTONS - DISPLAYING ~12 CITIES WITH SCROLLBAR */}
        <div className="flex flex-col gap-1.5 p-0.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {displayedCities.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma cidade encontrada</p>
          ) : (
            displayedCities.map((city) => {
              const isSelected = selectedCity.id === city.id || selectedCity.slug === city.slug;
              const levelFormatted = typeof city.current_level === 'number' && !isNaN(city.current_level)
                ? `${city.current_level.toFixed(2).replace('.', ',')} m`
                : '-- m';

              return (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'dark:bg-[#1E293B] bg-cyan-50/90 dark:border-cyan-700/60 border-cyan-400 dark:text-white text-slate-900 shadow-md ring-1 ring-cyan-500/30'
                      : 'dark:text-slate-300 text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <StatusDot status={city.status_level} size="md" />
                    <div className="flex flex-col items-start min-w-0 truncate">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className="font-semibold truncate text-left notranslate" translate="no">{city.name}</span>
                        {city.basin_section && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase shrink-0">
                            {city.basin_section === 'cabeceira' ? 'Cab' : city.basin_section === 'montante' ? 'Mont' : city.basin_section === 'medio' ? 'Médio' : 'Jus'}
                          </span>
                        )}
                      </div>
                      {city.river && <span className="text-[10px] dark:text-slate-400 text-slate-500 truncate w-full text-left notranslate" translate="no">{city.river}</span>}
                    </div>
                  </div>

                  <span className={`font-mono text-xs font-bold shrink-0 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'dark:text-slate-200 text-slate-800'}`}>
                    {levelFormatted}
                  </span>
                </button>
              );
            })
          )}
        </div>

      </div>

    </aside>
  );
};

