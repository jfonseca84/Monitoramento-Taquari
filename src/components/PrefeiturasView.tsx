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
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 border border-sky-500/40 rounded-2xl text-sky-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Prefeituras do Vale do Taquari
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
            className="bg-[#0F172A]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-white">{city.name}</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-md border border-slate-700">
                  RS
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {city.description}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono">(51) 3714-7000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>defesacivil@{city.slug}.rs.gov.br</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
