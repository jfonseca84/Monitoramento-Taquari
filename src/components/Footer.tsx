import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, PhoneCall, Clock } from 'lucide-react';
import { Sponsor } from '../types';
import { fetchSponsors } from '../lib/supabase';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';

export const Footer: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const loadSponsors = async () => {
    try {
      const data = await fetchSponsors(false); // Only active sponsors
      setSponsors(data);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
    }
  };

  useEffect(() => {
    loadSponsors();

    const handleSponsorsUpdate = () => {
      loadSponsors();
    };

    window.addEventListener('sponsors_updated', handleSponsorsUpdate);
    return () => {
      window.removeEventListener('sponsors_updated', handleSponsorsUpdate);
    };
  }, []);

  // Format live timestamp in Horário de Brasília
  const formattedDate = getBrasiliaDateString();
  const formattedTime = getBrasiliaTimeString();
  const year = new Date().getFullYear();


  // Build grid items up to 20 slots
  // Filter active sponsors that have a valid logo or name
  const activeSponsors = sponsors.filter(s => s.active && (s.logo_url || s.name));
  
  // Construct 20 grid slots
  const gridSlots: (Sponsor | null)[] = Array.from({ length: 20 }, (_, index) => {
    return activeSponsors[index] || null;
  });

  return (
    <footer className="mt-12 bg-[#050B18] border-t border-[#122347] text-slate-300 pt-8 pb-8 px-4 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* 1. MENSAGEM DE AGRADECIMENTO (TOPO DO RODAPÉ) */}
        <div className="w-full rounded-2xl border border-[#1D3A73] bg-[#0A1836]/90 py-4 px-6 text-center text-xs sm:text-sm font-semibold text-slate-200 shadow-inner">
          Este projeto existe graças às empresas que acreditam na informação de qualidade e na proteção da população do Vale do Taquari.
        </div>

        {/* 2. ÁREA DOS PATROCINADORES */}
        <div className="pt-2">
          {/* TITLE WITH HORIZONTAL LINES */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-[#182C54] flex-1" />
            <h3 className="text-xs sm:text-sm font-black text-slate-300 tracking-wider uppercase whitespace-nowrap">
              EMPRESAS PATROCINADORAS
            </h3>
            <div className="h-px bg-[#182C54] flex-1" />
          </div>

          {/* RESPONSIVE GRID FOR 20 SPONSORS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
            {gridSlots.map((sponsor, idx) => {
              const key = sponsor?.id || `slot-${idx}`;
              
              if (sponsor && sponsor.logo_url) {
                const CardContent = (
                  <div className="w-full h-16 sm:h-20 rounded-xl bg-[#0A1633]/90 hover:bg-[#10224A] border border-[#1A315F]/60 hover:border-cyan-500/50 p-2 flex items-center justify-center transition-all duration-300 group shadow-sm hover:shadow-cyan-950/30 transform hover:-translate-y-0.5">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name || `Patrocinador ${idx + 1}`}
                      className="max-h-[50px] max-w-[85%] object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                );

                if (sponsor.website) {
                  return (
                    <a
                      key={key}
                      href={sponsor.website.startsWith('http') ? sponsor.website : `https://${sponsor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={sponsor.name}
                      className="block focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-xl"
                    >
                      {CardContent}
                    </a>
                  );
                }

                return (
                  <div key={key} title={sponsor.name}>
                    {CardContent}
                  </div>
                );
              }

              // Placeholder for empty slot
              return (
                <div
                  key={key}
                  className="w-full h-16 sm:h-20 rounded-xl bg-[#09132A]/80 border border-[#13254A]/50 p-2 flex items-center justify-center text-center select-none"
                >
                  <span className="text-[11px] sm:text-xs font-black text-slate-600/70 tracking-widest uppercase">
                    {sponsor?.name ? sponsor.name.substring(0, 10) : 'LOGO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. INFORMAÇÕES INSTITUCIONAIS (ABAIXO DOS PATROCINADORES) */}
        <div className="pt-10 sm:pt-12 border-t border-[#122347]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            
            {/* COL 1: SITE OFICIAL DE MONITORAMENTO */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#0D1E3F] border border-[#1D3B73] text-[#38BDF8] shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
                  SITE OFICIAL DE MONITORAMENTO
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-tight">
                  Plataforma institucional do Rio Taquari
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vale do Taquari - Lajeado - RS
                </p>
              </div>
            </div>

            {/* COL 2: FONTES OFICIAIS */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#0D1E3F] border border-[#1D3B73] text-[#38BDF8] shrink-0 shadow-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
                  FONTES OFICIAIS
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Defesa Civil Estadual, Prefeituras Municipais e rede de sensores automáticos do CPRM/ANA.
                </p>
              </div>
            </div>

            {/* COL 3: EM CASO DE EMERGÊNCIA LIGUE */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#0D1E3F] border border-[#1D3B73] text-[#38BDF8] shrink-0 shadow-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
                  EM CASO DE EMERGÊNCIA LIGUE
                </h4>
                <p className="text-xs sm:text-sm font-bold text-amber-400 mt-1 flex flex-wrap items-center gap-1.5">
                  <span>Defesa Civil 199</span>
                  <span className="text-slate-400">•</span>
                  <span>Bombeiros 193</span>
                </p>
              </div>
            </div>

            {/* COL 4: ÚLTIMA ATUALIZAÇÃO */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#0D1E3F] border border-[#1D3B73] text-[#38BDF8] shrink-0 shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
                  ÚLTIMA ATUALIZAÇÃO
                </h4>
                <p className="text-xs text-slate-200 font-mono font-bold">
                  {formattedDate} - {formattedTime}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sistema PWA • Monitoramento Contínuo
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 4. RODAPÉ INFERIOR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-4 border-t border-[#122347]">
          <p>© {year} Sistema de Monitoramento Hidrológico do Rio Taquari. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <a href="#sobre" className="hover:text-slate-200 transition-colors">Termos de Uso</a>
            <span>•</span>
            <a href="#sobre" className="hover:text-slate-200 transition-colors">Privacidade</a>
            <span>•</span>
            <a href="#contato" className="hover:text-slate-200 transition-colors">Imprensa</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
