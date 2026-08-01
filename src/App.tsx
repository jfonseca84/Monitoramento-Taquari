import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CitySidebar } from './components/CitySidebar';
import { LiveCameraHero } from './components/LiveCameraHero';
import { StatsPanel } from './components/StatsPanel';
import { LevelChart } from './components/LevelChart';
import { InteractiveMap } from './components/InteractiveMap';
import { NewsSection } from './components/NewsSection';
import { TechnicalData } from './components/TechnicalData';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { HistoryView } from './components/HistoryView';
import { DefesaCivilView } from './components/DefesaCivilView';
import { PrefeiturasView } from './components/PrefeiturasView';
import { AboutView } from './components/AboutView';
import { ContactView } from './components/ContactView';
import { RiverLevelDetailModal } from './components/RiverLevelDetailModal';
import { LiveCamerasView } from './components/LiveCamerasView';
import { RiskAlertSignup } from './components/RiskAlertSignup';

import { SituationBanner } from './components/SituationBanner';
import { SituationDetailModal } from './components/SituationDetailModal';

import { City, NewsItem, Timeframe, ChartDataPoint, AlertItem } from './types';
import { fetchCities, fetchNews, fetchCityHistory, fetchAlerts, localStore, subscribeToRealtimeChanges, ConnectionStatusType } from './lib/supabase';
import { getBrasiliaFullDateTimeString } from './lib/dateUtils';
import { AlertTriangle, X, Radio, Video, ChevronRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('online');
  const [lastUpdatedText, setLastUpdatedText] = useState<string>(() => getBrasiliaFullDateTimeString());

  // Refs for active selection to prevent stale closures in realtime callbacks
  const selectedCityRef = useRef<City | null>(selectedCity);
  useEffect(() => {
    selectedCityRef.current = selectedCity;
  }, [selectedCity]);

  const timeframeRef = useRef<Timeframe>(timeframe);
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);

  // Theme State with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals & Admin Route Handling
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/admin' || window.location.hash === '#admin';
    }
    return false;
  });
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isSituationModalOpen, setIsSituationModalOpen] = useState<boolean>(false);
  const [situationModalCity, setSituationModalCity] = useState<City | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setIsAdminOpen(true);
      } else {
        setIsAdminOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdmin = () => {
    setIsAdminOpen(true);
    if (window.location.pathname !== '/admin') {
      try {
        window.history.pushState({}, '', '/admin');
      } catch (e) {}
    }
  };

  const closeAdmin = () => {
    setIsAdminOpen(false);
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      try {
        window.history.pushState({}, '', '/');
      } catch (e) {}
    }
  };

  // Load & Refresh All Data
  const loadData = async (isRealtimeTrigger = false) => {
    if (isRealtimeTrigger) {
      setIsSyncing(true);
      setConnectionStatus('updating');
    }
    try {
      const cityList = await fetchCities();
      setCities(cityList);

      const currentSel = selectedCityRef.current;
      if (!currentSel && cityList.length > 0) {
        // Default select Lajeado or first city
        const defaultCity = cityList.find((c) => c.slug === 'lajeado') || cityList[0];
        setSelectedCity(defaultCity);
      } else if (currentSel) {
        // Refresh selected city reference
        const updated = cityList.find((c) => c.id === currentSel.id || c.slug === currentSel.slug);
        if (updated) setSelectedCity(updated);
      }

      const newsList = await fetchNews();
      setNews(newsList);

      const alertList = await fetchAlerts();
      setAlerts(alertList);

      if (currentSel || selectedCity) {
        const targetCity = currentSel || selectedCity;
        if (targetCity) {
          const freshHistory = await fetchCityHistory(targetCity.id, timeframeRef.current);
          setChartData(freshHistory);
        }
      }

      setLastUpdatedText(getBrasiliaFullDateTimeString());
      setConnectionStatus('online');
    } catch (e) {
      console.error('Error loading realtime telemetry data:', e);
      setConnectionStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  };

  // Setup Realtime & Periodic Telemetry Sync
  useEffect(() => {
    loadData(false);

    // Subscribe to Supabase Realtime (river_levels, cities, alerts)
    const unsubscribe = subscribeToRealtimeChanges(
      (table, payload) => {
        console.log(`[Supabase Realtime Event] ${table}:`, payload);
        loadData(true);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    // Periodic safety fallback poll every 30s
    const fallbackInterval = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, []);

  // Update chart data whenever selectedCity or timeframe changes manually
  useEffect(() => {
    if (selectedCity) {
      fetchCityHistory(selectedCity.id, timeframe).then((data) => {
        setChartData(data);
      });
    }
  }, [selectedCity, timeframe]);

  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-[#0B132B] flex items-center justify-center text-white font-sans">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase text-cyan-400">
            Carregando Telemetria em Tempo Real...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#0B132B] bg-slate-100 dark:text-slate-100 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between notranslate transition-colors duration-300" translate="no">
      
      {/* HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={openAdmin}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        lastUpdatedText={lastUpdatedText}
      />

      {/* PAINEL DE SITUAÇÃO DO VALE DO TAQUARI (DYNAMIC SYSTEM BANNER) */}
      <SituationBanner
        cities={cities}
        onOpenSituationModal={(city) => {
          setSituationModalCity(city || selectedCity);
          setIsSituationModalOpen(true);
        }}
      />

      {/* MAIN CONTENT CANVAS */}
      <main className="max-w-[1600px] w-full mx-auto px-4 lg:px-8 py-6 flex-1">
        
        {/* VIEW ROUTER */}
        {activeTab === 'inicio' || activeTab === 'nivel' ? (
          /* PRIMARY OPERATIONAL DASHBOARD (MATCHING ATTACHED SCREENSHOT) */
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* LEFT COLUMN: CITIES SIDEBAR & LEGEND */}
            <CitySidebar
              cities={cities}
              selectedCity={selectedCity}
              onSelectCity={(city) => setSelectedCity(city)}
              onOpenInfoModal={() => setIsInfoModalOpen(true)}
            />

            {/* MIDDLE COLUMN: LIVE CAMERA HERO, RECHARTS & NEWS */}
            <div className="flex-1 flex flex-col gap-6">
              <LiveCameraHero
                selectedCity={selectedCity}
                onOpenCameraModal={() => setIsCameraModalOpen(true)}
                onOpenInfoModal={() => setIsInfoModalOpen(true)}
                onOpenDetailModal={() => setIsDetailModalOpen(true)}
              />

              <LevelChart
                selectedCity={selectedCity}
                chartData={chartData}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
              />

              <NewsSection
                news={news}
                onViewAllNews={() => setActiveTab('noticias')}
              />
            </div>

            {/* RIGHT COLUMN: STATS, SATELLITE MAP & TECHNICAL SPECS */}
            <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
              <StatsPanel
                selectedCity={selectedCity}
                onOpenDetailModal={() => setIsDetailModalOpen(true)}
                onOpenAlertSignup={() => setActiveTab('receber-alertas')}
              />
              
              <InteractiveMap
                cities={cities}
                selectedCity={selectedCity}
                onSelectCity={(city) => setSelectedCity(city)}
              />

              <TechnicalData selectedCity={selectedCity} />
            </div>

          </div>
        ) : activeTab === 'receber-alertas' ? (
          <RiskAlertSignup cities={cities} />
        ) : activeTab === 'cameras' ? (
          <LiveCamerasView
            selectedCity={selectedCity}
            cities={cities}
            onSelectCity={(city) => setSelectedCity(city)}
          />
        ) : activeTab === 'historico' ? (
          <HistoryView
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={(city) => setSelectedCity(city)}
          />
        ) : activeTab === 'alertas' || activeTab === 'defesa-civil' ? (
          <div className="space-y-8">
            <RiskAlertSignup cities={cities} />
            <DefesaCivilView />
          </div>
        ) : activeTab === 'prefeituras' ? (
          <PrefeiturasView cities={cities} />
        ) : activeTab === 'sobre' ? (
          <AboutView />
        ) : activeTab === 'contato' ? (
          <ContactView />
        ) : (
          <NewsSection news={news} />
        )}

      </main>

      {/* FOOTER */}
      <Footer />

      {/* ADMINISTRATIVE DASHBOARD MODAL */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={closeAdmin}
        cities={cities}
        onRefreshData={loadData}
      />

      {/* LIVE CAMERA STREAM MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F172A] border border-slate-700 rounded-3xl max-w-5xl w-full p-6 shadow-2xl relative animate-fade-in my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsCameraModalOpen(false)}
              className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full z-20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <LiveCamerasView
              selectedCity={selectedCity}
              cities={cities}
              onSelectCity={(city) => setSelectedCity(city)}
            />
          </div>
        </div>
      )}

      {/* INFO MODAL ("ENTENDA OS NÍVEIS") */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="dark:bg-[#0F172A] bg-white dark:border-slate-700 border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:bg-slate-800 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold dark:text-white text-slate-900 mb-3">
              Cotas Hidrológicas de Referência (Rio Taquari)
            </h3>

            <div className="space-y-3 text-xs dark:text-slate-300 text-slate-700">
              <div className="p-3 rounded-xl bg-emerald-950/60 dark:border-emerald-800 border-emerald-300 border">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">🟢 Normal (até 3,00 m):</span>
                <p className="mt-1 dark:text-slate-300 text-slate-700">Calha do rio operando em estado de vazão regular, sem risco às populações ribeirinhas.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/60 dark:border-amber-800 border-amber-300 border">
                <span className="font-bold text-amber-600 dark:text-amber-300">🟡 Atenção (3,00 m – 6,00 m):</span>
                <p className="mt-1 dark:text-slate-300 text-slate-700">Início do estado de vigilância. As equipes municipais monitoram a taxa de elevação por hora.</p>
              </div>

              <div className="p-3 rounded-xl bg-orange-950/60 dark:border-orange-800 border-orange-300 border">
                <span className="font-bold text-orange-600 dark:text-orange-400">🟠 Alerta (6,00 m – 8,50 m):</span>
                <p className="mt-1 dark:text-slate-300 text-slate-700">Risco iminente de extravasamento em cotas baixas. Moradores devem preparar remoção.</p>
              </div>

              <div className="p-3 rounded-xl bg-red-950/60 dark:border-red-800 border-red-300 border">
                <span className="font-bold text-red-600 dark:text-red-400">🔴 Inundação (acima de 8,50 m):</span>
                <p className="mt-1 dark:text-slate-300 text-slate-700">Atingimento de áreas urbanas habitadas. Ativação total do plano de emergência da Defesa Civil.</p>
              </div>
            </div>

            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full mt-5 dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-white text-slate-900 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* RIVER LEVEL DETAILED ANALYTICS MODAL */}
      <RiverLevelDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedCity={selectedCity}
        chartData={chartData}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onNavigateToMap={() => {
          const mapEl = document.getElementById('mapa-estacoes');
          if (mapEl) {
            mapEl.scrollIntoView({ behavior: 'smooth' });
          } else {
            setActiveTab('mapa');
          }
        }}
      />

      {/* PAINEL DE SITUAÇÃO DETALHADO MODAL */}
      <SituationDetailModal
        isOpen={isSituationModalOpen}
        onClose={() => setIsSituationModalOpen(false)}
        cities={cities}
        initialCity={situationModalCity || selectedCity}
        onSelectCityForChart={(city) => {
          setSelectedCity(city);
          setActiveTab('inicio');
        }}
      />

    </div>
  );
}
