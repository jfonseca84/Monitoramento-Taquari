import React from 'react';
import { Waves, Cpu, Database, Shield, CheckCircle2 } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const AboutView: React.FC = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HERO */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-8 shadow-2xl transition-colors">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full dark:bg-cyan-950/80 bg-cyan-50 text-cyan-600 dark:text-cyan-400 dark:border-cyan-800 border-cyan-200 border text-xs font-bold">
            <Waves className="w-3.5 h-3.5" />
            <span>CENTRO DE OPERAÇÕES HIDROLÓGICAS</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            Portal Profissional de {settings.site_name || 'Monitoramento Hidrológico'}
          </h2>

          <p className="text-xs lg:text-sm dark:text-slate-300 text-slate-700 leading-relaxed font-sans">
            {settings.site_subtitle || 'Desenvolvido para oferecer previsibilidade, segurança e transparência em tempo real.'} Sincronizado a cada 5 minutos com dados da rede telemétrica oficial.
          </p>
        </div>
      </div>

      {/* TECH FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 border p-6 rounded-2xl space-y-3 transition-colors">
          <Cpu className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-bold dark:text-white text-slate-900">Sensores de Precisão Radar</h3>
          <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
            Medição sem contato físico por micro-ondas com margem de erro de ±1cm e amostragem contínua.
          </p>
        </div>

        <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 border p-6 rounded-2xl space-y-3 transition-colors">
          <Database className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-bold dark:text-white text-slate-900">Sincronização Supabase</h3>
          <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
            Arquitetura desacoplada com tolerância a falhas, cache de alta performance e histórico auditável.
          </p>
        </div>

        <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 border p-6 rounded-2xl space-y-3 transition-colors">
          <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold dark:text-white text-slate-900">Alertas Automatizados</h3>
          <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
            Emissão direta para prefeituras e órgãos de segurança comunitária assim que o nível atinge a cota de atenção.
          </p>
        </div>
      </div>

    </div>
  );
};
