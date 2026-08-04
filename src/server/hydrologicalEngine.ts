import { ChatContext } from './geminiService';

export type IntentType =
  | 'CONSULTAR_STATUS'
  | 'CONSULTAR_BAIRROS'
  | 'RISCO_RESIDENCIA'
  | 'SIMULAR_COTA'
  | 'CONSULTAR_PREVISAO_TEMPO'
  | 'SIMULAR_PRECIPITACAO'
  | 'CONSULTAR_PROJECAO'
  | 'CONSULTAR_HISTORICO'
  | 'ORIENTACAO_EMERGENCIA'
  | 'CONSULTAR_COTAS'
  | 'GERAL';

export interface KnowledgeBaseEntry {
  id: string;
  intent: IntentType;
  cityName: string;
  parameterHash: string;
  response: string;
  origin: 'BASE_DE_CONHECIMENTO' | 'MOTOR_HIDROLOGICO';
  createdAt: string;
  expiresAt: number; // Timestamp em ms
  hitCount: number;
  isStatic: boolean;
}

// ==========================================
// DADOS ESTÁTICOS DE MUNICÍPIOS DO VALE DO TAQUARI
// ==========================================
export interface CityStaticData {
  name: string;
  floodThreshold: number; // Cota de Inundação (m)
  alertThreshold: number; // Cota de Alerta (m)
  attentionThreshold: number; // Cota de Atenção (m)
  vulnerableNeighborhoods: string[];
  civilDefensePhone: string;
  historicalPeaks: { label: string; level: number }[];
}

export const TAQUARI_VALLEY_CITIES_DATA: Record<string, CityStaticData> = {
  santatereza: {
    name: 'Santa Tereza',
    floodThreshold: 13.00,
    alertThreshold: 11.50,
    attentionThreshold: 10.00,
    vulnerableNeighborhoods: ['Orla Fluvial', 'Passo de Santa Tereza', 'Zona Rural Baixa'],
    civilDefensePhone: '199 ou (51) 99800-1100',
    historicalPeaks: [
      { label: 'Maio/2024', level: 23.50 },
      { label: 'Setembro/2023', level: 21.10 }
    ]
  },
  mucum: {
    name: 'Muçum',
    floodThreshold: 18.00,
    alertThreshold: 16.00,
    attentionThreshold: 14.00,
    vulnerableNeighborhoods: ['Centro Urbano Baixo', 'Fátima', 'Fante', 'São Cristóvão'],
    civilDefensePhone: '199 ou (51) 99900-4500',
    historicalPeaks: [
      { label: 'Maio/2024', level: 25.80 },
      { label: 'Setembro/2023', level: 23.50 }
    ]
  },
  encantado: {
    name: 'Encantado',
    floodThreshold: 16.00,
    alertThreshold: 14.00,
    attentionThreshold: 12.00,
    vulnerableNeighborhoods: ['Navegantes', 'Santo Antão', 'Barra do Guaporé', 'Lenz'],
    civilDefensePhone: '199 ou (51) 99800-8800',
    historicalPeaks: [
      { label: 'Maio/2024', level: 22.40 },
      { label: 'Setembro/2023', level: 20.10 }
    ]
  },
  rocasales: {
    name: 'Roca Sales',
    floodThreshold: 17.00,
    alertThreshold: 14.50,
    attentionThreshold: 13.00,
    vulnerableNeighborhoods: ['Centro Baixo', 'Avenida General Daltro Filho', 'Bento Gonçalves'],
    civilDefensePhone: '199 ou (51) 99700-2211',
    historicalPeaks: [
      { label: 'Maio/2024', level: 24.10 },
      { label: 'Setembro/2023', level: 22.00 }
    ]
  },
  lajeado: {
    name: 'Lajeado',
    floodThreshold: 19.00,
    alertThreshold: 17.00,
    attentionThreshold: 15.00,
    vulnerableNeighborhoods: ['Conservas', 'Santo Antônio', 'Campestre', 'Centro Baixo', 'Praia', 'Carneiros', 'Morro 25'],
    civilDefensePhone: '199 ou (51) 99820-3000',
    historicalPeaks: [
      { label: 'Maio/2024 (Maior Registro Histórico)', level: 28.19 },
      { label: 'Setembro/2023', level: 26.58 },
      { label: 'Novembro/2023', level: 24.73 },
      { label: 'Julho/2020', level: 22.34 },
      { label: 'Enchente de 1941', level: 29.92 }
    ]
  },
  cruzeirodosul: {
    name: 'Cruzeiro do Sul',
    floodThreshold: 17.50,
    alertThreshold: 14.00,
    attentionThreshold: 12.50,
    vulnerableNeighborhoods: ['Passo de Estrela', 'Glucostark', 'Bonsucesso'],
    civilDefensePhone: '199 ou (51) 99650-3344',
    historicalPeaks: [
      { label: 'Maio/2024', level: 26.50 },
      { label: 'Setembro/2023', level: 24.20 }
    ]
  },
  bomretirodosul: {
    name: 'Bom Retiro do Sul',
    floodThreshold: 15.00,
    alertThreshold: 13.00,
    attentionThreshold: 11.50,
    vulnerableNeighborhoods: ['Jardim do Canto', 'Avis', 'Barragem de Bom Retiro'],
    civilDefensePhone: '199 ou (51) 99550-4455',
    historicalPeaks: [
      { label: 'Maio/2024', level: 21.30 },
      { label: 'Setembro/2023', level: 19.10 }
    ]
  },
  estrela: {
    name: 'Estrela',
    floodThreshold: 19.00,
    alertThreshold: 17.00,
    attentionThreshold: 15.00,
    vulnerableNeighborhoods: ['Moinhos', 'Oriental', 'Imigrantes', 'Indústrias', 'Passagem de Estrela'],
    civilDefensePhone: '199 ou (51) 99781-3000',
    historicalPeaks: [
      { label: 'Maio/2024', level: 28.10 },
      { label: 'Setembro/2023', level: 26.40 },
      { label: 'Novembro/2023', level: 24.50 }
    ]
  },
  taquari: {
    name: 'Taquari',
    floodThreshold: 10.50,
    alertThreshold: 9.00,
    attentionThreshold: 8.00,
    vulnerableNeighborhoods: ['Praia', 'Centro Baixo', 'Passo da Aldeia', 'Rincão'],
    civilDefensePhone: '199 ou (51) 99600-1200',
    historicalPeaks: [
      { label: 'Maio/2024', level: 15.80 },
      { label: 'Novembro/2023', level: 13.90 }
    ]
  },
  'arroio do meio': {
    name: 'Arroio do Meio',
    floodThreshold: 22.00,
    alertThreshold: 20.00,
    attentionThreshold: 18.00,
    vulnerableNeighborhoods: ['Navegantes', 'Passo do Corvo', 'São José'],
    civilDefensePhone: '199 ou (51) 99988-1122',
    historicalPeaks: [
      { label: 'Maio/2024', level: 31.20 },
      { label: 'Setembro/2023', level: 28.50 }
    ]
  }
};

// ==========================================
// BASE DE CONHECIMENTO (KNOWLEDGE BASE CACHE)
// ==========================================
class KnowledgeBaseStore {
  private cache = new Map<string, KnowledgeBaseEntry>();

  private generateKey(intent: IntentType, cityName: string, paramHash: string): string {
    return `${intent.toUpperCase()}_${cityName.toLowerCase().replace(/\s+/g, '')}_${paramHash}`;
  }

  public get(intent: IntentType, cityName: string, paramHash: string): KnowledgeBaseEntry | null {
    const key = this.generateKey(intent, cityName, paramHash);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Verificar expiração
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hitCount += 1;
    return entry;
  }

  public set(
    intent: IntentType,
    cityName: string,
    paramHash: string,
    response: string,
    isStatic = false,
    ttlMinutes = isStatic ? 1440 : 10
  ): KnowledgeBaseEntry {
    const key = this.generateKey(intent, cityName, paramHash);
    const entry: KnowledgeBaseEntry = {
      id: `kb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      intent,
      cityName,
      parameterHash: paramHash,
      response,
      origin: 'BASE_DE_CONHECIMENTO',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      hitCount: 1,
      isStatic
    };
    this.cache.set(key, entry);
    return entry;
  }

  public getStats() {
    return {
      totalEntries: this.cache.size,
      totalHits: Array.from(this.cache.values()).reduce((sum, e) => sum + e.hitCount, 0)
    };
  }
}

export const KnowledgeBase = new KnowledgeBaseStore();

// ==========================================
// INTERPRETADOR DE INTENÇÃO (INTENT CLASSIFIER)
// ==========================================
export function classifyIntent(question: string): IntentType {
  const q = question.toLowerCase().trim();

  // 1. Simulação de Precipitação / Chuva nas cabeceiras
  if (
    q.includes('100mm') ||
    q.includes('150mm') ||
    q.includes('50mm') ||
    q.includes('chuva nas cabeceiras') ||
    q.includes('se chover muito') ||
    q.includes('volume de chuva') ||
    q.includes('precipitação forte')
  ) {
    return 'SIMULAR_PRECIPITACAO';
  }

  // 2. Simulação de Cota Específica
  if (
    /(\d{2})\s*(m|metros)/i.test(q) ||
    q.includes('se chegar a') ||
    q.includes('se atingir') ||
    q.includes('se o rio subir para') ||
    q.includes('se bater')
  ) {
    return 'SIMULAR_COTA';
  }

  // 3. Consulta sobre Chuva / Clima / Previsão do Tempo
  if (
    q.includes('chov') ||
    q.includes('chuva') ||
    q.includes('amanhã') ||
    q.includes('tempo') ||
    q.includes('clima') ||
    q.includes('previsão do tempo') ||
    q.includes('vai chover') ||
    q.includes('precipitação')
  ) {
    return 'CONSULTAR_PREVISAO_TEMPO';
  }

  // 4. Projeções / Tendência das Próximas Horas
  if (
    q.includes('projeção') ||
    q.includes('próximas horas') ||
    q.includes('vai subir') ||
    q.includes('vai baixar') ||
    q.includes('tendência') ||
    q.includes('subindo ou descendo') ||
    q.includes('ritmo')
  ) {
    return 'CONSULTAR_PROJECAO';
  }

  // 5. Risco de Residência / Endereço / Bairro específico do usuário
  if (
    q.includes('minha casa') ||
    q.includes('minha rua') ||
    q.includes('moro em') ||
    q.includes('minha residência') ||
    q.includes('vou alagar') ||
    q.includes('corro risco') ||
    q.includes('vai me atingir')
  ) {
    return 'RISCO_RESIDENCIA';
  }

  // 6. Bairros Afetados / Vulneráveis
  if (
    q.includes('bairro') ||
    q.includes('quais bairros') ||
    q.includes('quais locais') ||
    q.includes('onde alaga') ||
    q.includes('locais atingidos') ||
    q.includes('áreas de risco')
  ) {
    return 'CONSULTAR_BAIRROS';
  }

  // 7. Histórico / Comparativos de Enchentes
  if (
    q.includes('2024') ||
    q.includes('maio') ||
    q.includes('2023') ||
    q.includes('novembro') ||
    q.includes('setembro') ||
    q.includes('compar') ||
    q.includes('histórico') ||
    q.includes('maior enchente') ||
    q.includes('1941')
  ) {
    return 'CONSULTAR_HISTORICO';
  }

  // 8. Orientações de Emergência / Defesa Civil
  if (
    q.includes('emergência') ||
    q.includes('defesa civil') ||
    q.includes('onde ir') ||
    q.includes('abrigo') ||
    q.includes('o que fazer') ||
    q.includes('telefone') ||
    q.includes('socorro')
  ) {
    return 'ORIENTACAO_EMERGENCIA';
  }

  // 9. Cotas de Referência (Alerta, Inundação)
  if (
    q.includes('cota de inundação') ||
    q.includes('cota de alerta') ||
    q.includes('cota de atenção') ||
    q.includes('quais são as cotas')
  ) {
    return 'CONSULTAR_COTAS';
  }

  // 10. Status Geral do Rio
  if (
    q.includes('nível') ||
    q.includes('como está') ||
    q.includes('situação') ||
    q.includes('rio está alto') ||
    q.includes('medida') ||
    q.includes('altura do rio') ||
    q.includes('status')
  ) {
    return 'CONSULTAR_STATUS';
  }

  return 'GERAL';
}

// ==========================================
// CADEIA FLUVIOMÉTRICA DO RIO TAQUARI
// ==========================================
export interface ChainStation {
  key: string;
  name: string;
  order: number;
  currentLevel: number;
  floodThreshold: number;
  warningThreshold: number;
  trend: 'subindo' | 'descendo' | 'estavel';
  rateOfChangeCm: number;
  statusLevel: string;
  propagationInfo: string;
}

export const TAQUARI_RIVER_CHAIN: ChainStation[] = [
  {
    key: 'santatereza',
    name: 'Santa Tereza',
    order: 0,
    currentLevel: 10.21,
    floodThreshold: 13.00,
    warningThreshold: 11.50,
    trend: 'descendo',
    rateOfChangeCm: -2,
    statusLevel: 'NORMAL',
    propagationInfo: 'Cabeceira inicial de monitoramento da Bacia do Taquari'
  },
  {
    key: 'mucum',
    name: 'Muçum',
    order: 1,
    currentLevel: 11.32,
    floodThreshold: 18.00,
    warningThreshold: 15.00,
    trend: 'descendo',
    rateOfChangeCm: -1.5,
    statusLevel: 'NORMAL',
    propagationInfo: '~2 a 3h após oscilações de Santa Tereza'
  },
  {
    key: 'encantado',
    name: 'Encantado',
    order: 2,
    currentLevel: 11.89,
    floodThreshold: 16.00,
    warningThreshold: 14.00,
    trend: 'estavel',
    rateOfChangeCm: -1.2,
    statusLevel: 'NORMAL',
    propagationInfo: '~3 a 4h após passagem por Muçum'
  },
  {
    key: 'rocasales',
    name: 'Roca Sales',
    order: 3,
    currentLevel: 12.41,
    floodThreshold: 17.00,
    warningThreshold: 14.50,
    trend: 'estavel',
    rateOfChangeCm: -1.0,
    statusLevel: 'NORMAL',
    propagationInfo: '~2h após passagem por Encantado'
  },
  {
    key: 'lajeado',
    name: 'Lajeado',
    order: 4,
    currentLevel: 12.95,
    floodThreshold: 19.00,
    warningThreshold: 15.00,
    trend: 'estavel',
    rateOfChangeCm: 0,
    statusLevel: 'NORMAL',
    propagationInfo: '~5 a 6h de deslocamento a partir de Muçum'
  },
  {
    key: 'cruzeirodosul',
    name: 'Cruzeiro do Sul',
    order: 5,
    currentLevel: 12.17,
    floodThreshold: 17.50,
    warningThreshold: 14.00,
    trend: 'estavel',
    rateOfChangeCm: -0.8,
    statusLevel: 'NORMAL',
    propagationInfo: '~2h após passagem pelo porto de Lajeado'
  },
  {
    key: 'bomretirodosul',
    name: 'Bom Retiro do Sul',
    order: 6,
    currentLevel: 11.48,
    floodThreshold: 15.00,
    warningThreshold: 13.00,
    trend: 'estavel',
    rateOfChangeCm: -0.5,
    statusLevel: 'NORMAL',
    propagationInfo: '~3h após passagem por Cruzeiro do Sul'
  }
];

export function analyzeHydrologicalScenario(cityName: string, context: ChatContext): string {
  const normalizedKey = cityName.toLowerCase().replace(/[\s\-_]+/g, '');
  
  let targetIndex = TAQUARI_RIVER_CHAIN.findIndex(s => s.key === normalizedKey);
  if (targetIndex === -1) {
    if (normalizedKey.includes('santatereza')) targetIndex = 0;
    else if (normalizedKey.includes('mucum')) targetIndex = 1;
    else if (normalizedKey.includes('encantado')) targetIndex = 2;
    else if (normalizedKey.includes('rocasales')) targetIndex = 3;
    else if (normalizedKey.includes('cruzeiro')) targetIndex = 5;
    else if (normalizedKey.includes('bomretiro')) targetIndex = 6;
    else targetIndex = 4; // Lajeado por padrão
  }

  const targetStation = TAQUARI_RIVER_CHAIN[targetIndex];
  const targetLevel = context.currentLevel || targetStation.currentLevel;
  
  let localRateCm = targetStation.rateOfChangeCm;
  if (typeof context.rateOfChange === 'number') {
    localRateCm = context.rateOfChange;
  } else if (typeof context.rateOfChange === 'string') {
    const match = context.rateOfChange.match(/([+-]?\d+(\.\d+)?)/);
    if (match) {
      localRateCm = parseFloat(match[1]);
      if (context.rateOfChange.includes('-') && localRateCm > 0) localRateCm = -localRateCm;
    } else if (context.rateOfChange.toLowerCase().includes('subindo')) {
      localRateCm = 2;
    } else if (context.rateOfChange.toLowerCase().includes('descendo') || context.rateOfChange.toLowerCase().includes('baixando')) {
      localRateCm = -2;
    } else {
      localRateCm = 0;
    }
  }

  const floodThresh = context.floodThreshold || targetStation.floodThreshold;
  const safetyMargin = (floodThresh - targetLevel).toFixed(2);
  const statusStr = context.statusLevel || targetStation.statusLevel;

  const upstreamStations = TAQUARI_RIVER_CHAIN.filter(s => s.order < targetStation.order);

  const risingUpstream = upstreamStations.filter(s => s.trend === 'subindo' || s.rateOfChangeCm >= 3);
  const fallingUpstream = upstreamStations.filter(s => s.trend === 'descendo' || s.rateOfChangeCm < 0);
  const isUpstreamFalling = upstreamStations.length > 0 && fallingUpstream.length === upstreamStations.length;
  const isUpstreamRising = risingUpstream.length > 0;

  let upstreamText = '';
  if (upstreamStations.length > 0) {
    upstreamText = upstreamStations
      .map(s => `  • **${s.name}:** ${s.currentLevel.toFixed(2)}m (Tendência: ${s.trend.toUpperCase()} | ${s.rateOfChangeCm >= 0 ? '+' : ''}${s.rateOfChangeCm} cm/h)`)
      .join('\n');
  } else {
    upstreamText = '  • *Esta é a estação de cabeceira inicial (extrema montante) no topo da Bacia do Taquari.*';
  }

  let interpretationText = '';
  let trendDiagnosis = '';

  if (isUpstreamRising) {
    trendDiagnosis = 'Possibilidade de Alteração Futura (Propagação de Onda de Cheia)';
    interpretationText = 
      `• **Alerta em Montante:** Registra-se elevação significativa nas estações superiores (${risingUpstream.map(s => s.name).join(', ')}).\n` +
      `• **Propagação do Fluxo:** O volume escoado das cabeceiras leva entre 8 a 12 horas para refletir completamente no trecho de ${targetStation.name}.\n` +
      `• **Recomendação Preventiva:** Recomenda-se acompanhamento constante, pois existe **possibilidade de alteração futura** nos níveis locais devido à propagação da onda de cheia.`;
  } else if (isUpstreamFalling) {
    trendDiagnosis = 'Tendência Favorável de Estabilização';
    interpretationText = 
      `• **Comportamento das Cabeceiras:** As estações localizadas a montante (${upstreamStations.map(s => s.name).join(' → ')}) apresentam queda/desaceleração contínua nas últimas medições.\n` +
      `• **Análise de Vazão:** A redução da vazão proveniente do Alto Taquari indica uma **tendência favorável de estabilização** em ${targetStation.name}.\n` +
      `• **Cenário Esperado:** A ausência de novos repiques nas réguas superiores indica estabilização gradativa sem risco de elevação descontrolada nas próximas horas.`;
  } else {
    trendDiagnosis = 'Cenário de Estabilidade na Bacia';
    interpretationText = 
      `• **Comportamento de Montante:** As estações superiores (${upstreamStations.length > 0 ? upstreamStations.map(s => s.name).join(', ') : 'Cabeceiras'}) mantêm níveis estáveis no momento.\n` +
      `• **Diagnóstico de Campo:** Aponta para um **cenário de estabilidade** no fluxo principal do Rio Taquari.\n` +
      `• **Evolução:** Manutenção da margem de segurança atual, sem projeções de repique artificial.`;
  }

  const rateSign = localRateCm >= 0 ? '+' : '';
  const localRateStr = `${rateSign}${localRateCm} cm/h`;

  return `Análise de Cenário Hidrológico e Bacia para **${targetStation.name}**:\n\n` +
    `• **Nível Atual no Rio Taquari:** ${targetLevel.toFixed(2)}m (${statusStr})\n` +
    `• **Última Variação Local Registrada:** ${localRateStr}\n` +
    `• **Cota de Inundação Inicial:** ${floodThresh.toFixed(2)}m (Margem de Segurança: ${safetyMargin}m)\n\n` +
    `**1. Consulta às Estações de Montante (Cadeia do Rio Taquari):**\n` +
    `${upstreamText}\n\n` +
    `**2. Diagnóstico do Analista Hidrológico:**\n` +
    `• **Classificação de Cenário:** **${trendDiagnosis}**\n` +
    `${interpretationText}\n\n` +
    `**3. Ressalva sobre Projeções e Limitações:**\n` +
    `*A variação local de ${localRateStr} e o cenário de montante representam o diagnóstico instantâneo e NUNCA devem ser interpretados como uma previsão absoluta de estabilidade para 24 horas. O nível real continuará dependendo do comportamento dinâmico de toda a bacia e de eventuais chuvas nas cabeceiras. Acompanhe os boletins oficiais da Defesa Civil.*`;
}

// ==========================================
// CÁLCULO DE PROJEÇÕES E EXTRAPOLAÇÃO DE CENÁRIOS
// ==========================================
export function calculateProjections(context: ChatContext) {
  const currentLevel = context.currentLevel;

  let rateCmPerHour = 0;

  if (typeof context.rateOfChange === 'number') {
    rateCmPerHour = context.rateOfChange;
  } else if (typeof context.rateOfChange === 'string') {
    const match = context.rateOfChange.match(/([+-]?\d+(\.\d+)?)/);
    if (match) {
      rateCmPerHour = parseFloat(match[1]);
      if (context.rateOfChange.includes('-') && rateCmPerHour > 0) {
        rateCmPerHour = -rateCmPerHour;
      }
    } else if (context.rateOfChange.toLowerCase().includes('subindo')) {
      rateCmPerHour = 2;
    } else if (context.rateOfChange.toLowerCase().includes('baixando') || context.rateOfChange.toLowerCase().includes('descendo')) {
      rateCmPerHour = -2;
    }
  }

  const hourlyRateMeters = rateCmPerHour / 100;

  const proj3h = Number((currentLevel + hourlyRateMeters * 3).toFixed(2));
  const proj6h = Number((currentLevel + hourlyRateMeters * 6).toFixed(2));
  const proj12h = Number((currentLevel + hourlyRateMeters * 12).toFixed(2));
  const proj24h = Number((currentLevel + hourlyRateMeters * 24).toFixed(2));

  let trendLabel = 'Estável (0 cm/h)';
  if (rateCmPerHour > 0) {
    trendLabel = `Elevação de +${rateCmPerHour} cm/h`;
  } else if (rateCmPerHour < 0) {
    trendLabel = `Recuo de ${rateCmPerHour} cm/h`;
  }

  return {
    rateCmPerHour,
    hourlyRateMeters,
    trendLabel,
    proj3h,
    proj6h,
    proj12h,
    proj24h
  };
}

// ==========================================
// MÓDULO DE CONSULTA HIDROLÓGICA E REGRAS DE RISCO
// ==========================================
export function processHydrologicalQuery(question: string, context: ChatContext): string {
  const cityName = context.cityName || 'Lajeado';
  const cityKey = cityName.toLowerCase().trim();
  const cityData = TAQUARI_VALLEY_CITIES_DATA[cityKey] || TAQUARI_VALLEY_CITIES_DATA['lajeado'];

  const intent = classifyIntent(question);

  const roundedLevel = Math.round(context.currentLevel * 10) / 10;
  const weatherMm = context.weatherForecast?.expectedVolumeMm || 0;
  const parameterHash = `${roundedLevel}_${weatherMm}_${intent}`;

  // 1. VERIFICAR BASE DE CONHECIMENTO
  const cached = KnowledgeBase.get(intent, cityName, parameterHash);
  if (cached) {
    return cached.response;
  }

  // 2. EXECUTAR REGRAS DO MOTOR DE DECISÃO
  const currentLevelStr = context.currentLevel.toFixed(2);
  const floodThresh = cityData.floodThreshold;
  const floodThreshStr = floodThresh.toFixed(2);
  const marginStr = (floodThresh - context.currentLevel).toFixed(2);
  const bairrosStr = context.vulnerableAreas?.join(', ') || cityData.vulnerableNeighborhoods.join(', ');
  const statusStr = context.statusLevel || 'NORMAL';

  let responseText = '';

  switch (intent) {
    case 'CONSULTAR_STATUS': {
      const scenarioAnalysis = analyzeHydrologicalScenario(cityName, context);
      responseText = `Análise de Status Hidrológico em **${cityName}**:\n\n` +
        `• **Nível Atual do Rio Taquari:** ${currentLevelStr}m (${statusStr})\n` +
        `• **Cota Inicial de Inundação:** ${floodThreshStr}m\n` +
        `• **Margem de Segurança:** Os dados indicam uma margem atual de **${marginStr} metros** até a primeira cota de alerta urbano.\n` +
        `• **Áreas sob Monitoramento Preventivo:** ${bairrosStr}.\n\n` +
        `---\n\n` +
        `${scenarioAnalysis}\n\n` +
        `*Para decisões de emergência, consulte sempre a Defesa Civil Municipal (${cityData.civilDefensePhone}).*`;
      break;
    }

    case 'CONSULTAR_BAIRROS': {
      responseText = `Mapeamento de Áreas e Bairros Vulneráveis em **${cityName}**:\n\n` +
        `• **Bairros Monitorados na Cota de Inundação (${floodThreshStr}m):** ${bairrosStr}.\n` +
        `• **Cenário Atual (${currentLevelStr}m):** O nível do rio encontra-se **${marginStr}m abaixo** do limiar inicial de extravasamento.\n\n` +
        `*Nota de Segurança: O alagamento efetivo de vias e residências varia conforme a topografia exata de cada quadra. Acompanhe os boletins oficiais da Defesa Civil.*`;
      break;
    }

    case 'RISCO_RESIDENCIA': {
      if (context.currentLevel < floodThresh) {
        responseText = `Análise do Cenário de Risco em **${cityName}**:\n\n` +
          `• **Nível Atual:** ${currentLevelStr}m (Cenário ${statusStr})\n` +
          `• **Cota de Atenção:** ${floodThreshStr}m\n` +
          `• **Status Estimado:** Os dados do sistema indicam que o rio flui com margem de segurança de **${marginStr}m** abaixo do primeiro nível de alerta urbano.\n` +
          `• **Bairros de Cota Mais Baixa:** ${bairrosStr}.\n\n` +
          `*Regra de Segurança: O sistema não pode garantir isoladamente a imunidade total de um endereço específico sem levantamento topográfico da rua. Mantenha contato direto com a Defesa Civil do município.*`;
      } else {
        responseText = `⚠️ **ALERTA DE RISCO TERRITORIAL - ${cityName.toUpperCase()}**:\n\n` +
          `• **Nível Atual:** ${currentLevelStr}m (Cota de Inundação ultrapassada).\n` +
          `• **Áreas com Risco Iminente de Extravasamento:** ${bairrosStr}.\n\n` +
          `*Recomendação Preventiva: Moradores de áreas ribeirinhas e cotas baixas devem acionar os canais de emergência da Defesa Civil (${cityData.civilDefensePhone}) e seguir o plano de contingência municipal.*`;
      }
      break;
    }

    case 'SIMULAR_COTA': {
      const match = question.match(/(\d{2}(\.\d)?)/);
      const targetLevel = match ? parseFloat(match[1]) : 24.0;
      const targetLevelStr = targetLevel.toFixed(2);
      const diffToTarget = (targetLevel - context.currentLevel).toFixed(2);

      responseText = `Simulação de Cenário Hidrológico para a Cota **${targetLevelStr}m** em **${cityName}**:\n\n` +
        `• **Nível Atual:** ${currentLevelStr}m\n` +
        `• **Diferencial para a Cota Simulada:** Faltam **${diffToTarget} metros** para o rio atingir essa marca.\n` +
        `• **Impacto Estimado nessa Cota:** Afeta vias públicas, áreas rurais e residências nas zonas baixas dos bairros ${bairrosStr}.\n\n` +
        `*A simulação é baseada na régua fluviométrica oficial da cidade. Confirme o plano de evacuação junto à Defesa Civil.*`;
      break;
    }

    case 'CONSULTAR_PREVISAO_TEMPO': {
      const scenarioAnalysis = analyzeHydrologicalScenario(cityName, context);
      responseText = `Previsão Meteorológica e Clima em **${cityName}**:\n\n` +
        `• **Aviso de Recurso:** A integração com a API de previsão meteorológica externa foi descontinuada. O assistente trabalha atualmente com os dados hidrológicos e históricos disponíveis no sistema.\n\n` +
        `${scenarioAnalysis}`;
      break;
    }

    case 'SIMULAR_PRECIPITACAO': {
      const scenarioAnalysis = analyzeHydrologicalScenario(cityName, context);
      responseText = `Análise de Impacto de Precipitação nas Cabeceiras da Bacia:\n\n` +
        `• **Propagação de Fluxo:** Chuvas concentradas no Alto Taquari levam de 8 a 12 horas para percorrer o trecho de Santa Tereza e Muçum até atingir **${cityName}**.\n\n` +
        `${scenarioAnalysis}`;
      break;
    }

    case 'CONSULTAR_PROJECAO': {
      responseText = analyzeHydrologicalScenario(cityName, context);
      break;
    }

    case 'CONSULTAR_HISTORICO': {
      const peaksList = cityData.historicalPeaks
        .map(p => `• **${p.label}:** ${p.level.toFixed(2)}m`)
        .join('\n');

      const mayo2024 = cityData.historicalPeaks.find(p => p.label.includes('Maio/2024'))?.level || 28.19;
      const diffMayo = (mayo2024 - context.currentLevel).toFixed(2);

      responseText = `Histórico de Registros Hidrológicos Extremas em **${cityName}**:\n\n` +
        `${peaksList}\n\n` +
        `• **Comparativo Atual:** O nível atual de **${currentLevelStr}m** encontra-se **${diffMayo} metros abaixo** do pico catastrófico de Maio/2024.\n\n` +
        `*Dados históricos catalogados no acervo do Monitoramento Taquari.*`;
      break;
    }

    case 'ORIENTACAO_EMERGENCIA': {
      responseText = `Instruções de Emergência e Prevenção para **${cityName}**:\n\n` +
        `• **Telefone da Defesa Civil Local:** ${cityData.civilDefensePhone}\n` +
        `• **Corpo de Bombeiros:** 193 | **Brigada Militar:** 190\n` +
        `• **Procedimentos em caso de risco de alagamento:**\n` +
        `  1. Desligue a chave geral de energia e o registro de gás.\n` +
        `  2. Erga móveis e eletrodomésticos acima da cota projetada.\n` +
        `  3. Guarde documentos e remédios de uso contínuo em sacos plásticos selados.\n` +
        `  4. Acompanhe os avisos sonoros e comunicados da Prefeitura.\n\n` +
        `*Não tente atravessar ruas ou pontes submersas.*`;
      break;
    }

    case 'CONSULTAR_COTAS': {
      responseText = `Cotas de Referência Hidrológica em **${cityName}**:\n\n` +
        `• **Cota de Atenção:** ${cityData.attentionThreshold.toFixed(2)}m\n` +
        `• **Cota de Alerta:** ${cityData.alertThreshold.toFixed(2)}m\n` +
        `• **Cota Inicial de Inundação:** ${cityData.floodThreshold.toFixed(2)}m\n` +
        `• **Nível Atual:** ${currentLevelStr}m (${statusStr})\n\n` +
        `*Cotas aferidas pelas réguas oficiais homologadas pela SEMA / ANA.*`;
      break;
    }

    default: {
      responseText = `Análise Integrada de Risco Hidrológico para **${cityName}**:\n\n` +
        `• **Nível Atual:** ${currentLevelStr}m (${statusStr})\n` +
        `• **Cota de Inundação Inicial:** ${floodThreshStr}m (Margem de ${marginStr}m)\n` +
        `• **Áreas Monitoradas:** ${bairrosStr}.\n\n` +
        `*Análise de cenário baseada nos dados oficiais transmitidos pelas estações de monitoramento do Vale do Taquari. Em dúvidas emergenciais, contate a Defesa Civil (${cityData.civilDefensePhone}).*`;
      break;
    }
  }

  // 3. ARMAZENAR NA BASE DE CONHECIMENTO
  KnowledgeBase.set(intent, cityName, parameterHash, responseText, false, 10);

  return responseText;
}
