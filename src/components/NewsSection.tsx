import React, { useState } from 'react';
import { NewsItem } from '../types';
import { Newspaper, ChevronRight, Clock, User, X } from 'lucide-react';

interface NewsSectionProps {
  news: NewsItem[];
  onViewAllNews?: () => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news, onViewAllNews }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Defesa Civil':
        return 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40';
      case 'Prefeituras':
        return 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="dark:bg-[#0F172A]/90 bg-white dark:border-slate-800 border-slate-200 rounded-3xl p-5 lg:p-6 shadow-2xl transition-colors">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold dark:text-slate-300 text-slate-700 tracking-wider uppercase flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>NOTÍCIAS E COMUNICADOS</span>
        </h3>

        <button
          onClick={onViewAllNews}
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Ver todas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* NEWS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {news.slice(0, 3).map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="dark:bg-[#182238] bg-slate-50 dark:border-slate-800/80 border-slate-200 dark:hover:border-cyan-800/60 hover:border-cyan-400 border rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider mb-2.5 ${getCategoryBadge(item.category)}`}>
                {item.category}
              </span>

              <h4 className="text-xs font-bold dark:text-white text-slate-900 line-clamp-2 leading-snug mb-2">
                {item.title}
              </h4>

              <p className="text-[11px] dark:text-slate-400 text-slate-600 line-clamp-3 leading-relaxed mb-3">
                {item.summary}
              </p>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono dark:text-slate-400 text-slate-500 pt-2 dark:border-slate-800 border-slate-200 border-t">
              <Clock className="w-3 h-3" />
              <span>{item.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* READ ARTICLE MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dark:bg-[#0F172A] bg-white dark:border-slate-700 border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:bg-slate-800/80 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider mb-3 ${getCategoryBadge(selectedArticle.category)}`}>
              {selectedArticle.category}
            </span>

            <h3 className="text-lg font-bold dark:text-white text-slate-900 mb-2">
              {selectedArticle.title}
            </h3>

            <div className="flex items-center gap-4 text-xs dark:text-slate-400 text-slate-500 mb-4 pb-3 dark:border-slate-800 border-slate-200 border-b">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {selectedArticle.author}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {selectedArticle.date}
              </span>
            </div>

            {selectedArticle.image && (
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-48 object-cover rounded-2xl mb-4 border dark:border-slate-800 border-slate-200"
              />
            )}

            <p className="text-xs dark:text-slate-300 text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {selectedArticle.content || selectedArticle.summary}
            </p>

            <div className="mt-6 pt-4 dark:border-slate-800 border-slate-200 border-t flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="dark:bg-slate-800 bg-slate-100 dark:hover:bg-slate-700 hover:bg-slate-200 dark:text-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
