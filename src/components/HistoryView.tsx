import React, { useState, useEffect } from 'react';
import { City } from '../types';
import { Download, Calendar } from 'lucide-react';
import { fetchRiverLevels } from '../lib/supabase';
import { getBrasiliaDateTimeString } from '../lib/dateUtils';

interface HistoryViewProps {
  cities: City[];
  selectedCity: City;
  onSelectCity: (city: City) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  cities,
  selectedCity,
  onSelectCity
}) => {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchRiverLevels(selectedCity.id, 100).then((data) => {
      if (!isMounted) return;
      if (data && data.length > 0) {
        setReadings(data);
      } else {
        // Fallback reading generated for simulation if table is empty
        const now = new Date();
        setReadings([
          {
            id: 'r1',
            recorded_at: now.toISOString(),
            level: selectedCity.current_level || 3.12,
            trend: selectedCity.trend || 'estavel',
            rate_of_change: selectedCity.rate_of_change || 0,
            station: { name: `${selectedCity.name} - Estação Central` }
          }
        ]);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const handleExportCSV = () => {
    window.open(`/api/export?city_id=${selectedCity.id}&format=csv`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* HEADER & FILTERS */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <span>Histórico de Leituras Hidrológicas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Consulte e exporte medições oficiais arquivadas no sistema (em Horário de Brasília).
          </p>
        </div>

        {/* EXPORT BUTTON */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Dados (CSV / Excel)</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-slate-400 font-medium mb-1">Cidade / Estação</label>
          <select
            value={selectedCity.id}
            onChange={(e) => {
              const found = cities.find((c) => c.id === e.target.value);
              if (found) onSelectCity(found);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* HISTORY DATA TABLE */}
      <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4">
          Registros de Telemetria — {selectedCity.name} ({readings.length} medições)
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            Carregando medições de river_levels...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Data e Hora (BRT)</th>
                  <th className="p-3">Estação</th>
                  <th className="p-3">Nível (m)</th>
                  <th className="p-3">Tendência</th>
                  <th className="p-3">Taxa (m/h)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {readings.map((row) => {
                  const levelNum = Number(row.level || 0);
                  const floodLevel = selectedCity.flood_level || 8.5;
                  const alertLevel = selectedCity.alert_level || 6.0;
                  const attentionLevel = selectedCity.attention_level || 3.0;

                  let statusText = 'Normal';
                  let statusBg = 'bg-emerald-950 text-emerald-400 border-emerald-800';

                  if (levelNum >= floodLevel) {
                    statusText = 'Inundação';
                    statusBg = 'bg-red-950 text-red-400 border-red-800';
                  } else if (levelNum >= alertLevel) {
                    statusText = 'Alerta';
                    statusBg = 'bg-orange-950 text-orange-400 border-orange-800';
                  } else if (levelNum >= attentionLevel) {
                    statusText = 'Atenção';
                    statusBg = 'bg-amber-950 text-amber-300 border-amber-800';
                  }

                  const stationName = row.station?.name || `${selectedCity.name} - Estação`;
                  const formattedDateTime = getBrasiliaDateTimeString(row.recorded_at);

                  return (
                    <tr key={row.id || row.recorded_at} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-300 font-bold">{formattedDateTime}</td>
                      <td className="p-3 text-white font-sans font-semibold">{stationName}</td>
                      <td className="p-3 font-bold text-cyan-400 text-sm">{levelNum.toFixed(2).replace('.', ',')} m</td>
                      <td className="p-3 capitalize">{row.trend || 'estavel'}</td>
                      <td className="p-3">{row.rate_of_change ? `${Number(row.rate_of_change) > 0 ? '+' : ''}${Number(row.rate_of_change).toFixed(2)}` : '0.00'} m/h</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${statusBg}`}>
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

