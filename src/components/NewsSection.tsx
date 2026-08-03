import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Radio,
  Share2,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  ArrowLeft,
  Eye,
  Info,
  Building2,
  Filter
} from 'lucide-react';

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

  // Filter news that are allowed to be shown in the menu
  const rawNews = news && news.length > 0 ? news : INITIAL_NEWS;
  const filteredDisplayNews = rawNews.filter((n) => n.exibir_no_menu !== false);

  // Auto-select article from hash if present on mount (e.g. #noticia-1)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#noticia-')) {
      const articleId = window.location.hash.replace('#noticia-', '');
      const found = filteredDisplayNews.find((n) => String(n.id) === articleId);
      if (found) {
        setSelectedArticle(found);
      }
    }
  }, [news]);

  const handleOpenArticle = (item: NewsItem) => {
    setSelectedArticle(item);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', `#noticia-${item.id}`);
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#noticia-')) {
      try {
        window.history.pushState(null, '', window.location.pathname);
      } catch (e) {}
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Alertas':
      case 'Defesa Civil':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold';
      case 'Monitoramento':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold';
      case 'Prefeituras':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 font-bold';
      case 'Meteorologia':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold';
      default:
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 font-bold';
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

  // Separate permanent news & highlights
  const permanentNews = filteredDisplayNews.filter((item) => item.manter_permanente === true);
  const highPriorityNews = filteredDisplayNews.filter((item) => item.prioridade === 'alta');

  // Primary highlight article
  const mainHighlight = highPriorityNews.length > 0 ? highPriorityNews[0] : filteredDisplayNews[0];
  const secondaryHighlights = filteredDisplayNews
    .filter((item) => item.id !== mainHighlight?.id)
    .slice(0, 2);

  const handleShare = (article: NewsItem) => {
    const link = article.link_original || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // ==========================================
  // COMPACT WIDGET MODE (Dashboard Home Widget)
  // ==========================================
  if (!isFullPage) {
    return (
      <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-5 lg:p-6 shadow-2xl transition-colors">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>NOTÍCIAS E COMUNICADOS OFICIAIS</span>
          </h3>

          <button
            onClick={onViewAllNews}
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Central de Notícias</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* NEWS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredDisplayNews.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenArticle(item)}
              className="dark:bg-[#182238] bg-slate-50 dark:border-slate-800/80 border-slate-200 dark:hover:border-cyan-800/60 hover:border-cyan-400 border rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadge(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>

                  {item.manter_permanente && (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold dark:text-white text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-cyan-500 transition-colors">
                  {item.title}
                </h4>

                <p className="text-[11px] dark:text-slate-400 text-slate-600 line-clamp-3 leading-relaxed mb-3">
                  {item.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] font-mono dark:text-slate-400 text-slate-500 pt-2 dark:border-slate-800 border-slate-200 border-t mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.date}</span>
                  </span>
                  {item.fonte && (
                    <span className="truncate max-w-[120px] font-sans font-bold dark:text-cyan-400 text-cyan-700">
                      {item.fonte}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenArticle(item);
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-800 text-[10px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-cyan-500" />
                    <span>Ver notícia</span>
                  </button>

                  <a
                    href={item.link_original || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!item.link_original) {
                        e.preventDefault();
                        handleOpenArticle(item);
                      }
                    }}
                    className="w-full bg-cyan-600/10 hover:bg-cyan-600 text-cyan-700 dark:text-cyan-300 hover:text-white text-[10px] font-bold py-1.5 px-2 rounded-xl border border-cyan-500/30 flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                  >
                    <span>Fonte oficial</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL PAGE MODE: PORTAL PROFISSIONAL DE NOTÍCIAS
  // ==========================================

  // ------------------------------------------
  // PÁGINA INDIVIDUAL DA NOTÍCIA (DETAILED VIEW)
  // ------------------------------------------
  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
        {/* NAVEGAÇÃO DE VOLTAR */}
        <button
          onClick={handleCloseArticle}
          className="inline-flex items-center gap-2 text-xs font-bold dark:text-cyan-400 text-cyan-700 hover:text-cyan-500 bg-white dark:bg-[#0F172A] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Central de Notícias</span>
        </button>

        {/* CONTAINER DA PÁGINA INDIVIDUAL DA NOTÍCIA (FUNDO BRANCO LIMPO) */}
        <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          
          {/* AVISO INSTITUCIONAL DE AGREGADOR OFICIAL */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-cyan-950">
            <Radio className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-cyan-900 block">
                Agregador Oficial de Informações do Vale do Taquari
              </span>
              <p className="text-cyan-800 leading-relaxed">
                Esta informação foi publicada originalmente pela fonte oficial. O Portal Monitoramento Taquari exibe o resumo visual para consulta rápida da população e direciona para o conteúdo oficial mantido pela instituição.
              </p>
            </div>
          </div>

          {/* BADGES & CRITICIDADE */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${getCategoryBadge(
                selectedArticle.category
              )}`}
            >
              {selectedArticle.category}
            </span>

            {selectedArticle.manter_permanente && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-md uppercase">
                <Pin className="w-3.5 h-3.5 text-amber-600" />
                <span>Comunicado Permanente</span>
              </span>
            )}

            {getPriorityBadge(selectedArticle.prioridade)}
          </div>

          {/* TÍTULO DA NOTÍCIA */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {selectedArticle.title}
          </h1>

          {/* METADADOS DA FONTE E DATA */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pb-5 border-b border-slate-200 gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-lg border border-cyan-100">
                <Building2 className="w-4 h-4 text-cyan-600" />
                <span>Fonte Oficial: {selectedArticle.fonte || selectedArticle.author}</span>
              </span>

              <span className="flex items-center gap-1.5 font-mono text-slate-500">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Publicado {selectedArticle.date}</span>
              </span>
            </div>

            <button
              onClick={() => handleShare(selectedArticle)}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>

          {/* IMAGEM EM DESTAQUE */}
          {selectedArticle.image && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full max-h-[420px] object-cover"
              />
            </div>
          )}

          {/* RESUMO DA PUBLICAÇÃO (FUNDO BRANCO LIMPO) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resumo da Publicação Oficial:
            </h3>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-base leading-relaxed font-sans space-y-3">
              <p className="font-medium">
                {selectedArticle.summary || selectedArticle.content}
              </p>
            </div>
          </div>

          {/* AVISO LEGAL DE DIRECIOMENTO */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Para ler o artigo completo ou acessar anexos oficiais, consulte diretamente o portal da instituição responsável.
              </span>
            </div>
          </div>

          {/* BOTÃO PRINCIPAL DE AÇÃO DE DIRECIOMENTO PARA FONTE OFICIAL */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            {selectedArticle.link_original ? (
              <a
                href={selectedArticle.link_original}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 cursor-pointer"
              >
                <span>Leia a publicação completa no site oficial</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="text-xs text-slate-500 italic">Link original indisponível</div>
            )}

            <button
              onClick={handleCloseArticle}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-6 py-3.5 rounded-2xl cursor-pointer transition-colors text-center"
            >
              Voltar para a lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // LISTA E ESTRUTURA COMPLETA DO PORTAL DE NOTÍCIAS
  // ------------------------------------------
  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* PORTAL HERO HEADER */}
      <div className="relative overflow-hidden dark:bg-gradient-to-br dark:from-[#0F172A] dark:to-[#182238] bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-cyan-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Central Oficial de Informações do Vale do Taquari</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Notícias, Boletins e Comunicados Oficiais
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Agregador oficial em tempo real. Consulte comunicados, boletins de emergência e avisos da Defesa Civil RS, Prefeituras Municipais, CPRM, SPH e órgãos governamentais no Vale do Taquari.
          </p>

          {/* SEARCH & CATEGORY SELECTOR */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notícias, avisos da Defesa Civil ou prefeituras..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono text-right sm:text-left self-center">
              {searchedNews.length} publicações encontradas
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'all', label: 'Todas as Notícias' },
          { id: 'Alertas', label: '🔴 Alertas' },
          { id: 'Monitoramento', label: '🟠 Monitoramento' },
          { id: 'Comunicados', label: '🔵 Comunicados' },
          { id: 'Meteorologia', label: '🟢 Meteorologia' },
          { id: 'Defesa Civil', label: 'Defesa Civil' },
          { id: 'Prefeituras', label: 'Prefeituras' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/50'
                : 'dark:bg-[#0F172A] bg-white dark:border-slate-800 border-slate-200 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* SEÇÃO 1: ÁREA DE DESTAQUES */}
      {mainHighlight && activeCategory === 'all' && !searchQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-3">
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Destaques Principais</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CARD DESTACADO PRINCIPAL (60% width) */}
            <div
              onClick={() => handleOpenArticle(mainHighlight)}
              className="lg:col-span-7 dark:bg-[#0F172A] bg-white dark:border-slate-800 border-slate-200 hover:border-cyan-500 border rounded-3xl p-5 sm:p-6 cursor-pointer shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl mb-4 h-64 sm:h-72">
                  <img
                    src={mainHighlight.image}
                    alt={mainHighlight.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider backdrop-blur-md shadow-md ${getCategoryBadge(
                        mainHighlight.category
                      )}`}
                    >
                      {mainHighlight.category}
                    </span>
                    {getPriorityBadge(mainHighlight.prioridade)}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    {mainHighlight.fonte || mainHighlight.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {mainHighlight.date}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold dark:text-white text-slate-900 leading-snug mb-3 group-hover:text-cyan-500 transition-colors">
                  {mainHighlight.title}
                </h3>

                <p className="text-xs sm:text-sm dark:text-slate-300 text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {mainHighlight.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800 border-slate-100 text-xs font-bold text-cyan-600 dark:text-cyan-400 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenArticle(mainHighlight);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver notícia</span>
                </button>

                {mainHighlight.link_original && (
                  <a
                    href={mainHighlight.link_original}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs border border-slate-300 dark:border-slate-700"
                  >
                    <span>Fonte oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* CARDS SECUNDÁRIOS EM DESTAQUE (40% width) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {secondaryHighlights.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenArticle(item)}
                  className="dark:bg-[#0F172A] bg-white dark:border-slate-800 border-slate-200 hover:border-cyan-500 border rounded-2xl p-4 cursor-pointer shadow-lg transition-all hover:-translate-y-0.5 flex items-start gap-4 group flex-1"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl shrink-0 border dark:border-slate-800 border-slate-100"
                  />
                  <div className="flex flex-col justify-between h-full space-y-1 w-full">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider mb-1 ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold dark:text-white text-slate-900 line-clamp-2 leading-snug group-hover:text-cyan-500 transition-colors">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                      <span>{item.date}</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold font-sans flex items-center gap-0.5">
                        <span>Ver resumo</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* CANAIS ÚTEIS DE EMERGÊNCIA */}
              <div className="dark:bg-amber-950/30 bg-amber-50 border border-amber-500/30 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Canais Úteis de Emergência</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  Em caso de risco de alagamento ou inundação, entre em contato imediatamente:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold dark:text-amber-300 text-amber-800 pt-1">
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
                    Defesa Civil RS: 199
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
                    Corpo de Bombeiros: 193
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: NOTÍCIAS IMPORTANTES / COMUNICADOS PERMANENTES */}
      {permanentNews.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-3">
            <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500" />
              <span>Notícias Importantes & Orientação Preventiva</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permanentNews.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenArticle(item)}
                className="dark:bg-[#0F172A] bg-amber-50/50 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-lg transition-all hover:border-amber-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      <Pin className="w-3 h-3" />
                      <span>Permanente</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold dark:text-white text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs dark:text-slate-300 text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t dark:border-slate-800 border-amber-200 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    Fonte: {item.fonte || item.author}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenArticle(item);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow cursor-pointer text-xs font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver notícia</span>
                    </button>

                    {item.link_original && (
                      <a
                        href={item.link_original}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all text-xs font-bold border border-slate-300 dark:border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: ÁREA DE ÚLTIMAS NOTÍCIAS (CARDS COM FUNDO BRANCO ORGANIZADOS) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b dark:border-slate-800 border-slate-200 pb-3">
          <h2 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-500" />
            <span>Últimas Notícias e Publicações ({searchedNews.length})</span>
          </h2>
        </div>

        {searchedNews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              Nenhuma notícia encontrada para os critérios selecionados.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-700 font-bold hover:underline cursor-pointer"
            >
              Limpar filtros de busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchedNews.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenArticle(item)}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-cyan-500 rounded-2xl p-4 sm:p-5 cursor-pointer shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative overflow-hidden rounded-xl mb-3 h-44">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider backdrop-blur-md shadow-md ${getCategoryBadge(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 truncate max-w-[150px]">
                      {item.fonte || item.author}
                    </span>
                    <span className="font-mono text-[10px]">{item.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenArticle(item);
                    }}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver notícia</span>
                  </button>

                  {item.link_original && (
                    <a
                      href={item.link_original}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 p-2 rounded-xl flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700"
                      title="Acessar fonte oficial"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
