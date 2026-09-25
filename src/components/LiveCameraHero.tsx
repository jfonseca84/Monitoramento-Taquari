import React, { useState, useEffect } from 'react';
import { City } from '../types';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';
import { fetchCityHistory } from '../lib/supabase';
import { getCityThresholds } from '../data/cityThresholds';
import { CitySearchHeader } from './CitySearchHeader';
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
  isRealHistory,
  isValidNumber
} from './homeTheme';

// Foto de fundo do nível (somente Lajeado; uma foto para cada situação do rio): aproxima devagar (zoom) e vai e volta; parada com "reduzir movimento".
// Foto de fundo do hero de Lajeado por situação do rio
const LAJEADO_HERO_PHOTOS: Record<string, string> = {
  normal: '/images/hero-lajeado-normal.jpg',
  atencao: '/images/hero-lajeado-alerta.jpg',
  alerta: '/images/hero-lajeado-alerta.jpg',
  inundacao: '/images/hero-lajeado-inundacao.jpg'
};

const HeroPhoto: React.FC<{ src: string }> = ({ src }) => (
  <div className="hero-bg absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
    <img src={src} alt="" className="hero-photo-zoom absolute inset-0 w-full h-full object-cover" />
    {/* Camada escura sobre toda a foto */}
    <div className="absolute inset-0 bg-[#1B222B]/66" />
    {/* Degradê: bem escuro onde aparece o nível (esquerda), mais leve à direita, formando o fundo do card */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(31,38,46,0.98) 0%, rgba(31,38,46,0.93) 34%, rgba(31,38,46,0.71) 70%, rgba(31,38,46,0.4) 100%)' }} />
    {/* Topo em degradê da cor do cabeçalho: a foto surge de forma suave, sem uma linha marcando a divisão */}
    <div className="absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(180deg, #2B333D 0%, rgba(43,51,61,0.7) 35%, rgba(43,51,61,0) 100%)' }} />
    {/* Base escurecida para emendar com o bloco de cotas */}
    <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(180deg, rgba(43,51,61,0) 0%, rgba(43,51,61,0.9) 100%)' }} />
  </div>
);

interface LiveCameraHeroProps {
  selectedCity: City;
  onOpenCameraModal: () => void;
  onOpenInfoModal: () => void;
  onOpenDetailModal?: () => void;
  // Busca de cidades no cabeçalho
  cities?: City[];
  onSelectCity?: (city: City) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface LatestReading {
  level: number;
  recorded_at: string;
}

// Leitura gravada em river_levels que corresponde ao nível exibido, pelo endpoint de histórico
// que o worker já expõe. O painel e o histórico podem chegar em momentos diferentes (uma leitura
// nova pode já estar no histórico), então procura a leitura mais recente com o MESMO nível na tela.
// Sem o endpoint ou sem correspondência, retorna null e a tela mostra "--".
async function fetchReadingForLevel(cityId: string, currentLevel?: number): Promise<LatestReading | null> {
  if (!isValidNumber(currentLevel)) return null;
  try {
    // "v" muda a cada nova leitura para o navegador não reaproveitar uma resposta antiga do cache HTTP
    const res = await fetch(`/api/history?cityId=${encodeURIComponent(cityId)}&timeframe=6h&v=${encodeURIComponent(String(currentLevel))}`);
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const level = Number(rows[i]?.level);
      const recordedAt = rows[i]?.recorded_at;
      if (isValidNumber(level) && typeof recordedAt === 'string' && Math.abs(level - currentLevel) < 0.0005) {
        return { level, recorded_at: recordedAt };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Cabeçalho da cidade, nível atual (hero) e cotas de referência da página Início.
// A câmera ao vivo segue desativada (onOpenCameraModal é mantido na interface).
export const LiveCameraHero: React.FC<LiveCameraHeroProps> = ({ selectedCity, cities = [], onSelectCity }) => {
  // Máxima no dia: maior leitura real das últimas 24 h (histórico do banco, uma leitura por hora)
  const [maxToday, setMaxToday] = useState<number | null>(null);
  // Última medição gravada em river_levels (hora real da leitura exibida)
  const [latestReading, setLatestReading] = useState<LatestReading | null>(null);

  useEffect(() => {
    let isMounted = true;
    setMaxToday(null);
    fetchCityHistory(selectedCity.id, '24h')
      .then((points) => {
        if (!isMounted) return;
        if (!isRealHistory(points)) {
          setMaxToday(null);
          return;
        }
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
  }, [selectedCity.id, selectedCity.current_level]);

  useEffect(() => {
    let isMounted = true;
    setLatestReading(null);
    fetchReadingForLevel(selectedCity.id, selectedCity.current_level).then((reading) => {
      if (isMounted) setLatestReading(reading);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCity.id, selectedCity.current_level]);

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

  // Hora da leitura exibida: recorded_at da linha de river_levels com o mesmo nível na tela
  // (cities.updated_at é a hora da execução do worker, não a da leitura)
  const reading = latestReading;
  const readingDate = reading && !isNaN(new Date(reading.recorded_at).getTime()) ? reading.recorded_at : null;
  // Formato: "23/09/2026 • Última atualização às 06h40" (a fonte fica no rodapé)
  const readingLabel = readingDate
    ? `${getBrasiliaDateString(readingDate)} • Última atualização às ${getBrasiliaTimeString(readingDate).replace(':', 'h')}`
    : 'Última atualização: --';

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
      <CitySearchHeader selectedCity={selectedCity} cities={cities} onSelectCity={onSelectCity} />

      {/* b) NÍVEL ATUAL (HERO) */}
      <section className={`relative overflow-hidden [&>*:not(.hero-bg)]:relative [&>*:not(.hero-bg)]:z-[1] ${SURFACE_A} ${SECTION_PAD} pt-10 sm:pt-14 pb-12 sm:pb-16 [@media(max-height:820px)]:pt-6 [@media(max-height:820px)]:pb-8 flex flex-col gap-[30px] [@media(max-height:820px)]:gap-5`}>
        {selectedCity.slug === 'lajeado' && <HeroPhoto src={LAJEADO_HERO_PHOTOS[status ?? 'normal'] ?? LAJEADO_HERO_PHOTOS.normal} />}

        <div className="text-lg font-light text-[#D6D9DD]">
          Nível do <strong className="font-extrabold text-white notranslate" translate="no">{riverName}</strong>
        </div>

        <div className="flex items-start leading-[0.8]">
          <span className="text-[clamp(56px,min(22cqw,20vh),200px)] font-black tracking-[-0.06em]">
            {formatLevel(selectedCity.current_level)}
          </span>
          <span className="text-[clamp(24px,min(7.3cqw,6.6vh),68px)] font-extrabold ml-2.5 mt-1.5">m</span>
        </div>

        <div className={`flex max-w-[440px] w-full rounded-[4px] ${status === 'inundacao' ? 'flood-badge-wave' : ''}`}>
          <div
            className="flex-1 flex items-center gap-2.5 px-5 py-4 [@media(max-height:820px)]:py-3 text-sm font-extrabold uppercase tracking-[0.03em] rounded-l-[4px]"
            style={
              status
                ? { backgroundColor: STATUS_COLORS[status], color: STATUS_INK[status] }
                : { backgroundColor: '#4A535E', color: '#FFFFFF' }
            }
          >
            {status ? STATUS_LABELS[status] : '--'}
          </div>
          <div
            className="flex-1 px-5 py-4 [@media(max-height:820px)]:py-3 text-sm font-extrabold uppercase tracking-[0.03em] rounded-r-[4px] bg-[#3F4955] whitespace-nowrap"
            style={{ color: trendColor }}
          >
            {trendArrow} {rateStr}
          </div>
        </div>

        <div className={`text-[15px] ${MUTED}`}>
          {readingLabel}
        </div>
      </section>

      {/* c) COTAS DE REFERÊNCIA */}
      <section className={`${SURFACE_B} ${SECTION_PAD} py-[22px] [@media(max-height:820px)]:py-4 flex flex-col gap-3.5`}>
        <div className="text-sm font-light">
          Cotas de referência em <strong className="font-extrabold notranslate" translate="no">{selectedCity.name}</strong>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-4">
          {quotas.map((q) => (
            <div key={q.label} className="flex flex-col gap-0.5 border-l-[3px] pl-1.5 sm:pl-3 min-w-0" style={{ borderLeftColor: q.color }}>
              <span className="text-[clamp(7px,1.9cqw,12px)] font-semibold text-[#C4C8CD] whitespace-nowrap overflow-hidden text-ellipsis">{q.label}</span>
              <span className="text-[clamp(9px,2.8cqw,20px)] font-extrabold tracking-[-0.02em] whitespace-nowrap overflow-hidden text-ellipsis">
                {isValidNumber(q.value) ? `${q.prefix}${formatLevel(q.value)} m` : '--'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
