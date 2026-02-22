#!/usr/bin/env python3
import os
import re
import time
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from deep_translator import GoogleTranslator

BASE = "https://docs.deno.com"
ROOT = "https://docs.deno.com/sandbox/"
OUT = Path('.')
EN_DIR = OUT / 'en'
ZH_DIR = OUT / 'zh-tw'
ASSETS_DIR = OUT / 'assets'

session = requests.Session()
session.headers.update({"User-Agent": "deno-sandbox-docs-translator/1.0"})


def get_sandbox_urls():
    xml = session.get(urljoin(BASE, '/sitemap.xml'), timeout=30).text
    soup = BeautifulSoup(xml, 'xml')
    urls = []
    for loc in soup.find_all('loc'):
        u = loc.text.strip()
        if u.startswith(ROOT):
            urls.append(u)
    # deterministic order, home page first
    urls = sorted(set(urls), key=lambda x: (0 if x == ROOT else 1, x))
    return urls


def slug_from_url(url: str) -> str:
    path = urlparse(url).path
    path = path.strip('/')
    if path == 'sandbox':
        return 'index'
    if path.startswith('sandbox/'):
        return path[len('sandbox/'):].strip('/')
    return path.replace('/', '_')


def local_doc_path(url: str, lang_dir: Path) -> Path:
    return lang_dir / f"{slug_from_url(url)}.md"


def rewrite_sandbox_link(link: str):
    if not link:
        return link
    if link.startswith('#'):
        return link
    parsed = urlparse(link)
    target = None

    if parsed.scheme in ('http', 'https'):
        if not (parsed.netloc == 'docs.deno.com' and parsed.path.startswith('/sandbox/')):
            return link
        target = f"{slug_from_url('https://docs.deno.com' + parsed.path)}.md"
        if parsed.fragment:
            target += f"#{parsed.fragment}"
        return target

    if link.startswith('/sandbox/'):
        base = link.split('#', 1)[0]
        frag = link.split('#', 1)[1] if '#' in link else ''
        target = f"{slug_from_url('https://docs.deno.com' + base)}.md"
        if frag:
            target += f"#{frag}"
        return target

    return link


def should_download_asset(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https'):
        return False
    if parsed.netloc != 'docs.deno.com':
        return False
    p = parsed.path.lower()
    exts = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif', '.mp4', '.webm', '.pdf')
    return p.endswith(exts) or '/images/' in p


def local_asset_path(asset_url: str) -> Path:
    parsed = urlparse(asset_url)
    rel = parsed.path.lstrip('/')
    return ASSETS_DIR / rel


def download_asset(asset_url: str):
    p = local_asset_path(asset_url)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists() and p.stat().st_size > 0:
        return p
    r = session.get(asset_url, timeout=60)
    if r.status_code == 200:
        p.write_bytes(r.content)
        return p
    return None


def extract_article(url: str):
    html = session.get(url, timeout=30).text
    soup = BeautifulSoup(html, 'html.parser')
    article = soup.select_one('main article')
    if not article:
        raise RuntimeError(f"Cannot find main article for {url}")

    # remove page furniture
    for bad in article.select('details, nav[aria-label="Breadcrumb"], script, style, button'):
        bad.decompose()

    # remove jump-to-heading links
    for a in article.select('a[href^="#"]'):
        txt = a.get_text(' ', strip=True)
        if 'Jump to heading' in txt:
            a.decompose()

    # collect asset candidates from original article
    assets = set()
    for tag in article.select('img[src], source[src], a[href]'):
        attr = 'src' if tag.has_attr('src') else 'href'
        raw = tag.get(attr)
        if not raw:
            continue
        if attr == 'href' and tag.name == 'a' and not should_download_asset(urljoin(url, raw)):
            continue
        full = urljoin(url, raw)
        if should_download_asset(full):
            assets.add(full)

    # convert to markdown
    markdown = md(str(article), heading_style='ATX', bullets='-', strip=['button'], wrap=False)

    # cleanup artifacts
    markdown = re.sub(r'\s*\[Jump to heading#\]\(#[^)]+\)', '', markdown)
    markdown = re.sub(r'\n{3,}', '\n\n', markdown).strip() + '\n'

    return markdown, sorted(assets)


def chunk_text(text: str, max_chars: int = 4200):
    text = text.strip()
    if not text:
        return []
    parts = []
    current = []
    size = 0
    for sentence in re.split(r'(?<=[.!?。！？])\s+', text):
        if not sentence:
            continue
        if size + len(sentence) + 1 > max_chars and current:
            parts.append(' '.join(current).strip())
            current = [sentence]
            size = len(sentence)
        else:
            current.append(sentence)
            size += len(sentence) + 1
    if current:
        parts.append(' '.join(current).strip())
    return parts


def translate_text(text: str, translator: GoogleTranslator) -> str:
    if not re.search(r'[A-Za-z]', text):
        return text
    out = []
    for c in chunk_text(text):
        tries = 0
        while True:
            tries += 1
            try:
                out.append(translator.translate(c))
                break
            except Exception:
                if tries >= 4:
                    out.append(c)
                    break
                time.sleep(1.2 * tries)
    return ' '.join(out)


def translate_line(line: str, translator: GoogleTranslator) -> str:
    # preserve list/heading prefixes
    m = re.match(r'^(\s{0,3}(?:[-*+]\s+|\d+\.\s+|#{1,6}\s+|>\s+)?)', line)
    prefix = m.group(1) if m else ''
    body = line[len(prefix):]

    if not body.strip():
        return line

    placeholders = {}
    idx = 0

    def put(token):
        nonlocal idx
        key = f"__PH_{idx}__"
        placeholders[key] = token
        idx += 1
        return key

    # protect inline code
    body = re.sub(r'`[^`]+`', lambda m: put(m.group(0)), body)

    # links/images: translate label only, keep URL
    link_re = re.compile(r'(!?)\[([^\]]*)\]\(([^)]+)\)')

    def repl_link(m):
        bang, label, link = m.group(1), m.group(2), m.group(3)
        new_label = translate_text(label, translator) if label.strip() else label
        return put(f"{bang}[{new_label}]({link})")

    body = link_re.sub(repl_link, body)

    # protect bare URLs
    body = re.sub(r'https?://\S+', lambda m: put(m.group(0)), body)

    translated = translate_text(body, translator)

    for k, v in placeholders.items():
        translated = translated.replace(k, v)

    # prefer product naming consistency
    replacements = {
        'Deno 沙箱': 'Deno Sandbox',
        '沙箱': '沙箱',
        '組織權杖': '組織 Token',
        '代幣': 'Token',
    }
    for a, b in replacements.items():
        translated = translated.replace(a, b)

    return prefix + translated


def translate_markdown(markdown: str) -> str:
    translator = GoogleTranslator(source='en', target='zh-TW')
    lines = markdown.splitlines()
    out = []
    in_code = False

    for line in lines:
        if line.strip().startswith('```'):
            in_code = not in_code
            out.append(line)
            continue
        if in_code:
            out.append(line)
            continue

        # keep single-word file names before code blocks as-is
        if re.match(r'^[\w.-]+\.(ts|js|tsx|jsx|py|json|yaml|yml|sh|bash)$', line.strip()):
            out.append(line)
            continue

        out.append(translate_line(line, translator))

    text = '\n'.join(out).strip() + '\n'

    # proofreading pass for common terms
    proof = {
        '開始使用': '開始使用',
        '儀表板': '主控台',
        '環境變數': '環境變數',
        '命令列': '命令列',
        '部署': 'Deploy',
        '標誌': '旗標',
    }
    for a, b in proof.items():
        text = text.replace(a, b)

    return text


def rewrite_links_for_local(markdown_text: str):
    link_re = re.compile(r'(!?)\[([^\]]*)\]\(([^)]+)\)')

    def repl(m):
        bang, label, url = m.group(1), m.group(2), m.group(3).strip()
        parsed = urlparse(url)
        path = parsed.path
        frag = f"#{parsed.fragment}" if parsed.fragment else ""

        def rebuild(new_url):
            return f"{bang}[{label}]({new_url})"

        if parsed.scheme in ('http', 'https') and parsed.netloc == 'docs.deno.com':
            if path.startswith('/sandbox/images/') or should_download_asset(url):
                return rebuild(f"../assets{path}")
            if path.startswith('/sandbox/'):
                return rebuild(f"{slug_from_url('https://docs.deno.com' + path)}.md{frag}")
            return m.group(0)

        if url.startswith('/sandbox/images/'):
            return rebuild(f"../assets{path}")
        if url.startswith('/sandbox/') and not should_download_asset(urljoin(BASE, url)):
            return rebuild(f"{slug_from_url(urljoin(BASE, url))}.md{frag}")
        if should_download_asset(urljoin(BASE, url)) and url.startswith('/'):
            return rebuild(f"../assets{path}")

        return m.group(0)

    return link_re.sub(repl, markdown_text)


def main():
    EN_DIR.mkdir(parents=True, exist_ok=True)
    ZH_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    urls = get_sandbox_urls()
    manifest = []

    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] Processing {url}")
        slug = slug_from_url(url)

        md_en, assets = extract_article(url)
        md_en = rewrite_links_for_local(md_en)
        en_path = local_doc_path(url, EN_DIR)
        en_path.parent.mkdir(parents=True, exist_ok=True)
        en_path.write_text(md_en, encoding='utf-8')

        dl = []
        for a in assets:
            p = download_asset(a)
            if p:
                dl.append(str(p).replace('\\', '/'))

        md_zh = translate_markdown(md_en)
        zh_path = local_doc_path(url, ZH_DIR)
        zh_path.parent.mkdir(parents=True, exist_ok=True)
        zh_path.write_text(md_zh, encoding='utf-8')

        manifest.append({
            'url': url,
            'slug': slug,
            'en': str(en_path).replace('\\', '/'),
            'zh_tw': str(zh_path).replace('\\', '/'),
            'assets_downloaded': dl,
        })

    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Done. Pages: {len(urls)}")


if __name__ == '__main__':
    main()
