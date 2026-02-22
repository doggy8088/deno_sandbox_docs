import type { Heading, LanguageCode } from './types.ts';

export function normalizeBaseUrl(input: string): string {
  let out = (input || '/').trim();
  if (!out.startsWith('/')) out = '/' + out;
  if (!out.endsWith('/')) out += '/';
  return out;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function slugToRoute(lang: LanguageCode, slug: string, baseUrl = '/'): string {
  const base = normalizeBaseUrl(baseUrl);
  const suffix = slug === 'index' ? `${lang}/` : `${lang}/${slug}/`;
  return `${base}${suffix}`.replace(/\/{2,}/g, '/').replace(/^\/$/, '/');
}

export function routeToOutputPath(lang: LanguageCode, slug: string, outDir: string): string {
  if (slug === 'index') return `${outDir}/${lang}/index.html`;
  return `${outDir}/${lang}/${slug}/index.html`;
}

export function makeHeadingId(text: string, seen: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'section';
  const n = (seen.get(base) ?? 0) + 1;
  seen.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

export function joinUrl(baseUrl: string, rel: string): string {
  const base = normalizeBaseUrl(baseUrl);
  return `${base}${rel.replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/');
}

export function excerptFromText(text: string, query = '', maxLen = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const q = query.trim().toLowerCase();
  if (!q) return clean.slice(0, maxLen);
  const idx = clean.toLowerCase().indexOf(q);
  if (idx < 0) return clean.slice(0, maxLen);
  const start = Math.max(0, idx - 50);
  return clean.slice(start, start + maxLen);
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export function validateSingleH1(markdown: string): string {
  const matches = [...markdown.matchAll(/^#\s+(.+)$/gm)];
  if (matches.length === 0) throw new Error('Missing H1 title');
  return matches[0][1].trim();
}

export function collectHeadingText(markdown: string): Heading[] {
  const seen = new Map<string, number>();
  const out: Heading[] = [];
  for (const m of markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)) {
    const depth = m[1].length;
    const text = m[2].trim();
    out.push({ depth, text, id: makeHeadingId(text, seen) });
  }
  return out;
}
