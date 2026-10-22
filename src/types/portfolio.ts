export interface Article {
  id: string;
  title: string; // "Thương hiệu | Tiêu đề bài viết"
  brand?: string; // Optional separate brand name
  url: string;
  format: string; // e.g. "PR Series", "Editorial", "Brand Campaign", "Content Strategy"
  category: string; // e.g. "Automotive", "Beauty & Personal Care", "Finance & Banking"
  date: string; // MM/YYYY, e.g. "03/2026"
  year?: number | string; // Backward compatibility
  publisher?: string; // e.g. "VnExpress", "Brands Vietnam", "L'Officiel"
  summary?: string; // Optional short summary
  isPinned?: boolean;
  createdAt: string;
}

export interface ProfileData {
  name: string;
  title: string;
  email: string;
  facebook: string; // Replaced linkedin with Facebook
  bio?: string;
  customLinks?: Array<{ label: string; url: string }>;
}

export interface PortfolioData {
  profile: ProfileData;
  articles: Article[];
  categories: string[];
  formats: string[];
}
