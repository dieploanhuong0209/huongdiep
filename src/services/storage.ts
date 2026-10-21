import { PortfolioData, Article, ProfileData } from '../types/portfolio';
import { INITIAL_DATA } from '../data/initialData';

const STORAGE_KEY = 'huong_diep_portfolio_data_v3';
const DEFAULT_PASSWORD = 'HuongDiepp';

export const storage = {
  verifyPassword(input: string): boolean {
    return input.trim() === DEFAULT_PASSWORD;
  },

  getData(): PortfolioData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        this.saveData(INITIAL_DATA);
        return INITIAL_DATA;
      }
      const parsed = JSON.parse(saved);

      // Migrate articles to ensure date is present in MM/YYYY format and delimiter is |
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

      // Always ensure Facebook link is https://www.facebook.com/dieploanhuong099/
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

  saveData(data: PortfolioData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('portfolio_data_updated'));
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
      facebook: profile.facebook || 'https://www.facebook.com/dieploanhuong099/',
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

/**
 * Intelligent helper to extract platform/publisher and useful hints from a pasted URL
 */
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
    if (host.includes('vnexpress')) publisher = 'VnExpress';
    else if (host.includes('brandsvietnam')) publisher = 'Brands Vietnam';
    else if (host.includes('vietcetera')) publisher = 'Vietcetera';
    else if (host.includes('cafebiz')) publisher = 'CafeBiz';
    else if (host.includes('cafef')) publisher = 'CafeF';
    else if (host.includes('tuoitre')) publisher = 'Tuổi Trẻ';
    else if (host.includes('thanhnien')) publisher = 'Thanh Niên';
    else if (host.includes('dantri')) publisher = 'Dân Trí';
    else if (host.includes('kenh14')) publisher = 'Kênh 14';
    else if (host.includes('znews') || host.includes('zingnews')) publisher = 'Znews';
    else if (host.includes('lofficiel')) publisher = "L'Officiel Vietnam";
    else if (host.includes('elle.vn') || host.includes('elleman')) publisher = 'ELLE Vietnam';
    else if (host.includes('dep.com.vn')) publisher = 'Đẹp Magazine';
    else if (host.includes('saigontimes') || host.includes('thesaigontimes')) publisher = 'Thời Báo Kinh Tế Sài Gòn';
    else if (host.includes('facebook.com') || host.includes('fb.com')) publisher = 'Facebook';
    else if (host.includes('youtube.com') || host.includes('youtu.be')) publisher = 'YouTube';
    else if (host.includes('medium.com')) publisher = 'Medium';
    else if (host.includes('substack.com')) publisher = 'Substack';
    else if (host.includes('linkedin.com')) publisher = 'LinkedIn';
    else if (host.includes('tiktok.com')) publisher = 'TikTok';
    else {
      const domainParts = host.split('.');
      const brandPart = domainParts[0] === 'm' || domainParts[0] === 'news' ? domainParts[1] : domainParts[0];
      if (brandPart) {
        publisher = brandPart.charAt(0).toUpperCase() + brandPart.slice(1);
      }
    }

    const lastPart = parsed.pathname.split('/').filter(Boolean).pop() || '';
    const rawSlug = lastPart.replace(/\.html?$/, '').replace(/-\d+$/, '');
    let slug = '';
    if (rawSlug && rawSlug.length > 3) {
      slug = rawSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    const guessedTitle = slug && publisher ? `${publisher} | ${slug}` : slug || (publisher ? `${publisher} | ` : undefined);

    return {
      guessedTitle,
      publisher: publisher || undefined,
    };
  } catch {
    return {};
  }
}
