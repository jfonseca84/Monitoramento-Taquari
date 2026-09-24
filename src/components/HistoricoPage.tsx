import React, { useEffect, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { City, LevelStatus } from '../types';
import { HISTORICAL_FLOODS_BY_CITY } from '../data/historicalFloodsData';
import { FloodHistoryChart } from './FloodHistoryChart';
import {
  MUTED,
  SECTION_PAD,
  STATUS_COLORS,
  STATUS_INK,
  STATUS_LABELS,
  SURFACE_A,
  SURFACE_B,
  formatLevel
} from './homeTheme';

interface HistoricoPageProps {
  selectedCity: City;
  selectedFloodId?: string | null;
  onSelectFlood?: (id: string) => void;
  lastUpdatedText?: string;
}

interface Reading {
  recorded_at: string;
  level: number;
  trend?: string | null;
  rate_of_change?: number | null;
  station?: string | null;
}

interface ReadingsPayload {
  from: string;
  to: string;
  truncated: boolean;
  rows: Reading[];
}

const TZ = 'America/Sao_Paulo';
const PAGE_SIZE = 50;

// "AAAA-MM-DD" no horário de Brasília
const brDay = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: TZ });

const fmtDateTime = (iso: string) =>
  new Date(iso)
    .toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .replace(', ', ' ');

const fmtRate = (rate?: number | null) => {
  if (rate === null || rate === undefined || !isFinite(Number(rate))) return '--';
  const r = Number(rate);
  return `${r > 0 ? '+' : ''}${r.toFixed(2).replace('.', ',')} m/h`;
};

const fmtTrend = (trend?: string | null) => {
  if (trend === 'subindo') return 'Subindo';
  if (trend === 'descendo') return 'Descendo';
  return 'Estável';
};

const CARD = 'rounded-2xl border border-[#3A434E] bg-[#222931]';
const CARD_B = 'rounded-2xl border border-[#3A434E] bg-[#2B333D]';
const LABEL = `block text-xs font-semibold ${MUTED} mb-1.5`;

export const HistoricoPage: React.FC<HistoricoPageProps> = ({ selectedCity, selectedFloodId = null, onSelectFlood, lastUpdatedText }) => {
  const today = brDay(new Date());
  const [startDate, setStartDate] = useState(() => brDay(new Date(Date.now() - 7 * 86400000)));
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<Reading[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  // Chave (cidade + período) a que as leituras em tela pertencem: evita mostrar dados da cidade anterior
  const [loadedKey, setLoadedKey] = useState('');
  const key = `${selectedCity.id}|${startDate}|${endDate}`;

  const rangeInvalid = !startDate || !endDate || startDate > endDate;

  useEffect(() => {
    if (rangeInvalid) return;
    let alive = true;
    setState('loading');
    setVisible(PAGE_SIZE);
    fetch(`/api/history/readings?cityId=${encodeURIComponent(selectedCity.id)}&from=${startDate}&to=${endDate}`)
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error || `HTTP ${r.status}`);
        return body as ReadingsPayload;
      })
      .then((data) => {
        if (!alive) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
        setLoadedKey(`${selectedCity.id}|${startDate}|${endDate}`);
        setTruncated(Boolean(data.truncated));
        setState('ok');
      })
      .catch((e) => {
        if (!alive) return;
        setErrorMsg(e?.message || '');
        setState('error');
      });
    return () => {
      alive = false;
    };
  }, [selectedCity.id, startDate, endDate, rangeInvalid]);

  const ready = state === 'ok' && loadedKey === key;

  const statusOf = (level: number): LevelStatus => {
    const flood = Number(selectedCity.flood_level);
    const alert = Number(selectedCity.alert_level);
    const attention = Number(selectedCity.attention_level);
    if (flood > 0 && level >= flood) return 'inundacao';
    if (alert > 0 && level >= alert) return 'alerta';
    if (attention > 0 && level >= attention) return 'atencao';
    return 'normal';
  };

  const exportCsv = () => {
    const header = 'Data e hora (Brasília);Estação;Nível (m);Tendência;Taxa (m/h);Status';
    const lines = rows.map((r) =>
      [
        fmtDateTime(r.recorded_at),
        r.station || selectedCity.name,
        r.level.toFixed(2).replace('.', ','),
        fmtTrend(r.trend),
        r.rate_of_change !== null && r.rate_of_change !== undefined ? Number(r.rate_of_change).toFixed(3).replace('.', ',') : '',
        STATUS_LABELS[statusOf(r.level)]
      ].join(';')
    );
    const blob = new Blob([String.fromCharCode(0xfeff) + [header, ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `historico-${selectedCity.slug}-${startDate}_a_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const dateInputClass =
    'w-full bg-[#2B333D] border border-[#3A434E] rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#7CC3E6] cursor-pointer';

  return (
    <>
      {/* 1. HISTÓRICO DE ENCHENTES da cidade selecionada (primeira seção) */}
      <FloodHistoryChart
        city={selectedCity}
        events={HISTORICAL_FLOODS_BY_CITY[selectedCity.slug] ?? []}
        selectedId={selectedFloodId}
        onSelect={onSelectFlood}
        lastUpdatedText={lastUpdatedText}
      />

      {/* 2. TÍTULO, EXPORTAÇÃO E FILTROS */}
      <section className={`${SURFACE_A} ${SECTION_PAD} pt-10 sm:pt-12 pb-10 flex flex-col gap-5`}>
        <div className={`${CARD} px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4`}>
          <div>
            <span className={LABEL}>Cidade / Estação</span>
            <div
              className="w-full bg-[#2B333D] border border-[#3A434E] rounded-lg px-3.5 py-2.5 text-sm font-semibold truncate notranslate"
              translate="no"
              title="Troque a cidade pelo menu à direita"
            >
              {selectedCity.name}
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="hist-inicio">Data Inicial</label>
            <input
              id="hist-inicio"
              type="date"
              value={startDate}
              max={endDate || today}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={dateInputClass}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="hist-fim">Data Final</label>
            <input
              id="hist-fim"
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className={dateInputClass}
            />
          </div>
        </div>
      </section>

      {/* 3. REGISTROS DE TELEMETRIA */}
      <section className={`${SURFACE_B} ${SECTION_PAD} pt-10 pb-10 flex flex-col gap-4`}>
        <h3 className="text-xs font-extrabold uppercase tracking-wider">
          Registros de telemetria — <span className="notranslate" translate="no">{selectedCity.name}</span>
          {ready && ` (${rows.length} ${rows.length === 1 ? 'medição' : 'medições'})`}
        </h3>

        {rangeInvalid && <div className={`${CARD_B} py-10 text-center text-sm ${MUTED}`}>A data inicial precisa ser igual ou anterior à data final.</div>}
        {!rangeInvalid && !ready && state !== 'error' && <div className={`${CARD_B} py-10 text-center text-sm ${MUTED}`}>Carregando medições…</div>}
        {!rangeInvalid && state === 'error' && (
          <div className={`${CARD_B} py-10 text-center text-sm ${MUTED}`}>
            Não foi possível carregar o histórico{errorMsg ? ` (${errorMsg})` : ''}. Tente novamente em instantes.
          </div>
        )}
        {!rangeInvalid && ready && rows.length === 0 && (
          <div className={`${CARD_B} py-10 text-center text-sm ${MUTED}`}>Nenhuma medição de {selectedCity.name} no período escolhido.</div>
        )}

        {!rangeInvalid && ready && rows.length > 0 && (
          <div className={`${CARD_B} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className={`bg-[#222931] text-[11px] uppercase tracking-wide ${MUTED}`}>
                  <tr>
                    <th className="px-4 py-3 font-extrabold whitespace-nowrap">Data e hora (BRT)</th>
                    <th className="px-4 py-3 font-extrabold">Estação</th>
                    <th className="px-4 py-3 font-extrabold whitespace-nowrap">Nível (m)</th>
                    <th className="px-4 py-3 font-extrabold">Tendência</th>
                    <th className="px-4 py-3 font-extrabold whitespace-nowrap">Taxa (m/h)</th>
                    <th className="px-4 py-3 font-extrabold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, visible).map((r, i) => {
                    const st = statusOf(r.level);
                    return (
                      <tr key={`${r.recorded_at}-${i}`} className="border-t border-[#3A434E] hover:bg-[#222931]">
                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs">{fmtDateTime(r.recorded_at)}</td>
                        <td className="px-4 py-2.5 font-semibold notranslate" translate="no">{r.station || selectedCity.name}</td>
                        <td className="px-4 py-2.5 font-extrabold text-[#7CC3E6] whitespace-nowrap">{formatLevel(r.level)} m</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{fmtTrend(r.trend)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs">{fmtRate(r.rate_of_change)}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-extrabold"
                            style={{ backgroundColor: STATUS_COLORS[st], color: STATUS_INK[st] }}
                          >
                            {STATUS_LABELS[st]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visible < rows.length && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="w-full py-3 text-xs font-bold text-[#7CC3E6] hover:bg-[#222931] border-t border-[#3A434E] cursor-pointer"
              >
                Mostrar mais ({rows.length - visible} restantes)
              </button>
            )}
          </div>
        )}

        {ready && truncated && (
          <div className={`text-xs ${MUTED}`}>Período muito longo: mostrando as {rows.length} medições mais recentes. Reduza o intervalo para ver as demais.</div>
        )}

        {/* Título e exportação (abaixo dos registros) */}
        <div className={`${CARD_B} px-5 py-4 flex flex-wrap items-center justify-between gap-4`}>
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#7CC3E6]" />
              Histórico de Leituras Hidrológicas
            </h2>
            <p className={`text-xs ${MUTED} mt-1`}>Consulte e exporte medições oficiais arquivadas no sistema (em Horário de Brasília).</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!ready || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#35566B] hover:bg-[#42708C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Dados (CSV / Excel)
          </button>
        </div>
      </section>
    </>
  );
};
