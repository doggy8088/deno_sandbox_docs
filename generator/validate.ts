import type { LanguageCode, SitePage } from './types.ts';

export function validateRenderedPages(pages: SitePage[]): string[] {
  const errors: string[] = [];
  const routeSet = new Set(pages.map((p) => p.routePath.replace(/#.*$/, '')));
  for (const page of pages) {
    for (const m of page.articleHtml.matchAll(/<a\s+[^>]*href="([^"]+)"/g)) {
      const href = m[1];
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
      if (href.includes('/assets/')) continue;
      const normalized = href.replace(/#.*$/, '');
      if (!routeSet.has(normalized)) errors.push(`Broken internal link in ${page.slug} (${page.lang}): ${href}`);
    }
  }
  return errors;
}

export function groupPagesBySlug(pages: SitePage[]): Map<string, Record<LanguageCode, SitePage>> {
  const map = new Map<string, Record<LanguageCode, SitePage>>();
  for (const page of pages) {
    const group = map.get(page.slug) ?? ({} as Record<LanguageCode, SitePage>);
    group[page.lang] = page;
    map.set(page.slug, group);
  }
  return map;
}
