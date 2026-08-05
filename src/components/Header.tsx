import React, { useState, useRef, useEffect } from 'react';
import { Waves, Lock, Moon, Sun, Radio, Pencil, ChevronDown, Building2, Shield } from 'lucide-react';
import { ConnectionStatusType } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useVisualEditor } from '../context/VisualEditorContext';

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
  const { isAdmin, isEditMode, setEditMode } = useVisualEditor();

  const [isInstitucionalOpen, setIsInstitucionalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsInstitucionalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const primaryNavItems = [
    { id: 'inicio', label: 'INÍCIO' },
    { id: 'centro-analises', label: 'CENTRO DE ANÁLISES' },
    { id: 'cameras', label: 'CÂMERAS' },
    { id: 'historico', label: 'HISTÓRICO' },
    { id: 'alertas', label: 'ALERTAS' },
    { id: 'noticias', label: 'NOTÍCIAS' },
  ];

  const secondaryNavItems = [
    { id: 'sobre', label: 'SOBRE' },
    { id: 'contato', label: 'CONTATO' },
  ];

  const isInstitucionalActive = activeTab === 'prefeituras' || activeTab === 'defesa-civil';
  const logoTimestamp = settings.updated_at ? new Date(settings.updated_at).getTime() : 1;

  return (
    <header className="sticky top-0 z-40 dark:bg-[#0B132B]/95 bg-white/95 backdrop-blur-md dark:border-slate-800/80 border-slate-200 shadow-sm transition-colors border-b">
      
      <div className="max-w-[1650px] mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* LOGO & BRANDING */}
        <div 
          onClick={() => setActiveTab('inicio')} 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
        >
          {settings.logo_url ? (
            <img 
              src={`${settings.logo_url}${settings.logo_url.includes('?') ? '&' : '?'}v=${logoTimestamp}`} 
              alt={settings.site_name}
              className="h-8 sm:h-9 max-w-[130px] sm:max-w-[170px] object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform shrink-0">
              <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight dark:text-white text-slate-900 font-sans uppercase leading-none truncate">
                {settings.site_name || 'RIO TAQUARI'}
              </h1>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full dark:bg-cyan-950/80 bg-cyan-100 dark:text-cyan-400 text-cyan-800 dark:border-cyan-800 border-cyan-300 animate-pulse shrink-0">
                  <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> SYNC
                </span>
              )}
            </div>
            <p className="text-[7.5px] sm:text-[8px] font-bold tracking-[0.1em] sm:tracking-[0.15em] text-cyan-600 dark:text-cyan-400 uppercase leading-tight mt-0.5 truncate">
              {settings.site_subtitle || 'MONITORAMENTO HIDROLÓGICO'}
            </p>
          </div>
        </div>

        {/* NAVIGATION LINKS - REPOSITIONED SLIGHTLY RIGHT WITH COMPACT UNIFORM SPACING */}
        <div className="hidden xl:flex items-center justify-end flex-1 mr-2">
          <nav className="flex items-center gap-1 lg:gap-1.5">
            
            {/* Primary Nav Items */}
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/60 bg-cyan-50 dark:border-cyan-800/60 border-cyan-300 shadow-sm border'
                      : 'dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/50 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {/* INSTITUCIONAL DROPDOWN */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setIsInstitucionalOpen(true)}
              onMouseLeave={() => setIsInstitucionalOpen(false)}
            >
              <button
                onClick={() => setIsInstitucionalOpen(!isInstitucionalOpen)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isInstitucionalActive || isInstitucionalOpen
                    ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/60 bg-cyan-50 dark:border-cyan-800/60 border-cyan-300 shadow-sm border'
                    : 'dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span>INSTITUCIONAL</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isInstitucionalOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                  }`} 
                />
              </button>

              {/* DROPDOWN MENU */}
              {isInstitucionalOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800/90 shadow-xl shadow-slate-950/20 dark:shadow-slate-950/60 p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setActiveTab('prefeituras');
                      setIsInstitucionalOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeTab === 'prefeituras'
                        ? 'dark:bg-cyan-950/80 bg-cyan-50 dark:text-cyan-400 text-cyan-700 dark:border-cyan-800/60 border-cyan-200 border'
                        : 'dark:text-slate-300 text-slate-700 dark:hover:bg-slate-800/70 hover:bg-slate-100 dark:hover:text-white hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Prefeituras</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('defesa-civil');
                      setIsInstitucionalOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeTab === 'defesa-civil'
                        ? 'dark:bg-cyan-950/80 bg-cyan-50 dark:text-cyan-400 text-cyan-700 dark:border-cyan-800/60 border-cyan-200 border'
                        : 'dark:text-slate-300 text-slate-700 dark:hover:bg-slate-800/70 hover:bg-slate-100 dark:hover:text-white hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Defesa Civil</span>
                  </button>
                </div>
              )}
            </div>

            {/* Secondary Nav Items */}
            {secondaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
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
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isEditMode
                  ? 'bg-cyan-500 text-black shadow-cyan-500/20'
                  : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-400 border border-cyan-800'
              }`}
              title="Ativar modo de edição visual de componentes e dashboards"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEditMode ? 'Sair da Edição' : 'Editar Dashboard'}</span>
            </button>
          )}

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
            title="Área Administrativa"
            aria-label="Área Administrativa"
            className="p-2 dark:bg-slate-900 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-200 text-slate-800 dark:hover:text-white hover:text-black rounded-lg dark:border-slate-700/80 border-slate-300 border transition-all shadow-sm cursor-pointer flex items-center justify-center"
          >
            <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </button>
        </div>

      </div>

      {/* MOBILE NAVIGATION BAR */}
      <div className="flex xl:hidden overflow-x-auto touch-pan-x max-w-full no-scrollbar gap-1.5 px-3 sm:px-4 py-2 dark:border-slate-800/60 border-slate-200 border-t">
        {primaryNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-semibold ${
              activeTab === item.id
                ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/80 bg-cyan-50 dark:border-cyan-800 border-cyan-300 border'
                : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}

        {/* Mobile Institucional options directly accessible */}
        <button
          onClick={() => setActiveTab('prefeituras')}
          className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
            activeTab === 'prefeituras'
              ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/80 bg-cyan-50 dark:border-cyan-800 border-cyan-300 border'
              : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3 h-3 text-cyan-500" />
          <span>PREFEITURAS</span>
        </button>

        <button
          onClick={() => setActiveTab('defesa-civil')}
          className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
            activeTab === 'defesa-civil'
              ? 'dark:text-cyan-400 text-cyan-700 dark:bg-cyan-950/80 bg-cyan-50 dark:border-cyan-800 border-cyan-300 border'
              : 'dark:text-slate-400 text-slate-600 dark:hover:text-slate-200 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3 h-3 text-cyan-500" />
          <span>DEFESA CIVIL</span>
        </button>

        {secondaryNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-[11px] font-semibold ${
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

