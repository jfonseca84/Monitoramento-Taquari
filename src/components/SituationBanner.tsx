import React, { useState } from 'react';
import { City } from '../types';
import { calculateStatusLevel, getCityThresholds } from '../data/initialData';
import { getBrasiliaTimeString } from '../lib/dateUtils';
import { AlertTriangle, ShieldAlert, CheckCircle2, Activity, ChevronRight, Waves, Radio } from 'lucide-react';

interface SituationBannerProps {
  cities: City[];
  onOpenSituationModal: (city?: City) => void;
}

export const SituationBanner: React.FC<SituationBannerProps> = ({
  cities,
  onOpenSituationModal
}) => {
  if (!cities || cities.length === 0) return null;

  // Calculate criticality for each city and sort (most critical first)
  const statusWeight = { inundacao: 4, alerta: 3, atencao: 2, normal: 1 };

  const sortedCities = [...cities].sort((a, b) => {
    const threshA = getCityThresholds(a);
    const threshB = getCityThresholds(b);
    const statusA = calculateStatusLevel(a.current_level || 0, threshA);
    const statusB = calculateStatusLevel(b.current_level || 0, threshB);
    const weightA = statusWeight[statusA] || 1;
    const weightB = statusWeight[statusB] || 1;

    if (weightB !== weightA) return weightB - weightA;
    return (b.current_level || 0) - (a.current_level || 0);
  });

  const topCity = sortedCities[0];
  const topThresholds = getCityThresholds(topCity);
  const overallStatus = calculateStatusLevel(topCity.current_level || 0, topThresholds);

  // Determine Banner Visual Mode based on overall highest risk
  const isFloodRisk = overallStatus === 'inundacao';
  const isAlert = overallStatus === 'alerta' || overallStatus === 'atencao';

  // Format trend symbol and rate text
  const formatCityTickerText = (city: City) => {
    const levelStr = (city.current_level || 0).toFixed(2).replace('.', ',');
    let trendIcon = '→';
    if (city.trend === 'subindo') trendIcon = '↑';
    if (city.trend === 'descendo') trendIcon = '↓';

    let rateText = 'estável';
    if (city.rate_of_change && Math.abs(city.rate_of_change) > 0) {
      const cmPerHour = Math.round(city.rate_of_change * 100);
      rateText = `${cmPerHour > 0 ? '+' : ''}${cmPerHour}cm/h`;
    }

    return `${city.name.toUpperCase()} ${levelStr}m ${trendIcon} ${rateText}`;
  };

  // Build primary top bar message
  let primaryMessage = '';
  const topLevelFormatted = (topCity.current_level || 0).toFixed(2).replace('.', ',');
  const lastUpdatedFormatted = getBrasiliaTimeString(topCity.updated_at || topCity.last_updated);

  if (isFloodRisk) {
    primaryMessage = `RISCO DE INUNDAÇÃO | ${topCity.name}: ${topLevelFormatted} m | Cota de inundação atingida!`;
  } else if (isAlert) {
    const quotaLabel = topCity.current_level && topCity.current_level >= topThresholds.alert ? 'cota de alerta' : 'cota de atenção';
    primaryMessage = `ALERTA | ${topCity.name}: ${topLevelFormatted} m | Acima da ${quotaLabel} | Monitoramento ativo`;
  } else {
    primaryMessage = `SITUAÇÃO NORMAL | Rio Taquari - ${topCity.name}: ${topLevelFormatted} m | Atualizado às ${lastUpdatedFormatted}`;
  }

  // Color schemes
  let bannerBgClass = 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200';
  let badgeBgClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let pulseGlow = '';

  if (isFloodRisk) {
    bannerBgClass = 'bg-red-950/95 border-red-600 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.5)]';
    badgeBgClass = 'bg-red-600 text-white animate-pulse border-red-400 font-black';
    pulseGlow = 'animate-pulse';
  } else if (isAlert) {
    bannerBgClass = 'bg-amber-950/90 border-amber-600 text-amber-100';
    badgeBgClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  }

  return (
    <div
      onClick={() => onOpenSituationModal(topCity)}
      className={`border-b transition-all duration-300 cursor-pointer select-none relative z-30 ${bannerBgClass}`}
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-1">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          
          {/* LEFT: STATUS BADGE ONLY (COMPACT & SLIM) */}
          <div className="flex items-center shrink-0">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold uppercase tracking-wide shrink-0 ${badgeBgClass}`}>
              {isFloodRisk ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-white shrink-0 animate-bounce" />
                  <span>CRÍTICO</span>
                </>
              ) : isAlert ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                  <span>ALERTA</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>NORMAL</span>
                </>
              )}
            </div>
          </div>

          {/* CENTER: SLOW ELEGANT TICKER STRIP OF CITIES (SORTED BY CRITICALITY) */}
          <div className="w-full md:flex-1 overflow-hidden relative group py-0.5 px-2 bg-black/20 rounded-md border border-white/5">
            <div className="whitespace-nowrap flex items-center gap-6 animate-marquee group-hover:[animation-play-state:paused] text-[11px] sm:text-xs font-mono">
              {/* Duplicate array to create seamless loop */}
              {[...sortedCities, ...sortedCities].map((city, idx) => {
                const cThresh = getCityThresholds(city);
                const cStatus = calculateStatusLevel(city.current_level || 0, cThresh);
                let statusDotColor = 'bg-emerald-400';
                if (cStatus === 'inundacao') statusDotColor = 'bg-red-500 animate-ping';
                else if (cStatus === 'alerta' || cStatus === 'atencao') statusDotColor = 'bg-amber-400';

                return (
                  <span key={`${city.id}-${idx}`} className="inline-flex items-center gap-1.5 shrink-0 hover:text-white transition-colors">
                    <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
                    <span className="font-sans font-bold text-slate-200">{formatCityTickerText(city)}</span>
                    <span className="text-slate-600 ml-2">|</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* RIGHT: INTERACTIVE PAINEL CALL TO ACTION BUTTON */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSituationModal(topCity);
              }}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10 shadow-xs"
            >
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Painel de Situação</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
