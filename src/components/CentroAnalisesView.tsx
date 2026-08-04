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
  Target,
  ArrowUp, ArrowRight,
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
  CartesianGrid,
  Brush
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

  // --- MOCK DATA PARA ABA FLUVIOLÓGICA ---
  const variacaoNivelData = [
    { time: '09:00', level: 12, trend: 'up' },
    { time: '12:00', level: 8, trend: 'down' },
    { time: '15:00', level: -2, trend: 'down' },
    { time: '18:00', level: -8, trend: 'down' },
    { time: '21:00', level: -15, trend: 'down' },
    { time: '00:00', level: -2, trend: 'up' },
    { time: '03:00', level: 6, trend: 'up' },
    { time: '06:00', level: 14, trend: 'up' },
    { time: '09:00', level: 2, trend: 'down' }
  ];

  const propagacaoChain = [
    { name: 'Santa Tereza', level: '9,12 m', variacao: '+1 cm', delay: '09:40' },
    { name: 'Muçum', level: '11,35 m', variacao: '+2 cm', delay: '09:40', timeDiff: '3h 10m' },
    { name: 'Encantado', level: '12,28 m', variacao: '+2 cm', delay: '09:40', timeDiff: '2h 20m' },
    { name: 'Lajeado', level: '13,42 m', variacao: '+2 cm', delay: '09:40', timeDiff: '1h 40m' }
  ];

  const historicoCheias = [
    { name: 'Evento 2024', label: '(maior)', value: '14,85 m', color: 'text-red-500' },
    { name: 'Evento 2023', label: '', value: '13,78 m', color: 'text-amber-500' },
    { name: 'Evento 2022', label: '', value: '12,96 m', color: 'text-yellow-500' },
    { name: 'Evento Atual', label: '', value: '13,42 m', color: 'text-cyan-500' }
  ];

  const taxaVariacaoData = [
    { time: '09:00', val: 1.2 }, { time: '12:00', val: 2.3 }, 
    { time: '15:00', val: 1.5 }, { time: '18:00', val: 0.8 }, 
    { time: '21:00', val: -0.5 }, { time: '00:00', val: -1.8 }, 
    { time: '03:00', val: -0.2 }, { time: '06:00', val: 1.1 }, 
    { time: '09:00', val: 0.6 }
  ];

  const curvaChaveData = [
    { nivel: 8.5, vazao: 400 },
    { nivel: 9, vazao: 600 },
    { nivel: 10, vazao: 1000 },
    { nivel: 11, vazao: 1500 },
    { nivel: 12, vazao: 1900 },
    { nivel: 13, vazao: 2250, current: true },
    { nivel: 14, vazao: 2700 },
    { nivel: 15, vazao: 3200 },
    { nivel: 16, vazao: 3800 },
    { nivel: 17, vazao: 4500 },
    { nivel: 18, vazao: 5200 }
  ];

  const oscilacaoData = [
    { day: '24/05', amplitude: 22 },
    { day: '25/05', amplitude: 30 },
    { day: '26/05', amplitude: 25 },
    { day: '27/05', amplitude: 32 },
    { day: '28/05', amplitude: 18 },
    { day: '29/05', amplitude: 12 },
    { day: '30/05', amplitude: 25 }
  ];
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

export const CentroAnalisesView: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {
  // Navigation & Filter States
  const [selectedStationId, setSelectedStationId] = useState<string>('lajeado');
  const [activeMainTab, setActiveMainTab] = useState<'hidrologico' | 'fluviologico' | 'meteorologico'>('fluviologico');
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
  const chartScrollRef = useRef<HTMLDivElement>(null);

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

  // Historical Floods Dataset synchronized with selected station (currentStation)
  // Includes 2025, 2026, and automatic flood detection when level >= 19m or >= flood_threshold
  const historicalFloodsData = useMemo(() => {
    const stationId = currentStation.id;
    const floodLimit = currentStation.flood_threshold;
    const ratio = floodLimit / 19.0;

    let rawEvents: Array<{
      event: string;
      level: number;
      title: string;
      dateStr: string;
      rain: string;
      impact: string;
      duration: string;
      category: string;
    }> = [];

    if (stationId === 'santa-tereza') {
      rawEvents = [
        { event: 'Mai/1941', level: 21.50, title: 'Cheia Histórica de 1941 (Santa Tereza)', dateStr: '05/05/1941 a 12/05/1941', rain: '~600 mm', impact: 'Submersão das margens de Santa Tereza nas cabeceiras do Taquari.', duration: '7 dias', category: 'Cheia Histórica' },
        { event: 'Jun/1982', level: 18.40, title: 'Cheia de 1982', dateStr: '22/06/1982 a 26/06/1982', rain: '~380 mm', impact: 'Inundação das áreas rurais e acessos baixos.', duration: '4 dias', category: 'El Niño' },
        { event: 'Out/2015', level: 18.10, title: 'Cheia de Out/2015', dateStr: '14/10/2015 a 18/10/2015', rain: '~340 mm', impact: 'Alagamentos em trechos ribeirinhos urbanos.', duration: '3 dias', category: 'Primavera' },
        { event: 'Jul/2020', level: 19.20, title: 'Ciclone Jul/2020', dateStr: '07/07/2020 a 10/07/2020', rain: '~320 mm', impact: 'Rápida subida d’água com interrupção de travessias.', duration: '48h', category: 'Ciclone' },
        { event: 'Set/2023', level: 22.40, title: 'Ciclone Set/2023', dateStr: '04/09/2023 a 06/09/2023', rain: '> 300 mm', impact: 'Torrente violenta e rápida nas cabeceiras.', duration: 'Subida em 12h', category: 'Catástrofe' },
        { event: 'Nov/2023', level: 20.80, title: 'Cheia Nov/2023', dateStr: '18/11/2023 a 20/11/2023', rain: '~310 mm', impact: 'Segunda grande cheia do ano em solos saturados.', duration: '36h', category: 'Severa' },
        { event: 'Mai/2024', level: 24.20, title: 'Recorde Absoluto (Mai/2024)', dateStr: '30/04/2024 a 05/05/2024', rain: '> 700 mm', impact: 'Maior cheia registrada na história de Santa Tereza.', duration: 'Extrema', category: 'Recorde Absoluto' },
        { event: 'Set/2025', level: 16.80, title: 'Cheia Primavera 2025', dateStr: '18/09/2025 a 21/09/2025', rain: '~280 mm', impact: 'Superou a cota de transbordo (13m) alagando a orla.', duration: '2.5 dias', category: 'Cheia 2025' },
        { event: 'Jun/2026', level: 15.10, title: 'Cheia Inverno 2026', dateStr: '10/06/2026 a 13/06/2026', rain: '~240 mm', impact: 'Elevação invernal com alerta nos acessos baixos.', duration: '30h', category: 'Cheia 2026' }
      ];
    } else if (stationId === 'mucum') {
      rawEvents = [
        { event: 'Mai/1941', level: 25.10, title: 'Cheia de 1941 (Muçum)', dateStr: '05/05/1941 a 12/05/1941', rain: '~600 mm', impact: 'Histórico transbordo cobrindo a orla do vale.', duration: '7 dias', category: 'Cheia Histórica' },
        { event: 'Jun/1982', level: 21.90, title: 'Cheia de 1982', dateStr: '22/06/1982 a 26/06/1982', rain: '~380 mm', impact: 'Inundação nas proximidades da linha férrea.', duration: '4 dias', category: 'El Niño' },
        { event: 'Out/2015', level: 21.40, title: 'Cheia Out/2015', dateStr: '14/10/2015 a 18/10/2015', rain: '~340 mm', impact: 'Atingiu centro urbano baixo e bairro Fátima.', duration: '3 dias', category: 'Primavera' },
        { event: 'Jul/2020', level: 22.80, title: 'Cheia Jul/2020', dateStr: '07/07/2020 a 10/07/2020', rain: '~320 mm', impact: 'Elevação veloz por ciclone extratropical.', duration: '48h', category: 'Ciclone' },
        { event: 'Set/2023', level: 26.20, title: 'Catástrofe de Set/2023', dateStr: '04/09/2023 a 06/09/2023', rain: '> 300 mm', impact: 'Devastação extrema no centro urbano de Muçum.', duration: 'Enxurrada súbita', category: 'Catástrofe' },
        { event: 'Nov/2023', level: 24.50, title: 'Cheia Nov/2023', dateStr: '18/11/2023 a 20/11/2023', rain: '~310 mm', impact: 'Novo transbordo violento 2 meses após o ciclone.', duration: '36h', category: 'Severa' },
        { event: 'Mai/2024', level: 28.80, title: 'Recorde Absoluto (Mai/2024)', dateStr: '30/04/2024 a 05/05/2024', rain: '> 700 mm', impact: 'Nível histórico destruindo cotas elevadas da cidade.', duration: 'Devastação Total', category: 'Recorde Absoluto' },
        { event: 'Set/2025', level: 20.30, title: 'Cheia de Set/2025', dateStr: '18/09/2025 a 21/09/2025', rain: '~290 mm', impact: 'Superou a cota de 18m inundando o bairro Fátima.', duration: '2 dias', category: 'Cheia 2025' },
        { event: 'Jun/2026', level: 19.20, title: 'Cheia de Jun/2026', dateStr: '10/06/2026 a 13/06/2026', rain: '~250 mm', impact: 'Transbordo urbano moderado na orla e centro baixo.', duration: '32h', category: 'Cheia 2026' }
      ];
    } else if (stationId === 'encantado') {
      rawEvents = [
        { event: 'Mai/1941', level: 23.80, title: 'Cheia de 1941 (Encantado)', dateStr: '05/05/1941 a 12/05/1941', rain: '~600 mm', impact: 'Inundação no bairro Navegantes e zona baixa.', duration: '7 dias', category: 'Cheia Histórica' },
        { event: 'Jun/1982', level: 20.20, title: 'Cheia de 1982', dateStr: '22/06/1982 a 26/06/1982', rain: '~380 mm', impact: 'Alagamento ribeirinho em áreas de lavoura e moradia.', duration: '4 dias', category: 'El Niño' },
        { event: 'Out/2015', level: 19.90, title: 'Cheia Out/2015', dateStr: '14/10/2015 a 18/10/2015', rain: '~340 mm', impact: 'Submersão de travessias e orla fluvial.', duration: '3 dias', category: 'Primavera' },
        { event: 'Jul/2020', level: 20.90, title: 'Cheia Jul/2020', dateStr: '07/07/2020 a 10/07/2020', rain: '~320 mm', impact: 'Elevação rápida por ciclone extratropical.', duration: '48h', category: 'Ciclone' },
        { event: 'Set/2023', level: 24.10, title: 'Ciclone Set/2023', dateStr: '04/09/2023 a 06/09/2023', rain: '> 300 mm', impact: 'Correntes violentas inundando o Navegantes.', duration: 'Súbita', category: 'Catástrofe' },
        { event: 'Nov/2023', level: 22.60, title: 'Cheia Nov/2023', dateStr: '18/11/2023 a 20/11/2023', rain: '~310 mm', impact: 'Inundação severa no vale do Taquari em Encantado.', duration: '36h', category: 'Severa' },
        { event: 'Mai/2024', level: 26.90, title: 'Recorde Absoluto (Mai/2024)', dateStr: '30/04/2024 a 05/05/2024', rain: '> 700 mm', impact: 'Pico histórico assolando o município de Encantado.', duration: 'Histórica', category: 'Recorde Absoluto' },
        { event: 'Set/2025', level: 18.50, title: 'Cheia Set/2025', dateStr: '18/09/2025 a 21/09/2025', rain: '~280 mm', impact: 'Superou a cota de 16m alagando áreas urbanas baixas.', duration: '2 dias', category: 'Cheia 2025' },
        { event: 'Jun/2026', level: 17.40, title: 'Cheia Jun/2026', dateStr: '10/06/2026 a 13/06/2026', rain: '~240 mm', impact: 'Alerta com água nas vias ribeirinhas do Navegantes.', duration: '30h', category: 'Cheia 2026' }
      ];
    } else if (stationId === 'roca-sales') {
      rawEvents = [
        { event: 'Mai/1941', level: 24.90, title: 'Cheia de 1941 (Roca Sales)', dateStr: '05/05/1941 a 12/05/1941', rain: '~600 mm', impact: 'Inundação do centro urbano histórico.', duration: '7 dias', category: 'Cheia Histórica' },
        { event: 'Jun/1982', level: 21.50, title: 'Cheia de 1982', dateStr: '22/06/1982 a 26/06/1982', rain: '~380 mm', impact: 'Transbordo cobrindo a Avenida Daltro Filho.', duration: '4 dias', category: 'El Niño' },
        { event: 'Out/2015', level: 21.10, title: 'Cheia Out/2015', dateStr: '14/10/2015 a 18/10/2015', rain: '~340 mm', impact: 'Alagamento no bairro Bento Gonçalves.', duration: '3 dias', category: 'Primavera' },
        { event: 'Jul/2020', level: 22.10, title: 'Cheia Jul/2020', dateStr: '07/07/2020 a 10/07/2020', rain: '~320 mm', impact: 'Bloqueio de estradas e cheia urbana.', duration: '48h', category: 'Ciclone' },
        { event: 'Set/2023', level: 25.50, title: 'Catástrofe Set/2023', dateStr: '04/09/2023 a 06/09/2023', rain: '> 300 mm', impact: 'Avassalador volume cobrindo o centro da cidade.', duration: 'Extrema', category: 'Catástrofe' },
        { event: 'Nov/2023', level: 23.80, title: 'Cheia Nov/2023', dateStr: '18/11/2023 a 20/11/2023', rain: '~310 mm', impact: 'Nova subida drástica afetando o comércio.', duration: '36h', category: 'Severa' },
        { event: 'Mai/2024', level: 28.10, title: 'Recorde Absoluto (Mai/2024)', dateStr: '30/04/2024 a 05/05/2024', rain: '> 700 mm', impact: 'Recorde absoluto registrado em Roca Sales.', duration: 'Generalizada', category: 'Recorde Absoluto' },
        { event: 'Set/2025', level: 19.80, title: 'Cheia Set/2025', dateStr: '18/09/2025 a 21/09/2025', rain: '~290 mm', impact: 'Superou a cota de enchente (17m) alagando o centro.', duration: '2 dias', category: 'Cheia 2025' },
        { event: 'Jun/2026', level: 18.60, title: 'Cheia Jun/2026', dateStr: '10/06/2026 a 13/06/2026', rain: '~250 mm', impact: 'Retenção d’água em bairros ribeirinhos baixos.', duration: '32h', category: 'Cheia 2026' }
      ];
    } else {
      // Default (Lajeado, Estrela, or proportional scaling for other stations)
      const baseLajeado = [
        { event: 'Mai/1941', level: 29.92, title: `Cheia Histórica de 1941 (${currentStation.name})`, dateStr: '05/05/1941 a 12/05/1941', rain: '~600 mm', impact: `Grande evento histórico inundando áreas baixas de ${currentStation.name}.`, duration: '7 dias', category: 'Cheia Histórica' },
        { event: 'Jun/1982', level: 26.85, title: `Cheia de 1982 (${currentStation.name})`, dateStr: '22/06/1982 a 26/06/1982', rain: '~380 mm', impact: `Provocada por El Niño forte. Transbordo nas margens de ${currentStation.name}.`, duration: '4 dias', category: 'El Niño' },
        { event: 'Out/2015', level: 26.82, title: `Cheia de Out/2015 (${currentStation.name})`, dateStr: '14/10/2015 a 18/10/2015', rain: '~340 mm', impact: `Precipitação intensa continuada alagando zonas urbanas de ${currentStation.name}.`, duration: '3 dias', category: 'Primavera' },
        { event: 'Jul/2020', level: 27.39, title: `Cheia de Jul/2020 (${currentStation.name})`, dateStr: '07/07/2020 a 10/07/2020', rain: '~320 mm', impact: `Ciclone extratropical com rápida elevação das águas.`, duration: '48h', category: 'Ciclone' },
        { event: 'Set/2023', level: 29.62, title: `Ciclone Set/2023 (${currentStation.name})`, dateStr: '04/09/2023 a 06/09/2023', rain: '> 300 mm', impact: `Devastadora enxurrada torrencial na calha do rio Taquari.`, duration: 'Violenta', category: 'Catástrofe' },
        { event: 'Nov/2023', level: 28.94, title: `Cheia Severa Nov/2023 (${currentStation.name})`, dateStr: '18/11/2023 a 20/11/2023', rain: '~310 mm', impact: `Segunda grande repique em solos previamente saturados.`, duration: '36h', category: 'Severa' },
        { event: 'Mai/2024', level: 33.66, title: `Recorde Absoluto Mai/2024 (${currentStation.name})`, dateStr: '30/04/2024 a 05/05/2024', rain: '> 700 mm', impact: `Recorde histórico absoluto em ${currentStation.name} (33,66m em 02/05/2024). Ultrapassou 1941 em 3,74m.`, duration: 'Devastação Total', category: 'Recorde Absoluto' },
        { event: 'Set/2025', level: 24.15, title: `Cheia de Set/2025 (${currentStation.name})`, dateStr: '18/09/2025 a 22/09/2025', rain: '~290 mm', impact: `Superou a cota de enchente local alagando bairros ribeirinhos.`, duration: '3 dias', category: 'Cheia 2025' },
        { event: 'Jun/2026', level: 21.80, title: `Cheia de Jun/2026 (${currentStation.name})`, dateStr: '10/06/2026 a 14/06/2026', rain: '~260 mm', impact: `Elevação de inverno ativando cota de alerta em ${currentStation.name}.`, duration: '2.5 dias', category: 'Cheia 2026' }
      ];

      if (currentStation.id === 'lajeado' || currentStation.id === 'estrela') {
        rawEvents = baseLajeado;
      } else {
        rawEvents = baseLajeado.map(item => ({
          ...item,
          level: Number((item.level * ratio).toFixed(2))
        }));
      }
    }

    // AUTOMATIC FLOOD DETECTION RULE:
    // If the station's level is >= 19.0m OR >= station.flood_threshold, append active flood automatically!
    const triggerThreshold = Math.min(19.0, floodLimit);
    if (currentStation.current_level >= triggerThreshold || currentStation.current_level >= floodLimit) {
      rawEvents.push({
        event: 'Atual',
        level: Number(currentStation.current_level.toFixed(2)),
        title: `Enchente em Andamento em ${currentStation.name}`,
        dateStr: `${currentStation.last_updated} (2026)`,
        rain: `${currentStation.rain24h} mm (24h)`,
        impact: `Nível atual (${currentStation.current_level.toFixed(2)}m) ultrapassou a cota de inundação (${floodLimit.toFixed(2)}m). Evento adicionado automaticamente ao histórico!`,
        duration: 'Monitoramento em tempo real',
        category: 'Enchente Atual'
      });
    }

    return rawEvents.map(item => ({
      ...item,
      label: `${item.level.toFixed(2).replace('.', ',')}m`,
      desc: item.category
    }));
  }, [currentStation]);

  // Derived Statistics for top 4 cards
  const floodStats = useMemo(() => {
    if (!historicalFloodsData.length) return { record: 0, recordYear: '-', second: 0, secondYear: '-', third: 0, thirdYear: '-', avg: 0 };
    const sorted = [...historicalFloodsData].sort((a, b) => b.level - a.level);
    const avg = sorted.reduce((acc, curr) => acc + curr.level, 0) / sorted.length;
    return {
      record: sorted[0]?.level || 0,
      recordYear: sorted[0]?.event || '-',
      second: sorted[1]?.level || 0,
      secondYear: sorted[1]?.event || '-',
      third: sorted[2]?.level || 0,
      thirdYear: sorted[2]?.event || '-',
      avg: Number(avg.toFixed(2))
    };
  }, [historicalFloodsData]);

  const yDomainMax = useMemo(() => 34, []);

  const yDomainMin = useMemo(() => 15, []);

  // Auto-scroll historical floods chart to the latest record (rightmost)
  useEffect(() => {
    const scrollToRight = () => {
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
      }
    };
    scrollToRight();
    const timer1 = setTimeout(scrollToRight, 100);
    const timer2 = setTimeout(scrollToRight, 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [historicalFloodsData, currentStation]);

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
    <div className="w-full min-h-screen bg-transparent text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased">
      
      {/* ============================================================ */}
      {/* MAIN LAYOUT: LEFT SIDEBAR + RIGHT DASHBOARD CANVAS */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1800px] mx-auto p-2 sm:p-3 lg:p-4 gap-3.5 items-start">
        
        {/* ========================================== */}
        {/* MENU LATERAL ESQUERDO (FIXED LEFT SIDEBAR) */}
        {/* ========================================== */}
        <aside className="w-full lg:w-[225px] xl:w-[235px] shrink-0 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col gap-3 shadow-xl lg:sticky lg:top-4 lg:self-start z-20">
          
          {/* LOGO / BRANDING HEADER */}
          <div className="flex items-center gap-2.5 px-0.5 pt-0.5 pb-2 border-b border-slate-300 dark:border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
              <Waves className="w-4 h-4 text-slate-900 dark:text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase truncate flex items-center gap-1">
                MONITORAMENTO TAQUARI
              </h1>
              <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                Centro de Análise Hidrológica
              </p>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar cidade ou estação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl text-[11px] text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* CITIES & STATIONS LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] lg:max-h-[calc(100vh-250px)] pr-0.5 custom-scrollbar">
            
            {/* GROUP 1: CIDADES MONITORADAS */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-1.5 block">
                CIDADES MONITORADAS
              </span>
              <div className="space-y-1">
                {filteredCities.map((st) => {
                  const isSelected = st.id === selectedStationId;
                  const isNormal = st.status_level === 'normal';
                  const isWarning = st.status_level === 'atencao';
                  const isAlert = st.status_level === 'alerta';
                  const isFlood = st.status_level === 'inundacao';

                  const statusLabel = isNormal ? 'Normal' : isWarning ? 'Atenção' : isAlert ? 'Alerta' : 'Inundação';
                  const statusColor = isNormal ? 'text-emerald-500' : isWarning ? 'text-amber-400' : isAlert ? 'text-orange-500' : 'text-red-500';
                  const dotBg = isNormal ? 'bg-emerald-500' : isWarning ? 'bg-amber-400' : isAlert ? 'bg-orange-500' : 'bg-red-500 animate-pulse';

                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-600 dark:bg-[#16223B] border border-cyan-600 dark:border-cyan-500/60 shadow-md text-white' 
                          : 'bg-slate-100/60 dark:bg-[#081023]/60 hover:bg-slate-200 dark:hover:bg-[#0E1B36] border border-slate-300/60 dark:border-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Waves className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <div className="truncate">
                          <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {st.name}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                            {st.river}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className={`w-2 h-2 rounded-full ${dotBg}`} />
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-cyan-200' : statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP 2: ESTAÇÕES DE AFLUENTES */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-1.5 block">
                ESTAÇÕES AFLUENTES
              </span>
              <div className="space-y-1">
                {filteredAfluentes.map((st) => {
                  const isSelected = st.id === selectedStationId;
                  const isNormal = st.status_level === 'normal';
                  const isWarning = st.status_level === 'atencao';

                  const statusLabel = isNormal ? 'Normal' : 'Atenção';
                  const statusColor = isNormal ? 'text-emerald-500' : 'text-amber-400';
                  const dotBg = isNormal ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse';

                  return (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStationId(st.id)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-600 dark:bg-[#16223B] border border-cyan-600 dark:border-cyan-500/60 shadow-md text-white' 
                          : 'bg-slate-100/60 dark:bg-[#081023]/60 hover:bg-slate-200 dark:hover:bg-[#0E1B36] border border-slate-300/60 dark:border-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Activity className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <div className="truncate">
                          <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                            {st.name}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                            {st.river}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className={`w-2 h-2 rounded-full ${dotBg}`} />
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-cyan-200' : statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BOTTOM LINK: VISÃO DA BACIA */}
          <div className="pt-2 border-t border-slate-300 dark:border-slate-800/80">
            <button
              onClick={() => setSelectedStationId('lajeado')}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#050A18] hover:bg-slate-100 dark:hover:bg-[#0F1B35] border border-slate-300 dark:border-slate-800 rounded-xl text-left flex items-center gap-2.5 transition-colors cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
                <MapIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white block truncate">Visão da Bacia</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate">Mapa geral do Vale do Taquari</span>
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
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5 px-0.5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wider uppercase">
                CENTRO DE ANÁLISES
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dados integrados de hidrologia, fluviologia e meteorologia
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span>Última atualização:</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">30/05/2025 09:45</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ao vivo</span>
              </div>

              <div className="flex items-center gap-2 ml-1">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-7 h-7 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Ajuda"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-7 h-7 rounded-full border border-slate-700/80 hover:border-slate-500 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer relative"
                  title="Notificações"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </header>

          {/* ---------------------------------------------------- */}
          {/* CARDS SUPERIORES (TOP METRICS BANNER FOR SELECTED CITY) */}
          {/* ---------------------------------------------------- */}
          <section className="bg-white dark:bg-[#091122] border border-slate-300 dark:border-[#162342] rounded-2xl py-2.5 px-3.5 sm:px-4 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 lg:gap-3.5 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 items-center">
              
              {/* COL 1: CITY & BADGE */}
              <div className="space-y-1 pr-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                  {currentStation.name} - RS
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{currentStation.river}</span>
                </div>
                <div className="pt-0.5">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-[#09221B] border border-emerald-500/30 text-emerald-400 text-[9px] font-black tracking-wider uppercase">
                    NÍVEL {currentStation.status_level === 'normal' ? 'NORMAL' : currentStation.status_level.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* COL 2: NÍVEL ATUAL */}
              <div className="pt-2 md:pt-0 md:pl-3 pr-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">Nível atual</span>
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {currentStation.current_level.toFixed(2).replace('.', ',')} m
                  </span>
                </div>
              </div>

              {/* COL 3: TENDÊNCIA (1H) */}
              <div className="pt-2 md:pt-0 md:pl-3 pr-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <Compass className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">Tendência (1h)</span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 leading-tight">
                    {currentStation.trend === 'subindo' ? 'Subindo ↑' : currentStation.trend === 'descendo' ? 'Descendo ↓' : 'Estável →'}
                  </span>
                </div>
              </div>

              {/* COL 4: VARIAÇÃO (24H) */}
              <div className="pt-2 md:pt-0 md:pl-3 pr-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">Variação (24h)</span>
                  <span className="text-sm sm:text-base font-bold text-cyan-400 leading-tight block">
                    {currentStation.rate_of_change >= 0 ? '+' : ''}{(currentStation.rate_of_change * 100).toFixed(0)} cm
                  </span>
                </div>
              </div>

              {/* COL 5: ÚLTIMA LEITURA */}
              <div className="pt-2 md:pt-0 md:pl-3 pr-1 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-cyan-400 shrink-0">
                  <Clock className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-tight">Última leitura</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight block">
                    09:40 - 30/05
                  </span>
                </div>
              </div>

              {/* COL 6: COTA DE ALERTA */}
              <div className="pt-2 md:pt-0 md:pl-3 space-y-0.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block leading-tight mb-0.5">Cota de Alerta</span>
                <div className="space-y-0.5 text-[10px] sm:text-[10.5px] font-medium leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                    <span className="text-amber-400 font-bold">Atenção:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono ml-auto">{currentStation.attention_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shrink-0" />
                    <span className="text-orange-400 font-bold">Alerta:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono ml-auto">{currentStation.warning_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shrink-0" />
                    <span className="text-red-400 font-bold">Emergência:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono ml-auto">{currentStation.flood_threshold.toFixed(2).replace('.', ',')} m</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* ---------------------------------------------------- */}
          {/* ABAS DE DADOS + TIME RANGE SELECTOR */}
          {/* ---------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-2 shadow-xl">
            
            {/* SUB-TABS */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#050A18] p-1 rounded-xl border border-slate-300 dark:border-slate-800">
              <button
                onClick={() => setActiveMainTab('hidrologico')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'hidrologico'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-200 dark:hover:bg-slate-800/60'
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
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-200 dark:hover:bg-slate-800/60'
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
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <CloudRain className="w-4 h-4" />
                <span>METEOROLÓGICO</span>
              </button>
            </div>

            {/* TIMEFRAME SELECTOR BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#050A18] p-1 rounded-xl border border-slate-300 dark:border-slate-800 justify-end">
              {(['6h', '24h', '7d', '30d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
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
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
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
                  <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            Nível do Rio (m)
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} vertical={false} />
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
                    <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-300 dark:border-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
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
                  <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                        <CloudRain className="w-4 h-4 text-cyan-400" />
                        Previsão para {currentStation.name}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Fonte: CLIMATEMPO</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { day: 'Hoje', date: '30/05', max: 24, min: 18, rain: 15, icon: <CloudRain className="w-4 h-4 text-cyan-400 mx-auto" /> },
                        { day: 'Sáb', date: '31/05', max: 26, min: 17, rain: 5, icon: <Sun className="w-4 h-4 text-amber-400 mx-auto" /> },
                        { day: 'Dom', date: '01/06', max: 27, min: 16, rain: 0, icon: <Sun className="w-4 h-4 text-amber-300 mx-auto" /> },
                        { day: 'Seg', date: '02/06', max: 24, min: 18, rain: 10, icon: <CloudRain className="w-4 h-4 text-blue-400 mx-auto" /> },
                        { day: 'Ter', date: '03/06', max: 22, min: 16, rain: 8, icon: <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400 mx-auto" /> },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800/80 rounded-xl p-2 flex flex-col justify-between items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">{item.day}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block">{item.date}</span>
                          <div className="my-1">{item.icon}</div>
                          <div className="text-[10px] font-black text-slate-900 dark:text-white">
                            {item.max}° <span className="text-slate-500 dark:text-slate-400 font-normal">{item.min}°</span>
                          </div>
                          <span className="text-[9px] font-bold text-cyan-400">{item.rain} mm</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BLOCO: CONDIÇÕES ATUAIS & RADAR DE CHUVA */}
                  <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-[#121d36] rounded-2xl p-3 shadow-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                      
                      {/* CONDIÇÕES ATUAIS */}
                      <div className="bg-slate-50 dark:bg-[#081020] border border-slate-300 dark:border-[#152342] rounded-xl p-3.5 flex flex-col justify-between h-full">
                        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2.5">
                          Condições atuais
                        </h5>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between py-1 border-b border-slate-300 dark:border-slate-800/40">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <Thermometer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Temperatura</span>
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.temp.toString().replace('.', ',')} °C
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-300 dark:border-slate-800/40">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <Droplets className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Umidade</span>
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.humidity} %
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-300 dark:border-slate-800/40">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <Wind className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Vento</span>
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.wind}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-300 dark:border-slate-800/40">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Pressão</span>
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.pressure} hPa
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <CloudRain className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0 stroke-[1.75]" />
                              <span className="whitespace-nowrap">Chuva (1h)</span>
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap ml-2">
                              {liveWeather.rain1h.toString().replace('.', ',')} mm
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RADAR DE CHUVA */}
                      <div className="bg-slate-50 dark:bg-[#081020] border border-slate-300 dark:border-[#152342] rounded-xl p-3.5 flex flex-col justify-between h-full">
                        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2.5">
                          Radar de Chuva
                        </h5>

                        {/* MAP CANVAS WITH MATCHING HEIGHT */}
                        <div className="relative w-full flex-1 min-h-[135px] rounded-xl overflow-hidden border border-slate-300 dark:border-[#1a2846] bg-slate-100 dark:bg-[#101b2d] flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full object-cover" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
                            {/* Base Terrain Background */}
                            <rect width="320" height="180" fill={theme === "light" ? "#F1F5F9" : "#121d2d"} />
                            <path d="M0,35 Q100,55 160,18 T320,45 L320,180 L0,180 Z" fill={theme === "light" ? "#E2E8F0" : "#16253c"} opacity="0.6" />
                            <path d="M0,105 Q120,75 220,125 T320,95 L320,180 L0,180 Z" fill={theme === "light" ? "#CBD5E1" : "#0d1624"} opacity="0.8" />
                            
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
                            <text x="65" y="38" fill={theme === "light" ? "#334155" : "#ffffff"} fontSize="11" fontWeight="600" textAnchor="middle" filter={theme === "light" ? "drop-shadow(0px 1px 3px rgba(255,255,255,0.9))" : "drop-shadow(0px 1px 3px rgba(0,0,0,0.9))"}>Arroio do Meio</text>
                            <text x="215" y="32" fill={theme === "light" ? "#334155" : "#ffffff"} fontSize="11" fontWeight="600" textAnchor="middle" filter={theme === "light" ? "drop-shadow(0px 1px 3px rgba(255,255,255,0.9))" : "drop-shadow(0px 1px 3px rgba(0,0,0,0.9))"}>Estrela</text>

                            {/* Lajeado Pin and Badge */}
                            <g transform="translate(195, 90)">
                              <path d="M0 -18 C-6 -18 -10 -14 -10 -8 C-10 0 0 10 0 10 C0 10 10 0 10 -8 C10 -14 6 -18 0 -18 Z" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
                              <circle cx="0" cy="-8" r="3.5" fill="#ffffff" />
                              <rect x="12" y="-16" width="56" height="18" rx="4" fill={theme === "light" ? "#ffffff" : "#090d16"} opacity="0.9" stroke="#2563eb" strokeWidth="0.8" />
                              <text x="40" y="-3" fill={theme === "light" ? "#0f172a" : "#ffffff"} fontSize="10" fontWeight="700" textAnchor="middle">Lajeado</text>
                            </g>
                          </svg>

                          {/* Legend Bar Overlay */}
                          <div className="absolute bottom-1.5 left-2 right-2 bg-white dark:bg-[#080d1a]/90 backdrop-blur-sm border border-slate-300 dark:border-[#1e2d4d] rounded-md px-2.5 py-0.5 flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Fraco</span>
                            <div className="h-1.5 flex-1 mx-2 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 via-orange-500 to-fuchsia-600" />
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Forte</span>
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
                <div className="lg:col-span-5 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative">
                  <div>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Histórico de Enchentes</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm">({historicalFloodsData.length} registradas)</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                        {currentStation.name} / {currentStation.river}
                      </span>
                    </h5>

                    {/* 4 TOP STAT BOXES DYNAMICALLY COMPUTED FOR SELECTED CITY */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3.5">
                      <div className="bg-slate-50 dark:bg-[#050A18] p-2.5 rounded-xl border border-red-900/50 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Recorde Histórico</span>
                        <span className="text-sm sm:text-base font-black text-red-400 my-0.5">
                          {floodStats.record.toFixed(2).replace('.', ',')} m
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{floodStats.recordYear}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#050A18] p-2.5 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">2ª Maior Marca</span>
                        <span className="text-sm sm:text-base font-black text-amber-300 my-0.5">
                          {floodStats.second.toFixed(2).replace('.', ',')} m
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{floodStats.secondYear}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#050A18] p-2.5 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">3ª Maior Marca</span>
                        <span className="text-sm sm:text-base font-black text-cyan-300 my-0.5">
                          {floodStats.third.toFixed(2).replace('.', ',')} m
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{floodStats.thirdYear}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#050A18] p-2.5 rounded-xl border border-slate-300 dark:border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Média das Cheias</span>
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white my-0.5">
                          {floodStats.avg.toFixed(2).replace('.', ',')} m
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Pico médio</span>
                      </div>
                    </div>
                  </div>

                  {/* POP-UP COMPLETO EXIBIDO SEM ROLAGEM E SEM CORTES AO CLICAR NA BARRA */}
                  {activeFloodIndex !== null && historicalFloodsData[activeFloodIndex] && (
                    <div className="absolute inset-x-3 top-10 z-50 bg-white text-slate-900 border border-slate-200/90 rounded-2xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                            {historicalFloodsData[activeFloodIndex].title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                            historicalFloodsData[activeFloodIndex].event === 'Atual' ? 'bg-cyan-100 text-cyan-800 border border-cyan-300 animate-pulse' :
                            historicalFloodsData[activeFloodIndex].level === floodStats.record ? 'bg-red-100 text-red-700 border border-red-200' :
                            historicalFloodsData[activeFloodIndex].event.includes('1941') ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}>
                            {historicalFloodsData[activeFloodIndex].event}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFloodIndex(null);
                          }}
                          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          title="Fechar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Cota Máxima:</span>
                          <span className="font-black text-slate-900 text-sm">
                            {historicalFloodsData[activeFloodIndex].level.toFixed(2).replace('.', ',')} m
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] px-0.5">
                          <span className="text-slate-400 dark:text-slate-500">Período:</span>
                          <span className="font-semibold text-slate-800">{historicalFloodsData[activeFloodIndex].dateStr}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] px-0.5">
                          <span className="text-slate-400 dark:text-slate-500">Chuva estimada:</span>
                          <span className="font-bold text-cyan-700">{historicalFloodsData[activeFloodIndex].rain}</span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] px-0.5">
                          <span className="text-slate-400 dark:text-slate-500">Comportamento:</span>
                          <span className="font-semibold text-slate-800">{historicalFloodsData[activeFloodIndex].duration}</span>
                        </div>

                        <div className="mt-2 text-[11px] leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <strong className="text-slate-900 block mb-0.5 font-bold">Impacto Registrado:</strong>
                          {historicalFloodsData[activeFloodIndex].impact}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BAR CHART DE ENCHENTES COM RÉGUA NUMÉRICA FIXA À ESQUERDA E ROLAGEM HORIZONTAL APENAS NAS BARRAS */}
                  <div className="flex items-center w-full relative">
                    {/* Fixed Y-Axis Scale on the Left */}
                    <div className="w-14 h-48 shrink-0 z-10 bg-white dark:bg-[#0B132B]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicalFloodsData} margin={{ top: 22, right: 0, left: 36, bottom: 0 }}>
                          <XAxis dataKey="event" height={24} axisLine={{ stroke: '#94A3B8' }} tick={false} />
                          <YAxis
                            width={38}
                            stroke={theme === "light" ? "#64748B" : "#94A3B8"}
                            tick={{ fontSize: 10, fill: theme === "light" ? "#64748B" : "#94A3B8" }}
                            domain={[15, 36]}
                            ticks={[15, 18, 21, 24, 27, 30, 33, 36]}
                            tickFormatter={(val) => `${val},00`}
                          />
                          <Bar dataKey="level" opacity={0} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Scrollable Bar Area */}
                    <div ref={chartScrollRef} className="flex-1 overflow-x-auto overflow-y-hidden thin-h-scrollbar pb-1.5 pt-1">
                      <div className="h-48 w-full relative" style={{ minWidth: `${Math.max(480, historicalFloodsData.length * 60)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={historicalFloodsData}
                            barCategoryGap="18%"
                            margin={{ top: 22, right: 15, left: 5, bottom: 0 }}
                            onClick={(e: any) => {
                              if (e && e.activeTooltipIndex !== undefined) {
                                setActiveFloodIndex(e.activeTooltipIndex);
                              }
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} vertical={false} />
                            <XAxis dataKey="event" height={24} stroke={theme === "light" ? "#64748B" : "#94A3B8"} tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis domain={[15, 36]} ticks={[15, 18, 21, 24, 27, 30, 33, 36]} hide />
                            <Bar
                              dataKey="level"
                              barSize={26}
                              radius={[6, 6, 0, 0]}
                              onClick={(_, index) => setActiveFloodIndex(index)}
                            >
                              {historicalFloodsData.map((entry, index) => {
                                const isSelected = activeFloodIndex === index;
                                const isRecord = entry.level === floodStats.record;
                                const is1941 = entry.event.includes('1941');
                                const isCurrent = entry.event === 'Atual';
                                
                                let defaultFill = '#38BDF8';
                                if (isCurrent) defaultFill = '#00E5FF';
                                else if (isRecord) defaultFill = '#EF4444';
                                else if (is1941) defaultFill = '#F59E0B';

                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={defaultFill}
                                    stroke={isSelected ? '#FFFFFF' : 'none'}
                                    strokeWidth={isSelected ? 2 : 0}
                                    opacity={activeFloodIndex === null || isSelected ? 1 : 0.85}
                                    className="transition-all duration-150 cursor-pointer"
                                  />
                                );
                              })}
                              <LabelList dataKey="label" position="top" fill={theme === "light" ? "#334155" : "#E2E8F0"} fontSize={9} fontWeight={700} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* LEGEND ROW */}
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-300 dark:border-slate-800/60 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-sky-400 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">Picos Históricos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">Cheia 1941</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-red-500 rounded-sm inline-block" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">Recorde</span>
                    </div>
                    {historicalFloodsData.some(d => d.event === 'Atual') && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-cyan-400 rounded-sm inline-block animate-pulse" />
                        <span className="text-[11px] text-cyan-300 font-bold">Enchente Atual</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: ANÁLISE INTEGRADA - lg:col-span-3 */}
                <div className="lg:col-span-3 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Análise Integrada</span>
                      </h5>
                      <span className="text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/70 px-2 py-0.5 rounded-full">
                        IA Hidrológica
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-[11px] text-slate-600 dark:text-slate-300">
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
                <div className="lg:col-span-4 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Projeções</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm">(nível do rio)</span>
                      </h5>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                        Modelo: SGB/SACE
                      </span>
                    </div>
                  </div>

                  <div className="h-44 w-full my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectionData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} vertical={false} />
                        <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} tickFormatter={(val) => val.replace(' (Agora)', '').replace(/ \(\+\d+h\)/, '')} />
                        <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={[10, 18]} ticks={[10, 12, 14, 16, 18]} tickFormatter={(val) => `${val},00`} />
                        <Tooltip contentStyle={{ backgroundColor: '#050A18', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                        
                        {/* REFERENCE LINE AT AGORA */}
                        <ReferenceLine x="03:00 (Agora)" stroke={theme === "light" ? "#64748B" : "#94A3B8"} strokeDasharray="3 3" label={{ value: 'Agora', fill: '#F8FAFC', fontSize: 11, position: 'top' }} />

                        {/* UNCERTAINTY BAND */}
                        <Area type="monotone" dataKey="incertezaMax" stroke="none" fill="#1D4ED8" fillOpacity={0.35} />

                        {/* OBSERVED & PROJECTED LINES */}
                        <Line type="monotone" dataKey="observado" stroke="#38BDF8" strokeWidth={2.5} dot={{ r: 3, fill: '#38BDF8' }} connectNulls />
                        <Line type="monotone" dataKey="projecao" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium pt-2 border-t border-slate-300 dark:border-slate-800/80">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="flex flex-col">
                    <span>Dados provenientes de diversas fontes oficiais e atualizados automaticamente.</span>
                    <span>Registros auditados e armazenados no banco de dados históricos do Nível Rio Taquari.</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Fontes:</span>
                  <span className="bg-cyan-50 dark:bg-[#0f2847] text-cyan-300 border border-cyan-700/60 px-2.5 py-1 rounded-md text-xs font-bold">SGB/SACE</span>
                  <span className="bg-emerald-50 dark:bg-[#0a271d] text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-md text-xs font-bold">ANA</span>
                  <span className="bg-purple-50 dark:bg-[#22103a] text-purple-300 border border-purple-700/60 px-2.5 py-1 rounded-md text-xs font-bold">SIGMA</span>
                  <span className="bg-amber-50 dark:bg-[#381e09] text-amber-300 border border-amber-700/60 px-2.5 py-1 rounded-md text-xs font-bold">CLIMATEMPO</span>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* ABA 2: FLUVIOLÓGICO */}
          {/* ============================================================ */}
                    {activeMainTab === 'fluviologico' && (
            <div className="flex flex-col gap-4 text-slate-800 dark:text-slate-100">
              
              {/* PRIMEIRA LINHA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* PAINEL ESQUERDO */}
                <div className="lg:col-span-7 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-2">Comportamento do Rio <span className="text-xs text-slate-500 font-normal">(últimas 24h)</span></h4>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center mb-2">
                    {/* Gauge IDR */}
                    <div className="flex flex-col shrink-0 items-center">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-1 font-medium whitespace-nowrap">Índice de Dinâmica do Rio (IDR)</span>
                      <div className="w-32 sm:w-36 relative flex flex-col items-center">
                        <svg viewBox="0 0 100 55" className="w-full h-auto overflow-visible">
                          <path d="M 10 50 A 40 40 0 0 1 19.36 24.29" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 24.29 19.36 A 40 40 0 0 1 46.52 10.16" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 53.48 10.16 A 40 40 0 0 1 75.71 19.36" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 80.64 24.29 A 40 40 0 0 1 90 50" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
                          
                          {/* Needle pointing to 42 */}
                          <g transform="translate(50, 50) rotate(-15)">
                            <line x1="0" y1="0" x2="0" y2="-35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="0" cy="0" r="3.5" fill="#cbd5e1" />
                          </g>
                        </svg>
                        <div className="text-center absolute bottom-0 left-0 right-0">
                          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">42</div>
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-0.5">Estável</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicators */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 items-center w-full">
                      <div className="bg-slate-50 dark:bg-[#050A18]/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between h-[82px]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">Velocidade de Subida</span>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">+0,6 <span className="text-[10px] font-normal text-slate-500">cm/h</span></div>
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Lenta</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#050A18]/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between h-[82px]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">Velocidade de Descida</span>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">0,0 <span className="text-[10px] font-normal text-slate-500">cm/h</span></div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" /> Estável</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#050A18]/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between h-[82px]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">Oscilação nas Últ. 24h</span>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">18 <span className="text-[10px] font-normal text-slate-500">cm</span></div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Baixa</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#050A18]/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between h-[82px]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight font-medium">Tempo de Resposta</span>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">6h 40m</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate">Montante → Lajeado</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator Line */}
                  <div className="w-full flex items-center my-2">
                    <div className="h-px bg-slate-200 dark:bg-slate-700/60 flex-1"></div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3">Variação do Nível do Rio</h5>
                    <div className="h-px bg-slate-200 dark:bg-slate-700/60 flex-1"></div>
                  </div>
                  
                  {/* Line Chart - Taller height and fills card down to footer legend */}
                  <div className="flex-1 flex flex-col justify-between pt-1">
                    <div className="h-[210px] sm:h-[225px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={variacaoNivelData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: theme === "light" ? "#64748B" : "#94A3B8" }} />
                          <YAxis 
                            domain={[-30, 30]} 
                            ticks={[-30, -20, -10, 0, 10, 20, 30]} 
                            interval={0}
                            width={45}
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: theme === "light" ? "#64748B" : "#94A3B8" }} 
                            tickFormatter={(val) => `${val} cm`} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === "light" ? "#fff" : "#0f172a", borderColor: theme === "light" ? "#e2e8f0" : "#1e293b", fontSize: '11px', borderRadius: '8px' }}
                            itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff" }}
                          />
                          <Area type="monotone" dataKey="level" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={0.25} fill="#0ea5e9" />
                        </ComposedChart>
                      </ResponsiveContainer>
                      <div className="absolute right-3 top-8 text-xs font-bold text-white bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md shadow flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        +2 cm
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3 text-xs font-medium">
                      <div className="flex items-center gap-2"><div className="w-4 h-1 bg-sky-500 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">Variação do nível (cm)</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-1 bg-emerald-500 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">Subida</span></div>
                      <div className="flex items-center gap-2"><div className="w-4 h-1 bg-red-500 rounded-full" /> <span className="text-slate-600 dark:text-slate-300">Descida</span></div>
                    </div>
                  </div>
                </div>

                {/* PAINEL DIREITO */}
                <div className="lg:col-span-5 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col justify-between gap-3">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Propagação da Onda de Cheia</h4>
                  
                  {/* Cards Chain */}
                  <div className="flex flex-row items-stretch justify-between gap-1 w-full">
                    {propagacaoChain.map((station, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <div className="flex flex-col items-center justify-center shrink-0 px-0.5 my-auto">
                            <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0">
                              <ArrowRight className="w-3 h-3" />
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap mt-1">{station.timeDiff}</span>
                          </div>
                        )}
                        <div className={`bg-slate-50 dark:bg-[#050A18]/90 border ${idx === propagacaoChain.length - 1 ? 'border-2 border-cyan-500 dark:border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'border-slate-300 dark:border-slate-800/80'} rounded-xl p-2.5 sm:p-3 flex-1 min-w-0 text-left flex flex-col justify-between transition-colors`}>
                          <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1.5 truncate">{station.name}</div>
                          <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mb-0.5">
                            Nível: <span className="font-medium text-slate-800 dark:text-slate-200">{station.level}</span>
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mb-2">
                            Variação: <span className="font-medium text-slate-800 dark:text-slate-200">{station.variacao}</span>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-slate-200 dark:border-slate-800/60">
                            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="inline-block">🕒</span>
                              <span>{station.delay}</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* Bottom Two Panels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 items-stretch">
                    {/* Análise da Propagação */}
                    <div className="bg-slate-50 dark:bg-[#050B1A] border border-slate-300 dark:border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5">Análise da Propagação</h5>
                      <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-2">
                          <Droplets className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <span>Onda de cheia em deslocamento: <span className="text-emerald-500 font-semibold">Normal</span></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <span>Tempo total de propagação até Lajeado: <span className="text-slate-900 dark:text-white font-bold">7h 10m</span></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Waves className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <span>Comportamento: <span className="text-emerald-500 font-semibold">Estável</span></span>
                        </li>
                        <li className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                          <Info className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <span className="text-slate-500 dark:text-slate-400 text-[10.5px]">Não há formação de picos significativos no momento.</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Comparativo com Eventos Históricos */}
                    <div className="bg-slate-50 dark:bg-[#050B1A] border border-slate-300 dark:border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2.5">Comparativo com Eventos Históricos</h5>
                      <ul className="space-y-1.5 text-[11px]">
                        {historicoCheias.map((item, i) => (
                          <li key={i} className={`flex items-center justify-between pb-1 ${i !== historicoCheias.length - 1 ? 'border-b border-slate-200 dark:border-slate-800/80' : ''}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                              {item.label && <span className="text-[10px] text-slate-400">{item.label}</span>}
                            </div>
                            <span className={`font-mono font-black text-xs sm:text-sm ${item.color}`}>{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
              </div>

              {/* SEGUNDA LINHA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 1. Taxa de Variação */}
                <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Taxa de Variação do Nível</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">(cm/h)</span>
                  <div className="h-40 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={taxaVariacaoData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} />
                        <YAxis domain={[-4.0, 4.0]} tickCount={5} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} tickFormatter={(val) => (val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1))} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: theme === "light" ? "#fff" : "#0f172a", borderColor: theme === "light" ? "#e2e8f0" : "#1e293b", fontSize: '11px', borderRadius: '8px' }} itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff" }} />
                        <ReferenceLine y={0} stroke={theme === "light" ? "#94A3B8" : "#475569"} />
                        <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                          {taxaVariacaoData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.val >= 0 ? '#3b82f6' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center mt-2">
                      <div className="flex items-center gap-1 text-[10px]">
                        <div className="w-4 h-1 bg-blue-500" /> <span className="text-slate-500 dark:text-slate-400">Taxa de variação (cm/h)</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Máxima subida</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">+2,3 cm/h</div>
                      <div className="text-[9px] text-slate-400">às 14:10</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Máxima descida</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">-1,8 cm/h</div>
                      <div className="text-[9px] text-slate-400">às 22:40</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Média 24h</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">+0,3 cm/h</div>
                      <div className="text-[9px] text-slate-400 opacity-0">-</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Atual</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">+0,6 cm/h</div>
                      <div className="text-[9px] text-slate-400">(subida lenta)</div>
                    </div>
                  </div>
                </div>

                {/* 2. Curva Chave */}
                <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Curva Chave <span className="text-slate-500 font-normal">(Nível x Vazão)</span></h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-4">Vazão (m³/s)</span>
                  <div className="h-40 w-full mb-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={curvaChaveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} />
                        <XAxis dataKey="nivel" type="number" domain={[8, 18]} tickCount={6} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} />
                        <YAxis tickCount={6} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} tickFormatter={(val) => val.toLocaleString('pt-BR')} />
                        <Line type="monotone" dataKey="vazao" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9', stroke: '#0ea5e9' }} activeDot={{ r: 5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    {/* Tooltip mockup for current point */}
                    <div className="absolute top-[40%] left-[45%] bg-slate-900/90 text-white text-[10px] p-1.5 rounded border border-slate-700 text-center shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2">
                      <div className="font-bold">13,42 m</div>
                      <div>≈ 2.250 m³/s</div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Nível (m)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Vazão estimada atual</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">≈ 2.250 m³/s</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Categoria atual</span>
                      <span className="text-sm font-bold text-emerald-500">Normal</span>
                    </div>
                  </div>
                </div>

                {/* 3. Oscilação do Rio */}
                <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">Oscilação do Rio</h4>
                  
                  <div className="h-40 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={oscilacaoData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#CBD5E1" : "#1E293B"} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} />
                        <YAxis domain={[0, 60]} tickCount={4} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: theme === "light" ? "#64748B" : "#94A3B8" }} tickFormatter={(val) => `${val} cm`} />
                        <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#fff" : "#0f172a", borderColor: theme === "light" ? "#e2e8f0" : "#1e293b", fontSize: '11px', borderRadius: '8px' }} itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff" }} />
                        <Line type="monotone" dataKey="amplitude" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2, fill: '#0ea5e9' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center mt-2">
                      <div className="flex items-center gap-1 text-[10px]">
                        <div className="w-4 h-1 bg-blue-500" /> <span className="text-slate-500 dark:text-slate-400">Oscilação diária (amplitude)</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t border-slate-200 dark:border-slate-800 pt-3 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Amplitude média (24h)</div>
                      <div className="font-bold text-emerald-500 text-sm">18 cm</div>
                      <div className="text-[9px] text-emerald-600">Baixa</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Maior amplitude</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">32 cm</div>
                      <div className="text-[9px] text-slate-400">(27/05)</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Menor amplitude</div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">12 cm</div>
                      <div className="text-[9px] text-slate-400">(29/05)</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">Tendência</div>
                      <div className="font-bold text-emerald-500 text-xs">Estável</div>
                      <div className="text-[9px] text-emerald-600">→</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RODAPÉ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 1. Interpretação Fluviológica */}
                <div className="lg:col-span-6 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1">Interpretação Fluviológica</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      O comportamento do rio em Lajeado está estável. As variações são baixas e não há sinais de formação de ondas de cheia significativas nas estações de montante.
                    </p>
                  </div>
                </div>

                {/* 2. IEF */}
                <div className="lg:col-span-3 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Índice de Estabilidade Fluviológica (IEF)</h5>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900 dark:text-white">78 / 100</span>
                      <span className="text-xs font-medium text-emerald-500">Condição estável</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[78%]" />
                    </div>
                  </div>
                </div>

                {/* 3. Classificação Fluviológica */}
                <div className="lg:col-span-3 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Classificação Fluviológica</h5>
                    <div className="text-lg font-black text-emerald-500 uppercase">NORMAL</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sem risco no momento.</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>

              </div>
              
            </div>
          )}          {/* ============================================================ */}
{/* ABA 3: METEOROLÓGICO */}
          {/* ============================================================ */}
          {activeMainTab === 'meteorologico' && (
            <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-6">
              
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-cyan-400" />
                  CENTRO METEOROLÓGICO DA BACIA
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monitoramento pluviométrico, pressão atmosférica, rajadas de vento e radar de tempestades para o Vale do Taquari.
                </p>
              </div>

              {/* METEOROLOGICAL METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Temperatura</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{currentStation.temp} °C</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Umidade Ar</span>
                  <span className="text-xl font-black text-cyan-400">{currentStation.humidity} %</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Chuva (24h)</span>
                  <span className="text-xl font-black text-cyan-300">{currentStation.rain24h} mm</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Vento</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{currentStation.wind}</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Pressão</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{currentStation.pressure} hPa</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Ponto Orvalho</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">19.8 °C</span>
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
          <div className="bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="p-4 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#050A18]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    ASSISTENTE HIDROLÓGICO IA
                  </h3>
                  <span className="text-[10px] font-semibold text-cyan-400 font-mono block">
                    Contexto: {currentStation.name} • Dados Auditados Realtime
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHAT MESSAGES CANVAS */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-transparent">
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
                      : 'bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-md'
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
            <div className="p-2 border-t border-slate-300 dark:border-slate-800/80 bg-slate-50 dark:bg-[#050A18] flex items-center gap-2 overflow-x-auto text-[10px]">
              <button
                onClick={() => handleSendQuestion(`Quais as cotas oficiais de nível para ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                📊 Cotas de Nível
              </button>
              <button
                onClick={() => handleSendQuestion(`Quais bairros são atingidos na enchente em ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                🏘️ Bairros Vulneráveis
              </button>
              <button
                onClick={() => handleSendQuestion(`Qual o tempo de propagação da onda de cheia em ${currentStation.name}?`)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
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
              className="p-3 border-t border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0B132B] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Pergunte algo sobre ${currentStation.name}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-[#050A18] border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
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
