import React from 'react';
import { Waves, Lock, Moon, Sun, Radio } from 'lucide-react';
import { ConnectionStatusType } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAdmin: () => void;
  isSyncing?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  connectionStatus?: ConnectionStatusType;
  lastUpdatedText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  isSyncing = false,
  theme = 'dark',
  onToggleTheme,
  connectionStatus = 'online',
  lastUpdatedText = ''
}) => {
  const { settings } = useSiteSettings();
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

  const logoTimestamp = settings.updated_at ? new Date(settings.updated_at).getTime() : 1;

  return (
    <header className="sticky top-0 z-40 dark:bg-[#0B132B]/95 bg-white/95 backdrop-blur-md dark:border-slate-800/80 border-slate-200 shadow-sm transition-colors border-b">
      
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => setActiveTab('inicio')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          {settings.logo_url ? (
            <img 
              src={`${settings.logo_url}${settings.logo_url.includes('?') ? '&' : '?'}v=${logoTimestamp}`} 
              alt={settings.site_name}
              className="h-10 max-w-[180px] object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight dark:text-white text-slate-900 font-sans uppercase">
                {settings.site_name || 'RIO TAQUARI'}
              </h1>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full dark:bg-cyan-950/80 bg-cyan-100 dark:text-cyan-400 text-cyan-800 dark:border-cyan-800 border-cyan-300 animate-pulse">
                  <Radio className="w-2.5 h-2.5" /> SYNC
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium tracking-widest text-cyan-600 dark:text-cyan-400 uppercase">
              {settings.site_subtitle || 'MONITORAMENTO HIDROLÓGICO'}
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
                    ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/60 bg-cyan-50 dark:border-cyan-800/60 border-cyan-300 shadow-sm border'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/50 hover:bg-slate-100 border border-transparent'
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
            onClick={onToggleTheme}
            title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            className="p-2 dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 dark:bg-slate-900 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-200 text-slate-800 dark:hover:text-white hover:text-black text-xs font-medium px-3.5 py-2 rounded-lg dark:border-slate-700/80 border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <span>ÁREA ADMIN</span>
            <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </button>
        </div>

      </div>

      {/* MOBILE NAVIGATION BAR */}
      <div className="flex xl:hidden overflow-x-auto no-scrollbar gap-2 mt-3 pt-2 dark:border-slate-800/60 border-slate-200 border-t">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-medium ${
              activeTab === item.id
                ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/80 bg-cyan-50 dark:border-cyan-800 border-cyan-300 border'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
