import React, { useEffect, useMemo, useRef, useState } from 'react';
import { City } from '../types';
import { STATUS_COLORS, BASIN_LABELS, BASIN_STATIONS, BasinKey, formatLevel } from './homeTheme';

interface BasinMapProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
  basin: BasinKey;
  onChangeBasin: (basin: BasinKey) => void;
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
    labelHalo: '#A9CDE6',
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

const C_BASIN = '#A9CDE6';
const C_EDGE = '#2F6FA3';
const C_RIVER = '#2F5BD0';
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

export const BasinMap: React.FC<BasinMapProps> = ({ cities, selectedCity, onSelectCity, basin, onChangeBasin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const config = BASIN_CONFIG[basin];
  const [shapes, setShapes] = useState<BasinFeature[] | null>(geoCache.get(config.url) || null);
  const [loadError, setLoadError] = useState(false);

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
    const pad = { l: 18, r: 18, t: 72, b: 60 };
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
    return { project, kmPerPx };
  }, [shapes, basinCities, size.w, size.h]);

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
  const statusColor = (c: City) => (c.status_level ? STATUS_COLORS[c.status_level] : '#FFFFFF');

  const stations = useMemo(() => {
    if (!projection) return [];
    return basinCities.map((c) => ({ city: c, p: projection.project(c.longitude, c.latitude) }));
  }, [basinCities, projection]);

  // Município da estação selecionada (preenchido com a cor do status)
  const selectedMunKey = norm(selectedCity.municipality || selectedCity.name || '');
  const selectedFill = statusColor(selectedCity);

  // Rótulos: estação selecionada sempre visível; demais e rios somem se colidirem
  const labels = useMemo(() => {
    type StationLabel = { id: string; x: number; y: number; anchor: 'start' | 'end'; text: string; on: boolean };
    if (!projection) return { rivers: [] as { nome: string; x: number; y: number }[], stations: [] as StationLabel[] };
    const boxes: Box[] = [];
    // Como na referência: rótulos dos rios primeiro (principais antes), depois as estações
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
    const ordered = [...stations].sort((a, b) => Number(isSelected(b.city)) - Number(isSelected(a.city)));
    for (const s of ordered) {
      const on = isSelected(s.city);
      const fontSize = on ? 12 : 9.5;
      const weight = on ? 800 : 600;
      let anchor: 'start' | 'end' = 'start';
      let x = s.p[0] + (on ? 10 : 7);
      const y = s.p[1] + 3.5;
      let box = textBox(x, y, s.city.name, fontSize, anchor, weight);
      if (box.x + box.w > size.w - 4) {
        anchor = 'end';
        x = s.p[0] - (on ? 10 : 7);
        box = textBox(x, y, s.city.name, fontSize, anchor, weight);
      }
      if (!on && overlaps(box, boxes)) continue;
      boxes.push(box);
      out.push({ id: s.city.id, x, y, anchor, text: s.city.name, on });
    }
    return { rivers, stations: out };
  }, [stations, projection, config.rivers, selectedCity.id, selectedCity.slug, size.w]);

  const scale = projection
    ? { px25: 25 / projection.kmPerPx, px50: 50 / projection.kmPerPx }
    : null;

  const drawOrder = [...stations].sort((a, b) => Number(isSelected(a.city)) - Number(isSelected(b.city)));

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-[5px] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
      active ? 'bg-[#2B333D] text-white' : 'text-[#3A434E] hover:bg-[#DCE1E6]'
    }`;

  return (
    <div
      ref={containerRef}
      id="mapa-estacoes"
      className="relative w-full h-full min-h-[420px] bg-[#EFF1F3] overflow-hidden font-[family-name:Figtree,system-ui,sans-serif]"
    >
      {/* SELETOR DE BACIA */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 p-0.5 rounded-[7px] bg-white border border-[#D5DAE0] shadow-sm" role="tablist" aria-label="Bacia exibida">
        {(Object.keys(BASIN_LABELS) as BasinKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={basin === key}
            onClick={() => onChangeBasin(key)}
            className={tabClass(basin === key)}
          >
            {BASIN_LABELS[key]}
          </button>
        ))}
      </div>

      {!projection && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-[#6B737C]">
          {loadError ? 'Não foi possível carregar o mapa.' : 'Carregando mapa…'}
        </div>
      )}

      {projection && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="block"
          role="img"
          aria-label={config.aria}
        >
          {/* Bacia como forma única: contorno só na borda externa */}
          <g>
            {basinPaths.map((b) => (
              <path key={`o-${b.key}`} d={b.d} fill={C_EDGE} stroke={C_EDGE} strokeWidth={2.8} strokeLinejoin="round" />
            ))}
          </g>
          <g>
            {basinPaths.map((b) => (
              <path key={`f-${b.key}`} d={b.d} fill={C_BASIN} stroke={C_BASIN} strokeWidth={0.8} />
            ))}
          </g>
          <g>
            {basinPaths
              .filter((b) => b.key === selectedMunKey)
              .map((b) => (
                <path key={`s-${b.key}`} d={b.d} fill={selectedFill} stroke={selectedFill} strokeWidth={0.8} />
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
                strokeWidth={r.major ? 2.2 : 1.4}
                strokeLinecap="round"
              />
            ))}
            {labels.rivers.map((r) => (
              <text
                key={`l-${r.nome}`}
                x={r.x}
                y={r.y}
                textAnchor="middle"
                fontSize={10}
                fontStyle="italic"
                fontWeight={600}
                fill={C_RIVER}
                stroke={config.labelHalo}
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {r.nome}
              </text>
            ))}
          </g>

          {/* Estações */}
          <g>
            {drawOrder.map(({ city, p }) => {
              const on = isSelected(city);
              return (
                <circle
                  key={city.id}
                  cx={p[0]}
                  cy={p[1]}
                  r={on ? 6 : 3.8}
                  fill={statusColor(city)}
                  stroke={on ? C_INK : '#FFFFFF'}
                  strokeWidth={on ? 2 : 1.2}
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
              );
            })}
            {labels.stations.map((l) => {
              const city = stations.find((s) => s.city.id === l.id)?.city;
              return (
                <text
                  key={`t-${l.id}`}
                  x={l.x}
                  y={l.y}
                  textAnchor={l.anchor}
                  fontSize={l.on ? 12 : 9.5}
                  fontWeight={l.on ? 800 : 600}
                  fill={C_INK}
                  stroke="#EEF5FA"
                  strokeWidth={3}
                  paintOrder="stroke"
                  className="cursor-pointer select-none"
                  onClick={() => city && onSelectCity(city)}
                >
                  {l.text}
                </text>
              );
            })}
          </g>

          {/* Norte e escala gráfica 0/25/50 km */}
          {scale && (
            <g transform={`translate(20, ${size.h - 22})`}>
              <path d="M6 -30 L12 -10 L6 -14 L0 -10 Z" fill={C_INK} />
              <text x={6} y={-34} textAnchor="middle" fontSize={11} fontWeight={800} fill={C_INK}>N</text>
              <line x1={28} x2={28 + scale.px50} y1={0} y2={0} stroke={C_INK} />
              {[0, 25, 50].map((v) => {
                const x = 28 + (v === 0 ? 0 : v === 25 ? scale.px25 : scale.px50);
                return (
                  <g key={v}>
                    <line x1={x} x2={x} y1={-4} y2={0} stroke={C_INK} />
                    <text x={x} y={-8} textAnchor="middle" fontSize={10} fill="#58616B">{v === 50 ? '50 km' : v}</text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      )}
    </div>
  );
};
