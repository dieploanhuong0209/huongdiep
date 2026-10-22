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
