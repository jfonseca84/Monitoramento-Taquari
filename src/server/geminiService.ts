import { processHydrologicalQuery, KnowledgeBase, classifyIntent, calculateProjections } from './hydrologicalEngine';

export interface ChatContext {
  cityName: string;
  currentLevel: number;
  statusLevel: string;
  floodThreshold: number;
  safetyMargin: number;
  rateOfChange?: number | string;
  vulnerableAreas?: string[];
  historicalData?: Record<string, string | number>;
  recentHistory?: Array<{ time: string; level: number }>;
  weatherForecast?: {
    rainNextHours?: string;
    rainNextDays?: string;
    expectedVolumeMm?: number | string;
    rainProbabilityPct?: number | string;
    recentAccumulatedMm?: number | string;
    alerts?: string[];
  };
}

/**
 * Atendimento ao usuário via Motor Hidrológico Inteligente próprio.
 * Totalmente independente de APIs externas de IA.
 */
export async function askHydrologicalAssistant(question: string, context: ChatContext): Promise<string> {
  try {
    const answer = processHydrologicalQuery(question, context);
    return answer;
  } catch (error: any) {
    console.error('Erro no Motor Hidrológico Inteligente:', error);
    return generateFallbackResponse(question, context);
  }
}

function generateFallbackResponse(question: string, context: ChatContext): string {
  const levelStr = context.currentLevel.toFixed(2);
  const threshStr = context.floodThreshold.toFixed(2);
  const marginStr = context.safetyMargin.toFixed(2);
  const bairros = context.vulnerableAreas?.join(', ') || 'Conservas, Santo Antônio, Campestre e Centro Baixo';

  return `Análise Integrada de Risco para **${context.cityName}**:\n\n` +
    `• **Nível Atual:** ${levelStr}m (${context.statusLevel})\n` +
    `• **Cota Inicial de Inundação:** ${threshStr}m\n` +
    `• **Margem de Segurança:** ${marginStr} metros\n` +
    `• **Bairros sob Acompanhamento:** ${bairros}.\n\n` +
    `Consulte os boletins oficiais e a Defesa Civil do município para atualizações em tempo real.`;
}

export { KnowledgeBase, classifyIntent, calculateProjections };
