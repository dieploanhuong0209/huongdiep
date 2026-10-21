import React, { useState } from 'react';
import { Article } from '../types/portfolio';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { formatBrandAndTitle } from '../services/fetchArticleMetadata';

interface ArticleListProps {
  articles: Article[];
  selectedCategory: string | null;
  allFormats: string[];
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedCategory,
  allFormats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Filter articles based on search query and optional format filter
  const filteredArticles = articles.filter((art) => {
    if (selectedFormat && art.format !== selectedFormat) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const dateStr = art.date || (art.year ? art.year.toString() : '');
    return (
      art.title.toLowerCase().includes(query) ||
      art.format.toLowerCase().includes(query) ||
      art.category.toLowerCase().includes(query) ||
      dateStr.toLowerCase().includes(query) ||
      (art.publisher && art.publisher.toLowerCase().includes(query)) ||
      (art.summary && art.summary.toLowerCase().includes(query))
    );
  });

  return (
    <div className="pt-8 pb-20">
      {/* Sub-header row: LATEST on left, Article count on right, with optional search toggle */}
      <div className="flex items-center justify-between pb-6 border-b border-stone-200/80 font-editorial-mono text-xs tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="font-medium text-stone-600">LATEST</span>
          {selectedCategory && (
            <span className="text-stone-400 font-normal">/ {selectedCategory}</span>
          )}
          {selectedFormat && (
            <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px] normal-case">
              {selectedFormat}
              <button
                onClick={() => setSelectedFormat(null)}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1 hover:text-stone-900 transition-colors cursor-pointer capitalize"
            title="Tìm kiếm bài viết"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </button>

          <span>
            {filteredArticles.length} bài viết
          </span>
        </div>
      </div>

      {/* Search Input Bar (Expandable) */}
      {showSearch && (
        <div className="py-4 border-b border-stone-200/60 flex items-center gap-3 animate-in fade-in duration-200">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, thương hiệu, thời gian (MM/YYYY) hoặc định dạng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-stone-800 placeholder-stone-400 text-sm focus:outline-hidden font-be-vietnam"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Article rows */}
      {filteredArticles.length > 0 ? (
        <div className="divide-y divide-stone-200/60">
          {filteredArticles.map((article) => {
            const hasValidLink = Boolean(article.url && article.url.trim() !== '');
            const displayDate = article.date || (article.year ? `01/${article.year}` : '01/2026');
            // Bắt buộc format: “Thương hiệu | Tiêu đề bài viết”
            const displayTitle = formatBrandAndTitle(
              article.brand || article.publisher || 'Thương hiệu',
              article.title
            );

            return (
              <article
                key={article.id}
                className="group py-5 transition-colors duration-150 hover:bg-stone-100/40 -mx-3 px-3 rounded-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-6">
                  {/* Left: Date (MM/YYYY) & Title in Be Vietnam Pro font */}
                  <div className="flex items-baseline gap-4 sm:gap-6 min-w-0 flex-1">
                    {/* Time MM/YYYY */}
                    <span className="font-editorial-mono text-xs text-stone-500 select-none shrink-0 w-16 sm:w-18 tabular-nums">
                      {displayDate}
                    </span>

                    {/* Title in Be Vietnam Pro without underline on hover, with font-semibold / italic */}
                    <div className="min-w-0 flex-1">
                      {hasValidLink ? (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-be-vietnam text-[15px] sm:text-base text-stone-900 group-hover:text-black group-hover:font-semibold group-hover:italic font-normal leading-relaxed block no-underline transition-all duration-150"
                          title={`Mở liên kết: ${article.url}`}
                        >
                          {displayTitle}
                        </a>
                      ) : (
                        <span className="font-be-vietnam text-[15px] sm:text-base text-stone-900 font-normal leading-relaxed block">
                          {displayTitle}
                        </span>
                      )}

                      {/* Optional publisher note if present */}
                      {article.publisher && (
                        <p className="text-xs text-stone-600 mt-0.5 font-editorial-mono">
                          {article.publisher}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Format tag + Arrow link */}
                  <div className="flex items-center justify-end shrink-0 pl-20 sm:pl-0">
                    {hasValidLink ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-editorial-mono text-xs text-stone-700 group-hover:text-stone-950 transition-colors py-0.5 whitespace-nowrap no-underline"
                      >
                        <span>{article.format}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    ) : (
                      <span className="font-editorial-mono text-xs text-stone-700 py-0.5 whitespace-nowrap">
                        {article.format}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Minimal Empty State */
        <div className="py-20 text-center">
          <p className="font-editorial-mono text-xs text-stone-400">
            Không tìm thấy bài viết nào phù hợp.
          </p>
        </div>
      )}
    </div>
  );
};
