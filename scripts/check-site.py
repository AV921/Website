"""Validate local resources, fragment targets and essential page metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

pages = {p.name: Page(p.read_text(encoding='utf-8-sig')) for p in ROOT.glob('*.html')}
errors = []
for name, page in pages.items():
    for tag, attrs in page.tags:
        refs = [attrs[key] for key in ('href', 'src') if key in attrs]
        refs += [part.strip().split()[0] for part in attrs.get('srcset', '').split(',') if part.strip()]
        for ref in refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc: continue
            target = unquote(url.path).lstrip('/') or ('index.html' if url.path == '/' else name)
            if not (ROOT / target).is_file(): errors.append(f'{name}: missing {ref}')
            if url.fragment and target in pages:
                ids = {a.get('id') for _, a in pages[target].tags}
                if unquote(url.fragment) not in ids: errors.append(f'{name}: missing fragment {ref}')
        if tag == 'img':
            for key in ('alt', 'width', 'height', 'srcset'):
                if key not in attrs: errors.append(f'{name}: image missing {key}')
    for key, value in [('name', 'description'), ('property', 'og:title'), ('property', 'og:image')]:
        if not any(t == 'meta' and a.get(key) == value for t, a in page.tags): errors.append(f'{name}: missing {value}')
    if not any(t == 'link' and a.get('rel') == 'canonical' for t, a in page.tags): errors.append(f'{name}: missing canonical')
if errors:
    print('\n'.join(errors)); sys.exit(1)
print(f'PASS: local resources, fragments, image attributes and metadata on {len(pages)} pages')
