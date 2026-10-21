import React, { useState } from 'react';
import { PortfolioData, Article, ProfileData } from '../types/portfolio';
import { QuickAddForm } from '../components/admin/QuickAddForm';
import { ArticleManageTable } from '../components/admin/ArticleManageTable';
import { CategoryFormatEditor } from '../components/admin/CategoryFormatEditor';
import { ProfileEditor } from '../components/admin/ProfileEditor';
import { DataBackupView } from '../components/admin/DataBackupView';
import {
  PlusCircle,
  ListOrdered,
  Tags,
  UserCheck,
  Database,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface AdminPageProps {
  data: PortfolioData;
  onAddArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;
  onUpdateArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onReorderArticles: (articles: Article[]) => void;
  onUpdateCategories: (categories: string[]) => void;
  onUpdateFormats: (formats: string[]) => void;
  onUpdateProfile: (profile: ProfileData) => void;
  onDataReloaded: () => void;
  categoryCounts: Record<string, number>;
  formatCounts: Record<string, number>;
  onNavigateToPortfolio: () => void;
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  data,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
  onReorderArticles,
  onUpdateCategories,
  onUpdateFormats,
  onUpdateProfile,
  onDataReloaded,
  categoryCounts,
  formatCounts,
  onNavigateToPortfolio,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'taxonomy' | 'profile' | 'backup'>('add');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans antialiased">
      {/* Toast Bar */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-stone-100 text-xs px-4 py-3 rounded shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top-3 border border-stone-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
            <div>
              <h1 className="font-editorial-serif italic text-lg sm:text-xl font-bold text-stone-900 leading-none">
                Hương Diệp — Admin Control Center
              </h1>
              <p className="font-editorial-mono text-[11px] text-stone-500 uppercase tracking-widest mt-1">
                Công cụ quản lý bài viết, link & định dạng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToPortfolio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-editorial-mono rounded-sm transition-colors cursor-pointer shadow-xs"
              title="Xem trang portfolio thực tế của bạn"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trang Portfolio</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-editorial-mono rounded-sm transition-colors cursor-pointer"
              title="Khóa & Đăng xuất phiên quản trị"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-stone-200 rounded-sm shadow-xs overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex border-b border-stone-200 px-4 sm:px-6 bg-stone-50/50 overflow-x-auto font-editorial-mono text-xs">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'add'
                  ? 'border-stone-900 text-stone-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Thêm bài viết nhanh (Link & Format)</span>
            </button>

            <button
              onClick={() => setActiveTab('manage')}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'manage'
                  ? 'border-stone-900 text-stone-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-stone-600" />
              <span>Danh sách bài viết ({data.articles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('taxonomy')}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'taxonomy'
                  ? 'border-stone-900 text-stone-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Tags className="w-4 h-4 text-stone-600" />
              <span>Chuyên mục & Định dạng</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'profile'
                  ? 'border-stone-900 text-stone-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-stone-600" />
              <span>Thông tin tác giả</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'backup'
                  ? 'border-stone-900 text-stone-950 font-bold bg-white'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Database className="w-4 h-4 text-stone-600" />
              <span>Sao lưu & Khôi phục</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-6 sm:p-8">
            {activeTab === 'add' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2 text-stone-900 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h2 className="font-editorial-serif italic text-2xl font-normal">
                      Cập nhật bài viết mới lên website
                    </h2>
                  </div>
                  <p className="text-stone-500 text-xs font-sans">
                    Nhập đường link và định dạng bài viết. Sau khi bấm thêm, dữ liệu sẽ được đồng bộ ngay lập tức lên trang portfolio công khai.
                  </p>
                </div>

                <QuickAddForm
                  categories={data.categories}
                  formats={data.formats}
                  onAddArticle={onAddArticle}
                  onSuccessNotice={showToast}
                />
              </div>
            )}

            {activeTab === 'manage' && (
              <div>
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <h2 className="font-editorial-serif italic text-2xl font-normal text-stone-900">
                    Tất cả bài viết đang hiển thị trên portfolio
                  </h2>
                  <p className="text-stone-500 text-xs font-sans mt-0.5">
                    Quản lý, chỉnh sửa tiêu đề, đổi định dạng, thay đổi thứ tự hiển thị hoặc xóa bài viết.
                  </p>
                </div>
                <ArticleManageTable
                  articles={data.articles}
                  categories={data.categories}
                  formats={data.formats}
                  onUpdateArticle={onUpdateArticle}
                  onDeleteArticle={onDeleteArticle}
                  onReorderArticles={onReorderArticles}
                />
              </div>
            )}

            {activeTab === 'taxonomy' && (
              <div>
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <h2 className="font-editorial-serif italic text-2xl font-normal text-stone-900">
                    Quản lý Danh mục & Định dạng bài viết
                  </h2>
                  <p className="text-stone-500 text-xs font-sans mt-0.5">
                    Tùy biến các bộ lọc ngành nghề (Automotive, Beauty, Finance...) và định dạng bài viết (PR Series, Editorial, Brand Campaign...).
                  </p>
                </div>
                <CategoryFormatEditor
                  categories={data.categories}
                  formats={data.formats}
                  onUpdateCategories={onUpdateCategories}
                  onUpdateFormats={onUpdateFormats}
                  categoryCounts={categoryCounts}
                  formatCounts={formatCounts}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <h2 className="font-editorial-serif italic text-2xl font-normal text-stone-900">
                    Cài đặt hồ sơ tác giả
                  </h2>
                  <p className="text-stone-500 text-xs font-sans mt-0.5">
                    Chỉnh sửa tên hiển thị, chức danh (WRITER), email và các liên kết mạng xã hội hiển thị trên đầu trang.
                  </p>
                </div>
                <ProfileEditor
                  profile={data.profile}
                  onUpdateProfile={onUpdateProfile}
                  onSuccessNotice={showToast}
                />
              </div>
            )}

            {activeTab === 'backup' && (
              <div>
                <div className="mb-6 pb-4 border-b border-stone-200">
                  <h2 className="font-editorial-serif italic text-2xl font-normal text-stone-900">
                    Sao lưu dữ liệu & Khôi phục
                  </h2>
                  <p className="text-stone-500 text-xs font-sans mt-0.5">
                    Xuất file JSON sao lưu, tải file dự phòng lên, hoặc khôi phục 10 bài viết mẫu như ảnh chụp màn hình gốc.
                  </p>
                </div>
                <DataBackupView
                  onDataReloaded={onDataReloaded}
                  onSuccessNotice={showToast}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
