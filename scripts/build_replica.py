#!/usr/bin/env python3
"""Fetch and localize OpenReplay tool pages into an offline extension replica.

The generated pages keep the original markup, styles and per-tool logic so the
UI is identical to https://openreplay.com/zh/tools/<slug>/. Analytics calls are
removed and all assets are rewritten to local paths.
"""
import concurrent.futures
import html as html_mod
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = 'https://openreplay.com'
ROOT = Path(__file__).resolve().parents[1]
REPLICA = ROOT / 'replica'
PAGES = REPLICA / 'pages'
ASSETS = REPLICA / 'assets'
ROOT_ASSETS = REPLICA / 'root'
HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; OpenDevToolboxReplicaBuilder/1.0)'}

ASSET_EXT = re.compile(r'\.(?:svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|mp4|wasm)(?:\?|$)', re.I)


def fetch(url, tries=3):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=45) as resp:
                return resp.read()
        except Exception as exc:  # noqa: BLE001 - network retries
            last = exc
            time.sleep(0.4 * (attempt + 1))
    raise RuntimeError(f'failed to fetch {url}: {last}')


def text(url):
    return fetch(url).decode('utf-8', 'replace')


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        data = data.encode('utf-8')
    path.write_bytes(data)


def collect_asset_paths(source):
    found = set()
    for m in re.finditer(r'(?:src|href)="/([^"#?]+)"', source):
        if ASSET_EXT.search(m.group(1)):
            found.add(m.group(1).split('?')[0])
    for m in re.finditer(r'url\(\s*[\'\"]?/([^\)\'\"]+)', source):
        found.add(m.group(1).split('?')[0])
    return found


def localize_external_js(js):
    """Fetch relative imports from /_astro assets and rewrite root asset URLs."""
    queue = []
    for m in re.finditer(r'[\'\"]\./([A-Za-z0-9_.@-]+\.js)[\'\"]', js):
        name = m.group(1)
        if name not in fetched_js:
            queue.append(name)
    for name in queue:
        fetched_js.add(name)
        try:
            data = text(f'{BASE}/_astro/{name}')
        except RuntimeError as exc:
            print('  JS import warning:', exc)
            continue
        data = localize_external_js(data)
        save(ASSETS / name, data)
    js = re.sub(r'(url\(\s*[\'\"])/([^\)\'\"]+)', r'\1../root/\2', js)
    return js


fetched_js = set()


TRACKER_STUB = """// OpenReplay site analytics removed for the offline replica.
window.tracker = { event() {}, start() {}, use() {}, stop() {}, setUserId() {} };
"""


def fetch_asset(name):
    if name in fetched_js:
        return
    fetched_js.add(name)
    data = text(f'{BASE}/_astro/{name}')
    if name.endswith('.js'):
        if name.startswith('OpenReplay.astro_astro_type_script_index_1_lang'):
            data = TRACKER_STUB
        else:
            data = localize_external_js(data)
    elif name.endswith('.css'):
        data = re.sub(r'(url\(\s*[\'\"]?)/([^\)\'\"]+)', r'\1../root/\2', data)
    save(ASSETS / name, data)


def fetch_root_asset(path):
    target = ROOT_ASSETS / path
    if target.exists():
        return
    try:
        save(target, fetch(f'{BASE}/{path}'))
    except RuntimeError as exc:
        print('  asset warning:', exc)


def slug_from_url(url):
    return url.rstrip('/').rsplit('/', 1)[-1]


def first_section(markup):
    """Return the first top-level <section> with balanced nesting."""
    start_m = re.search(r'<section\b', markup)
    if not start_m:
        return markup
    start = start_m.start()
    depth = 0
    for m in re.finditer(r'<(/?)section\b[^>]*>', markup[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return markup[start:start + m.end()]
    return markup[start:]


def trim_to_widget(html, title):
    """Keep only the tool widget, its styles, i18n data and executable scripts."""
    main = re.search(r'<main[^>]*>(.*?)</main>', html, re.S)
    widget = first_section(main.group(1)) if main else html
    styles = ''.join(f'<link rel="stylesheet" href="{u}">' for u in re.findall(r'<link\b[^>]*href="(\.\./assets/[^"]+\.css)"', html))
    i18n_m = re.search(r'<script[^>]*id="tool-i18n"[^>]*>.*?</script>', html, re.S)
    i18n = i18n_m.group(0) if i18n_m else ''
    scripts = ''.join(m.group(0) for m in re.finditer(r'<script\b[^>]*src="[^"]+"[^>]*>\s*</script>', html))
    safe_title = html_mod.escape(title)
    return f'''<!doctype html>
<html lang="zh-Hans">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{safe_title}</title>
{styles}
<style>
  body {{ margin: 0; padding: 28px 20px; background: #fafaf9; color: #1c1917;
         font-family: Figtree, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
  main {{ max-width: 1000px; margin: 0 auto; }}
</style>
</head>
<body>
<main>{widget}</main>
{i18n}
{scripts}
</body>
</html>
'''


def build_page(slug, html):
    title_m = re.search(r'<title>(.*?)</title>', html, re.S)
    title = title_m.group(1) if title_m else slug

    # External scripts: download Astro chunks, drop analytics/GTM.
    def script_src_sub(m):
        tag, src = m.group(0), m.group(1)
        if src.startswith(('http:', 'https:', '//')):
            return ''
        if src.startswith('/_astro/'):
            name = src[len('/_astro/'):]
            fetch_asset(name)
            return tag.replace(src, '../assets/' + name)
        return tag

    html = re.sub(r'<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*</script>', script_src_sub, html)

    def inline_sub(m):
        attrs, body = m.group(1), m.group(2)
        if 'tool-i18n' in attrs:
            return m.group(0)
        if 'application/' in attrs or 'googletag' in body or 'ahrefs' in body or 'gtm' in body:
            return ''
        if not body.strip():
            return m.group(0)
        idx = inline_sub.counter
        inline_sub.counter += 1
        name = f'{slug}.inline-{idx}.js'
        body = re.sub(r'(import\s*\(\s*)([\'\"])\./', r'\1\2../assets/', body)
        body = re.sub(r'(\bfrom\s+)([\'\"])\./', r'\1\2../assets/', body)
        body = re.sub(r'(url\(\s*[\'\"])/([^\)\'\"]+)', r'\1../root/\2', body)
        save(PAGES / name, body)
        new_attrs = attrs.rstrip() + f' src="{name}"'
        return '<script' + new_attrs + '></script>'

    inline_sub.counter = 0
    html = re.sub(r'<script([^>]*)>(.*?)</script>', inline_sub, html, flags=re.S)

    # Stylesheets.
    def link_sub(m):
        tag, href = m.group(0), m.group(1)
        if href.startswith('/_astro/'):
            name = href[len('/_astro/'):]
            fetch_asset(name)
            return tag.replace(href, '../assets/' + name)
        return tag

    html = re.sub(r'<link\b[^>]*\bhref="([^"]+)"[^>]*>', link_sub, html)

    # Tool links become local pages; other site links open the real website.
    html = re.sub(r'href="/(?:zh/)?tools/([a-z0-9-]+)/?"', lambda m: f'href="{m.group(1)}.html"', html)
    html = re.sub(r'href="/([^"#][^"]*)"', lambda m: f'href="{BASE}/{m.group(1)}" target="_blank" rel="noopener"', html)
    html = re.sub(r'(?:src|href)="/([^"#?]+)"', lambda m: m.group(0).replace('="' + m.group(1), '="../root/' + m.group(1)), html)
    html = re.sub(r'url\(\s*[\'\"]?/([^\)\'\"]+)', r'url(../root/\1', html)

    save(PAGES / f'{slug}.html', trim_to_widget(html, title))
    return {'slug': slug, 'title': title, 'url': f'{BASE}/zh/tools/{slug}/'}


def main():
    PAGES.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    ROOT_ASSETS.mkdir(parents=True, exist_ok=True)

    sitemap = text(f'{BASE}/sitemap.xml')
    urls = sorted(set(re.findall(r'<loc>([^<]+)</loc>', sitemap)))
    tool_urls = [u for u in urls if '/zh/tools/' in u]
    print(f'found {len(tool_urls)} tool pages')

    pages = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(text, u): u for u in tool_urls}
        for fut in concurrent.futures.as_completed(futures):
            url = futures[fut]
            slug = slug_from_url(url)
            try:
                pages[slug] = fut.result()
            except Exception as exc:  # noqa: BLE001
                print('page warning:', slug, exc)

    # Download every CSS/JS asset and root-level image referenced by any page.
    all_scripts = set()
    all_styles = set()
    all_root_assets = set()
    for html in pages.values():
        for src in re.findall(r'<script\b[^>]*\bsrc="/_astro/([^"]+)"', html):
            all_scripts.add(src)
        for href in re.findall(r'<link\b[^>]*\bhref="/_astro/([^"]+)"', html):
            all_styles.add(href)
        all_root_assets |= collect_asset_paths(html)

    print(f'assets: {len(all_scripts)} scripts, {len(all_styles)} styles, {len(all_root_assets)} root files')
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(fetch_asset, sorted(all_scripts | all_styles)))
        list(pool.map(fetch_root_asset, sorted(all_root_assets)))

    # CSS can reference more root assets than the pages do.
    css_extra = set()
    for css in ASSETS.glob('*.css'):
        css_extra |= collect_asset_paths(css.read_text('utf-8', 'replace'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(fetch_root_asset, sorted(css_extra - all_root_assets)))

    entries = []
    for slug in sorted(pages):
        try:
            entries.append(build_page(slug, pages[slug]))
        except Exception as exc:  # noqa: BLE001
            print('build warning:', slug, exc)
    save(REPLICA / 'index.json', json.dumps({'count': len(entries), 'tools': entries}, ensure_ascii=False, indent=2))
    print(f'built {len(entries)} replica pages into {PAGES}')


if __name__ == '__main__':
    main()
