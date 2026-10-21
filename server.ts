import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route to fetch real article metadata from URL
app.get('/api/fetch-metadata', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch URL: ${response.statusText}` });
    }

    const html = await response.text();

    // 1. Extract title from og:title, twitter:title, or <title>
    let title = '';
    const ogTitleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1];
    } else {
      const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
      if (twitterTitleMatch && twitterTitleMatch[1]) {
        title = twitterTitleMatch[1];
      } else {
        const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleTagMatch && titleTagMatch[1]) {
          title = titleTagMatch[1];
        }
      }
    }

    // Decode HTML entities
    title = title
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Remove site suffixes (e.g. "- Kenh14.vn", "| Báo Dân trí", "- Báo Tuổi Trẻ", "| VnExpress")
    title = title
      .replace(/\s*[-–|]\s*(Kenh14(\.vn)?|Báo Dân trí|VnExpress(\.net)?|Brands Vietnam|Tuổi Trẻ Online|Thanh Niên|Znews|Zing News|CafeBiz|CafeF|Vietcetera|VTC News|VietnamNet|VOV|VTV|Dân Việt|Báo Đầu tư).*$/i, '')
      .trim();

    // 2. Extract site name / publisher
    let publisher = '';
    const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSiteMatch && ogSiteMatch[1]) {
      publisher = ogSiteMatch[1].trim();
    }

    const parsedUri = new URL(cleanUrl);
    const host = parsedUri.hostname.toLowerCase();
    if (!publisher || publisher.length < 2) {
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

    // 3. Extract published date (MM/YYYY)
    let date = '';
    const dateMatch =
      html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i);

    if (dateMatch && dateMatch[1]) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const yyyy = parsedDate.getFullYear();
        date = `${mm}/${yyyy}`;
      }
    }

    if (!date) {
      // Look for DD/MM/YYYY pattern in html content
      const regexDate = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
      const matchText = html.match(regexDate);
      if (matchText) {
        const mm = String(matchText[2]).padStart(2, '0');
        const yyyy = matchText[3];
        if (Number(mm) >= 1 && Number(mm) <= 12 && Number(yyyy) >= 2000 && Number(yyyy) <= 2035) {
          date = `${mm}/${yyyy}`;
        }
      }
    }

    // 4. Extract description
    let summary = '';
    const descMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

    // 5. Detect Brand name to enforce "Thương hiệu | Tiêu đề bài viết"
    let brand = '';
    const lowerTitle = title.toLowerCase();
    const lowerHtml = html.slice(0, 10000).toLowerCase();

    if (lowerTitle.includes("chính nữ") || lowerTitle.includes("l'oréal") || lowerTitle.includes("l’oréal") || lowerHtml.includes("l'oréal paris")) {
      brand = "L'Oréal Paris";
    } else if (lowerTitle.includes("toyota") || lowerHtml.includes("toyota")) {
      brand = "Toyota Việt Nam";
    } else if (lowerTitle.includes("mazda") || lowerHtml.includes("mazda")) {
      brand = "Mazda";
    } else if (lowerTitle.includes("vinfast")) {
      brand = "VinFast";
    } else if (lowerTitle.includes("p/s") || lowerTitle.includes("unilever")) {
      brand = "P/S";
    } else if (lowerTitle.includes("bidv")) {
      brand = "BIDV";
    } else if (lowerTitle.includes("phú hưng")) {
      brand = "Phú Hưng Securities";
    } else if (lowerTitle.includes("huda")) {
      brand = "Huda Beer";
    } else if (lowerTitle.includes("heineken")) {
      brand = "Heineken Vietnam";
    } else if (lowerTitle.includes("pnj")) {
      brand = "PNJ";
    } else if (lowerTitle.includes("shopee")) {
      brand = "Shopee";
    } else if (publisher) {
      brand = publisher;
    } else {
      brand = 'Thương hiệu';
    }

    const headline = title;
    let formattedTitle = title;
    if (!formattedTitle.includes(' | ') && !formattedTitle.includes(' — ')) {
      formattedTitle = `${brand} | ${headline}`;
    } else if (formattedTitle.includes(' — ')) {
      formattedTitle = formattedTitle.replace(/\s*—\s*/g, ' | ');
    }

    return res.json({
      success: true,
      title: formattedTitle,
      headline,
      brand,
      publisher: publisher || undefined,
      date: date || undefined,
      summary: summary || undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to parse metadata' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
