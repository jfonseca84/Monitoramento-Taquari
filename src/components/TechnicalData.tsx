import React from 'react';
import { City } from '../types';
import { Database, RefreshCw, Cpu, Navigation, Gauge, MapPin, Layers, Anchor } from 'lucide-react';

interface TechnicalDataProps {
  selectedCity: City;
}

export const TechnicalData: React.FC<TechnicalDataProps> = ({ selectedCity }) => {
  const sourceText = selectedCity.source_origin || 'SGB/SACE';
  const municipalityText = selectedCity.municipality || selectedCity.name;
  const stationType = selectedCity.station_type || 'Telemétrica SGB/SACE';
  const classificationText = selectedCity.classification
    ? (selectedCity.classification === 'rio_principal' ? 'Rio Principal' : selectedCity.classification === 'afluente' ? 'Afluente' : 'Cabeceira')
    : 'Rio Principal';

  const sectionLabelMap: Record<string, string> = {
    cabeceira: 'Cabeceiras',
    montante: 'Montante',
    medio: 'Médio Taquari',
    jusante: 'Jusante'
  };

  const sectionText = selectedCity.basin_section ? (sectionLabelMap[selectedCity.basin_section] || selectedCity.basin_section) : 'Bacia do Taquari';

  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-5 shadow-xl transition-colors border">
      <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase mb-4 flex items-center justify-between">
        <span>DADOS TÉCNICOS DA ESTAÇÃO</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 lowercase">
          {sourceText}
        </span>
      </h3>

      <div className="flex flex-col gap-3 text-xs">
        {/* MUNICÍPIO E RIO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Município / Rio</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900 text-right notranslate" translate="no">
            {municipalityText} ({selectedCity.river || 'Rio Taquari'})
          </span>
        </div>

        {/* SEÇÃO DA BACIA */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Seção da Bacia</span>
          </div>
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">
            {sectionText}
          </span>
        </div>

        {/* CLASSIFICAÇÃO DA ESTAÇÃO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Anchor className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Classificação</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">
            {classificationText}
          </span>
        </div>

        {/* FONTE DE DADOS */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Fonte de Dados</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">
            SGB/SACE - Alerta Crítico
          </span>
        </div>

        {/* FREQUÊNCIA DE ATUALIZAÇÃO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Atualização</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">A cada 5 minutos</span>
        </div>

        {/* PRECISÃO DO SENSOR */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Precisão Sensor</span>
          </div>
          <span className="font-mono font-semibold dark:text-white text-slate-900">± 1 cm</span>
        </div>

        {/* COORDENADAS DA ESTAÇÃO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Navigation className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Coordenadas</span>
          </div>
          <span className="font-mono text-[11px] font-semibold dark:text-white text-slate-900">
            {selectedCity.latitude}° S {Math.abs(selectedCity.longitude)}° O
          </span>
        </div>

        {/* TIPO DE ESTAÇÃO SENSOR */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Tipo de Estação</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900 text-right">{stationType}</span>
        </div>

        {selectedCity.influence_notes && (
          <div className="mt-2 pt-2 border-t dark:border-slate-800/80 border-slate-200 text-[11px] text-slate-500 dark:text-slate-400 italic">
            "{selectedCity.influence_notes}"
          </div>
        )}
      </div>
    </div>
  );
};
