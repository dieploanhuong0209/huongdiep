import React, { useState, useMemo } from 'react';
import { PortfolioData } from '../types/portfolio';
import { Header } from '../components/Header';
import { CategoryNav } from '../components/CategoryNav';
import { ArticleList } from '../components/ArticleList';

interface PortfolioPageProps {
  data: PortfolioData;
  categoryCounts: Record<string, number>;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ data, categoryCounts }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Articles filtered by active category
  const displayedArticles = useMemo(() => {
    if (!selectedCategory) return data.articles;
    return data.articles.filter((art) => art.category === selectedCategory);
  }, [data.articles, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#1c1917] selection:bg-stone-200 selection:text-black">
      {/* Main Container - Minimalist Editorial Width */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Header (Author name, title, public contact links only) */}
        <Header profile={data.profile} />

        {/* Categories Bar */}
        <CategoryNav
          categories={data.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
          totalCount={data.articles.length}
        />

        {/* Article Rows List */}
        <ArticleList
          articles={displayedArticles}
          selectedCategory={selectedCategory}
          allFormats={data.formats}
        />

        {/* Minimal Editorial Footer (Strictly public, no admin mentions) */}
        <footer className="pt-8 pb-16 border-t border-stone-200/60 font-editorial-mono text-xs text-stone-600">
          <p>© {new Date().getFullYear()} {data.profile.name || 'Hương Diệp'}. All works reserved.</p>
        </footer>
      </div>
    </div>
  );
};
