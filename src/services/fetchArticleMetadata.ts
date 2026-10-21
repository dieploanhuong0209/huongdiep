/**
 * Real article metadata fetcher.
 * Fetches the actual HTML of the article to extract the real headline (og:title / <h1>),
 * real platform name (og:site_name), real publish date (MM/YYYY), and detects the Brand name
 * to guarantee the mandatory format: "Thương hiệu | Tiêu đề bài viết".
 */

export interface ArticleMetadataResult {
  title?: string; // Formatted as "Thương hiệu | Tiêu đề bài viết"
  headline?: string; // Pure article title
  brand?: string; // Extracted brand
  publisher?: string;
  date?: string;
  summary?: string;
}

export async function fetchRealArticleMetadata(targetUrl: string): Promise<ArticleMetadataResult> {
  const cleanUrl = targetUrl.trim();
  if (!cleanUrl) return {};

  // 1. Try our internal server endpoint first (/api/fetch-metadata)
  try {
    const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title || data.headline || data.publisher) {
        const headline = data.headline || data.title || '';
        const detectedBrand = data.brand || detectBrandFromText(headline, data.publisher, cleanUrl);
        const formattedTitle = formatBrandAndTitle(detectedBrand, headline);

        return {
          title: formattedTitle,
          headline: cleanExtractedTitle(headline),
          brand: detectedBrand,
          publisher: data.publisher,
          date: data.date,
          summary: data.summary,
        };
      }
    }
  } catch (err) {
    console.warn('Backend metadata fetcher unavailable, trying fallback proxy...', err);
  }

  // 2. Client-side fallback via public CORS proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      return parseHtmlMetadata(html, cleanUrl);
    }
  } catch {
    // Fallback quietly
  }

  return {};
}

function parseHtmlMetadata(html: string, originalUrl: string): ArticleMetadataResult {
  let rawTitle = '';
  const ogTitleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

  if (ogTitleMatch && ogTitleMatch[1]) {
    rawTitle = ogTitleMatch[1];
  } else {
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTagMatch && titleTagMatch[1]) {
      rawTitle = titleTagMatch[1];
    }
  }

  const headline = cleanExtractedTitle(rawTitle);

  // Publisher detection
  let publisher = '';
  const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSiteMatch && ogSiteMatch[1]) {
    publisher = ogSiteMatch[1].trim();
  }

  try {
    const host = new URL(originalUrl).hostname.toLowerCase();
    if (!publisher) {
      if (host.includes('kenh14')) publisher = 'Kenh14';
      else if (host.includes('vnexpress')) publisher = 'VnExpress';
      else if (host.includes('brandsvietnam')) publisher = 'Brands Vietnam';
      else if (host.includes('dantri')) publisher = 'Dân Trí';
      else if (host.includes('tuoitre')) publisher = 'Tuổi Trẻ';
      else if (host.includes('cafebiz')) publisher = 'CafeBiz';
      else if (host.includes('cafef')) publisher = 'CafeF';
      else if (host.includes('vietcetera')) publisher = 'Vietcetera';
      else if (host.includes('elle')) publisher = 'ELLE Vietnam';
      else if (host.includes('lofficiel')) publisher = "L'Officiel Vietnam";
    }
  } catch {
    // ignore
  }

  // Date extraction (MM/YYYY)
  let date = '';
  const dateMatch =
    html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i);

  if (dateMatch && dateMatch[1]) {
    const parsed = new Date(dateMatch[1]);
    if (!isNaN(parsed.getTime())) {
      date = `${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
    }
  }

  if (!date) {
    const regexDate = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const m = html.match(regexDate);
    if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) {
      date = `${String(m[2]).padStart(2, '0')}/${m[3]}`;
    }
  }

  const detectedBrand = detectBrandFromText(headline, publisher, originalUrl);
  const formattedTitle = formatBrandAndTitle(detectedBrand, headline);

  return {
    title: formattedTitle,
    headline,
    brand: detectedBrand,
    publisher: publisher || undefined,
    date: date || undefined,
  };
}

export function detectBrandFromText(text: string = '', publisher: string = '', url: string = ''): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('l’oréal') || lower.includes("l'oréal") || lower.includes('loreal') || lower.includes('chính nữ')) {
    return "L'Oréal Paris";
  }
  if (lower.includes('toyota')) return 'Toyota Việt Nam';
  if (lower.includes('mazda')) return 'Mazda';
  if (lower.includes('vinfast')) return 'VinFast';
  if (lower.includes('honda')) return 'Honda';
  if (lower.includes('hyundai')) return 'Hyundai';
  if (lower.includes('p/s') || lower.includes('unilever')) return 'P/S';
  if (lower.includes('bidv')) return 'BIDV';
  if (lower.includes('vietcombank')) return 'Vietcombank';
  if (lower.includes('techcombank')) return 'Techcombank';
  if (lower.includes('phú hưng')) return 'Phú Hưng Securities';
  if (lower.includes('huda')) return 'Huda Beer';
  if (lower.includes('heineken')) return 'Heineken Vietnam';
  if (lower.includes('pnj')) return 'PNJ';
  if (lower.includes('dior')) return 'Dior';
  if (lower.includes('shopee')) return 'Shopee';
  if (lower.includes('momo')) return 'MoMo';
  if (lower.includes('tiki')) return 'Tiki';
  if (lower.includes('samsung')) return 'Samsung';
  if (lower.includes('apple')) return 'Apple';

  // Check if text already has a brand separator " | "
  if (text.includes(' | ')) {
    return text.split(' | ')[0].trim();
  }

  // Fallback to publisher name if available
  if (publisher) return publisher;

  // Fallback to domain host
  try {
    if (url) {
      const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      if (host) return host.charAt(0).toUpperCase() + host.slice(1);
    }
  } catch {}

  return 'Brand';
}

export function formatBrandAndTitle(brand: string, headline: string): string {
  const cleanHeadline = cleanExtractedTitle(headline);
  const cleanBrand = brand.trim() || 'Thương hiệu';

  // If headline already has Brand | Headline
  if (cleanHeadline.includes(' | ')) {
    return cleanHeadline;
  }
  if (cleanHeadline.includes(' — ')) {
    return cleanHeadline.replace(/\s*—\s*/g, ' | ');
  }

  return `${cleanBrand} | ${cleanHeadline}`;
}

export function cleanExtractedTitle(rawTitle: string = ''): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // Strip common trailing site names
  cleaned = cleaned
    .replace(/\s*[-–|]\s*(Kenh14(\.vn)?|Báo Dân trí|VnExpress(\.net)?|Brands Vietnam|Tuổi Trẻ Online|Thanh Niên|Znews|Zing News|CafeBiz|CafeF|Vietcetera|VTC News|VietnamNet|VOV|VTV|Dân Việt|Báo Đầu tư).*$/i, '')
    .trim();

  return cleaned;
}
