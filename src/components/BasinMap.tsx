import React, { useEffect, useMemo, useRef, useState } from 'react';
import { City } from '../types';
import { STATUS_COLORS, BASIN_LABELS, BASIN_STATIONS, BasinKey, formatLevel } from './homeTheme';

interface BasinMapProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
  basin: BasinKey;
  onChangeBasin: (basin: BasinKey) => void;
  infoCard?: React.ReactNode;
}

type Ring = [number, number][];
interface BasinFeature {
  properties: { nome: string };
  geometry: { type: 'MultiPolygon'; coordinates: Ring[][] };
}
interface River { nome: string; major?: boolean; lbl: [number, number]; pts: [number, number][] }

// Traçado esquemático dos rios principais (lon, lat)
const TAQUARI_RIVERS: River[] = [
  { nome: 'Rio das Antas', major: true, lbl: [-50.75, -28.74], pts: [[-50.05, -28.72], [-50.45, -28.70], [-50.85, -28.80], [-51.15, -28.93], [-51.41, -29.01], [-51.60, -29.08], [-51.73, -29.14], [-51.87, -29.17]] },
  { nome: 'Rio Taquari', major: true, lbl: [-52.16, -29.70], pts: [[-51.87, -29.17], [-51.88, -29.26], [-51.92, -29.35], [-51.97, -29.46], [-51.94, -29.60], [-51.86, -29.80]] },
  { nome: 'Rio Carreiro', lbl: [-51.66, -28.64], pts: [[-51.95, -28.50], [-51.82, -28.74], [-51.72, -28.95], [-51.68, -29.09]] },
  { nome: 'Rio da Prata', lbl: [-51.36, -28.52], pts: [[-51.30, -28.45], [-51.44, -28.70], [-51.55, -28.92], [-51.58, -29.06]] },
  { nome: 'Rio Guaporé', lbl: [-52.22, -28.66], pts: [[-52.10, -28.45], [-51.96, -28.70], [-51.89, -28.88], [-51.87, -29.15]] },
  { nome: 'Rio Forqueta', lbl: [-52.50, -29.08], pts: [[-52.50, -28.92], [-52.28, -29.14], [-52.10, -29.33], [-51.98, -29.42]] },
  { nome: 'Rio Fão', lbl: [-52.52, -29.30], pts: [[-52.55, -29.20], [-52.35, -29.24], [-52.18, -29.30]] },
  { nome: 'Rio Tainhas', lbl: [-50.40, -29.00], pts: [[-50.30, -29.12], [-50.45, -28.95], [-50.58, -28.78]] }
];

const GUAIBA_RIVERS: River[] = [
  { nome: 'Rio Jacuí', major: true, lbl: [-52.62, -29.94], pts: [[-53.36, -29.62], [-53.15, -29.80], [-52.89, -30.04], [-52.60, -30.02], [-52.37, -29.99], [-52.05, -29.93], [-51.76, -29.90], [-51.55, -29.96], [-51.30, -30.00]] },
  { nome: 'Lago Guaíba', major: true, lbl: [-51.50, -30.24], pts: [[-51.26, -30.01], [-51.29, -30.10], [-51.30, -30.22], [-51.22, -30.32], [-51.06, -30.38]] },
  { nome: 'Rio Caí', lbl: [-51.56, -29.50], pts: [[-51.28, -29.40], [-51.31, -29.45], [-51.38, -29.59], [-51.46, -29.69], [-51.40, -29.83], [-51.33, -29.93]] },
  { nome: 'Rio dos Sinos', lbl: [-50.9, -29.76], pts: [[-50.60, -29.63], [-50.78, -29.65], [-51.00, -29.70], [-51.15, -29.76], [-51.20, -29.85], [-51.24, -29.93]] },
  { nome: 'Rio Gravataí', lbl: [-50.98, -30.05], pts: [[-50.80, -29.92], [-50.99, -29.94], [-51.12, -29.96], [-51.23, -29.98]] }
];

// Contornos aproximados (municípios IBGE), servidos estáticos de public/
const BASIN_CONFIG: Record<BasinKey, { url: string; rivers: River[]; aria: string; labelHalo: string }> = {
  taquari: {
    url: '/geo/bacia-taquari-antas.json',
    rivers: TAQUARI_RIVERS,
    labelHalo: '#EFF1F3',
    aria: 'Mapa da Bacia Taquari-Antas com as estações de monitoramento'
  },
  guaiba: {
    url: '/geo/bacia-lago-guaiba.json',
    rivers: GUAIBA_RIVERS,
    // Rios da região ficam em boa parte fora do contorno da bacia do lago
    labelHalo: '#EFF1F3',
    aria: 'Mapa da Bacia do Lago Guaíba com as estações de monitoramento'
  }
};

const geoCache = new Map<string, BasinFeature[]>();
const geoRequests = new Map<string, Promise<BasinFeature[]>>();

function loadGeo(url: string): Promise<BasinFeature[]> {
  const cached = geoCache.get(url);
  if (cached) return Promise.resolve(cached);
  let req = geoRequests.get(url);
  if (!req) {
    req = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((fc) => {
        const features = (fc?.features || []) as BasinFeature[];
        geoCache.set(url, features);
        return features;
      })
      .catch((err) => {
        geoRequests.delete(url);
        throw err;
      });
    geoRequests.set(url, req);
  }
  return req;
}

const C_BASIN = 'var(--map-basin)'; // preenchimento da bacia
const C_EDGE = 'var(--map-edge)'; // contorno bem visível da bacia
const C_RIVER = 'var(--map-river)';
const C_INK = '#2B333D';
const EARTH_RADIUS_KM = 6371;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

// Projeção de Mercator (radianos)
const mercX = (lon: number) => (lon * Math.PI) / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

interface Box { x: number; y: number; w: number; h: number }
const overlaps = (a: Box, list: Box[]) =>
  list.some((o) => a.x < o.x + o.w + 2 && a.x + a.w + 2 > o.x && a.y < o.y + o.h && a.y + a.h > o.y);
// Largura aproximada do texto (Figtree), suficiente para evitar sobreposição de rótulos
const textBox = (x: number, y: number, text: string, size: number, anchor: 'start' | 'middle' | 'end', weight = 600): Box => {
  const w = text.length * size * (weight >= 800 ? 0.6 : 0.55);
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { x: left, y: y - size * 0.8, w, h: size };
};

// Curva suave (Catmull-Rom → Bézier cúbica) pelos pontos do rio
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

const hasCoords = (c: City) =>
  typeof c.latitude === 'number' && typeof c.longitude === 'number' && !isNaN(c.latitude) && !isNaN(c.longitude);

// Fluxo dos rios entre as estações (montante → jusante). Esquemático: liga as estações que já existem
// no menu, seguindo o curso dos rios principais de cada bacia.
const FLOW_EDGES: Record<BasinKey, [string, string][]> = {
  taquari: [
    ['passotainhas', 'linhajosejulio'], ['linhajosejulio', 'santatereza'], ['santatereza', 'mucum'],
    ['passocarreiro', 'mucum'], ['mucum', 'encantado'], ['encantado', 'rocasales'], ['linhacolombo', 'rocasales'],
    ['rocasales', 'lajeado'], ['barradofao', 'lajeado'], ['lajeado', 'estrela'], ['estrela', 'cruzeirodosul'],
    ['cruzeirodosul', 'bomretirodosul'], ['bomretirodosul', 'portomariante'], ['portomariante', 'taquari']
  ],
  guaiba: [
    ['donafrancisca', 'cachoeiradosul'], ['cachoeiradosul', 'riopardo'], ['riopardo', 'portoalegre'],
    ['feliz', 'saosebastiaodocai'], ['saosebastiaodocai', 'montenegro'], ['montenegro', 'portoalegre'],
    ['taquara', 'saoleopoldo'], ['saoleopoldo', 'portoalegre'], ['gravatai', 'portoalegre']
  ]
};

const TREND_UP = '#D9483B';
const TREND_DOWN = '#2F6FA3';
const fmtCota = (v: unknown) => (typeof v === 'number' && isFinite(v) && v > 0 ? v.toFixed(2).replace('.', ',') : null);
const trendOf = (c: City): { glyph: string; color: string } => {
  const r = Number(c.rate_of_change);
  if (!isFinite(r) || Math.abs(r) <= 0.02) return { glyph: '–', color: '#7A838C' };
  return r > 0 ? { glyph: '▲', color: TREND_UP } : { glyph: '▼', color: TREND_DOWN };
};

// Legenda entre o desenho da bacia e o card de dados (computador): altura dos 4 itens empilhados e folga sobre eles
const LEGEND_H = 16;
// Card de dados responsivo: largura e fonte acompanham a largura do mapa
const cardWidthFor = (mapW: number) => Math.min(280, Math.max(222, mapW * 0.79));
const cardFontFor = (mapW: number) => Math.min(11.3, Math.max(9.8, mapW / 30));
const LEGEND_GAP = 24;
const CARD_GAP = 34; // folga entre a legenda e o card de dados

export const BasinMap: React.FC<BasinMapProps> = ({ cities, selectedCity, onSelectCity, basin, onChangeBasin, infoCard }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const config = BASIN_CONFIG[basin];
  const [shapes, setShapes] = useState<BasinFeature[] | null>(geoCache.get(config.url) || null);
  const [loadError, setLoadError] = useState(false);
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const [cardH, setCardH] = useState(126); // altura real do card (medida), para reservar espaço no mapa

  useEffect(() => {
    let alive = true;
    setLoadError(false);
    setShapes(geoCache.get(config.url) || null);
    loadGeo(config.url)
      .then((f) => alive && setShapes(f))
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, [config.url]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!cardEl) return;
    // Reserva a MAIOR altura já vista para a largura atual: trocar de cidade (texto que quebra de linha) não move mais o mapa
    setCardH(cardEl.offsetHeight);
    const update = () => setCardH((prev) => Math.max(prev, cardEl.offsetHeight));
    const ro = new ResizeObserver(update);
    ro.observe(cardEl);
    return () => ro.disconnect();
  }, [cardEl, size.w]);

  // Estações da bacia ativa com coordenadas do banco
  const basinCities = useMemo(
    () => cities.filter((c) => c.active !== false && BASIN_STATIONS[basin].includes(c.slug) && hasCoords(c)),
    [cities, basin]
  );

  // Projeção ajustada ao contorno da bacia e às estações dentro da área disponível
  const projection = useMemo(() => {
    if (!shapes || shapes.length === 0 || size.w < 50 || size.h < 50) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const add = (lon: number, lat: number) => {
      const x = mercX(lon), y = mercY(lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    };
    for (const f of shapes) for (const poly of f.geometry.coordinates) for (const [lon, lat] of poly[0]) add(lon, lat);
    for (const c of basinCities) add(c.longitude, c.latitude);
    // No computador o card de dados da estação ocupa a base do mapa: o desenho da bacia se ajusta acima dele
    const cardReserve = infoCard && typeof window !== 'undefined' && window.innerWidth >= 1024 ? LEGEND_GAP + LEGEND_H + CARD_GAP + cardH - 58 : 0; // espaço para a legenda e o card sob o desenho
    const pad = { l: 18, r: 18, t: 72, b: 60 + cardReserve };
    const availW = size.w - pad.l - pad.r;
    const availH = size.h - pad.t - pad.b;
    const k = Math.min(availW / (maxX - minX), availH / (maxY - minY));
    const offX = pad.l + (availW - (maxX - minX) * k) / 2;
    const offY = pad.t + (availH - (maxY - minY) * k) / 2;
    const project = (lon: number, lat: number): [number, number] => [
      offX + (mercX(lon) - minX) * k,
      offY + (maxY - mercY(lat)) * k
    ];
    // Latitude central para a escala gráfica
    const centerLat = ((2 * Math.atan(Math.exp((minY + maxY) / 2)) - Math.PI / 2) * 180) / Math.PI;
    const kmPerPx = (EARTH_RADIUS_KM * Math.cos((centerLat * Math.PI) / 180)) / k;
    // Base do desenho: o card de dados fica logo abaixo dele (com folga para os nomes das estações do sul)
    const drawingBottom = offY + (maxY - minY) * k;
    return { project, kmPerPx, drawingBottom };
  }, [shapes, basinCities, size.w, size.h, cardH]);

  const basinPaths = useMemo(() => {
    if (!shapes || !projection) return [];
    return shapes.map((f) => {
      const d = f.geometry.coordinates
        .map((poly) =>
          poly
            .map((ring) => ring.map(([lon, lat], i) => {
              const [x, y] = projection.project(lon, lat);
              return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            }).join('') + 'Z')
            .join('')
        )
        .join('');
      return { nome: f.properties.nome, key: norm(f.properties.nome), d };
    });
  }, [shapes, projection]);

  const isSelected = (c: City) => c.id === selectedCity.id || c.slug === selectedCity.slug;
  const statusColor = (c: City) => (c.status_level ? STATUS_COLORS[c.status_level] : '#8A9199');

  const stations = useMemo(() => {
    if (!projection) return [];
    return basinCities.map((c) => ({ city: c, p: projection.project(c.longitude, c.latitude) }));
  }, [basinCities, projection]);

  // Município da estação selecionada (preenchido com a cor do status)
  const selectedMunKey = norm(selectedCity.municipality || selectedCity.name || '');
  const selectedFill = statusColor(selectedCity);

  // Fluxo entre estações: linhas curvas de montante para jusante, na cor do status da estação de montante
  const flows = useMemo(() => {
    const bySlug = new Map<string, { city: City; p: [number, number] }>();
    stations.forEach((s) => bySlug.set(s.city.slug, s));
    return FLOW_EDGES[basin].flatMap(([from, to]) => {
      const a = bySlug.get(from);
      const b = bySlug.get(to);
      if (!a || !b) return [];
      const [ax, ay] = a.p;
      const [bx, by] = b.p;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const cx = (ax + bx) / 2 - ((by - ay) / len) * len * 0.12;
      const cy = (ay + by) / 2 + ((bx - ax) / len) * len * 0.12;
      const t = 0.62;
      const px = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx;
      const py = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by;
      const tx = 2 * (1 - t) * (cx - ax) + 2 * t * (bx - cx);
      const ty = 2 * (1 - t) * (cy - ay) + 2 * t * (by - cy);
      const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
      return [{ key: `${from}-${to}`, d: `M${ax.toFixed(1)},${ay.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`, color: statusColor(a.city), flooding: a.city.status_level === 'inundacao', px, py, ang, len }];
    });
  }, [stations, basin]);

  // Rótulos: rios primeiro; depois cada estação (nome + nível + cota) na primeira posição livre ao redor do ponto
  const labels = useMemo(() => {
    type StationLabel = { id: string; anchor: 'start' | 'middle' | 'end'; x: number; y1: number; y2: number | null; name: string; info: string; on: boolean };
    if (!projection) return { rivers: [] as { nome: string; x: number; y: number }[], stations: [] as StationLabel[] };
    const boxes: Box[] = stations.map((s) => ({ x: s.p[0] - 8, y: s.p[1] - 8, w: 16, h: 16 }));
    const rivers: { nome: string; x: number; y: number }[] = [];
    const riverOrder = [...config.rivers].sort((a, b) => Number(!!b.major) - Number(!!a.major));
    for (const r of riverOrder) {
      const [x, y] = projection.project(r.lbl[0], r.lbl[1]);
      const box = textBox(x, y, r.nome, 10, 'middle');
      if (box.x < 2 || box.x + box.w > size.w - 2 || box.y < 50 || overlaps(box, boxes)) continue;
      boxes.push(box);
      rivers.push({ nome: r.nome, x, y });
    }
    const out: StationLabel[] = [];
    // Selecionada primeiro; depois as em atenção/alerta/inundação; depois as demais
    const rank = (c: City) => (isSelected(c) ? 0 : c.status_level && c.status_level !== 'normal' ? 1 : 2);
    const ordered = [...stations].sort((a, b) => rank(a.city) - rank(b.city));
    for (const s of ordered) {
      const on = isSelected(s.city);
      const nameSize = on ? 12 : 10.5;
      const infoSize = 9.5;
      const cota = fmtCota(Number(s.city.flood_level));
      const tr = trendOf(s.city);
      const info = `${tr.glyph} ${formatLevel(s.city.current_level)} m${cota ? ` · cota ${cota}` : ''}`;
      const r = on ? 9 : 7;
      const [px, py] = s.p;
      const nameW = textBox(0, 0, s.city.name, nameSize, 'start', 800).w;
      const w = Math.max(nameW, textBox(0, 0, info, infoSize, 'start').w);
      const tries: { anchor: 'start' | 'middle' | 'end'; x: number; y1: number; y2: number | null; box: Box }[] = [];
      for (const two of [true, false]) {
        const h = two ? nameSize + infoSize + 3 : nameSize + 1;
        const ww = two ? w : nameW;
        const yy = (top: number) => ({ y1: top + nameSize * 0.85, y2: two ? top + nameSize + infoSize * 0.95 + 2 : null });
        tries.push({ anchor: 'start', x: px + r + 3, ...yy(py - h / 2), box: { x: px + r + 3, y: py - h / 2, w: ww, h } });
        tries.push({ anchor: 'end', x: px - r - 3, ...yy(py - h / 2), box: { x: px - r - 3 - ww, y: py - h / 2, w: ww, h } });
        tries.push({ anchor: 'middle', x: px, ...yy(py - r - 3 - h), box: { x: px - ww / 2, y: py - r - 3 - h, w: ww, h } });
        tries.push({ anchor: 'middle', x: px, ...yy(py + r + 3), box: { x: px - ww / 2, y: py + r + 3, w: ww, h } });
      }
      const fits = (b: Box) => b.x >= 3 && b.x + b.w <= size.w - 3 && b.y >= 52 && b.y + b.h <= size.h - 30;
      const pick = tries.find((t) => fits(t.box) && !overlaps(t.box, boxes)) || (on ? tries.find((t) => fits(t.box)) : undefined);
      if (!pick) continue;
      boxes.push(pick.box);
      out.push({ id: s.city.id, anchor: pick.anchor, x: pick.x, y1: pick.y1, y2: pick.y2, name: s.city.name, info, on });
    }
    return { rivers, stations: out };
  }, [stations, projection, config.rivers, selectedCity.id, selectedCity.slug, size.w, size.h]);

  const drawOrder = [...stations].sort((a, b) => Number(isSelected(a.city)) - Number(isSelected(b.city)));

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-[5px] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
      active ? 'bg-[var(--map-tab-on-bg)] text-[var(--map-tab-on-text)]' : 'text-[var(--map-soft)] hover:bg-[var(--map-tab-hover)]'
    }`;

  const LEGEND = [
    { k: 'normal', label: 'Normal' },
    { k: 'atencao', label: 'Atenção' },
    { k: 'alerta', label: 'Alerta' },
    { k: 'inundacao', label: 'Inundação' }
  ] as const;

  const legendTop =
    infoCard && projection && typeof window !== 'undefined' && window.innerWidth >= 1024
      ? Math.min(projection.drawingBottom + LEGEND_GAP, size.h - 36 - cardH - LEGEND_H - CARD_GAP)
      : undefined;

  return (
    <div
      ref={containerRef}
      id="mapa-estacoes"
      className="relative w-full h-full min-h-[420px] bg-[var(--map-bg)] text-[var(--map-text)] overflow-hidden font-[family-name:Figtree,system-ui,sans-serif]"
    >
      {/* SELETOR DE BACIA */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 p-0.5 rounded-[7px] bg-[var(--map-tab-bg)] border border-[var(--map-tab-line)] shadow-sm" role="tablist" aria-label="Bacia exibida">
        {(Object.keys(BASIN_LABELS) as BasinKey[]).map((key) => (
          <button key={key} type="button" role="tab" aria-selected={basin === key} onClick={() => onChangeBasin(key)} className={tabClass(basin === key)}>
            {BASIN_LABELS[key]}
          </button>
        ))}
      </div>

      {infoCard && projection && (
        <div ref={setCardEl} className="hidden lg:block absolute left-1/2 -translate-x-1/2 z-10" style={{ top: Math.min(projection.drawingBottom + LEGEND_GAP + LEGEND_H + CARD_GAP, size.h - 36 - cardH), width: cardWidthFor(size.w), fontSize: cardFontFor(size.w) }}>{infoCard}</div>
      )}

      {!projection && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--map-muted)]">
          {loadError ? 'Não foi possível carregar o mapa.' : 'Carregando mapa…'}
        </div>
      )}

      {projection && (
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} className="block" role="img" aria-label={config.aria}>
          {/* Desenho da bacia: contorno claro e bem visível, preenchimento sólido em azul-acinzentado */}
          <g>
            {basinPaths.map((b) => (
              <path key={`o-${b.key}`} d={b.d} fill={C_EDGE} stroke={C_EDGE} strokeWidth={3.4} strokeLinejoin="round" />
            ))}
          </g>
          <g>
            {basinPaths.map((b) => (
              <path key={`f-${b.key}`} d={b.d} fill={C_BASIN} stroke={C_BASIN} strokeWidth={1} />
            ))}
          </g>
          {/* Divisas dos municípios, discretas */}
          <g>
            {basinPaths.map((b) => (
              <path key={`m-${b.key}`} d={b.d} fill="none" stroke="#2F6FA3" strokeOpacity={0.22} strokeWidth={0.6} />
            ))}
          </g>
          {/* Município da estação selecionada: em destaque, cor conforme o status */}
          <g>
            {basinPaths
              .filter((b) => b.key === selectedMunKey)
              .map((b) => (
                <path key={`s-${b.key}`} d={b.d} fill={selectedFill} fillOpacity={0.65} stroke="var(--map-pin-on)" strokeWidth={1.4} strokeLinejoin="round" />
              ))}
          </g>

          {/* Rios principais */}
          <g>
            {config.rivers.map((r) => (
              <path
                key={r.nome}
                d={smoothPath(r.pts.map(([lon, lat]) => projection.project(lon, lat)))}
                fill="none"
                stroke={C_RIVER}
                strokeWidth={r.major ? 2.4 : 1.5}
                strokeLinecap="round"
                opacity={0.85}
              />
            ))}
            {labels.rivers.map((r) => (
              <text key={`l-${r.nome}`} x={r.x} y={r.y} textAnchor="middle" fontSize={10} fontStyle="italic" fontWeight={600} fill={C_RIVER} stroke="var(--map-halo)" strokeWidth={3} paintOrder="stroke" pointerEvents="none">
                {r.nome}
              </text>
            ))}
          </g>

          {/* Fluxo entre estações: linha suave + pontos correndo no sentido do rio + seta */}
          <g pointerEvents="none">
            {flows.map((f) => (
              <g key={f.key}>
                <path d={f.d} fill="none" stroke={f.color} strokeOpacity={0.55} strokeWidth={2.8} strokeLinecap="round" />
                {f.flooding && <path d={f.d} fill="none" stroke={f.color} strokeWidth={2.8} strokeLinecap="round" strokeDasharray="2 9" className="basin-flow-dots" />}
                {f.len > 34 && (
                  <path d="M-4.5,-3.6 L4,0 L-4.5,3.6 Z" fill={f.color} stroke="#FFFFFF" strokeWidth={1} strokeLinejoin="round" transform={`translate(${f.px.toFixed(1)},${f.py.toFixed(1)}) rotate(${f.ang.toFixed(1)})`} />
                )}
              </g>
            ))}
          </g>

          {/* Estações */}
          <g>
            {drawOrder.map(({ city, p }) => {
              const on = isSelected(city);
              const flooding = city.status_level === 'inundacao';
              const baseR = on ? 6.5 : 4.6;
              const color = statusColor(city);
              return (
                <React.Fragment key={city.id}>
                  {flooding && (
                    <>
                      <circle cx={p[0]} cy={p[1]} r={baseR} fill="none" stroke={STATUS_COLORS.inundacao} strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" className="flood-ping-ring" />
                      <circle cx={p[0]} cy={p[1]} r={baseR} fill="none" stroke={STATUS_COLORS.inundacao} strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" className="flood-ping-ring flood-ping-ring--delayed" />
                    </>
                  )}
                                    <circle cx={p[0]} cy={p[1]} r={baseR + 3.5} fill={color} fillOpacity={0.22} pointerEvents="none" />
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={baseR}
                    fill={color}
                    stroke={on ? 'var(--map-pin-on)' : 'var(--map-halo)'}
                    strokeWidth={on ? 2.4 : 1.8}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`${city.name}: ${formatLevel(city.current_level)} m`}
                    onClick={() => onSelectCity(city)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCity(city);
                      }
                    }}
                  >
                    <title>{`${city.name} · ${formatLevel(city.current_level)} m`}</title>
                  </circle>
                </React.Fragment>
              );
            })}
            {labels.stations.map((l) => {
              const city = stations.find((s) => s.city.id === l.id)?.city;
              return (
                <g key={`t-${l.id}`} className="cursor-pointer select-none" onClick={() => city && onSelectCity(city)}>
                  <text x={l.x} y={l.y1} textAnchor={l.anchor} fontSize={l.on ? 12 : 10.5} fontWeight={800} fill="var(--map-text)" stroke="var(--map-halo)" strokeWidth={3.2} paintOrder="stroke" strokeLinejoin="round">
                    {l.name}
                  </text>
                  {l.y2 !== null && (
                    <text x={l.x} y={l.y2} textAnchor={l.anchor} fontSize={9.5} fontWeight={600} fill="var(--map-soft)" stroke="var(--map-halo)" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                      {l.info}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Direitos reservados, na base do card do mapa */}
      <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-[var(--map-faint)] pointer-events-none">© {new Date().getFullYear()} Nível Taquari. Todos os direitos reservados.</div>

      {/* Legenda: itens lado a lado e centralizados; no computador fica entre o desenho da bacia e o card de dados */}
      {projection && (
        <div
          className={`absolute left-3 right-3 ${legendTop === undefined ? 'bottom-7' : ''} flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--map-muted)] pointer-events-none`}
          style={legendTop === undefined ? undefined : { top: legendTop }}
        >
          {LEGEND.map(({ k, label }) => (
            <span key={k} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[k] }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
