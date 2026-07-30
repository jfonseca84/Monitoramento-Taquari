import React from 'react';
import { City } from '../types';
import { Database, RefreshCw, Cpu, Navigation, Gauge } from 'lucide-react';

interface TechnicalDataProps {
  selectedCity: City;
}

export const TechnicalData: React.FC<TechnicalDataProps> = ({ selectedCity }) => {
  return (
    <div className="bg-[#0F172A]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4">
        DADOS TÉCNICOS
      </h3>

      <div className="flex flex-col gap-3 text-xs">
        {/* FONTE DE DADOS */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fonte de Dados</span>
          </div>
          <span className="font-semibold text-white">Comitê Taquari-Antas</span>
        </div>

        {/* FREQUENCIA DE ATUALIZACAO */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Frequência de Atualização</span>
          </div>
          <span className="font-semibold text-white">A cada 15 minutos</span>
        </div>

        {/* PRECISAO DO SENSOR */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Precisão do Sensor</span>
          </div>
          <span className="font-mono font-semibold text-white">± 1 cm</span>
        </div>

        {/* COORDENADAS DA ESTACAO */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coordenadas da Estação</span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-white">
            {selectedCity.latitude}° S {Math.abs(selectedCity.longitude)}° O
          </span>
        </div>

        {/* SENSOR */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sensor</span>
          </div>
          <span className="font-semibold text-white">Radar Hidrométrico</span>
        </div>
      </div>
    </div>
  );
};
