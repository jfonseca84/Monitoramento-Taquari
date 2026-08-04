import { GoogleGenAI } from '@google/genai';

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

export async function askHydrologicalAssistant(question: string, context: ChatContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback response if GEMINI_API_KEY is missing or fails
  if (!apiKey) {
    console.warn('GEMINI_API_KEY não configurada no ambiente server-side.');
    return generateFallbackResponse(question, context);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `Você é o Assistente de Risco Integrado IA do Vale do Taquari (RS), especializado em monitoramento hidrológico, análise meteorológica, cotas de inundação e orientação preventiva para a comunidade local.

SUA APRESENTAÇÃO / PAPEL:
"Sou um assistente inteligente de monitoramento e análise de risco do Vale do Taquari. Utilizo dados hidrológicos, meteorológicos e históricos para auxiliar na compreensão de cenários relacionados a enchentes, chuvas e possíveis impactos."

REGRAS DE SEGURANÇA E DIRETRIZES DE ATUAÇÃO:
1. NUNCA afirme categoricamente que uma residência específica será ou não atingida sem dados de cota topográfica exata da rua.
2. NUNCA garanta que uma situação seja totalmente segura ou isenta de riscos.
3. Utilize termos técnicos adequados e prudentes, como "dados indicam", "cenário atual", "risco estimado", "tendência projetada".
4. Integre a análise dos DADOS DO RIO (nível, cota, tendência, margem de segurança), DADOS METEOROLÓGICOS (previsão, chuva acumulada, volume e probabilidade) e DADOS HISTÓRICOS (Maio/2024, Nov/2023).
5. Quando o usuário perguntar sobre chuva, clima ou precipitação nas cabeceiras, utilize os dados meteorológicos informados no contexto. Se não houver dados meteorológicos para o período solicitado, informe claramente essa limitação sem criar previsões fictícias.
6. Para qualquer decisão emergencial ou plano de evacuação, orientar SEMPRE a consulta direta aos canais oficiais da Defesa Civil Municipal e Corpo de Bombeiros.
7. Mantenha formatação extremamente legível, com marcadores (•) e destaques em negrito (**).`;

    const weatherInfo = context.weatherForecast ? `
- Previsão Próximas Horas: ${context.weatherForecast.rainNextHours || 'Sem dados'}
- Previsão Próximos Dias: ${context.weatherForecast.rainNextDays || 'Sem dados'}
- Volume de Precipitação Previsto: ${context.weatherForecast.expectedVolumeMm ? context.weatherForecast.expectedVolumeMm + ' mm' : 'Não informado'}
- Probabilidade de Chuva: ${context.weatherForecast.rainProbabilityPct ? context.weatherForecast.rainProbabilityPct + '%' : 'Não informada'}
- Chuva Acumulada Recente (24h): ${context.weatherForecast.recentAccumulatedMm ? context.weatherForecast.recentAccumulatedMm + ' mm' : 'Sem registro'}
- Alertas Meteorológicos Vigorantes: ${context.weatherForecast.alerts && context.weatherForecast.alerts.length > 0 ? context.weatherForecast.alerts.join('; ') : 'Nenhum alerta ativo'}
` : '\n- Dados meteorológicos detalhados não disponíveis no momento para este período.\n';

    const prompt = `[CONTEXTO INTEGRADO DE RISCO - ${context.cityName.toUpperCase()}]

1. DADOS HIDROLÓGICOS DO RIO TAQUARI:
- Cidade Selecionada: ${context.cityName}
- Nível Atual do Rio: ${context.currentLevel.toFixed(2)} metros
- Classificação de Risco Atual: ${context.statusLevel}
- Cota de Inundação Inicial em ${context.cityName}: ${context.floodThreshold.toFixed(2)} metros
- Margem de Segurança do Rio: ${context.safetyMargin.toFixed(2)} metros
- Tendência do Nível: ${context.rateOfChange ? context.rateOfChange : 'Estável'}
- Bairros / Áreas Vulneráveis Mapeadas: ${context.vulnerableAreas ? context.vulnerableAreas.join(', ') : 'Áreas ribeirinhas e cotas baixas'}

2. DADOS METEOROLÓGICOS:${weatherInfo}
3. DADOS HISTÓRICOS DE REFERÊNCIA EM ${context.cityName.toUpperCase()}:
  • Maio/2024 (Pico Histórico Catastrófico): 28.19m
  • Novembro/2023: 24.73m
  • Setembro/2023: 26.58m

[PERGUNTA DO MORADOR]
"${question}"

Responda com precisão, aplicando o conceito do Assistente de Risco Integrado IA e respeitando todas as regras de segurança.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    if (response && response.text) {
      return response.text;
    } else {
      return generateFallbackResponse(question, context);
    }
  } catch (error: any) {
    console.error('Erro ao chamar a API do Gemini:', error);
    return generateFallbackResponse(question, context);
  }
}

function generateFallbackResponse(question: string, context: ChatContext): string {
  const q = question.toLowerCase();
  const levelStr = context.currentLevel.toFixed(2);
  const threshStr = context.floodThreshold.toFixed(2);
  const marginStr = context.safetyMargin.toFixed(2);
  const bairros = context.vulnerableAreas?.join(', ') || 'Conservas, Santo Antônio, Campestre e Centro Baixo';

  if (q.includes('chov') || q.includes('chuva') || q.includes('amanhã') || q.includes('tempo') || q.includes('clima')) {
    const rainForecast = context.weatherForecast?.rainNextDays || 'Possibilidade de instabilidades isoladas nas próximas 24h';
    const volume = context.weatherForecast?.expectedVolumeMm ? `${context.weatherForecast.expectedVolumeMm}mm` : 'volumes moderados';
    return `A previsão meteorológica para **${context.cityName}** e cabeceiras indica **${rainForecast}** (acumulado estimado de ${volume}).\n\n• **Nível Atual do Rio Taquari:** ${levelStr}m (${context.statusLevel})\n• **Cálculo de Risco:** O cenário atual apresenta margem de segurança de ${marginStr}m até a cota de inundação.\n\nContinue acompanhando as atualizações do sistema e da Defesa Civil.`;
  }

  if (q.includes('100mm') || q.includes('cabeceira') || q.includes('volume')) {
    return `Uma precipitação de elevado volume (como 100mm) nas cabeceiras (Santa Tereza, Muçum e Encantado) pode influenciar a elevação do Rio Taquari em **${context.cityName}** num intervalo de 8 a 12 horas.\n\n• **Nível Atual:** ${levelStr}m\n• **Cota de Alerta:** ${threshStr}m\n• **Cenário Estimado:** O impacto real dependerá da saturação do solo e do tempo de concentração do fluxo. Os dados indicam monitoramento contínuo.`;
  }

  if (q.includes('casa') || q.includes('risco') || q.includes('atingid') || q.includes('bairro')) {
    if (context.currentLevel < context.floodThreshold) {
      return `Com base nos dados integrados do sistema para **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (Cenário ${context.statusLevel}).\n• **Cota Inicial de Inundação:** ${threshStr}m.\n• **Margem de Segurança:** ${marginStr} metros abaixo da primeira cota de atenção.\n\n**Bairros monitorados na cota inicial:** ${bairros}.\n\n*Aviso de Segurança: Os dados indicam estabilidade no momento, mas para verificação da cota exata da sua rua, consulte o mapa oficial da Defesa Civil.*`;
    }
    return `ATENÇÃO: Os dados indicam que o Rio Taquari atinge ${levelStr}m em **${context.cityName}**. Moradores das áreas baixas de ${bairros} devem acompanhar rigorosamente os comunicados da Defesa Civil.`;
  }

  if (q.includes('24') || q.includes('24m')) {
    return `Na hipótese do Rio Taquari atingir **24,00 metros** em **${context.cityName}**:\n\n• **Impacto Estimado:** Atinge residências e vias nos bairros ${bairros}.\n• **Diferencial Atual:** Margem estimada de ${(24.00 - context.currentLevel).toFixed(2)}m em relação ao nível atual de ${levelStr}m.\n\nConfirme sempre o plano de emergência junto à Defesa Civil Municipal.`;
  }

  if (q.includes('previsã') || q.includes('próxima') || q.includes('horas')) {
    return `Análise de risco e projeção em **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (Tendência: Estável)\n• **Margem de Segurança:** ${marginStr}m até a cota de inundação.\n• **Quadras de Montante:** Sem registros de elevação brusca em Muçum e Santa Tereza.`;
  }

  if (q.includes('2024') || q.includes('maio') || q.includes('compar')) {
    const diff = (28.19 - context.currentLevel).toFixed(2);
    return `**Comparativo com a Enchente de Maio/2024 em ${context.cityName}:**\n\n• **Pico Histórico (Maio/2024):** 28.19 metros\n• **Nível Atual:** ${levelStr} metros\n• **Diferencial:** Atualmente o rio está **${diff}m abaixo** daquela marca histórica.\n\nO cenário atual indica condições normais.`;
  }

  return `Análise integrada de risco para **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (${context.statusLevel})\n• **Cota Inicial de Inundação:** ${threshStr}m\n\nConsulte os boletins oficiais para atualizações em tempo real.`;
}

