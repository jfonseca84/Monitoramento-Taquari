import React from 'react';
import { Waves, Cpu, Database, Shield, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HERO */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 text-xs font-bold">
            <Waves className="w-3.5 h-3.5" />
            <span>CENTRO DE OPERAÇÕES HIDROLÓGICAS</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Portal Profissional de Monitoramento do Rio Taquari
          </h2>

          <p className="text-xs lg:text-sm text-slate-300 leading-relaxed font-sans">
            Desenvolvido para oferecer previsibilidade, segurança e transparência em tempo real para a população do Vale do Taquari. Sincronizado a cada 15 minutos com dados da rede telemétrica oficial.
          </p>
        </div>
      </div>

      {/* TECH FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#0F172A]/90 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Cpu className="w-8 h-8 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Sensores de Precisão Radar</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Medição sem contato físico por micro-ondas com margem de erro de ±1cm e amostragem contínua.
          </p>
        </div>

        <div className="bg-[#0F172A]/90 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Database className="w-8 h-8 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Sincronização Supabase</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Arquitetura desacoplada com tolerância a falhas, cache de alta performance e histórico auditável.
          </p>
        </div>

        <div className="bg-[#0F172A]/90 border border-slate-800 p-6 rounded-2xl space-y-3">
          <Shield className="w-8 h-8 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Alertas Automatizados</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Emissão direta para prefeituras e órgãos de segurança comunitária assim que o nível atinge a cota de atenção.
          </p>
        </div>
      </div>

    </div>
  );
};
