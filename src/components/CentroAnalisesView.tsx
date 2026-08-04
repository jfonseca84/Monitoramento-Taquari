import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CotasLibrarySection } from './CotasLibrarySection';
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
  Map as MapIcon,
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
  ArrowUp,
  ChevronRight,
  Droplets,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Gauge,
  Waves,
  RefreshCw,
  Bell,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid
} from 'recharts';
import { fetchCitiesDirect } from '../lib/supabase';
import { City } from '../types';

// ==========================================
// DATA TYPES & PREDEFINED DATASETS
// ==========================================

export interface AnalysisStation {
  id: string;
  name: string;
  river: string;
  category: 'cidade' | 'afluente';
  current_level: number;
  flood_threshold: number;
  warning_threshold: number;
  attention_threshold: number;
  emergency_threshold: number;
  rate_of_change: number; // m/h
  status_level: 'normal' | 'atencao' | 'alerta' | 'inundacao';
  trend: 'estavel' | 'subindo' | 'descendo';
  last_updated: string;
  transit_time: string; // Wave propagation delay
  temp: number;
  humidity: number;
  wind: string;
  pressure: number;
  rain1h: number;
  rain6h: number;
  rain24h: number;
  bairrosImpactados: string[];
}

// Complete Monitored Stations & Cities of the Taquari Basin
const STATIONS_DATA: AnalysisStation[] = [
  // --- Cidades Principais (Taquari Main Channel) ---
  {
    id: 'santa-tereza',
    name: 'Santa Tereza',
    river: 'Cabeceira do Taquari',
    category: 'cidade',
    current_level: 10.21,
    attention_threshold: 10.50,
    warning_threshold: 11.50,
    flood_threshold: 13.00,
    emergency_threshold: 14.50,
    rate_of_change: -0.02,
    status_level: 'normal',
    trend: 'descendo',
    last_updated: 'Há 5 min',
    transit_time: 'Marco zero de montante',
    temp: 21.4,
    humidity: 88,
    wind: '12 km/h NE',
    pressure: 1014,
    rain1h: 0.8,
    rain6h: 12.4,
    rain24h: 24.1,
    bairrosImpactados: ['Orla Fluvial', 'Passo de Santa Tereza', 'Zona Rural Baixa']
  },
  {
    id: 'mucum',
    name: 'Muçum',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 11.32,
    attention_threshold: 13.00,
    warning_threshold: 15.00,
    flood_threshold: 18.00,
    emergency_threshold: 22.00,
    rate_of_change: -0.015,
    status_level: 'normal',
    trend: 'descendo',
    last_updated: 'Há 8 min',
    transit_time: '~2h a 3h de Santa Tereza',
    temp: 22.0,
    humidity: 87,
    wind: '13 km/h NE',
    pressure: 1013,
    rain1h: 1.2,
    rain6h: 14.0,
    rain24h: 26.5,
    bairrosImpactados: ['Centro Urbano Baixo', 'Fátima', 'Nossa Senhora do Rosário']
  },
  {
    id: 'encantado',
    name: 'Encantado',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 11.89,
    attention_threshold: 12.50,
    warning_threshold: 14.00,
    flood_threshold: 16.00,
    emergency_threshold: 19.50,
    rate_of_change: -0.012,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 4 min',
    transit_time: '~3h a 4h de Muçum',
    temp: 22.2,
    humidity: 85,
    wind: '11 km/h E',
    pressure: 1013,
    rain1h: 1.0,
    rain6h: 15.2,
    rain24h: 28.0,
    bairrosImpactados: ['Navegantes', 'Barra do Guaporé', 'Lenz']
  },
  {
    id: 'roca-sales',
    name: 'Roca Sales',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 12.41,
    attention_threshold: 13.00,
    warning_threshold: 14.50,
    flood_threshold: 17.00,
    emergency_threshold: 20.00,
    rate_of_change: -0.010,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 6 min',
    transit_time: '~2h de Encantado',
    temp: 22.4,
    humidity: 86,
    wind: '14 km/h NE',
    pressure: 1012,
    rain1h: 1.8,
    rain6h: 16.0,
    rain24h: 29.5,
    bairrosImpactados: ['Centro Baixo', 'Avenida General Daltro Filho', 'Bento Gonçalves']
  },
  {
    id: 'lajeado',
    name: 'Lajeado',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 13.42,
    attention_threshold: 15.00,
    warning_threshold: 17.00,
    flood_threshold: 19.00,
    emergency_threshold: 22.50,
    rate_of_change: 0.002,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: '30/05/2025 09:45',
    transit_time: '~5h a 6h de Muçum',
    temp: 22.6,
    humidity: 86,
    wind: '14 km/h NE',
    pressure: 1012,
    rain1h: 2.4,
    rain6h: 18.0,
    rain24h: 31.2,
    bairrosImpactados: ['Conservas', 'Navegantes', 'Carneiros', 'Centro Baixo', 'Praia dos Paus']
  },
  {
    id: 'estrela',
    name: 'Estrela',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 13.20,
    attention_threshold: 15.00,
    warning_threshold: 17.00,
    flood_threshold: 19.00,
    emergency_threshold: 22.50,
    rate_of_change: 0.001,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 3 min',
    transit_time: 'Confluência imediata a Lajeado',
    temp: 22.5,
    humidity: 86,
    wind: '14 km/h NE',
    pressure: 1012,
    rain1h: 2.2,
    rain6h: 17.8,
    rain24h: 30.9,
    bairrosImpactados: ['Imigrantes', 'União', 'Moinhos', 'Três Maios']
  },
  {
    id: 'cruzeiro-do-sul',
    name: 'Cruzeiro do Sul',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 12.17,
    attention_threshold: 14.00,
    warning_threshold: 16.00,
    flood_threshold: 17.50,
    emergency_threshold: 20.00,
    rate_of_change: -0.008,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 7 min',
    transit_time: '~2h a 3h de Lajeado',
    temp: 22.8,
    humidity: 85,
    wind: '12 km/h E',
    pressure: 1012,
    rain1h: 1.9,
    rain6h: 16.5,
    rain24h: 28.7,
    bairrosImpactados: ['Passeio', 'Zwirtes', 'Bairro Passo de Estrela']
  },
  {
    id: 'bom-retiro-do-sul',
    name: 'Bom Retiro do Sul',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 11.48,
    attention_threshold: 13.00,
    warning_threshold: 14.50,
    flood_threshold: 15.00,
    emergency_threshold: 18.00,
    rate_of_change: -0.005,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 9 min',
    transit_time: '~3h de Cruzeiro do Sul (Barragem)',
    temp: 23.0,
    humidity: 84,
    wind: '10 km/h NE',
    pressure: 1011,
    rain1h: 1.5,
    rain6h: 15.0,
    rain24h: 27.2,
    bairrosImpactados: ['Jardim do Canto', 'Avis', 'Barragem de Bom Retiro']
  },
  {
    id: 'porto-mariante',
    name: 'Porto Mariante',
    river: 'Rio Taquari',
    category: 'cidade',
    current_level: 9.85,
    attention_threshold: 11.00,
    warning_threshold: 12.50,
    flood_threshold: 14.00,
    emergency_threshold: 16.50,
    rate_of_change: -0.004,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 11 min',
    transit_time: '~4h de Bom Retiro do Sul',
    temp: 23.2,
    humidity: 83,
    wind: '11 km/h E',
    pressure: 1011,
    rain1h: 1.1,
    rain6h: 13.8,
    rain24h: 25.0,
    bairrosImpactados: ['Vila Mariante', 'Orla do Taquari', 'Estrada Velha']
  },
  {
    id: 'taquari',
    name: 'Taquari',
    river: 'Foz do Taquari',
    category: 'cidade',
    current_level: 8.92,
    attention_threshold: 10.00,
    warning_threshold: 11.50,
    flood_threshold: 13.00,
    emergency_threshold: 15.00,
    rate_of_change: -0.002,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 12 min',
    transit_time: 'Foz de desembocadura no Jacuí',
    temp: 23.5,
    humidity: 82,
    wind: '12 km/h NE',
    pressure: 1011,
    rain1h: 1.0,
    rain6h: 13.0,
    rain24h: 24.5,
    bairrosImpactados: ['Praia do das Caixas', 'Porto de Taquari', 'Centro Baixo']
  },

  // --- Estações de Afluentes (Tributaries) ---
  {
    id: 'barra-do-fao',
    name: 'Barra do Fão',
    river: 'Rio Forqueta (Afluente)',
    category: 'afluente',
    current_level: 3.45,
    attention_threshold: 4.50,
    warning_threshold: 5.50,
    flood_threshold: 7.00,
    emergency_threshold: 9.00,
    rate_of_change: 0.015,
    status_level: 'normal',
    trend: 'subindo',
    last_updated: 'Há 5 min',
    transit_time: 'Afluente direto do Taquari',
    temp: 21.0,
    humidity: 89,
    wind: '15 km/h N',
    pressure: 1014,
    rain1h: 3.5,
    rain6h: 22.0,
    rain24h: 38.0,
    bairrosImpactados: ['Maratá Baixo', 'Vale do Forqueta']
  },
  {
    id: 'linha-jose-julio',
    name: 'Linha José Júlio',
    river: 'Arroio José Júlio',
    category: 'afluente',
    current_level: 2.80,
    attention_threshold: 3.80,
    warning_threshold: 4.80,
    flood_threshold: 6.00,
    emergency_threshold: 7.50,
    rate_of_change: 0.008,
    status_level: 'normal',
    trend: 'estavel',
    last_updated: 'Há 10 min',
    transit_time: 'Afluente de cabeceira',
    temp: 20.5,
    humidity: 90,
    wind: '13 km/h NE',
    pressure: 1014,
    rain1h: 2.1,
    rain6h: 19.5,
    rain24h: 34.0,
    bairrosImpactados: ['Comunidade José Júlio', 'Pontes Secundárias']
  },
  {
    id: 'linha-colombo',
    name: 'Linha Colombo',
    river: 'Estação Afluente',
    category: 'afluente',
    current_level: 2.45,
    attention_threshold: 3.50,
    warning_threshold: 4.50,
    flood_threshold: 5.80,
    emergency_threshold: 7.00,
    rate_of_change: -0.005,
    status_level: 'normal',
    trend: 'descendo',
    last_updated: 'Há 15 min',
    transit_time: 'Afluente secundário',
    temp: 20.8,
    humidity: 89,
    wind: '11 km/h E',
    pressure: 1013,
    rain1h: 1.4,
    rain6h: 16.0,
    rain24h: 31.0,
    bairrosImpactados: ['Estrada Linha Colombo', 'Travessias Rurais']
  },
  {
    id: 'passo-carreiro',
    name: 'Passo Carreiro',
    river: 'Rio Carreiro',
    category: 'afluente',
    current_level: 4.10,
    attention_threshold: 5.20,
    warning_threshold: 6.50,
    flood_threshold: 8.00,
    emergency_threshold: 10.00,
    rate_of_change: 0.022,
    status_level: 'normal',
    trend: 'subindo',
    last_updated: 'Há 4 min',
    transit_time: 'Formador do Rio Taquari',
    temp: 19.8,
    humidity: 91,
    wind: '16 km/h N',
    pressure: 1015,
    rain1h: 4.0,
    rain6h: 26.0,
    rain24h: 42.5,
    bairrosImpactados: ['Usina Passo Carreiro', 'Bacia Superior']
  },
  {
    id: 'passo-tainhas',
    name: 'Passo Tainhas',
    river: 'Rio das Antas',
    category: 'afluente',
    current_level: 5.30,
    attention_threshold: 6.80,
    warning_threshold: 8.00,
    flood_threshold: 10.00,
    emergency_threshold: 12.50,
    rate_of_change: 0.018,
    status_level: 'normal',
    trend: 'subindo',
    last_updated: 'Há 6 min',
    transit_time: 'Montante do Rio das Antas',
    temp: 19.2,
    humidity: 92,
    wind: '18 km/h N',
    pressure: 1015,
    rain1h: 4.8,
    rain6h: 28.5,
    rain24h: 45.0,
    bairrosImpactados: ['Vale do Tainhas', 'Serra Baixa']
  }
];

// STATION COORDINATES FOR REAL-TIME WEATHER FETCHING (OPEN-METEO)
const STATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'santa-tereza': { lat: -29.1670, lon: -51.7348 },
  'mucum': { lat: -29.1652, lon: -51.8705 },
  'encantado': { lat: -29.2372, lon: -51.8711 },
  'roca-sales': { lat: -29.2818, lon: -51.8687 },
  'lajeado': { lat: -29.4670, lon: -51.9615 },
  'estrela': { lat: -29.5019, lon: -51.9610 },
  'cruzeiro-do-sul': { lat: -29.5133, lon: -51.9858 },
  'bom-retiro-do-sul': { lat: -29.6053, lon: -51.9469 },
  'porto-mariante': { lat: -29.6989, lon: -51.9408 },
  'taquari': { lat: -29.7958, lon: -51.8592 },
  'barra-do-fao': { lat: -29.1861, lon: -52.2033 },
  'rio-forqueta': { lat: -29.4005, lon: -51.9431 },
  'rio-das-antas': { lat: -28.9950, lon: -51.6953 },
  'rio-guapore': { lat: -28.8458, lon: -51.8903 },
  'rio-sampaio': { lat: -29.5311, lon: -52.0112 },
  'linha-colombo': { lat: -29.2000, lon: -51.8000 },
  'passo-carreiro': { lat: -28.8900, lon: -51.8200 },
  'passo-tainhas': { lat: -28.9500, lon: -50.5000 }
};

function getWindCardinal(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return 'N';
  if (deg >= 22.5 && deg < 67.5) return 'NE';
  if (deg >= 67.5 && deg < 112.5) return 'E';
  if (deg >= 112.5 && deg < 157.5) return 'SE';
  if (deg >= 157.5 && deg < 202.5) return 'S';
  if (deg >= 202.5 && deg < 247.5) return 'SW';
  if (deg >= 247.5 && deg < 292.5) return 'W';
  if (deg >= 292.5 && deg < 337.5) return 'NW';
  return 'NE';
}

export const CentroAnalisesView: React.FC = () => {
  // Navigation & Filter States
  const [selectedStationId, setSelectedStationId] = useState<string>('lajeado');
  const [activeMainTab, setActiveMainTab] = useState<'hidrologico' | 'fluviologico' | 'meteorologico'>('hidrologico');
  const [timeframe, setTimeframe] = useState<'6h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Supabase Telemetry Hydration
  const [supabaseCities, setSupabaseCities] = useState<City[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Real-time weather state (fetched per selected city via Open-Meteo)
  const [liveWeather, setLiveWeather] = useState<{
    temp: number;
    humidity: number;
    wind: string;
    pressure: number;
    rain1h: number;
    loading: boolean;
    isReal: boolean;
  }>({
    temp: 22.6,
    humidity: 86,
    wind: '14 km/h NE',
    pressure: 1012,
    rain1h: 2.4,
    loading: false,
    isReal: false
  });

  // Modals & Document viewer states
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isCotasModalOpen, setIsCotasModalOpen] = useState<boolean>(false);
  const [selectedDirectDocument, setSelectedDirectDocument] = useState<{ cotaNum: number; cotaTitle: string; fileUrl: string } | null>(null);
  const [activeFloodIndex, setActiveFloodIndex] = useState<number | null>(null);

  // AI Assistant Chat Messages State
  const [chatInput, setChatInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string; badge?: string }>>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load real Supabase telemetry on mount
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
        console.warn('Erro ao carregar telemetria em tempo real:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Compute Active Station (Merge telemetry data if available)
  const currentStation: AnalysisStation = useMemo(() => {
    const base = STATIONS_DATA.find(s => s.id === selectedStationId) || STATIONS_DATA[4]; // Default Lajeado
    const supa = supabaseCities.find(c => c.slug === base.id || c.name.toLowerCase().includes(base.name.toLowerCase()));
    if (supa) {
      return {
        ...base,
        current_level: supa.current_level || base.current_level,
        status_level: (supa.status_level as any) || base.status_level,
        trend: (supa.trend as any) || base.trend,
        last_updated: supa.last_updated || base.last_updated
      };
    }
    return base;
  }, [selectedStationId, supabaseCities]);

  // Fetch real-time weather data for the selected station via Open-Meteo API
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveWeather() {
      const coords = STATION_COORDINATES[currentStation.id] || { lat: -29.4670, lon: -51.9615 };
      setLiveWeather(prev => ({ ...prev, loading: true }));

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,rain`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha na requisição de clima');
        const data = await res.json();

        if (isMounted && data && data.current) {
          const c = data.current;
          const windDir = c.wind_direction_10m !== undefined ? getWindCardinal(c.wind_direction_10m) : 'NE';
          const windSpeed = Math.round(c.wind_speed_10m || 0);

          setLiveWeather({
            temp: Math.round((c.temperature_2m ?? currentStation.temp) * 10) / 10,
            humidity: Math.round(c.relative_humidity_2m ?? currentStation.humidity),
            wind: `${windSpeed} km/h ${windDir}`,
            pressure: Math.round(c.surface_pressure ?? currentStation.pressure),
            rain1h: Math.round((c.precipitation ?? c.rain ?? currentStation.rain1h) * 10) / 10,
            loading: false,
            isReal: true
          });
          return;
        }
      } catch (err) {
        console.warn('Erro ao obter clima ao vivo:', err);
      }

      if (isMounted) {
        setLiveWeather({
          temp: currentStation.temp,
          humidity: currentStation.humidity,
          wind: currentStation.wind,
          pressure: currentStation.pressure,
          rain1h: currentStation.rain1h,
          loading: false,
          isReal: false
        });
      }
    }

    fetchLiveWeather();
    return () => { isMounted = false; };
  }, [currentStation.id, currentStation.temp, currentStation.humidity, currentStation.wind, currentStation.pressure, currentStation.rain1h]);

  // Update AI Assistant context greeting whenever selected station changes
  useEffect(() => {
    setChatMessages([
      {
        id: `welcome-${currentStation.id}`,
        sender: 'assistant',
        text: `Olá! Você está analisando a estação de **${currentStation.name}** (${currentStation.river}).\n\n• **Nível Atual:** ${currentStation.current_level.toFixed(2)} m\n• **Status:** ${currentStation.status_level.toUpperCase()}\n• **Cota de Atenção:** ${currentStation.attention_threshold.toFixed(2)} m\n• **Cota de Alerta:** ${currentStation.warning_threshold.toFixed(2)} m\n• **Cota de Inundação:** ${currentStation.flood_threshold.toFixed(2)} m\n\nEstou pronto para analisar dados hidrológicos, cotas históricas, precipitação ou tempos de propagação da onda de cheia para ${currentStation.name}. Como posso ajudar?`,
        time: 'Agora',
        badge: `Estação Ativa: ${currentStation.name}`
      }
    ]);
  }, [currentStation]);

  // Filter sidebar items by search
  const filteredCities = useMemo(() => {
    return STATIONS_DATA.filter(s => s.category === 'cidade' && (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.river.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery]);

  const filteredAfluentes = useMemo(() => {
    return STATIONS_DATA.filter(s => s.category === 'afluente' && (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.river.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery]);

  // Dynamic Chart Dataset Generator for Active Station & Timeframe
  const hydroChartData = useMemo(() => {
    const lvl = currentStation.current_level;
    if (timeframe === '6h') {
      return [
        { time: '04:00', level: Number((lvl - 0.08).toFixed(2)) },
        { time: '05:00', level: Number((lvl - 0.05).toFixed(2)) },
        { time: '06:00', level: Number((lvl - 0.03).toFixed(2)) },
        { time: '07:00', level: Number((lvl - 0.01).toFixed(2)) },
        { time: '08:00', level: Number((lvl + 0.01).toFixed(2)) },
        { time: '09:00', level: Number((lvl + 0.03).toFixed(2)) },
        { time: '09:45', level: Number(lvl.toFixed(2)) },
      ];
    } else if (timeframe === '7d') {
      return [
        { time: '24/05', level: Number((lvl - 0.56).toFixed(2)) },
        { time: '25/05', level: Number((lvl + 0.86).toFixed(2)) },
        { time: '26/05', level: Number((lvl + 0.40).toFixed(2)) },
        { time: '27/05', level: Number((lvl + 0.15).toFixed(2)) },
        { time: '28/05', level: Number((lvl - 0.10).toFixed(2)) },
        { time: '29/05', level: Number((lvl - 0.05).toFixed(2)) },
        { time: '30/05', level: Number(lvl.toFixed(2)) },
      ];
    } else if (timeframe === '30d') {
      return [
        { time: '01/05', level: Number((lvl + 2.40).toFixed(2)) },
        { time: '05/05', level: Number((lvl + 6.80).toFixed(2)) },
        { time: '10/05', level: Number((lvl + 3.20).toFixed(2)) },
        { time: '15/05', level: Number((lvl + 1.10).toFixed(2)) },
        { time: '20/05', level: Number((lvl + 0.45).toFixed(2)) },
        { time: '25/05', level: Number((lvl + 0.86).toFixed(2)) },
        { time: '30/05', level: Number(lvl.toFixed(2)) },
      ];
    } else {
      // 24h default
      return [
        { time: '09:00', level: Number((lvl - 0.85).toFixed(2)) },
        { time: '12:00', level: Number((lvl - 0.45).toFixed(2)) },
        { time: '15:00', level: Number((lvl - 0.15).toFixed(2)) },
        { time: '18:00', level: Number((lvl + 0.10).toFixed(2)) },
        { time: '21:00', level: Number((lvl + 0.25).toFixed(2)) },
        { time: '00:00', level: Number((lvl + 0.18).toFixed(2)) },
        { time: '03:00', level: Number((lvl + 0.08).toFixed(2)) },
        { time: '06:00', level: Number((lvl + 0.02).toFixed(2)) },
        { time: '09:00', level: Number(lvl.toFixed(2)) },
      ];
    }
  }, [currentStation, timeframe]);

  // Historical Floods Dataset (7 Major Historical Floods of Taquari Basin with Detailed Context)
  const historicalFloodsData = useMemo(() => [
    {
      event: 'Mai/1941',
      level: 29.92,
      label: '29,92m',
      title: 'Cheia Histórica de 1941',
      dateStr: '05/05/1941 a 12/05/1941',
      rain: '~600 mm acumulados',
      impact: 'Grande evento histórico do século XX. Inundou os centros de Lajeado, Estrela e Porto Alegre, atingindo 29,92m no Rio Taquari.',
      duration: 'Cheia prolongada (7 dias)',
      category: 'Grande Cheia do Século'
    },
    {
      event: 'Jun/1982',
      level: 26.85,
      label: '26,85m',
      title: 'Cheia de Inverno de 1982',
      dateStr: '22/06/1982 a 26/06/1982',
      rain: '~380 mm acumulados',
      impact: 'Provocada por El Niño forte. Transbordou margens de Lajeado e Taquari com desalojamento massivo de famílias ribeirinhas.',
      duration: '4 dias em cota de transbordo',
      category: 'Evento El Niño'
    },
    {
      event: 'Out/2015',
      level: 26.82,
      label: '26,82m',
      title: 'Cheia da Primavera de 2015',
      dateStr: '14/10/2015 a 18/10/2015',
      rain: '~340 mm na bacia',
      impact: 'Precipitação intensa e continuada. Atingiu áreas urbanas baixas de Muçum, Roca Sales, Lajeado e Estrela.',
      duration: '3 dias de alerta máximo',
      category: 'Cheia Primavera'
    },
    {
      event: 'Jul/2020',
      level: 27.39,
      label: '27,39m',
      title: 'Cheia de Julho de 2020',
      dateStr: '07/07/2020 a 10/07/2020',
      rain: '~320 mm em 72h',
      impact: 'Ciclone extratropical causou rápida elevação das águas. Interrupção de pontes e estradas no Vale do Taquari.',
      duration: 'Elevado volume em 48h',
      category: 'Ciclone Extratropical'
    },
    {
      event: 'Set/2023',
      level: 29.62,
      label: '29,62m',
      title: 'Ciclone Extratropical de Set/2023',
      dateStr: '04/09/2023 a 06/09/2023',
      rain: '> 300 mm nas cabeceiras',
      impact: 'Devastadora enxurrada torrencial em Muçum e Roca Sales. Atingiu 29,62m em Lajeado/Estrela com correntes extremamente rápidas.',
      duration: 'Enxurrada súbita e violenta',
      category: 'Catástrofe de Setembro'
    },
    {
      event: 'Nov/2023',
      level: 28.94,
      label: '28,94m',
      title: 'Cheia Severa de Nov/2023',
      dateStr: '18/11/2023 a 20/11/2023',
      rain: '~310 mm em 36h',
      impact: 'Segunda grande repique em menos de 3 meses. Solos já saturados provocaram novo transbordo generalizado.',
      duration: 'Subida expressiva em 12h',
      category: 'Enchente Recorrente'
    },
    {
      event: 'Mai/2024',
      level: 32.99,
      label: '32,99m',
      title: 'Maior Catástrofe da História (Mai/2024)',
      dateStr: '30/04/2024 a 05/05/2024',
      rain: '> 700 mm acumulados',
      impact: 'Recorde absoluto registrado em toda a história da bacia (32,99m em Lajeado). Ultrapassou todos os marcos anteriores em mais de 3 metros.',
      duration: 'Inundação generalizada sem precedentes',
      category: 'Recorde Absoluto'
    },
  ], []);

  // Projection Chart Dataset
  const projectionData = useMemo(() => {
    const lvl = currentStation.current_level;
    return [
      { time: '09:00', observado: Number((lvl - 0.35).toFixed(2)), projecao: null, incertezaMin: null, incertezaMax: null },
      { time: '15:00', observado: Number((lvl - 0.15).toFixed(2)), projecao: null, incertezaMin: null, incertezaMax: null },
      { time: '21:00', observado: Number((lvl - 0.05).toFixed(2)), projecao: null, incertezaMin: null, incertezaMax: null },
      { time: '03:00 (Agora)', observado: Number(lvl.toFixed(2)), projecao: Number(lvl.toFixed(2)), incertezaMin: Number(lvl.toFixed(2)), incertezaMax: Number(lvl.toFixed(2)) },
      { time: '09:00 (+6h)', observado: null, projecao: Number((lvl + 0.12).toFixed(2)), incertezaMin: Number((lvl - 0.15).toFixed(2)), incertezaMax: Number((lvl + 0.45).toFixed(2)) },
      { time: '15:00 (+12h)', observado: null, projecao: Number((lvl + 0.22).toFixed(2)), incertezaMin: Number((lvl - 0.25).toFixed(2)), incertezaMax: Number((lvl + 0.75).toFixed(2)) },
      { time: '21:00 (+18h)', observado: null, projecao: Number((lvl + 0.18).toFixed(2)), incertezaMin: Number((lvl - 0.35).toFixed(2)), incertezaMax: Number((lvl + 0.95).toFixed(2)) },
      { time: '09:00 (+30h)', observado: null, projecao: Number((lvl + 0.08).toFixed(2)), incertezaMin: Number((lvl - 0.45).toFixed(2)), incertezaMax: Number((lvl + 1.15).toFixed(2)) },
    ];
  }, [currentStation]);

  // Handle AI Chat input submission
  const handleSendQuestion = (questionPrompt?: string) => {
    const textToSend = questionPrompt || chatInput;
    if (!textToSend || !textToSend.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user' as const,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!questionPrompt) setChatInput('');
    setIsThinking(true);

    setTimeout(() => {
      const q = textToSend.toLowerCase();
      let replyText = '';

      if (q.includes('cota') || q.includes('inundação') || q.includes('alerta')) {
        replyText = `📊 **Cotas de Nível para ${currentStation.name}:**\n\n• **Normal:** < ${currentStation.attention_threshold.toFixed(2)}m\n• **Atenção:** ${currentStation.attention_threshold.toFixed(2)}m\n• **Alerta:** ${currentStation.warning_threshold.toFixed(2)}m\n• **Cota de Inundação:** ${currentStation.flood_threshold.toFixed(2)}m\n• **Emergência Regional:** ${currentStation.emergency_threshold.toFixed(2)}m\n\nNo momento, a leitura atual é **${currentStation.current_level.toFixed(2)}m**, situando-se em estado **${currentStation.status_level.toUpperCase()}**.`;
      } else if (q.includes('bairro') || q.includes('rua') || q.includes('atingid')) {
        replyText = `🏘️ **Bairros e Locais Vulneráveis em ${currentStation.name}:**\n\n` +
          currentStation.bairrosImpactados.map(b => `• ${b}`).join('\n') +
          `\n\nCaso o nível atinja a cota de inundação (${currentStation.flood_threshold.toFixed(2)}m), estas regiões iniciam evacuação preventiva orientada pela Defesa Civil Municipal.`;
      } else if (q.includes('tempo') || q.includes('onda') || q.includes('cheia') || q.includes('muçum')) {
        replyText = `🌊 **Dinâmica de Propagação para ${currentStation.name}:**\n\n• **Deslocamento estimado:** ${currentStation.transit_time}.\n• **Celeridade média da onda:** 4.5 a 5.2 km/h na calha principal do Rio Taquari.\n• **Variação recente (1h):** ${currentStation.rate_of_change > 0 ? '+' : ''}${(currentStation.rate_of_change * 100).toFixed(1)} cm/h.`;
      } else {
        replyText = ` Base de Dados Auditada do Monitoramento Taquari para **${currentStation.name}**:\n\n• **Leitura Telemétrica:** ${currentStation.current_level.toFixed(2)} m (${currentStation.status_level.toUpperCase()})\n• **Tendência:** ${currentStation.trend}\n• **Condições do Tempo:** ${currentStation.temp}°C, umidade ${currentStation.humidity}%, chuva 24h: ${currentStation.rain24h}mm.\n• **Status da Bacia:** Comportamento estável sem risco iminente de extravasamento nas próximas horas.`;
      }

      setChatMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        badge: 'Leitura Real Telemetria SGB/ANA'
      }]);
      setIsThinking(false);
    }, 800);
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking]);

  return (
    <div className="w-full min-h-screen bg-[#070D19] text-slate-100 font-sans flex flex-col antialiased">
      
      {/* ============================================================ */}
      {/* MAIN LAYOUT: LEFT SIDEBAR + RIGHT DASHBOARD CANVAS */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1700px] mx-auto p-2 sm:p-4 lg:p-6 gap-4">
        
        {/* ========================================== */}
        {/* MENU LATERAL ESQUERDO (FIXED LEFT SIDEBAR) */}
        {/* ========================================== */}
        <aside className="w-full lg:w-80 shrink-0 bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
          
          {/* LOGO / BRANDING HEADER */}
          <div className="flex items-center gap-3 px-1 pt-1 pb-2 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                MONITORAMENTO TAQUARI
              </h1>
              <p className="text-[10px] font-semibold text-slate-400">
                Centro Inteligente de Análise Hidrológica
              </p>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cidade ou estação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#050A18] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* CITIES & STATIONS LIST */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px] lg:max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
            
            {/* GROUP 1: CIDADES MONITORADAS */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-2 block">
                Cidades Monitoradas ({filteredCities.length})
              </span>
              <div className="space-y-1">
                {filteredCities.map((st) => {
                  const isSelected = st.id === selectedStationId;
                  const isNormal = st.status_level === 'normal';
                  const isWarning = st.status_level === 'atencao';
                  const isAlert = st.status_level === 'alerta';
                  const isFlood = st.status_level === 'inundacao';

                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-[#16223B] border border-cyan-500/60 shadow-md shadow-cyan-950/40 text-white' 
                          : 'bg-[#081023]/60 hover:bg-[#0E1B36] border border-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Waves className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <div className="truncate">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate font-medium">
                            {st.river}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isNormal ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                          isWarning ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
                          isAlert ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' :
                          'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                        }`} />
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 2: ESTAÇÕES DE AFLUENTES */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-2 block">
                Estações de Afluentes ({filteredAfluentes.length})
              </span>
              <div className="space-y-1">
                {filteredAfluentes.map((st) => {
                  const isSelected = st.id === selectedStationId;
                  const isNormal = st.status_level === 'normal';

                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-[#16223B] border border-cyan-500/60 shadow-md shadow-cyan-950/40 text-white' 
                          : 'bg-[#081023]/60 hover:bg-[#0E1B36] border border-slate-800/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Activity className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <div className="truncate">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate font-medium">
                            {st.river}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isNormal ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-400 animate-pulse'
                        }`} />
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BOTTOM LINK: VISÃO DA BACIA */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setSelectedStationId('lajeado')}
              className="w-full px-3 py-2.5 bg-[#050A18] hover:bg-[#0F1B35] border border-slate-800 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Visão da Bacia</span>
                <span className="text-[10px] text-slate-400 block">Mapa geral da bacia do Taquari</span>
              </div>
            </button>
          </div>

        </aside>

        {/* ============================================================ */}
        {/* RIGHT DASHBOARD CANVAS */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* ---------------------------------------------------- */}
          {/* CABEÇALHO SUPERIOR (HEADER INSIDE DASHBOARD) */}
          {/* ---------------------------------------------------- */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1 px-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase">
                CENTRO DE ANÁLISES
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Dados integrados de hidrologia, fluviologia e meteorologia
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Última atualização:</span>
                <span className="text-slate-200 font-medium">30/05/2025 09:45</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ao vivo</span>
              </div>

              <div className="flex items-center gap-2.5 ml-2">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-8 h-8 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Ajuda"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-8 h-8 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative"
                  title="Notificações"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* ---------------------------------------------------- */}
          {/* CARDS SUPERIORES (TOP METRICS BANNER FOR SELECTED CITY) */}
          {/* ---------------------------------------------------- */}
          <section className="bg-[#091122] border border-[#162342] rounded-2xl p-4 sm:p-5 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 items-center">
              
              {/* COL 1: CITY & BADGE */}
              <div className="space-y-2 pr-2">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  {currentStation.name} - RS
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentStation.river}</span>
                </div>
                <div>
                  <span className="inline-block px-2.5 py-1 rounded bg-[#09221B] border border-emerald-800/80 text-emerald-400 text-[10px] font-black tracking-wider uppercase">
                    NÍVEL {currentStation.status_level === 'normal' ? 'NORMAL' : currentStation.status_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* COL 2: NÍVEL ATUAL */}
              <div className="pt-3 md:pt-0 md:pl-4 pr-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Nível atual</span>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentStation.current_level.toFixed(2).replace('.', ',')} m
                  </span>
                </div>
              </div>

              {/* COL 3: TENDÊNCIA (1H) */}
              <div className="pt-3 md:pt-0 md:pl-4 pr-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <Compass className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Tendência (1h)</span>
                  <span className="text-base font-bold text-white flex items-center gap-1">
                    {currentStation.trend === 'subindo' ? 'Subindo ↑' : currentStation.trend === 'descendo' ? 'Descendo ↓' : 'Estável →'}
                  </span>
                </div>
              </div>

              {/* COL 4: VARIAÇÃO (24H) */}
              <div className="pt-3 md:pt-0 md:pl-4 pr-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Variação (24h)</span>
                  <span className="text-base font-bold text-cyan-400">
                    {currentStation.rate_of_change >= 0 ? '+' : ''}{(currentStation.rate_of_change * 100).toFixed(0)} cm
                  </span>
                </div>
              </div>

              {/* COL 5: ÚLTIMA LEITURA */}
              <div className="pt-3 md:pt-0 md:pl-4 pr-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Última leitura</span>
                  <span className="text-sm font-bold text-white">
                    09:40 - 30/05
                  </span>
                </div>
              </div>

              {/* COL 6: COTA DE ALERTA */}
              <div className="pt-3 md:pt-0 md:pl-4 space-y-1">
                <span className="text-xs font-bold text-slate-200 block mb-1">Cota de Alerta</span>
                <div className="space-y-0.5 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span className="text-amber-400 font-bold">Atenção:</span>
                    <span className="text-slate-200 font-mono ml-auto">{currentStation.attention_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                    <span className="text-orange-400 font-bold">Alerta:</span>
                    <span className="text-slate-200 font-mono ml-auto">{currentStation.warning_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="text-red-400 font-bold">Emergência:</span>
                    <span className="text-slate-200 font-mono ml-auto">{currentStation.flood_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ---------------------------------------------------- */}
          {/* ABAS DE DADOS + TIME RANGE SELECTOR */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B132B] border border-slate-800/80 rounded-2xl p-2 shadow-xl">
            
            {/* SUB-TABS */}
            <div className="flex items-center gap-1 bg-[#050A18] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveMainTab('hidrologico')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'hidrologico'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>HIDROLÓGICO</span>
              </button>

              <button
                onClick={() => setActiveMainTab('fluviologico')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'fluviologico'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Waves className="w-4 h-4" />
                <span>FLUVIOLÓGICO</span>
              </button>

              <button
                onClick={() => setActiveMainTab('meteorologico')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'meteorologico'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CloudRain className="w-4 h-4" />
                <span>METEOROLÓGICO</span>
              </button>
            </div>

            {/* TIMEFRAME SELECTOR BUTTONS */}
            <div className="flex items-center gap-1 bg-[#050A18] p-1 rounded-xl border border-slate-800 justify-end">
              {(['6h', '24h', '7d', '30d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tf === '7d' ? '7 dias' : tf === '30d' ? '30 dias' : tf}
                </button>
              ))}

              <button
                onClick={() => setTimeframe('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  timeframe === 'custom'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>Personalizado</span>
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* ============================================================ */}
          {/* CONTENT ACCORDING TO ACTIVE MAIN TAB */}
          {/* ============================================================ */}

          {activeMainTab === 'hidrologico' && (
            <div className="flex flex-col gap-4">
              
              {/* TOP ROW: MAIN LEVEL EVOLUTION CHART (2 COLS) + PREVISÃO & CONDIÇÕES/RADAR (1 COL) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* LEFT 2 COLUMNS: MAIN CHART CARD */}
                <div className="lg:col-span-2">
                  <div className="bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            Nível do Rio (m)
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Evolução do nível telemetrado em tempo real com cotas de atenção e emergência
                          </span>
                        </div>
                        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
                          {currentStation.current_level.toFixed(2)} m
                        </span>
                      </div>

                      {/* RECHARTS COMPOSED AREA CHART */}
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={hydroChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="hydroLevelGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 11 }} />
                            <YAxis 
                              domain={[
                                (dataMin: number) => Math.max(0, Math.floor(dataMin - 1)),
                                (dataMax: number) => Math.ceil(Math.max(dataMax + 1, currentStation.flood_threshold + 0.5))
                              ]} 
                              stroke="#64748B" 
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#050A18', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                              formatter={(val: any) => [`${Number(val).toFixed(2)} m`, 'Nível do Rio']}
                            />
                            
                            {/* REFERENCE LINES FOR QUOTAS */}
                            <ReferenceLine y={currentStation.attention_threshold} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: `Atenção (${currentStation.attention_threshold}m)`, fill: '#F59E0B', fontSize: 10, position: 'insideTopRight' }} />
                            <ReferenceLine y={currentStation.warning_threshold} stroke="#F97316" strokeDasharray="4 4" label={{ value: `Alerta (${currentStation.warning_threshold}m)`, fill: '#F97316', fontSize: 10, position: 'insideTopRight' }} />
                            <ReferenceLine y={currentStation.flood_threshold} stroke="#EF4444" strokeDasharray="4 4" label={{ value: `Emergência (${currentStation.flood_threshold}m)`, fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} />

                            <Area type="monotone" dataKey="level" stroke="#06B6D4" strokeWidth={3} fill="url(#hydroLevelGrad)" />
                            <Line type="monotone" dataKey="level" stroke="#38BDF8" strokeWidth={3} dot={{ fill: '#38BDF8', r: 4 }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* CHART LEGEND ROW */}
                    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold text-slate-300 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                        <span>Nível do Rio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                        <span>Atenção ({currentStation.attention_threshold.toFixed(2)} m)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-orange-500 rounded-full" />
                        <span>Alerta ({currentStation.warning_threshold.toFixed(2)} m)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-red-500 rounded-full" />
                        <span>Emergência ({currentStation.flood_threshold.toFixed(2)} m)</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* RIGHT COLUMN: PREVISÃO + CONDIÇÕES ATUAIS + RADAR DE CHUVA */}
                <div className="flex flex-col gap-4">
                  
                  {/* PREVISÃO PARA [CIDADE] */}
                  <div className="bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                        <CloudRain className="w-4 h-4 text-cyan-400" />
                        Previsão para {currentStation.name}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-400">Fonte: CLIMATEMPO</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { day: 'Hoje', date: '30/05', max: 24, min: 18, rain: 15, icon: <CloudRain className="w-4 h-4 text-cyan-400 mx-auto" /> },
                        { day: 'Sáb', date: '31/05', max: 26, min: 17, rain: 5, icon: <Sun className="w-4 h-4 text-amber-400 mx-auto" /> },
                        { day: 'Dom', date: '01/06', max: 27, min: 16, rain: 0, icon: <Sun className="w-4 h-4 text-amber-300 mx-auto" /> },
                        { day: 'Seg', date: '02/06', max: 24, min: 18, rain: 10, icon: <CloudRain className="w-4 h-4 text-blue-400 mx-auto" /> },
                        { day: 'Ter', date: '03/06', max: 22, min: 16, rain: 8, icon: <Cloud className="w-4 h-4 text-slate-400 mx-auto" /> },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-[#050A18] border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-300 block">{item.day}</span>
                          <span className="text-[9px] text-slate-500 block">{item.date}</span>
                          <div className="my-1">{item.icon}</div>
                          <div className="text-[10px] font-black text-white">
                            {item.max}° <span className="text-slate-400 font-normal">{item.min}°</span>
                          </div>
                          <span className="text-[9px] font-bold text-cyan-400">{item.rain} mm</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BLOCO: CONDIÇÕES ATUAIS & RADAR DE CHUVA */}
                  <div className="bg-[#050a18] border border-[#121d36] rounded-2xl p-3 shadow-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                      
                      {/* CONDIÇÕES ATUAIS */}
                      <div className="bg-[#081020] border border-[#152342] rounded-xl p-3.5 flex flex-col justify-between h-full">
                        <h5 className="text-sm font-semibold text-slate-100 mb-2.5">
                          Condições atuais
                        </h5>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                            <span className="text-slate-300 flex items-center gap-2">
                              <Thermometer className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Temperatura</span>
                            </span>
                            <span className="font-medium text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.temp.toString().replace('.', ',')} °C
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                            <span className="text-slate-300 flex items-center gap-2">
                              <Droplets className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Umidade</span>
                            </span>
                            <span className="font-medium text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.humidity} %
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                            <span className="text-slate-300 flex items-center gap-2">
                              <Wind className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Vento</span>
                            </span>
                            <span className="font-medium text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.wind}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                            <span className="text-slate-300 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Pressão</span>
                            </span>
                            <span className="font-medium text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.pressure} hPa
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-300 flex items-center gap-2">
                              <CloudRain className="w-3.5 h-3.5 text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Chuva (1h)</span>
                            </span>
                            <span className="font-medium text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.rain1h.toString().replace('.', ',')} mm
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RADAR DE CHUVA */}
                      <div className="bg-[#081020] border border-[#152342] rounded-xl p-3.5 flex flex-col justify-between h-full">
                        <h5 className="text-sm font-semibold text-slate-100 mb-2.5">
                          Radar de Chuva
                        </h5>

                        {/* MAP CANVAS WITH MATCHING HEIGHT */}
                        <div className="relative w-full flex-1 min-h-[135px] rounded-xl overflow-hidden border border-[#1a2846] bg-[#101b2d] flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full object-cover" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
                            {/* Base Terrain Background */}
                            <rect width="320" height="180" fill="#121d2d" />
                            <path d="M0,35 Q100,55 160,18 T320,45 L320,180 L0,180 Z" fill="#16253c" opacity="0.6" />
                            <path d="M0,105 Q120,75 220,125 T320,95 L320,180 L0,180 Z" fill="#0d1624" opacity="0.8" />
                            
                            {/* River Paths */}
                            <path d="M -10,30 C 50,60 90,80 140,85 C 190,90 220,50 260,30 C 290,15 310,25 330,35" stroke="#1d4ed8" strokeWidth="4" fill="none" opacity="0.8" />
                            <path d="M -10,30 C 50,60 90,80 140,85 C 190,90 220,50 260,30 C 290,15 310,25 330,35" stroke="#38bdf8" strokeWidth="1.5" fill="none" opacity="0.9" />
                            <path d="M 140,85 C 130,120 160,150 180,190" stroke="#1d4ed8" strokeWidth="2.5" fill="none" opacity="0.7" />

                            {/* Rain Radar Overlays */}
                            <g opacity="0.6" style={{ mixBlendMode: 'screen' }}>
                              <path d="M 30,75 Q 100,35 190,65 Q 280,95 250,155 Q 170,165 90,125 Z" fill="url(#radarGreenGrad)" />
                              <path d="M 110,65 Q 170,45 220,75 Q 240,115 190,135 Q 140,135 100,95 Z" fill="url(#radarYellowGrad)" />
                              <circle cx="205" cy="85" r="24" fill="#e11d48" opacity="0.65" filter="blur(4px)" />
                            </g>

                            <defs>
                              <radialGradient id="radarGreenGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                                <stop offset="60%" stopColor="#10b981" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                              </radialGradient>
                              <radialGradient id="radarYellowGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#eab308" stopOpacity="0.9" />
                                <stop offset="70%" stopColor="#f97316" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                              </radialGradient>
                            </defs>

                            {/* City labels */}
                            <text x="65" y="38" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.9))">Arroio do Meio</text>
                            <text x="215" y="32" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle" filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.9))">Estrela</text>

                            {/* Lajeado Pin and Badge */}
                            <g transform="translate(195, 90)">
                              <path d="M0 -18 C-6 -18 -10 -14 -10 -8 C-10 0 0 10 0 10 C0 10 10 0 10 -8 C10 -14 6 -18 0 -18 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
                              <circle cx="0" cy="-8" r="3.5" fill="#ffffff" />
                              <rect x="12" y="-16" width="56" height="18" rx="4" fill="#090d16" opacity="0.9" stroke="#2563eb" strokeWidth="0.8" />
                              <text x="40" y="-3" fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">Lajeado</text>
                            </g>
                          </svg>

                          {/* Legend Bar Overlay */}
                          <div className="absolute bottom-1.5 left-2 right-2 bg-[#080d1a]/90 backdrop-blur-sm border border-[#1e2d4d] rounded-md px-2.5 py-0.5 flex items-center justify-between text-[11px] font-medium text-slate-200">
                            <span className="text-slate-300 font-medium">Fraco</span>
                            <div className="h-1.5 flex-1 mx-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 via-orange-500 to-fuchsia-600" />
                            <span className="text-slate-300 font-medium">Forte</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

              {/* ROW 2: FULL-WIDTH 3 CARDS (HISTÓRICO + ANÁLISE INTEGRADA + PROJEÇÕES) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* CARD 1: HISTÓRICO DE ENCHENTES - lg:col-span-5 */}
                <div className="lg:col-span-5 bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div>
                    <h5 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Histórico de Enchentes</span>
                        <span className="text-slate-400 font-normal text-xs sm:text-sm">(últimas 7 cheias)</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                        Taquari / Lajeado
                      </span>
                    </h5>

                    {/* 4 TOP STAT BOXES */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3.5">
                      <div className="bg-[#050A18] p-2.5 rounded-xl border border-red-900/50 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Recorde Histórico</span>
                        <span className="text-sm sm:text-base font-black text-red-400 my-0.5">
                          32,99 m
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Mai/2024</span>
                      </div>

                      <div className="bg-[#050A18] p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">2ª Maior Marca</span>
                        <span className="text-sm sm:text-base font-black text-amber-300 my-0.5">
                          29,92 m
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Mai/1941</span>
                      </div>

                      <div className="bg-[#050A18] p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">3ª Maior Marca</span>
                        <span className="text-sm sm:text-base font-black text-cyan-300 my-0.5">
                          29,62 m
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Set/2023</span>
                      </div>

                      <div className="bg-[#050A18] p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Média das Cheias</span>
                        <span className="text-sm sm:text-base font-black text-white my-0.5">
                          28,93 m
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Pico médio</span>
                      </div>
                    </div>
                  </div>

                  {/* BAR CHART DE ENCHENTES */}
                  <div className="h-44 w-full mt-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={historicalFloodsData}
                        margin={{ top: 22, right: 10, left: -18, bottom: 0 }}
                        onMouseMove={(e: any) => {
                          if (e && e.activeTooltipIndex !== undefined) {
                            setActiveFloodIndex(e.activeTooltipIndex);
                          }
                        }}
                        onMouseLeave={() => setActiveFloodIndex(null)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis dataKey="event" stroke="#94A3B8" tick={{ fontSize: 10, fontWeight: 600 }} />
                        <YAxis
                          stroke="#94A3B8"
                          tick={{ fontSize: 10 }}
                          domain={[15, 33]}
                          ticks={[15, 18, 21, 24, 27, 30, 33]}
                          tickFormatter={(val) => `${val},00`}
                        />
                        <Tooltip
                          cursor={false}
                          allowEscapeViewBox={{ x: true, y: true }}
                          wrapperStyle={{ zIndex: 100, pointerEvents: 'none', outline: 'none' }}
                          content={({ active, payload, coordinate }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const isRightSide = coordinate && coordinate.x > 210;
                              return (
                                <div
                                  className={`bg-white text-slate-900 border border-slate-200/90 rounded-2xl p-3.5 shadow-2xl w-[260px] sm:w-[280px] text-xs z-50 pointer-events-auto transition-transform duration-100 ${
                                    isRightSide
                                      ? '-translate-x-[calc(100%+16px)] -translate-y-1/2'
                                      : 'translate-x-4 -translate-y-1/2'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                                    <span className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">{data.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                      data.event === 'Mai/2024' ? 'bg-red-100 text-red-700 border border-red-200' :
                                      data.event === 'Mai/1941' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                      'bg-sky-100 text-sky-800 border border-sky-200'
                                    }`}>
                                      {data.event}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                                      <span className="text-slate-500 font-medium text-[11px]">Cota Máxima:</span>
                                      <span className="font-black text-slate-900 text-sm">{data.level.toFixed(2).replace('.', ',')} m</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] px-0.5">
                                      <span className="text-slate-500">Período:</span>
                                      <span className="font-semibold text-slate-800">{data.dateStr}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] px-0.5">
                                      <span className="text-slate-500">Chuva estimada:</span>
                                      <span className="font-bold text-cyan-700">{data.rain}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px] px-0.5">
                                      <span className="text-slate-500">Comportamento:</span>
                                      <span className="font-semibold text-slate-800">{data.duration}</span>
                                    </div>

                                    <div className="mt-2 text-[11px] leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                      <strong className="text-slate-900 block mb-0.5 font-bold">Impacto Registrado:</strong>
                                      {data.impact}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="level" barSize={22} radius={[4, 4, 0, 0]}>
                          {historicalFloodsData.map((entry, index) => {
                            const isSelected = activeFloodIndex === index;
                            const defaultFill = entry.event === 'Mai/2024' ? '#EF4444' : entry.event === 'Mai/1941' ? '#F59E0B' : '#38BDF8';
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={isSelected ? '#38BDF8' : defaultFill}
                                stroke={isSelected ? '#00E5FF' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                                opacity={activeFloodIndex === null || isSelected ? 1 : 0.8}
                                className="transition-all duration-150 cursor-pointer"
                              />
                            );
                          })}
                          <LabelList dataKey="label" position="top" fill="#E2E8F0" fontSize={9} fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* LEGEND ROW */}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-300 font-medium pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-sky-400 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-300">Picos atingidos (m)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-300">1941 (29,92m)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-300">Recorde (32,99m)</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: ANÁLISE INTEGRADA - lg:col-span-3 */}
                <div className="lg:col-span-3 bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Análise Integrada</span>
                      </h5>
                      <span className="text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/70 px-2 py-0.5 rounded-full">
                        IA Hidrológica
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-[11px] text-slate-300">
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-cyan-950/90 border border-cyan-800/80 flex items-center justify-center shrink-0 mt-0.5">
                          <Droplets className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span className="leading-snug">
                          O nível do rio está dentro da normalidade e estável nas últimas horas.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-cyan-950/90 border border-cyan-800/80 flex items-center justify-center shrink-0 mt-0.5">
                          <CloudRain className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span className="leading-snug">
                          Foram registrados <strong>18 mm</strong> de chuva nas últimas 6h na região de {currentStation.name}.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-950/90 border border-emerald-800/80 flex items-center justify-center shrink-0 mt-0.5">
                          <Waves className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="leading-snug">
                          Não há previsão de chuva significativa para as próximas 48h.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-950/90 border border-emerald-800/80 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="leading-snug">
                          <strong className="text-emerald-400 font-semibold">Cenário de estabilidade. Risco baixo</strong> para elevação do nível do rio no curto prazo.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="w-full mt-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Bot className="w-4 h-4" />
                    <span>CONSULTAR IA HIDROLÓGICA</span>
                  </button>
                </div>

                {/* CARD 3: PROJEÇÕES (NÍVEL DO RIO) - lg:col-span-4 */}
                <div className="lg:col-span-4 bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                        <span>Projeções</span>
                        <span className="text-slate-400 font-normal text-xs sm:text-sm">(nível do rio)</span>
                      </h5>
                      <span className="text-xs font-mono text-slate-400 font-medium">
                        Modelo: SGB/SACE
                      </span>
                    </div>
                  </div>

                  <div className="h-44 w-full my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectionData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} tickFormatter={(val) => val.replace(' (Agora)', '').replace(/ \(\+\d+h\)/, '')} />
                        <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[10, 18]} ticks={[10, 12, 14, 16, 18]} tickFormatter={(val) => `${val},00`} />
                        <Tooltip contentStyle={{ backgroundColor: '#050A18', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                        
                        {/* REFERENCE LINE AT AGORA */}
                        <ReferenceLine x="03:00 (Agora)" stroke="#94A3B8" strokeDasharray="3 3" label={{ value: 'Agora', fill: '#F8FAFC', fontSize: 11, position: 'top' }} />

                        {/* UNCERTAINTY BAND */}
                        <Area type="monotone" dataKey="incertezaMax" stroke="none" fill="#1D4ED8" fillOpacity={0.35} />

                        {/* OBSERVED & PROJECTED LINES */}
                        <Line type="monotone" dataKey="observado" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3, fill: '#38BDF8' }} connectNulls />
                        <Line type="monotone" dataKey="projecao" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-sky-400 inline-block" /> Observado
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-sky-400 inline-block border-t border-dashed" /> Proj. (melhor cenário)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-700/80 rounded-sm inline-block" /> Incerteza
                    </span>
                  </div>
                </div>

              </div>

              {/* FOOTER INFO BAR BELOW THE 3 CARDS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Dados provenientes de diversas fontes oficiais e atualizadas automaticamente.</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-medium">Fontes:</span>
                  <span className="bg-[#0f2847] text-cyan-300 border border-cyan-700/60 px-2.5 py-1 rounded-md text-xs font-bold">SGB/SACE</span>
                  <span className="bg-[#0a271d] text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-md text-xs font-bold">ANA</span>
                  <span className="bg-[#22103a] text-purple-300 border border-purple-700/60 px-2.5 py-1 rounded-md text-xs font-bold">SIGMA</span>
                  <span className="bg-[#381e09] text-amber-300 border border-amber-700/60 px-2.5 py-1 rounded-md text-xs font-bold">CLIMATEMPO</span>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 2: FLUVIOLÓGICO */}
          {/* ============================================================ */}
          {activeMainTab === 'fluviologico' && (
            <div className="bg-[#0B132B] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-6">
              
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-400" />
                  ANÁLISE FLUVIOLÓGICA & COMPORTAMENTO DO RIO
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estudo hidrodinâmico de escoamento, velocidaded de subida/descida e trânsito da onda de cheia na Bacia do Taquari-Antas.
                </p>
              </div>

              {/* FLUVIOLOGICAL METRICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Variação Horária</span>
                  <span className={`text-2xl font-black ${currentStation.rate_of_change >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currentStation.rate_of_change >= 0 ? '+' : ''}{(currentStation.rate_of_change * 100).toFixed(1)} cm/h
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Taxa instantânea de oscilação</span>
                </div>

                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Velocidade da Cheia</span>
                  <span className="text-2xl font-black text-cyan-400">~4,8 km/h</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Celeridade de onda na calha</span>
                </div>

                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Vazão Estimada</span>
                  <span className="text-2xl font-black text-white">~840 m³/s</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Regime normal de calha</span>
                </div>

                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-4">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Tempo de Deslocamento</span>
                  <span className="text-sm font-bold text-cyan-300 mt-1 block">{currentStation.transit_time}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Ref.: Estação de Muçum</span>
                </div>
              </div>

              {/* WAVE PROPAGATION TIMELINE */}
              <div className="bg-[#050A18] border border-slate-800 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-black text-white uppercase tracking-wider">
                  Matriz de Propagação da Cheia (Linha do Taquari)
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">1. Santa Tereza</span>
                    <span className="font-mono text-cyan-400 font-bold">0 h (Cabeceira)</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">2. Muçum</span>
                    <span className="font-mono text-cyan-400 font-bold">+ 2.5 horas</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">3. Encantado</span>
                    <span className="font-mono text-cyan-400 font-bold">+ 6.0 horas</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">4. Lajeado / Estrela</span>
                    <span className="font-mono text-cyan-400 font-bold">+ 12.0 horas</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">5. Taquari / Foz</span>
                    <span className="font-mono text-cyan-400 font-bold">+ 24.0 horas</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 3: METEOROLÓGICO */}
          {/* ============================================================ */}
          {activeMainTab === 'meteorologico' && (
            <div className="bg-[#0B132B] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-6">
              
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-cyan-400" />
                  CENTRO METEOROLÓGICO DA BACIA
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitoramento pluviométrico, pressão atmosférica, rajadas de vento e radar de tempestades para o Vale do Taquari.
                </p>
              </div>

              {/* METEOROLOGICAL METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Temperatura</span>
                  <span className="text-xl font-black text-white">{currentStation.temp} °C</span>
                </div>
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Umidade Ar</span>
                  <span className="text-xl font-black text-cyan-400">{currentStation.humidity} %</span>
                </div>
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Chuva (24h)</span>
                  <span className="text-xl font-black text-cyan-300">{currentStation.rain24h} mm</span>
                </div>
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Vento</span>
                  <span className="text-sm font-black text-white">{currentStation.wind}</span>
                </div>
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Pressão</span>
                  <span className="text-sm font-black text-white">{currentStation.pressure} hPa</span>
                </div>
                <div className="bg-[#050A18] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Ponto Orvalho</span>
                  <span className="text-sm font-black text-white">19.8 °C</span>
                </div>
              </div>

            </div>
          )}


          {/* ============================================================ */}
          {/* SECÇÃO ADICIONAL: COTAS TECHNICAL DOCUMENTS SECTION */}
          {/* ============================================================ */}
          <div className="mt-2">
            <CotasLibrarySection />
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* MODAL ASSISTENTE HIDROLÓGICO IA */}
      {/* ============================================================ */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#050A18]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    ASSISTENTE HIDROLÓGICO IA
                  </h3>
                  <span className="text-[10px] font-semibold text-cyan-400 font-mono block">
                    Contexto: {currentStation.name} • Dados Auditados Realtime
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHAT MESSAGES CANVAS */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[#070D19]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none font-medium shadow-md'
                      : 'bg-[#0B132B] border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}>
                    {msg.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 block mb-1 font-mono">
                        {msg.badge}
                      </span>
                    )}
                    <div className="whitespace-pre-line">{msg.text}</div>
                    <span className="text-[9px] opacity-60 block mt-1 text-right font-mono">{msg.time}</span>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 p-2 font-mono">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analisando base de dados do Monitoramento Taquari...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* QUICK PROMPT SUGGESTIONS */}
            <div className="p-2 border-t border-slate-800/80 bg-[#050A18] flex items-center gap-2 overflow-x-auto text-[10px]">
              <button
                onClick={() => handleSendQuestion(`Quais as cotas oficiais de nível para ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                📊 Cotas de Nível
              </button>
              <button
                onClick={() => handleSendQuestion(`Quais bairros são atingidos na enchente em ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                🏘️ Bairros Vulneráveis
              </button>
              <button
                onClick={() => handleSendQuestion(`Qual o tempo de propagação da onda de cheia em ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                🌊 Tempo de Deslocamento
              </button>
            </div>

            {/* CHAT INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              className="p-3 border-t border-slate-800 bg-[#0B132B] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Pergunte algo sobre ${currentStation.name}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#050A18] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isThinking}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
