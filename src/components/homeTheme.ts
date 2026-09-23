// Tokens visuais do redesign da página Início (somente apresentação, sem lógica de dados)
import { LevelStatus } from '../types';

export const STATUS_COLORS: Record<LevelStatus, string> = {
  normal: '#3FA46A',
  atencao: '#E9C145',
  alerta: '#E0873A',
  inundacao: '#D9483B'
};

// Cor do texto sobre o fundo de cada status (contraste legível)
export const STATUS_INK: Record<LevelStatus, string> = {
  normal: '#FFFFFF',
  atencao: '#3A2E05',
  alerta: '#2E1A06',
  inundacao: '#FFFFFF'
};

export const STATUS_LABELS: Record<LevelStatus, string> = {
  normal: 'Normal',
  atencao: 'Atenção',
  alerta: 'Alerta',
  inundacao: 'Inundação'
};

export const BASIN_SECTION_TAGS: Record<string, string> = {
  cabeceira: 'CAB',
  montante: 'MONT',
  medio: 'MÉDIO',
  jusante: 'JUS'
};

export const NEWS_CATEGORY_COLORS: Record<string, { bg: string; ink: string }> = {
  'Defesa Civil': { bg: '#F3C9C3', ink: '#8E2A1F' },
  Alertas: { bg: '#F3C9C3', ink: '#8E2A1F' },
  Prefeituras: { bg: '#C6DDF0', ink: '#244C7A' },
  Monitoramento: { bg: '#F2DDB0', ink: '#7A4F12' },
  Meteorologia: { bg: '#BFE3D3', ink: '#1E5B45' }
};

export const HOME_FONT = "font-[family-name:Figtree,system-ui,sans-serif]";

// Superfícies da coluna central (layout novo, somente escuro)
export const SURFACE_A = 'bg-[#2B333D] text-white';
export const SURFACE_B = 'bg-[#222931] text-white';
export const LINE = 'border-[#3A434E]';
export const MUTED = 'text-[#B4B9BF]';
export const SECTION_PAD = 'px-5 sm:pr-9 sm:pl-[clamp(24px,5vw,86px)] lg:pl-[86px]';

// Bacias exibidas na página Início: estações (slugs) de montante para jusante
export type BasinKey = 'taquari' | 'guaiba';
export const BASIN_STATIONS: Record<BasinKey, string[]> = {
  taquari: [
    'santatereza', 'linhajosejulio', 'passocarreiro', 'linhacolombo', 'passotainhas',
    'barradofao', 'mucum', 'encantado', 'rocasales', 'lajeado', 'estrela',
    'cruzeirodosul', 'bomretirodosul', 'portomariante', 'taquari'
  ],
  guaiba: [
    'donafrancisca', 'cachoeiradosul', 'riopardo', 'feliz', 'saosebastiaodocai',
    'montenegro', 'taquara', 'saoleopoldo', 'gravatai', 'portoalegre'
  ]
};
export const BASIN_LABELS: Record<BasinKey, string> = {
  taquari: 'Bacia do Taquari',
  guaiba: 'Bacia do Guaíba'
};
// Cidade exibida ao trocar para a bacia, quando a selecionada é de outra bacia
export const BASIN_DEFAULT_CITY: Record<BasinKey, string> = {
  taquari: 'lajeado',
  guaiba: 'portoalegre'
};
export const basinOfCity = (slug?: string): BasinKey | null =>
  slug && BASIN_STATIONS.guaiba.includes(slug) ? 'guaiba' : slug && BASIN_STATIONS.taquari.includes(slug) ? 'taquari' : null;

// Histórico vindo do banco traz o recorded_at do PostgREST ("...+00:00"). Quando a consulta falha
// ou volta vazia, fetchCityHistory gera uma curva ilustrativa com toISOString() ("...Z");
// esses pontos nunca devem aparecer como leituras.
export const isRealHistory = (points: { timestamp?: string }[] | null | undefined): boolean =>
  Array.isArray(points) &&
  points.length > 0 &&
  points.every((p) => typeof p?.timestamp === 'string' && !p.timestamp.endsWith('Z'));

export const isValidNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);

// Nível formatado com vírgula; ausente = "--"
export const formatLevel = (v: unknown, digits = 2): string =>
  isValidNumber(v) ? v.toFixed(digits).replace('.', ',') : '--';

// Remove o prefixo "Rio " e o artigo (das/dos/da/do) que antecede o nome
const stripRiverPrefixes = (s: string): string =>
  s.trim().replace(/^Rio\s+/i, '').replace(/^(das|dos|da|do)\s+/i, '').trim();

// Nomes compostos (ex.: "Rio Taquari / Rio das Antas") ficam longos demais para a
// coluna estreita da lista de estações. Mantém o primeiro rio por extenso e abrevia
// os demais em 3 letras: "Rio Taquari / Rio das Antas" -> "Taquari/Ant"
export const shortRiverName = (river?: string): string => {
  if (!river) return '';
  const parts = river.split('/').map(stripRiverPrefixes).filter(Boolean);
  if (parts.length <= 1) return parts[0] || '';
  return parts.map((p, i) => (i === 0 ? p : p.length > 4 ? p.slice(0, 3) : p)).join('/');
};
