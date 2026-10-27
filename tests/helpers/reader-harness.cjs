const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Execute the actual inline app; geometry, event delivery, timers and DOM are synthetic.
// This does not verify native keyboard defaults, browser scrolling, layout or touch.
function loadApp(saved = {}, storageUnavailable = false, options = {}) {
  let source = fs.readFileSync(process.env.TELEPROMPTER_HTML || path.join(__dirname, '../../src/index.template.html'), 'utf8');
  const payload = source.match(/const b='([^']+)'/);
  if (payload) source = require('node:zlib').gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8');
  const elements = new Map(), documentEvents = {}, windowEvents = {}, timers = new Map(), frames = new Map(), downloads = [], blobs = new Map(), revoked = [];
  let now = 0, nextId = 0, stored = options.raw!==undefined?options.raw:JSON.stringify({ countdown: false, fullscreen: false, wake: false, ...saved }),readFailure=!!options.readFailure,writeFailure=!!options.writeFailure,sharedLanguage=options.sharedLanguage||null,downloadFailure=false;const storageWrites=[];
  class Element {
    constructor(id = '', tag = 'div') { this.id = id; this.tagName = tag.toUpperCase(); this._value = ''; this.textContent = ''; this.dataset = {}; this.events = {}; this.style = { setProperty() {} }; this.attrs = {}; this.files = []; this.open = false; this.hidden = false; this.disabled = false; this.scrollTop = 0; this.clientHeight = 800; this.offsetTop = 0; this.scrollHeight = 2400; const classes = new Set(); this.classList = { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) }; }
    set value(v) { this._value = this.tagName === 'TEXTAREA' ? String(v).replace(/\r\n?/g, '\n') : String(v); }
    get value() { return this._value; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    removeAttribute(k){delete this.attrs[k];}
    closest(selector) { return selector.split(',').some(part => { part = part.trim(); return part.startsWith('#') ? this.id === part.slice(1) : part.startsWith('.') ? this.classList.contains(part.slice(1)) : part.match(/^button\[data-[\w-]+\]$/)?this.tagName==='BUTTON'&&this.attrs[part.slice(7,-1)]!=null:part === '[contenteditable]' ? this.attrs.contenteditable != null : this.tagName.toLowerCase() === part; }) ? this : this.parentElement?.closest(selector) || null; }
    addEventListener(k, fn) { (this.events[k] ??= []).push(fn); }
    async fire(type,extra={}){const event={target:this,currentTarget:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},stopPropagation(){},...extra};for(const fn of this.events[type]||[])await fn(event);if(type==='cancel'&&!event.defaultPrevented)this.close();}
    click() {if(this.disabled)return;if(this.tagName==='A'&&downloadFailure)throw Error('delivery refused'); if (this.tagName === 'A') { downloads.push({ blob: blobs.get(this.href), filename: this.download }); return; } return this.fire('click'); }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close(){if(!this.open)return;this.open=false;void this.fire('close');}
    getBoundingClientRect() { return this.tagName === 'DIALOG' && !this.open ? { left: 0, top: 0, right: 0, bottom: 0 } : { left: 10, top: 10, right: 300, bottom: 300 }; }
    remove() { this.removed = true; }
    append() {}
  }
  for (const match of source.matchAll(/<([\w-]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) { const el = new Element(match[2], match[1]); for (const attr of match[0].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) { el.attrs[attr[1]] = attr[2] ?? ''; if(attr[1].startsWith('data-'))el.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2]; if (attr[1] === 'class') el.classList.add(...attr[2].split(' ')); if (attr[1] === 'hidden' || attr[1] === 'disabled') el[attr[1]] = true; if (attr[1] === 'value') el.value = attr[2]; } elements.set(match[2], el); }
  if (elements.has('readingPosition')) { elements.get('readingPosition').parentElement = elements.get('readerNavigation'); elements.get('readingPositionLabel').parentElement = elements.get('readerNavigation'); }
  for (const match of source.matchAll(/<([\w-]+)\b[^>]*data-i18n(?:-aria-label)?="([^"]+)"[^>]*>/g)) {
    if (/\bid=/.test(match[0])) continue;
    const el = new Element('', match[1]);
    for (const attr of match[0].matchAll(/([\w-]+)="([^"]*)"/g)) {el.attrs[attr[1]] = attr[2];if(attr[1].startsWith('data-'))el.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2];}
    elements.set(`i18n:${match[2]}:${elements.size}`, el);
  }
  const config = source.match(/<script id="appConfig"[^>]*>([\s\S]*?)<\/script>/)[1];
  elements.get('appConfig').textContent = config.startsWith('__') ? fs.readFileSync(path.join(__dirname, '../../app.config.json'), 'utf8') : config;
  const document = { body: new Element(), documentElement: new Element(), activeElement: null, querySelectorAll: selector => {
    const attr = { '[data-i18n]': ['data-i18n', 'i18n'], '[data-i18n-aria-label]': ['data-i18n-aria-label', 'i18nAriaLabel'],'[data-i18n-placeholder]':['data-i18n-placeholder','i18nPlaceholder'],'[data-close-dialog]':['data-close-dialog','closeDialog'],'[data-adjust-speed]':['data-adjust-speed','adjustSpeed'],'[data-adjust-duration]':['data-adjust-duration','adjustDuration'],'[data-adjust-font]':['data-adjust-font','adjustFont'] }[selector];
    if(selector==='#paceModeButtons button')return ['speedModeLabel','durationModeLabel'].map(id=>elements.get(id));
    return attr ? [...elements.values()].filter(el => { if (!el.attrs[attr[0]]) return false; el.dataset[attr[1]] = el.attrs[attr[0]]; return true; }) : [];
  }, getElementById: id => elements.get(id), createElement: tag => new Element('', tag), addEventListener: (k, fn) => documentEvents[k] = fn };
  const sandbox = { document, navigator: { language: 'en' }, console, Blob, TextDecoder, TextEncoder, Uint8Array, ArrayBuffer, URL: class extends URL { static createObjectURL(blob) { const url = `blob:test-${++nextId}`; blobs.set(url, blob); return url; } static revokeObjectURL(url) { revoked.push(url); blobs.delete(url); } },location:{href:options.url||'https://example.test/'},history:{replaceState(){}},localStorage:{getItem(key){if(storageUnavailable||readFailure)throw Error('blocked read');return key==='browser-kitty:ui-language:v1'?sharedLanguage:key==='pocket-teleprompter:v1'?stored:null;},setItem(key,value){if(storageUnavailable||writeFailure)throw Error('blocked write');storageWrites.push({key,value});if(key==='browser-kitty:ui-language:v1')sharedLanguage=value;else if(key==='pocket-teleprompter:v1')stored=value;}}, setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, delay, due: now + delay }); return id; }, clearTimeout: id => timers.delete(id), requestAnimationFrame(fn) { const id = ++nextId; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id), getComputedStyle: () => ({ paddingBottom: '496' }), performance: { now: () => now }, addEventListener(k, fn) { windowEvents[k] = fn; }, innerWidth: 1000 };
  sandbox.window = sandbox;
  const context=vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../../components/ui-conventions.js'),'utf8'),context);
  vm.runInContext(source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace('  })();', '  globalThis.probe={state,calculateTravel,applyPace,startPlayback,pausePlayback,finishReader,tick,save,requestWakeLock,closeReader,openReader};})();'), context);
  const el = id => { assert.ok(elements.has(id), `Missing feature control: ${id}`); return elements.get(id); };
  return {get sharedLanguage(){return sharedLanguage},buttons:selector=>document.querySelectorAll(selector),context,storageWrites,rawSaved:()=>stored,setReadFailure(value){readFailure=value},setWriteFailure(value){writeFailure=value},setDownloadFailure(value){downloadFailure=value}, document, frames, async advanceTime(ms) { for(let n=0;n<8;n++)await Promise.resolve();const target = now + ms; for (;;) { const entry = [...timers].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0]; if (!entry) break; now = entry[1].due; timers.delete(entry[0]); entry[1].fn(); for (let n = 0; n < 8; n++) await Promise.resolve(); } now = target; }, frame(now = 0) { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn(now)); }, probe: sandbox.probe, windowEvents, source, el, downloads, blobs, revoked, saved: () => JSON.parse(stored), async edit(text) { el('scriptInput').value = text; await el('scriptInput').fire('input'); }, async select(file) { el('textFileInput').files = file ? [file] : []; el('textFileInput').value = file?.name || ''; await el('textFileInput').fire('change'); }, flushTimers() { const queued = [...timers.values()]; timers.clear(); queued.forEach(timer => timer.fn()); }, async key(key, extra = {}) { let prevented = false; await documentEvents.keydown({ key, target: document.body, preventDefault() { prevented = true; }, ...extra }); return prevented; } };
}
function file(text, name = 'speech.txt') { const bytes = Buffer.isBuffer(text) ? text : Buffer.from(text); return { name, size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer }; }
module.exports={loadApp,file};
