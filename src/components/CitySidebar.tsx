import React, { useState } from 'react';
import { City, LevelStatus } from '../types';
import { ChevronRight, QrCode, ExternalLink, Waves, Filter } from 'lucide-react';
import { getCityThresholds } from '../data/cityThresholds';
import { StatusDot } from './StatusDot';

interface CitySidebarProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
  onOpenInfoModal?: () => void;
}

export const CitySidebar: React.FC<CitySidebarProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  onOpenInfoModal
}) => {
  const [activeBasin, setActiveBasin] = useState<'taquari' | 'guaiba'>('taquari');

  const thresholds = getCityThresholds(selectedCity);
  const normalVal = thresholds.normal;
  const attentionVal = thresholds.attention;
  const alertVal = thresholds.alert;
  const floodVal = thresholds.flood;

  // Strict list of allowed Vale do Taquari cities
  const TAQUARI_SLUGS = ['santatereza', 'mucum', 'encantado', 'rocasales', 'lajeado', 'estrela', 'bomretirodosul'];
  
  // Strict list of allowed Bacia do Guaíba cities
  const GUAIBA_SLUGS = ['portoalegre', 'saoleopoldo', 'gravatai', 'montenegro', 'saosebastiaodocai', 'taquari', 'taquara', 'cachoeiradosul', 'donafrancisca', 'feliz'];

  // Filter cities strictly by official classification catalog
  const taquariCities = cities.filter((c) => TAQUARI_SLUGS.includes(c.slug));
  const guaibaCities = cities.filter((c) => GUAIBA_SLUGS.includes(c.slug));

  // Get current list according to active tab
  const displayedCities = activeBasin === 'guaiba' ? guaibaCities : taquariCities;

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
            15 min
          </span>
        </div>

        {/* BASIN SELECTOR TABS */}
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

        {/* CITY / STATION BUTTONS */}
        <div className="flex flex-col gap-1.5 p-0.5">
          {displayedCities.map((city) => {
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
                    <span className="font-semibold truncate w-full text-left notranslate" translate="no">{city.name}</span>
                    {city.river && <span className="text-[10px] dark:text-slate-400 text-slate-500 truncate w-full text-left notranslate" translate="no">{city.river}</span>}
                  </div>
                </div>

                <span className={`font-mono text-xs font-bold shrink-0 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'dark:text-slate-200 text-slate-800'}`}>
                  {levelFormatted}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* UNDERSTAND THE LEVELS CARD */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 shadow-xl transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase">
            Cotas de Nível ({selectedCity.name})
          </h3>
        </div>

        <div className="flex flex-col gap-2.5 text-xs dark:text-slate-300 text-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span>Normal</span>
            </div>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{normalVal.toFixed(2).replace('.', ',')} m</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span>Atenção</span>
            </div>
            <span className="font-mono text-amber-600 dark:text-amber-300 font-bold">{attentionVal.toFixed(2).replace('.', ',')} m</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
              <span>Alerta</span>
            </div>
            <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{alertVal.toFixed(2).replace('.', ',')} m</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status="inundacao" size="md" />
              <span className="text-red-600 dark:text-red-400 font-bold">Inundação</span>
            </div>
            <span className="font-mono text-red-600 dark:text-red-400 font-bold">{floodVal.toFixed(2).replace('.', ',')} m</span>
          </div>
        </div>

        <button 
          onClick={onOpenInfoModal}
          className="mt-3 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Ver mais informações</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MOBILE QR CODE CARD */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 shadow-xl flex items-center gap-3 transition-colors">
        <div className="w-16 h-16 bg-white rounded-xl p-1.5 shrink-0 flex items-center justify-center border border-slate-200 dark:border-transparent">
          <QrCode className="w-full h-full text-slate-900" />
        </div>
        <div>
          <h4 className="text-xs font-bold dark:text-white text-slate-900 mb-1">
            Acompanhe pelo celular
          </h4>
          <p className="text-[11px] dark:text-slate-400 text-slate-600 leading-tight">
            Escaneie o QR Code e acesse o monitoramento dos Rios do RS em tempo real.
          </p>
        </div>
      </div>

    </aside>
  );
};

