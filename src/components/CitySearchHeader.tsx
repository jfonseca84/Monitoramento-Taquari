import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { City } from '../types';
import { BASIN_LABELS, BASIN_STATIONS, STATUS_COLORS, SURFACE_A, LINE, basinOfCity, formatLevel } from './homeTheme';

interface CitySearchHeaderProps {
  selectedCity: City;
  cities: City[];
  onSelectCity?: (city: City) => void;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Ícone de lupa do modelo (anel + cabo)
const SearchGlyph: React.FC = () => (
  <span aria-hidden="true" className="relative block w-[26px] h-[26px] border-4 border-white rounded-full">
    <span className="absolute w-1 h-3 bg-white -left-1.5 -bottom-[11px] rotate-45 rounded-sm" />
  </span>
);

// Cabeçalho da cidade com busca: a lupa abre um campo; as sugestões (estações das duas bacias)
// só aparecem depois que a pessoa digita
export const CitySearchHeader: React.FC<CitySearchHeaderProps> = ({ selectedCity, cities, onSelectCity }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Estações pesquisáveis: as das duas bacias exibidas na página, na ordem do menu lateral
  const searchable = useMemo(() => {
    const order = [...BASIN_STATIONS.taquari, ...BASIN_STATIONS.guaiba];
    return cities
      .filter((c) => order.includes(c.slug))
      .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  }, [cities]);

  const results = useMemo(() => {
    const q = norm(query);
    // Sem texto digitado não há sugestões (a lupa abre só o campo)
    if (!q) return [];
    return searchable.filter((c) => norm(c.name).includes(q) || norm(c.river || '').includes(q));
  }, [searchable, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const choose = (city: City) => {
    onSelectCity?.(city);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    }
  };

  const canSearch = !!onSelectCity && searchable.length > 0;

  return (
    <div ref={boxRef} className={`${SURFACE_A} ${LINE} relative border-b flex items-center gap-5 sm:gap-7 py-5 sm:py-[26px] px-5 sm:px-9`}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        disabled={!canSearch}
        aria-label={open ? 'Fechar busca de cidades' : 'Buscar cidade'}
        aria-expanded={open}
        aria-controls="city-search-results"
        title="Buscar cidade"
        className="shrink-0 p-1 -m-1 rounded-md cursor-pointer hover:bg-[#3A434E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7CC3E6] disabled:cursor-default disabled:hover:bg-transparent"
      >
        <SearchGlyph />
      </button>
      <span aria-hidden="true" className="w-px h-12 bg-[#4A535E] shrink-0" />

      {open ? (
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar cidade ou rio…"
            aria-label="Buscar cidade ou rio"
            role="combobox"
            aria-expanded={norm(query) !== ''}
            aria-controls="city-search-results"
            aria-activedescendant={results[active] ? `city-opt-${results[active].id}` : undefined}
            autoComplete="off"
            className="flex-1 min-w-0 bg-white text-[#1B222B] placeholder:text-[#8A9199] rounded-lg px-4 py-2.5 sm:py-3 border-0 outline-none focus-visible:ring-2 focus-visible:ring-[#7CC3E6] text-[20px] sm:text-[26px] font-extrabold tracking-[-0.02em]"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Fechar busca"
            className="shrink-0 p-2 rounded-md text-[#B4B9BF] hover:text-white hover:bg-[#3A434E] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <h1 className="m-0 text-[32px] sm:text-[50px] font-black tracking-[-0.03em] leading-[1.15] truncate notranslate" translate="no">
          {selectedCity.name}, RS
        </h1>
      )}

      {open && norm(query) !== '' && (
        <ul
          id="city-search-results"
          role="listbox"
          aria-label="Cidades encontradas"
          className="absolute left-0 right-0 top-full z-30 max-h-[60vh] overflow-y-auto no-scrollbar bg-[#1B222B] border-b border-[#3A434E] shadow-2xl"
        >
          {results.length === 0 ? (
            <li className="px-9 py-4 text-sm text-[#B4B9BF]">Nenhuma cidade encontrada para “{query}”.</li>
          ) : (
            results.map((c, i) => {
              const basin = basinOfCity(c.slug);
              const isCurrent = c.id === selectedCity.id || c.slug === selectedCity.slug;
              return (
                <li
                  key={c.id}
                  id={`city-opt-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(c);
                  }}
                  className={`flex items-center gap-3 px-5 sm:px-9 py-3 cursor-pointer text-white ${i === active ? 'bg-[#2E3742]' : ''}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.status_level ? STATUS_COLORS[c.status_level] : '#8A9199' }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-extrabold truncate notranslate" translate="no">
                      {c.name}
                      {isCurrent && <span className="ml-2 text-[11px] font-semibold text-[#7CC3E6]">(exibida)</span>}
                    </span>
                    <span className="block text-xs text-[#B4B9BF] truncate">
                      {c.river || ''}
                      {basin ? `${c.river ? ' · ' : ''}${BASIN_LABELS[basin]}` : ''}
                    </span>
                  </span>
                  <span className="text-lg font-light shrink-0">{formatLevel(c.current_level)} m</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
