import type { Heading, LanguageCode, ManifestEntry, SitePage } from './types.ts';
import { escapeHtml, joinUrl } from './util.ts';

function renderSidebar(
  current: SitePage,
  navPages: SitePage[],
): string {
  return `<nav class="sidebar-nav" aria-label="Page navigation">
${navPages.map((p) => {
    const cls = p.slug === current.slug ? ' class="active"' : '';
    return `  <a${cls} href="${p.routePath}">${escapeHtml(p.title)}</a>`;
  }).join('\n')}
</nav>`;
}

function renderToc(headings: Heading[]): string {
  const items = headings.filter((h) => h.depth >= 2);
  if (!items.length) return '<div class="toc-empty">No sections</div>';
  return `<ol class="toc-list">
${items.map((h) => `  <li class="d${h.depth}"><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`).join('\n')}
</ol>`;
}

export function renderHtmlPage(opts: {
  page: SitePage;
  navPagesForLang: SitePage[];
  baseUrl: string;
  allPagesBySlug: Map<string, Record<LanguageCode, SitePage>>;
}): string {
  const { page, navPagesForLang, baseUrl, allPagesBySlug } = opts;
  const pair = allPagesBySlug.get(page.slug);
  const enPage = pair?.en;
  const zhPage = pair?.['zh-tw'];
  const stylesheet = joinUrl(baseUrl, '_static/styles.css');
  const searchJs = joinUrl(baseUrl, '_static/search.js');
  const siteJs = joinUrl(baseUrl, '_static/site.js');
  const langSearchUrl = joinUrl(baseUrl, `search/${page.lang}.json`);

  return `<!doctype html>
<html lang="${page.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} | Deno Sandbox Docs</title>
  <link rel="stylesheet" href="${stylesheet}">
</head>
<body data-lang="${page.lang}" data-search-index="${langSearchUrl}">
  <header class="site-header">
    <a class="brand" href="${page.lang === 'en' ? (enPage?.routePath ?? page.routePath) : (zhPage?.routePath ?? page.routePath)}">Deno Sandbox Docs</a>
    <div class="header-actions">
      <button id="nav-toggle" class="ghost" type="button" aria-expanded="false" aria-controls="sidebar">Menu</button>
      <label class="search-wrap">
        <span class="sr-only">Search docs</span>
        <input id="search-input" type="search" placeholder="${page.lang === 'en' ? 'Search docs' : '搜尋文件'}">
      </label>
      <div class="lang-switch">
        <a ${page.lang === 'en' ? 'aria-current="page"' : ''} href="${enPage?.routePath ?? '#'}">EN</a>
        <a ${page.lang === 'zh-tw' ? 'aria-current="page"' : ''} href="${zhPage?.routePath ?? '#'}">繁中</a>
      </div>
    </div>
  </header>
  <div class="layout">
    <aside id="sidebar" class="sidebar">${renderSidebar(page, navPagesForLang)}</aside>
    <main class="content">
      <div id="search-results" class="search-results" hidden></div>
      <article class="article">${page.articleHtml}</article>
    </main>
    <aside class="toc" aria-label="Table of contents">
      <h2>${page.lang === 'en' ? 'On this page' : '本頁內容'}</h2>
      ${renderToc(page.headings)}
    </aside>
  </div>
  <footer class="site-footer">
    <a href="${page.sourceUrl}" target="_blank" rel="noopener noreferrer">Source</a>
  </footer>
  <script type="module" src="${searchJs}"></script>
  <script type="module" src="${siteJs}"></script>
</body>
</html>`;
}

export function renderRootIndex(baseUrl: string): string {
  const target = joinUrl(baseUrl, 'zh-tw/');
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><script>location.replace(${JSON.stringify(target)});</script></head><body><a href="${target}">Open docs</a></body></html>`;
}
