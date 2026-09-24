import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FloodDetailModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Pop-up dos detalhes da enchente para telas estreitas (< lg). Em telas largas os detalhes ficam no painel da esquerda.
export const FloodDetailModal: React.FC<FloodDetailModalProps> = ({ open, onClose, children }) => {
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
    <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Detalhes da enchente">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      {/* Janela: o conteúdo rola por dentro; o botão de fechar fica dentro dela, fixo embaixo e centralizado */}
      <div className="absolute inset-x-3 top-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="h-full overflow-y-auto overscroll-contain pb-24">{children}</div>

        {/* Sombra em degradê: o texto que passa por trás do botão some suavemente */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/85 to-transparent" />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes da enchente"
          className="absolute left-1/2 -translate-x-1/2 bottom-4 w-14 h-14 rounded-full bg-white text-black border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer"
        >
          <X className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
