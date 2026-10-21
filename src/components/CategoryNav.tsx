import React from 'react';

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  return (
    <nav className="pt-8 pb-4 border-b border-stone-200/80">
      <div className="flex flex-wrap items-baseline gap-x-6 sm:gap-x-7 gap-y-3 font-editorial-mono text-xs sm:text-[13px]">
        {/* "Tất cả" option */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`relative pb-1 transition-colors whitespace-nowrap cursor-pointer text-left ${
            selectedCategory === null
              ? 'text-stone-950 font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Tất cả</span>{' '}
          <span className="text-stone-500 font-normal">({totalCount})</span>
          {selectedCategory === null && (
            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-stone-900" />
          )}
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const count = categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`relative pb-1 transition-colors whitespace-nowrap cursor-pointer text-left ${
                isSelected
                  ? 'text-stone-950 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>{cat}</span>{' '}
              <span className="text-stone-500 font-normal">({count})</span>
              {isSelected && (
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-stone-900" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
