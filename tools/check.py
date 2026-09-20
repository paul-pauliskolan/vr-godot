#!/usr/bin/env python3
"""Validate local links, fragment IDs and page structure without dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import Counter
import re, json
ROOT=Path(__file__).resolve().parent.parent
class Page(HTMLParser):
 def __init__(self,path):
  super().__init__(); self.ids=[]; self.links=[]; self.h1=0; self.lang=None
  self.feed(path.read_text())
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs: self.ids.append(attrs['id'])
  if tag=='html': self.lang=attrs.get('lang')
  if tag=='h1': self.h1+=1
  if tag in ('a','script','link'):
   url=attrs.get('href') or attrs.get('src')
   if url: self.links.append(url)
pages={p.name:Page(p) for p in ROOT.glob('*.html')}
errors=[]; count=0
for name,page in pages.items():
 if page.h1!=1: errors.append(f'{name}: expected one h1, got {page.h1}')
 if page.lang!='sv': errors.append(f'{name}: missing Swedish language')
 duplicates=[key for key,n in Counter(page.ids).items() if n>1]
 if duplicates: errors.append(f'{name}: duplicate ids {duplicates}')
 for link in page.links:
  url=urlsplit(link)
  if url.scheme or url.netloc: continue
  target=unquote(url.path) or name
  count+=1
  if not (ROOT/target).exists(): errors.append(f'{name}: missing {link}')
  elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids: errors.append(f'{name}: missing anchor {link}')
index=json.loads((ROOT/'js/search-index.js').read_text().removeprefix('window.VR_SEARCH_INDEX = ').strip().removesuffix(';'))
for item in index:
 url=urlsplit(item['url'])
 if url.path not in pages or url.fragment not in pages[url.path].ids: errors.append('Broken search target: '+item['url'])
source=(ROOT/'content/02-forsta-scenen.md').read_text()
code=re.search(r'```gdscript\n(.*?)```',source,re.S)[1]
if code!=(ROOT/'downloads/main.gd').read_text(): errors.append('Download does not match displayed main.gd')
if errors:
 print('\n'.join(errors)); raise SystemExit(1)
print(f'OK: {len(pages)} pages, {count} local references, {len(index)} search anchors, matching main.gd.')
