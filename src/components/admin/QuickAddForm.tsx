import React, { useState, useRef } from 'react';
import { Article } from '../../types/portfolio';
import { parseUrlHints } from '../../services/storage';
import { fetchRealArticleMetadata, formatBrandAndTitle } from '../../services/fetchArticleMetadata';
import { Plus, Wand2, ArrowUpRight, Check, AlertCircle, Loader2 } from 'lucide-react';

interface QuickAddFormProps {
  categories: string[];
  formats: string[];
  onAddArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  onSuccessNotice?: (msg: string) => void;
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({
  categories,
  formats,
  onAddArticle,
  onSuccessNotice,
}) => {
  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const defaultDate = `${currentMonthStr}/${now.getFullYear()}`;

  const [url, setUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [headline, setHeadline] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('PR Series');
  const [customFormat, setCustomFormat] = useState('');
  const [isCustomFormat, setIsCustomFormat] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'Automotive');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [date, setDate] = useState(defaultDate);
  const [publisher, setPublisher] = useState('');
  const [summary, setSummary] = useState('');

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataSuccessMsg, setMetadataSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const fetchTimeoutRef = useRef<any>(null);

  // Computes the mandatory "Thương hiệu | Tiêu đề bài viết" format
  const computedDisplayTitle = () => {
    if (!brand.trim() && !headline.trim()) return '';
    return formatBrandAndTitle(brand.trim() || 'Thương hiệu', headline.trim() || 'Tiêu đề bài viết');
  };

  // Auto fetch real metadata when URL changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError(null);
    setMetadataSuccessMsg(null);

    const trimmed = newUrl.trim();
    if (trimmed.length > 10 && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.vn') || trimmed.includes('.com') || trimmed.includes('/'))) {
      const hints = parseUrlHints(trimmed);
      if (hints.publisher) {
        setPublisher(hints.publisher);
      }

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        triggerRealMetadataFetch(trimmed);
      }, 400);
    }
  };

  const triggerRealMetadataFetch = async (targetUrl: string) => {
    if (!targetUrl || targetUrl.trim().length < 8) return;
    setIsLoadingMetadata(true);
    setMetadataSuccessMsg(null);

    try {
      const data = await fetchRealArticleMetadata(targetUrl);
      if (data.headline || data.title) {
        setHeadline(data.headline || data.title || '');
      }
      if (data.brand) {
        setBrand(data.brand);
      }
      if (data.publisher) {
        setPublisher(data.publisher);
      }
      if (data.date) {
        setDate(data.date);
      }
      if (data.category && categories.includes(data.category)) {
        setSelectedCategory(data.category);
      }
      if (data.format && formats.includes(data.format)) {
        setSelectedFormat(data.format);
      }
      if (data.summary && !summary) {
        setSummary(data.summary);
      }

      if (data.aiScanned) {
        setMetadataSuccessMsg('✨ AI đã quét toàn bộ bài viết: Tự động điền Tiêu đề thật, Ngày xuất bản và Nhãn hàng (Brand)!');
      } else {
        setMetadataSuccessMsg('Đã tự động lấy tiêu đề thật & thương hiệu từ bài viết!');
      }
    } catch (err) {
      console.warn('Could not auto-fetch metadata', err);
    } finally {
      setIsLoadingMetadata(false);
      setTimeout(() => {
        setMetadataSuccessMsg(null);
      }, 5000);
    }
  };

  const handleManualFetch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Vui lòng nhập đường link bài viết trước');
      return;
    }
    triggerRealMetadataFetch(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Vui lòng nhập Link bài viết');
      return;
    }
    if (!headline.trim()) {
      setError('Vui lòng nhập Tiêu đề bài viết');
      return;
    }

    const currentBrand = brand.trim() || publisher.trim() || 'Thương hiệu';
    // Bắt buộc chuẩn hóa định dạng: “Thương hiệu | Tiêu đề bài viết”
    const finalTitle = formatBrandAndTitle(currentBrand, headline.trim());

    let formattedDate = date.trim();
    if (!formattedDate) {
      formattedDate = defaultDate;
    }

    const finalFormat = (isCustomFormat ? customFormat.trim() : selectedFormat) || 'Editorial';
    const finalCategory = (isCustomCategory ? customCategory.trim() : selectedCategory) || 'General';

    if (!finalFormat) {
      setError('Vui lòng chọn hoặc nhập định dạng bài viết');
      return;
    }
    if (!finalCategory) {
      setError('Vui lòng chọn hoặc nhập chuyên mục bài viết');
      return;
    }

    onAddArticle({
      title: finalTitle,
      brand: currentBrand,
      url: url.trim(),
      format: finalFormat,
      category: finalCategory,
      date: formattedDate,
      publisher: publisher.trim() || undefined,
      summary: summary.trim() || undefined,
    });

    // Reset form
    setUrl('');
    setBrand('');
    setHeadline('');
    setPublisher('');
    setSummary('');
    setIsCustomFormat(false);
    setCustomFormat('');
    setIsCustomCategory(false);
    setCustomCategory('');
    setDate(defaultDate);
    setJustAdded(true);
    setError(null);
    setMetadataSuccessMsg(null);

    if (onSuccessNotice) {
      onSuccessNotice(`Đã thêm thành công: "${finalTitle}"`);
    }

    setTimeout(() => {
      setJustAdded(false);
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-sm font-sans">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {metadataSuccessMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm font-sans animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{metadataSuccessMsg}</span>
        </div>
      )}

      {justAdded && (
        <div className="flex items-center gap-2 p-3 text-xs bg-stone-900 text-stone-100 rounded-sm font-sans animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Bài viết đã được cập nhật thành công lên trang web theo chuẩn &ldquo;Thương hiệu | Tiêu đề bài viết&rdquo;!</span>
        </div>
      )}

      {/* 1. URL input with Real Article Title Scraper */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium">
            Link bài viết (URL) <span className="text-red-500">*</span>
          </label>

          <button
            type="button"
            onClick={handleManualFetch}
            disabled={isLoadingMetadata || !url.trim()}
            className="inline-flex items-center gap-1.5 text-[11px] font-editorial-mono text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-40 px-2.5 py-1 rounded transition-colors cursor-pointer"
            title="Sử dụng AI để quét toàn bộ bài viết, trích xuất chính xác Tiêu đề, Ngày xuất bản và Thương hiệu/Nhãn hàng"
          >
            {isLoadingMetadata ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-800" />
                <span>AI đang đọc bài viết...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 text-stone-800" />
                <span>AI quét bài & tự động điền</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            type="url"
            required
            placeholder="Dán link bài viết (VD: https://kenh14.vn/... hoặc https://vnexpress.net/...)"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm font-sans bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 transition-colors placeholder-stone-400"
          />
          {isLoadingMetadata && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-stone-500 font-editorial-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang đọc bài viết...</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Mandatory Format: Brand & Article Title Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Brand */}
        <div className="sm:col-span-1">
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Thương hiệu (Brand) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="VD: L'Oréal Paris, Toyota, P/S..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-3 py-2 text-sm font-sans bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 font-medium"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {["L'Oréal Paris", 'Toyota', 'Mazda', 'P/S', 'BIDV', 'Heineken', 'PNJ', 'Shopee'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBrand(b)}
                className="text-[10px] font-editorial-mono px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xs transition-colors cursor-pointer"
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="sm:col-span-2">
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Tiêu đề bài viết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="VD: Sự kiện Chính Nữ - The Celebration Night 2026 lan tỏa cảm hứng..."
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-3 py-2 text-sm font-be-vietnam bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900"
          />
        </div>
      </div>

      {/* Mandatory Display Preview Alert */}
      <div className="p-3 bg-stone-100/90 border border-stone-200 rounded-sm">
        <span className="font-editorial-mono text-[11px] uppercase tracking-wider text-stone-500 block mb-1">
          Bắt buộc hiển thị trên website theo dạng &ldquo;Thương hiệu | Tiêu đề bài viết&rdquo;:
        </span>
        <div className="font-be-vietnam font-medium text-stone-900 text-sm">
          {computedDisplayTitle() || 'Thương hiệu | Tiêu đề bài viết'}
        </div>
      </div>

      {/* 3. Format Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium">
            Định dạng bài viết (Format) <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsCustomFormat(!isCustomFormat);
              if (!isCustomFormat) setCustomFormat('');
            }}
            className="text-[11px] font-editorial-mono text-stone-500 hover:text-stone-900 cursor-pointer underline underline-offset-2"
          >
            {isCustomFormat ? '← Chọn định dạng có sẵn' : '+ Nhập định dạng khác'}
          </button>
        </div>

        {isCustomFormat ? (
          <input
            type="text"
            required
            placeholder="Nhập định dạng mới (VD: Case Study, Ghostwriting, Whitepaper...)"
            value={customFormat}
            onChange={(e) => setCustomFormat(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {formats.map((fmt) => {
              const isSelected = selectedFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3 py-1.5 text-xs font-editorial-mono rounded-sm border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-stone-100 border-stone-900 font-medium'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                  }`}
                >
                  {fmt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Publisher & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Publisher */}
        <div>
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Tên báo / Nền tảng
          </label>
          <input
            type="text"
            placeholder="VD: Kenh14, VnExpress, Brands Vietnam..."
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 placeholder-stone-400 font-be-vietnam"
          />
        </div>

        {/* Date MM/YYYY */}
        <div>
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium mb-1.5">
            Thời gian xuất bản (MM/YYYY) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            pattern="^(0[1-9]|1[0-2])\/\d{4}$"
            placeholder="MM/YYYY (VD: 10/2026)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 font-editorial-mono"
          />
        </div>
      </div>

      {/* 5. Category Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium">
            Chuyên mục (Category) <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsCustomCategory(!isCustomCategory);
              if (!isCustomCategory) setCustomCategory('');
            }}
            className="text-[11px] font-editorial-mono text-stone-500 hover:text-stone-900 cursor-pointer underline underline-offset-2"
          >
            {isCustomCategory ? '← Chọn có sẵn' : '+ Thêm mới'}
          </button>
        </div>

        {isCustomCategory ? (
          <input
            type="text"
            required
            placeholder="VD: Beauty & Personal Care, Automotive..."
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900"
          />
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 font-sans"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 6. Summary / Notes */}
      <div>
        <label className="block font-editorial-mono text-xs uppercase tracking-wider text-stone-700 font-medium mb-1.5">
          Ghi chú / Tóm tắt bài viết (Tùy chọn)
        </label>
        <textarea
          rows={2}
          placeholder="Tóm tắt ngắn về vai trò hoặc kết quả đạt được..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-stone-900 placeholder-stone-400 font-be-vietnam"
        />
      </div>

      {/* 7. Live Preview Card */}
      {(headline || url) && (
        <div className="p-4 bg-stone-100/70 border border-dashed border-stone-300 rounded-sm">
          <div className="text-[11px] font-editorial-mono uppercase tracking-wider text-stone-500 mb-2">
            Xem trước hiển thị trên trang web:
          </div>
          <div className="flex items-baseline justify-between gap-4 py-2 border-y border-stone-200">
            <div className="flex items-baseline gap-4 min-w-0">
              <span className="font-editorial-mono text-xs text-stone-500 shrink-0">
                {date || defaultDate}
              </span>
              <div>
                <span className="font-be-vietnam text-sm text-stone-900 block font-normal leading-snug">
                  {computedDisplayTitle()}
                </span>
                {publisher && (
                  <span className="font-editorial-mono text-[11px] text-stone-500 block mt-0.5">
                    {publisher}
                  </span>
                )}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 font-editorial-mono text-xs text-stone-500 shrink-0">
              <span>{(isCustomFormat ? customFormat : selectedFormat) || 'Format'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}

      {/* 8. Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-editorial-mono uppercase tracking-widest font-medium rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm bài viết & Cập nhật lên Portfolio</span>
        </button>
      </div>
    </form>
  );
};
