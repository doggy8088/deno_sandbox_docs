export type LanguageCode = 'en' | 'zh-tw';

export interface RawManifestEntry {
  url: string;
  slug: string;
  en: string;
  zh_tw: string;
  assets_downloaded?: string[];
}

export interface ManifestEntry {
  sourceUrl: string;
  slug: string;
  paths: Record<LanguageCode, string>;
  assetsDownloaded: string[];
}

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface RenderedPage {
  lang: LanguageCode;
  slug: string;
  title: string;
  articleHtml: string;
  headings: Heading[];
  plainText: string;
  sourceMarkdownPath: string;
}

export interface SitePage extends RenderedPage {
  routePath: string;
  outputFilePath: string;
  siblingLangRoute: string;
  sourceUrl: string;
}

export interface BuildOptions {
  outDir: string;
  baseUrl: string;
  clean: boolean;
  minify: boolean;
  lang: LanguageCode | 'all';
  validateOnly: boolean;
}

export interface SearchPage {
  id: number;
  slug: string;
  title: string;
  url: string;
  excerpt: string;
}

export interface SearchIndex {
  version: 1;
  lang: LanguageCode;
  pages: SearchPage[];
  invertedIndex: Record<string, number[]>;
  titleTokens: Record<string, number[]>;
  metadata: {
    generatedAt: string;
    tokenizer: 'word' | 'bigram';
  };
}
