import { PortfolioData, Article, ProfileData } from '../types/portfolio';
import { INITIAL_DATA } from '../data/initialData';

const STORAGE_KEY = 'huong_diep_portfolio_data_v4';
const DEFAULT_PASSWORD = 'HuongDiepp';

let isSyncing = false;

export const storage = {
  verifyPassword(input: string): boolean {
    return input.trim() === DEFAULT_PASSWORD;
  },

  getData(): PortfolioData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        this.saveData(INITIAL_DATA);
        // Also trigger background server sync
        this.syncFromServer();
        return INITIAL_DATA;
      }
      const parsed = JSON.parse(saved);

      const migratedArticles = (Array.isArray(parsed.articles) ? parsed.articles : INITIAL_DATA.articles).map(
        (art: any) => {
          let date = art.date;
          if (!date) {
            date = art.year ? `01/${art.year}` : '01/2026';
          }
          let title = art.title || '';
          if (title.includes(' — ')) {
            title = title.replace(/\s*—\s*/g, ' | ');
          }
          return {
            ...art,
            date,
            title,
          };
        }
      );

      const profile: ProfileData = {
        ...INITIAL_DATA.profile,
        ...(parsed.profile || {}),
        facebook: 'https://www.facebook.com/dieploanhuong099/',
      };

      return {
        profile,
        categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 
          ? parsed.categories 
          : INITIAL_DATA.categories,
        formats: Array.isArray(parsed.formats) && parsed.formats.length > 0 
          ? parsed.formats 
          : INITIAL_DATA.formats,
        articles: migratedArticles,
      };
    } catch (e) {
      console.error('Failed to load portfolio data from localStorage', e);
      return INITIAL_DATA;
    }
  },

  async syncFromServer(): Promise<PortfolioData | null> {
    if (isSyncing) return null;
    isSyncing = true;
    try {
      const res = await fetch('/api/portfolio-data', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && Array.isArray(serverData.articles) && serverData.articles.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
          window.dispatchEvent(new Event('portfolio_data_updated'));
          return serverData;
        }
      }
    } catch (err) {
      console.warn('Could not sync from server database:', err);
    } finally {
      isSyncing = false;
    }
    return null;
  },

  saveData(data: PortfolioData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('portfolio_data_updated'));

      // Đẩy dữ liệu lên Server Database tập trung để máy công ty hay máy nhà đều nhận được
      fetch('/api/portfolio-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(data),
      }).catch((err) => {
        console.warn('Failed to sync data to central server database:', err);
      });
    } catch (e) {
      console.error('Failed to save portfolio data to localStorage', e);
    }
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
