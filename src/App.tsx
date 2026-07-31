import React, { useState, useEffect } from 'react';
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

import { City, NewsItem, Timeframe, ChartDataPoint, AlertItem } from './types';
import { fetchCities, fetchNews, fetchCityHistory, fetchAlerts, localStore } from './lib/supabase';
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

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Load Data
  const loadData = async () => {
    try {
      const cityList = await fetchCities();
      setCities(cityList);

      if (!selectedCity && cityList.length > 0) {
        // Default select Lajeado or first city
        const defaultCity = cityList.find((c) => c.slug === 'lajeado') || cityList[0];
        setSelectedCity(defaultCity);
      } else if (selectedCity) {
        // Refresh selected city reference
        const updated = cityList.find((c) => c.id === selectedCity.id || c.slug === selectedCity.slug);
        if (updated) setSelectedCity(updated);
      }

      const newsList = await fetchNews();
      setNews(newsList);

      const alertList = await fetchAlerts();
      setAlerts(alertList);
    } catch (e) {
      console.error('Error loading initial portal data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update chart data whenever selectedCity or timeframe changes
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
            Carregando Sistema de Telemetria...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white flex flex-col justify-between notranslate" translate="no">
      
      {/* HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
        isSyncing={isSyncing}
      />

      {/* EMERGENCY ALERT BANNER IF ACTIVE */}
      {alerts.length > 0 && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-xs font-medium text-amber-200">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
              <span className="font-bold text-amber-300">ALERTA DEFESA CIVIL:</span>
              <span className="truncate">{alerts[0].title} — {alerts[0].description}</span>
            </div>
            <button
              onClick={() => setActiveTab('defesa-civil')}
              className="text-amber-400 hover:text-white text-[11px] font-bold underline shrink-0"
            >
              Saiba Mais
            </button>
          </div>
        </div>
      )}

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
              />
              
              <InteractiveMap
                cities={cities}
                selectedCity={selectedCity}
                onSelectCity={(city) => setSelectedCity(city)}
              />

              <TechnicalData selectedCity={selectedCity} />
            </div>

          </div>
        ) : activeTab === 'cameras' ? (
          <LiveCamerasView />
        ) : activeTab === 'historico' ? (
          <HistoryView
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={(city) => setSelectedCity(city)}
          />
        ) : activeTab === 'alertas' || activeTab === 'defesa-civil' ? (
          <DefesaCivilView />
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
        onClose={() => setIsAdminOpen(false)}
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

            <LiveCamerasView />
          </div>
        </div>
      )}

      {/* INFO MODAL ("ENTENDA OS NÍVEIS") */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-3">
              Cotas Hidrológicas de Referência (Rio Taquari)
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800">
                <span className="font-bold text-emerald-400">🟢 Normal (até 3,00 m):</span>
                <p className="mt-1 text-slate-300">Calha do rio operando em estado de vazão regular, sem risco às populações ribeirinhas.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800">
                <span className="font-bold text-amber-300">🟡 Atenção (3,00 m – 6,00 m):</span>
                <p className="mt-1 text-slate-300">Início do estado de vigilância. As equipes municipais monitoram a taxa de elevação por hora.</p>
              </div>

              <div className="p-3 rounded-xl bg-orange-950/60 border border-orange-800">
                <span className="font-bold text-orange-400">🟠 Alerta (6,00 m – 8,50 m):</span>
                <p className="mt-1 text-slate-300">Risco iminente de extravasamento em cotas baixas. Moradores devem preparar remoção.</p>
              </div>

              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800">
                <span className="font-bold text-red-400">🔴 Inundação (acima de 8,50 m):</span>
                <p className="mt-1 text-slate-300">Atingimento de áreas urbanas habitadas. Ativação total do plano de emergência da Defesa Civil.</p>
              </div>
            </div>

            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full mt-5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
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

    </div>
  );
}
