import { STATUS_COLORS } from '../components/homeTheme';

export interface LevelCotas {
  attention?: number | null;
  alert?: number | null;
  flood?: number | null;
}

export const NORMAL_LEVEL_COLOR = '#4F9BD0';

// Cor do nível segundo as cotas da cidade: azul (normal), amarelo (atenção), laranja (alerta), vermelho (inundação).
// Só considera as cotas válidas (> 0); nível inválido fica azul.
export function levelColor(level: number, cotas: LevelCotas): string {
  if (typeof level !== 'number' || !isFinite(level)) return NORMAL_LEVEL_COLOR;
  const ge = (cota?: number | null) => typeof cota === 'number' && isFinite(cota) && cota > 0 && level >= cota;
  if (ge(cotas.flood)) return STATUS_COLORS.inundacao;
  if (ge(cotas.alert)) return STATUS_COLORS.alerta;
  if (ge(cotas.attention)) return STATUS_COLORS.atencao;
  return NORMAL_LEVEL_COLOR;
}
