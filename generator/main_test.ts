import {
  assert,
  assertEquals,
  assertStringIncludes,
} from 'jsr:@std/assert@1';
import { parseArgs } from './main.ts';
import { rewriteHref } from './markdown.ts';
import { tokenizeEn, tokenizeZhTwNgram, buildSearchIndex } from './search.ts';
import type { SitePage } from './types.ts';
import { makeHeadingId, normalizeBaseUrl, slugToRoute } from './util.ts';

Deno.test('normalizeBaseUrl and slug routes', () => {
  assertEquals(normalizeBaseUrl('docs'), '/docs/');
  assertEquals(slugToRoute('en', 'index', '/docs'), '/docs/en/');
  assertEquals(slugToRoute('zh-tw', 'security', '/'), '/zh-tw/security/');
});

Deno.test('parseArgs supports build flags', () => {
  const { command, options } = parseArgs(['build', '--out', 'site', '--clean', '--lang', 'en']);
  assertEquals(command, 'build');
  assertEquals(options.outDir, 'site');
  assert(options.clean);
  assertEquals(options.lang, 'en');
});

Deno.test('rewriteHref rewrites markdown links and assets', () => {
  assertEquals(rewriteHref('security.md#outbound', 'en', '/docs/'), '/docs/en/security/#outbound');
  assertEquals(rewriteHref('../assets/sandbox/images/x.webp', 'en', '/'), '/assets/sandbox/images/x.webp');
  assertEquals(rewriteHref('https://example.com', 'en', '/'), 'https://example.com');
});

Deno.test('heading ids are stable with duplicates', () => {
  const seen = new Map<string, number>();
  assertEquals(makeHeadingId('Configuring your sandbox', seen), 'configuring-your-sandbox');
  assertEquals(makeHeadingId('Configuring your sandbox', seen), 'configuring-your-sandbox-2');
});

Deno.test('tokenizers support en and zh-tw', () => {
  assert(tokenizeEn('Deno Sandbox Token').includes('sandbox'));
  const zh = tokenizeZhTwNgram('沙箱搜尋');
  assert(zh.includes('沙箱'));
  assert(zh.includes('搜'));
});

Deno.test('search index builds expected maps', () => {
  const pages: SitePage[] = [
    {
      lang: 'en',
      slug: 'index',
      title: 'Deno Sandbox',
      articleHtml: '',
      headings: [],
      plainText: 'Deno Sandbox overview and security tokens',
      sourceMarkdownPath: 'en/index.md',
      routePath: '/en/',
      outputFilePath: 'dist/en/index.html',
      siblingLangRoute: '/zh-tw/',
      sourceUrl: 'https://docs.deno.com/sandbox/',
    },
    {
      lang: 'en',
      slug: 'security',
      title: 'Security',
      articleHtml: '',
      headings: [],
      plainText: 'Outbound network control and secret substitution',
      sourceMarkdownPath: 'en/security.md',
      routePath: '/en/security/',
      outputFilePath: 'dist/en/security/index.html',
      siblingLangRoute: '/zh-tw/security/',
      sourceUrl: 'https://docs.deno.com/sandbox/security/',
    },
  ];
  const idx = buildSearchIndex('en', pages);
  assertStringIncludes(JSON.stringify(idx.invertedIndex), 'sandbox');
  assert(idx.titleTokens['security'].includes(1));
});
