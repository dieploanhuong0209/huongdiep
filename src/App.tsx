import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { storage } from './services/storage';
import { PortfolioData, Article, ProfileData } from './types/portfolio';
import { PortfolioPage } from './pages/PortfolioPage';
import { AdminPage } from './pages/AdminPage';
import { AdminPasswordGate } from './components/admin/AdminPasswordGate';

export default function App() {
  const [data, setData] = useState<PortfolioData>(() => storage.getData());
  
  // Check if current route is admin
  const getIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    return path.includes('/admin') || search.includes('admin=true') || hash.includes('admin');
  };

  const [isAdminMode, setIsAdminMode] = useState<boolean>(getIsAdminRoute);
  // Luôn bắt đầu với isAuthenticated = false để mỗi lần vào admin đều phải nhập mật khẩu
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Sync state if localStorage changes or custom event fires
  const refreshData = useCallback(() => {
    setData(storage.getData());
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      refreshData();
    };

    const handlePopState = () => {
      const isNowAdmin = getIsAdminRoute();
      setIsAdminMode(isNowAdmin);
      if (!isNowAdmin) {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('portfolio_data_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('popstate', handlePopState);

    // Phím tắt bí mật: Shift + A hoặc Ctrl + M để mở màn hình nhập mật khẩu
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.shiftKey && e.key === 'A') || (e.ctrlKey && e.key === 'm')) {
        e.preventDefault();
        navigateToAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('portfolio_data_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [refreshData]);

  const navigateToAdmin = () => {
    try {
      window.history.pushState({}, '', '?admin=true');
    } catch {
      // Fallback
    }
    setIsAuthenticated(false); // Luôn yêu cầu nhập mật khẩu mỗi lần bấm vào Admin
    setIsAdminMode(true);
  };

  const navigateToPortfolio = () => {
    try {
      window.history.pushState({}, '', window.location.pathname.replace(/\/admin.*$/, '') || '/');
    } catch {
      // Fallback
    }
    setIsAuthenticated(false);
    setIsAdminMode(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigateToPortfolio();
  };

  // Calculate dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of data.categories) {
      counts[cat] = 0;
    }
    for (const art of data.articles) {
      if (art.category) {
        counts[art.category] = (counts[art.category] || 0) + 1;
      }
    }
    return counts;
  }, [data.categories, data.articles]);

  // Calculate dynamic format counts
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const fmt of data.formats) {
      counts[fmt] = 0;
    }
    for (const art of data.articles) {
      if (art.format) {
        counts[art.format] = (counts[art.format] || 0) + 1;
      }
    }
    return counts;
  }, [data.formats, data.articles]);

  // Admin mutation handlers
  const handleAddArticle = (newArticleData: Omit<Article, 'id' | 'createdAt'>) => {
    storage.addArticle(newArticleData);
    refreshData();
  };

  const handleUpdateArticle = (updatedArticle: Article) => {
    storage.updateArticle(updatedArticle);
    refreshData();
  };

  const handleDeleteArticle = (id: string) => {
    storage.deleteArticle(id);
    refreshData();
  };

  const handleReorderArticles = (reordered: Article[]) => {
    storage.reorderArticles(reordered);
    refreshData();
  };

  const handleUpdateCategories = (cats: string[]) => {
    storage.updateCategories(cats);
    refreshData();
  };

  const handleUpdateFormats = (fmts: string[]) => {
    storage.updateFormats(fmts);
    refreshData();
  };

  const handleUpdateProfile = (profile: ProfileData) => {
    storage.updateProfile(profile);
    refreshData();
  };

  // Khi ở chế độ admin:
  if (isAdminMode) {
    // Nếu chưa xác thực -> LUÔN hiển thị màn hình nhập mật khẩu
    if (!isAuthenticated) {
      return (
        <AdminPasswordGate
          onSuccess={() => setIsAuthenticated(true)}
          onCancel={navigateToPortfolio}
          authorName={data.profile.name || 'Huong Diep'}
        />
      );
    }

    // Sau khi nhập đúng mật khẩu -> hiển thị Dashboard Admin
    return (
      <AdminPage
        data={data}
        onAddArticle={handleAddArticle}
        onUpdateArticle={handleUpdateArticle}
        onDeleteArticle={handleDeleteArticle}
        onReorderArticles={handleReorderArticles}
        onUpdateCategories={handleUpdateCategories}
        onUpdateFormats={handleUpdateFormats}
        onUpdateProfile={handleUpdateProfile}
        onDataReloaded={refreshData}
        categoryCounts={categoryCounts}
        formatCounts={formatCounts}
        onNavigateToPortfolio={navigateToPortfolio}
        onLogout={handleLogout}
      />
    );
  }

  // Giao diện Portfolio công khai thuần khiết: 0 dấu vết admin
  return (
    <PortfolioPage
      data={data}
      categoryCounts={categoryCounts}
    />
  );
}
