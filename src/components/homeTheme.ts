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
export const SECTION_PAD = 'px-5 sm:pr-9 sm:pl-[clamp(24px,5vw,86px)]';

export const isValidNumber = (v: unknown): v is number => typeof v === 'number' && !isNaN(v);

// Nível formatado com vírgula; ausente = "--"
export const formatLevel = (v: unknown, digits = 2): string =>
  isValidNumber(v) ? v.toFixed(digits).replace('.', ',') : '--';

export const shortRiverName = (river?: string): string => {
  if (!river) return '';
  return river.toLowerCase().startsWith('rio ') ? river.slice(4).trim() : river;
};
