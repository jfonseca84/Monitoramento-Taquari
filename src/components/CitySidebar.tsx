import React, { useState } from 'react';
import { City } from '../types';
import { Search, ChevronDown } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { BASIN_SECTION_TAGS, HOME_FONT, formatLevel, shortRiverName } from './homeTheme';
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
  // Somente celular/tablet: a lista de cidades fica recolhida dentro de um menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const currentCity = cities.find((c) => c.id === selectedCity.id || c.slug === selectedCity.slug) || selectedCity;
  const currentLevelFormatted = `${formatLevel(currentCity.current_level)} m`;

  const basinTabClass = (active: boolean) =>
    `flex-1 py-1 px-1.5 rounded-[4px] transition-colors text-center cursor-pointer ${
      active ? 'bg-white text-[#2B333D] font-extrabold' : 'text-[#C9CDD2] hover:text-white hover:bg-[#2E3742]'
    }`;

  return (
    <aside className={`w-full flex flex-col shrink-0 h-full min-h-0 ${HOME_FONT}`}>

      {/* MOBILE MENU TRIGGER (oculto no computador) */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-expanded={mobileMenuOpen}
        aria-controls="city-menu-panel"
        className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#1B222B] text-white border-b border-[#2E3742] cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={currentCity.status_level} size="md" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#B4B9BF]">Estação</span>
            <span className="text-sm font-extrabold truncate notranslate" translate="no">{currentCity.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-light">{currentLevelFormatted}</span>
          <ChevronDown className={`w-4 h-4 text-[#B4B9BF] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* CITIES / STATIONS LIST (no celular só aparece com o menu aberto) */}
      <div
        id="city-menu-panel"
        className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex bg-[#1B222B] text-white h-full min-h-0 flex-col`}
      >
        <div className="px-3 pt-3.5 pb-2 text-center leading-[1.1] shrink-0">
          <div className="text-sm font-light">Estações da</div>
          <div className="text-xl font-extrabold">Bacia</div>
        </div>

        {/* SEARCH BOX */}
        <div className="relative mx-2.5 mb-2 shrink-0">
          <Search className="w-3 h-3 text-[#B4B9BF] absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar..."
            aria-label="Pesquisar cidade"
            className="w-full pl-6 pr-2 py-1 bg-[#2E3742] border border-[#3A434E] rounded-[4px] text-[11px] text-white placeholder-[#8A9199] focus:outline-none focus:border-[#7CC3E6]"
          />
        </div>

        {/* BASIN SELECTOR TABS */}
        {!searchTerm && (
          <div className="flex items-center gap-0.5 mx-2.5 mb-2 p-0.5 rounded-[5px] bg-[#2E3742] text-[9.5px] font-semibold leading-tight shrink-0">
            <button onClick={() => setActiveBasin('taquari')} className={basinTabClass(activeBasin === 'taquari')}>
              Vale do Taquari
            </button>
            <button onClick={() => setActiveBasin('guaiba')} className={basinTabClass(activeBasin === 'guaiba')}>
              Bacia do Guaíba
            </button>
          </div>
        )}

        {/* CITY / STATION BUTTONS */}
        <div className="flex flex-col flex-1 min-h-0 max-h-[60vh] lg:max-h-none overflow-y-auto no-scrollbar pb-2">
          {displayedCities.length === 0 ? (
            <p className="text-xs text-[#B4B9BF] text-center py-4">Nenhuma cidade encontrada</p>
          ) : (
            displayedCities.map((city) => {
              const isSelected = selectedCity.id === city.id || selectedCity.slug === city.slug;
              const tag = city.basin_section ? BASIN_SECTION_TAGS[city.basin_section] : '';
              const riverShort = shortRiverName(city.river);

              return (
                <button
                  key={city.id}
                  onClick={() => {
                    onSelectCity(city);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={isSelected ? 'true' : undefined}
                  style={isSelected ? { clipPath: 'polygon(14px 0,100% 0,100% 100%,14px 100%,0 50%)' } : undefined}
                  className={`w-full shrink-0 min-h-[36px] py-1 pr-3 flex flex-col justify-center items-start gap-px text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-white text-[#2B333D] pl-6' : 'text-white pl-3.5 hover:bg-[#252D37]'
                  }`}
                >
                  <span className="flex items-center gap-[5px] max-w-full min-w-0">
                    <span className="text-xs font-extrabold leading-[1.1] truncate min-w-0 notranslate" translate="no">{city.name}</span>
                    {tag && (
                      <span
                        className={`shrink-0 text-[8px] font-extrabold tracking-[0.04em] px-1 py-px rounded-[3px] ${
                          isSelected ? 'bg-[#E6E8EB] text-[#58616B]' : 'bg-[#2E3742] text-[#C9CDD2]'
                        }`}
                      >
                        {tag}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={city.status_level} size="sm" />
                    <span className="text-[15px] font-light leading-tight">{formatLevel(city.current_level)} m</span>
                    {riverShort && (
                      <span className="text-[10px] opacity-65 whitespace-nowrap notranslate" translate="no">{riverShort}</span>
                    )}
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

