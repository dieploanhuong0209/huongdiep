import React, { useState } from 'react';
import { Plus, Trash2, Tag, Layers, Check } from 'lucide-react';

interface CategoryFormatEditorProps {
  categories: string[];
  formats: string[];
  onUpdateCategories: (categories: string[]) => void;
  onUpdateFormats: (formats: string[]) => void;
  categoryCounts: Record<string, number>;
  formatCounts: Record<string, number>;
}

export const CategoryFormatEditor: React.FC<CategoryFormatEditorProps> = ({
  categories,
  formats,
  onUpdateCategories,
  onUpdateFormats,
  categoryCounts,
  formatCounts,
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [newFormat, setNewFormat] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onUpdateCategories([...categories, trimmed]);
    setNewCategory('');
  };

  const handleDeleteCategory = (cat: string) => {
    onUpdateCategories(categories.filter((c) => c !== cat));
  };

  const handleAddFormat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFormat.trim();
    if (!trimmed || formats.includes(trimmed)) return;
    onUpdateFormats([...formats, trimmed]);
    setNewFormat('');
  };

  const handleDeleteFormat = (fmt: string) => {
    onUpdateFormats(formats.filter((f) => f !== fmt));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
      {/* 1. Categories Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
          <Layers className="w-4 h-4 text-stone-600" />
          <h3 className="font-editorial-mono uppercase tracking-wider text-stone-800 font-medium">
            Quản lý Chuyên mục (Categories)
          </h3>
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder="Tên chuyên mục mới..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-stone-900 text-stone-100 rounded-sm hover:bg-stone-800 cursor-pointer flex items-center gap-1 font-editorial-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>

        <div className="border border-stone-200 rounded-sm divide-y divide-stone-100 max-h-72 overflow-y-auto bg-stone-50/50">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
              <div
                key={cat}
                className="py-2.5 px-3 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-800">{cat}</span>
                  <span className="text-[11px] font-editorial-mono text-stone-400">
                    ({count} bài viết)
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  disabled={categories.length <= 1}
                  className="text-stone-400 hover:text-red-600 p-1 rounded cursor-pointer disabled:opacity-20"
                  title="Xóa chuyên mục"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Formats Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
          <Tag className="w-4 h-4 text-stone-600" />
          <h3 className="font-editorial-mono uppercase tracking-wider text-stone-800 font-medium">
            Quản lý Định dạng (Formats)
          </h3>
        </div>

        <form onSubmit={handleAddFormat} className="flex gap-2">
          <input
            type="text"
            placeholder="Tên định dạng mới..."
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value)}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-stone-900 text-stone-100 rounded-sm hover:bg-stone-800 cursor-pointer flex items-center gap-1 font-editorial-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>

        <div className="border border-stone-200 rounded-sm divide-y divide-stone-100 max-h-72 overflow-y-auto bg-stone-50/50">
          {formats.map((fmt) => {
            const count = formatCounts[fmt] || 0;
            return (
              <div
                key={fmt}
                className="py-2.5 px-3 flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-editorial-mono text-stone-800">{fmt}</span>
                  <span className="text-[11px] font-editorial-mono text-stone-400">
                    ({count} bài viết)
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteFormat(fmt)}
                  disabled={formats.length <= 1}
                  className="text-stone-400 hover:text-red-600 p-1 rounded cursor-pointer disabled:opacity-20"
                  title="Xóa định dạng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
