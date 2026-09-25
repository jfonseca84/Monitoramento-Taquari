import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface InfoPopupProps {
  open: boolean;
  onClose: () => void;
  label: string;
  center?: boolean; // centraliza o conteúdo na horizontal e na vertical
  children: React.ReactNode;
}

// Pop-up do celular (< lg) para o painel da esquerda das páginas Sobre e Contato: no computador o conteúdo fica no painel;
// no celular ele abre aqui, com o botão de fechar fixo embaixo. Usa as cores do card do mapa (escuro no tema claro).
export const InfoPopup: React.FC<InfoPopupProps> = ({ open, onClose, label, center = false, children }) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // a página de trás não rola enquanto o pop-up está aberto
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{ '--hm-text': 'var(--map-text)', '--hm-soft': 'var(--map-soft)', '--hm-muted': 'var(--map-muted)', '--hm-accent': 'var(--map-edge)' } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      <div className="absolute inset-x-3 top-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] rounded-2xl bg-[var(--map-bg)] text-[var(--map-text)] shadow-2xl overflow-hidden">
        <div className="h-full overflow-y-auto overscroll-contain px-6 pt-8 pb-28">
          {center ? <div className="min-h-full flex flex-col items-center justify-center text-center">{children}</div> : children}
        </div>

        {/* Sombra em degradê: o texto que passa por trás do botão some suavemente */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--map-bg)] via-[color-mix(in_srgb,var(--map-bg)_85%,transparent)] to-transparent" />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute left-1/2 -translate-x-1/2 bottom-4 w-14 h-14 rounded-full bg-white text-black border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer"
        >
          <X className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
