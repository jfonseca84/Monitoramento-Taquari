import React from 'react';
import { Waves, Lock, Moon, Shield, Radio } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  isSyncing = false
}) => {
  const navItems = [
    { id: 'inicio', label: 'INÍCIO' },
    { id: 'nivel', label: 'NÍVEL DO RIO' },
    { id: 'cameras', label: 'CÂMERAS AO VIVO' },
    { id: 'historico', label: 'HISTÓRICO' },
    { id: 'alertas', label: 'ALERTAS' },
    { id: 'noticias', label: 'NOTÍCIAS' },
    { id: 'defesa-civil', label: 'DEFESA CIVIL' },
    { id: 'prefeituras', label: 'PREFEITURAS' },
    { id: 'sobre', label: 'SOBRE' },
    { id: 'contato', label: 'CONTATO' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => setActiveTab('inicio')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                RIO TAQUARI
              </h1>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> SYNC
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium tracking-widest text-cyan-400 uppercase">
              MONITORAMENTO HIDROLÓGICO
            </p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <button 
            title="Alternar Tema"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Moon className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium px-3.5 py-2 rounded-lg border border-slate-700/80 transition-all shadow-sm"
          >
            <span>ÁREA ADMIN</span>
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

      </div>

      {/* MOBILE NAVIGATION BAR */}
      <div className="flex xl:hidden overflow-x-auto no-scrollbar gap-2 mt-3 pt-2 border-t border-slate-800/60">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-medium ${
              activeTab === item.id
                ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
