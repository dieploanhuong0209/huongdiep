import React from 'react';

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
}

const getCategoryLabel = (category: string): string =>
  category.trim().toLocaleLowerCase('vi') === 'bất động sản' ? 'Real Estate' : category;

const isOthersCategory = (category: string): boolean =>
  category.trim().toLowerCase() === 'others';

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
}) => {
  // Sort by number of articles, preserving the original order when counts tie.
  // "Others" always stays at the end, regardless of how many articles it has.
  const sortedCategories = categories
    .map((category, originalIndex) => ({
      category,
      count: categoryCounts[category] || 0,
      originalIndex,
    }))
    .sort((a, b) => {
      if (isOthersCategory(a.category) !== isOthersCategory(b.category)) {
        return isOthersCategory(a.category) ? 1 : -1;
      }
      return b.count - a.count || a.originalIndex - b.originalIndex;
    });

  return (
    <nav className="pt-8 pb-4 border-b border-stone-200/80">
      <div className="flex flex-wrap items-baseline gap-x-6 sm:gap-x-7 gap-y-3 font-editorial-mono text-xs sm:text-[13px]">
        {/* "All" always appears first. */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`relative pb-1 transition-colors whitespace-nowrap cursor-pointer text-left ${
            selectedCategory === null
              ? 'text-stone-950 font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>All</span>{' '}
          <span className="text-stone-500 font-normal">({totalCount})</span>
          {selectedCategory === null && (
            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-stone-900" />
          )}
        </button>

        {sortedCategories.map(({ category, count }) => {
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`relative pb-1 transition-colors whitespace-nowrap cursor-pointer text-left ${
                isSelected
                  ? 'text-stone-950 font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>{getCategoryLabel(category)}</span>{' '}
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
