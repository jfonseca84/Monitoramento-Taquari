import React from 'react';
import { Lock, Moon, Pencil } from 'lucide-react';
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

// Menu do layout novo. Por enquanto só a página Início está ativa; as demais
// ficam visíveis porém desativadas até receberem o novo design.
const NAV_ITEMS = [
  { id: 'inicio', label: 'INÍCIO' },
  { id: 'centro-analises', label: 'CENTRO DE ANÁLISES' },
  { id: 'cameras', label: 'CÂMERAS' },
  { id: 'historico', label: 'HISTÓRICO' },
  { id: 'alertas', label: 'ALERTAS' },
  { id: 'noticias', label: 'NOTÍCIAS' },
  { id: 'institucional', label: 'INSTITUCIONAL', caret: true },
  { id: 'sobre', label: 'SOBRE' },
  { id: 'contato', label: 'CONTATO' }
];
const ENABLED_NAV_ITEMS = ['inicio'];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  isSyncing = false,
  connectionStatus = 'online'
}) => {
  const { settings } = useSiteSettings();
  const { isAdmin, isEditMode, setEditMode } = useVisualEditor();

  const logoTimestamp = settings.updated_at ? new Date(settings.updated_at).getTime() : 1;

  // Indicador de sincronização (realtime / poll)
  const syncColor = connectionStatus === 'offline' ? '#D9483B' : isSyncing || connectionStatus === 'updating' ? '#E9C145' : '#3FA46A';
  const syncTitle = connectionStatus === 'offline'
    ? 'Sem conexão com os dados em tempo real'
    : isSyncing || connectionStatus === 'updating'
      ? 'Sincronizando dados...'
      : 'Dados em tempo real conectados';

  return (
    <header className="sticky top-0 z-40 h-14 box-border bg-white border-b border-[#E6E9ED] flex items-center gap-4 md:gap-6 px-[clamp(16px,3.5vw,64px)] font-[family-name:Figtree,system-ui,sans-serif]">

      {/* LOGO */}
      <button
        type="button"
        onClick={() => setActiveTab('inicio')}
        className="flex flex-col leading-[1.05] min-w-0 md:shrink-0 text-left cursor-pointer"
      >
        {settings.logo_url ? (
          <img
            src={`${settings.logo_url}${settings.logo_url.includes('?') ? '&' : '?'}v=${logoTimestamp}`}
            alt={settings.site_name || 'Nível Taquari'}
            className="h-8 max-w-[170px] object-contain"
          />
        ) : (
          <>
            <span className="text-[17px] font-extrabold tracking-[-0.01em] text-[#1B222B] uppercase truncate max-w-full">
              {settings.site_name || 'Nível Taquari'}
            </span>
            <span className="text-[8px] font-extrabold tracking-[0.14em] text-[#1F8FB8] uppercase truncate max-w-full">
              {settings.site_subtitle || 'Monitoramento em tempo real'}
            </span>
          </>
        )}
      </button>

      {/* MENU */}
      <nav className="hidden md:flex flex-1 min-w-0 justify-center-safe items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Menu principal">
        {NAV_ITEMS.map((item) => {
          const enabled = ENABLED_NAV_ITEMS.includes(item.id);
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => enabled && setActiveTab(item.id)}
              disabled={!enabled}
              aria-current={active ? 'page' : undefined}
              title={enabled ? undefined : 'Em breve'}
              className={`shrink-0 flex items-center gap-[5px] px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium tracking-[0.03em] whitespace-nowrap border ${
                active
                  ? 'text-[#1F6F95] bg-[#EAF6FB] border-[#A9D6EA]'
                  : enabled
                    ? 'text-[#3A434E] border-transparent hover:text-[#1F6F95] cursor-pointer'
                    : 'text-[#A3AAB2] border-transparent cursor-not-allowed'
              }`}
            >
              {item.label}
              {item.caret && <span className="text-[9px]">⌄</span>}
            </button>
          );
        })}
      </nav>

      {/* AÇÕES */}
      <div className="flex items-center gap-3.5 shrink-0 ml-auto md:ml-0">
        <span
          className={`w-2 h-2 rounded-full ${isSyncing ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: syncColor }}
          title={syncTitle}
          aria-label={syncTitle}
          role="status"
        />

        {isAdmin && (
          <button
            onClick={() => setEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
              isEditMode ? 'bg-[#1F6F95] text-white border-[#1F6F95]' : 'bg-[#EAF6FB] text-[#1F6F95] border-[#A9D6EA]'
            }`}
            title="Ativar modo de edição visual de componentes e dashboards"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditMode ? 'Sair da Edição' : 'Editar'}</span>
          </button>
        )}

        {/* Tema: o layout novo é somente escuro (ícone mantido como no modelo) */}
        <span className="w-8 h-8 flex items-center justify-center text-[#1B222B]" title="Tema escuro" aria-hidden="true">
          <Moon className="w-4 h-4 fill-current" />
        </span>

        <button
          onClick={onOpenAdmin}
          title="Entrar"
          aria-label="Área Administrativa"
          className="w-9 h-[34px] rounded-lg border border-[#C7E3EF] bg-[#F3FAFD] flex items-center justify-center cursor-pointer"
        >
          <Lock className="w-4 h-4 text-[#2A7FA8]" />
        </button>
      </div>
    </header>
  );
};
