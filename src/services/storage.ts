import { PortfolioData, Article, ProfileData } from '../types/portfolio';
import { INITIAL_DATA } from '../data/initialData';
import { supabase } from './supabase';

const STORAGE_KEY = 'huong_diep_portfolio_data_v4';
const LEGACY_KEY = 'huong_diep_legacy_backup_before_cloud';

let isSyncing = false;
let current: PortfolioData | null = null;
let pendingSave: Promise<void> = Promise.resolve();

function normalized(input: any): PortfolioData {
  return {
    profile: { ...INITIAL_DATA.profile, ...(input?.profile || {}) },
    articles: Array.isArray(input?.articles) ? input.articles : INITIAL_DATA.articles,
    categories: Array.isArray(input?.categories) ? input.categories : INITIAL_DATA.categories,
    formats: Array.isArray(input?.formats) ? input.formats : INITIAL_DATA.formats,
  };
}

function locally(data: PortfolioData): void {
  current = normalized(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('portfolio_data_updated'));
}

export const storage = {
  getData(): PortfolioData {
    if (current) return current;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Keep the exact pre-cloud browser content available for manual migration.
      if (saved && !localStorage.getItem(LEGACY_KEY)) localStorage.setItem(LEGACY_KEY, saved);
      current = normalized(saved ? JSON.parse(saved) : INITIAL_DATA);
    } catch (e) {
      console.error('Failed to load portfolio data from localStorage', e);
      current = normalized(INITIAL_DATA);
    }
    return current;
  },

  async syncFromServer(): Promise<PortfolioData | null> {
    if (!supabase || isSyncing) return null;
    isSyncing = true;
    try {
      await pendingSave;
      const { data, error } = await supabase.from('portfolio_state')
        .select('content').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (data?.content) {
        locally(normalized(data.content));
        return current;
      }
    } catch (err) {
      console.warn('Supabase sync failed:', err);
      window.dispatchEvent(new CustomEvent('portfolio_sync_error', {
        detail: 'Không tải được dữ liệu mới nhất từ Supabase.',
      }));
    } finally {
      isSyncing = false;
    }
    return null;
  },

  saveData(data: PortfolioData): void {
    const client = supabase;
    if (!client) {
      window.dispatchEvent(new CustomEvent('portfolio_sync_error', {
        detail: 'Chưa cấu hình Supabase, thay đổi chưa được lưu.',
      }));
      return;
    }
    const snapshot = normalized(data);
    locally(snapshot);
    pendingSave = pendingSave.catch(() => {}).then(async () => {
      const { data: user, error: authError } = await client.auth.getUser();
      if (authError || !user.user) throw Error('Cần đăng nhập Admin');
      const { error } = await client.from('portfolio_state')
        .upsert({ id: 1, content: snapshot }, { onConflict: 'id' });
      if (error) throw error;
    }).catch((error) => {
      console.error('Save failed:', error);
      window.dispatchEvent(new CustomEvent('portfolio_sync_error', {
        detail: 'Không lưu được thay đổi lên Supabase. Kiểm tra quyền Admin và thử lại.',
      }));
    });
  },

  addArticle(article: Omit<Article, 'id' | 'createdAt'>): Article {
    const data = this.getData();
    const newArticle: Article = {
      ...article,
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    if (newArticle.category && !data.categories.includes(newArticle.category)) {
      data.categories.push(newArticle.category);
    }
    if (newArticle.format && !data.formats.includes(newArticle.format)) {
      data.formats.push(newArticle.format);
    }

    data.articles.unshift(newArticle);
    this.saveData(data);
    return newArticle;
  },

  updateArticle(updatedArticle: Article): void {
    const data = this.getData();
    const index = data.articles.findIndex((a) => a.id === updatedArticle.id);
    if (index !== -1) {
      data.articles[index] = updatedArticle;
      if (updatedArticle.category && !data.categories.includes(updatedArticle.category)) {
        data.categories.push(updatedArticle.category);
      }
      if (updatedArticle.format && !data.formats.includes(updatedArticle.format)) {
        data.formats.push(updatedArticle.format);
      }
      this.saveData(data);
    }
  },

  deleteArticle(id: string): void {
    const data = this.getData();
    data.articles = data.articles.filter((a) => a.id !== id);
    this.saveData(data);
  },

  reorderArticles(newArticles: Article[]): void {
    const data = this.getData();
    data.articles = newArticles;
    this.saveData(data);
  },

  updateProfile(profile: ProfileData): void {
    const data = this.getData();
    data.profile = {
      ...profile,
      facebook: 'https://www.facebook.com/dieploanhuong099/',
    };
    this.saveData(data);
  },

  updateCategories(categories: string[]): void {
    const data = this.getData();
    data.categories = categories;
    this.saveData(data);
  },

  updateFormats(formats: string[]): void {
    const data = this.getData();
    data.formats = formats;
    this.saveData(data);
  },

  resetToDefault(): PortfolioData {
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  },

  exportJSON(): string {
    const data = this.getData();
    return JSON.stringify(data, null, 2);
  },

  exportLegacyJSON(): string | null {
    return localStorage.getItem(LEGACY_KEY);
  },

  importJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.articles && Array.isArray(parsed.articles)) {
        this.saveData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};

export function parseUrlHints(urlStr: string): {
  guessedTitle?: string;
  publisher?: string;
} {
  try {
    let cleanUrl = urlStr.trim();
    if (!cleanUrl) return {};
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    let publisher = '';
    if (host.includes('kenh14')) publisher = 'Kenh14';
    else if (host.includes('vnexpress')) publisher = 'VnExpress';
    else if (host.includes('brandsvietnam')) publisher = 'Brands Vietnam';
    else if (host.includes('cafebiz')) publisher = 'CafeBiz';
    else if (host.includes('cafef')) publisher = 'CafeF';
    else if (host.includes('tuoitre')) publisher = 'Tuổi Trẻ';
    else if (host.includes('thanhnien')) publisher = 'Thanh Niên';
    else if (host.includes('dantri')) publisher = 'Dân Trí';
    else if (host.includes('lofficiel')) publisher = "L'Officiel Vietnam";
    else if (host.includes('elle.vn') || host.includes('elleman')) publisher = 'ELLE Vietnam';
    else if (host.includes('dep.com.vn')) publisher = 'Đẹp Magazine';
    else if (host.includes('facebook.com') || host.includes('fb.com')) publisher = 'Facebook';

    return {
      publisher: publisher || undefined,
    };
  } catch {
    return {};
  }
}
