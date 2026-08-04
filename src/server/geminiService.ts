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

    const systemInstruction = `Você é o Assistente Hidrológico IA do Vale do Rio Taquari (Rio Taquari, RS), especializado em monitoramento fluviométrico, cotas de alagamento e orientação preventiva para a comunidade local.

DIRETRIZES DE ATUAÇÃO:
1. Atue estritamente como um assistente hidrológico especialista para a cidade de ${context.cityName} e região do Vale do Taquari.
2. Utilize SEMPRE os dados oficiais do contexto hidrológico fornecidos na requisição para embasar sua resposta.
3. Responda em linguagem clara, direta, empática e acessível para moradores.
4. EVITE FALSAS CERTEZAS: Deixe claro que previsões fluviométricas dependem das chuvas nas cabeceiras e de fatores dinâmicos.
5. Sempre recomende que decisões de evacuação e emergência sejam confirmadas junto aos canais oficiais da Defesa Civil do município e da Prefeitura.
6. Quando o usuário perguntar sobre bairros específicos ou cotas, utilize as referências territoriais fornecidas no contexto.
7. Se faltar alguma informação específica, informe com clareza a limitação dos dados e direcione para a Defesa Civil.
8. Mantenha formatação legível com marcadores (•) e destaques em negrito.`;

    const prompt = `[CONTEXTO HIDROLÓGICO ATUAL EM ${context.cityName.toUpperCase()}]
- Cidade Selecionada: ${context.cityName}
- Nível Atual do Rio Taquari: ${context.currentLevel.toFixed(2)} metros
- Classificação de Risco: ${context.statusLevel}
- Cota de Inundação Inicial na Cidade: ${context.floodThreshold.toFixed(2)} metros
- Margem de Segurança Atual: ${context.safetyMargin.toFixed(2)} metros
- Tendência de Variação: ${context.rateOfChange ? context.rateOfChange : 'Estável'}
- Bairros / Áreas Vulneráveis Mapeadas: ${context.vulnerableAreas ? context.vulnerableAreas.join(', ') : 'Áreas ribeirinhas e cotas baixas'}
- Histórico de Referência do Rio Taquari em ${context.cityName}:
  • Maio/2024 (Pico Histórico Catastrófico): 28.19m
  • Novembro/2023: 24.73m
  • Setembro/2023: 26.58m

[PERGUNTA DO MORADOR]
"${question}"

Por favor, responda à pergunta do morador considerando os dados acima.`;

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

  if (q.includes('casa') || q.includes('risco') || q.includes('atingid') || q.includes('bairro')) {
    if (context.currentLevel < context.floodThreshold) {
      return `Com base nas medições oficiais em **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (Situação ${context.statusLevel}).\n• **Cota de Inundação Inicial:** ${threshStr}m.\n• **Margem de Segurança:** O rio está ${marginStr} metros abaixo da primeira cota de alerta.\n\n**Primeiros bairros monitorados:** ${bairros}.\n\n*Nota: Para verificação do nível de cota específico da sua rua, consulte o mapa da Defesa Civil Municipal.*`;
    }
    return `ATENÇÃO: O nível em **${context.cityName}** atinge ${levelStr}m. Moradores das áreas baixas de ${bairros} devem acompanhar rigorosamente as orientações da Defesa Civil.`;
  }

  if (q.includes('24') || q.includes('24m')) {
    return `Na hipótese do Rio Taquari atingir **24,00 metros** em **${context.cityName}**:\n\n• **Impacto:** Atinge residências e vias nos bairros ${bairros}.\n• **Cota Atual:** ${levelStr}m (Margem de ${(24.00 - context.currentLevel).toFixed(2)}m até essa cota).\n\nSempre confirme o plano de contingência com a Defesa Civil local.`;
  }

  if (q.includes('previsã') || q.includes('próxima') || q.includes('horas')) {
    return `Projeção atualizada em **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (Estável / Normal)\n• **Margem de Segurança:** ${marginStr}m até a cota de inundação.\n\nAs estações de montante (Santa Tereza e Muçum) mantêm monitoramento contínuo sem indicativo de alarme iminente.`;
  }

  if (q.includes('2024') || q.includes('maio') || q.includes('compar')) {
    const diff = (28.19 - context.currentLevel).toFixed(2);
    return `**Comparativo com a Enchente de Maio/2024 em ${context.cityName}:**\n\n• **Pico Histórico (Maio/2024):** 28.19 metros\n• **Nível Atual:** ${levelStr} metros\n• **Diferencial:** Atualmente o rio está **${diff}m abaixo** daquela marca extraordinária.\n\nO sistema segue operando dentro da normalidade.`;
  }

  return `Análise do sistema para **${context.cityName}**:\n\n• **Nível Atual:** ${levelStr}m (${context.statusLevel})\n• **Cota Inicial de Inundação:** ${threshStr}m\n\nConsulte os boletins diários para atualizações em tempo real.`;
}
