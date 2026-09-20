'use strict';
const readSaved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
const toast = message => { const box = document.querySelector('#toast'); box.textContent = message; clearTimeout(toast.timer); toast.timer = setTimeout(() => box.textContent = '', 3000); };
const menu = document.querySelector('#chapter-dialog');
const menuButton = document.querySelector('#menu-toggle');
menuButton.addEventListener('click', () => { menu.showModal(); menuButton.setAttribute('aria-expanded', 'true'); });
menu.addEventListener('close', () => menuButton.setAttribute('aria-expanded', 'false'));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
const themeButton = document.querySelector('#theme-toggle');
function syncTheme() { const dark = document.documentElement.dataset.theme === 'dark'; themeButton.setAttribute('aria-pressed', String(dark)); themeButton.setAttribute('aria-label', dark ? 'Byt till ljust tema' : 'Byt till mörkt tema'); themeButton.textContent = dark ? '☀' : '☾'; }
syncTheme();
themeButton.addEventListener('click', () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('vr-theme', theme); } catch (_) {} syncTheme(); });
document.querySelectorAll('.print-button').forEach(button => button.addEventListener('click', () => window.print()));
if (matchMedia('(max-width: 680px)').matches) {
  document.querySelectorAll('.page-toc').forEach(toc => toc.open = false);
}
document.querySelectorAll('.copy-button').forEach(button => button.addEventListener('click', async () => {
  const code = button.closest('.code-block').querySelector('code');
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code.textContent);
    else { const area = document.createElement('textarea'); area.value = code.textContent; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); const ok = document.execCommand('copy'); area.remove(); if (!ok) throw new Error('Clipboard unavailable'); }
    button.textContent = 'Kopierat!'; setTimeout(() => button.textContent = 'Kopiera', 1800);
  } catch (_) { const range = document.createRange(); range.selectNodeContents(code); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Koden är markerad. Kopiera med ⌘C eller Ctrl+C.'); }
}));
document.querySelectorAll('[data-checklist]').forEach(list => {
  const key = 'vr-checks-' + list.dataset.checklist;
  const boxes = Array.from(list.querySelectorAll('input[type=checkbox]'));
  const state = readSaved(key, []);
  const note = document.createElement('p'); note.className = 'progress-note'; note.setAttribute('aria-live','polite'); list.append(note);
  const update = () => { note.textContent = `${boxes.filter(box => box.checked).length} av ${boxes.length} klara · Sparas i den här webbläsaren.`; };
  boxes.forEach((box, i) => { box.checked = state[i] === true; box.addEventListener('change', () => { const ok = save(key, boxes.map(b => b.checked)); update(); if (!ok) note.textContent += ' Lagring är blockerad; valen gäller bara denna sida.'; }); });
  const reset = document.createElement('button'); reset.className = 'reset-checks'; reset.textContent = 'Nollställ checklistan'; reset.type = 'button'; reset.addEventListener('click', () => { boxes.forEach(b => b.checked = false); save(key, []); update(); }); list.append(reset); update();
});
const normalize = value => value.toLocaleLowerCase('sv').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const searchDialog = document.querySelector('#search-dialog');
const queryInput = document.querySelector('#dialog-query');
const results = document.querySelector('#search-results');
function search(query) {
  results.replaceChildren();
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) { document.querySelector('#search-count').textContent = 'Sök efter ett begrepp, en inställning eller ett felmeddelande.'; return; }
  const hits = (window.VR_SEARCH_INDEX || []).map(item => {
    const text = normalize(item.title + ' ' + item.chapter + ' ' + item.text);
    return {item, score: terms.every(t => text.includes(t)) ? terms.reduce((n,t) => n + (normalize(item.title).includes(t) ? 10 : 1),0) : 0};
  }).filter(hit => hit.score).sort((a,b) => b.score-a.score);
  document.querySelector('#search-count').textContent = hits.length ? `${hits.length} avsnitt hittade${hits.length>30 ? ' · Visar de första 30' : ''}.` : 'Inga träffar. Prova ett kortare ord, till exempel ADB, golv eller export.';
  hits.slice(0,30).forEach(({item}) => {
    const link = document.createElement('a'); link.href = item.url; link.className = 'search-result';
    const chapter = document.createElement('small'); chapter.textContent = item.chapter;
    const title = document.createElement('strong'); title.textContent = item.title;
    const snippet = document.createElement('p'); const at = Math.max(0,normalize(item.text).indexOf(terms[0])-50); snippet.textContent = (at ? '…' : '') + item.text.slice(at,at+190) + (at+190<item.text.length ? '…' : '');
    link.append(chapter,title,snippet); link.addEventListener('click', () => searchDialog.close()); results.append(link);
  });
}
document.querySelector('.site-search').addEventListener('submit', event => { event.preventDefault(); queryInput.value = document.querySelector('#site-query').value; search(queryInput.value); searchDialog.showModal(); queryInput.focus(); });
queryInput.addEventListener('input', () => search(queryInput.value));
const filter = document.querySelector('#symptom-filter');
if (filter) {
 const table = document.querySelector('#symptom-table');
 const rows = Array.from(table.querySelectorAll('tbody tr'));
 const update = () => { const terms = normalize(filter.value).split(/\s+/).filter(Boolean); rows.forEach(row => row.hidden = !terms.every(term => normalize(row.textContent).includes(term))); const count = rows.filter(r => !r.hidden).length; document.querySelector('#symptom-count').textContent = `${count} av ${rows.length} symtom visas.`; document.querySelector('#symptom-empty').hidden = count !== 0; };
 filter.addEventListener('input', update); update();
}
