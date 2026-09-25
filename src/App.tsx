import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CitySidebar } from './components/CitySidebar';
import { LiveCameraHero } from './components/LiveCameraHero';
import { LevelChart } from './components/LevelChart';
import { BasinMap } from './components/BasinMap';
import { StationInfoCard } from './components/StationInfoCard';
import { HOME_FONT, BASIN_DEFAULT_CITY, BASIN_STATIONS, BasinKey, basinOfCity } from './components/homeTheme';
import { NewsSection } from './components/NewsSection';
import { Footer } from './components/Footer';
import { isAdminPath } from './lib/adminRoute';
// O painel administrativo só é baixado quando o endereço reservado é aberto
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
import { HistoricoPage } from './components/HistoricoPage';
import { FloodDetailPanel } from './components/FloodDetailPanel';
import { FloodDetailModal } from './components/FloodDetailModal';
import { SiteScrollbar } from './components/SiteScrollbar';
import { HISTORICAL_FLOODS_BY_CITY } from './data/historicalFloodsData';
import { DefesaCivilView } from './components/DefesaCivilView';
import { PrefeiturasView } from './components/PrefeiturasView';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { CentroAnalisesView } from './components/CentroAnalisesView';
import { RiverLevelDetailModal } from './components/RiverLevelDetailModal';
import { LiveCamerasView } from './components/LiveCamerasView';
import { RiskAlertSignup } from './components/RiskAlertSignup';

import { SituationDetailModal } from './components/SituationDetailModal';
import { AssistantChatWidget } from './components/AssistantChatWidget';
import { CityWeatherForecast } from './components/CityWeatherForecast';

import { EditableComponent } from './components/visualEditor/EditableComponent';
import { AdminEditorBar } from './components/visualEditor/AdminEditorBar';
import { ComponentConfigModal } from './components/visualEditor/ComponentConfigModal';
import { LayoutBehaviorWrapper } from './components/LayoutBehaviorWrapper';

import { City, NewsItem, Timeframe, ChartDataPoint, AlertItem } from './types';
import { fetchBootstrapData, fetchCities, fetchNews, fetchCityHistory, fetchAlerts, localStore, subscribeToRealtimeChanges, ConnectionStatusType } from './lib/supabase';
import { getBrasiliaFullDateTimeString } from './lib/dateUtils';
import { AlertTriangle, X, Radio, Video, ChevronRight } from 'lucide-react';

export default function App() {
  // Por enquanto só a página Início está ativa (as demais aguardam o novo design)
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const ENABLED_TABS = ['inicio', 'historico', 'contato', 'sobre'];

  const handleTabChange = (tab: string) => {
    if (!ENABLED_TABS.includes(tab)) return;
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'defesa-civil') {
        try {
          window.history.pushState({}, '', '/defesa-civil');
        } catch (e) {}
      } else if (window.location.pathname === '/defesa-civil') {
        try {
          window.history.pushState({}, '', '/');
        } catch (e) {}
      }
    }
  };
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  // Cheia clicada no gráfico da aba Histórico (aparece no painel da esquerda); volta ao recorde ao trocar de cidade
  const [selectedFloodId, setSelectedFloodId] = useState<string | null>(null);
  // Em telas estreitas os detalhes abrem em um pop-up (em telas largas ficam no painel da esquerda)
  const [floodModalOpen, setFloodModalOpen] = useState(false);
  useEffect(() => {
    setSelectedFloodId(null);
    setFloodModalOpen(false);
  }, [selectedCity?.slug]);
  useEffect(() => {
    if (activeTab !== 'historico') setFloodModalOpen(false);
  }, [activeTab]);
  const closeFloodModal = useCallback(() => setFloodModalOpen(false), []);
  const handleSelectFlood = (id: string) => {
    setSelectedFloodId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setFloodModalOpen(true);
  };
  // Bacia exibida no mapa e no menu de estações da página Início
  const [basin, setBasin] = useState<BasinKey>('taquari');
  const handleBasinChange = (next: BasinKey) => {
    setBasin(next);
    if (basinOfCity(selectedCity?.slug) !== next) {
      const target = cities.find((c) => c.slug === BASIN_DEFAULT_CITY[next])
        || cities.find((c) => BASIN_STATIONS[next].includes(c.slug));
      if (target) setSelectedCity(target);
    }
  };
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

  // Tema escolhido pelo visitante (escuro é o padrão); a escolha fica salva no navegador
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
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
      return isAdminPath(window.location.pathname);
    }
    return false;
  });
  // Aviso exibido ao abrir o site: fase de desenvolvimento / não substitui órgãos oficiais
  const [isDevNoticeOpen, setIsDevNoticeOpen] = useState<boolean>(true);
  useEffect(() => {
    if (!isDevNoticeOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDevNoticeOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDevNoticeOpen]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isSituationModalOpen, setIsSituationModalOpen] = useState<boolean>(false);
  const [situationModalCity, setSituationModalCity] = useState<City | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (isAdminPath(window.location.pathname)) {
        setIsAdminOpen(true);
      } else {
        setIsAdminOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const closeAdmin = () => {
    setIsAdminOpen(false);
    if (isAdminPath(window.location.pathname)) {
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
      const bootstrap = await fetchBootstrapData(isRealtimeTrigger);
      const cityList = bootstrap.cities;
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

      setNews(bootstrap.news);
      setAlerts(bootstrap.alerts);

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

    // Periodic safety fallback poll every 3 minutes (180,000 ms)
    const fallbackInterval = setInterval(() => {
      loadData(false);
    }, 180000);

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

  // Início e Histórico usam o mesmo layout: mapa | conteúdo central | lista de estações
  const isHomeLayout = activeTab === 'inicio' || activeTab === 'historico' || activeTab === 'contato' || activeTab === 'sobre';

  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-[#2B333D] flex items-center justify-center text-white font-[family-name:Figtree,system-ui,sans-serif]">
        <div role="status" aria-label="Carregando" className="w-10 h-10 border-[3px] border-[#7CC3E6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2B333D] text-white font-sans selection:bg-[#7CC3E6] selection:text-[#1B222B] flex flex-col justify-between notranslate transition-colors duration-300 overflow-x-clip w-full max-w-full" translate="no">
      
      {/* HEADER */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
        connectionStatus={connectionStatus}
        lastUpdatedText={lastUpdatedText}
      />

      {/* MAIN CONTENT CANVAS */}
      <main
        className={
          isHomeLayout
            ? 'w-full flex-1 min-w-0'
            : 'max-w-[1600px] w-full mx-auto px-2.5 sm:px-4 lg:px-8 py-4 sm:py-6 flex-1 min-w-0'
        }
      >

        {/* VIEW ROUTER */}
        {activeTab === 'sobre' ? (
          <AboutPage />
        ) : activeTab === 'contato' ? (
          <ContactPage onNavigateToDefesaCivil={() => handleTabChange('defesa-civil')} />
        ) : isHomeLayout ? (
          /* PÁGINA INÍCIO: mapa da bacia | conteúdo rolável | lista de estações (empilha abaixo de lg) */
          <div className={`${HOME_FONT} flex flex-col lg:grid lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.6fr)_150px] lg:h-[calc(100vh-56px)] lg:overflow-hidden`}>

            {/* DIREITA: LISTA DE ESTAÇÕES (no celular vira o menu recolhível, no topo) */}
            <LayoutBehaviorWrapper pageKey="inicio" componentKey="sidebar" className="order-1 lg:order-3 lg:h-full min-h-0 flex flex-col">
              <EditableComponent id="inicio_sidebar_cidades" name="Sidebar de Cidades" type="panel" className="w-full h-full flex flex-col flex-1 min-h-0">
                <CitySidebar
                  cities={cities}
                  selectedCity={selectedCity}
                  onSelectCity={(city) => setSelectedCity(city)}
                  onOpenInfoModal={() => setIsInfoModalOpen(true)}
                  basin={basin}
                  onChangeBasin={handleBasinChange}
                />
              </EditableComponent>
            </LayoutBehaviorWrapper>

            {/* CENTRO: CONTEÚDO ROLÁVEL */}
            <div data-main-scroll className="order-2 lg:order-2 min-w-0 lg:h-full lg:overflow-y-auto no-scrollbar dark:bg-[#2B333D] bg-white">
              {activeTab === 'historico' ? (
                <HistoricoPage selectedCity={selectedCity} selectedFloodId={selectedFloodId} onSelectFlood={handleSelectFlood} lastUpdatedText={lastUpdatedText} />
              ) : (
              <LayoutBehaviorWrapper pageKey="inicio" componentKey="operational_panel">
                <LayoutBehaviorWrapper pageKey="inicio" componentKey="camera_hero">
                  <EditableComponent id="inicio_camera_hero" name="Câmera ao Vivo Hero" type="card">
                    <LiveCameraHero
                      selectedCity={selectedCity}
                      onOpenCameraModal={() => { /* desativado temporariamente (em desenvolvimento) */ }}
                      onOpenInfoModal={() => setIsInfoModalOpen(true)}
                      onOpenDetailModal={() => setIsDetailModalOpen(true)}
                      cities={cities}
                      onSelectCity={(city) => {
                        // Busca: mostra a cidade e leva o mapa e o menu para a bacia dela
                        const cityBasin = basinOfCity(city.slug);
                        if (cityBasin) setBasin(cityBasin);
                        setSelectedCity(city);
                      }}
                    />
                  </EditableComponent>
                </LayoutBehaviorWrapper>

                <LayoutBehaviorWrapper pageKey="inicio" componentKey="level_chart">
                  <EditableComponent id="inicio_grafico_nivel" name="Gráfico Telemétrico de Nível" type="chart">
                    <LevelChart
                      selectedCity={selectedCity}
                      chartData={chartData}
                      timeframe={timeframe}
                      setTimeframe={setTimeframe}
                    />
                  </EditableComponent>
                </LayoutBehaviorWrapper>

                <LayoutBehaviorWrapper pageKey="inicio" componentKey="weather_forecast">
                  <EditableComponent id="inicio_previsao_tempo" name="Previsão do Tempo" type="widget">
                    <CityWeatherForecast selectedCity={selectedCity} cities={cities} />
                  </EditableComponent>
                </LayoutBehaviorWrapper>

                <LayoutBehaviorWrapper pageKey="inicio" componentKey="news" className="w-full">
                  <EditableComponent id="inicio_noticias" name="Seção de Notícias e Comunicados" type="table">
                    <NewsSection news={news} />
                  </EditableComponent>
                </LayoutBehaviorWrapper>
              </LayoutBehaviorWrapper>
              )}

              {/* RODAPÉ no fim da coluna central (no celular ele vai para o fim da página) */}
              <Footer className="hidden lg:block" />
            </div>

            {/* ESQUERDA: MAPA DA BACIA na Início; detalhes da enchente selecionada no Histórico (no celular fica por último) */}
            {activeTab === 'historico' ? (
              <div className="hidden lg:flex lg:order-1 relative z-0 lg:h-full min-h-0 flex-col">
                <FloodDetailPanel city={selectedCity} events={HISTORICAL_FLOODS_BY_CITY[selectedCity.slug] ?? []} selectedId={selectedFloodId} />
              </div>
            ) : (
            <LayoutBehaviorWrapper pageKey="inicio" componentKey="map" className="order-3 lg:order-1 relative z-0 isolate h-[440px] lg:h-full">
              <EditableComponent id="inicio_mapa_interativo" name="Mapa Hidrológico Regional" type="map" className="relative z-0 isolate w-full h-full">
                <BasinMap
                  cities={cities}
                  selectedCity={selectedCity}
                  onSelectCity={(city) => setSelectedCity(city)}
                  basin={basin}
                  onChangeBasin={handleBasinChange}
                  infoCard={<StationInfoCard city={selectedCity} />}
                />
              </EditableComponent>
            </LayoutBehaviorWrapper>
            )}

          </div>
        ) : activeTab === 'nivel' || activeTab === 'centro-analises' ? (
          <CentroAnalisesView
            theme={theme}
            cities={cities}
            selectedCity={selectedCity}
            onSelectCity={(city) => setSelectedCity(city)}
          />
        ) : activeTab === 'receber-alertas' ? (
          <EditableComponent id="risk_alert_signup_module" name="Módulo Cadastro de Alertas de Risco" type="module">
            <RiskAlertSignup cities={cities} />
          </EditableComponent>
        ) : activeTab === 'cameras' ? (
          <EditableComponent id="live_cameras_module" name="Módulo Câmeras ao Vivo em Tempo Real" type="module">
            <LiveCamerasView
              selectedCity={selectedCity}
              cities={cities}
              onSelectCity={(city) => setSelectedCity(city)}
            />
          </EditableComponent>
        ) : activeTab === 'defesa-civil' ? (
          <EditableComponent id="defesa_civil_module" name="Módulo Defesa Civil do Vale" type="module">
            <DefesaCivilView
              cities={cities}
              onNavigateToContact={() => handleTabChange('contato')}
            />
          </EditableComponent>
        ) : activeTab === 'alertas' || activeTab === 'receber-alertas' ? (
          <EditableComponent id="risk_alert_signup_module_2" name="Módulo Cadastro de Alertas" type="module">
            <RiskAlertSignup cities={cities} />
          </EditableComponent>
        ) : activeTab === 'prefeituras' ? (
          <EditableComponent id="prefeituras_module" name="Módulo Prefeituras Integradas" type="module">
            <PrefeiturasView cities={cities} />
          </EditableComponent>
        ) : (
          <EditableComponent id="news_full_module" name="Módulo Notícias em Página Inteira" type="module">
            <NewsSection news={news} isFullPage={true} />
          </EditableComponent>
        )}

      </main>

      {/* FOOTER (na página Início, no desktop, ele fica dentro da coluna central) */}
      <Footer className={isHomeLayout ? 'lg:hidden' : ''} />
      {/* Celular: espaço para a barra fixa de ícones das abas Sobre e Contato não cobrir o fim da página */}
      {(activeTab === 'sobre' || activeTab === 'contato') && <div aria-hidden className="lg:hidden h-[92px]" />}

      {/* BARRA DE ROLAGEM fina e branca na borda direita (telas largas) */}
      <SiteScrollbar />

      {/* DETALHES DA ENCHENTE (celular): pop-up com botão de fechar fixo embaixo */}
      {activeTab === 'historico' && (
        <FloodDetailModal open={floodModalOpen} onClose={closeFloodModal}>
          <FloodDetailPanel city={selectedCity} events={HISTORICAL_FLOODS_BY_CITY[selectedCity.slug] ?? []} selectedId={selectedFloodId} />
        </FloodDetailModal>
      )}

      {/* ADMINISTRATIVE DASHBOARD MODAL */}
      {isAdminOpen && (
        <React.Suspense fallback={null}>
          <AdminDashboard
            isOpen={isAdminOpen}
            onClose={closeAdmin}
            cities={cities}
            onRefreshData={loadData}
          />
        </React.Suspense>
      )}

      {/* AVISO DE SITE EM DESENVOLVIMENTO */}
      {isDevNoticeOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-notice-title"
            className="bg-[#2B333D] border border-[#3A434E] rounded-[10px] max-w-md w-full p-6 shadow-2xl relative animate-fade-in text-white font-[family-name:Figtree,system-ui,sans-serif]"
          >
            <button
              onClick={() => setIsDevNoticeOpen(false)}
              aria-label="Fechar aviso"
              className="absolute top-4 right-4 p-2 text-[#B4B9BF] hover:text-white bg-[#353E49] rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 pr-10">
              <AlertTriangle className="w-5 h-5 text-[#E9C145] shrink-0" />
              <h3 id="dev-notice-title" className="text-base font-extrabold">
                Site em fase de desenvolvimento
              </h3>
            </div>

            <div className="space-y-3 text-sm text-[#CDD1D6]">
              <p>
                Este site ainda está em desenvolvimento e algumas funcionalidades e informações
                podem estar incompletas ou sujeitas a ajustes.
              </p>
              <p className="p-3 rounded-md bg-[#353E49] border-l-[3px] border-[#E9C145] font-semibold text-white">
                As informações exibidas aqui não substituem as informações e os alertas emitidos
                pelos órgãos oficiais, como a Defesa Civil e o Serviço Geológico do Brasil (SGB).
                Em caso de risco, siga sempre as orientações oficiais.
              </p>
            </div>

            <button
              onClick={() => setIsDevNoticeOpen(false)}
              autoFocus
              className="mt-5 w-full py-2.5 rounded-md bg-[#35566B] hover:bg-[#42708C] text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

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

      {/* FLOATING ASSISTANT CHAT WIDGET - APENAS NA ABA CENTRO DE ANÁLISES */}
      {(activeTab === 'centro-analises' || activeTab === 'nivel') && (
        <AssistantChatWidget currentCityName={selectedCity?.name} />
      )}

      {/* UNIVERSAL VISUAL EDITOR FLOATING CONTROLS & CONFIG MODAL */}
      <AdminEditorBar />
      <ComponentConfigModal />

    </div>
  );
}
