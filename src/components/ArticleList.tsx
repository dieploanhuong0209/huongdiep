import React, { useEffect, useRef, useState } from 'react';
import { Article } from '../types/portfolio';
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { formatBrandAndTitle } from '../services/fetchArticleMetadata';

interface ArticleListProps {
  articles: Article[];
  selectedCategory: string | null;
  allFormats: string[];
}

const PAGE_SIZE = 10;

// Dates stored in the portfolio may be DD/MM/YYYY, MM/YYYY, YYYY-MM-DD or YYYY.
// Missing or invalid dates are placed after dated articles.
const getPublicationTimestamp = (article: Article): number => {
  const value = (article.date || '').trim();
  let year: number | undefined;
  let month = 1;
  let day = 1;

  const slashParts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const monthYear = value.match(/^(\d{1,2})\/(\d{4})$/);
  const isoDate = value.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  const yearOnly = value.match(/^(\d{4})$/);

  if (slashParts) {
    day = Number(slashParts[1]);
    month = Number(slashParts[2]);
    year = Number(slashParts[3]);
  } else if (monthYear) {
    month = Number(monthYear[1]);
    year = Number(monthYear[2]);
  } else if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]);
    day = Number(isoDate[3] || 1);
  } else if (yearOnly) {
    year = Number(yearOnly[1]);
  } else if (!value && article.year) {
    year = Number(article.year);
  }

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return -Infinity;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return -Infinity;
  }
  return date.getTime();
};

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  selectedCategory,
  allFormats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory]);

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
  }).sort((a, b) => {
    const aDate = getPublicationTimestamp(a);
    const bDate = getPublicationTimestamp(b);
    if (aDate === bDate) return 0;
    return bDate > aDate ? 1 : -1;
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleArticles = filteredArticles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1);

  const goToPage = (target: number) => {
    const next = Math.max(1, Math.min(totalPages, target));
    if (next === currentPage) return;
    setPage(next);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={listRef} className="pt-8 pb-20 scroll-mt-6">
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
                onClick={() => { setSelectedFormat(null); setPage(1); }}
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
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            autoFocus
            className="w-full bg-transparent border-none text-stone-800 placeholder-stone-400 text-sm focus:outline-hidden font-be-vietnam"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setPage(1); }}
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
          {visibleArticles.map((article) => {
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
      {filteredArticles.length > PAGE_SIZE && (
        <nav aria-label="Phân trang bài viết" className="flex flex-wrap items-center justify-center gap-1.5 pt-8 font-editorial-mono text-xs">
          <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            aria-label="Trang trước" className="inline-flex h-9 w-9 items-center justify-center border border-stone-200 text-stone-600 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((n, index) => (
            <React.Fragment key={n}>
              {index > 0 && n - pageNumbers[index - 1] > 1 && (
                <span aria-hidden="true" className="px-1 text-stone-400">…</span>
              )}
              <button type="button" onClick={() => goToPage(n)}
                aria-label={`Trang ${n}`} aria-current={currentPage === n ? 'page' : undefined}
                className={`h-9 min-w-9 px-2 rounded-sm border transition-colors ${currentPage === n
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-500 hover:text-stone-900'}`}>
                {n}
              </button>
            </React.Fragment>
          ))}
          <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
            aria-label="Trang sau" className="inline-flex h-9 w-9 items-center justify-center border border-stone-200 text-stone-600 hover:border-stone-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
