import React, { useState, useEffect } from 'react';
import { City, LevelStatus } from '../types';
import { Info, Video, MapPin } from 'lucide-react';
import { getBrasiliaDateString, getBrasiliaTimeString } from '../lib/dateUtils';
import { fetchCamerasByCity } from '../lib/supabase';

interface LiveCameraHeroProps {
  selectedCity: City;
  onOpenCameraModal: () => void;
  onOpenInfoModal: () => void;
  onOpenDetailModal?: () => void;
}

export const LiveCameraHero: React.FC<LiveCameraHeroProps> = ({
  selectedCity,
  onOpenCameraModal,
  onOpenInfoModal,
  onOpenDetailModal
}) => {
  const getHeroDefaultImg = (city: City) => {
    if (city.image && city.image.includes('supabase.co/storage')) return city.image;
    if (city.camera_image && city.camera_image.includes('supabase.co/storage')) return city.camera_image;
    return city.image || city.camera_image || '';
  };

  const [imgLoaded, setImgLoaded] = useState(true);
  const [heroBgImg, setHeroBgImg] = useState<string>(getHeroDefaultImg(selectedCity));

  useEffect(() => {
    let isMounted = true;
    const currentCityImg = getHeroDefaultImg(selectedCity);
    setHeroBgImg(currentCityImg);

    async function loadCityCameraHero() {
      try {
        // If city image is uploaded directly to Supabase storage, prefer city's custom image
        if (currentCityImg.includes('supabase.co/storage')) {
          return;
        }
        const cams = await fetchCamerasByCity(selectedCity.slug);
        if (isMounted && cams.length > 0) {
          const firstCam = cams[0];
          if (firstCam.url_thumbnail) {
            setHeroBgImg(firstCam.url_thumbnail);
          } else if (firstCam.tipo === 'Imagem Estática' && firstCam.url_stream) {
            setHeroBgImg(firstCam.url_stream);
          }
        }
      } catch (err) {
        // Fallback to city default image
      }
    }

    loadCityCameraHero();

    return () => {
      isMounted = false;
    };
  }, [selectedCity.slug, selectedCity.camera_image, selectedCity.image]);

  // Quota values
  const rawRiverName = selectedCity.river || 'Taquari';
  const riverName = rawRiverName.toLowerCase().startsWith('rio ')
    ? rawRiverName.slice(4).trim()
    : rawRiverName;
  const floodQuota = typeof selectedCity.flood_level === 'number' && !isNaN(selectedCity.flood_level) ? selectedCity.flood_level.toFixed(2).replace('.', ',') : '19,00';
  const alertQuota = typeof selectedCity.alert_level === 'number' && !isNaN(selectedCity.alert_level) ? selectedCity.alert_level.toFixed(2).replace('.', ',') : '17,00';
  const attentionQuota = typeof selectedCity.attention_level === 'number' && !isNaN(selectedCity.attention_level) ? selectedCity.attention_level.toFixed(2).replace('.', ',') : '15,00';

  const getStatusStyle = (status?: LevelStatus) => {
    switch (status) {
      case 'inundacao':
        return {
          boxClass: 'bg-[#B90E37] border-2 border-[#E52B50] shadow-2xl shadow-red-600/60 animate-pulse',
          title: 'EM INUNDAÇÃO',
          subtitle: `Cota de Inundação Atingida (${floodQuota}m)!`
        };
      case 'alerta':
        return {
          boxClass: 'bg-[#C25E00] border-2 border-[#FF8800] shadow-xl shadow-orange-950/80',
          title: 'EM ALERTA',
          subtitle: `Cota de Alerta Atingida (${alertQuota}m)!`
        };
      case 'atencao':
        return {
          boxClass: 'bg-[#855B00] border-2 border-[#FFC107] shadow-xl shadow-amber-950/80',
          title: 'EM ATENÇÃO',
          subtitle: `Cota de Atenção Atingida (${attentionQuota}m)!`
        };
      default:
        return {
          boxClass: 'bg-[#0B3D2C] border-2 border-[#2AE89B]/60 shadow-xl shadow-emerald-950/80',
          title: 'NÍVEL NORMAL',
          subtitle: `Dentro da cota de segurança (${attentionQuota}m)`
        };
    }
  };

  const statusStyle = getStatusStyle(selectedCity.status_level);

  const formattedLevel = typeof selectedCity.current_level === 'number' && !isNaN(selectedCity.current_level)
    ? selectedCity.current_level.toFixed(2).replace('.', ',')
    : '0,00';

  const rawRateVal = typeof selectedCity.rate_of_change === 'number' && !isNaN(selectedCity.rate_of_change)
    ? selectedCity.rate_of_change
    : 0;
  const rateValCm = Number((rawRateVal * 100).toFixed(1));
  const rateOfChangeCmStr = Math.abs(rateValCm).toString().replace('.0', '').replace('.', ',');

  const isUp = selectedCity.trend === 'subindo' || rateValCm > 0;
  const isDown = selectedCity.trend === 'descendo' || rateValCm < 0;

  const trendSymbol = isUp ? '↗' : isDown ? '↘' : '→';
  const trendSign = isUp ? '+' : isDown ? '-' : '';
  const trendColorClass = isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-300';

  // Format date display in Horário de Brasília
  const rawDate = selectedCity.updated_at || selectedCity.last_updated;
  const validDate = rawDate && rawDate !== 'Atualizando...' ? rawDate : undefined;
  const displayDate = getBrasiliaDateString(validDate);
  const displayTime = getBrasiliaTimeString(validDate).replace(':', 'h');


  // Station location name
  const stationLocation = selectedCity.slug === 'lajeado' || selectedCity.name.toLowerCase().includes('lajeado')
    ? 'Ponte da BR-386'
    : (selectedCity.station_id ? `Estação ${selectedCity.name}` : 'Ponte Principal');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl min-h-[320px] flex flex-col justify-between p-6 sm:p-8">
      
      {/* BACKGROUND CAMERA IMAGE OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBgImg || selectedCity.camera_image || selectedCity.image}
          alt={`Câmera ao vivo ${selectedCity.name}`}
          className="w-full h-full object-cover opacity-35 scale-105 transition-transform duration-700"
          onError={(e) => {
            setImgLoaded(false);
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
          }}
        />
        {/* GRADIENT OVERLAYS TO MATCH MOCKUP ATMOSPHERE */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B]/95 via-[#0B132B]/80 to-[#0B132B]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-slate-950/40 to-transparent" />
      </div>

      {/* TOP BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* TOP LEFT: CITY NAME + AO VIVO BADGE */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
            {selectedCity.name} – RS
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-[#103D2E] border border-[#1A6349] text-[#2AE89B] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2AE89B] animate-pulse" />
            AO VIVO
          </span>
        </div>

        {/* TOP RIGHT: CÂMERA AO VIVO BUTTON */}
        <button
          onClick={onOpenCameraModal}
          className="flex items-center gap-2 bg-[#182035] hover:bg-[#202B47] border border-slate-700/80 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Video className="w-4 h-4 text-cyan-400" />
          <span className="whitespace-nowrap">CÂMERA AO VIVO</span>
        </button>
      </div>

      {/* MIDDLE SECTION */}
      <div className="relative z-10 mt-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            NÍVEL DO RIO {riverName.toUpperCase()}
          </h2>
          <button
            onClick={onOpenInfoModal}
            title="Informações do Nível"
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
          {/* GIANT LEVEL NUMBER */}
          <button
            onClick={onOpenDetailModal}
            className="group text-left cursor-pointer transition-transform active:scale-95"
            title="Clique para ver gráficos e histórico detalhado"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors">
                {formattedLevel}
              </span>
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-none">
                m
              </span>
            </div>
          </button>

          {/* TREND BADGE Beside Level Number (Aligned on the baseline of 'm') */}
          <div className={`flex items-center gap-1.5 bg-[#121A2D]/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold font-mono self-baseline ${trendColorClass}`}>
            <span className="text-sm">{trendSymbol}</span>
            <span>{trendSign}{rateOfChangeCmStr} cm/h (1h)</span>
          </div>
        </div>

        {/* TIMESTAMP SUBTITLE */}
        <p className="text-xs text-slate-300 font-medium tracking-wide mt-2">
          {displayDate} • Última atualização às {displayTime}
        </p>
      </div>

      {/* BOTTOM SECTION */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* BOTTOM LEFT: STATUS PILL BADGE */}
        <div className={`rounded-2xl px-5 py-3.5 border flex flex-col justify-center min-w-[260px] max-w-sm ${statusStyle.boxClass}`}>
          <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white">
            {statusStyle.title}
          </span>
          <p className="text-xs text-white/95 font-semibold tracking-wide mt-0.5">
            {statusStyle.subtitle}
          </p>
        </div>

        {/* BOTTOM RIGHT: LOCATION / BRIDGE BADGE */}
        <div className="bg-[#121A2D]/95 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-white leading-tight">
              {stationLocation}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {selectedCity.name} - RS
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};


