import type { IncomingMessage, ServerResponse } from 'node:http';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { GoogleGenAI } from '@google/genai';

function meta(html: string, name: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)) attrs[m[1].toLowerCase()] = m[3];
    if ([attrs.name, attrs.property, attrs.itemprop].some(x => x?.toLowerCase() === name.toLowerCase())) return attrs.content || '';
  }
  return '';
}

function dateMonth(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{1,2})-\d{1,2}/);
  if (iso && +iso[2] >= 1 && +iso[2] <= 12) return `${iso[2].padStart(2, '0')}/${iso[1]}`;
  const local = value.match(/\b\d{1,2}[/-](\d{1,2})[/-](\d{4})\b/);
  return local && +local[1] >= 1 && +local[1] <= 12 ? `${local[1].padStart(2, '0')}/${local[2]}` : '';
}

function pageDate(html: string): string {
  const direct = dateMonth(meta(html, 'article:published_time') || meta(html, 'pubdate') || meta(html, 'datePublished'));
  if (direct) return direct;
  for (const script of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const obj = JSON.parse(script[1]);
      const roots = Array.isArray(obj) ? obj : [obj];
      for (const root of roots) {
        for (const node of [root, ...(Array.isArray(root?.['@graph']) ? root['@graph'] : [])]) {
          const value = dateMonth(String(node?.datePublished || ''));
          if (value) return value;
        }
      }
    } catch { /* invalid JSON-LD */ }
  }
  return '';
}

function isPublic(address: string): boolean {
  if (address.includes(':')) return !/^(::1|::|fc|fd|fe80|::ffff:)/i.test(address);
  const [a, b] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)));
}

async function safeUrl(value: string): Promise<URL> {
  const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
    (url.port && !['80', '443'].includes(url.port)) ||
    url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw Error('URL không hợp lệ');
  if (isIP(url.hostname) && !isPublic(url.hostname)) throw Error('Không hỗ trợ URL nội bộ');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(x => !isPublic(x.address))) throw Error('Không hỗ trợ URL nội bộ');
  return url;
}

async function htmlFrom(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const headers = { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioMetadataBot/1.0)' };
    let response = await fetch(url, { signal: controller.signal, redirect: 'manual', headers });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw Error('Không thể theo chuyển hướng');
      const next = await safeUrl(new URL(location, url).href);
      response = await fetch(next, { signal: controller.signal, redirect: 'error', headers });
    }
    if (!response.ok) throw Error(`Trang báo trả về HTTP ${response.status}`);
    if (!(response.headers.get('content-type') || '').includes('html')) throw Error('Link không phải trang HTML');
    return (await response.text()).slice(0, 300000);
  } finally { clearTimeout(timeout); }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return;
  }
  try {
    const input = new URL(req.url || '', 'https://portfolio.local').searchParams.get('url');
    if (!input || input.length > 2048) {
      res.statusCode = 400; res.end(JSON.stringify({ error: 'Thiếu đường link bài báo' })); return;
    }
    const url = await safeUrl(input.trim());
    const html = await htmlFrom(url);
    const publisher = meta(html, 'og:site_name') || url.hostname.replace(/^www\./, '');
    const rawTitle = meta(html, 'og:title') || meta(html, 'twitter:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const headline = rawTitle.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'").replace(/\s*[-–|]\s*(Kenh14|VnExpress|Dân Trí|Tuổi Trẻ|Brands Vietnam).*$/i, '').trim();
    const published = pageDate(html);
    let extracted: Record<string, string> = {};
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const source = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').slice(0, 18000);
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Trích xuất chính xác dữ liệu bài báo thành JSON với các khóa: brand (thương hiệu được nhắc tới, không phải tên báo), title (tiêu đề), date (MM/YYYY), publisher, category, format, summary. Không bịa ngày nếu thiếu. URL: ${url.href}\nHTML:\n${source}`,
          config: { responseMimeType: 'application/json' },
        });
        extracted = JSON.parse(result.text || '{}');
      } catch (error) { console.warn('Gemini failed; using metadata:', error); }
    }
    const title = String(extracted.title || headline).trim();
    if (!title) {
      res.statusCode = 422; res.end(JSON.stringify({ error: 'Không tìm được tiêu đề bài báo' })); return;
    }
    const brand = String(extracted.brand || '').trim();
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true, aiScanned: !!Object.keys(extracted).length,
      headline: title, title: brand ? `${brand} | ${title}` : title,
      brand, publisher: extracted.publisher || publisher,
      date: dateMonth(String(extracted.date || '')) || published,
      category: extracted.category || undefined, format: extracted.format || undefined,
      summary: extracted.summary || undefined,
    }));
  } catch (error) {
    console.error('Metadata error:', error);
    res.statusCode = 502;
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Không thể đọc bài báo' }));
  }
}
