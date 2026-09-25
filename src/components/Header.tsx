import React, { useState } from 'react';
import { Lock, Menu, Moon, Pencil, Sun, X } from 'lucide-react';
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
const ENABLED_NAV_ITEMS = ['inicio', 'historico'];

// Descrição abaixo do nome do site no cabeçalho (fixa; site_subtitle segue valendo no título da aba, rodapé e Sobre)
const LOGO_TAGLINE = 'O VALE BEM INFORMADO';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdmin,
  theme = 'dark',
  onToggleTheme
}) => {
  const { settings } = useSiteSettings();
  const { isAdmin, isEditMode, setEditMode } = useVisualEditor();
  const [logoFailed, setLogoFailed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const logoTimestamp = settings.updated_at ? new Date(settings.updated_at).getTime() : 1;

  return (
    <header className="sticky top-0 z-40 h-14 box-border bg-white border-b border-[#E6E9ED] flex items-center gap-2 md:gap-4 px-[clamp(12px,3.5vw,64px)] lg:px-0 lg:gap-0 lg:grid lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.6fr)_150px] font-[family-name:Figtree,system-ui,sans-serif] relative">

      {/* LOGO */}
      <button
        type="button"
        onClick={() => setActiveTab('inicio')}
        className="flex flex-col leading-[1.05] min-w-[70px] flex-1 md:flex-none md:shrink-0 text-left cursor-pointer lg:pl-[clamp(12px,3.5vw,64px)] lg:justify-self-start"
      >
        {settings.logo_url && !logoFailed ? (
          <img
            src={`${settings.logo_url}${settings.logo_url.includes('?') ? '&' : '?'}v=${logoTimestamp}`}
            alt={settings.site_name || 'Nível Taquari'}
            className="h-8 max-w-[170px] object-contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <>
            <span className="text-[17px] font-extrabold tracking-[-0.01em] text-[#1B222B] uppercase truncate max-w-full">
              {settings.site_name || 'Nível Taquari'}
            </span>
            <span className="text-[8px] font-extrabold tracking-[0.14em] text-[#1F8FB8] uppercase truncate max-w-full">
              {LOGO_TAGLINE}
            </span>
          </>
        )}
      </button>

      {/* MENU (telas largas: tudo em uma linha, sem cortar nada) */}
      <nav className="hidden lg:flex min-w-0 justify-center-safe items-center gap-0 xl:gap-0.5 overflow-x-auto no-scrollbar" aria-label="Menu principal">
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
              className={`shrink-0 flex items-center gap-[4px] xl:gap-[5px] px-1 xl:px-1.5 py-1.5 rounded-[7px] text-[10px] xl:text-[11px] font-medium tracking-[0.02em] xl:tracking-[0.03em] whitespace-nowrap border ${
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

      {/* PAINEL DO MENU (telas estreitas) */}
      {mobileNavOpen && (
        <>
        {/* Toque fora do painel (na parte da esquerda) fecha o menu */}
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden fixed inset-x-0 bottom-0 top-14 bg-black/25 cursor-default"
        />
        {/* Painel na lateral direita: a página continua visível à esquerda */}
        <nav
          id="mobile-nav-panel"
          aria-label="Menu principal"
          className="lg:hidden fixed right-0 top-14 bottom-0 w-[210px] bg-white border-l border-[#E6E9ED] shadow-[-10px_0_28px_rgba(0,0,0,0.35)] flex flex-col p-2 overflow-y-auto"
        >
          {NAV_ITEMS.map((item) => {
            const enabled = ENABLED_NAV_ITEMS.includes(item.id);
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (enabled) {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }
                }}
                disabled={!enabled}
                aria-current={active ? 'page' : undefined}
                title={enabled ? undefined : 'Em breve'}
                className={`flex items-center gap-[5px] px-3 py-2.5 rounded-[7px] text-[13px] font-medium tracking-[0.03em] text-left ${
                  active
                    ? 'text-white bg-[#2B333D] font-semibold'
                    : enabled
                      ? 'text-[#3A434E] hover:bg-[#F4F7F9] cursor-pointer'
                      : 'text-[#A3AAB2] cursor-not-allowed'
                }`}
              >
                {item.label}
                {item.caret && <span className="text-[9px]">⌄</span>}
              </button>
            );
          })}
        </nav>
        </>
      )}

      {/* GATILHO DO MENU + AÇÕES */}
      <div className="flex items-center gap-2 lg:gap-3.5 shrink-0 ml-auto lg:ml-0 lg:justify-self-end lg:pr-[clamp(12px,3.5vw,64px)]">
        {/* GATILHO DO MENU (telas estreitas: nada fica escondido, vai para um painel) */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-panel"
          aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-[#E6E9ED] text-[#3A434E] cursor-pointer"
        >
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

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

        {/* Tema: o visitante escolhe entre escuro e claro (a escolha fica salva no navegador) */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
          aria-label={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
          className="w-8 h-8 flex items-center justify-center text-[#1B222B] rounded-md cursor-pointer hover:bg-[#EEF0F3]"
        >
          {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 fill-current" />}
        </button>

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
