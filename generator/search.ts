import type { LanguageCode, SearchIndex, SearchPage, SitePage } from './types.ts';
import { excerptFromText } from './util.ts';

export function tokenizeEn(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [])
    .filter((t) => t.length >= 2);
}

export function tokenizeZhTwNgram(text: string): string[] {
  const chars = [...text.replace(/\s+/g, '').trim()];
  const out: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const a = chars[i];
    if (/\p{L}|\p{N}/u.test(a)) out.push(a.toLowerCase());
    if (i < chars.length - 1) {
      const bg = `${chars[i]}${chars[i + 1]}`.toLowerCase();
      if ([...bg].every((c) => /\p{L}|\p{N}/u.test(c))) out.push(bg);
    }
  }
  return out;
}

function addIndex(map: Record<string, number[]>, token: string, pageId: number) {
  const arr = map[token] ?? (map[token] = []);
  if (arr[arr.length - 1] !== pageId) arr.push(pageId);
}

export function buildSearchIndex(lang: LanguageCode, pages: SitePage[]): SearchIndex {
  const invertedIndex: Record<string, number[]> = {};
  const titleTokens: Record<string, number[]> = {};
  const searchPages: SearchPage[] = [];
  const tokenizer = lang === 'en' ? tokenizeEn : tokenizeZhTwNgram;

  pages.forEach((page, id) => {
    searchPages.push({
      id,
      slug: page.slug,
      title: page.title,
      url: page.routePath,
      excerpt: excerptFromText(page.plainText),
    });
    for (const t of new Set(tokenizer(page.plainText))) addIndex(invertedIndex, t, id);
    for (const t of new Set(tokenizer(page.title))) addIndex(titleTokens, t, id);
  });

  return {
    version: 1,
    lang,
    pages: searchPages,
    invertedIndex,
    titleTokens,
    metadata: {
      generatedAt: new Date().toISOString(),
      tokenizer: lang === 'en' ? 'word' : 'bigram',
    },
  };
}
