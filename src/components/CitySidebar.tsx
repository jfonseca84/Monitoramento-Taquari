import React, { useState } from 'react';
import { City } from '../types';
import { ChevronDown } from 'lucide-react';
import { BASIN_LABELS, BASIN_SECTION_TAGS, BASIN_STATIONS, BasinKey, HOME_FONT, STATUS_COLORS, STATUS_INK, formatLevel, shortRiverName } from './homeTheme';
import { ConnectionStatusType } from '../lib/supabase';

interface CitySidebarProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
  onOpenInfoModal?: () => void;
  basin?: BasinKey;
  onChangeBasin?: (basin: BasinKey) => void;
  connectionStatus?: ConnectionStatusType;
  lastUpdatedText?: string;
}

const SELECTED_CLIP = 'polygon(14px 0,100% 0,100% 100%,14px 100%,0 50%)';

export const CitySidebar: React.FC<CitySidebarProps> = ({
  cities,
  selectedCity,
  onSelectCity,
  basin = 'taquari',
  onChangeBasin
}) => {
  // Somente celular/tablet: a lista de estações fica recolhida dentro de um menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estações da bacia escolhida no mapa, de montante para jusante
  const slugs = BASIN_STATIONS[basin];
  const stations = cities
    .filter((c) => slugs.includes(c.slug))
    .sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));

  const isSelected = (c: City) => selectedCity.id === c.id || selectedCity.slug === c.slug;
  const currentCity = cities.find(isSelected) || selectedCity;
  const dotColor = (c: City) => (c.status_level ? STATUS_COLORS[c.status_level] : '#8A9199');

  return (
    <aside className={`w-full flex flex-col shrink-0 h-full min-h-0 bg-[var(--hm-side)] text-[var(--hm-text)] ${HOME_FONT}`}>

      {/* MOBILE MENU TRIGGER (oculto no computador) */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-expanded={mobileMenuOpen}
        aria-controls="city-menu-panel"
        className="lg:hidden w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--hm-line-soft)] cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: dotColor(currentCity) }} />
          <span className="flex flex-col items-start min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--hm-muted)]">Estações da Bacia</span>
            <span className="text-sm font-extrabold truncate notranslate" translate="no">{currentCity.name}</span>
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-[15px] font-light">{formatLevel(currentCity.current_level)} m</span>
          <ChevronDown className={`w-4 h-4 text-[var(--hm-muted)] transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Celular: toque fora do menu (na parte da esquerda) fecha */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu de estações"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/25 cursor-default"
        />
      )}

      {/* LISTA DE ESTAÇÕES: no celular abre como painel na lateral DIREITA (a página continua visível à esquerda) */}
      <nav
        id="city-menu-panel"
        aria-label="Estações da Bacia"
        className={`${
          mobileMenuOpen
            ? 'flex fixed right-0 top-14 bottom-0 w-[172px] z-40 bg-[var(--hm-side)] shadow-[-10px_0_28px_rgba(0,0,0,0.55)]'
            : 'hidden'
        } lg:flex lg:static lg:w-auto lg:shadow-none lg:z-auto flex-col flex-1 min-h-0 overflow-y-auto no-scrollbar`}
      >
        {/* Seletor de bacia no celular (no computador ele fica sobre o mapa) */}
        {onChangeBasin && (
          <div className="lg:hidden flex flex-col gap-0.5 m-2 p-0.5 rounded-[6px] bg-[var(--hm-line-soft)] text-xs font-bold">
            {(Object.keys(BASIN_LABELS) as BasinKey[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={basin === key}
                onClick={() => onChangeBasin(key)}
                className={`py-1.5 rounded-[5px] cursor-pointer ${basin === key ? 'bg-[var(--hm-sel-bg)] text-[var(--hm-sel-text)]' : 'text-[var(--hm-soft)]'}`}
              >
                {BASIN_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        <div className="hidden lg:block sticky top-0 z-10 shrink-0 pt-3.5 pb-0 px-2 text-center leading-[1.1] bg-[var(--hm-side)] shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <div className="text-[11px] font-light whitespace-nowrap">Estações da</div>
          <div className="text-xl font-extrabold whitespace-nowrap">Bacia</div>
          {/* Sombra suave sob o título: no lugar de uma linha, as cidades vão esmaecendo ao passar por baixo */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-4 bg-gradient-to-b from-[var(--hm-side)] to-transparent" />
        </div>
        {/* Espaço entre a linha do título e a primeira cidade */}
        <div aria-hidden className="hidden lg:block shrink-0 h-3" />

        {stations.map((city) => {
          const on = isSelected(city);
          const tag = city.basin_section ? BASIN_SECTION_TAGS[city.basin_section] : '';
          const riverShort = shortRiverName(city.river);
          // Indicador da estação selecionada: branco em nível normal; cor do status
          // (amarelo/laranja/vermelho) só em atenção, alerta ou inundação
          const hasAlert = city.status_level && city.status_level !== 'normal';
          const selectedBg = hasAlert ? STATUS_COLORS[city.status_level!] : 'var(--hm-sel-bg)';
          const selectedInk = hasAlert ? STATUS_INK[city.status_level!] : 'var(--hm-sel-text)';

          return (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                onSelectCity(city);
                setMobileMenuOpen(false);
              }}
              aria-current={on ? 'true' : undefined}
              style={on ? { clipPath: SELECTED_CLIP, backgroundColor: selectedBg, color: selectedInk } : undefined}
              className={`shrink-0 h-[50px] pr-3 flex flex-col justify-center items-start gap-px text-left cursor-pointer ${
                on ? 'pl-6' : 'text-[var(--hm-text)] pl-3.5 hover:bg-[var(--hm-hover)]'
              }`}
            >
              <span className="flex items-center gap-[5px] max-w-full min-w-0">
                <span className="text-xs font-extrabold leading-[1.1] truncate min-w-0 notranslate" translate="no">{city.name}</span>
                {tag && (
                  <span
                    className={`shrink-0 text-[8px] font-extrabold tracking-[0.04em] px-1 py-px rounded-[3px] ${
                      on ? 'bg-[color-mix(in_srgb,var(--hm-sel-text)_14%,transparent)] text-[var(--hm-sel-text)]' : 'bg-[var(--hm-line-soft)] text-[var(--hm-soft)]'
                    }`}
                  >
                    {tag}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 max-w-full min-w-0">
                <span
                  className="w-[7px] h-[7px] rounded-full shrink-0"
                  style={on ? { backgroundColor: selectedInk } : { backgroundColor: dotColor(city) }}
                  title={city.status_level || undefined}
                />
                <span className="text-[15px] font-light shrink-0 whitespace-nowrap">{formatLevel(city.current_level)} m</span>
                {riverShort && (
                  <span className="text-[10px] opacity-65 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 notranslate" translate="no">{riverShort}</span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};
