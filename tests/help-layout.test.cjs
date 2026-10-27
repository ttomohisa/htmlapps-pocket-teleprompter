const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const source = read('src/index.template.html');

// CSS/markup contracts catch removal of the sizing fix. Native geometry,
// scrolling and keyboard behavior are checked separately in VERIFY_OFFLINE.md.
function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\{([^}]+)\\}`));
  assert.ok(match, `Missing rule: ${selector}`);
  return match[1];
}

test('open Help uses remaining dialog space instead of a separate viewport height', () => {
  const dialog = declarations('#helpDialog[open]');
  assert.match(dialog, /display:flex(?:;|$)/);
  assert.match(dialog, /flex-direction:column(?:;|$)/);
  assert.match(declarations('#helpDialog .dialog-header'), /flex:0 0 auto(?:;|$)/);
  const body = declarations('#helpDialog .dialog-body');
  assert.match(body, /flex:1 1 auto(?:;|$)/);
  assert.match(body, /min-height:0(?:;|$)/);
  assert.match(body, /max-height:none(?:;|$)/);
  assert.match(declarations('.dialog-body'), /overflow:auto(?:;|$)/);
  assert.doesNotMatch(source, /#helpDialog\{[^}]*display:flex/,
    'A closed native dialog must remain hidden');
});

test('Help scroll region is named, keyboard-focusable and has a visible focus cue', () => {
  const help = source.match(/<dialog id="helpDialog"[\s\S]*?<\/dialog>/)[0];
  const body = help.match(/<div class="dialog-body"[^>]*>/)[0];
  assert.match(body, /tabindex="0"/);
  assert.match(body, /role="region"/);
  assert.match(body, /aria-labelledby="helpTitle"/);
  assert.match(declarations('#helpDialog .dialog-body:focus-visible'), /outline:3px solid/);
  assert.match(help, /data-close-dialog="helpDialog"/);
  assert.match(help, /data-i18n="helpLimit3"/);
});

test('local-processing badge uses the reference shield-check geometry', () => {
  // Reference: https://browser-kitty.com/apps/pdf-fill-sign.html (2026-10-09).
  const badge = source.match(/<div class="privacy-badge">([\s\S]*?)<\/div>/)[1];
  const svg = badge.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.match(svg, /viewBox="0 0 24 24"/);
  assert.match(svg, /fill="none"/);
  assert.match(svg, /stroke="currentColor"/);
  assert.match(svg, /stroke-width="1\.9"/);
  assert.match(svg, /stroke-linecap="round"/);
  assert.match(svg, /stroke-linejoin="round"/);
  assert.match(svg, /aria-hidden="true"/);
  const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(paths, ['M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z', 'm9 12 2 2 4-5']);
  assert.match(badge, /data-i18n="localOnly"/);
});

test('readable, root and compressed releases carry the source Help and badge markup/styles', () => {
  const readable = read('dist/index.html');
  const wrapper = read('dist/index.self-extract.html');
  const decoded = zlib.gunzipSync(Buffer.from(wrapper.match(/const b='([^']+)'/)[1], 'base64')).toString('utf8');
  const ui = html => {const expanded=html.replace('__BK_UI_CSS__',read('components/ui-conventions.css')).replace('__BK_UI_JS__',read('components/ui-conventions.js'));return expanded.slice(0,expanded.indexOf('<script id="appConfig"'));};
  for (const html of [readable, read('pocket-teleprompter.html'), decoded]) {
    assert.equal(ui(html), ui(source));
  }
});


test('native modal dialogs lock both page scroll containers only while modal', () => {
  assert.match(declarations('html:has(dialog:modal),body:has(dialog:modal)'), /overflow:hidden(?:;|$)/);
  assert.doesNotMatch(source, /(?:html|body)\s*\{[^}]*overflow:hidden/);
});

test('Help omits internal layout and focus audit prose', () => {
  assert.doesNotMatch(source, /ダイアログを開いている間は背景のスクロールが止まります。/);
  assert.doesNotMatch(source, /Background scrolling is paused while a dialog is open\./);
});

test('reader keeps its independent body overflow lifecycle', () => {
  assert.match(source, /document\.body\.style\.overflow='hidden';prepareReader\(\)/);
  assert.match(source, /updateReaderLabels\(\);document\.body\.style\.overflow='';try/);
});

function phoneCss(css, width) {
  const marker = `@media(max-width:${width}px)`;
  const start = css.indexOf(marker);
  assert.ok(start >= 0, `Existing phone breakpoint must remain: ${width}px`);
  const opening = css.indexOf('{', start);
  let depth = 1;
  for (let end = opening + 1; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) return css.slice(opening + 1, end);
  }
  assert.fail('Unclosed phone breakpoint');
}

test('compact phone layouts hide only the informational footer, not the Start action', () => {
  const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(phoneCss(css, 520), /(?:^|})footer\{[^}]*display:none(?:;|})/);
  assert.doesNotMatch(phoneCss(css, 820), /(?:^|})footer\{[^}]*display:none/);
  assert.doesNotMatch(css.slice(0, css.indexOf('@media')), /(?:^|})footer\{[^}]*display:none/);
  assert.match(phoneCss(css, 820), /\.start-card\{[^}]*position:fixed/);
  assert.doesNotMatch(phoneCss(css, 520), /\.start-card\{[^}]*display:none/);
  assert.doesNotMatch(source.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)[0], /<(?:button|input|select)\b/);
});
