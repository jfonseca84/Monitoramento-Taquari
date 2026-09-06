import React, { useState, useEffect, useRef } from 'react';
import { City, CityCamera, Sponsor } from '../types';
import { INITIAL_CITIES } from '../data/initialData';
import { fetchCamerasByCity, fetchCameras, fetchSponsors, normalizeCitySlug } from '../lib/supabase';
import {
  Search,
  Waves,
  Maximize2,
  ShieldCheck,
  CameraOff,
  MapPin,
  Loader2,
  HelpCircle,
  Bell,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
  Building2,
  Shield,
  Radio,
  Video,
  Compass,
  User,
  CheckCircle2,
  Camera,
  RefreshCw
} from 'lucide-react';

interface LiveCamerasViewProps {
  selectedCity?: City | null;
  cities?: City[];
  onSelectCity?: (city: City) => void;
}

export function formatEmbedUrl(url: string): string {
  if (!url) return '';
  let trimmed = url.trim();
  if (trimmed.includes('youtube.com/embed/')) return trimmed;
  if (trimmed.includes('youtube.com/live/')) {
    const parts = trimmed.split('youtube.com/live/');
    const id = parts[1]?.split('?')[0]?.split('&')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  if (trimmed.includes('youtu.be/')) {
    const parts = trimmed.split('youtu.be/');
    const id = parts[1]?.split('?')[0]?.split('&')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  if (trimmed.includes('youtube.com/watch?v=')) {
    const parts = trimmed.split('v=');
    const id = parts[1]?.split('&')[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return trimmed;
}

export const LiveCamerasView: React.FC<LiveCamerasViewProps> = ({
  selectedCity,
  cities = [],
  onSelectCity
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cameras, setCameras] = useState<CityCamera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCamera, setSelectedCamera] = useState<CityCamera | null>(null);
  const [citySlugsWithCameras, setCitySlugsWithCameras] = useState<Set<string>>(new Set());
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSponsors() {
      try {
        const data = await fetchSponsors(false);
        if (isMounted && Array.isArray(data)) {
          setSponsors(data);
        }
      } catch (e) {
        console.warn('Erro ao carregar parceiros das câmeras:', e);
      }
    }
    loadSponsors();

    const handleSponsorsUpdate = () => {
      loadSponsors();
    };
    window.addEventListener('sponsors_updated', handleSponsorsUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('sponsors_updated', handleSponsorsUpdate);
    };
  }, []);

  const allCities = cities && cities.length > 0 ? cities : INITIAL_CITIES;

  const activeCityObj = allCities.find(
    (c) => c.slug === selectedCity?.slug
  ) || selectedCity || allCities.find((c) => c.slug === 'lajeado') || allCities[0];

  const activeCitySlug = activeCityObj?.slug || 'lajeado';
  const activeCityName = activeCityObj?.name || 'Lajeado';

  // Filter cities for left sidebar
  const filteredCities = allCities.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.river && c.river.toLowerCase().includes(q)) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    let isMounted = true;
    async function checkCitiesCameras() {
      try {
        const allCams = await fetchCameras('all');
        if (isMounted && Array.isArray(allCams)) {
          const activeSlugs = new Set<string>();
          allCams.forEach((cam) => {
            if (cam.ativo !== false && cam.city_slug) {
              const rawSlug = cam.city_slug;
              const cleanSlug = rawSlug.replace(/-/g, '').toLowerCase();
              const normSlug = normalizeCitySlug(rawSlug);
              activeSlugs.add(rawSlug);
              activeSlugs.add(rawSlug.toLowerCase());
              if (cleanSlug) activeSlugs.add(cleanSlug);
              if (normSlug) activeSlugs.add(normSlug);
            }
          });
          setCitySlugsWithCameras(activeSlugs);
        }
      } catch (e) {
        console.warn('Erro ao verificar câmeras das cidades:', e);
      }
    }
    checkCitiesCameras();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (cameras.length > 0 && activeCitySlug) {
      setCitySlugsWithCameras((prev) => {
        const updated = new Set(prev);
        const rawSlug = activeCitySlug;
        const cleanSlug = rawSlug.replace(/-/g, '').toLowerCase();
        const normSlug = normalizeCitySlug(rawSlug);
        updated.add(rawSlug);
        updated.add(rawSlug.toLowerCase());
        if (cleanSlug) updated.add(cleanSlug);
        if (normSlug) updated.add(normSlug);
        return updated;
      });
    }
  }, [cameras, activeCitySlug]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setCameras([]);
    setSelectedCamera(null);

    async function loadCityCameras() {
      try {
        const cityCams = await fetchCamerasByCity(activeCitySlug);
        if (isMounted) {
          setCameras(cityCams);
          setSelectedCamera(cityCams.length > 0 ? cityCams[0] : null);
        }
      } catch (err) {
        console.error('Erro ao carregar câmeras da cidade:', err);
        if (isMounted) {
          setCameras([]);
          setSelectedCamera(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCityCameras();

    return () => {
      isMounted = false;
    };
  }, [activeCitySlug]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Format Level metrics
  const levelFormatted = typeof activeCityObj?.current_level === 'number'
    ? `${activeCityObj.current_level.toFixed(2).replace('.', ',')} m`
    : '13,06 m';

  const trendFormatted = activeCityObj?.trend === 'subindo'
    ? 'Subindo ↑'
    : activeCityObj?.trend === 'descendo'
    ? 'Descendo ↓'
    : 'Estável →';

  const statusLevel = activeCityObj?.status_level || 'normal';
  const statusBadgeLabel =
    statusLevel === 'normal'
      ? 'NÍVEL NORMAL'
      : statusLevel === 'atencao'
      ? 'COTA DE ATENÇÃO'
      : statusLevel === 'alerta'
      ? 'COTA DE ALERTA'
      : 'COTA DE INUNDAÇÃO';

  const statusBadgeStyle =
    statusLevel === 'normal'
      ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-400'
      : statusLevel === 'atencao'
      ? 'bg-amber-950/80 border-amber-800/80 text-amber-400'
      : statusLevel === 'alerta'
      ? 'bg-orange-950/80 border-orange-800/80 text-orange-400'
      : 'bg-red-950/80 border-red-800/80 text-red-400';

  const lastReadTime = activeCityObj?.last_updated || '09:40 - 30/05';

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      
      {/* MAIN LAYOUT: LEFT SIDEBAR + RIGHT DASHBOARD */}
      <div className="flex flex-col lg:flex-row w-full max-w-[1800px] mx-auto gap-4 items-start">
        
        {/* ========================================== */}
        {/* MENU LATERAL ESQUERDO (FIXED LEFT SIDEBAR) */}
        {/* ========================================== */}
        <aside className="w-full lg:w-[260px] xl:w-[280px] shrink-0 lg:sticky lg:top-4 lg:self-start z-20">
          <div className="w-full bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col gap-3 shadow-xl">
            
            {/* SIDEBAR TITLE */}
            <div className="px-1 pt-1 pb-0.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                CÂMERAS
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                Acompanhe em tempo real
              </p>
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

            {/* CITIES LIST WITH INDEPENDENT SCROLL */}
            <div className="flex-1 flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-1.5 block">
                CIDADES MONITORADAS
              </span>

              <div className="overflow-y-auto max-h-[200px] sm:max-h-[350px] lg:max-h-[calc(100vh-280px)] pr-1 custom-scrollbar space-y-1">
                {filteredCities.map((c) => {
                  const isSelected = activeCityObj.id === c.id || activeCityObj.slug === c.slug;
                  const cleanCitySlug = c.slug ? c.slug.replace(/-/g, '').toLowerCase() : '';
                  const normCitySlug = c.slug ? normalizeCitySlug(c.slug) : '';
                  const normCityName = c.name ? normalizeCitySlug(c.name) : '';
                  const hasCamera =
                    citySlugsWithCameras.has(c.slug) ||
                    citySlugsWithCameras.has(c.slug.toLowerCase()) ||
                    (cleanCitySlug !== '' && citySlugsWithCameras.has(cleanCitySlug)) ||
                    (normCitySlug !== '' && citySlugsWithCameras.has(normCitySlug)) ||
                    (normCityName !== '' && citySlugsWithCameras.has(normCityName));

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        if (onSelectCity) onSelectCity(c);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 dark:bg-[#16223B] border border-cyan-600 dark:border-cyan-500/60 shadow-md text-white ring-1 ring-cyan-500/30'
                          : 'bg-slate-100/60 dark:bg-[#081023]/60 hover:bg-slate-200 dark:hover:bg-[#0E1B36] border border-slate-300/60 dark:border-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Waves
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-cyan-300' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <div className="truncate">
                          <span
                            className={`text-[11px] font-bold block truncate ${
                              isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {c.name}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                            {c.river || 'Rio Taquari'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {hasCamera ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                              Ao vivo
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              Offline
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIAGNÓSTICO DE INTEGRIDADE FOOTER WIDGET */}
            <div className="bg-slate-50 dark:bg-[#060D1E] border border-slate-200 dark:border-slate-800/90 rounded-xl p-2.5 flex items-center gap-2.5 mt-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  Diagnóstico de Integridade
                </h4>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                  Verificação do sistema e consistência
                </p>
              </div>
            </div>

          </div>
        </aside>

        {/* ========================================== */}
        {/* ÁREA PRINCIPAL DA CÂMERA (RIGHT DASHBOARD) */}
        {/* ========================================== */}
        <main className="flex-1 w-full min-w-0 bg-white dark:bg-[#0B132B] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-4 lg:p-6 shadow-xl space-y-5">
          
          {/* MAIN CAMERA STREAM & INFO ROW */}
          {loading ? (
            <div className="bg-slate-50 dark:bg-[#070D1E] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Carregando transmissão de {activeCityName}...
              </p>
            </div>
          ) : cameras.length === 0 ? (
            <div className="bg-slate-50 dark:bg-[#070D1E] border border-slate-300 dark:border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-inner">
              <div className="p-3.5 rounded-2xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-500">
                <CameraOff className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Nenhuma câmera cadastrada para a cidade de {activeCityName}.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                As transmissões para este município estão em fase de homologação técnica com a Defesa Civil.
              </p>
            </div>
          ) : (
            selectedCamera && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* LARGE CAMERA PLAYER */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
                  <div
                    ref={playerContainerRef}
                    className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group flex items-center justify-center"
                  >
                    {/* OVERLAY BADGE: AO VIVO */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-600/80 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-lg backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>AO VIVO</span>
                    </div>

                    {/* OVERLAY BUTTON: FULLSCREEN */}
                    <button
                      onClick={toggleFullscreen}
                      title="Tela Cheia"
                      className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/70 hover:bg-black/90 border border-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* OVERLAY TIMESTAMP AT BOTTOM LEFT */}
                    <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-200 font-semibold shadow-md">
                      30/05/2025 09:45:18
                    </div>

                    {/* MEDIA ELEMENT */}
                    {selectedCamera.tipo === 'Imagem Estática' ||
                    selectedCamera.url_stream.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                      <img
                        src={selectedCamera.url_stream}
                        alt={selectedCamera.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <iframe
                        key={selectedCamera.id}
                        src={`${formatEmbedUrl(selectedCamera.url_stream)}?autoplay=1&mute=1`}
                        title={selectedCamera.nome}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </div>
                </div>

                {/* CARD DE SELEÇÃO DE CÂMERAS & PARCEIROS (RIGHT SIDE PANEL) */}
                <div className="lg:col-span-4 xl:col-span-3 bg-slate-50 dark:bg-[#070D1E] border border-slate-300 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col gap-4">
                  
                  {/* CÂMERAS HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 px-0.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Video className="w-4 h-4 text-cyan-500" />
                      <span>SELECIONAR CÂMERA</span>
                    </h3>
                    <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                      {cameras.length}
                    </span>
                  </div>

                  {/* LISTA DE BOTÕES DE CÂMERAS (ESTILO CARD DO ATTACHMENT) */}
                  <div className="flex flex-col gap-2">
                    {cameras.map((cam, idx) => {
                      const isSelected = selectedCamera?.id === cam.id;
                      const camLabel = `CAM ${idx + 1}`;
                      const camSub = cam.localizacao || 'Rio Taquari';

                      return (
                        <button
                          key={cam.id}
                          onClick={() => setSelectedCamera(cam)}
                          className={`w-full px-2.5 py-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 text-left group cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-50/70 dark:bg-[#091A34] border-2 border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/30 shadow-md shadow-cyan-950/20'
                              : 'bg-white dark:bg-[#0B132B] hover:bg-slate-100 dark:hover:bg-[#121E3D] border-slate-200 dark:border-slate-800/90'
                          }`}
                        >
                          {/* ESQUERDA: ÍCONE DAS ONDAS + NOMES */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-900 text-cyan-500 dark:text-cyan-400 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <Waves className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block tracking-wide leading-tight">
                                {camLabel}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate leading-tight mt-0.5">
                                {camSub}
                              </span>
                            </div>
                          </div>

                          {/* DIREITA: SELO AO VIVO */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500 animate-pulse'
                              }`}
                            />
                            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">
                              Ao vivo
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* ESPAÇO PARA LOGOS DE EMPRESAS (UMA SOBRE A OUTRA) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-0.5">
                      APOIO / PARCEIROS
                    </span>

                    <div className="flex flex-col gap-2">
                      {/* LOGO 1 */}
                      {sponsors[0] ? (
                        sponsors[0].website ? (
                          <a
                            href={sponsors[0].website.startsWith('http') ? sponsors[0].website : `https://${sponsors[0].website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={sponsors[0].name}
                            className="h-12 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/80 rounded-xl flex items-center justify-center p-2 text-center group transition-all shadow-sm"
                          >
                            {sponsors[0].logo_url ? (
                              <img src={sponsors[0].logo_url} alt={sponsors[0].name} className="max-h-8 max-w-[85%] object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-400 transition-colors">
                                {sponsors[0].name}
                              </span>
                            )}
                          </a>
                        ) : (
                          <div className="h-12 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-2 text-center shadow-sm">
                            {sponsors[0].logo_url ? (
                              <img src={sponsors[0].logo_url} alt={sponsors[0].name} className="max-h-8 max-w-[85%] object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {sponsors[0].name}
                              </span>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="h-12 bg-white dark:bg-[#0B132B] border border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-2 text-center group hover:border-cyan-500/50 transition-colors">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 transition-colors">
                            Logo 1
                          </span>
                        </div>
                      )}

                      {/* LOGO 2 */}
                      {sponsors[1] ? (
                        sponsors[1].website ? (
                          <a
                            href={sponsors[1].website.startsWith('http') ? sponsors[1].website : `https://${sponsors[1].website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={sponsors[1].name}
                            className="h-12 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 hover:border-cyan-500/80 rounded-xl flex items-center justify-center p-2 text-center group transition-all shadow-sm"
                          >
                            {sponsors[1].logo_url ? (
                              <img src={sponsors[1].logo_url} alt={sponsors[1].name} className="max-h-8 max-w-[85%] object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-400 transition-colors">
                                {sponsors[1].name}
                              </span>
                            )}
                          </a>
                        ) : (
                          <div className="h-12 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center p-2 text-center shadow-sm">
                            {sponsors[1].logo_url ? (
                              <img src={sponsors[1].logo_url} alt={sponsors[1].name} className="max-h-8 max-w-[85%] object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {sponsors[1].name}
                              </span>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="h-12 bg-white dark:bg-[#0B132B] border border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-2 text-center group hover:border-cyan-500/50 transition-colors">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 transition-colors">
                            Logo 2
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )
          )}

        </main>

      </div>

    </div>
  );
};

