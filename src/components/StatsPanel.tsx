import React, { useState } from 'react';
import { City } from '../types';
import { getCityThresholds } from '../data/initialData';
import { Link as LinkIcon, Check, MessageSquare, AlertTriangle } from 'lucide-react';
import { StatusDot } from './StatusDot';

interface StatsPanelProps {
  selectedCity: City;
  onOpenDetailModal?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ selectedCity, onOpenDetailModal }) => {
  const [copied, setCopied] = useState(false);

  const thresholds = getCityThresholds(selectedCity.slug || selectedCity.id, selectedCity.flood_level);

  const normalVal = Number(selectedCity?.normal_level) || thresholds.normal;
  const attentionVal = Number(selectedCity?.attention_level) || thresholds.attention;
  const alertVal = Number(selectedCity?.alert_level) || thresholds.alert;
  const floodVal = Number(selectedCity?.flood_level) || thresholds.flood;

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
      
      {/* COTA DE INUNDAÇÃO CARD */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
              COTAS DE NÍVEL
            </h3>
          </div>
          <span className="text-[10px] text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
            {selectedCity.name}
          </span>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          {/* NÍVEL NORMAL */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">Nível normal</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {normalVal.toFixed(2).replace('.', ',')} m
            </span>
          </div>

          {/* COTA ATENÇÃO */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">Cota atenção</span>
            </div>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {attentionVal.toFixed(2).replace('.', ',')} m
            </span>
          </div>

          {/* COTA ALERTA */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="text-slate-300 font-medium">Cota alerta</span>
            </div>
            <span className="font-mono font-bold text-orange-400 text-sm">
              {alertVal.toFixed(2).replace('.', ',')} m
            </span>
          </div>

          {/* COTA INUNDAÇÃO */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-2">
              <StatusDot status="inundacao" size="md" />
              <span className="text-slate-200 font-bold">Cota inundação</span>
            </div>
            <span className="font-mono font-extrabold text-red-400 text-base">
              {floodVal.toFixed(2).replace('.', ',')} m
            </span>
          </div>
        </div>
      </div>

      {/* SHARE CARD */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-3.5">
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
