import React from 'react';
import { City } from '../types';
import { calculateStatusLevel, getCityThresholds } from '../data/initialData';
import { ChevronRight, Radio } from 'lucide-react';

interface SituationBannerProps {
  cities: City[];
  onOpenSituationModal: (city?: City) => void;
}

export const SituationBanner: React.FC<SituationBannerProps> = ({
  cities,
  onOpenSituationModal
}) => {
  if (!cities || cities.length === 0) return null;

  // Evaluate risk level for each city with double confirmation rule
  const cityStatuses = cities.map(city => {
    const thresholds = getCityThresholds(city);
    const status = calculateStatusLevel(
      city.current_level || 0,
      thresholds,
      city.trend,
      city.rate_of_change
    );
    return { city, status, thresholds };
  });

  // Global banner visual state
  const hasFloodRisk = cityStatuses.some(item => item.status === 'inundacao');
  const hasAlertRisk = !hasFloodRisk && cityStatuses.some(item => item.status === 'alerta' || item.status === 'atencao');

  // Find highest risk city for opening details on modal click
  const sortedByRisk = [...cityStatuses].sort((a, b) => {
    const weights = { inundacao: 4, alerta: 3, atencao: 2, normal: 1 };
    return weights[b.status] - weights[a.status];
  });
  const primaryCity = sortedByRisk[0]?.city || cities[0];

  // Group cities by Hydrographic Basin for organized ticker presentation
  const taquariCities = cities.filter(
    c => c.basin === 'taquari' || c.river?.toLowerCase().includes('taquari')
  );
  const guaibaCities = cities.filter(
    c => c.basin === 'guaiba' || (!c.basin && !c.river?.toLowerCase().includes('taquari'))
  );

  // Format trend symbol and rate of change for ticker items
  const formatCityTickerText = (city: City) => {
    const levelStr = (city.current_level || 0).toFixed(2).replace('.', ',');
    let trendIcon = '→';
    if (city.trend === 'subindo') trendIcon = '↑';
    if (city.trend === 'descendo') trendIcon = '↓';

    let rateText = 'estável';
    if (typeof city.rate_of_change === 'number' && Math.abs(city.rate_of_change) > 0) {
      const cmVal = Number((city.rate_of_change * 100).toFixed(1));
      const formattedCm = Math.abs(cmVal).toString().replace('.0', '').replace('.', ',');
      rateText = `${cmVal > 0 ? '+' : cmVal < 0 ? '-' : ''}${formattedCm}cm/h`;
    }

    return `${city.name.toUpperCase()} ${levelStr}m ${trendIcon} ${rateText}`;
  };

  // Color schemes: Deep navy with clean border and straight corners
  let bannerBgClass = 'bg-[#040C1C] border-y border-cyan-500/40 text-cyan-100 shadow-sm';
  let badgeBgClass = 'bg-[#081832] text-cyan-300 border border-cyan-500/50 font-bold';

  if (hasFloodRisk) {
    bannerBgClass = 'bg-[#040C1C] border-y border-red-500/50 text-red-100 shadow-sm';
    badgeBgClass = 'bg-[#1F080A] text-red-200 border border-red-500/60 font-bold';
  } else if (hasAlertRisk) {
    bannerBgClass = 'bg-[#040C1C] border-y border-amber-500/50 text-amber-100 shadow-sm';
    badgeBgClass = 'bg-[#1E1404] text-amber-200 border border-amber-500/60 font-bold';
  }

  // Render group helper
  const renderBasinGroup = (basinTitle: string, groupCities: City[]) => (
    <div className="inline-flex items-center gap-3 shrink-0">
      <span className="px-2 py-0.5 rounded-none bg-[#081832] border border-cyan-500/60 text-cyan-300 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 shrink-0">
        {basinTitle}
      </span>
      {groupCities.map(city => {
        const thresholds = getCityThresholds(city);
        const cStatus = calculateStatusLevel(
          city.current_level || 0,
          thresholds,
          city.trend,
          city.rate_of_change
        );

        let statusDotColor = 'bg-emerald-400';
        if (cStatus === 'inundacao') statusDotColor = 'bg-red-500 animate-ping';
        else if (cStatus === 'alerta' || cStatus === 'atencao') statusDotColor = 'bg-amber-400';

        return (
          <span key={city.id} className="inline-flex items-center gap-1.5 shrink-0 hover:text-white transition-colors">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
            <span className="font-mono font-semibold text-cyan-200 text-[11px]">{formatCityTickerText(city)}</span>
            <span className="text-cyan-800 ml-1">|</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div
      onClick={() => onOpenSituationModal(primaryCity)}
      className={`transition-all duration-300 cursor-pointer select-none relative z-30 ${bannerBgClass}`}
    >
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-1">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* LEFT: PAINEL ACTION BUTTON */}
          <div className="flex items-center shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSituationModal(primaryCity);
              }}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-none bg-[#081832] hover:bg-cyan-950 active:scale-95 transition-all text-cyan-300 border border-cyan-500/60 shadow-xs cursor-pointer"
            >
              <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>Painel</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* CENTER: SLOW ELEGANT TICKER GROUPED BY HYDROGRAPHIC BASINS */}
          <div className="w-full md:flex-1 overflow-hidden relative group py-0.5 px-1">
            <div className="whitespace-nowrap flex items-center gap-5 animate-marquee group-hover:[animation-play-state:paused] text-[10px] sm:text-[11px] font-mono leading-none">
              {/* First pass */}
              {renderBasinGroup("RIO TAQUARI", taquariCities)}
              {renderBasinGroup("BACIA DO GUAÍBA", guaibaCities)}
              
              {/* Second pass for seamless loop */}
              {renderBasinGroup("RIO TAQUARI", taquariCities)}
              {renderBasinGroup("BACIA DO GUAÍBA", guaibaCities)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
