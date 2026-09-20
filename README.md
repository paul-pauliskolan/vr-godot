# VR med Godot 4.7 och Meta Quest 3

Svenskt läromedel med nio kapitel och startsida. Designen följer Pauliskolans
prog1-python. Innehållet är bearbetat från de två ursprungliga Markdown-filerna
i denna mapp och kontrollerat mot källorna på `07-kallor.html`.

## Visa webbplatsen

Öppna `index.html`, eller starta en lokal server i projektmappen:

```sh
python3 -m http.server 4321 --bind 127.0.0.1
```

Öppna sedan http://127.0.0.1:4321/ . Ingen Node-installation eller byggserver
behövs för att visa sajten. Alla HTML-sidor, CSS och JavaScript ligger lokalt.
Sökning behöver ingen extern tjänst. Webbläsarlagring används för tema och checklistor.

## Redigera och bygg

Redigera kapitlen i `content/*.md`. Byggscriptet behöver Python 3 och paketet
`Markdown` (Python-Markdown). Om det saknas: installera `Markdown` i en virtuell
Pythonmiljö. Kör därefter:

```sh
python3 tools/build.py
python3 tools/check.py
node --check js/app.js
```

Byggscriptet genererar HTML, sökindex och `downloads/main.gd`. De ursprungliga
Markdown-underlagen i roten lämnas oförändrade och är inte webbplatsens aktuella
innehållskälla. Gemensam layout finns i `tools/build.py`, `css/style.css` och
`js/app.js`. JavaScript förbättrar navigation, kopiering, sökning och checklistor;
kapitelinnehåll och vanliga länkar finns som statisk HTML.

## Publicera vid behov

Sajten kan ligga direkt i ett GitHub Pages-repository: publicera rotmappen från
vald gren och inkludera genererade HTML-filer, `css`, `js`, `downloads`,
`favicon.svg` och `.nojekyll`. Alla interna länkar är relativa, så även en
projektsökväg som `/vr-godot/` fungerar. Ingen publicering görs av byggscriptet.

## Validering och avgränsning

`tools/check.py` kontrollerar lokala länkar, ankare, sökresultatens mål,
svenskt språkattribut, en huvudrubrik per sida och att nedladdad kod matchar
kodexemplet. Webbplatsen ska också granskas visuellt i desktop- och mobilbredd.
Dokumentationsgranskning är inte ett hårdvarutest: en fullständig Godot/Quest-
körning behöver göras på den aktuella datorn och headsetet.

Källor kontrollerade 2026-09-20. Kursen redovisar motstridiga renderer-råd och
versionsskillnader uttryckligen på källsidan.

## Arbetsflöde för det fortsatta spelprojektet

Utvecklingsanteckningar, idéer och tutorialutkast skapas först tillsammans med
Godot-projektet i dess `docs/`-mapp. Endast funktioner som har byggts och
verifierats förs över till webbplatsens `content/`-kapitel. På så sätt följer
kursmaterialet den faktiska spelversionen utan att webbbygget får skriva i eller
ändra själva spelet.
