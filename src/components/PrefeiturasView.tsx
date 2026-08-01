import React from 'react';
import { Building2, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { City } from '../types';

interface PrefeiturasViewProps {
  cities: City[];
}

export const PrefeiturasView: React.FC<PrefeiturasViewProps> = ({ cities }) => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER */}
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-6 shadow-2xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 border border-sky-500/40 rounded-2xl text-sky-600 dark:text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white text-slate-900">
              Prefeituras do Vale do Taquari
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
              Diretório oficial de contatos municipais da bacia.
            </p>
          </div>
        </div>
      </div>

      {/* CITIES CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => (
          <div
            key={city.id}
            className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between border transition-colors group"
          >
            {/* CITY PHOTO HEADER */}
            <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
              <img
                src={city.image || (city as any).image_url || city.camera_image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'}
                alt={city.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-black text-white drop-shadow">{city.river || 'Rio Taquari'}</span>
                <span className="text-[10px] font-mono font-bold bg-slate-900/80 text-cyan-400 px-2 py-0.5 rounded-md border border-slate-700">
                  RS
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold dark:text-white text-slate-900">{city.name}</h3>
                <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-2 mt-1">
                  {city.description || 'Município monitorado pela rede hidrológica do Vale do Taquari.'}
                </p>
              </div>

              <div className="space-y-2 text-xs dark:text-slate-300 text-slate-700 pt-3 dark:border-slate-800 border-slate-200 border-t">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-mono">(51) 3714-7000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>defesacivil@{city.slug}.rs.gov.br</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
