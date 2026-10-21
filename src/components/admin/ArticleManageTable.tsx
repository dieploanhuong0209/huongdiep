import React, { useState } from 'react';
import { Article } from '../../types/portfolio';
import {
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Search,
  Check,
  X,
} from 'lucide-react';
import { formatBrandAndTitle } from '../../services/fetchArticleMetadata';

interface ArticleManageTableProps {
  articles: Article[];
  categories: string[];
  formats: string[];
  onUpdateArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onReorderArticles: (articles: Article[]) => void;
}

export const ArticleManageTable: React.FC<ArticleManageTableProps> = ({
  articles,
  categories,
  formats,
  onUpdateArticle,
  onDeleteArticle,
  onReorderArticles,
}) => {
  const [search, setSearch] = useState('');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered list
  const filtered = articles.filter((a) => {
    const dateStr = a.date || (a.year ? a.year.toString() : '');
    return (
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.format.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      dateStr.toLowerCase().includes(search)
    );
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newArticles = [...articles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newArticles.length) return;

    const temp = newArticles[index];
    newArticles[index] = newArticles[targetIndex];
    newArticles[targetIndex] = temp;
    onReorderArticles(newArticles);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    const finalTitle = editingArticle.title.trim().replace(/\s*—\s*/g, ' | ');
    onUpdateArticle({
      ...editingArticle,
      title: finalTitle,
    });
    setEditingArticle(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Lọc theo tiêu đề, ngày, format..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-sm focus:outline-hidden focus:border-stone-900 font-be-vietnam"
          />
        </div>
        <span className="font-editorial-mono text-xs text-stone-500 self-end sm:self-center">
          Tổng cộng: {articles.length} bài viết
        </span>
      </div>

      {/* Articles Table */}
      <div className="border border-stone-200 rounded-sm overflow-hidden bg-white">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10 font-editorial-mono text-[11px] text-stone-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-14">Thứ tự</th>
                <th className="py-2.5 px-3 w-20">MM/YYYY</th>
                <th className="py-2.5 px-3">Tiêu đề bài viết & Nền tảng</th>
                <th className="py-2.5 px-3 w-32">Định dạng</th>
                <th className="py-2.5 px-3 w-36">Chuyên mục</th>
                <th className="py-2.5 px-3 w-24 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((article) => {
                const originalIndex = articles.findIndex((a) => a.id === article.id);
                const displayDate = article.date || (article.year ? `01/${article.year}` : '01/2026');
                const displayTitle = formatBrandAndTitle(
                  article.brand || article.publisher || 'Thương hiệu',
                  article.title
                );

                return (
                  <tr key={article.id} className="hover:bg-stone-50/70 transition-colors">
                    {/* Reorder Up/Down */}
                    <td className="py-2.5 px-3 text-stone-400">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMove(originalIndex, 'up')}
                          disabled={originalIndex === 0}
                          className="p-1 hover:text-stone-900 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMove(originalIndex, 'down')}
                          disabled={originalIndex === articles.length - 1}
                          className="p-1 hover:text-stone-900 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Date MM/YYYY */}
                    <td className="py-2.5 px-3 font-editorial-mono text-stone-500 tabular-nums">
                      {displayDate}
                    </td>

                    {/* Title & Platform */}
                    <td className="py-2.5 px-3">
                      <div className="font-be-vietnam font-medium text-stone-900 leading-snug line-clamp-1">
                        {displayTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {article.publisher && (
                          <span className="text-[11px] font-editorial-mono text-stone-500">
                            [{article.publisher}]
                          </span>
                        )}
                        {article.url && (
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 truncate max-w-xs font-editorial-mono hover:underline"
                          >
                            <span className="truncate">{article.url}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Format */}
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-700 font-editorial-mono text-[11px] rounded-xs">
                        {article.format}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 text-stone-600 truncate max-w-[150px]">
                      {article.category}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      {confirmDeleteId === article.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              onDeleteArticle(article.id);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Xác nhận xóa"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 text-stone-400 hover:bg-stone-100 rounded cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingArticle(article)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer transition-colors"
                            title="Chỉnh sửa bài viết"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(article.id)}
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 font-editorial-mono">
                    Không tìm thấy bài viết nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Article Modal */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-sm w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-editorial-serif italic text-xl text-stone-900">
                Chỉnh sửa bài viết
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                  Tiêu đề bài viết (Dùng dấu gạch dọc |)
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-be-vietnam"
                />
              </div>

              <div>
                <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                  Link bài viết (URL)
                </label>
                <input
                  type="url"
                  required
                  value={editingArticle.url}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                    Định dạng
                  </label>
                  <input
                    type="text"
                    required
                    list="format-options"
                    value={editingArticle.format}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, format: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-mono"
                  />
                  <datalist id="format-options">
                    {formats.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                    Chuyên mục
                  </label>
                  <input
                    type="text"
                    required
                    list="category-options"
                    value={editingArticle.category}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-sans"
                  />
                  <datalist id="category-options">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                    Thời gian xuất bản (MM/YYYY)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YYYY"
                    value={editingArticle.date || (editingArticle.year ? `01/${editingArticle.year}` : '01/2026')}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-mono"
                  />
                </div>
                <div>
                  <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                    Tên báo / Nền tảng
                  </label>
                  <input
                    type="text"
                    value={editingArticle.publisher || ''}
                    onChange={(e) =>
                      setEditingArticle({ ...editingArticle, publisher: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-be-vietnam"
                  />
                </div>
              </div>

              <div>
                <label className="block font-editorial-mono uppercase tracking-wider text-stone-600 mb-1">
                  Tóm tắt / Mô tả
                </label>
                <textarea
                  rows={2}
                  value={editingArticle.summary || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-be-vietnam"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-stone-100 hover:bg-stone-800 rounded-sm cursor-pointer font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
