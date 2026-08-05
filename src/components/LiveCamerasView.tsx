import React, { useState, useEffect } from 'react';
import { City, CityCamera } from '../types';
import { fetchCamerasByCity } from '../lib/supabase';
import { Video, ExternalLink, Youtube, ShieldCheck, Radio, Eye, CameraOff, MapPin, Loader2 } from 'lucide-react';

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
  const [cameras, setCameras] = useState<CityCamera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCamera, setSelectedCamera] = useState<CityCamera | null>(null);

  const activeCitySlug = selectedCity?.slug || 'lajeado';
  const activeCityName = selectedCity?.name || 'Lajeado';

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

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* HEADER BAR & CITY SELECTOR */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  Câmeras Ao Vivo – {activeCityName}
                </h1>
                <span className="inline-flex items-center gap-1.5 bg-red-950/90 border border-red-700 text-red-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  AO VIVO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Monitoramento exclusivo e em tempo real para a cidade de <strong className="text-cyan-300">{activeCityName}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* CITY SELECTOR DROPDOWN IF CITIES PROVIDED */}
        {cities && cities.length > 0 && onSelectCity && (
          <div className="flex items-center gap-2 shrink-0 bg-slate-900 border border-slate-800 p-2 rounded-2xl w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-cyan-400 ml-2 shrink-0" />
            <select
              value={activeCitySlug}
              onChange={(e) => {
                const target = cities.find(c => c.slug === e.target.value);
                if (target) onSelectCity(target);
              }}
              className="bg-transparent text-white text-xs font-bold py-1.5 pr-4 pl-1 outline-none cursor-pointer w-full"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.slug} className="bg-slate-900 text-white">
                  {city.name} ({city.slug})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Carregando câmeras da cidade {activeCityName}...</p>
        </div>
      ) : cameras.length === 0 ? (
        /* FRIENDLY EMPTY STATE WHEN CITY HAS NO CAMERAS */
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            <CameraOff className="w-10 h-10 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Esta cidade ainda não possui câmeras cadastradas.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Nossa equipe técnica e as autoridades locais de {activeCityName} trabalham constantemente para expandir o sistema de monitoramento ao vivo.
            </p>
          </div>
        </div>
      ) : (
        /* ACTIVE CAMERA CONTENT */
        selectedCamera && (
          <div className="space-y-8">
            {/* RESPONSIVE VIDEO PLAYER CONTAINER */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
              
              {/* ACTIVE CAMERA INFO BAR ABOVE PLAYER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                    {selectedCamera.nome}
                  </h2>
                </div>
                {selectedCamera.localizacao && (
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedCamera.localizacao}
                  </span>
                )}
              </div>

              {/* RESPONSIVE VIDEO STREAM PLAYER */}
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
                {selectedCamera.tipo === 'Imagem Estática' || selectedCamera.url_stream.match(/\.(jpeg|jpg|gif|png)$/i) ? (
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

              {/* DESCRIPTION & LINK FOOTER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1226] border border-[#14264D] rounded-2xl p-4 text-xs">
                <p className="text-slate-300 font-medium leading-relaxed">
                  {selectedCamera.descricao || `Transmissão ao vivo do ponto de monitoramento em ${activeCityName}.`}
                </p>
                {selectedCamera.url_stream && (
                  <a
                    href={selectedCamera.url_stream}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 shrink-0 self-start sm:self-center"
                  >
                    <span>Link direto do stream</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* CAMERA SELECTOR GRID FOR THIS CITY */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Câmeras Disponíveis em {activeCityName} ({cameras.length})</span>
                </h3>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cameras.map((cam, idx) => {
                  const isSelected = selectedCamera.id === cam.id;
                  return (
                    <div
                      key={cam.id}
                      onClick={() => setSelectedCamera(cam)}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#0D2147] border-cyan-500/80 shadow-xl shadow-cyan-950/40 ring-2 ring-cyan-500/30'
                          : 'bg-[#0F172A] hover:bg-[#16223B] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            CÂMERA {idx + 1}
                          </span>

                          <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-900/60 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            AO VIVO
                          </span>
                        </div>

                        <h4 className={`text-sm font-bold leading-snug transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-cyan-300'
                        }`}>
                          {cam.nome}
                        </h4>

                        {cam.descricao && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {cam.descricao}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold text-[11px] flex items-center gap-1 ${
                          isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                        }`}>
                          <Eye className="w-3.5 h-3.5" />
                          {isSelected ? 'Assistindo agora' : 'Clique para assistir'}
                        </span>

                        <span className="text-slate-500 text-[10px] uppercase font-mono">
                          {cam.tipo || 'Ao Vivo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}

      {/* FOOTER NOTICE */}
      <div className="flex items-center gap-3 bg-[#0A1226] border border-[#14264D] rounded-2xl p-4 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <p>
          As transmissões ao vivo por cidade são mantidas em parceria com órgãos de Defesa Civil e Prefeituras Municipais do Estado.
        </p>
      </div>

    </div>
  );
};
