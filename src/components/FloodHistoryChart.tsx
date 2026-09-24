import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Award, BarChart3, Minus, Trophy } from 'lucide-react';
import { City } from '../types';
import { HistoricalFloodEvent } from '../data/historicalFloodsData';
import { MUTED, SECTION_PAD, STATUS_COLORS, formatLevel, isValidNumber } from './homeTheme';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';
import { levelColor } from '../lib/levelColor';

interface FloodHistoryChartProps {
  city: City;
  events: HistoricalFloodEvent[];
  /** Cheia fixada pelo clique (mostrada no painel de detalhes). */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Hora da última sincronização do site (o nível atual da cidade vem de `city` e se atualiza sozinho). */
  lastUpdatedText?: string;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const PLOT_H = 240; // altura da área das barras (px)
const SLOT_W = 38; // largura reservada para cada cheia (px): barras próximas umas das outras
const BAR_W = 14; // barras finas

const COLOR_PEAK = '#FFFFFF'; // barras comuns em branco; só 1941 (amarelo) e recorde (vermelho) têm cor
const COLOR_1941 = STATUS_COLORS.atencao;
const COLOR_RECORD = STATUS_COLORS.inundacao;

const barColor = (e: HistoricalFloodEvent) => (e.isRecord ? COLOR_RECORD : e.is1941Cheia ? COLOR_1941 : COLOR_PEAK);

// Rótulos curtos dos indicadores do cabeçalho (o nome completo fica no tooltip)
const SHORT_LABEL: Record<string, string> = {
  'Recorde histórico': 'Recorde',
  '2ª maior marca': '2ª maior',
  '3ª maior marca': '3ª maior'
};

// Passo "redondo" do eixo para ter no máximo ~6 divisões
const niceStep = (range: number) => {
  for (const s of [1, 2, 3, 5, 10, 20]) if (range / s <= 6) return s;
  return 50;
};

// Mesmo padrão de cartão do card de previsão do tempo
const CARD = 'rounded-2xl border border-[#3A434E] bg-[#2B333D]';

export const FloodHistoryChart: React.FC<FloodHistoryChartProps> = ({ city, events, selectedId = null, onSelect, lastUpdatedText }) => {
  // Da mais antiga para a mais recente (esquerda -> direita)
  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => {
        const ma = MONTHS.indexOf(a.month);
        const mb = MONTHS.indexOf(b.month);
        return a.year - b.year || ma - mb || a.id.localeCompare(b.id);
      }),
    [events]
  );

  const recordId = useMemo(() => {
    const top = [...sorted].sort((a, b) => b.maxLevel - a.maxLevel)[0];
    return top ? top.id : null;
  }, [sorted]);

  // Passar o mouse só destaca a barra; o clique fixa a cheia (painel de detalhes)
  const [hoverId, setHoverId] = useState<string | null>(null);
  useEffect(() => setHoverId(null), [city.id]);

  const renderHeader = (right?: React.ReactNode) => (
    <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-3">
        <div className="self-stretch w-px bg-[#3A434E]" />
        <div className="leading-[1.2]">
          <div className="text-sm font-light">Histórico de</div>
          <div className="text-[20px] sm:text-[22px] font-extrabold leading-[1.15]">Enchentes</div>
          <div className={`text-xs ${MUTED} mt-1 max-w-[200px]`}>
            {sorted.length > 0
              ? `${sorted.length} cheias registradas em ${city.name}.`
              : `Maiores cheias registradas em ${city.name}.`}
          </div>
        </div>
      </div>
      {right}
    </div>
  );

  const shell = (children: React.ReactNode, right?: React.ReactNode) => (
    <section className={`${SECTION_PAD} pt-7 sm:pt-8 pb-8 sm:pb-10 flex flex-col gap-4 text-white relative overflow-hidden bg-[#222931]`}>
      <svg aria-hidden className="pointer-events-none absolute -top-6 right-0 w-[70%] max-w-[900px] opacity-10" viewBox="0 0 900 160" fill="none">
        <path d="M0 110C120 40 220 150 360 90S600 10 720 70s130 20 180-30" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M0 130C130 60 240 165 380 108S620 30 740 90s120 10 160-20" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
      {renderHeader(right)}
      {children}
    </section>
  );

  // Nível atual (ao vivo): sempre da cidade selecionada
  const floodCota = Number(city.flood_level);
  const now = Number(city.current_level);
  const nowValid = isValidNumber(now);
  const trend = city.trend;
  const trendLabel = trend === 'subindo' ? 'Subindo' : trend === 'descendo' ? 'Descendo' : 'Estável';
  // Único indicador de estado colorido além da régua: subindo (vermelho), descendo (verde), estável (neutro)
  const trendColor = trend === 'subindo' ? '#E5776B' : trend === 'descendo' ? '#5FC08A' : '#D6D9DD';
  const TrendIcon = trend === 'subindo' ? ArrowUp : trend === 'descendo' ? ArrowDown : Minus;
  const rate = Number(city.rate_of_change);
  // Data e hora da última sincronização do site (o nível se atualiza junto com ela)
  const syncDate = (lastUpdatedText || '').match(/[0-9]{2}[/][0-9]{2}[/][0-9]{4}/)?.[0] || getBrasiliaDateString();
  const syncTime = (lastUpdatedText || '').match(/[0-9]{1,2}:[0-9]{2}/)?.[0] || getBrasiliaTimeString().slice(0, 5);

  // Régua: 0 na base e a cota de inundação no topo; a barra azul sobe e desce com o nível atual
  const rulerMax = isFinite(floodCota) && floodCota > 0 ? floodCota : nowValid ? Math.max(now * 1.25, 1) : 1;
  const rulerPct = nowValid ? Math.min(Math.max((now / rulerMax) * 100, 2), 100) : 0;
  // Cor da barra pelas cotas da cidade: azul (normal), amarelo (atenção), laranja (alerta), vermelho (inundação)
  const cotaAtencao = Number(city.attention_level);
  const cotaAlerta = Number(city.alert_level);
  const rulerColor = levelColor(now, { attention: cotaAtencao, alert: cotaAlerta, flood: floodCota });
  // Linha "Agora" do gráfico: mesmo estado da régua, mas verde (em vez de azul) quando normal
  const nowLineColor = levelColor(now, { attention: cotaAtencao, alert: cotaAlerta, flood: floodCota }, STATUS_COLORS.normal);
  // Marcas das cotas na própria régua (só quando a escala é a cota de inundação)
  const rulerCotas =
    isFinite(floodCota) && floodCota > 0
      ? [
          { v: cotaAtencao, color: STATUS_COLORS.atencao },
          { v: cotaAlerta, color: STATUS_COLORS.alerta },
          { v: floodCota, color: STATUS_COLORS.inundacao }
        ].filter((c) => isFinite(c.v) && c.v > 0 && c.v <= rulerMax)
      : [];
  const ruler = (
    <div
      className="shrink-0 flex items-stretch gap-1.5 h-14"
      role="img"
      aria-label={nowValid ? `Régua do nível: ${formatLevel(now)} metros` : 'Régua do nível indisponível'}
    >
      <div className="relative w-2.5 rounded-full bg-[#3A434E] overflow-hidden">
        <div
          className="absolute bottom-0 inset-x-0 rounded-full transition-[height,background-color] duration-700 ease-out"
          style={{ height: `${rulerPct}%`, backgroundColor: rulerColor }}
        />
      </div>
      <div className="relative w-3" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <span
            key={i}
            className="absolute left-0 h-px bg-[#8A9199]"
            style={{ bottom: `calc(${i * 10}% - 0.5px)`, width: i % 5 === 0 ? 12 : 6 }}
          />
        ))}
        {rulerCotas.map((c) => (
          <span
            key={c.color}
            className="absolute left-0 h-[2px] rounded-full"
            style={{ bottom: `calc(${(c.v / rulerMax) * 100}% - 1px)`, width: 12, backgroundColor: c.color }}
          />
        ))}
      </div>
    </div>
  );

  const liveBlock = (
    <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-4 bg-[#222931] rounded-t-2xl">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {ruler}
        <div className="leading-tight">
          <div className="text-xs font-extrabold uppercase tracking-wide text-[#B4B9BF] mb-1 notranslate" translate="no">{city.name}</div>
          <div className="text-[34px] sm:text-[44px] font-extrabold leading-none whitespace-nowrap" aria-live="polite">{nowValid ? formatLevel(now) : '--'} m</div>
          <div className="text-xs sm:text-sm text-[#B4B9BF] mt-1">
            <span className="block sm:inline">{syncDate}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">Atualizado às {syncTime}</span>
          </div>
        </div>
      </div>
      <div className="text-right leading-tight shrink-0">
        <div className="text-base sm:text-lg font-extrabold inline-flex items-center justify-end gap-1.5" style={{ color: trendColor }}>
          <TrendIcon className="w-4 h-4" strokeWidth={2.6} />
          {trendLabel}
        </div>
        {trend && isFinite(rate) && city.rate_of_change !== undefined && (
          <div className="text-xs text-[#B4B9BF] mt-0.5">{rate > 0 ? '+' : ''}{rate.toFixed(2).replace('.', ',')} m/h</div>
        )}
      </div>
    </div>
  );

  if (sorted.length === 0) {
    return shell(
      <div className={`relative ${CARD}`}>
        {liveBlock}
        <div className="h-px bg-[#3A434E]" />
        <div className={`bg-[#222931] rounded-b-2xl px-5 py-8 text-center text-sm ${MUTED}`}>
          Ainda não há histórico de enchentes cadastrado para{' '}
          <span className="text-white font-semibold notranslate" translate="no">{city.name}</span>. Os registros aparecem aqui assim que forem incluídos.
        </div>
      </div>
    );
  }

  const levels = sorted.map((e) => e.maxLevel);
  const max = Math.max(...levels);
  const min = Math.min(...levels);
  const step = niceStep(Math.max(max - min, 1) * 2.5);
  const axisMin = Math.max(0, Math.floor((min - (max - min) * 1.5) / step) * step);
  const axisMax = Math.ceil((max + 0.5) / step) * step;
  const ticks: number[] = [];
  for (let v = axisMin; v <= axisMax + 1e-9; v += step) ticks.push(v);
  const pct = (v: number) => ((v - axisMin) / (axisMax - axisMin)) * 100;

  const ranked = [...sorted].sort((a, b) => b.maxLevel - a.maxLevel);
  const average = levels.reduce((s, v) => s + v, 0) / levels.length;
  const marks = [
    { label: 'Recorde histórico', event: ranked[0], Icon: Trophy, tint: '#FFFFFF' },
    { label: '2ª maior marca', event: ranked[1], Icon: Award, tint: '#FFFFFF' },
    { label: '3ª maior marca', event: ranked[2], Icon: Award, tint: '#FFFFFF' }
  ].filter((m) => m.event);

  const showCota = isFinite(floodCota) && floodCota > axisMin && floodCota < axisMax;
  const pinned = sorted.find((e) => e.id === selectedId) || sorted.find((e) => e.id === recordId) || sorted[0];
  const active = sorted.find((e) => e.id === hoverId) || pinned;

  const showNow = nowValid && now > axisMin && now < axisMax;

  const onKey = (e: React.KeyboardEvent) => {
    const i = sorted.findIndex((x) => x.id === active.id);
    if (e.key === 'ArrowRight' && i < sorted.length - 1) { setHoverId(null); onSelect?.(sorted[i + 1].id); }
    else if (e.key === 'ArrowLeft' && i > 0) { setHoverId(null); onSelect?.(sorted[i - 1].id); }
    else return;
    e.preventDefault();
  };

  // Indicadores compactos (uma linha), à direita do título
  const chipItems = [
    ...marks.map(({ label, event, Icon, tint }) => ({ full: label, label: SHORT_LABEL[label] || label, Icon, tint, value: formatLevel(event.maxLevel), sub: event.monthYear })),
    { full: 'Média das cheias', label: 'Média', Icon: BarChart3, tint: '#FFFFFF', value: formatLevel(average), sub: 'pico médio' }
  ];
  // Os 4 indicadores ficam sempre em UMA linha, separados por uma linha fina (no celular ocupam a largura toda, em fonte pequena;
  // a partir de sm ficam ao lado do título)
  const chipsRow = (
    <div className="relative w-full sm:w-auto flex items-stretch sm:items-center sm:gap-x-2.5">
      {chipItems.map(({ full, label, Icon, tint, value, sub }, i) => (
        <div
          key={full}
          title={full}
          className={`leading-tight whitespace-nowrap min-w-0 flex-1 sm:flex-none px-2 sm:px-0 ${
            i === 0 ? 'pl-0' : 'border-l border-[#3A434E] sm:pl-2.5'
          } ${i === chipItems.length - 1 ? 'pr-0' : ''}`}
        >
          <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: tint }}>
            <Icon className="hidden sm:block w-3 h-3 shrink-0" strokeWidth={2} />
            {label}
          </div>
          <div>
            <span className="text-[15px] font-extrabold tracking-[-0.02em]">{value}</span>
            <span className="text-[10px] text-[#B4B9BF] ml-0.5 sm:ml-1">m</span>
            <span className="block sm:inline text-[10px] text-[#B4B9BF] sm:ml-1">
              <span className="hidden sm:inline">· </span>
              {sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return shell(
    <>
      {/* Resumo da cheia selecionada + gráfico de barras */}
      <div className={`relative ${CARD}`}>
        {liveBlock}

        <div className="h-px bg-[#3A434E]" />

        <div className="flex bg-[#222931] rounded-b-2xl pr-2 pb-3">
          {/* Eixo Y (fixo) */}
          <div className="relative shrink-0 w-11 mt-6" style={{ height: PLOT_H }} aria-hidden="true">
            {ticks.map((v) => (
              <span key={v} className={`absolute right-2 text-[11px] leading-none ${MUTED}`} style={{ bottom: `${pct(v)}%`, transform: 'translateY(50%)' }}>
                {formatLevel(v, 2)}
              </span>
            ))}
          </div>

          {/* Área rolável: mais antigas à esquerda, mais recentes à direita */}
          <div
            className="flex-1 min-w-0 overflow-x-auto pb-3 mt-6 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-[#2B333D] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D6D9DD] [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{ scrollbarColor: '#D6D9DD #2B333D', scrollbarWidth: 'thin' }}
            role="tablist"
            aria-label={`Maiores cheias de ${city.name}, das mais antigas para as mais recentes`}
            onKeyDown={onKey}
            onMouseLeave={() => setHoverId(null)}
          >
            <div className="relative" style={{ width: sorted.length * SLOT_W, minWidth: '100%' }}>
              <div className="relative" style={{ height: PLOT_H }}>
                {ticks.map((v) => (
                  <div key={v} className="absolute inset-x-0 border-t border-dashed border-[#3A434E]" style={{ bottom: `${pct(v)}%` }} />
                ))}
                {showCota && (
                  <div className="absolute inset-x-0 border-t border-dashed z-[1]" style={{ bottom: `${pct(floodCota)}%`, borderColor: COLOR_RECORD, opacity: 0.9 }}>
                    <span className="absolute left-1 -top-4 text-[10px] font-extrabold" style={{ color: COLOR_RECORD, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
                      Cota de inundação {formatLevel(floodCota)} m
                    </span>
                  </div>
                )}
                {showNow && (
                  <div className="absolute inset-x-0 border-t border-dashed z-[1]" style={{ bottom: `${pct(now)}%`, borderColor: nowLineColor, opacity: 0.95 }}>
                    <span className="absolute left-1 -top-4 text-[10px] font-extrabold" style={{ color: nowLineColor, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>Agora {formatLevel(now)} m</span>
                  </div>
                )}
                <div className="relative flex h-full items-end">
                  {sorted.map((e) => {
                    const h = Math.max((pct(e.maxLevel) / 100) * PLOT_H, 4);
                    const on = e.id === active.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        tabIndex={on ? 0 : -1}
                        onMouseEnter={() => setHoverId(e.id)}
                        onFocus={() => setHoverId(e.id)}
                        onBlur={() => setHoverId(null)}
                        onClick={() => { setHoverId(null); onSelect?.(e.id); }}
                        aria-label={`${e.monthYear}: ${formatLevel(e.maxLevel)} metros`}
                        title={`${e.monthYear} · ${formatLevel(e.maxLevel)} m — clique para ver os detalhes`}
                        className={`flex flex-col items-center justify-end cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded-t-md transition-colors ${
                          on ? 'text-white' : 'text-[#B4B9BF]'
                        }`}
                        style={{ width: SLOT_W, height: '100%' }}
                      >
                        <span className={`mb-1 text-[10px] leading-none ${on ? 'font-extrabold' : 'font-semibold'}`}>{formatLevel(e.maxLevel)}</span>
                        <span className="relative block" style={{ width: BAR_W, height: h }}>
                          {on && (
                            <span
                              aria-hidden
                              className="absolute rounded-full pointer-events-none"
                              style={{ inset: '-6px -8px', backgroundColor: barColor(e), opacity: 0.22, filter: 'blur(8px)' }}
                            />
                          )}
                          <span
                            className="absolute inset-0 rounded-t-[4px] transition-[opacity,box-shadow,filter] duration-200"
                            style={{
                              backgroundColor: barColor(e),
                              opacity: on ? 1 : 0.7,
                              filter: on ? 'brightness(1.08)' : 'none',
                              boxShadow: on ? `0 0 6px 0 ${barColor(e)}66` : 'none'
                            }}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Rótulos de data */}
              <div className="flex">
                {sorted.map((e) => {
                  const on = e.id === active.id;
                  return (
                    <div
                      key={e.id}
                      className={`text-center text-[10px] leading-[1.15] pt-2 pb-1 transition-colors ${on ? 'text-white font-extrabold' : `${MUTED} font-semibold`}`}
                      style={{ width: SLOT_W }}
                      title={e.monthYear}
                    >
                      {e.month}
                      <br />
                      {e.year}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dica de interação */}
      <div className={`relative text-center text-xs ${MUTED}`}>Clique em uma barra para ver todos os dados da enchente no painel de detalhes.</div>

      {/* Legenda */}
      <div className={`relative flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs ${MUTED}`}>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: COLOR_PEAK }} />Picos históricos</span>
        {sorted.some((e) => e.is1941Cheia) && (
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: COLOR_1941 }} />Cheia 1941</span>
        )}
        {sorted.some((e) => e.isRecord) && (
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: COLOR_RECORD }} />Recorde</span>
        )}
      </div>
    </>,
    chipsRow
  );
};
