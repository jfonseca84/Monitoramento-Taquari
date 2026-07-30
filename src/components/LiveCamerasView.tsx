import React, { useState } from 'react';
import { Video, ExternalLink, Youtube, ShieldCheck, Radio, Eye } from 'lucide-react';

export interface LiveCameraOption {
  id: string;
  name: string;
  location: string;
  youtubeUrl: string;
  embedUrl: string;
  description?: string;
}

export const LIVE_CAMERAS_DATA: LiveCameraOption[] = [
  {
    id: 'cam-1',
    name: 'Lajeado – Ponte BR-386 (Rio Taquari - Cam 1)',
    location: 'Lajeado / Estrela - BR-386',
    youtubeUrl: 'https://www.youtube.com/live/LzBIB6nhh5U',
    embedUrl: 'https://www.youtube.com/embed/LzBIB6nhh5U',
    description: 'Monitoramento direto do fluxo d\'água e pilares da ponte da BR-386 entre Lajeado e Estrela.'
  },
  {
    id: 'cam-2',
    name: 'Lajeado – Monitoramento Ao Vivo (Cam 2)',
    location: 'Lajeado - Orla / Centro',
    youtubeUrl: 'https://www.youtube.com/live/ylO0bn3ot4k',
    embedUrl: 'https://www.youtube.com/embed/ylO0bn3ot4k',
    description: 'Visão do leito do rio e nivelamento próximo às áreas urbanas ribeirinhas de Lajeado.'
  },
  {
    id: 'cam-3',
    name: 'Lajeado – Monitoramento Ao Vivo (Cam 3)',
    location: 'Lajeado - Ponto de Controle',
    youtubeUrl: 'https://www.youtube.com/live/Tk53sxWvn2g',
    embedUrl: 'https://www.youtube.com/embed/Tk53sxWvn2g',
    description: 'Ângulo ampliado de elevação e correnteza do Rio Taquari em tempo real.'
  },
  {
    id: 'cam-4',
    name: 'Lajeado – Monitoramento Ao Vivo (Cam 4)',
    location: 'Lajeado - Panorama Geral',
    youtubeUrl: 'https://www.youtube.com/live/7zVgbMDkgio',
    embedUrl: 'https://www.youtube.com/embed/7zVgbMDkgio',
    description: 'Perspectiva panorâmica para avaliação do avanço de cotas e áreas de atenção.'
  },
  {
    id: 'cam-5',
    name: 'Estrela – Cais do Porto (Ao Vivo)',
    location: 'Estrela - Cais do Porto',
    youtubeUrl: 'https://www.youtube.com/live/AfgJqYFBOjw',
    embedUrl: 'https://www.youtube.com/embed/AfgJqYFBOjw',
    description: 'Transmissão no Cais do Porto de Estrela, acompanhando a variação na régua física e atracadouro.'
  }
];

interface LiveCamerasViewProps {
  defaultCameraId?: string;
}

export const LiveCamerasView: React.FC<LiveCamerasViewProps> = ({ defaultCameraId }) => {
  const [selectedCamera, setSelectedCamera] = useState<LiveCameraOption>(() => {
    if (defaultCameraId) {
      const found = LIVE_CAMERAS_DATA.find((c) => c.id === defaultCameraId);
      if (found) return found;
    }
    return LIVE_CAMERAS_DATA[0];
  });

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* HEADER BAR */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                  Transmissões Ao Vivo (YouTube)
                </h1>
                <span className="inline-flex items-center gap-1.5 bg-red-950/90 border border-red-700 text-red-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  AO VIVO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Selecione abaixo a câmera para assistir ao monitoramento em tempo real do Rio Taquari.
              </p>
            </div>
          </div>
        </div>

        {/* EXTERNAL YOUTUBE LINK FOR ACTIVE CAMERA */}
        <a
          href={selectedCamera.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/40 transition-all shrink-0 hover:scale-[1.02] active:scale-95"
        >
          <Youtube className="w-4 h-4" />
          <span>Assistir no YouTube</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* RESPONSIVE VIDEO PLAYER CONTAINER */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        
        {/* ACTIVE CAMERA INFO BAR ABOVE PLAYER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
              {selectedCamera.name}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {selectedCamera.location}
          </span>
        </div>

        {/* RESPONSIVE VIDEO EMBED CONTAINER (AUTO-FITS SCREEN) */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
          <iframe
            key={selectedCamera.id}
            src={`${selectedCamera.embedUrl}?autoplay=1&mute=1`}
            title={selectedCamera.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* DESCRIPTION & LINK FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A1226] border border-[#14264D] rounded-2xl p-4 text-xs">
          <p className="text-slate-300 font-medium leading-relaxed">
            {selectedCamera.description}
          </p>
          <a
            href={selectedCamera.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Link direto da transmissão</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* CAMERA SELECTOR GRID (5 OPTIONS) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Escolha a Câmera de Monitoramento</span>
          </h3>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_CAMERAS_DATA.map((cam, idx) => {
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
                    {cam.name}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cam.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span className={`font-semibold text-[11px] flex items-center gap-1 ${
                    isSelected ? 'text-cyan-300' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Eye className="w-3.5 h-3.5" />
                    {isSelected ? 'Assistindo agora' : 'Clique para assistir'}
                  </span>

                  <a
                    href={cam.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-400 hover:text-red-300 font-medium text-[11px] flex items-center gap-1 hover:underline"
                    title="Abrir diretamente no YouTube"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div className="flex items-center gap-3 bg-[#0A1226] border border-[#14264D] rounded-2xl p-4 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <p>
          As transmissões ao vivo de telemetria visual são providas em parceria com prefeituras locais e equipes de defesa civil do Vale do Taquari.
        </p>
      </div>

    </div>
  );
};
