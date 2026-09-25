import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, PhoneCall, Clock } from 'lucide-react';
import { Sponsor } from '../types';
import { fetchSponsors } from '../lib/supabase';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';
import { useSiteSettings } from '../context/SiteSettingsContext';

const LOGOS_PER_VIEW_DESKTOP = 5;
const LOGOS_PER_VIEW_MOBILE = 3; // celular: 3 por vez, em tamanho maior
const LOGO_SLOTS = 20;
const LOGO_INTERVAL_MS = 3000;

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const { settings } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const LOGOS_PER_VIEW = isMobile ? LOGOS_PER_VIEW_MOBILE : LOGOS_PER_VIEW_DESKTOP;

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

  // Somente patrocinadores ativos reais (com logo ou nome)
  const activeSponsors = sponsors.filter(s => s.active && (s.logo_url || s.name));

  // Carrossel: 20 espaços (5 por vez); os que não têm parceiro ativo mostram "LOGO"
  const slotCount = Math.max(LOGO_SLOTS, activeSponsors.length);
  const slots: (Sponsor | null)[] = Array.from({ length: slotCount }, (_, i) => activeSponsors[i] || null);
  const canRotate = slots.length > LOGOS_PER_VIEW;
  const loopSlots = canRotate ? [...slots, ...slots] : slots;
  const pageCount = Math.ceil(slots.length / LOGOS_PER_VIEW);

  const [logoIdx, setLogoIdx] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);
  const [paused, setPaused] = useState(false);

  // Avança 1 posição a cada 3 s (pausa no hover)
  useEffect(() => {
    if (!canRotate || paused) return;
    const timer = setInterval(() => {
      setSkipTransition(false);
      setLogoIdx((i) => i + 1);
    }, LOGO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [canRotate, paused, logoIdx]);

  // Laço contínuo: ao chegar na cópia da lista, volta ao início sem animação
  useEffect(() => {
    if (!canRotate || logoIdx < slots.length) return;
    const t = setTimeout(() => {
      setSkipTransition(true);
      setLogoIdx(0);
    }, 650);
    return () => clearTimeout(t);
  }, [canRotate, logoIdx, slots.length]);

  const currentPage = Math.floor((logoIdx % Math.max(slots.length, 1)) / LOGOS_PER_VIEW);

  const renderSlot = (sponsor: Sponsor | null, idx: number) => {
    const key = `${sponsor?.id || 'slot'}-${idx}`;
    const boxClass = 'aspect-square max-w-[150px] mx-auto rounded-[10px] border border-[var(--hm-line)] flex items-center justify-center overflow-hidden';

    if (sponsor && sponsor.logo_url) {
      const content = (
        <div className={`${boxClass} bg-white p-3`}>
          <img
            src={sponsor.logo_url}
            alt={sponsor.name || `Patrocinador ${idx + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
      return (
        <div key={key} className="shrink-0 px-1.5" style={{ flexBasis: `${100 / LOGOS_PER_VIEW}%` }} title={sponsor.name}>
          {sponsor.website ? (
            <a
              href={sponsor.website.startsWith('http') ? sponsor.website : `https://${sponsor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#7CC3E6]"
            >
              {content}
            </a>
          ) : content}
        </div>
      );
    }

    return (
      <div key={key} className="shrink-0 px-1.5" style={{ flexBasis: `${100 / LOGOS_PER_VIEW}%` }}>
        <div className={`${boxClass} bg-[var(--hm-a)] select-none`}>
          <span className="text-xs font-bold tracking-[0.08em] uppercase text-[var(--hm-muted)]">
            {sponsor?.name ? sponsor.name.substring(0, 10) : 'LOGO'}
          </span>
        </div>
      </div>
    );
  };

  const iconBox = 'shrink-0 w-[34px] h-[34px] rounded-lg flex items-center justify-center bg-[var(--hm-chip)] border border-[var(--hm-line)] text-[var(--hm-accent)]';

  return (
    <footer className={`bg-[var(--hm-b)] text-[var(--hm-text)] pt-11 pb-7 px-5 sm:pr-9 sm:pl-[clamp(24px,5vw,86px)] transition-colors font-[family-name:Figtree,system-ui,sans-serif] ${className}`}>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-8 min-w-0">

        {/* 1. MENSAGEM DE AGRADECIMENTO E APRESENTAÇÃO INSTITUCIONAL (TOPO DO RODAPÉ) */}
        <p className="m-0 px-[22px] py-[18px] rounded-[10px] bg-[var(--hm-a)] border border-[var(--hm-line)] text-[13px] leading-[1.6] text-[var(--hm-soft)] text-center">
          A plataforma Nível Rio Taquari realiza o acompanhamento dos níveis dos rios da Bacia Taquari-Antas, com foco no Rio Taquari e seus principais afluentes (como os rios das Antas, Guaporé, Forqueta, Fão, Carreiro e Prata), oferecendo informações em tempo real e prevenção para o Vale do Taquari. Este projeto existe graças às empresas que acreditam na informação de qualidade e na proteção da população regional.
        </p>

        {/* 2. EMPRESAS PARCEIRAS (CARROSSEL) */}
        {slots.length > 0 && (
          <div className="flex flex-col gap-[18px] min-w-0">
            <div className="flex items-center gap-4">
              <span className="flex-1 h-px bg-[var(--hm-line)]" />
              <h3 className="text-xs font-extrabold tracking-[0.1em] whitespace-nowrap">EMPRESAS PARCEIRAS DO PROJETO</h3>
              <span className="flex-1 h-px bg-[var(--hm-line)]" />
            </div>

            <div
              className="overflow-hidden min-w-0"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(-${(logoIdx * 100) / LOGOS_PER_VIEW}%)`,
                  transition: skipTransition ? 'none' : 'transform .6s ease'
                }}
              >
                {loopSlots.map((s, i) => renderSlot(s, i))}
              </div>
            </div>

            {pageCount > 1 && (
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: pageCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Página ${i + 1} de parceiros`}
                    onClick={() => {
                      setSkipTransition(false);
                      setLogoIdx(i * LOGOS_PER_VIEW);
                    }}
                    className="h-1.5 rounded-[3px] cursor-pointer transition-[width] duration-300"
                    style={{
                      width: i === currentPage ? 22 : 6,
                      backgroundColor: i === currentPage ? 'var(--hm-accent)' : 'var(--hm-line)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. INFORMAÇÕES INSTITUCIONAIS (ABAIXO DOS PATROCINADORES) */}
        <div className="pt-8 border-t border-[var(--hm-line)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* COL 1: SITE OFICIAL DE MONITORAMENTO */}
            <div className="flex items-start gap-3.5">
              <div className={iconBox}>
                <ShieldCheck className="w-[17px] h-[17px]" />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] mb-1">
                  {settings.site_name || 'SITE OFICIAL DE MONITORAMENTO'}
                </h4>
                <p className="text-xs leading-snug">
                  {settings.site_subtitle || 'Plataforma de Monitoramento Hidrológico'}
                </p>
                <p className="text-xs text-[var(--hm-accent)] mt-0.5">
                  {settings.site_description || 'Vale do Taquari - RS'}
                </p>
              </div>
            </div>

            {/* COL 2: FONTES OFICIAIS */}
            <div className="flex items-start gap-3.5">
              <div className={iconBox}>
                <Building2 className="w-[17px] h-[17px]" />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] mb-1">
                  FONTES OFICIAIS
                </h4>
                <p className="text-xs leading-[1.6] text-[var(--hm-soft)]">
                  Defesa Civil Estadual, Prefeituras Municipais, Rede de Sensores Automáticos do CPRM/ANA | SGB Bacia Rio Taquari | Projeto Guerreiros do Humaitá Nível dos Rios | Nível Guaíba.
                </p>
              </div>
            </div>

            {/* COL 3: ÚLTIMA ATUALIZAÇÃO */}
            <div className="flex items-start gap-3.5">
              <div className={iconBox}>
                <Clock className="w-[17px] h-[17px]" />
              </div>
              <div>
                <h4 className="text-[13px] font-extrabold uppercase tracking-[0.06em] mb-1">
                  ÚLTIMA ATUALIZAÇÃO
                </h4>
                <p className="text-xs font-mono font-semibold">
                  {formattedDate} - {formattedTime}
                </p>
                <p className="text-xs text-[var(--hm-accent)] mt-0.5">
                  Sistema PWA • Monitoramento Contínuo
                </p>
              </div>
            </div>

          </div>

          {/* EM CASO DE EMERGÊNCIA LIGUE: faixa de rodapé, centralizada */}
          <div className="mt-7 pt-6 border-t border-[var(--hm-line)] flex flex-col items-center text-center gap-1.5">
            <div className="flex items-center gap-2 text-[var(--hm-accent)]">
              <PhoneCall className="w-[15px] h-[15px]" />
              <h4 className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--hm-text)]">
                Em caso de emergência ligue
              </h4>
            </div>
            <p className="text-[13px] font-extrabold text-[var(--hm-warn)] flex items-center gap-1.5 whitespace-nowrap">
              <span>Defesa Civil 199</span>
              <span>•</span>
              <span>Bombeiros 193</span>
            </p>
          </div>
        </div>

        {/* 4. RODAPÉ INFERIOR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--hm-muted)] pt-[18px] border-t border-[var(--hm-line)]">
          <p>© {year} {settings.site_name || 'Sistema de Monitoramento Hidrológico'}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3.5">
            <a href="#sobre" className="text-[var(--hm-soft)] hover:text-[var(--hm-text)] hover:underline transition-colors">Termos de Uso</a>
            <span>•</span>
            <a href="#sobre" className="text-[var(--hm-soft)] hover:text-[var(--hm-text)] hover:underline transition-colors">Privacidade</a>
            <span>•</span>
            <a href="#contato" className="text-[var(--hm-soft)] hover:text-[var(--hm-text)] hover:underline transition-colors">Imprensa</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
