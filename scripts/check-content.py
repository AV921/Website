"""Guard the original bilingual dictionaries during the editorial redesign."""
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.inline = False
        self.values = []

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.inline = 'src' not in dict(attrs)
            if self.inline:
                self.values.append('')

    def handle_data(self, data):
        if self.inline:
            self.values[-1] += data

    def handle_endtag(self, tag):
        if tag == 'script':
            self.inline = False

for filename, expected in json.loads((ROOT / 'scripts/content-baseline.json').read_text()).items():
    parser = Scripts()
    parser.feed((ROOT / filename).read_text(encoding='utf-8-sig'))
    actual = [hashlib.sha256(value.encode()).hexdigest() for value in parser.values]
    assert actual == expected, f'Original translations or inline scripts changed: {filename}'
print('PASS: original bilingual scripts preserved on all six pages')
