import React, { useState, useEffect } from 'react';
import { City } from '../types';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';
import { fetchCityHistory } from '../lib/supabase';
import { getCityThresholds } from '../data/cityThresholds';
import {
  STATUS_COLORS,
  STATUS_INK,
  STATUS_LABELS,
  SURFACE_A,
  SURFACE_B,
  LINE,
  MUTED,
  SECTION_PAD,
  formatLevel,
  isValidNumber
} from './homeTheme';

interface LiveCameraHeroProps {
  selectedCity: City;
  onOpenCameraModal: () => void;
  onOpenInfoModal: () => void;
  onOpenDetailModal?: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Cabeçalho da cidade, nível atual (hero) e cotas de referência da página Início.
// A câmera ao vivo segue desativada (onOpenCameraModal é mantido na interface).
export const LiveCameraHero: React.FC<LiveCameraHeroProps> = ({ selectedCity }) => {
  // Máxima no dia: maior leitura real das últimas 24 h (histórico do banco)
  const [maxToday, setMaxToday] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setMaxToday(null);
    fetchCityHistory(selectedCity.id, '24h')
      .then((points) => {
        if (!isMounted) return;
        const cutoff = Date.now() - DAY_MS;
        const levels = (points || [])
          .filter((p: any) => {
            const t = new Date(p?.timestamp).getTime();
            return !isNaN(t) && t >= cutoff;
          })
          .map((p: any) => Number(p?.level))
          .filter(isValidNumber);
        setMaxToday(levels.length > 0 ? Math.max(...levels) : null);
      })
      .catch(() => {
        if (isMounted) setMaxToday(null);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCity.id, selectedCity.last_updated]);

  const thresholds = getCityThresholds(selectedCity);
  const status = selectedCity.status_level;

  const riverName = selectedCity.river || '--';

  // Tendência: seta pela direção informada + taxa de variação em m/h com sinal
  const rate = selectedCity.rate_of_change;
  const isUp = selectedCity.trend === 'subindo';
  const isDown = selectedCity.trend === 'descendo';
  const trendArrow = isUp ? '▲' : isDown ? '▼' : '■';
  const trendColor = isUp ? '#F2A65A' : isDown ? '#7DCB9A' : '#FFFFFF';
  const rateStr = isValidNumber(rate) ? `${rate > 0 ? '+' : ''}${formatLevel(rate)} m/h` : '-- m/h';

  // Horário da leitura em Brasília; sem data válida mostra "--"
  // (updated_at traz o recorded_at bruto; last_updated já vem formatado como texto)
  const rawDate = [selectedCity.updated_at, selectedCity.last_updated].find(
    (d) => !!d && !isNaN(new Date(d).getTime())
  );
  const hasValidDate = !!rawDate;
  // Leitura de hoje mostra só a hora (como no modelo); de outro dia, inclui a data
  const isToday = hasValidDate && getBrasiliaDateString(rawDate) === getBrasiliaDateString();
  const readingLabel = hasValidDate
    ? isToday
      ? `das ${getBrasiliaTimeString(rawDate)}`
      : `de ${getBrasiliaDateString(rawDate)} às ${getBrasiliaTimeString(rawDate)}`
    : '--';

  const quotas = [
    { label: 'Cota normal', value: thresholds.attention, prefix: 'até ', color: STATUS_COLORS.normal },
    { label: 'Cota de Atenção', value: thresholds.attention, prefix: '', color: STATUS_COLORS.atencao },
    { label: 'Cota de Alerta', value: thresholds.alert, prefix: '', color: STATUS_COLORS.alerta },
    { label: 'Cota de Inundação', value: thresholds.flood, prefix: '', color: STATUS_COLORS.inundacao },
    { label: 'Máxima no dia', value: maxToday, prefix: '', color: '#FFFFFF' }
  ];

  return (
    <div className="flex flex-col">
      {/* a) CABEÇALHO DA CIDADE */}
      <div className={`${SURFACE_A} ${LINE} border-b flex items-center gap-5 sm:gap-7 py-5 sm:py-[26px] px-5 sm:px-9`}>
        <span aria-hidden="true" className="relative w-[26px] h-[26px] border-4 border-white rounded-full shrink-0">
          <span className="absolute w-1 h-3 bg-white -left-1.5 -bottom-[11px] rotate-45 rounded-sm" />
        </span>
        <span aria-hidden="true" className="w-px h-12 bg-[#4A535E] shrink-0" />
        <h1 className="m-0 text-[32px] sm:text-[50px] font-black tracking-[-0.03em] leading-[1.15] truncate notranslate" translate="no">
          {selectedCity.name}, RS
        </h1>
      </div>

      {/* b) NÍVEL ATUAL (HERO) */}
      <section className={`${SURFACE_A} ${SECTION_PAD} pt-10 sm:pt-14 pb-12 sm:pb-16 flex flex-col gap-[30px]`}>
        <div className="text-lg font-light text-[#D6D9DD]">
          Nível do <strong className="font-extrabold text-white notranslate" translate="no">{riverName}</strong>
        </div>

        <div className="flex items-start leading-[0.8]">
          <span className="text-[clamp(88px,13vw,240px)] font-black tracking-[-0.06em]">
            {formatLevel(selectedCity.current_level)}
          </span>
          <span className="text-[clamp(40px,5vw,80px)] font-extrabold ml-2.5 mt-1.5">m</span>
        </div>

        <div className="flex max-w-[440px] w-full">
          <div
            className="flex-1 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.03em] rounded-l-[4px]"
            style={
              status
                ? { backgroundColor: STATUS_COLORS[status], color: STATUS_INK[status] }
                : { backgroundColor: '#4A535E', color: '#FFFFFF' }
            }
          >
            {status ? STATUS_LABELS[status] : '--'}
          </div>
          <div
            className="flex-1 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.03em] rounded-r-[4px] bg-[#3F4955] whitespace-nowrap"
            style={{ color: trendColor }}
          >
            {trendArrow} {rateStr}
          </div>
        </div>

        <div className={`text-[13px] ${MUTED}`}>
          Fonte: {selectedCity.source_origin || '--'} — leitura {readingLabel}
        </div>
      </section>

      {/* c) COTAS DE REFERÊNCIA */}
      <section className={`${SURFACE_B} ${SECTION_PAD} py-[22px] flex flex-col gap-3.5`}>
        <div className="text-sm font-light">
          Cotas de referência em <strong className="font-extrabold notranslate" translate="no">{selectedCity.name}</strong>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-5">
          {quotas.map((q) => (
            <div key={q.label} className="flex flex-col gap-0.5 border-l-[3px] pl-3" style={{ borderLeftColor: q.color }}>
              <span className="text-xs font-semibold text-[#C4C8CD] whitespace-nowrap">{q.label}</span>
              <span className="text-xl font-extrabold tracking-[-0.02em] whitespace-nowrap">
                {isValidNumber(q.value) ? `${q.prefix}${formatLevel(q.value)} m` : '--'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
