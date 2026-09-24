import { STATUS_COLORS } from '../components/homeTheme';

export interface LevelCotas {
  attention?: number | null;
  alert?: number | null;
  flood?: number | null;
}

export const NORMAL_LEVEL_COLOR = '#4F9BD0';

// Cor do nível segundo as cotas da cidade: azul (normal), amarelo (atenção), laranja (alerta), vermelho (inundação).
// Só considera as cotas válidas (> 0); nível inválido fica azul.
// `normalColor` permite usar outra cor para o estado normal (ex.: verde nas linhas de referência do gráfico).
export function levelColor(level: number, cotas: LevelCotas, normalColor: string = NORMAL_LEVEL_COLOR): string {
  if (typeof level !== 'number' || !isFinite(level)) return normalColor;
  const ge = (cota?: number | null) => typeof cota === 'number' && isFinite(cota) && cota > 0 && level >= cota;
  if (ge(cotas.flood)) return STATUS_COLORS.inundacao;
  if (ge(cotas.alert)) return STATUS_COLORS.alerta;
  if (ge(cotas.attention)) return STATUS_COLORS.atencao;
  return normalColor;
}
