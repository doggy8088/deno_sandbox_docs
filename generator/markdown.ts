import { marked } from 'npm:marked@14.1.2';
import hljs from 'npm:highlight.js@11.10.0';
import type { Heading, LanguageCode, RenderedPage } from './types.ts';
import {
  collectHeadingText,
  escapeHtml,
  stripMarkdown,
  validateSingleH1,
} from './util.ts';

marked.setOptions({
  gfm: true,
  breaks: false,
});

function renderMarkdownToHtml(markdown: string): string {
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }) => {
    const language = (lang || '').trim();
    let body = escapeHtml(text);
    let className = '';
    if (language && hljs.getLanguage(language)) {
      try {
        body = hljs.highlight(text, { language }).value;
        className = ` class="hljs language-${language}"`;
      } catch {
        className = ` class="language-${language}"`;
      }
    } else if (language) {
      className = ` class="language-${language}"`;
    } else {
      className = ' class="hljs"';
    }
    return `<pre><code${className}>${body}</code></pre>\n`;
  };
  return marked.parse(markdown, { renderer }) as string;
}

function injectHeadingIds(html: string, headings: Heading[]): string {
  let idx = 0;
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (m, depthStr, inner) => {
    const depth = Number(depthStr);
    const heading = headings[idx];
    if (!heading || heading.depth !== depth) return m;
    idx++;
    return `<h${depth} id="${heading.id}">${inner}</h${depth}>`;
  });
}

function rewriteHtmlLinks(html: string, lang: LanguageCode, baseUrl: string): string {
  return html.replace(/(<a\s+[^>]*href=")([^"]+)(")/g, (_m, p1, href, p3) => {
    const out = rewriteHref(href, lang, baseUrl);
    return `${p1}${out}${p3}`;
  }).replace(/(<img\s+[^>]*src=")([^"]+)(")/g, (_m, p1, src, p3) => {
    if (src.startsWith('../assets/')) {
      const rel = src.replace(/^\.\.\//, '');
      return `${p1}${normalizeBase(baseUrl)}${rel}${p3}`;
    }
    return `${p1}${src}${p3}`;
  });
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

export function rewriteHref(href: string, lang: LanguageCode, baseUrl: string): string {
  if (!href || href.startsWith('#')) return href;
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) return href;
  if (href.startsWith('../assets/')) {
    return `${normalizeBase(baseUrl)}${href.replace(/^\.\.\//, '')}`;
  }
  const [path, frag] = href.split('#');
  if (path.endsWith('.md')) {
    const slug = path.replace(/\\/g, '/').split('/').pop()!.replace(/\.md$/i, '');
    const route = slug === 'index' ? `${lang}/` : `${lang}/${slug}/`;
    return `${normalizeBase(baseUrl)}${route}${frag ? `#${frag}` : ''}`.replace(/\/{2,}/g, '/');
  }
  return href;
}

export function renderPage(
  lang: LanguageCode,
  slug: string,
  markdown: string,
  sourceMarkdownPath: string,
  baseUrl: string,
): RenderedPage {
  const title = validateSingleH1(markdown);
  const headings = collectHeadingText(markdown);
  let html = renderMarkdownToHtml(markdown);
  html = injectHeadingIds(html, headings);
  html = rewriteHtmlLinks(html, lang, baseUrl);
  return {
    lang,
    slug,
    title,
    articleHtml: html,
    headings,
    plainText: stripMarkdown(markdown),
    sourceMarkdownPath,
  };
}

export function pageToc(headings: Heading[]): Heading[] {
  return headings.filter((h) => h.depth >= 2);
}
