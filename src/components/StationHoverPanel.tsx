import React, { useEffect, useMemo, useRef, useState } from 'react';
import { City } from '../types';
import { ArrowDownRight, ArrowUpRight, Clock, Cloud, CloudDrizzle, CloudRain, CloudRainWind, Droplets, Minus, Sun } from 'lucide-react';
import { getCityThresholds } from '../data/cityThresholds';
import { HISTORICAL_FLOODS_BY_CITY } from '../data/historicalFloodsData';
import { fetchWeatherBundle } from '../lib/supabase';
import { HEADWATER_SLUGS, PROPAGATION_HOURS } from './FloodPeakProjection';
import { HOME_FONT, STATUS_COLORS, STATUS_INK, STATUS_LABELS, formatLevel } from './homeTheme';

// ---------------------------------------------------------------------------------------------
// Painel de detalhes da estação que aparece no lugar do mapa ao passar o mouse na lista de cidades.
// Fundo branco; mostra situação, nível, gráfico com faixas das cotas, indicadores e chuva prevista.
// ---------------------------------------------------------------------------------------------

interface Reading {
  recorded_at: string;
  level: number;
  station?: string | null;
}

interface Point {
  t: number;
  v: number;
}

const TZ = 'America/Sao_Paulo';
const RANGES = [
  { key: '24h', label: '24 h', hours: 24 },
  { key: '3d', label: '3 dias', hours: 72 },
  { key: '7d', label: '7 dias', hours: 168 },
  { key: '30d', label: '30 dias', hours: 720 }
] as const;
type RangeKey = (typeof RANGES)[number]['key'];

let lastRange: RangeKey = '7d';

// ---------- dados ----------
const seriesCache = new Map<string, { at: number; promise: Promise<Point[]> }>();
const SERIES_TTL_MS = 2 * 60 * 1000;

const brDay = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ms)); // AAAA-MM-DD

/** Remove leituras isoladas que destoam dos vizinhos (falhas de sensor), sem mexer em subidas e descidas reais. */
function removeSpikes(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const vs = points.map((p) => p.v);
  const range = Math.max(...vs) - Math.min(...vs);
  const thr = Math.max(0.5, range * 0.06);
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1].v;
    const cur = points[i].v;
    const next = points[i + 1].v;
    const isolated = Math.abs(cur - prev) > thr && Math.abs(cur - next) > thr && Math.abs(prev - next) < thr;
    if (!isolated) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Leituras dos últimos 30 dias (uma requisição por cidade, reaproveitada entre os períodos). */
function loadSeries(cityId: string): Promise<Point[]> {
  const hit = seriesCache.get(cityId);
  if (hit && Date.now() - hit.at < SERIES_TTL_MS) return hit.promise;
  const now = Date.now();
  const promise = fetch(`/api/history/readings?cityId=${encodeURIComponent(cityId)}&from=${brDay(now - 30 * 864e5)}&to=${brDay(now)}`)
    .then(async (r) => {
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error(`HTTP ${r.status}`);
      const body = await r.json();
      const all: Reading[] = Array.isArray(body?.rows) ? body.rows : [];
      // Leituras sem estação vêm de gravações manuais/antigas (valores falsos como 60 m ou 1,7 m): ficam de fora
      // do gráfico, desde que existam leituras suficientes com estação.
      const withStation = all.filter((r) => r.station);
      const rows = withStation.length >= 10 && withStation.length >= all.length * 0.3 ? withStation : all;
      const pts = rows
        .map((x) => ({ t: new Date(x.recorded_at).getTime(), v: Number(x.level) }))
        .filter((p) => isFinite(p.t) && isFinite(p.v))
        .sort((a, b) => a.t - b.t);
      return removeSpikes(pts);
    });
  seriesCache.set(cityId, { at: now, promise });
  promise.catch(() => seriesCache.delete(cityId));
  return promise;
}

/** Reduz para no máximo `max` pontos (média por faixa de tempo), mantendo a última leitura exata. */
function downsample(points: Point[], max: number): Point[] {
  if (points.length <= max) return points;
  const size = points.length / max;
  const out: Point[] = [];
  for (let i = 0; i < max; i++) {
    const slice = points.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    if (!slice.length) continue;
    out.push({ t: slice[Math.floor(slice.length / 2)].t, v: slice.reduce((s, p) => s + p.v, 0) / slice.length });
  }
  out[out.length - 1] = points[points.length - 1];
  return out;
}

interface DayRain {
  day: string;
  label: string;
  mm: number;
  prob: number | null;
  tmax: number | null;
  tmin: number | null;
}

interface HeadRain {
  r24: number | null;
  r72: number | null;
  f72: number | null;
  stations: number;
}

interface RainInfo {
  days: DayRain[];
  head: HeadRain | null;
}

async function loadRain(cityId: string, headwaterIds: string[]): Promise<RainInfo> {
  const bundle = await fetchWeatherBundle(cityId, headwaterIds);
  const rows = bundle?.forecast ?? [];
  const byDay = new Map<string, { mm: number; prob: number | null; tmax: number | null; tmin: number | null }>();
  for (const r of rows) {
    const t = new Date(r.forecast_for).getTime();
    if (!isFinite(t)) continue;
    const d = brDay(t);
    const cur = byDay.get(d) ?? { mm: 0, prob: null, tmax: null, tmin: null };
    cur.mm += Number(r.precipitation_mm) || 0;
    const p = r.precipitation_probability;
    if (p !== null && p !== undefined) cur.prob = Math.max(cur.prob ?? 0, Number(p));
    const tt = r.temperature_2m;
    if (tt !== null && tt !== undefined && isFinite(Number(tt))) {
      cur.tmax = cur.tmax === null ? Number(tt) : Math.max(cur.tmax, Number(tt));
      cur.tmin = cur.tmin === null ? Number(tt) : Math.min(cur.tmin, Number(tt));
    }
    byDay.set(d, cur);
  }
  const wd = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short' });
  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5)
    .map(([day, v]) => ({ day, label: wd.format(new Date(`${day}T12:00:00-03:00`)).replace('.', ''), mm: v.mm, prob: v.prob, tmax: v.tmax, tmin: v.tmin }));
  const h = bundle?.headwaters;
  return { days, head: h ? { r24: h.r24, r72: h.r72, f72: h.f72, stations: h.measured ?? h.stations ?? 0 } : null };
}

const dayIcon = (mm: number, prob: number | null) => (mm >= 20 ? CloudRainWind : mm >= 5 ? CloudRain : mm >= 0.5 || (prob ?? 0) >= 60 ? CloudDrizzle : (prob ?? 0) >= 30 ? Cloud : Sun);

// ---------- gráfico ----------
const fmtDayMonth = (ms: number) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(new Date(ms));
const fmtHour = (ms: number) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(ms));

interface Cotas {
  attention: number;
  alert: number;
  flood: number;
}

const LevelChart: React.FC<{ points: Point[]; cotas: Cotas; rangeMs: number }> = ({ points, cotas, rangeMs }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => downsample(points, 260), [points]);
  const PAD = { l: 34, r: 6, t: 10, b: 18 };

  const geo = useMemo(() => {
    if (data.length < 2 || size.w < 80 || size.h < 60) return null;
    const vs = data.map((p) => p.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const above = [cotas.attention, cotas.alert, cotas.flood].filter((c) => c > 0 && c > max).sort((a, b) => a - b)[0];
    let yMax = Math.max(max, above ?? max);
    let yMin = Math.min(min, ...[cotas.attention, cotas.alert, cotas.flood].filter((c) => c > 0 && c < min).slice(-1));
    const span = Math.max(yMax - yMin, 0.5);
    yMax += span * 0.06;
    yMin = Math.max(0, yMin - span * 0.08);
    const x0 = data[0].t;
    const x1 = data[data.length - 1].t;
    const iw = size.w - PAD.l - PAD.r;
    const ih = size.h - PAD.t - PAD.b;
    const X = (t: number) => PAD.l + ((t - x0) / Math.max(x1 - x0, 1)) * iw;
    const Y = (v: number) => PAD.t + (1 - (v - yMin) / Math.max(yMax - yMin, 0.001)) * ih;
    return { min, max, yMin, yMax, x0, x1, iw, ih, X, Y };
  }, [data, cotas, size]);

  if (!geo) return <div ref={wrapRef} className="w-full h-full" />;

  const { X, Y, yMin, yMax } = geo;
  const line = data.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const baseY = Y(yMin);
  const area = `${line} L${X(data[data.length - 1].t).toFixed(1)},${baseY} L${X(data[0].t).toFixed(1)},${baseY} Z`;

  // Faixas de fundo pelas cotas (verde → amarelo → laranja → vermelho)
  const bands: { from: number; to: number; color: string }[] = [];
  const edges = [
    { v: -Infinity, color: STATUS_COLORS.normal },
    ...(cotas.attention > 0 ? [{ v: cotas.attention, color: STATUS_COLORS.atencao }] : []),
    ...(cotas.alert > 0 ? [{ v: cotas.alert, color: STATUS_COLORS.alerta }] : []),
    ...(cotas.flood > 0 ? [{ v: cotas.flood, color: STATUS_COLORS.inundacao }] : [])
  ];
  edges.forEach((e, i) => {
    const from = Math.max(e.v, yMin);
    const to = Math.min(edges[i + 1]?.v ?? Infinity, yMax);
    if (to > from) bands.push({ from, to, color: e.color });
  });

  const cotaLines = [
    { v: cotas.attention, label: 'Atenção', color: STATUS_COLORS.atencao },
    { v: cotas.alert, label: 'Alerta', color: STATUS_COLORS.alerta },
    { v: cotas.flood, label: 'Inundação', color: STATUS_COLORS.inundacao }
  ].filter((c) => c.v > 0 && c.v >= yMin && c.v <= yMax);

  // Escala Y: marcas em valores redondos (1, 2, 5 × potência de 10)
  const rough = (yMax - yMin) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((m) => m >= rough) ?? rough;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) yTicks.push(Math.round(v * 1000) / 1000);

  // Escala X: 4 datas (ou horas, no período de 24 h)
  const xTicks = [0, 1, 2, 3].map((i) => geo.x0 + ((geo.x1 - geo.x0) * i) / 3);
  const short = rangeMs <= 36 * 3600e3;

  const last = data[data.length - 1];
  const iMin = data.reduce((m, p, i) => (p.v < data[m].v ? i : m), 0);
  const iMax = data.reduce((m, p, i) => (p.v > data[m].v ? i : m), 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    data.forEach((p, i) => {
      const d = Math.abs(X(p.t) - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? data[hover] : null;
  const tipW = 96;
  const tipX = hp ? Math.min(Math.max(X(hp.t) - tipW / 2, PAD.l), size.w - PAD.r - tipW) : 0;

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg width={size.w} height={size.h} className="block touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Gráfico do nível do rio no período">
        <defs>
          <linearGradient id="hp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B333D" stopOpacity="0.16" />
            <stop offset="1" stopColor="#2B333D" stopOpacity="0" />
          </linearGradient>
          <clipPath id="hp-clip">
            <rect x={PAD.l} y={PAD.t} width={geo.iw} height={geo.ih} />
          </clipPath>
        </defs>

        {/* faixas das cotas */}
        <g clipPath="url(#hp-clip)">
          {bands.map((b, i) => (
            <rect key={i} x={PAD.l} y={Y(b.to)} width={geo.iw} height={Math.max(Y(b.from) - Y(b.to), 0)} fill={b.color} opacity={0.1} />
          ))}
        </g>

        {/* grade e eixo Y */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={size.w - PAD.r} y1={Y(v)} y2={Y(v)} stroke="#E3E6EA" strokeWidth={1} />
            <text x={PAD.l - 5} y={Y(v) + 3} textAnchor="end" fontSize={9} fill="#7A828B">{formatLevel(v, step < 1 ? 1 : 0)}</text>
          </g>
        ))}

        {/* linhas das cotas */}
        {cotaLines.map((c) => (
          <g key={c.label}>
            <line x1={PAD.l} x2={size.w - PAD.r} y1={Y(c.v)} y2={Y(c.v)} stroke={c.color} strokeWidth={1.2} strokeDasharray="4 3" />
            <text x={size.w - PAD.r - 2} y={Y(c.v) - 3} textAnchor="end" fontSize={8.5} fontWeight={700} fill={c.color}>{c.label} {formatLevel(c.v)}</text>
          </g>
        ))}

        {/* série */}
        <path d={area} fill="url(#hp-area)" clipPath="url(#hp-clip)" />
        <path d={line} fill="none" stroke="#2B333D" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" clipPath="url(#hp-clip)" />

        {/* mínimo e máximo do período */}
        {[iMin, iMax].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <g key={i}>
            <circle cx={X(data[i].t)} cy={Y(data[i].v)} r={2.6} fill="#fff" stroke="#2B333D" strokeWidth={1.3} />
            <text x={Math.min(Math.max(X(data[i].t), PAD.l + 14), size.w - PAD.r - 14)} y={Y(data[i].v) + (i === iMax ? -6 : 12)} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#58616B">
              {i === iMax ? 'máx' : 'mín'} {formatLevel(data[i].v)}
            </text>
          </g>
        ))}

        {/* eixo X */}
        {xTicks.map((t, i) => (
          <text key={i} x={X(t)} y={size.h - 4} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} fontSize={9} fill="#7A828B">
            {short ? fmtHour(t) : fmtDayMonth(t)}
          </text>
        ))}

        {/* leitura atual */}
        <circle cx={X(last.t)} cy={Y(last.v)} r={5} fill="#2B333D" opacity={0.15} />
        <circle cx={X(last.t)} cy={Y(last.v)} r={3} fill="#2B333D" stroke="#fff" strokeWidth={1.2} />

        {/* cursor */}
        {hp && (
          <g pointerEvents="none">
            <line x1={X(hp.t)} x2={X(hp.t)} y1={PAD.t} y2={PAD.t + geo.ih} stroke="#2B333D" strokeWidth={1} opacity={0.35} />
            <circle cx={X(hp.t)} cy={Y(hp.v)} r={3.4} fill="#fff" stroke="#2B333D" strokeWidth={1.6} />
            <g transform={`translate(${tipX},${PAD.t + 2})`}>
              <rect width={tipW} height={30} rx={5} fill="#2B333D" />
              <text x={tipW / 2} y={12} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">{formatLevel(hp.v)} m</text>
              <text x={tipW / 2} y={24} textAnchor="middle" fontSize={8.5} fill="#C9CDD2">{fmtDayMonth(hp.t)} · {fmtHour(hp.t)}</text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------- gráfico (design 2: linha colorida pelo status, eixo à direita, etiqueta do nível atual) ----------
const statusAt = (v: number, c: Cotas): keyof typeof STATUS_COLORS =>
  c.flood > 0 && v >= c.flood ? 'inundacao' : c.alert > 0 && v >= c.alert ? 'alerta' : c.attention > 0 && v >= c.attention ? 'atencao' : 'normal';

// ---------- régua do gráfico: faixa e passo de cada cidade ----------
interface Ruler {
  min: number;
  max: number;
  step: number;
}

/**
 * Régua de cada cidade, a partir das cotas:
 * - passo de 2 m (cotas altas), 1 m ou 0,5 m (cotas baixas, como Porto Alegre);
 * - começa logo abaixo da cota normal e vai até cerca de 1,3× a cota de inundação (ou o recorde, se maior);
 * - abre espaço se a série ou o recorde passarem desses limites; passo dobra se as marcas ficarem apertadas.
 * Sem cotas válidas, devolve null e o gráfico usa escala automática.
 */
function rulerFor(c: Cotas, dataMin: number, dataMax: number, record: number | undefined, plotH: number): Ruler | null {
  if (!(c.flood > 0)) return null;
  let step = c.flood >= 10 ? 2 : c.flood >= 5 ? 1 : 0.5;
  const normal = c.attention > 0 ? c.attention - step : 0; // cota normal ≈ atenção − 1 passo
  let min = Math.max(0, Math.floor((normal - step * 0.5) / step) * step);
  let max = Math.ceil((Math.max(c.flood * 1.3, record ?? 0, dataMax + step)) / step) * step;
  min = Math.min(min, Math.floor(dataMin / step) * step);
  min = Math.max(0, min);
  // Marcas apertadas demais: dobra o passo (mantendo a faixa em múltiplos dele)
  while (plotH > 0 && ((max - min) / step) * 13 > plotH && step < 20) {
    step *= 2;
    min = Math.floor(min / step) * step;
    max = Math.ceil(max / step) * step;
  }
  return { min, max, step };
}

const ProChart: React.FC<{ points: Point[]; cotas: Cotas; rangeMs: number; recordMax?: number }> = ({ points, cotas, rangeMs, recordMax }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => downsample(points, 300), [points]);
  const PAD = { l: 44, r: 6, t: 12, b: 20 }; // sem margem para textos: as etiquetas ficam dentro do gráfico

  const geo = useMemo(() => {
    if (data.length < 2 || size.w < 120 || size.h < 70) return null;
    const vs = data.map((p) => p.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const cl = [cotas.attention, cotas.alert, cotas.flood].filter((c) => c > 0);
    const above = cl.filter((c) => c > max).sort((a, b) => a - b)[0];
    let yMax = Math.max(max, above ?? max);
    let yMin = Math.min(min, ...cl.filter((c) => c < min).slice(-1));
    const span = Math.max(yMax - yMin, 0.5);
    yMax += span * 0.08;
    yMin = Math.max(0, yMin - span * 0.1);
    // Régua própria de cada cidade, montada a partir das cotas dela (e do recorde, quando existe)
    const ih0 = size.h - PAD.t - PAD.b;
    const ruler = rulerFor(cotas, min, max, recordMax, ih0);
    if (ruler) {
      yMin = ruler.min;
      yMax = ruler.max;
    }
    // O eixo cobre sempre o período escolhido (ex.: 7 dias), mesmo que a estação só tenha leituras recentes
    const x1 = data[data.length - 1].t;
    const x0 = x1 - rangeMs;
    const iw = size.w - PAD.l - PAD.r;
    const ih = size.h - PAD.t - PAD.b;
    const X = (t: number) => PAD.l + ((t - x0) / Math.max(x1 - x0, 1)) * iw;
    const Y = (v: number) => PAD.t + (1 - (v - yMin) / Math.max(yMax - yMin, 0.001)) * ih;
    return { min, max, yMin, yMax, x0, x1, iw, ih, X, Y, ruler };
  }, [data, cotas, size, recordMax]);

  if (!geo) return <div ref={wrapRef} className="w-full h-full" />;
  const { X, Y, yMin, yMax } = geo;
  const plotR = size.w - PAD.r;

  const line = data.map((p, i) => `${i ? 'L' : 'M'}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const baseY = PAD.t + geo.ih;
  const area = `${line} L${X(data[data.length - 1].t).toFixed(1)},${baseY} L${X(data[0].t).toFixed(1)},${baseY} Z`;

  // Degradê vertical com paradas duras nas cotas: a linha muda de cor ao cruzar cada cota
  const VIVID = { normal: '#58A67C', atencao: '#DDB95A', alerta: '#D98F52', inundacao: '#C9584D' }; // tons neutros (o azul da água não muda)
  const COTA_COLORS = { atencao: '#FFC400', alerta: '#FF7A00', inundacao: '#F0281E' }; // linhas e nomes das cotas mantêm as cores fortes
  const y0 = PAD.t;
  const y1 = PAD.t + geo.ih;
  const off = (v: number) => Math.min(Math.max((Y(v) - y0) / (y1 - y0), 0), 1);
  const bandsTopDown = [
    ...(cotas.flood > 0 ? [{ v: cotas.flood, c: VIVID.inundacao }] : []),
    ...(cotas.alert > 0 ? [{ v: cotas.alert, c: VIVID.alerta }] : []),
    ...(cotas.attention > 0 ? [{ v: cotas.attention, c: VIVID.atencao }] : [])
  ].sort((a, b) => b.v - a.v);
  const stops: { o: number; c: string }[] = [{ o: 0, c: bandsTopDown[0]?.c ?? VIVID.normal }];
  bandsTopDown.forEach((b, i) => {
    const o = off(b.v);
    stops.push({ o, c: b.c }, { o, c: bandsTopDown[i + 1]?.c ?? VIVID.normal });
  });
  stops.push({ o: 1, c: VIVID.normal });

  // Eixo Y à direita, com valores redondos
  const rough = (yMax - yMin) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((m) => m >= rough) ?? rough;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) yTicks.push(Math.round(v * 1000) / 1000);

  if (geo.ruler) {
    yTicks.length = 0;
    const n = Math.round((geo.ruler.max - geo.ruler.min) / geo.ruler.step);
    for (let i = 0; i <= n; i++) yTicks.push(Math.round((geo.ruler.min + i * geo.ruler.step) * 1000) / 1000);
  }

  const cotaPills = [
    { v: cotas.attention, label: 'Atenção', color: COTA_COLORS.atencao },
    { v: cotas.alert, label: 'Alerta', color: COTA_COLORS.alerta },
    { v: cotas.flood, label: 'Inundação', color: COTA_COLORS.inundacao }
  ].filter((c) => c.v > 0 && c.v >= yMin && c.v <= yMax);

  const last = data[data.length - 1];
  const lastStatus = statusAt(last.v, cotas);
  const lastColor = STATUS_COLORS[lastStatus];
  const iMin = data.reduce((m, p, i) => (p.v < data[m].v ? i : m), 0);
  const iMax = data.reduce((m, p, i) => (p.v > data[m].v ? i : m), 0);

  // Eixo X: horas (24 h) ou dias
  const xTicks: { t: number; label: string }[] = [];
  if (rangeMs <= 36 * 3600e3) {
    const H6 = 6 * 3600e3;
    for (let t = Math.ceil((geo.x0 - 10800e3) / H6) * H6 + 10800e3; t <= geo.x1; t += H6) xTicks.push({ t, label: fmtHour(t) });
  } else {
    const stepD = Math.max(1, Math.ceil(rangeMs / 864e5 / 8)); // até 8 datas: 7 dias mostram todos os dias
    const firstDay = Date.parse(`${brDay(geo.x0)}T00:00:00-03:00`);
    for (let t = firstDay + 864e5; t <= geo.x1; t += 864e5 * stepD) {
      // Um dia por marca: só o número do dia (dd/mm na primeira e na virada do mês); com passo maior, sempre dd/mm
      const full = fmtDayMonth(t);
      xTicks.push({ t, label: stepD === 1 && xTicks.length > 0 && !full.startsWith('01/') ? full.slice(0, 2) : full });
    }
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) * (size.w / (r.width || size.w)); // compensa o ajuste (zoom) do painel
    let best = 0;
    let bd = Infinity;
    data.forEach((p, i) => {
      const d = Math.abs(X(p.t) - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hp = hover !== null ? data[hover] : null;
  const TW = 118;
  const TH = 50;
  const tipLeft = hp ? (X(hp.t) + TW + 12 > plotR ? X(hp.t) - TW - 10 : X(hp.t) + 10) : 0;
  const tipTop = hp ? Math.min(Math.max(Y(hp.v) - TH / 2, PAD.t), PAD.t + geo.ih - TH) : 0;
  const hpStatus = hp ? statusAt(hp.v, cotas) : 'normal';
  const diffNow = hp ? last.v - hp.v : 0;

  const pill = (y: number, text: string, fill: string, ink: string) => (
    <g transform={`translate(${plotR - 56},${y - 8})`}>
      <rect width={52} height={16} rx={4} fill={fill} />
      <text x={26} y={11.2} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={ink}>{text}</text>
    </g>
  );

  return (
    <div ref={wrapRef} className="w-full h-full">
      <svg width={size.w} height={size.h} className="block touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Gráfico do nível do rio no período">
        <defs>
          <linearGradient id="pc-line" gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={y1}>
            {stops.map((s, i) => <stop key={i} offset={s.o} stopColor={s.c} />)}
          </linearGradient>
          <linearGradient id="pc-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
          </linearGradient>
          <mask id="pc-mask"><rect x={PAD.l} y={PAD.t} width={geo.iw} height={geo.ih} fill="url(#pc-fade)" /></mask>
          <clipPath id="pc-clip"><rect x={PAD.l} y={PAD.t - 4} width={geo.iw + 2} height={geo.ih + 8} /></clipPath>
          <linearGradient id="pc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5EBBF7" stopOpacity="0.95" />
            <stop offset="1" stopColor="#1B6DB8" stopOpacity="0.98" />
          </linearGradient>
          <filter id="pc-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1B222B" floodOpacity="0.22" /></filter>
        </defs>

        {/* grade horizontal + régua preta à esquerda (marcas e números) */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={plotR} y1={Y(v)} y2={Y(v)} stroke="#EDEFF2" strokeWidth={1} />
            <line x1={PAD.l - 5} x2={PAD.l} y1={Y(v)} y2={Y(v)} stroke="#1B222B" strokeWidth={1.2} />
            <text x={PAD.l - 9} y={Y(v) + 3.2} textAnchor="end" fontSize={9.5} fontWeight={700} fill="#1B222B">{formatLevel(v, (geo.ruler ? geo.ruler.step : step) < 1 ? 1 : 0)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={baseY} stroke="#1B222B" strokeWidth={1.2} />

        {/* grade vertical nos marcos de tempo */}
        {xTicks.map((t) => (
          <line key={t.t} x1={X(t.t)} x2={X(t.t)} y1={PAD.t} y2={baseY} stroke="#F1F3F5" strokeWidth={1} />
        ))}

        {/* cotas: só o traçado (o significado de cada cor fica na legenda) */}
        {cotaPills.map((c) => (
          <line key={c.label} x1={PAD.l} x2={plotR} y1={Y(c.v)} y2={Y(c.v)} stroke={c.color} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.95} />
        ))}

        {/* área colorida pelo status, sob a curva */}
        <path d={area} fill="url(#pc-line)" mask="url(#pc-mask)" opacity={0.72} clipPath="url(#pc-clip)" />

        {/* água: azul até o nível atual, com a superfície em linha reta */}
        <g clipPath="url(#pc-clip)">
          <rect x={X(data[0].t)} y={Y(last.v)} width={Math.max(plotR - X(data[0].t), 0)} height={Math.max(baseY - Y(last.v), 0)} fill="url(#pc-water)" />
          <line x1={X(data[0].t)} x2={plotR} y1={Y(last.v)} y2={Y(last.v)} stroke="#9AD3FA" strokeWidth={1.2} />
        </g>
        <path d={line} fill="none" stroke="#fff" strokeWidth={4.4} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} clipPath="url(#pc-clip)" />
        <path d={line} fill="none" stroke="url(#pc-line)" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" clipPath="url(#pc-clip)" />

        {/* mínimo e máximo do período */}
        {[iMin, iMax].filter((v, i, a) => a.indexOf(v) === i && Math.abs(data[v].t - last.t) > 0.04 * (geo.x1 - geo.x0)).map((i) => {
          const isMax = i === iMax;
          const x = X(data[i].t);
          const anchor = x < PAD.l + 34 ? 'start' : x > plotR - 34 ? 'end' : 'middle';
          return (
            <g key={i} pointerEvents="none">
              <circle cx={x} cy={Y(data[i].v)} r={2.4} fill="#fff" stroke="#58616B" strokeWidth={1.2} />
              <text x={x} y={Y(data[i].v) + (isMax ? -7 : 13)} textAnchor={anchor} fontSize={9} fontWeight={700} fill="#58616B">
                {isMax ? 'máx' : 'mín'} {formatLevel(data[i].v)}
              </text>
            </g>
          );
        })}

        {/* aviso: estação sem leituras no começo do período */}
        {data[0].t - geo.x0 > 0.1 * rangeMs && (
          <text x={PAD.l + 8} y={PAD.t + geo.ih / 2} fontSize={9.5} fill="#8A929B" fontStyle="italic">sem leituras antes de {fmtDayMonth(data[0].t)}</text>
        )}

        {/* eixo X */}
        {xTicks.map((t) => (
          <text key={t.t} x={X(t.t)} y={size.h - 6} textAnchor="middle" fontSize={9.5} fill="#8A929B">{t.label}</text>
        ))}

        {/* nível atual: ponto com halo + etiqueta no eixo */}
        <line x1={X(last.t)} x2={plotR} y1={Y(last.v)} y2={Y(last.v)} stroke={lastColor} strokeWidth={1} opacity={0.6} />
        <circle cx={X(last.t)} cy={Y(last.v)} r={6} fill={lastColor} opacity={0.18} />
        <circle cx={X(last.t)} cy={Y(last.v)} r={3.4} fill={lastColor} stroke="#fff" strokeWidth={1.5} />
        {pill(Y(last.v) - 15, formatLevel(last.v), lastColor, STATUS_INK[lastStatus])}

        {/* legenda: o que cada cor significa (canto superior direito, um item sobre o outro) */}
        {(() => {
          const items = [
            ...(cotas.flood > 0 ? [{ label: 'Inundação', color: COTA_COLORS.inundacao, v: cotas.flood, dashed: true }] : []),
            ...(cotas.alert > 0 ? [{ label: 'Alerta', color: COTA_COLORS.alerta, v: cotas.alert, dashed: true }] : []),
            ...(cotas.attention > 0 ? [{ label: 'Atenção', color: COTA_COLORS.atencao, v: cotas.attention, dashed: true }] : []),
            { label: 'Normal', color: VIVID.normal, v: 0, dashed: false }
          ];
          const rowH = 12;
          const w = 68;
          const h = items.length * rowH + 7;
          return (
            <g transform={`translate(${plotR - w - 4},${PAD.t + 3})`} pointerEvents="none">
              <rect width={w} height={h} rx={6} fill="#fff" fillOpacity={0.94} stroke="#E3E6EA" />
              {items.map((it, i) => (
                <g key={it.label} transform={`translate(6,${8 + i * rowH})`}>
                  <line x1={0} x2={13} y1={0} y2={0} stroke={it.color} strokeWidth={it.dashed ? 1.6 : 2.4} strokeDasharray={it.dashed ? '3 2.5' : undefined} strokeLinecap="round" />
                  <text x={18} y={3.2} fontSize={9} fontWeight={700} fill="#2B333D">{it.label}</text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* cursor */}
        {hp && (
          <g pointerEvents="none">
            <line x1={X(hp.t)} x2={X(hp.t)} y1={PAD.t} y2={baseY} stroke="#2B333D" strokeWidth={1} opacity={0.3} />
            <line x1={PAD.l} x2={plotR} y1={Y(hp.v)} y2={Y(hp.v)} stroke="#2B333D" strokeWidth={1} opacity={0.18} strokeDasharray="2 3" />
            <circle cx={X(hp.t)} cy={Y(hp.v)} r={4} fill="#fff" stroke={STATUS_COLORS[hpStatus]} strokeWidth={2.2} />
            {pill(Y(hp.v), formatLevel(hp.v), '#2B333D', '#fff')}
            <g transform={`translate(${tipLeft},${tipTop})`} filter="url(#pc-shadow)">
              <rect width={TW} height={TH} rx={7} fill="#fff" stroke="#E3E6EA" />
              <circle cx={12} cy={14} r={3.5} fill={STATUS_COLORS[hpStatus]} />
              <text x={21} y={17.5} fontSize={12} fontWeight={800} fill="#2B333D">{formatLevel(hp.v)} m</text>
              <text x={10} y={31} fontSize={9} fill="#7A828B">{fmtDayMonth(hp.t)} · {fmtHour(hp.t)}</text>
              <text x={10} y={43} fontSize={9} fontWeight={700} fill={Math.abs(diffNow) < 0.005 ? '#7A828B' : diffNow > 0 ? '#C46A1C' : '#2E8B57'}>
                {Math.abs(diffNow) < 0.005 ? 'igual ao nível atual' : `agora ${diffNow > 0 ? '+' : ''}${formatLevel(diffNow)} m`}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

// ---------- leitura do rio: causas e tempo de propagação da onda ----------
const PROPAGATION_TARGETS = [
  { slug: 'lajeado', name: 'Lajeado' },
  { slug: 'cruzeirodosul', name: 'Cruzeiro do Sul' },
  { slug: 'bomretirodosul', name: 'Bom Retiro do Sul' },
  { slug: 'portoalegre', name: 'Porto Alegre' }
];

const fmtMm = (v: number | null | undefined) => (v === null || v === undefined || !isFinite(v) ? '--' : `${v.toFixed(1).replace('.', ',')} mm`);

interface Propagation {
  name: string;
  hours?: string; // ex.: "8 a 12"; ausente = sem estimativa cadastrada
}

/** Tempo típico da onda de cheia daqui até cada cidade a jusante (tabela aproximada do projeto, a partir das cabeceiras). */
function propagationFrom(slug: string): Propagation[] | null {
  const own = PROPAGATION_HOURS[slug] ?? (HEADWATER_SLUGS.includes(slug) ? ([0, 0] as [number, number]) : null);
  if (!own) return null;
  const out: Propagation[] = [];
  for (const t of PROPAGATION_TARGETS) {
    if (t.slug === slug) continue;
    const to = PROPAGATION_HOURS[t.slug];
    if (!to) {
      out.push({ name: t.name });
      continue;
    }
    if (to[1] <= own[1] && own[1] > 0) continue; // já está a montante daqui
    const lo = Math.max(1, to[0] - own[0]);
    const hi = Math.max(lo, to[1] - own[1]);
    out.push({ name: t.name, hours: lo === hi ? `${lo}` : `${lo} a ${hi}` });
  }
  return out;
}

const RiverInsights: React.FC<{ city: City; series: Point[] | null; rain: RainInfo | null }> = ({ city, series, rain }) => {
  const rate = Number(city.rate_of_change);
  const rising = city.trend === 'subindo';
  const falling = city.trend === 'descendo';

  const wave = useMemo(() => {
    if (!series || series.length < 4) return null;
    const end = series[series.length - 1];
    const week = series.filter((p) => p.t >= end.t - 7 * 864e5);
    const peak = week.reduce((m, p) => (p.v > m.v ? p : m), week[0]);
    const min = week.reduce((m, p) => (p.v < m.v ? p : m), week[0]);
    return { end, peak, min, passed: peak.t < end.t - 3 * 3600e3 && end.v < peak.v - 0.5 };
  }, [series]);

  const head = rain?.head;
  const prop = propagationFrom(city.slug);

  const lines: React.ReactNode[] = [];
  if (wave) {
    const when = `${fmtDayMonth(wave.peak.t)} às ${fmtHour(wave.peak.t)}`;
    if (wave.passed) {
      lines.push(<>Nível em <b>descida</b>: o pico da semana foi de <b>{formatLevel(wave.peak.v)} m</b> em {when} e já baixou {formatLevel(wave.peak.v - wave.end.v)} m desde então.</>);
    } else if (rising) {
      lines.push(<>Nível em <b>elevação</b>{isFinite(rate) ? <> ({rate > 0 ? '+' : ''}{(rate * 100).toFixed(1).replace('.', ',')} cm/h)</> : null}, já {formatLevel(wave.end.v - wave.min.v)} m acima da mínima da semana ({formatLevel(wave.min.v)} m).</>);
    } else if (falling) {
      lines.push(<>Nível em <b>queda lenta</b>; máxima da semana: {formatLevel(wave.peak.v)} m em {when}.</>);
    } else {
      lines.push(<>Nível <b>estável</b>; variou de {formatLevel(wave.min.v)} a {formatLevel(wave.peak.v)} m na semana.</>);
    }
  }
  if (head && (head.r24 !== null || head.r72 !== null)) {
    lines.push(
      <>
        Chuva nas cabeceiras: <b>{fmtMm(head.r24)}</b> nas últimas 24 h, <b>{fmtMm(head.r72)}</b> em 72 h; previsão de <b>{fmtMm(head.f72)}</b> nas próximas 72 h.
        {head.f72 !== null && head.f72 >= 20 ? ' Chuva prevista relevante: pode provocar nova subida.' : (head.r72 ?? 0) < 5 && !rising ? ' Sem chuva significativa: a tendência é de recessão.' : ''}
      </>
    );
  }

  return (
    <div className="shrink-0 mx-4 mb-2 py-2">
      {/* sem cartão: só os textos sobre o fundo branco; título no mesmo estilo dos demais, com a barrinha antes */}
      <div className="flex items-stretch gap-2 mb-2">
        <span className="w-[3px] rounded-full bg-[#2B333D]" />
        <div className="leading-tight">
          <div className="text-[17px] font-extrabold text-[#2B333D]">Leitura do rio</div>
          <div className="text-[12px] font-light text-[#58616B]">Situação do nível e chuva nas cabeceiras</div>
        </div>
      </div>
      {lines.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-[13.5px] leading-snug text-[#2B333D]">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : (
        <div className="text-[12.5px] text-[#7A828B]">Carregando informações do rio…</div>
      )}

      {prop && prop.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E6E8EB]">
          {/* título no mesmo estilo da Previsão do tempo, com uma barrinha antes */}
          <div className="flex items-stretch gap-2 mb-2">
            <span className="w-[3px] rounded-full bg-[#2B333D]" />
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold text-[#2B333D]">Propagação da onda de cheia</div>
              <div className="text-[12px] font-light text-[#58616B]">Tempo de chegada em</div>
            </div>
          </div>
          <div className="grid divide-x divide-[#E3E6EA]" style={{ gridTemplateColumns: `repeat(${prop.length}, minmax(0,1fr))` }}>
            {prop.map((p) => (
              <div key={p.name} className="min-w-0 px-1.5 py-2 text-center leading-tight">
                <div className="text-[11.5px] font-semibold text-[#4F8DB8] min-h-[28px] flex items-center justify-center">{p.name}</div>
                {p.hours ? (
                  <div className="mt-0.5 text-[16px] font-extrabold text-[#2B333D]">{p.hours}<span className="text-[11px] font-semibold text-[#7A828B] ml-0.5">h</span></div>
                ) : (
                  <div className="mt-0.5 text-[16px] font-extrabold text-[#B4B9BF]">--<div className="text-[9.5px] font-normal">sem estimativa</div></div>
                )}
              </div>
            ))}
          </div>
          <div className="text-[10.5px] text-[#8A929B] mt-1.5">Estimativa aproximada (boletins SGB/SACE); varia com o volume da cheia.</div>
        </div>
      )}
    </div>
  );
};

// Design do gráfico (para comparar): padrão = linha colorida pelo status; ?grafico=classico = primeiro modelo
const CHART_MODE = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('grafico') : null;

// ---------- painel ----------
const ago = (ms: number) => {
  const min = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (min < 2) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
};

export const StationHoverPanel: React.FC<{ city: City; cities?: City[] }> = ({ city, cities = [] }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  const [range, setRange] = useState<RangeKey>(lastRange);
  const [series, setSeries] = useState<Point[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [rainInfo, setRainInfo] = useState<RainInfo | null>(null);

  useEffect(() => {
    let alive = true;
    setSeries(null);
    setFailed(false);
    loadSeries(city.id).then((s) => alive && setSeries(s)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [city.id]);

  useEffect(() => {
    let alive = true;
    setRainInfo(null);
    const hw = cities.filter((c) => HEADWATER_SLUGS.includes(c.slug)).map((c) => c.id);
    loadRain(city.id, hw).then((r) => alive && setRainInfo(r)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [city.id]);

  // A roda do mouse sobre a lista de cidades rola este painel (o painel só existe com o mouse na lista).
  // Se a própria lista precisar rolar (tela baixa), ela mantém a rolagem.
  useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Estações da Bacia"]') as HTMLElement | null;
    if (!nav) return;
    const onWheel = (e: WheelEvent) => {
      const panel = panelRef.current;
      if (!panel || nav.scrollHeight > nav.clientHeight + 2) return;
      if (panel.scrollHeight <= panel.clientHeight + 2) return;
      panel.scrollTop += e.deltaY;
      e.preventDefault();
    };
    nav.addEventListener('wheel', onWheel, { passive: false });
    return () => nav.removeEventListener('wheel', onWheel);
  }, []);

  // Aviso "role para ver mais" enquanto houver conteúdo abaixo
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const check = () => setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 12);
    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, [city.id, series, rainInfo, range]);

  const th = getCityThresholds(city);
  const cotas: Cotas = { attention: th.attention, alert: th.alert, flood: th.flood };
  const level = Number(city.current_level);
  const status = city.status_level;
  const rangeDef = RANGES.find((r) => r.key === range)!;
  const rangeMs = rangeDef.hours * 3600e3;

  const view = useMemo(() => {
    if (!series || !series.length) return [];
    const end = series[series.length - 1].t;
    return series.filter((p) => p.t >= end - rangeMs);
  }, [series, rangeMs]);

  const stats = useMemo(() => {
    if (view.length < 2) return null;
    const vs = view.map((p) => p.v);
    return { min: Math.min(...vs), max: Math.max(...vs), delta: view[view.length - 1].v - view[0].v };
  }, [view]);

  const records = HISTORICAL_FLOODS_BY_CITY[city.slug] ?? [];
  const record = records.length ? records.reduce((m, e) => (e.maxLevel > m.maxLevel ? e : m)) : null;

  const lastMs = series && series.length ? series[series.length - 1].t : new Date(city.last_updated || city.updated_at || '').getTime();
  const margin = th.flood > 0 && isFinite(level) ? th.flood - level : NaN;
  const pct = th.flood > 0 && isFinite(level) ? Math.min(Math.max(level / th.flood, 0), 1) * 100 : 0;

  const rate = Number(city.rate_of_change);
  const trendUp = city.trend === 'subindo';
  const trendDown = city.trend === 'descendo';
  const TrendIcon = trendUp ? ArrowUpRight : trendDown ? ArrowDownRight : Minus;
  const trendColor = trendUp ? '#C46A1C' : trendDown ? '#2E8B57' : '#58616B';
  const rateText = isFinite(rate) ? `${rate > 0 ? '+' : ''}${(rate * 100).toFixed(1).replace('.', ',')} cm/h` : '--';

  const rain = rainInfo?.days ?? [];
  const rainMax = Math.max(5, ...rain.map((d) => d.mm));
  const rain7 = rain.reduce((s, d) => s + d.mm, 0);

  return (
    <div className="relative h-full min-h-0">
    <div ref={panelRef} className={`${HOME_FONT} h-full min-h-0 flex flex-col bg-white text-[#2B333D] overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#C9CDD2_transparent]`}>
      {/* Cabeçalho compacto: nome da cidade | indicadores pequenos separados por | */}
      <div className="shrink-0 px-4 pt-2.5 pb-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="max-w-full text-[22px] leading-none font-extrabold truncate notranslate" translate="no">{city.name}</div>
          <div className="ml-auto shrink-0 flex items-stretch divide-x divide-[#D6D9DD] border-l border-[#D6D9DD]">
            {[
              { label: 'Margem', value: isFinite(margin) ? `${formatLevel(Math.max(margin, 0))} m` : '--', color: status ? STATUS_COLORS[status] : undefined },
              { label: 'Variação', value: stats ? `${stats.delta > 0 ? '+' : ''}${formatLevel(stats.delta)} m` : '--' },
              { label: 'Mín / Máx', value: stats ? `${formatLevel(stats.min, 1)} / ${formatLevel(stats.max, 1)}` : '--' },
              // Só aparece quando a cidade tem recorde cadastrado
              ...(record ? [{ label: 'Recorde', value: `${formatLevel(record.maxLevel)} m`, color: undefined as string | undefined }] : [])
            ].map((c) => (
              <div key={c.label} className="px-2 text-center leading-tight">
                <div className="text-[8.5px] font-semibold text-[#4F8DB8]">{c.label}</div>
                <div className="text-[11.5px] font-extrabold whitespace-nowrap" style={c.color ? { color: c.color } : undefined}>{c.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#7A828B]">
          {status && (
            <span className="shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.04em] px-1.5 py-px rounded-[4px]" style={{ backgroundColor: STATUS_COLORS[status], color: STATUS_INK[status] }}>
              {STATUS_LABELS[status]}
            </span>
          )}
          <span className="truncate">{city.river || ''}{isFinite(lastMs) ? ` · atualizado ${ago(lastMs)}` : ''}</span>
        </div>
      </div>

      {/* Nível e ocupação da cota de inundação */}
      <div className="shrink-0 mx-4 mb-2 rounded-[10px] border border-[#E3E6EA] bg-white px-3 py-2">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[34px] leading-none font-black tracking-[-0.04em]">{formatLevel(level)}</span>
            <span className="text-sm font-extrabold">m</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-extrabold pb-0.5" style={{ color: trendColor }}>
            <TrendIcon className="w-3.5 h-3.5" />
            {rateText}
          </div>
        </div>
        <div className="mt-1.5">
          <div className="relative h-[7px] rounded-full bg-[#E9ECEF] overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: status ? STATUS_COLORS[status] : '#8A9199' }} />
            {[th.attention, th.alert].filter((c) => c > 0 && th.flood > 0).map((c) => (
              <span key={c} className="absolute inset-y-0 w-px bg-white/90" style={{ left: `${(c / th.flood) * 100}%` }} />
            ))}
          </div>
          <div className="mt-0.5 flex justify-between text-[11.5px] text-[#58616B]">
            <span><strong className="font-extrabold text-[#2B333D]">{Math.round(pct)}%</strong> da cota de inundação</span>
            <span className="font-semibold">{th.flood > 0 ? `${formatLevel(th.flood)} m` : ''}</span>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-[150px] max-h-[290px] ml-4 mr-1 mb-2 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#58616B]">Nível do rio</span>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  lastRange = r.key;
                  setRange(r.key);
                }}
                className={`px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold cursor-pointer ${range === r.key ? 'bg-[#2B333D] text-white' : 'bg-[#EEF0F3] text-[#58616B] hover:bg-[#E3E6EA]'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[110px] relative">
          {series === null && !failed && <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#7A828B]">Carregando leituras…</div>}
          {failed && <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#7A828B]">Leituras indisponíveis no momento.</div>}
          {series !== null && view.length < 2 && !failed && <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#7A828B]">Sem leituras neste período.</div>}
          {view.length >= 2 && (CHART_MODE === 'classico' ? <LevelChart points={view} cotas={cotas} rangeMs={rangeMs} /> : <ProChart points={view} cotas={cotas} rangeMs={rangeMs} recordMax={record?.maxLevel} />)}
        </div>
      </div>

      <RiverInsights city={city} series={series} rain={rainInfo} />

      {/* Previsão de chuva: mesmo formato da Previsão do tempo (dias lado a lado, HOJE em destaque) */}
      {rain.length > 0 && (
        <div className="shrink-0 mx-4 mb-2 rounded-[10px] border border-[#E3E6EA] bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-2">
            <div className="flex items-stretch gap-2">
              <span className="w-[3px] rounded-full bg-[#2B333D]" />
              <div className="leading-tight">
                <div className="text-[17px] font-extrabold text-[#2B333D]">Previsão de chuva</div>
                <div className="text-[12px] font-light text-[#58616B]">Próximos dias</div>
              </div>
            </div>
            <div className="text-right leading-tight">
              <div className="text-[20px] font-black tracking-[-0.02em] text-[#2F6FA3]">{Math.round(rain7)}<span className="text-[11px] font-semibold ml-0.5">mm</span></div>
              <div className="text-[10px] text-[#7A828B]">em {rain.length} dias</div>
            </div>
          </div>
          <div className="grid border-t border-[#E3E6EA]" style={{ gridTemplateColumns: `repeat(${rain.length}, minmax(0,1fr))` }}>
            {rain.map((d, i) => {
              const Icon = dayIcon(d.mm, d.prob);
              const today = i === 0;
              return (
                <div
                  key={d.day}
                  className={`flex flex-col items-center gap-1 py-2.5 px-0.5 ${i > 0 ? 'border-l border-[#E3E6EA]' : ''} ${today ? 'bg-[#2B333D] text-white' : 'text-[#2B333D]'}`}
                  title={`${d.label}: ${d.mm.toFixed(1)} mm${d.prob !== null ? ` · ${Math.round(d.prob)}% de chance` : ''}`}
                >
                  <span className="text-[11px] font-extrabold uppercase leading-none">{today ? 'Hoje' : d.label}</span>
                  <span className={`text-[10px] leading-none ${today ? 'text-[#C9CDD2]' : 'text-[#7A828B]'}`}>{d.day.slice(8)}/{d.day.slice(5, 7)}</span>
                  <Icon className={`w-6 h-6 my-0.5 ${today ? 'text-white' : 'text-[#58616B]'}`} strokeWidth={1.5} />
                  {d.tmax !== null && d.tmin !== null && (
                    <span className="text-[11px] leading-none whitespace-nowrap"><b className="font-extrabold">{Math.round(d.tmax)}°</b><span className={today ? 'text-[#C9CDD2]' : 'text-[#7A828B]'}> / {Math.round(d.tmin)}°</span></span>
                  )}
                  <span className={`mt-0.5 text-[18px] font-black leading-none tracking-[-0.02em] ${today ? 'text-[#8CC8F2]' : 'text-[#2F6FA3]'}`}>
                    {d.mm >= 10 ? Math.round(d.mm) : d.mm.toFixed(1).replace('.', ',')}
                  </span>
                  <span className={`text-[9.5px] font-semibold leading-none -mt-0.5 ${today ? 'text-[#C9CDD2]' : 'text-[#7A828B]'}`}>mm{d.prob !== null ? ` · ${Math.round(d.prob)}%` : ''}</span>
                </div>
              );
            })}
          </div>

          {/* Chuva acumulada nas cabeceiras: 24 h | 72 h | próximas 72 h */}
          {rainInfo?.head && (
            <div className="border-t border-[#E3E6EA]">
              <div className="flex items-center gap-1.5 px-3 pt-2 text-[11px] font-semibold text-[#4F8DB8]"><Droplets className="w-3.5 h-3.5" />Chuva nas cabeceiras</div>
              <div className="grid grid-cols-3 divide-x divide-[#E3E6EA] py-2">
                {[
                  { label: 'Últimas 24 h', v: rainInfo.head.r24 },
                  { label: 'Últimas 72 h', v: rainInfo.head.r72 },
                  { label: 'Próx. 72 h (prev.)', v: rainInfo.head.f72 }
                ].map((c) => (
                  <div key={c.label} className="px-2 text-center leading-tight">
                    <div className="text-[10px] font-semibold text-[#4F8DB8]">{c.label}</div>
                    <div className="text-[19px] font-black tracking-[-0.02em] text-[#2B333D]">
                      {c.v === null || c.v === undefined ? '--' : c.v.toFixed(1).replace('.', ',')}
                      <span className="text-[10px] font-semibold text-[#7A828B] ml-0.5">mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fonte */}
      <div className="shrink-0 px-4 pb-3 flex items-center gap-1.5 text-[9.5px] text-[#7A828B]">
        <Clock className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {isFinite(lastMs) ? `Última leitura ${fmtDayMonth(lastMs)} ${fmtHour(lastMs)} · ` : ''}
          {city.source_origin || 'SGB/SACE'} · coleta a cada 5 min
        </span>
      </div>
    </div>
    {moreBelow && (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 flex items-end justify-center pb-1.5 bg-gradient-to-t from-white via-white/90 to-transparent">
        <span className="text-[10.5px] font-bold text-[#58616B] bg-white/95 border border-[#E3E6EA] rounded-full px-2.5 py-0.5 shadow-sm">↓ role para ver mais</span>
      </div>
    )}
    </div>
  );
};
