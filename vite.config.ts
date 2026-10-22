import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

const DB_FILE = path.resolve('data/portfolio-db.json');

function ensureDbFile(): any {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const defaultData = {
        profile: {
          name: 'Hương Diệp',
          title: 'WRITER',
          email: 'dieploanhuong0209@gmail.com',
          facebook: 'https://www.facebook.com/dieploanhuong099/',
          bio: 'Storyteller, Brand Strategist & Copywriter chuyên sâu về chiến dịch PR, truyền thông thương hiệu và nội dung sáng tạo đa nền tảng.',
        },
        categories: [
          'Automotive',
          'Beauty & Personal Care',
          'Finance & Banking',
          'FMCG & Beverage',
          'Fashion & Jewelry',
          'Tech & E-commerce',
        ],
        formats: [
          'PR Series',
          'Editorial',
          'Brand Campaign',
          'Content Strategy',
          'Executive Branding',
          'Event & PR Copy',
          'Sustainability PR',
          'Ghostwriting',
          'Case Study',
          'Whitepaper',
          'SEO Article',
        ],
        articles: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
    return null;
  }
}

function saveDbFile(data: any): boolean {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
    return false;
  }
}

function portfolioBackendPlugin(): Plugin {
  return {
    name: 'portfolio-backend-plugin',
    configureServer(server) {
      // 1. API: GET /api/portfolio-data (Lấy dữ liệu đồng bộ toàn hệ thống)
      server.middlewares.use('/api/portfolio-data', async (req, res, next) => {
        const method = req.method?.toUpperCase();

        if (method === 'GET' && (req.url === '/' || req.url === '')) {
          const data = ensureDbFile();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.end(JSON.stringify(data));
          return;
        }

        if (method === 'POST' && (req.url === '/' || req.url === '')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed && Array.isArray(parsed.articles)) {
                saveDbFile(parsed);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: parsed.articles.length }));
              } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid data format' }));
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        next();
      });

      // 2. API: GET /api/fetch-metadata (AI Scan bài viết & trích xuất Tiêu đề, Ngày xuất bản, Thương hiệu)
      server.middlewares.use('/api/fetch-metadata', async (req, res) => {
        const urlObj = new URL(req.url || '', 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          let cleanUrl = targetUrl.trim();
          if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
          }

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 9000);

          const response = await fetch(cleanUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            },
          });
          clearTimeout(timer);

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch article URL' }));
            return;
          }

          const html = await response.text();

          // Lấy nhanh tên publisher từ URL
          const host = new URL(cleanUrl).hostname.toLowerCase();
          let fallbackPublisher = '';
          if (host.includes('kenh14')) fallbackPublisher = 'Kenh14';
          else if (host.includes('vnexpress')) fallbackPublisher = 'VnExpress';
          else if (host.includes('brandsvietnam')) fallbackPublisher = 'Brands Vietnam';
          else if (host.includes('dantri')) fallbackPublisher = 'Dân Trí';
          else if (host.includes('tuoitre')) fallbackPublisher = 'Tuổi Trẻ';
          else if (host.includes('cafebiz')) fallbackPublisher = 'CafeBiz';
          else if (host.includes('cafef')) fallbackPublisher = 'CafeF';
          else if (host.includes('vietcetera')) fallbackPublisher = 'Vietcetera';
          else if (host.includes('elle')) fallbackPublisher = 'ELLE Vietnam';
          else if (host.includes('lofficiel')) fallbackPublisher = "L'Officiel Vietnam";

          // Chuẩn bị text tinh gọn để gửi AI scan
          const strippedHtml = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
            .replace(/data:image\/[^;]+;base64,[^\s"']+/g, '')
            .slice(0, 15000);

          let aiResult: any = null;

          // Sử dụng Gemini AI để quét bài viết
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            try {
              const ai = new GoogleGenAI();
              const generatePromise = ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: `Bạn là trợ lý AI chuyên gia phân tích bài viết truyền thông & PR.
Nhiệm vụ của bạn là đọc nội dung HTML/văn bản bài viết được cung cấp dưới đây (từ link: ${cleanUrl}) và trích xuất các thông tin chính xác theo cấu trúc JSON.

YÊU CẦU ĐẶC BIỆT QUAN TRỌNG:
1. "brand": Tên THƯƠNG HIỆU / NHÃN HÀNG (đây là nhãn hàng/sản phẩm/doanh nghiệp được nhắc đến hoặc quảng bá trong bài viết, ví dụ: L'Oréal Paris, Toyota, Mazda, P/S, Unilever, BIDV, Heineken, PNJ, Shopee... TUYỆT ĐỐI KHÔNG ĐƯỢC LẤY TÊN TỜ BÁO/SITE BÁO NHƯ Kenh14, VnExpress, Dân Trí, Tuổi Trẻ).
2. "title": Tiêu đề bài viết thực tế đầy đủ, chuẩn tiếng Việt (nội dung tiêu đề bài báo, không lấy slug link, không kèm đuôi tên báo).
3. "date": Thời gian xuất bản bài viết theo định dạng MM/YYYY (ví dụ: 10/2026, 03/2026). Trích xuất từ ngày đăng của bài.
4. "publisher": Tên tờ báo / trang tin đăng tải (ví dụ: Kenh14, VnExpress, Brands Vietnam, Dân Trí...).
5. "category": Chọn 1 chuyên mục phù hợp nhất trong: Automotive, Beauty & Personal Care, Finance & Banking, FMCG & Beverage, Fashion & Jewelry, Tech & E-commerce (hoặc chuyên mục phù hợp).
6. "format": Chọn 1 định dạng phù hợp: PR Series, Editorial, Brand Campaign, Content Strategy, Executive Branding, Event & PR Copy, Sustainability PR, Case Study...
7. "summary": Tóm tắt ngắn gọn 1-2 câu về nội dung.

Chỉ trả về định dạng JSON thuần túy:
{
  "brand": "...",
  "title": "...",
  "date": "MM/YYYY",
  "publisher": "...",
  "category": "...",
  "format": "...",
  "summary": "..."
}

Nội dung bài viết:
${strippedHtml}`,
              });

              // Timeout sau 7 giây để không bị nghẽn
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI generation timed out')), 7000)
              );

              const aiResponse: any = await Promise.race([generatePromise, timeoutPromise]);
              const rawText = aiResponse?.text || '';
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
              }
            } catch (aiErr) {
              console.warn('Gemini AI scan timed out or failed, using fallback parser:', aiErr);
            }
          }

          // Fallback parsing nếu AI không khả dụng
          let title = aiResult?.title || '';
          if (!title) {
            const ogTitleMatch =
              html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
            title = ogTitleMatch && ogTitleMatch[1] ? ogTitleMatch[1] : '';
          }

          title = title
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s*[-–|]\s*(Kenh14(\.vn)?|Báo Dân trí|VnExpress(\.net)?|Brands Vietnam|Tuổi Trẻ Online|Thanh Niên|Znews|Zing News|CafeBiz|CafeF|Vietcetera|VTC News|VietnamNet|VOV|VTV|Dân Việt|Báo Đầu tư).*$/i, '')
            .trim();

          let brand = aiResult?.brand || '';
          if (!brand || brand.toLowerCase() === fallbackPublisher.toLowerCase()) {
            const lower = (title + ' ' + html.slice(0, 5000)).toLowerCase();
            if (lower.includes('chính nữ') || lower.includes("l'oréal") || lower.includes('loreal')) {
              brand = "L'Oréal Paris";
            } else if (lower.includes('toyota')) {
              brand = 'Toyota Việt Nam';
            } else if (lower.includes('mazda')) {
              brand = 'Mazda';
            } else if (lower.includes('vinfast')) {
              brand = 'VinFast';
            } else if (lower.includes('p/s') || lower.includes('unilever')) {
              brand = 'P/S';
            } else if (lower.includes('bidv')) {
              brand = 'BIDV';
            } else if (lower.includes('heineken')) {
              brand = 'Heineken Vietnam';
            } else if (lower.includes('huda')) {
              brand = 'Huda Beer';
            } else if (lower.includes('pnj')) {
              brand = 'PNJ';
            } else if (lower.includes('shopee')) {
              brand = 'Shopee';
            } else {
              brand = 'Thương hiệu';
            }
          }

          let date = aiResult?.date || '';
          if (!date) {
            const dateMatch =
              html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
              html.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i);
            if (dateMatch && dateMatch[1]) {
              const parsedDate = new Date(dateMatch[1]);
              if (!isNaN(parsedDate.getTime())) {
                date = `${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;
              }
            }
          }

          if (!date) {
            const regexDate = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
            const m = html.match(regexDate);
            if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) {
              date = `${String(m[2]).padStart(2, '0')}/${m[3]}`;
            }
          }

          const publisher = aiResult?.publisher || fallbackPublisher || 'Báo chí';
          const headline = title;
          let formattedTitle = `${brand} | ${headline}`;

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              aiScanned: Boolean(aiResult),
              title: formattedTitle,
              headline,
              brand,
              publisher,
              date: date || '10/2026',
              category: aiResult?.category || undefined,
              format: aiResult?.format || undefined,
              summary: aiResult?.summary || undefined,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Scrape failed' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), portfolioBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
