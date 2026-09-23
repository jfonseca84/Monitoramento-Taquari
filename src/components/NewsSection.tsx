import React, { useState } from 'react';
import { NewsItem } from '../types';
import { INITIAL_NEWS } from '../data/initialData';
import {
  Newspaper,
  ChevronRight,
  Clock,
  User,
  X,
  Search,
  ExternalLink,
  Pin,
  Share2,
  CheckCircle2,
  ShieldAlert,
  Globe
} from 'lucide-react';
import { NEWS_CATEGORY_COLORS, SURFACE_A, MUTED, SECTION_PAD } from './homeTheme';

const DEMO_NEWS_IDS = new Set(INITIAL_NEWS.map((n) => n.id));
const HOME_NEWS_LIMIT = 3;

// No banco "date" é TIMESTAMPTZ: mostra tempo relativo ("há 2 horas"); texto livre passa como está
function relativeTime(value?: string): string {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (isNaN(t)) return value;
  const diffMin = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return new Date(t).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

interface NewsSectionProps {
  news: NewsItem[];
  onViewAllNews?: () => void;
  isFullPage?: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news, onViewAllNews, isFullPage = false }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Somente notícias reais: as notícias de exemplo (INITIAL_NEWS) nunca são exibidas,
  // nem quando chegam pelo fallback local do bootstrap
  const rawNews = (news || []).filter((n) => !DEMO_NEWS_IDS.has(n.id));
  const filteredDisplayNews = rawNews.filter((n) => n.exibir_no_menu !== false);
  // Página Início: só comunicados publicados e ainda válidos
  const homeNews = filteredDisplayNews.filter((n) => {
    if (n.published === false) return false;
    if (n.expires_at) {
      const exp = new Date(n.expires_at).getTime();
      if (!isNaN(exp) && exp < Date.now()) return false;
    }
    return true;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Alertas':
      case 'Defesa Civil':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case 'Monitoramento':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'Prefeituras':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30';
      case 'Meteorologia':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (priority === 'alta') {
      return (
        <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
          <ShieldAlert className="w-3 h-3" />
          <span>Alta Prioridade</span>
        </span>
      );
    }
    return null;
  };

  // Filtered list by Category and Search Query
  const searchedNews = filteredDisplayNews.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' ||
      item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fonte && item.fonte.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleShare = (article: NewsItem) => {
    const link = article.link_original || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Modal Render Function (white background, journalistic design)
  const renderArticleModal = () => {
    if (!selectedArticle) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-900 font-sans">
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setSelectedArticle(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer z-20 transition-colors"
            title="Fechar notícia"
          >
            <X className="w-5 h-5" />
          </button>

          {/* EDITORIAL HEADER / BADGES */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${getCategoryBadge(
                selectedArticle.category
              )}`}
            >
              {selectedArticle.category}
            </span>

            {selectedArticle.manter_permanente && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                <Pin className="w-3 h-3 text-amber-600" />
                <span>Comunicado Permanente</span>
              </span>
            )}

            {getPriorityBadge(selectedArticle.prioridade)}
          </div>

          {/* HEADLINE */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug tracking-tight">
            {selectedArticle.title}
          </h2>

          {/* METADATA BAR */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-4 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-cyan-800">
                <User className="w-4 h-4 text-cyan-600" />
                {selectedArticle.fonte || selectedArticle.author || 'Defesa Civil'}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-slate-500">
                <Clock className="w-4 h-4 text-slate-400" />
                {selectedArticle.date}
              </span>
            </div>

            <button
              onClick={() => handleShare(selectedArticle)}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-800 hover:text-cyan-950 cursor-pointer bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg border border-cyan-200 transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>

          {/* FEATURED IMAGE */}
          {selectedArticle.image && (
            <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {/* ARTICLE BODY / JOURNALISTIC TEXT */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-slate-400" />
              <span>Resumo do Comunicado Oficial</span>
            </h4>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
              {selectedArticle.summary || selectedArticle.content}
            </p>
          </div>

          {/* FOOTER ACTIONS - ONLY HERE DISPLAYS REDIRECTION TO OFFICIAL SITE */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {selectedArticle.link_original ? (
              <a
                href={selectedArticle.link_original}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Acessar Fonte Oficial</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div />
            )}

            <button
              onClick={() => setSelectedArticle(null)}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-6 py-3 rounded-xl cursor-pointer transition-colors text-center"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // COMPACT WIDGET MODE (Dashboard Widget)
  // ==========================================
  if (!isFullPage) {
    return (
      <>
        <section className={`${SURFACE_A} ${SECTION_PAD} pt-12 pb-14 flex flex-col gap-[22px] min-w-0 overflow-hidden`}>
          {/* HEADER */}
          <div className="flex items-end gap-4 flex-wrap">
            <div className="leading-[1.2]">
              <div className="text-lg font-light">Notícias e</div>
              <div className="text-[26px] font-extrabold">Comunicados oficiais</div>
            </div>
            {onViewAllNews && (
              <button
                onClick={onViewAllNews}
                className="ml-auto text-sm font-bold text-[#7CC3E6] hover:underline whitespace-nowrap cursor-pointer"
              >
                Ver todas ›
              </button>
            )}
          </div>

          {/* NEWS CARDS (3 na página Início) */}
          {homeNews.length === 0 ? (
            <p className={`text-sm ${MUTED}`}>Nenhum comunicado oficial publicado no momento.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 min-w-0">
              {homeNews.slice(0, HOME_NEWS_LIMIT).map((item) => {
                const cat = NEWS_CATEGORY_COLORS[item.category] || { bg: '#D5E3EC', ink: '#27465C' };
                const source = item.fonte || item.author;
                return (
                  <article
                    key={item.id}
                    className="min-w-0 bg-[#353E49] border border-[#434C57] rounded-[10px] p-4 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="self-start text-[10px] font-extrabold tracking-[0.08em] uppercase px-2 py-1 rounded-[4px]"
                        style={{ backgroundColor: cat.bg, color: cat.ink }}
                      >
                        {item.category}
                      </span>
                      {item.manter_permanente && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#7A4F12] bg-[#F2DDB0] px-1.5 py-1 rounded-[4px]">
                          <Pin className="w-2.5 h-2.5" />
                          Permanente
                        </span>
                      )}
                    </div>

                    <h3 className="m-0 text-[15px] font-extrabold leading-[1.3]">{item.title}</h3>

                    {item.summary && (
                      <p className="m-0 text-[13px] leading-[1.45] text-[#CDD1D6]">{item.summary}</p>
                    )}

                    <div className="flex justify-between gap-2 text-[11px] mt-auto pt-1">
                      <span className={`${MUTED} whitespace-nowrap`}>{relativeTime(item.date)}</span>
                      {source && <span className="font-bold text-right">{source}</span>}
                    </div>

                    {item.link_original && (
                      <a
                        href={item.link_original}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-center p-[9px] rounded-md bg-[#35566B] hover:bg-[#42708C] text-white text-[13px] font-bold transition-colors"
                      >
                        Saber mais ›
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </>
    );
  }

  // ==========================================
  // FULL PAGE MODE: PORTAL DE NOTÍCIAS
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* HEADER DA PÁGINA DE NOTÍCIAS */}
      <div className="dark:bg-[#0F172A] bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-2.5">
              <Newspaper className="w-6 h-6 text-cyan-500" />
              <span>Notícias e Comunicados Oficiais</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Agregador em tempo real de informações oficiais da Defesa Civil, Prefeituras e órgãos reguladores do Vale do Taquari.
            </p>
          </div>

          {/* BARRA DE PESQUISA */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título, resumo ou fonte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-[#182238] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* CATEGORIAS */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Todas as Notícias' },
            { id: 'Defesa Civil', label: 'Defesa Civil' },
            { id: 'Prefeituras', label: 'Prefeituras' },
            { id: 'Monitoramento', label: 'Monitoramento' },
            { id: 'Meteorologia', label: 'Meteorologia' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-100 dark:bg-[#182238] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE NOTÍCIAS */}
      {searchedNews.length === 0 ? (
        <div className="dark:bg-[#0F172A] bg-white border dark:border-slate-800 border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma notícia encontrada para os critérios selecionados.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            Limpar filtros de busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {searchedNews.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedArticle(item)}
              className="dark:bg-[#0F172A] bg-white border dark:border-slate-800 border-slate-200 hover:border-cyan-500 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-lg transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                {item.image && (
                  <div className="relative overflow-hidden rounded-xl mb-3 h-40">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider backdrop-blur-md shadow ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 truncate max-w-[140px]">
                    {item.fonte || item.author}
                  </span>
                  <span className="font-mono">{item.date}</span>
                </div>

                <h3 className="text-sm font-bold dark:text-white text-slate-900 leading-snug mb-2 group-hover:text-cyan-500 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs dark:text-slate-400 text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                  Fonte Oficial
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArticle(item);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer text-xs font-bold"
                >
                  <span>Saber mais</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL READ ARTICLE MODAL */}
      {renderArticleModal()}
    </div>
  );
};
