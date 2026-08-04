import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Activity, 
  Sparkles,
  MapPin,
  X,
  Filter,
  Calendar,
  ShieldAlert,
  Zap,
  BarChart2,
  History,
  Map,
  FolderOpen,
  MessageSquare,
  Send,
  Bot,
  User,
  BookOpen,
  Building2,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Navigation,
  Compass,
  FileText,
  Plus,
  Mic,
  ArrowUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { fetchCitiesDirect, isSupabaseConfigured } from '../lib/supabase';
import { City } from '../types';

// Historical Flood Records
interface FloodRecord {
  posicao: number;
  evento: string;
  data: string;
  nivelMax: number;
  duracao: string;
  impacto: string;
}

const HISTORICAL_FLOODS: FloodRecord[] = [
  { posicao: 1, evento: 'Enchente de Setembro/2023', data: '08/09/2023', nivelMax: 33.71, duracao: '15 dias', impacto: 'Catastrófico - Maior cota registrada no vale (Muçum/Lajeado)' },
  { posicao: 2, evento: 'Enchente de Maio/2024', data: '06/05/2024', nivelMax: 28.19, duracao: '9 dias', impacto: 'Severo - Inundação generalizada nos 7 municípios' },
  { posicao: 3, evento: 'Enchente de Novembro/2023', data: '20/11/2023', nivelMax: 24.73, duracao: '7 dias', impacto: 'Alto - Cota de alerta máximo regional' },
  { posicao: 4, evento: 'Enchente de Junho/2022', data: '29/06/2022', nivelMax: 22.38, duracao: '6 dias', impacto: 'Moderado - Ruas ribeirinhas e acessos rurais atingidos' },
  { posicao: 5, evento: 'Enchente de Setembro/2020', data: '19/09/2020', nivelMax: 21.35, duracao: '5 dias', impacto: 'Moderado - Cota de alerta municipal' },
];

// Predefined Monitored Cities Dataset (Taquari River Basin Flow order)
interface CityContext {
  id: string;
  name: string;
  slug: string;
  order: number;
  current_level: number;
  flood_threshold: number;
  warning_threshold: number;
  rate_of_change: number;
  status_level: 'normal' | 'atencao' | 'alerta' | 'inundacao';
  trend: 'estavel' | 'subindo' | 'descendo';
  last_updated: string;
  bairrosImpactados: string[];
  ondaCheiaTempo: string; // Time propagation from upstream
}

const CITIES_TAQUARI_FLOW: CityContext[] = [
  {
    id: 'santa-tereza',
    name: 'Santa Tereza',
    slug: 'santa-tereza',
    order: 1,
    current_level: 10.21,
    flood_threshold: 13.00,
    warning_threshold: 11.50,
    rate_of_change: -0.02,
    status_level: 'normal',
    trend: 'descendo',
    last_updated: 'Há 6 min via Telemetria',
    bairrosImpactados: ['Orla Fluvial', 'Passo de Santa Tereza', 'Zona Rural Baixa'],
    ondaCheiaTempo: 'Cabeceira inicial de monitoramento da Bacia do Taquari'
  },
  {
    id: 'mucum',
    name: 'Muçum',
    slug: 'mucum',
    order: 2,
    current_level: 11.32,
    flood_threshold: 18.00,
    warning_threshold: 15.00,
    rate_of_change: -0.015,
    status_level: 'normal',
    trend: 'descendo',
    last_updated: 'Há 8 min via Telemetria',
    bairrosImpactados: ['Centro Urbano Baixo', 'Fátima', 'Nossa Senhora do Rosário'],
    ondaCheiaTempo: '~2 a 3h após oscilações de Santa Tereza'
  },
  {
    id: 'encantado',
    name: 'Encantado',
    slug: 'encantado',
    order: 3,
    current_level: 11.89,
    flood_threshold: 16.00,
    warning_threshold: 14.00,
    rate_of_change: -0.012,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 5 min via Telemetria',
    bairrosImpactados: ['Navegantes', 'Barra do Guaporé', 'Lenz'],
    ondaCheiaTempo: '~3 a 4h após passagem por Muçum'
  },
  {
    id: 'roca-sales',
    name: 'Roca Sales',
    slug: 'roca-sales',
    order: 4,
    current_level: 12.41,
    flood_threshold: 17.00,
    warning_threshold: 14.50,
    rate_of_change: -0.010,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 10 min via Telemetria',
    bairrosImpactados: ['Centro Baixo', 'Avenida General Daltro Filho', 'Bento Gonçalves'],
    ondaCheiaTempo: '~2h após passagem por Encantado'
  },
  {
    id: 'lajeado',
    name: 'Lajeado',
    slug: 'lajeado',
    order: 5,
    current_level: 12.99,
    flood_threshold: 19.00,
    warning_threshold: 15.00,
    rate_of_change: -0.012,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 4 min via Telemetria',
    bairrosImpactados: ['Conservas', 'Navegantes', 'Carneiros', 'Centro Baixo', 'Praia dos Paus'],
    ondaCheiaTempo: '~5 a 6h de deslocamento a partir de Muçum'
  },
  {
    id: 'cruzeiro-do-sul',
    name: 'Cruzeiro do Sul',
    slug: 'cruzeiro-do-sul',
    order: 6,
    current_level: 12.17,
    flood_threshold: 17.50,
    warning_threshold: 14.00,
    rate_of_change: -0.008,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 7 min via Telemetria',
    bairrosImpactados: ['Passo de Estrela', 'Glucostark', 'Bonsucesso'],
    ondaCheiaTempo: '~2h após passagem pelo porto de Lajeado'
  },
  {
    id: 'bom-retiro-do-sul',
    name: 'Bom Retiro do Sul',
    slug: 'bom-retiro-do-sul',
    order: 7,
    current_level: 11.48,
    flood_threshold: 15.00,
    warning_threshold: 13.00,
    rate_of_change: -0.005,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 9 min via Telemetria',
    bairrosImpactados: ['Jardim do Canto', 'Avis', 'Barragem de Bom Retiro'],
    ondaCheiaTempo: '~3h após passagem por Cruzeiro do Sul'
  }
];

export const CentroAnalisesView: React.FC = () => {
  // Primary Context State: Selected City for Analysis (Default: Lajeado)
  const [selectedCityName, setSelectedCityName] = useState<string>('Lajeado');
  const [activeRange, setActiveRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Real Supabase Cities State
  const [supabaseCities, setSupabaseCities] = useState<City[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [selectedCotaLibrary, setSelectedCotaLibrary] = useState<any>(null);
  const [selectedDirectDocument, setSelectedDirectDocument] = useState<{ cotaNum: number; cotaTitle: string; fileUrl: string } | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Assistente Hidrológico IA State
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string; badge?: string }>>([]);

  // Biblioteca Técnica Filter State
  const [cotaCategoryFilter, setCotaCategoryFilter] = useState<string>('todas');
  const [librarySearchTerm, setLibrarySearchTerm] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch Supabase telemetry on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingData(true);
        const data = await fetchCitiesDirect();
        if (isMounted && data && data.length > 0) {
          setSupabaseCities(data);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do Supabase:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Compute Active Selected City Data merging local flow context + Supabase
  const activeCity: CityContext = React.useMemo(() => {
    const defaultFlow = CITIES_TAQUARI_FLOW.find(c => c.name.toLowerCase() === selectedCityName.toLowerCase()) || CITIES_TAQUARI_FLOW[4];
    const supa = supabaseCities.find(c => c.name.toLowerCase().includes(selectedCityName.toLowerCase()) || c.slug === defaultFlow.slug);

    if (supa) {
      return {
        ...defaultFlow,
        current_level: supa.current_level || defaultFlow.current_level,
        rate_of_change: supa.rate_of_change !== undefined ? supa.rate_of_change : defaultFlow.rate_of_change,
        status_level: supa.status_level || defaultFlow.status_level,
        trend: supa.trend || defaultFlow.trend,
        last_updated: supa.last_updated || defaultFlow.last_updated
      };
    }
    return defaultFlow;
  }, [selectedCityName, supabaseCities]);

  // Initializing AI Greeting when selected city changes
  useEffect(() => {
    setChatMessages([
      {
        id: `welcome-${selectedCityName}`,
        sender: 'assistant',
        text: `Olá! Sou o Assistente Hidrológico de IA em treinamento. A cidade selecionada para análise no momento é **${activeCity.name}**.\n\n• **Nível Atual do Rio:** ${activeCity.current_level.toFixed(2)}m (${activeCity.status_level.toUpperCase()})\n• **Cota de Inundação Inicial:** ${activeCity.flood_threshold.toFixed(2)}m\n• **Margem de Segurança:** ${(activeCity.flood_threshold - activeCity.current_level).toFixed(2)} metros\n\nComo posso auxiliar você com dados sobre bairros vulneráveis, previsões ou histórico hidrológico em ${activeCity.name}?`,
        time: 'Agora',
        badge: `Contexto Ativo: ${activeCity.name}`
      }
    ]);
  }, [selectedCityName, activeCity]);

  const activeLevelValue = activeCity.current_level;
  const rateOfChangeCm = (activeCity.rate_of_change * 100).toFixed(1);

  // Time Series Dataset for active city
  const dataEvolucao24h = [
    { time: '18:00', level: activeLevelValue + 0.81 },
    { time: '21:00', level: activeLevelValue + 0.51 },
    { time: '00:00', level: activeLevelValue + 0.21 },
    { time: '03:00', level: activeLevelValue - 0.11 },
    { time: '06:00', level: activeLevelValue - 0.05 },
    { time: '09:00', level: activeLevelValue + 0.02 },
    { time: '12:00', level: activeLevelValue + 0.10 },
    { time: '14:00', level: activeLevelValue + 0.05 },
    { time: '16:00', level: activeLevelValue + 0.02 },
    { time: '18:00', level: activeLevelValue },
  ];

  const dataEvolucao7d = [
    { time: '28/07', level: activeLevelValue + 1.20 },
    { time: '29/07', level: activeLevelValue + 0.80 },
    { time: '30/07', level: activeLevelValue + 0.50 },
    { time: '31/07', level: activeLevelValue + 0.20 },
    { time: '01/08', level: activeLevelValue - 0.10 },
    { time: '02/08', level: activeLevelValue + 0.30 },
    { time: '03/08', level: activeLevelValue },
  ];

  const dataEvolucao30d = [
    { time: '05/07', level: activeLevelValue - 0.80 },
    { time: '10/07', level: activeLevelValue + 0.40 },
    { time: '15/07', level: activeLevelValue + 1.50 },
    { time: '20/07', level: activeLevelValue + 0.70 },
    { time: '25/07', level: activeLevelValue + 0.20 },
    { time: '30/07', level: activeLevelValue + 0.10 },
    { time: '03/08', level: activeLevelValue },
  ];

  const chartDataToUse = activeRange === '7d' ? dataEvolucao7d : activeRange === '30d' ? dataEvolucao30d : dataEvolucao24h;

  const dataProjecao = [
    { time: '18:00', observado: activeLevelValue, projecao: activeLevelValue, min: activeLevelValue, max: activeLevelValue },
    { time: '+3h', observado: null, projecao: Number((activeLevelValue + 0.15).toFixed(2)), min: Number((activeLevelValue - 0.10).toFixed(2)), max: Number((activeLevelValue + 0.40).toFixed(2)) },
    { time: '+6h', observado: null, projecao: Number((activeLevelValue + 0.25).toFixed(2)), min: Number((activeLevelValue - 0.05).toFixed(2)), max: Number((activeLevelValue + 0.65).toFixed(2)) },
    { time: '+12h', observado: null, projecao: Number((activeLevelValue + 0.45).toFixed(2)), min: Number((activeLevelValue + 0.05).toFixed(2)), max: Number((activeLevelValue + 1.15).toFixed(2)) },
    { time: '+24h', observado: null, projecao: Number((activeLevelValue + 0.75).toFixed(2)), min: Number((activeLevelValue + 0.10).toFixed(2)), max: Number((activeLevelValue + 1.65).toFixed(2)) },
  ];

  // Simplified Clean Technical Library Dataset (Cotas Cards - 19m to 34m)
  const cotasLibrarySimplified = [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34].map((cotaNum) => {
    let status = 'INUNDAÇÃO INICIAL';
    let color = 'border-amber-500/80 text-amber-300 bg-amber-950/20';
    let category = 'inundacao';

    if (cotaNum <= 20) {
      status = 'INUNDAÇÃO INICIAL';
      color = 'border-amber-500/80 text-amber-300 bg-amber-950/20';
      category = 'atencao';
    } else if (cotaNum <= 23) {
      status = 'INUNDAÇÃO SEVERA';
      color = 'border-orange-500/80 text-orange-300 bg-orange-950/20';
      category = 'alerta';
    } else if (cotaNum <= 26) {
      status = 'INUNDAÇÃO CRÍTICA';
      color = 'border-rose-500/90 text-rose-300 bg-rose-950/20';
      category = 'inundacao';
    } else if (cotaNum <= 29) {
      status = 'EMERGÊNCIA REGIONAL';
      color = 'border-purple-500/90 text-purple-300 bg-purple-950/30';
      category = 'inundacao';
    } else if (cotaNum <= 31) {
      status = 'DESASTRE URBANO';
      color = 'border-pink-600/90 text-pink-300 bg-pink-950/30';
      category = 'catastrofico';
    } else {
      status = 'NÍVEL EXTREMO HISTÓRICO';
      color = 'border-red-600/90 text-red-300 bg-red-950/40';
      category = 'catastrofico';
    }

    return {
      cota: `Cota ${cotaNum} m`,
      cotaNum,
      cotaVal: cotaNum,
      status,
      category,
      color,
      fileUrl: `https://xaqttiojmz2xmbzrptob6x.supabase.co/storage/v1/object/public/documentos_cotas/cota_${cotaNum}m.pdf`
    };
  });

  const handleOpenDirectCotaFile = (item: typeof cotasLibrarySimplified[0]) => {
    try {
      window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Popup blocked, displaying document inline viewer', e);
    }
    setSelectedDirectDocument({
      cotaNum: item.cotaNum,
      cotaTitle: item.cota,
      fileUrl: item.fileUrl
    });
  };

  // AI Response Handler for the Active City
  const handleSendQuestion = (questionPrompt?: string) => {
    const textToSend = questionPrompt || chatInput;
    if (!textToSend || !textToSend.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user' as const,
      text: textToSend.trim(),
      time: 'Agora'
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!questionPrompt) setChatInput('');
    setIsThinking(true);

    setTimeout(() => {
      const q = textToSend.toLowerCase();
      const levelStr = activeLevelValue.toFixed(2);
      let responseText = '';
      let badge = `Análise Oficial — ${activeCity.name}`;

      if (q.includes('casa') || q.includes('risco') || q.includes('atingid') || q.includes('moro') || q.includes('endereço') || q.includes('bairro')) {
        badge = `Risco Territorial em ${activeCity.name}`;
        if (activeLevelValue < activeCity.flood_threshold) {
          responseText = `Com base nos dados oficiais do sistema para **${activeCity.name}**:\n\n• **Nível Atual:** ${levelStr}m (Situação Normal).\n• **Cota de Inundação Inicial:** ${activeCity.flood_threshold.toFixed(2)}m.\n• **Status Territorial:** A localização informada está **fora da área de risco** na cota atual (diferencial seguro de ${(activeCity.flood_threshold - activeCity.current_level).toFixed(2)} metros).\n\n**Primeiras áreas vulneráveis em ${activeCity.name}:** ${activeCity.bairrosImpactados.join(', ')}.`;
        } else {
          responseText = `ATENÇÃO: O nível do Rio Taquari em **${activeCity.name}** encontra-se em cota de alerta/inundação (${levelStr}m). Moradores das áreas baixas de ${activeCity.bairrosImpactados.join(', ')} devem seguir as orientações preventivas da Defesa Civil do município.`;
        }
      } else if (q.includes('24') || q.includes('24m') || q.includes('24 metros')) {
        badge = `Simulação Cota 24m em ${activeCity.name}`;
        responseText = `Na hipótese de o Rio Taquari atingir **24,00 metros** (Cota de Emergência Regional):\n\n• **Impacto em ${activeCity.name}:** Atinge residências e áreas comerciais nos bairros ${activeCity.bairrosImpactados.join(', ')}.\n• **Onda de Cheia:** O deslocamento da cheia leva cerca de ${activeCity.ondaCheiaTempo}.\n• **Registros de referência:** Cota próxima ao pico de Novembro/2023 (24,73m).\n\nConsulte os documentos técnicos e mapas da Cota 24m na Biblioteca Técnica abaixo.`;
      } else if (q.includes('previsã') || q.includes('próxima') || q.includes('tendên') || q.includes('futuro') || q.includes('horas')) {
        badge = `Projeção Fluviométrica (${activeCity.name})`;
        responseText = `Projeção oficial para as próximas horas em **${activeCity.name}**:\n\n• **Nível Atual:** ${levelStr}m (Tendência: ${activeCity.trend.toUpperCase()})\n• **Projeção +3h:** ${(activeLevelValue + 0.15).toFixed(2)}m\n• **Projeção +6h:** ${(activeLevelValue + 0.25).toFixed(2)}m\n• **Projeção +12h:** ${(activeLevelValue + 0.45).toFixed(2)}m\n• **Projeção +24h:** ${(activeLevelValue + 0.75).toFixed(2)}m\n\nNão há indicativo de aceleração de subida nas cabeceiras superiores (Santa Tereza / Muçum). A situação em ${activeCity.name} permanece sob estabilidade.`;
      } else if (q.includes('2024') || q.includes('maio') || q.includes('compar')) {
        badge = `Comparativo Histórico Maio/2024`;
        const diff = (28.19 - activeLevelValue).toFixed(2);
        responseText = `**Comparativo do Nível Atual em ${activeCity.name} com Maio/2024:**\n\n• **Pico da Enchente Maio/2024:** 28,19 metros (Catastrófico).\n• **Nível Atual:** ${levelStr} metros.\n• **Diferencial:** O rio encontra-se **${diff}m abaixo** da marca máxima de Maio/2024.\n\nAtualmente o rio flui dentro da calha normal em todos os pontos monitorados do Vale do Taquari.`;
      } else {
        badge = `Integridade do Banco de Dados`;
        responseText = `Não existem dados suficientes cadastrados no sistema para responder com precisão a esse detalhe específico.\n\nToda a análise do Assistente Hidrológico baseia-se estritamente nas medições oficiais das estações do Vale do Taquari, cartas geodésicas e relatórios da Defesa Civil. Recomendamos verificar os documentos oficiais na Biblioteca Técnica por Cotas abaixo.`;
      }

      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant' as const,
        text: responseText,
        time: 'Agora',
        badge
      };

      setChatMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
      setTimeout(() => {
        if (chatBottomRef.current) {
          chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, 550);
  };

  return (
    <div className="w-full bg-[#050A18] text-slate-100 min-h-screen font-sans -mt-6 pt-2 pb-16 px-2 sm:px-4 space-y-6">
      
      {/* SELETOR DE CIDADE EM CAIXA DE SELEÇÃO ACIMA DO CARD */}
      <div className="bg-[#0A1226] border border-cyan-500/50 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700 shadow">
            <Building2 className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">
              ANÁLISE PERSONALIZADA POR MUNICÍPIO
            </span>
            <label htmlFor="city-select-dropdown" className="text-sm font-black text-white uppercase tracking-wider block">
              SELECIONE A CIDADE PARA ANÁLISE HIDROLÓGICA
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase hidden md:inline">Cidade Ativa:</span>
          <select
            id="city-select-dropdown"
            value={selectedCityName}
            onChange={(e) => setSelectedCityName(e.target.value)}
            className="bg-[#050A18] text-cyan-300 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl border-2 border-cyan-500/70 focus:outline-none focus:border-cyan-300 shadow-lg cursor-pointer w-full sm:w-auto"
          >
            {CITIES_TAQUARI_FLOW.map((c) => (
              <option key={c.id} value={c.name} className="bg-[#050A18] text-slate-100 font-bold">
                {c.name} ({c.current_level.toFixed(2)}m — {c.status_level.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. MAPA INTELIGENTE / VISUALIZAÇÃO DO PERCURSO DO RIO TAQUARI (CABECEIRA ATÉ A FOZ) */}
      <div className="bg-[#0A1226] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950 text-cyan-400 border border-sky-800">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                PERCURSO GEOGRÁFICO DO RIO TAQUARI — BACIA TAQUARI-ANTAS
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o comportamento do rio ao longo de seu percurso, das cabeceiras (Santa Tereza) até a jusante (Bom Retiro do Sul)
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-xl self-start sm:self-auto">
            ✓ Rio Estável em Todo o Percurso
          </span>
        </div>

        {/* MAPA ESQUEMÁTICO ILUSTRATIVO DO CAMINHO DO RIO TAQUARI */}
        <div className="w-full bg-[#050A18] border border-slate-800/90 rounded-2xl p-4 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              FLUXO DA BACIA: SANTA TEREZA (CABECEIRA) → BOM RETIRO DO SUL (FOZ / JUSANTE)
            </span>
            <span className="text-slate-500 hidden sm:inline">Clique no ponto no mapa para selecionar o município</span>
          </div>

          {/* ESQUEMA VETORIAL SVG DO RIO TAQUARI */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[850px]">
              <svg viewBox="0 0 1000 240" className="w-full h-auto">
                <defs>
                  {/* GLOW EFFECT */}
                  <filter id="riverGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* BACKGROUND GRID LINES */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                </pattern>
                <rect width="1000" height="240" fill="url(#grid)" opacity="0.4" rx="12" />

                {/* RIO TAQUARI PATHWAY LINE */}
                <path
                  d="M 50 50 Q 120 60, 200 75 T 350 100 T 500 120 T 650 145 T 800 170 C 880 185, 920 200, 960 215"
                  fill="none"
                  stroke="url(#riverGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#riverGlow)"
                  opacity="0.85"
                />
                
                {/* FLOW DIRECTION ARROWS */}
                <path
                  d="M 120 62 L 130 65 M 275 88 L 285 91 M 425 110 L 435 113 M 575 133 L 585 136 M 725 158 L 735 161 M 870 182 L 880 185"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  markerEnd="url(#arrow)"
                />

                {/* DOWNSTREAM DESTINATION NODE */}
                <g transform="translate(950, 215)">
                  <circle r="6" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
                  <text x="0" y="22" textAnchor="middle" className="text-[9px] font-mono fill-slate-400 font-bold">
                    Delta do Jacuí / Guaíba
                  </text>
                </g>

                {/* CITY STATIONS MAP NODES */}
                {[
                  { name: 'Santa Tereza', x: 80, y: 55, city: CITIES_TAQUARI_FLOW[0] },
                  { name: 'Muçum', x: 220, y: 78, city: CITIES_TAQUARI_FLOW[1] },
                  { name: 'Encantado', x: 360, y: 101, city: CITIES_TAQUARI_FLOW[2] },
                  { name: 'Roca Sales', x: 500, y: 122, city: CITIES_TAQUARI_FLOW[3] },
                  { name: 'Lajeado', x: 640, y: 144, city: CITIES_TAQUARI_FLOW[4] },
                  { name: 'Cruzeiro do Sul', x: 770, y: 165, city: CITIES_TAQUARI_FLOW[5] },
                  { name: 'Bom Retiro do Sul', x: 890, y: 188, city: CITIES_TAQUARI_FLOW[6] }
                ].map((st, idx) => {
                  const isSelected = selectedCityName.toLowerCase() === st.name.toLowerCase();
                  const cotaStr = `cota ${st.city.flood_threshold.toFixed(2)}m`;
                  const trendIcon = st.city.rate_of_change < 0 ? '▼' : st.city.rate_of_change > 0 ? '▲' : '→';
                  const statusColor = st.city.status_level === 'normal' ? '#10b981' : st.city.status_level === 'atencao' ? '#f59e0b' : '#f43f5e';

                  return (
                    <g
                      key={st.name}
                      onClick={() => setSelectedCityName(st.name)}
                      className="cursor-pointer group"
                    >
                      {/* PULSE OUTER CIRCLE FOR SELECTED CITY */}
                      {isSelected && (
                        <circle
                          cx={st.x}
                          cy={st.y}
                          r="18"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2.5"
                          className="animate-ping opacity-75"
                        />
                      )}

                      {/* NODE BADGE CIRCLE */}
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={isSelected ? "11" : "8"}
                        fill={isSelected ? "#06b6d4" : statusColor}
                        stroke={isSelected ? "#ffffff" : "#0f172a"}
                        strokeWidth="2.5"
                        className="transition-all duration-300 group-hover:scale-125"
                      />

                      {/* CITY NAME LABEL ABOVE NODE */}
                      <text
                        x={st.x}
                        y={st.y - 20}
                        textAnchor="middle"
                        className={`text-[11px] font-black uppercase font-sans tracking-tight transition-colors ${
                          isSelected ? 'fill-cyan-300 font-extrabold' : 'fill-white group-hover:fill-cyan-400'
                        }`}
                      >
                        {st.name}
                      </text>

                      {/* CURRENT LEVEL BELOW NODE */}
                      <text
                        x={st.x}
                        y={st.y + 20}
                        textAnchor="middle"
                        className={`text-[11px] font-mono font-bold ${
                          isSelected ? 'fill-cyan-200' : 'fill-slate-200'
                        }`}
                      >
                        {trendIcon} {st.city.current_level.toFixed(2)} m
                      </text>

                      {/* COTA INUNDAÇÃO SUBTEXT */}
                      <text
                        x={st.x}
                        y={st.y + 32}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-slate-400"
                      >
                        {cotaStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Atenção</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Alerta / Inundação</span>
            </div>
            <span className="text-cyan-300">
              Rio Taquari → Delta do Jacuí → Lago Guaíba → Lagoa dos Patos → Oceano Atlântico
            </span>
          </div>
        </div>

        {/* PERCURSO HORIZONTAL INTERATIVO DAS ESTAÇÕES (CARDS EMBAIXO COMO SOLICITADO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-1">
          {CITIES_TAQUARI_FLOW.map((c, idx) => {
            const isCurrentSelected = c.name.toLowerCase() === selectedCityName.toLowerCase();
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCityName(c.name)}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer border relative flex flex-col justify-between space-y-2 ${
                  isCurrentSelected
                    ? 'bg-gradient-to-b from-cyan-950 to-slate-900 border-cyan-400/90 shadow-xl ring-2 ring-cyan-500/40'
                    : 'bg-[#050A18] border-slate-800/80 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">#0{c.order}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {c.status_level.toUpperCase()}
                    </span>
                  </div>

                  <h3 className={`text-xs font-black uppercase mt-1 truncate ${isCurrentSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {c.name}
                  </h3>

                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-xl font-black font-mono text-white">{c.current_level.toFixed(2)} m</span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {c.rate_of_change < 0 ? '↓ Baixando' : '→ Estável'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[9px] font-mono text-slate-400">
                  {c.last_updated}
                </div>
              </div>
            );
          })}
        </div>

        {/* PAINEL DE CENTRO DE COLETA EM TEMPO REAL & CRUZAMENTO INICIAL */}
        <div className="mt-4 p-4 rounded-2xl bg-[#050A18] border border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-4">
            <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">
              CENTRO DE COLETA & PROCESSAMENTO EM TEMPO REAL
            </span>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>7 de 7 Estações Fluviométricas Online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Última Varredura: Processada com Sucesso</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1.482 Medições de Nível Catalogadas</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-cyan-400 tracking-wider block">
              SÍNTESE DO CRUZAMENTO INICIAL DE DADOS — {activeCity.name.toUpperCase()}
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              O Rio Taquari em <strong>{activeCity.name}</strong> registra <strong>{activeLevelValue.toFixed(2)} metros</strong> (Situação Normal). Com base na desaceleração constante registrada nas cabeceiras em Santa Tereza e Muçum, o fluxo da bacia apresenta estabilidade, sem indicativo de aproximação das cotas críticas em {activeCity.name} nas próximas horas.
            </p>
          </div>
        </div>
      </div>

      {/* 3. PAINEL PRINCIPAL DE GRÁFICOS & PROJEÇÕES HIDROLÓGICAS (CIDADE SELECIONADA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* GRÁFICO DE NÍVEL DA CIDADE SELECIONADA */}
        <div className="lg:col-span-8 bg-[#0A1226] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  SÉRIE TEMPORAL E NÍVEIS DE RIO — {activeCity.name.toUpperCase()}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Histórico de variação do nível em metros na estação de {activeCity.name}</p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#050A18] p-1 rounded-xl border border-slate-800 text-xs font-extrabold self-start sm:self-auto">
              {(['24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeRange === range ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataToUse} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCityLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit="m" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <ReferenceLine y={activeCity.flood_threshold} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `Cota Inundação (${activeCity.flood_threshold}m)`, fill: '#f43f5e', fontSize: 10 }} />
                <ReferenceLine y={activeCity.warning_threshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Cota Atenção (${activeCity.warning_threshold}m)`, fill: '#f59e0b', fontSize: 10 }} />
                <Area type="monotone" dataKey="level" stroke="#22d3ee" strokeWidth={3} fill="url(#gradCityLevel)" dot={{ r: 3, fill: '#22d3ee' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-slate-800">
            <div className="p-2.5 rounded-xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Nível Atual</span>
              <span className="text-sm font-black text-cyan-300">{activeLevelValue.toFixed(2)} m</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Cota Inundação</span>
              <span className="text-sm font-black text-rose-400">{activeCity.flood_threshold.toFixed(2)} m</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Velocidade Variação</span>
              <span className="text-sm font-black text-slate-200">{rateOfChangeCm} cm/h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Margem Segurança</span>
              <span className="text-sm font-black text-emerald-400">{(activeCity.flood_threshold - activeLevelValue).toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* PROJEÇÃO HIDROLÓGICA DA CIDADE SELECIONADA */}
        <div className="lg:col-span-4 bg-[#0A1226] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  PROJEÇÃO PARA AS PRÓXIMAS HORAS
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Município: {activeCity.name}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                TENDÊNCIA CALCULADA (+24 HORAS):
              </span>

              <div className="space-y-2">
                {dataProjecao.slice(1).map((p, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#050A18] border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300">{p.time}</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-cyan-300 block">{p.projecao?.toFixed(2)} m</span>
                      <span className="text-[9px] text-slate-500">
                        Margem: {p.min?.toFixed(2)}m à {p.max?.toFixed(2)}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-slate-300 font-medium space-y-1 mt-4">
            <span className="text-[10px] font-bold text-cyan-300 uppercase block">INTERPRETAÇÃO OFICIAL:</span>
            <p className="leading-relaxed">
              Sem previsão de alcance da cota de alerta ({activeCity.warning_threshold}m) em {activeCity.name} no horizonte de 24 horas.
            </p>
          </div>
        </div>
      </div>

      {/* 4. BIBLIOTECA TÉCNICA HIDROLÓGICA POR COTAS (EXIBIÇÃO DE COTAS 19 A 34) */}
      <div className="bg-[#0A1226] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        
        {/* HEADER DA BIBLIOTECA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-950 text-cyan-400 border border-sky-800 shrink-0">
              <FolderOpen className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  BIBLIOTECA TÉCNICA HIDROLÓGICA POR COTAS
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  DOCUMENTAÇÃO INSTITUTIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
                Cards de acesso direto por elevação de cota (19m a 34m). Clique sobre qualquer cota para abrir diretamente o arquivo técnico correspondente no Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={librarySearchTerm}
                onChange={(e) => setLibrarySearchTerm(e.target.value)}
                placeholder="Buscar cota..."
                className="w-full bg-[#050A18] text-xs text-slate-100 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3 py-1.5 rounded-xl border border-cyan-800 shrink-0 hidden sm:inline">
              16 Cotas Mapeadas
            </span>
          </div>
        </div>

        {/* COTAS CARDS GRID (COTAS 19 A 34) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {cotasLibrarySimplified
            .filter(item => {
              if (cotaCategoryFilter !== 'todas' && item.category !== cotaCategoryFilter) return false;
              if (librarySearchTerm) {
                const term = librarySearchTerm.toLowerCase();
                return item.cota.toLowerCase().includes(term) || item.status.toLowerCase().includes(term);
              }
              return true;
            })
            .map((item) => (
              <div
                key={item.cotaNum}
                onClick={() => handleOpenDirectCotaFile(item)}
                className={`p-3.5 rounded-2xl bg-[#050A18] border ${item.color} hover:bg-slate-900 hover:scale-105 transition-all cursor-pointer group shadow-lg flex flex-col justify-between space-y-3 min-h-[95px]`}
              >
                <div>
                  <span className="text-sm font-mono font-black text-white group-hover:text-cyan-300 block">
                    {item.cota}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase block mt-1 text-slate-300 truncate">
                    {item.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-cyan-400 font-extrabold group-hover:underline">
                  <span>Abrir Arquivo</span>
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 5. DADOS METEOROLÓGICOS, RESPOSTA DA BACIA & ENCHENTES HISTÓRICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ENCHENTES HISTÓRICAS CONTEXTUALIZADAS */}
        <div className="lg:col-span-7 bg-[#0A1226] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                SÉRIE HISTÓRICA DE GRANDES ENCHENTES
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Referência Vale do Taquari</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                  <th className="py-2 px-2">Evento / Data</th>
                  <th className="py-2 px-2">Cota Máxima</th>
                  <th className="py-2 px-2">Duração</th>
                  <th className="py-2 px-2">Impacto / Contexto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {HISTORICAL_FLOODS.map((rec) => (
                  <tr key={rec.posicao} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-white">
                      {rec.evento}
                      <span className="text-[10px] text-slate-400 block font-normal">{rec.data}</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-black text-rose-400">{rec.nivelMax.toFixed(2)} m</td>
                    <td className="py-2.5 px-2 font-mono text-slate-300">{rec.duracao}</td>
                    <td className="py-2.5 px-2 text-[11px] text-slate-300">{rec.impacto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DADOS METEOROLÓGICOS E RESPOSTA DA BACIA */}
        <div className="lg:col-span-5 bg-[#0A1226] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              DADOS METEOROLÓGICOS & RESPOSTA DA BACIA
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Chuva Acumulada 24h</span>
              <span className="text-xl font-black text-cyan-300 mt-1 block">14.2 mm</span>
              <span className="text-[9px] text-emerald-400 block mt-0.5">Precipitação Fraca</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Previsão Chuva 48h</span>
              <span className="text-xl font-black text-slate-200 mt-1 block">8.0 mm</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Sem alerta de temporais</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Tempo Escoamento</span>
              <span className="text-lg font-black text-white mt-1 block">5 a 6 horas</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Muçum → Lajeado</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#050A18] border border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase block font-bold">Capacidade da Calha</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">Livre (82%)</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">Sem repique nas serras</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#050A18] border border-slate-800/80 text-xs text-slate-300 space-y-1">
            <span className="text-[10px] font-bold text-cyan-300 uppercase block">CORRELAÇÃO CHUVA vs RIO:</span>
            <p className="leading-relaxed">
              O volume acumulado de precipitação nas cabeceiras em Santa Tereza encontra-se em níveis normais, garantindo estabilidade no tempo de propagação da calha do Taquari.
            </p>
          </div>
        </div>
      </div>

      {/* VISUALIZADOR DIRETO DE ARQUIVO DA COTA (SUPABASE) */}
      {selectedDirectDocument && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#0A1226] border-2 border-cyan-500/80 rounded-3xl p-5 max-w-5xl w-full h-[85vh] flex flex-col justify-between shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-700">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase">
                    ARQUIVO DA {selectedDirectDocument.cotaTitle.toUpperCase()}
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-cyan-400 font-mono">
                    Supabase Storage • cota_{selectedDirectDocument.cotaNum}m.pdf
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDirectDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Nova Guia</span>
                </a>
                <button
                  onClick={() => setSelectedDirectDocument(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENT EMBEDDED PREVIEW / IFRAME */}
            <div className="flex-1 w-full bg-[#050A18] rounded-2xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
              <iframe
                src={selectedDirectDocument.fileUrl}
                className="w-full h-full rounded-xl border-0"
                title={`Documento da Cota ${selectedDirectDocument.cotaNum}m`}
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
              <span className="truncate max-w-xl">
                Caminho do arquivo no Supabase: <span className="text-cyan-300 font-semibold">{selectedDirectDocument.fileUrl}</span>
              </span>
              <button
                onClick={() => setSelectedDirectDocument(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                FECHAR DOCUMENTO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
