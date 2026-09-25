import React from 'react';
import { City } from '../types';
import { Anchor, Database, Layers, MapPin, RefreshCw } from 'lucide-react';
import { HOME_FONT } from './homeTheme';

interface StationInfoCardProps {
  city: City;
}

const SECTION_LABELS: Record<string, string> = {
  cabeceira: 'Cabeceiras',
  montante: 'Montante',
  medio: 'Médio Taquari',
  jusante: 'Jusante'
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  rio_principal: 'Rio Principal',
  afluente: 'Afluente',
  cabeceira: 'Cabeceira'
};

export const StationInfoCard: React.FC<StationInfoCardProps> = ({ city }) => {
  const source = city.source_origin || 'SGB/SACE';
  const municipality = city.municipality || city.name;
  const classification = city.classification ? (CLASSIFICATION_LABELS[city.classification] || 'Rio Principal') : 'Rio Principal';
  const section = city.basin_section ? (SECTION_LABELS[city.basin_section] || city.basin_section) : 'Bacia do Taquari';

  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    { icon: <MapPin className="w-[1.15em] h-[1.15em]" />, label: 'Município / Rio', value: <span className="notranslate" translate="no">{municipality} ({city.river || 'Rio Taquari'})</span> },
    { icon: <Layers className="w-[1.15em] h-[1.15em]" />, label: 'Seção da Bacia', value: <span className="text-[var(--map-card-teal)]">{section}</span> },
    { icon: <Anchor className="w-[1.15em] h-[1.15em]" />, label: 'Classificação', value: classification },
    { icon: <Database className="w-[1.15em] h-[1.15em]" />, label: 'Fonte de Dados', value: source },
    { icon: <RefreshCw className="w-[1.15em] h-[1.15em]" />, label: 'Atualização', value: 'A cada 5 minutos' }
  ];

  return (
    <div className={`${HOME_FONT} pointer-events-auto bg-[var(--map-card-bg)] backdrop-blur-md backdrop-saturate-150 text-[var(--map-text)] rounded-[0.9em] border border-[var(--map-card-line)] shadow-[0_6px_20px_rgba(43,51,61,0.12)] px-[0.9em] py-[0.7em]`}>
      <div className="flex items-center justify-between gap-[0.6em] mb-[0.2em]">
        <span className="text-[0.86em] font-extrabold uppercase tracking-[0.05em]">Dados técnicos da estação</span>
        <span className="text-[0.82em] font-mono px-[0.4em] rounded bg-[var(--map-card-tag-bg)] text-[var(--map-card-tag-text)] border border-[var(--map-card-tag-line)] lowercase">{source}</span>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between gap-[0.6em] py-[0.3em] ${i < rows.length - 1 ? 'border-b border-[var(--map-card-sep)]' : ''}`}>
            <span className="flex items-center gap-[0.4em] text-[var(--map-muted)] shrink-0">
              <span className="text-[var(--map-card-teal)]">{r.icon}</span>
              {r.label}
            </span>
            <span className="font-bold text-right min-w-0">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
