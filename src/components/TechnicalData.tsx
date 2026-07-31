import React from 'react';
import { City } from '../types';
import { Database, RefreshCw, Cpu, Navigation, Gauge } from 'lucide-react';

interface TechnicalDataProps {
  selectedCity: City;
}

export const TechnicalData: React.FC<TechnicalDataProps> = ({ selectedCity }) => {
  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-5 shadow-xl transition-colors">
      <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase mb-4">
        DADOS TÉCNICOS
      </h3>

      <div className="flex flex-col gap-3 text-xs">
        {/* FONTE DE DADOS */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Fonte de Dados</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">Comitê Taquari-Antas</span>
        </div>

        {/* FREQUENCIA DE ATUALIZACAO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Frequência de Atualização</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">A cada 15 minutos</span>
        </div>

        {/* PRECISAO DO SENSOR */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Precisão do Sensor</span>
          </div>
          <span className="font-mono font-semibold dark:text-white text-slate-900">± 1 cm</span>
        </div>

        {/* COORDENADAS DA ESTACAO */}
        <div className="flex items-center justify-between pb-2 dark:border-slate-800/80 border-slate-200 border-b">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Navigation className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Coordenadas da Estação</span>
          </div>
          <span className="font-mono text-[11px] font-semibold dark:text-white text-slate-900">
            {selectedCity.latitude}° S {Math.abs(selectedCity.longitude)}° O
          </span>
        </div>

        {/* SENSOR */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2 dark:text-slate-400 text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Sensor</span>
          </div>
          <span className="font-semibold dark:text-white text-slate-900">Radar Hidrométrico</span>
        </div>
      </div>
    </div>
  );
};
