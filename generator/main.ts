#!/usr/bin/env -S deno run -A
import type { BuildOptions, LanguageCode, ManifestEntry, SitePage } from './types.ts';
import { emptyDir, copyDir } from './assets.ts';
import { loadManifest, readMarkdown, validateInputs } from './load.ts';
import { renderPage } from './markdown.ts';
import { buildSearchIndex } from './search.ts';
import { renderHtmlPage, renderRootIndex } from './templates.ts';
import { groupPagesBySlug, validateRenderedPages } from './validate.ts';
import { normalizeBaseUrl, routeToOutputPath, slugToRoute } from './util.ts';

function parseArgs(args: string[]): { command: string; options: BuildOptions } {
  const command = args[0] ?? 'build';
  const opts: BuildOptions = {
    outDir: 'dist',
    baseUrl: '/',
    clean: false,
    minify: false,
    lang: 'all',
    validateOnly: false,
  };
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--') continue;
    if (a === '--out') opts.outDir = args[++i];
    else if (a === '--base-url') opts.baseUrl = args[++i];
    else if (a === '--clean') opts.clean = true;
    else if (a === '--minify') opts.minify = true;
    else if (a === '--validate-only') opts.validateOnly = true;
    else if (a === '--lang') {
      const v = args[++i];
      if (v !== 'en' && v !== 'zh-tw' && v !== 'all') throw new Error(`Invalid --lang ${v}`);
      opts.lang = v;
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  opts.baseUrl = normalizeBaseUrl(opts.baseUrl);
  return { command, options: opts };
}

async function writeText(path: string, text: string) {
  const dir = path.substring(0, path.lastIndexOf('/'));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, text);
}

async function buildSite(options: BuildOptions) {
  const manifest = await loadManifest();
  const langs: LanguageCode[] = options.lang === 'all' ? ['en', 'zh-tw'] : [options.lang];
  const { warnings } = await validateInputs(manifest, langs);
  for (const w of warnings) console.warn('Warning:', w);

  const pages: SitePage[] = [];
  for (const entry of manifest) {
    for (const lang of langs) {
      const sourcePath = entry.paths[lang];
      const markdown = await readMarkdown(sourcePath);
      const rendered = renderPage(lang, entry.slug, markdown, sourcePath, options.baseUrl);
      pages.push({
        ...rendered,
        routePath: slugToRoute(lang, entry.slug, options.baseUrl),
        outputFilePath: routeToOutputPath(lang, entry.slug, options.outDir),
        siblingLangRoute: slugToRoute(lang === 'en' ? 'zh-tw' : 'en', entry.slug, options.baseUrl),
        sourceUrl: entry.sourceUrl,
      });
    }
  }

  const linkErrors = validateRenderedPages(pages);
  if (linkErrors.length) throw new Error(linkErrors.join('\n'));
  if (options.validateOnly) {
    console.log(`Validation OK: ${pages.length} pages`);
    return;
  }

  if (options.clean) await emptyDir(options.outDir);
  await Deno.mkdir(options.outDir, { recursive: true });
  await copyDir('assets', `${options.outDir}/assets`).catch(() => {});
  await copyDir('generator/static', `${options.outDir}/_static`);

  const grouped = groupPagesBySlug(pages);
  for (const page of pages) {
    const navPages = pages.filter((p) => p.lang === page.lang);
    const html = renderHtmlPage({
      page,
      navPagesForLang: navPages,
      baseUrl: options.baseUrl,
      allPagesBySlug: grouped,
    });
    await writeText(page.outputFilePath, options.minify ? minifyHtml(html) : html);
  }

  for (const lang of langs) {
    const langPages = pages.filter((p) => p.lang === lang);
    const index = buildSearchIndex(lang, langPages);
    await writeText(`${options.outDir}/search/${lang}.json`, JSON.stringify(index));
  }

  await writeText(`${options.outDir}/index.html`, renderRootIndex(options.baseUrl));
  console.log(`Built ${pages.length} pages -> ${options.outDir}`);
}

function minifyHtml(html: string): string {
  return html.replace(/\n{2,}/g, '\n').replace(/>\s+</g, '><').trim();
}

if (import.meta.main) {
  const { command, options } = parseArgs(Deno.args);
  if (command !== 'build') throw new Error(`Unsupported command: ${command}`);
  await buildSite(options);
}

export { buildSite, parseArgs };
