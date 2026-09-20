#!/usr/bin/env python3
"""Build static Swedish course pages. Requires Python-Markdown."""
from pathlib import Path
import re, json, html
import markdown
ROOT = Path(__file__).resolve().parent.parent
PAGES = [
 ('01-start','Börja här','Installera Godot och förstå arbetsflödet innan du börjar bygga.','Orientering'),
 ('02-forsta-scenen','Din första VR-scen','Bygg golv, ljus och en XR-kamera. Lägg till svenskkommenterad startkod.','Bygg i Godot'),
 ('03-macos-quest','Från Mac till Quest 3','Hela installationen för M-chip: Java, SDK, USB och första VR-testet.','Installera och kör'),
 ('04-spelaren','Händer och rörelse','Koppla kontrollerna, visa händer och rör dig i världen med XR Tools.','Bygg i Godot'),
 ('05-objekt','Bord och greppbara objekt','Skapa kuber du kan plocka upp och ett bord att ställa dem på.','Bygg i Godot'),
 ('06-felsokning','Felsök steg för steg','Hitta felet i export, ADB, OpenXR, resurser eller skärmspegling.','När något krånglar'),
 ('07-kallor','Källor och versionskontroll','Läs dokumentationen, jämförelserna och vad som ändrats från videon.','Fördjupning'),
]

def esc(x): return html.escape(x, quote=True)
def strip(x): return html.unescape(re.sub('<[^>]+>', ' ', x))
def cards(active=''):
 return ''.join(f'<a class="chapter-link" href="{s}.html"'+(' aria-current="page"' if s==active else '')+f'><span class="chapter-number">{s[:2]}</span><span><strong>{esc(t)}</strong><small>{esc(d)}</small></span><span class="arrow" aria-hidden="true">↗</span></a>' for s,t,d,g in PAGES)
def shell(title,desc,body,slug='index'):
 return f'''<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="{esc(desc)}"><meta name="theme-color" content="#f5f7fc"><title>{esc(title)} · VR med Godot</title><script src="js/theme.js"></script><link rel="stylesheet" href="css/style.css"><link rel="icon" href="favicon.svg" type="image/svg+xml"><script src="js/search-index.js" defer></script><script src="js/app.js" defer></script></head>
<body data-page="{slug}"><a class="skip-link" href="#main">Hoppa till innehållet</a>
<header class="navbar"><a class="logo" href="index.html"><span aria-hidden="true">◉</span> VR med Godot</a><form class="site-search" role="search"><label class="sr-only" for="site-query">Sök i hela guiden</label><input id="site-query" type="search" placeholder="Sök i guiden …" autocomplete="off"><button aria-label="Sök" type="submit">⌕</button></form><button class="icon-button" id="menu-toggle" aria-label="Öppna kapitelmenyn" aria-controls="chapter-dialog" aria-expanded="false">☰</button><button class="icon-button" id="theme-toggle" aria-label="Byt färgtema" aria-pressed="false">◐</button></header>
<dialog id="chapter-dialog" class="menu-dialog" aria-labelledby="menu-heading"><div class="dialog-heading"><h2 id="menu-heading">Alla kapitel</h2><button class="icon-button" data-close aria-label="Stäng kapitelmenyn">✕</button></div><a class="home-link" href="index.html">← Till startsidan</a><nav aria-label="Kapitel">{cards(slug)}</nav></dialog>
<dialog id="search-dialog" aria-labelledby="search-heading"><div class="dialog-heading"><h2 id="search-heading">Sök i guiden</h2><button class="icon-button" data-close aria-label="Stäng sökresultaten">✕</button></div><label for="dialog-query">Sökord</label><input id="dialog-query" type="search" placeholder="Till exempel USB eller grepp"><p id="search-count" class="muted" aria-live="polite"></p><div id="search-results"></div></dialog>
<main id="main" tabindex="-1" class="container">{body}</main>
<footer><p>VR med Godot · Godot 4.7 / Meta Quest 3</p><p>Granskat 20 september 2026 · <a href="07-kallor.html">Källor och versionsinformation</a> · <a href="https://www.youtube.com/watch?v=gbTUNg99lrg">Videon bakom kursen</a></p><p class="fine">Utformat för att läsa bredvid Godot. Checklistor och tema sparas i din webbläsare.</p></footer><div id="toast" role="status" aria-live="polite"></div></body></html>'''
index=[]
for i,(slug,title,desc,group) in enumerate(PAGES):
 src=(ROOT/'content'/f'{slug}.md').read_text()
 md=markdown.Markdown(extensions=['extra','toc'],extension_configs={'toc':{'toc_depth':'2'}})
 body=md.convert(src)
 if slug=='06-felsokning':
  body=body.replace('<table>', '<table id="symptom-table">', 1)
 body=re.sub(r'(<table(?: id="symptom-table")?>.*?</table>)',r'<div class="table-wrap" tabindex="0" role="region" aria-label="Tabell, kan rullas i sidled">\1</div>',body,flags=re.S)
 body=re.sub(r'<pre><code(?: class="language-([^"]+)")?>(.*?)</code></pre>',lambda m:f'<div class="code-block"><div class="code-toolbar"><span>{esc(m[1] or "Kod")}</span><button class="copy-button" type="button">Kopiera</button></div><pre tabindex="0"><code>{m[2]}</code></pre></div>',body,flags=re.S)
 prev = 'index.html' if i==0 else PAGES[i-1][0]+'.html'
 prev_title='Översikt' if i==0 else PAGES[i-1][1]
 nxt = PAGES[i+1] if i+1<len(PAGES) else None
 nav=f'<nav class="page-nav" aria-label="Mellan kapitel"><a href="{prev}"><small>← Föregående</small>{prev_title}</a>'+(f'<a href="{nxt[0]}.html"><small>Nästa →</small>{nxt[1]}</a>' if nxt else '<a href="index.html"><small>Tillbaka →</small>Alla kapitel</a>')+'</nav>'
 toc=f'<details class="page-toc" open><summary>I det här kapitlet</summary>{md.toc}</details>'
 head=f'<div class="breadcrumb"><a href="index.html">Översikt</a><span>/</span><span>Kapitel {i+1:02d}</span></div><header class="chapter-header"><p class="eyebrow">{esc(group)} · Kapitel {i+1:02d}</p><h1>{esc(title)}</h1><p class="subtitle">{esc(desc)}</p><div class="metadata"><span>Godot 4.7</span><span>Quest 3</span><span>Granskat 2026-09-20</span></div></header>'
 (ROOT/f'{slug}.html').write_text(shell(title,desc,head+f'<div class="reading-layout"><aside class="toc-panel">{toc}<button class="print-button" type="button">Skriv ut kapitlet</button></aside><article class="prose">{body}{nav}</article></div>',slug))
 sections=re.split(r'<h2 id="([^"]+)">(.*?)</h2>',body)
 for k in range(1,len(sections),3):
  anchor,heading,text=sections[k:k+3]
  text=re.sub(r'\s+',' ',strip(text)).strip()
  index.append({'url':f'{slug}.html#{anchor}','chapter':title,'title':strip(heading).strip(),'text':text})
 if slug=='02-forsta-scenen':
  code=re.search(r'```gdscript\n(.*?)```',src,re.S)[1]
  (ROOT/'downloads/main.gd').write_text(code)
hero='''<header class="hero"><div class="hero-copy panel"><p class="eyebrow">Ett läromedel för nybörjare</p><h1>Bygg din första<br><span>värld i VR.</span></h1><p class="subtitle">Från ett tomt Godot-projekt till händer, rörelse och greppbara föremål i Meta Quest 3.</p><div class="metadata"><span>Godot 4.7</span><span>Meta Quest 3</span><span>macOS · M-chip</span></div><div class="hero-actions"><a class="primary-link" href="01-start.html">Börja från början <span aria-hidden="true">→</span></a><a class="secondary-link" href="03-macos-quest.html">Kör på Quest från Mac</a></div><p class="fine">Svenska steg, kod att kopiera och kontroller längs vägen.</p><p class="fine"><a href="downloads/xr-game-01-no-android.zip" download>Ladda ner hela Godot-projektet (ZIP, cirka 44 MB)</a>. Android-mappen är utelämnad. <a href="01-start.html#projektfiler">Så öppnar du projektet och återskapar byggmallen.</a></p></div><aside class="hero-card panel"><p class="eyebrow">Så hänger det ihop</p><h2>Skapa på Mac.<br>Upplev på Quest.</h2><ol class="workflow"><li><span>01</span><div><strong>Bygg i Godot</strong><small>En scen, en kamera, din värld.</small></div></li><li><span>02</span><div><strong>Överför med USB</strong><small>Godot bygger och installerar appen.</small></div></li><li><span>03</span><div><strong>Ta på headsetet</strong><small>Spelet körs direkt på Quest 3.</small></div></li></ol><a href="06-felsokning.html">Fastnat? Öppna felsökningen →</a></aside></header>'''
body=hero+f'<section class="panel chapter-overview" aria-labelledby="chapters-heading"><p class="eyebrow">Läs · bygg · testa</p><div class="section-heading"><h2 id="chapters-heading">Alla kapitel</h2><span class="muted">Sju steg och guider</span></div><nav class="chapter-grid" aria-label="Alla kapitel">{cards()}</nav></section>'+'''<section class="feature-grid"><article class="panel"><p class="eyebrow">Din första milstolpe</p><h2>Se golvet i headsetet.</h2><p>Börja smått. Installera Godot i kapitel 1, bygg grundscenen i kapitel 2 och kör den på Quest i kapitel 3. Lägg sedan till händer, rörelse och föremål.</p><a href="02-forsta-scenen.html">Bygg grundscenen →</a></article><article class="panel"><p class="eyebrow">Aktuellt och granskat</p><h2>Från video till 4.7.</h2><p>Kursen bygger på Virtual Rooks introduktion och är uppdaterad med dokumentation från Godot, Meta, Android och XR Tools.</p><a href="07-kallor.html">Se källor och rättelser →</a></article></section><section class="panel reading-note"><div><p class="eyebrow">Läs och bygg sida vid sida</p><h2>Ha guiden bredvid Godot.</h2><p>Stäng menyn, följ ett avsnitt och prova. Kod kan kopieras med en knapp och dina checklistor sparas lokalt.</p></div><a class="secondary-link" href="downloads/main.gd" download>Ladda ner main.gd ↓</a></section>'''
(ROOT/'index.html').write_text(shell('Bygg din första värld i VR','En komplett svensk nybörjarguide till Godot 4.7 och Meta Quest 3. Installation på Mac med Apple Silicon, VR-scener och felsökning.',body))
(ROOT/'js/search-index.js').write_text('window.VR_SEARCH_INDEX = '+json.dumps(index,ensure_ascii=False)+';\n')
print(f'Built {len(PAGES)+1} pages and {len(index)} searchable sections.')
