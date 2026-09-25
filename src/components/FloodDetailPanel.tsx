import React from 'react';
import { CloudRain, Clock, Gauge, Info, Mountain, Timer, TrendingUp, Waves, LucideIcon } from 'lucide-react';
import { City } from '../types';
import { HistoricalFloodEvent } from '../data/historicalFloodsData';
import { STATUS_COLORS, formatLevel, isValidNumber } from './homeTheme';

// Painel sempre no inverso do tema (tema escuro = painel branco; tema claro = painel cinza escuro).
// As cores vêm das variáveis --hm-inv-* (index.css)
const MUTED = 'text-[var(--hm-inv-muted)]';

interface FloodDetailPanelProps {
  city: City;
  events: HistoricalFloodEvent[];
  selectedId: string | null;
}

const num = (v: number, digits = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const Item: React.FC<{ Icon: LucideIcon; label: string; value: string; sub?: string }> = ({ Icon, label, value, sub }) => (
  <div className="rounded-xl border border-[var(--hm-inv-line)] bg-[var(--hm-inv-card)] px-3 py-2.5 min-w-0">
    <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${MUTED}`}>
      <Icon className="w-3 h-3 shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </div>
    <div className="text-[15px] font-extrabold leading-tight mt-1">{value}</div>
    {sub && <div className={`text-[11px] ${MUTED} mt-0.5 leading-snug`}>{sub}</div>}
  </div>
);

// Painel da esquerda da aba Histórico: todos os dados catalogados da enchente selecionada no gráfico
export const FloodDetailPanel: React.FC<FloodDetailPanelProps> = ({ city, events, selectedId }) => {
  const shell = (children: React.ReactNode) => (
    <aside
      aria-label="Detalhes da enchente selecionada"
      className="w-full lg:h-full min-h-0 overflow-y-auto thin-y-scrollbar bg-[var(--hm-inv-bg)] text-[var(--hm-inv-text)] px-5 py-6 flex flex-col gap-5"
    >
      {children}
    </aside>
  );

  if (events.length === 0) {
    return shell(
      <>
        <div>
          <div className="text-sm font-light">Detalhes da</div>
          <div className="text-[22px] font-extrabold leading-tight">Enchente</div>
        </div>
        <div className={`rounded-xl border border-[var(--hm-inv-line)] bg-[var(--hm-inv-card)] px-4 py-6 text-sm leading-relaxed ${MUTED}`}>
          Ainda não há histórico de enchentes cadastrado para{' '}
          <span className="text-[var(--hm-inv-text)] font-semibold notranslate" translate="no">{city.name}</span>. Quando houver, clique em uma barra do gráfico para ver aqui todos os dados de cada cheia.
        </div>
      </>
    );
  }

  const ranked = [...events].sort((a, b) => b.maxLevel - a.maxLevel);
  const record = ranked[0];
  const event = events.find((e) => e.id === selectedId) || record;
  const rank = ranked.findIndex((e) => e.id === event.id) + 1;

  const floodCota = Number(city.flood_level);
  const aboveCota = isFinite(floodCota) && floodCota > 0 ? event.maxLevel - floodCota : null;
  const belowRecord = record.maxLevel - event.maxLevel;
  const current = Number(city.current_level);
  const currentPct = isValidNumber(current) && event.maxLevel > 0 ? Math.min((current / event.maxLevel) * 100, 100) : null;

  const timeline = [
    { label: 'Início', value: event.startDateTime },
    { label: 'Pico', value: event.peakDateTime, strong: true },
    { label: 'Fim', value: event.endDateTime }
  ];

  return shell(
    <>
      {/* Título */}
      <div>
        <div className="text-sm font-light">Detalhes da enchente</div>
        <div className="text-[28px] font-extrabold leading-tight">{event.monthYear}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {event.isRecord && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-[3px] bg-[#D9483B] text-white">RECORDE</span>}
          {event.is1941Cheia && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-[3px] bg-[#E9C145] text-[#3A2E05]">CHEIA DE 1941</span>}
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-[3px] bg-[var(--hm-inv-chip)] text-[var(--hm-inv-soft)]">
            {rank}ª MAIOR DE {events.length}
          </span>
        </div>
      </div>

      {/* Nível máximo */}
      <div className="rounded-2xl border border-[var(--hm-inv-line)] bg-[var(--hm-inv-card)] px-4 py-4">
        <div className={`text-[10px] font-extrabold uppercase tracking-wide ${MUTED}`}>Nível máximo (pico)</div>
        <div className="text-[40px] font-extrabold leading-none mt-1">{formatLevel(event.maxLevel)} <span className="text-lg font-light">m</span></div>
        <div className="mt-2 flex flex-col gap-0.5 text-xs">
          {aboveCota !== null && (
            <span style={{ color: aboveCota >= 0 ? 'var(--hm-inv-red)' : undefined }} className={aboveCota >= 0 ? 'font-semibold' : MUTED}>
              {aboveCota >= 0
                ? `${formatLevel(aboveCota)} m acima da cota de inundação (${formatLevel(floodCota)} m)`
                : `${formatLevel(Math.abs(aboveCota))} m abaixo da cota de inundação (${formatLevel(floodCota)} m)`}
            </span>
          )}
          {event.id !== record.id && <span className={MUTED}>{formatLevel(belowRecord)} m abaixo do recorde ({record.monthYear})</span>}
        </div>
      </div>

      {/* Linha do tempo */}
      <div>
        <div className={`text-[10px] font-extrabold uppercase tracking-wide ${MUTED} mb-2`}>Linha do tempo</div>
        <ol className="relative flex flex-col gap-3 pl-5 border-l border-[var(--hm-inv-line)] ml-1.5">
          {timeline.map((t) => (
            <li key={t.label} className="relative">
              <span
                className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                style={{ backgroundColor: t.strong ? STATUS_COLORS.inundacao : '#4F9BD0' }}
              />
              <div className={`text-[11px] ${MUTED}`}>{t.label}</div>
              <div className={`text-sm ${t.strong ? 'font-extrabold' : 'font-semibold'}`}>{t.value}</div>
            </li>
          ))}
        </ol>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-2.5">
        <Item Icon={Timer} label="Duração" value={event.durationFormatted} sub={`${num(event.durationDays, 1)} dias`} />
        <Item Icon={Gauge} label="Nível médio" value={`${formatLevel(event.avgLevel)} m`} />
        <Item Icon={Mountain} label="Elevação total" value={`${formatLevel(event.totalElevation)} m`} sub="do início ao pico" />
        <Item Icon={Waves} label="Vazão média" value={`${num(event.avgFlowM3s)} m³/s`} />
        <Item Icon={TrendingUp} label="Volume" value={`${num(event.volumeDischargedBillionM3, 2)} bi m³`} sub="escoado no evento" />
        <Item Icon={CloudRain} label="Chuva acumulada" value={`${num(event.accumulatedRainMm, 1)} mm`} sub={event.accumulatedRainPeriod} />
        <div className="col-span-2">
          <Item Icon={Clock} label="Maior chuva em 24 h" value={`${num(event.maxRain24hMm, 1)} mm`} sub={event.maxRain24hDate} />
        </div>
      </div>

      {/* Comparação com o nível atual */}
      {currentPct !== null && (
        <div className="rounded-xl border border-[var(--hm-inv-line)] bg-[var(--hm-inv-card)] px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wide ${MUTED}`}>Nível atual</span>
            <span className="text-sm font-extrabold">{formatLevel(current)} m</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--hm-inv-track)] mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-[#4F9BD0]" style={{ width: `${currentPct}%` }} />
          </div>
          <div className={`text-[11px] ${MUTED} mt-1.5`}>{num(currentPct)}% do pico desta enchente</div>
        </div>
      )}

      {/* Descrição */}
      {event.description && (
        <div>
          <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${MUTED} mb-1.5`}>
            <Info className="w-3 h-3" strokeWidth={2} />
            Sobre o evento
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--hm-inv-soft)]">{event.description}</p>
        </div>
      )}

      <div className={`text-[11px] ${MUTED} pt-3 border-t border-[var(--hm-inv-line)]`}>
        Estação {event.stationName} · {event.riverName}. Dados catalogados no sistema.
      </div>
    </>
  );
};
