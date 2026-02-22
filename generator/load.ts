import type { LanguageCode, ManifestEntry, RawManifestEntry } from './types.ts';

export async function loadManifest(root = Deno.cwd()): Promise<ManifestEntry[]> {
  const path = `${root}/manifest.json`;
  const raw = JSON.parse(await Deno.readTextFile(path)) as RawManifestEntry[];
  const slugs = new Set<string>();
  return raw.map((entry, idx) => {
    if (!entry.slug || !entry.en || !entry.zh_tw || !entry.url) {
      throw new Error(`manifest.json entry ${idx} missing required keys`);
    }
    if (slugs.has(entry.slug)) throw new Error(`Duplicate slug in manifest: ${entry.slug}`);
    slugs.add(entry.slug);
    return {
      sourceUrl: entry.url,
      slug: entry.slug,
      paths: { en: entry.en, 'zh-tw': entry.zh_tw },
      assetsDownloaded: entry.assets_downloaded ?? [],
    };
  });
}

export async function readMarkdown(path: string): Promise<string> {
  return await Deno.readTextFile(path);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function validateInputs(
  manifest: ManifestEntry[],
  langs: LanguageCode[],
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];
  for (const entry of manifest) {
    for (const lang of langs) {
      const p = entry.paths[lang];
      if (!(await fileExists(p))) throw new Error(`Missing markdown file: ${p}`);
    }
    for (const asset of entry.assetsDownloaded) {
      if (!(await fileExists(asset))) warnings.push(`Missing manifest asset file: ${asset}`);
    }
  }
  return { warnings };
}
