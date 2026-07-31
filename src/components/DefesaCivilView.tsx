import React from 'react';
import { Shield, PhoneCall, AlertTriangle, LifeBuoy, MapPin, CheckCircle } from 'lucide-react';

export const DefesaCivilView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-600 dark:text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white text-slate-900">
              Defesa Civil e Proteção Comunitária
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-600">
              Orientações, telefones de emergência e rotas de segurança do Vale do Taquari.
            </p>
          </div>
        </div>
      </div>

      {/* EMERGENCY PHONES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/80 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">DEFESA CIVIL REGIONAL</p>
            <p className="text-3xl font-extrabold font-mono mt-1">199</p>
          </div>
          <PhoneCall className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-gradient-to-br from-red-950/60 to-slate-900 border border-red-800/80 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">CORPO DE BOMBEIROS</p>
            <p className="text-3xl font-extrabold font-mono mt-1">193</p>
          </div>
          <LifeBuoy className="w-8 h-8 text-red-400 opacity-80" />
        </div>

        <div className="bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-800/80 rounded-2xl p-5 text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">BRIGADA MILITAR</p>
            <p className="text-3xl font-extrabold font-mono mt-1">190</p>
          </div>
          <Shield className="w-8 h-8 text-sky-400 opacity-80" />
        </div>
      </div>

      {/* GUIDELINES */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 transition-colors">
        <h3 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Procedimentos de Segurança Durante Elevação da Cota</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs dark:text-slate-300 text-slate-700">
          <div className="dark:bg-[#182238] bg-slate-50 p-4 rounded-2xl dark:border-slate-800 border-slate-200 border space-y-2">
            <h4 className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Antes da Inundação
            </h4>
            <p className="dark:text-slate-400 text-slate-600 leading-relaxed">
              Mantenha medicamentos essenciais e documentos em bolsas impermeáveis. Desconecte aparelhos elétricos da tomada.
            </p>
          </div>

          <div className="dark:bg-[#182238] bg-slate-50 p-4 rounded-2xl dark:border-slate-800 border-slate-200 border space-y-2">
            <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Durante o Alerta
            </h4>
            <p className="dark:text-slate-400 text-slate-600 leading-relaxed">
              Não tente atravessar ruas ou pontes submersas. Siga rigorosamente as orientações dos agentes no local.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
