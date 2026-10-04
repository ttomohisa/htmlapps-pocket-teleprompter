const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Execute the shipped inline app, with only browser DOM/file/timer boundaries faked.
function loadApp(saved = {}, storageUnavailable = false) {
  const source = fs.readFileSync(path.join(__dirname, '../src/index.template.html'), 'utf8');
  const elements = new Map(), documentEvents = {}, timers = new Map(), downloads = [], blobs = new Map(), revoked = [];
  let nextId = 0, stored = JSON.stringify({ countdown: false, fullscreen: false, wake: false, ...saved });
  class Element {
    constructor(id = '', tag = 'div') { this.id = id; this.tagName = tag.toUpperCase(); this._value = ''; this.textContent = ''; this.dataset = {}; this.events = {}; this.style = { setProperty() {} }; this.attrs = {}; this.files = []; this.open = false; this.scrollTop = 0; this.clientHeight = 800; this.offsetTop = 0; this.scrollHeight = 2400; const classes = new Set(); this.classList = { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) }; }
    set value(v) { this._value = this.tagName === 'TEXTAREA' ? String(v).replace(/\r\n?/g, '\n') : String(v); }
    get value() { return this._value; }
    setAttribute(k, v) { this.attrs[k] = v; }
    addEventListener(k, fn) { (this.events[k] ??= []).push(fn); }
    async fire(type, extra = {}) { for (const fn of this.events[type] || []) await fn({ target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...extra }); }
    click() { if (this.tagName === 'A') { downloads.push({ blob: blobs.get(this.href), filename: this.download }); return; } return this.fire('click'); }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    getBoundingClientRect() { return this.tagName === 'DIALOG' && !this.open ? { left: 0, top: 0, right: 0, bottom: 0 } : { left: 10, top: 10, right: 300, bottom: 300 }; }
    remove() { this.removed = true; }
    append() {}
  }
  for (const match of source.matchAll(/<([\w-]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) elements.set(match[2], new Element(match[2], match[1]));
  elements.get('appConfig').textContent = '{}';
  const document = { body: new Element(), documentElement: new Element(), activeElement: null, querySelectorAll: () => [], getElementById: id => elements.get(id), createElement: tag => new Element('', tag), addEventListener: (k, fn) => documentEvents[k] = fn };
  const sandbox = { document, navigator: { language: 'en' }, console, Blob, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer, URL: { createObjectURL(blob) { const url = `blob:test-${++nextId}`; blobs.set(url, blob); return url; }, revokeObjectURL(url) { revoked.push(url); blobs.delete(url); } }, localStorage: { getItem() { if (storageUnavailable) throw Error('blocked'); return stored; }, setItem(_k, value) { if (storageUnavailable) throw Error('blocked'); stored = value; } }, setTimeout(fn) { const id = ++nextId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), requestAnimationFrame: () => ++nextId, cancelAnimationFrame() {}, getComputedStyle: () => ({ paddingBottom: '496' }), performance: { now: () => 0 }, addEventListener() {}, innerWidth: 1000 };
  sandbox.window = sandbox;
  vm.runInNewContext(source.match(/<script>\s*([\s\S]*?)<\/script>/)[1], sandbox);
  const el = id => { assert.ok(elements.has(id), `Missing feature control: ${id}`); return elements.get(id); };
  return { source, el, downloads, blobs, revoked, saved: () => JSON.parse(stored), async edit(text) { el('scriptInput').value = text; await el('scriptInput').fire('input'); }, async select(file) { el('textFileInput').files = file ? [file] : []; el('textFileInput').value = file?.name || ''; await el('textFileInput').fire('change'); }, flushTimers() { const queued = [...timers.values()]; timers.clear(); queued.forEach(fn => fn()); }, async key(key) { let prevented = false; await documentEvents.keydown({ key, preventDefault() { prevented = true; } }); return prevented; } };
}
function file(text, name = 'speech.txt') { const bytes = Buffer.isBuffer(text) ? text : Buffer.from(text); return { name, size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer }; }
function deferredFile(name = 'later.txt') { let resolve, reject; const result = { name, size: 32, arrayBuffer: () => new Promise((a, b) => { resolve = a; reject = b; }) }; return { file: result, resolve: text => resolve(Uint8Array.from(Buffer.from(text)).buffer), reject: () => reject(Error('read failed')) }; }

 test('opens UTF-8 BOM/CRLF, preserves paragraphs/Japanese/emoji/literal markup, and exports current text', async () => {
  const h = loadApp(); const text = '日本語 😀\n\n<script>alert(1)</script>\n  final  \n';
  await h.select(file('\ufeff' + text.replace(/\n/g, '\r\n'), '原稿.TXT'));
  assert.equal(h.el('scriptInput').value, text); assert.equal(h.saved().text, text); assert.equal(h.el('fileNameInput').value, '原稿.txt');
  assert.equal(h.el('textFileInput').value, ''); assert.equal(h.el('replaceDialog').open, false);
  await h.edit(text + 'edited'); await h.el('saveTextButton').click();
  assert.equal(await h.downloads[0].blob.text(), text + 'edited'); assert.equal(h.downloads[0].blob.type, 'text/plain;charset=utf-8');
  assert.equal(h.downloads[0].filename, '原稿.txt'); h.flushTimers(); assert.equal(h.blobs.size, 0); assert.equal(h.revoked.length, 1);
});
for (const [name, content] of [['empty', ''], ['whitespace', '\ufeff \t\r\n'], ['NUL binary', 'hello\0there'], ['invalid UTF-8', Buffer.from([0xc3, 0x28])], ['UTF-16', Buffer.from([0xff, 0xfe, 0x61, 0])]]) {
  test(`rejects ${name} without changing script, filename or persistence`, async () => {
    const h = loadApp({ text: 'existing' }); h.el('fileNameInput').value = 'keep.txt'; const before = h.saved();
    await h.select(file(content)); assert.equal(h.el('scriptInput').value, 'existing'); assert.equal(h.el('fileNameInput').value, 'keep.txt'); assert.deepEqual(h.saved(), before); assert.equal(h.el('replaceDialog').open, false); assert.ok(h.el('fileStatus').textContent);
  });
}
test('accepts exactly 1 MiB and rejects larger bytes before reading', async () => {
  const h = loadApp(); await h.select(file('a'.repeat(1048576))); assert.equal(h.el('scriptInput').value.length, 1048576);
  let read = false; await h.select({ name: 'big.txt', size: 1048577, arrayBuffer() { read = true; } }); assert.equal(read, false); assert.equal(h.el('scriptInput').value.length, 1048576); assert.match(h.el('fileStatus').textContent, /1 MiB/);
  const other = loadApp(); await other.select(file('あ'.repeat(349526))); assert.equal(other.el('scriptInput').value, '');
});
test('rejects wrong extension and read failure without replacing current text', async () => {
  const h = loadApp({ text: 'keep' }); await h.select(file('incoming', 'document.pdf')); assert.equal(h.el('replaceDialog').open, false); assert.match(h.el('fileStatus').textContent, /\.txt/);
  await h.select({ name: 'broken.txt', size: 4, arrayBuffer: async () => { throw Error('unreadable'); } }); assert.equal(h.el('scriptInput').value, 'keep'); assert.match(h.el('fileStatus').textContent, /read/i);
});
test('different nonempty content waits for replacement, and accept changes text and default name', async () => {
  const h = loadApp({ text: 'old', speed: 1.7, mirror: true }); await h.select(file('new', 'new.txt'));
  assert.equal(h.el('scriptInput').value, 'old'); assert.equal(h.el('replaceDialog').open, true);
  await h.el('replaceOk').click(); assert.equal(h.el('scriptInput').value, 'new'); assert.equal(h.saved().text, 'new'); assert.equal(h.saved().speed, 1.7); assert.equal(h.saved().mirror, true); assert.equal(h.el('fileNameInput').value, 'new.txt'); assert.equal(h.el('replaceDialog').open, false);
});
for (const dismiss of ['replaceCancel', 'replaceClose', 'escape', 'backdrop']) test(`replacement ${dismiss} preserves current text and name`, async () => {
  const h = loadApp({ text: 'keep' }); h.el('fileNameInput').value = 'custom.txt'; const saved = h.saved(); await h.select(file('new'));
  if (dismiss === 'escape') { await h.el('replaceDialog').fire('cancel'); h.el('replaceDialog').close(); } else if (dismiss === 'backdrop') await h.el('replaceDialog').fire('click', { clientX: 0, clientY: 0 }); else await h.el(dismiss).click();
  await h.el('replaceOk').click(); assert.equal(h.el('scriptInput').value, 'keep'); assert.equal(h.el('fileNameInput').value, 'custom.txt'); assert.deepEqual(h.saved(), saved);
});
test('same contents need no confirmation and same file can be selected again after cancel', async () => {
  const h = loadApp({ text: 'same' }); await h.select(file('same')); assert.equal(h.el('replaceDialog').open, false); assert.equal(h.el('textFileInput').value, '');
  const f = file('different'); await h.select(f); await h.el('replaceCancel').click(); await h.select(f); assert.equal(h.el('replaceDialog').open, true); await h.el('replaceOk').click(); assert.equal(h.el('scriptInput').value, 'different');
});
test('new selection wins over an older delayed read or read failure', async () => {
  for (const fail of [false, true]) { const h = loadApp(), slow = deferredFile(); const first = h.select(slow.file); await h.select(file('newest')); const status = h.el('fileStatus').textContent; fail ? slow.reject() : slow.resolve('stale'); await first; assert.equal(h.el('scriptInput').value, 'newest'); assert.equal(h.el('fileStatus').textContent, status); }
});
for (const action of ['edit', 'clear', 'start', 'open', 'cancel-selection']) test(`${action} invalidates a delayed read and pending replacement`, async () => {
  for (const pending of [false, true]) { const h = loadApp({ text: 'keep' }), slow = deferredFile(); const read = pending ? h.select(file('pending')) : h.select(slow.file); if (pending) await read;
    if (action === 'edit') await h.edit('new edit'); else if (action === 'clear') await h.el('clearButton').click(); else if (action === 'start') await h.el('startButton').click(); else if (action === 'open') await h.el('openTextButton').click(); else await h.select(null);
    if (!pending) { slow.resolve('stale'); await read; } await h.el('replaceOk').click();
    assert.equal(h.el('scriptInput').value, action === 'edit' ? 'new edit' : 'keep'); assert.equal(h.el('replaceDialog').open, false);
  }
});
test('Clear confirmation clears text and filename; cancel preserves both', async () => {
  const h = loadApp({ text: 'keep' }); h.el('fileNameInput').value = 'custom.txt'; await h.el('clearButton').click(); await h.el('confirmCancel').click(); assert.equal(h.el('fileNameInput').value, 'custom.txt');
  await h.el('clearButton').click(); await h.el('confirmOk').click(); assert.equal(h.el('scriptInput').value, ''); assert.equal(h.el('fileNameInput').value, 'pocket-teleprompter.txt');
});
for (const [raw, expected] of [['', 'pocket-teleprompter.txt'], ['  話す 😀.TXT  ', '話す 😀.txt'], ['../../notes.txt', 'notes.txt'], ['C:\\fakepath\\notes.txt', 'notes.txt'], ['a<>:"|?*\0.txt', 'a_______.txt'], ['CON.txt', '_CON.txt'], ['demo.pdf', 'demo.pdf.txt'], ['...  ', 'pocket-teleprompter.txt']]) test(`sanitizes filename ${JSON.stringify(raw)}`, async () => {
  const h = loadApp({ text: 'keep' }); h.el('fileNameInput').value = raw; await h.el('saveTextButton').click(); assert.equal(h.downloads[0].filename, expected); assert.equal(h.el('fileNameInput').value, expected);
});
test('bounds long unicode filenames and cleans up every repeated download', async () => {
  const h = loadApp({ text: 'keep' }); h.el('fileNameInput').value = '😀'.repeat(180); await h.el('saveTextButton').click(); await h.el('saveTextButton').click(); assert.ok([...h.downloads[0].filename].length <= 104); assert.ok(!h.downloads[0].filename.includes('\ufffd')); h.flushTimers(); assert.equal(h.blobs.size, 0); assert.equal(h.revoked.length, 2);
});
test('unavailable storage still allows import and export, and blank scripts do not download', async () => {
  const h = loadApp({}, true); await h.el('saveTextButton').click(); assert.equal(h.downloads.length, 0); await h.select(file('session text')); await h.el('saveTextButton').click(); assert.equal(await h.downloads[0].blob.text(), 'session text');
});
test('reader copies literal text; editor keyboard input does not trigger reader shortcuts', async () => {
  const h = loadApp(); await h.select(file('<b>literal</b>\n次の行')); assert.equal(await h.key('r'), false); await h.el('startButton').click(); assert.equal(h.el('readerContent').textContent, '<b>literal</b>\n次の行'); assert.equal(h.el('readerView').classList.contains('playing'), true); assert.equal(await h.key(' '), true); assert.equal(h.el('readerView').classList.contains('paused'), true); await h.key('Escape'); assert.equal(h.el('readerView').classList.contains('open'), false);
});
test('controls and status are labeled, local-only and translated', () => {
  const h = loadApp(); for (const id of ['openTextButton','textFileInput','fileNameInput','saveTextButton','fileStatus']) h.el(id);
  assert.match(h.source, /for="fileNameInput"/); assert.match(h.source, /id="fileStatus"[^>]*aria-live="polite"/); assert.match(h.source, /connect-src 'none'/); assert.match(h.source, /accept="\.txt,text\/plain"/); assert.match(h.source, /replaceTitle:'[^']+'/);
});
test('a bubbling Replace click keeps the successful-import status after closing the dialog', async () => {
  const h = loadApp({ text: 'old' }); await h.select(file('new')); await h.el('replaceOk').click();
  await h.el('replaceDialog').fire('click', { target: h.el('replaceOk'), clientX: 180, clientY: 200 });
  assert.equal(h.el('scriptInput').value, 'new'); assert.equal(h.el('fileStatus').textContent, 'Script file opened.');
});
test('long Japanese and emoji download filenames fit common byte-based filesystem limits', async () => {
  for (const character of ['あ', '😀']) { const h = loadApp({ text: 'keep' }); h.el('fileNameInput').value = character.repeat(100) + '.txt'; await h.el('saveTextButton').click(); assert.ok(Buffer.byteLength(h.downloads[0].filename) <= 240, h.downloads[0].filename); }
});
