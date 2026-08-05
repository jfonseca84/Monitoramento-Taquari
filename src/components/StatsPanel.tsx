import React, { useState } from 'react';
import { City } from '../types';
import { getCityThresholds } from '../data/cityThresholds';
import { Link as LinkIcon, Check, MessageSquare, AlertTriangle, Bell, ShieldAlert } from 'lucide-react';
import { StatusDot } from './StatusDot';

interface StatsPanelProps {
  selectedCity: City;
  onOpenDetailModal?: () => void;
  onOpenAlertSignup?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  selectedCity,
  onOpenDetailModal,
  onOpenAlertSignup
}) => {
  const [copied, setCopied] = useState(false);

  const thresholds = getCityThresholds(selectedCity);

  const normalVal = thresholds.normal;
  const attentionVal = thresholds.attention;
  const alertVal = thresholds.alert;
  const floodVal = thresholds.flood;

  const currentLevelVal = Number(selectedCity?.current_level) || 3.12;
  const currentLevelStr = currentLevelVal.toFixed(2).replace('.', ',');

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌊 Rio Taquari em ${selectedCity.name}: Nível Atual ${currentLevelStr} m (${selectedCity.status_level?.toUpperCase()}). Acompanhe no Portal de Monitoramento: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Nível do Rio em ${selectedCity.name}: ${currentLevelStr} m. Monitoramento em tempo real:`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5 shrink-0">

      {/* BOTÃO SUBTIL 'CADASTRO DE ALERTA PARA ÁREAS DE RISCO' */}
      <button
        type="button"
        onClick={onOpenAlertSignup}
        className="w-full bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/40 hover:border-cyan-400 py-2.5 px-3 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer text-[10px] sm:text-[11px] font-bold uppercase tracking-normal group shadow-sm text-center leading-tight"
      >
        <ShieldAlert className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
        <span>CADASTRO DE ALERTA PARA ÁREAS DE RISCO</span>
      </button>

      {/* SHARE CARD */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-5 shadow-xl transition-colors">
        <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase mb-3.5">
          COMPARTILHAR NÍVEL ATUAL
        </h3>

        <div className="grid grid-cols-4 gap-2.5">
          {/* WHATSAPP */}
          <button
            onClick={handleShareWhatsApp}
            title="Compartilhar no WhatsApp"
            className="flex items-center justify-center p-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
          </button>

          {/* FACEBOOK */}
          <button
            onClick={handleShareFacebook}
            title="Compartilhar no Facebook"
            className="flex items-center justify-center p-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] border border-[#1877F2]/40 transition-all hover:scale-105"
          >
            <span className="font-bold text-sm">f</span>
          </button>

          {/* TWITTER */}
          <button
            onClick={handleShareTwitter}
            title="Compartilhar no Twitter / X"
            className="flex items-center justify-center p-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 transition-all hover:scale-105"
          >
            <span className="font-bold text-sm">X</span>
          </button>

          {/* COPY LINK */}
          <button
            onClick={handleCopyLink}
            title="Copiar Link"
            className={`flex items-center justify-center p-3 rounded-xl border transition-all hover:scale-105 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </button>
        </div>

        {copied && (
          <p className="text-[11px] text-emerald-400 text-center mt-2 animate-fade-in font-medium">
            ✓ Link copiado para a área de transferência!
          </p>
        )}
      </div>

    </div>
  );
};
