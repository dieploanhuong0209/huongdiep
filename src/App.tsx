import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { storage } from './services/storage';
import { PortfolioData, Article, ProfileData } from './types/portfolio';
import { PortfolioPage } from './pages/PortfolioPage';
import { AdminPage } from './pages/AdminPage';
import { AdminPasswordGate } from './components/admin/AdminPasswordGate';
import { supabase, hasCloudConfig } from './services/supabase';

export default function App() {
  const [data, setData] = useState<PortfolioData>(() => storage.getData());
  const [syncError, setSyncError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check if current route is admin
  const getIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    return path.includes('/admin') || search.includes('admin=true') || hash.includes('admin');
  };

  const [isAdminMode, setIsAdminMode] = useState<boolean>(getIsAdminRoute);
  
  // Xác thực theo phiên của tab: Trong cùng 1 tab chỉ gõ pass 1 lần, đóng tab mở lại mới phải gõ lại
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) { setAuthLoading(false); return; }
    const check = async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) { setIsAuthenticated(false); setAuthLoading(false); return; }
      const { data: admin } = await client.from('portfolio_admins')
        .select('user_id').eq('user_id', user.id).maybeSingle();
      setIsAuthenticated(Boolean(admin));
      setAuthLoading(false);
    };
    void check();
    const { data: subscription } = client.auth.onAuthStateChange(() => { window.setTimeout(() => { void check(); }, 0); });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Sync state if localStorage changes or custom event fires
  const refreshData = useCallback(() => {
    setData(storage.getData());
  }, []);

  useEffect(() => {
    // Initial sync from central server database
    storage.syncFromServer().then((serverData) => {
      if (serverData) setData(serverData);
    });

    const handleStorageChange = () => {
      refreshData();
    };

    const handleWindowFocus = () => {
      storage.syncFromServer().then((serverData) => {
        if (serverData) setData(serverData);
      });
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void storage.syncFromServer();
    }, 20000);
    const handleError = (event: Event) => {
      setSyncError((event as CustomEvent<string>).detail);
    };
    window.addEventListener('portfolio_sync_error', handleError);

    const handlePopState = () => {
      const isNowAdmin = getIsAdminRoute();
      setIsAdminMode(isNowAdmin);
    };

    window.addEventListener('portfolio_data_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleWindowFocus);

    // Phím tắt bí mật: Shift + A hoặc Ctrl + M để mở Admin
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
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('portfolio_sync_error', handleError);
      window.clearInterval(timer);
    };
  }, [refreshData]);

  const navigateToAdmin = () => {
    try {
      window.history.pushState({}, '', '?admin=true');
    } catch {
      // Fallback
    }
    // Giữ trạng thái đã xác thực của tab hiện tại (nếu đã nhập trong tab này thì không cần nhập lại)
    setIsAdminMode(true);
  };

  const navigateToPortfolio = () => {
    try {
      window.history.pushState({}, '', window.location.pathname.replace(/\/admin.*$/, '') || '/');
    } catch {
      // Fallback
    }
    setIsAdminMode(false);
  };

  const handlePasswordSuccess = async (email: string, password: string): Promise<boolean> => {
    if (!supabase) return false;
    const { data: login, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !login.user) return false;
    const { data: admin } = await supabase.from('portfolio_admins')
      .select('user_id').eq('user_id', login.user.id).maybeSingle();
    if (!admin) { await supabase.auth.signOut(); return false; }
    setIsAuthenticated(true);
    return true;
  };

  const handleLogout = async () => {
    await supabase?.auth.signOut();
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
    if (!hasCloudConfig) return <div className="p-8 text-red-700">Chưa cấu hình Supabase trên Vercel. Xem hướng dẫn SUPABASE_SETUP.md.</div>;
    if (authLoading) return <div className="p-8">Đang kiểm tra quyền quản trị...</div>;
    // Nếu tab này chưa nhập pass -> hiển thị màn hình nhập mật khẩu
    if (!isAuthenticated) {
      return (
        <AdminPasswordGate
          onSuccess={handlePasswordSuccess}
          onCancel={navigateToPortfolio}
          authorName={data.profile.name || 'Huong Diep'}
        />
      );
    }

    // Nếu tab này đã nhập pass -> vào thẳng Dashboard Admin
    return (
      <>
      {syncError && <div role="alert" className="fixed top-2 right-2 z-50 max-w-sm p-3 bg-red-50 border border-red-300 text-red-700 text-xs">
        {syncError} <button className="ml-2 underline" onClick={() => setSyncError('')}>Đóng</button>
      </div>}
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
      </>
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
