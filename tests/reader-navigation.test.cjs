const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, file } = require('./helpers/reader-harness.cjs');

const script = '日本語 😀\n\n<script>literal text</script>\nLast paragraph';
async function reader(saved = {}) {
  const h = loadApp({ text: script, ...saved });
  await h.el('startButton').click(); h.frame();
  return h;
}
async function pause(h, elapsed = 60000) {
  h.probe.state.elapsedMs = elapsed;
  await h.el('readerPause').click();
}
async function seek(h, percent) {
  h.el('readingPosition').value = percent;
  await h.el('readingPosition').fire('input');
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('paused manual scroll recalculates target pace before displaying and resuming', async () => {
  const h = await reader({ paceMode: 'duration', duration: 180 });
  h.probe.state.elapsedMs = 60000;
  h.el('readerScroller').scrollTop = h.probe.state.endScroll / 3;
  h.probe.applyPace(); await h.el('readerPause').click();
  h.el('readerScroller').scrollTop = h.probe.state.endScroll * .75;
  await h.el('readerScroller').fire('scroll');
  near(h.probe.state.pxPerSec, h.probe.state.endScroll * .25 / 120);
  assert.equal(h.el('remainingDisplay').textContent, '2:00');
  assert.equal(h.el('elapsedDisplay').textContent, '1:00');
  assert.equal(h.el('readingPosition').value, '75');
  await h.el('readerPause').click();
  near(h.probe.state.pxPerSec, h.probe.state.endScroll * .25 / 120);
  assert.equal(h.probe.state.playing, true);
});

for (const playing of [false, true]) for (const paceMode of ['duration', 'speed']) {
  test(`resize restores the ratio before pace/display (${paceMode}, ${playing ? 'playing' : 'paused'})`, async () => {
    const h = await reader({ paceMode, duration: 180, speed: 1.2 });
    h.probe.state.elapsedMs = 60000;
    h.el('readerScroller').scrollTop = h.probe.state.endScroll * .5;
    h.probe.applyPace(); h.probe.tick(0); if (!playing) await h.el('readerPause').click();
    const oldEnd = h.probe.state.endScroll;
    h.el('readerContent').scrollHeight += oldEnd;
    h.windowEvents.resize();
    near(h.el('readerScroller').scrollTop / h.probe.state.endScroll, .5);
    assert.equal(h.el('readerProgressBar').style.width, '50%');
    assert.equal(h.el('readingPosition').value, '50');
    assert.equal(h.probe.state.elapsedMs, 60000);
    assert.equal(h.probe.state.playing, playing);
    near(h.probe.state.pxPerSec, paceMode === 'duration' ? h.probe.state.endScroll * .5 / 120 : 43.2);
    if (paceMode === 'duration') assert.equal(h.el('remainingDisplay').textContent, '2:00');
    await h.el('readerScroller').fire('scroll');
    if (paceMode === 'duration') assert.equal(h.el('remainingDisplay').textContent, '2:00');
  });
}

for (const playing of [false, true]) for (const firstEvent of ['resize', 'scroll', 'frame']) {
  test(`shrinking geometry retains pre-clamp progress (${playing ? 'playing' : 'paused'}, ${firstEvent} first)`, async () => {
    const h = await reader({ paceMode: 'duration', duration: 180 });
    h.probe.state.elapsedMs = 60000;
    h.el('readerScroller').scrollTop = h.probe.state.endScroll * .75; h.probe.tick(0);
    if (!playing) await h.el('readerPause').click();
    const scroller = h.el('readerScroller'); let position = scroller.scrollTop;
    Object.defineProperty(scroller, 'scrollTop', { get: () => Math.min(position, h.el('readerContent').scrollHeight - scroller.clientHeight), set: value => { position = Math.max(0, Math.min(value, h.el('readerContent').scrollHeight - scroller.clientHeight)); } });
    h.el('readerContent').scrollHeight = 1600;
    assert.equal(scroller.scrollTop, 800, 'browser reflow clamps the old 1200px position');
    if (firstEvent === 'scroll') await scroller.fire('scroll');
    if (firstEvent === 'frame' && playing) h.probe.tick(0);
    h.windowEvents.resize();
    near(scroller.scrollTop, 600); assert.equal(h.el('readerProgressBar').style.width, '75%');
    assert.equal(h.el('remainingDisplay').textContent, '2:00'); assert.equal(h.probe.state.elapsedMs, 60000);
    assert.equal(h.probe.state.playing, playing); near(h.probe.state.pxPerSec, 200 / 120);
  });
}

test('a new seek wins over cached progress when reflow has not delivered resize yet', async () => {
  const h = await reader({ paceMode: 'duration' }); await pause(h); await seek(h, 75);
  h.el('readerContent').scrollHeight = 1600;
  await seek(h, 25);
  assert.equal(h.el('readerScroller').scrollTop, 200);
  assert.equal(h.el('readerProgressBar').style.width, '25%');
  h.windowEvents.resize();
  assert.equal(h.el('readerScroller').scrollTop, 200);
  assert.equal(h.el('remainingDisplay').textContent, '2:00');
});

for (const action of ['pause', 'resume']) test(`${action} during reflow preserves the cached position`, async () => {
  const h = await reader({ paceMode: 'duration' }); h.probe.state.elapsedMs = 60000;
  h.el('readerScroller').scrollTop = 1200; h.probe.tick(0);
  if (action === 'resume') await h.el('readerPause').click();
  const scroller = h.el('readerScroller'); let position = scroller.scrollTop;
  Object.defineProperty(scroller, 'scrollTop', { get: () => Math.min(position, h.el('readerContent').scrollHeight - scroller.clientHeight), set: value => { position = Math.min(value, h.el('readerContent').scrollHeight - scroller.clientHeight); } });
  h.el('readerContent').scrollHeight = 1600;
  await h.el('readerPause').click(); h.windowEvents.resize();
  assert.equal(scroller.scrollTop, 600); assert.equal(h.el('readerProgressBar').style.width, '75%');
  assert.equal(h.el('remainingDisplay').textContent, '2:00'); assert.equal(h.probe.state.elapsedMs, 60000);
  assert.equal(h.probe.state.playing, action === 'resume');
});

test('position control is labeled, bilingual, native 0–100 range with visible focus', async () => {
  const h = loadApp({ text: script });
  assert.equal(h.el('readerNavigation').hidden, true);
  assert.equal(h.el('readingPosition').disabled, true);
  assert.equal(h.el('readingPosition').attrs.type, 'range');
  for (const [key, value] of [['min', '0'], ['max', '100'], ['step', '1']]) assert.equal(h.el('readingPosition').attrs[key], value);
  assert.equal(h.el('readingPositionLabel').attrs.for, 'readingPosition');
  assert.equal(h.el('readingPositionLabel').textContent, 'Reading position');
  await h.el('languageButton').click();
  assert.equal(h.el('readingPositionLabel').textContent, '読み位置');
  assert.match(h.source, /input:focus-visible/);
});

for (const paceMode of ['speed', 'duration']) test(`repeated seek clamps position, stays paused and retains elapsed time (${paceMode})`, async () => {
  const h = await reader({ paceMode, duration: 180, speed: 1.2 });
  assert.equal(h.el('readingPosition').disabled, true);
  await seek(h, 75); assert.equal(h.el('readerScroller').scrollTop, 0);
  await pause(h);
  assert.equal(h.el('readerNavigation').hidden, false);
  assert.equal(h.el('readingPosition').disabled, false);
  for (const percent of [25, 50, 75, 0, -15, 50, 25]) {
    await seek(h, percent);
    const expected = Math.max(0, percent);
    near(h.el('readerScroller').scrollTop, h.probe.state.endScroll * expected / 100);
    assert.equal(h.el('readingPositionValue').textContent, `${expected}%`);
    assert.equal(h.el('readerProgressBar').style.width, `${expected}%`);
    assert.equal(h.probe.state.playing, false);
    assert.equal(h.probe.state.elapsedMs, 60000);
    if (paceMode === 'duration') assert.equal(h.el('remainingDisplay').textContent, '2:00');
    else near(h.probe.state.pxPerSec, 43.2);
  }
  const position = h.el('readerScroller').scrollTop;
  await seek(h, 'bad'); assert.equal(h.el('readerScroller').scrollTop, position);
  await h.el('readerPause').click(); h.frame(80);
  assert.ok(h.el('readerScroller').scrollTop > position);
  assert.equal(h.probe.state.elapsedMs, 60080);
  assert.equal(h.el('readerNavigation').hidden, true);
});

for (const percent of [100, 150]) test(`seek ${percent}% uses finish and Restart resets the session`, async () => {
  const h = await reader({ paceMode: 'duration' }); await pause(h); await seek(h, percent);
  assert.equal(h.probe.state.ended, true); assert.equal(h.probe.state.playing, false);
  assert.equal(h.el('finishLayer').classList.contains('show'), true);
  assert.equal(h.el('readerProgressBar').style.width, '100%');
  assert.equal(h.el('readingPositionValue').textContent, '100%');
  assert.equal(h.el('remainingDisplay').textContent, '0:00');
  assert.equal(h.el('elapsedDisplay').textContent, '1:00');
  await h.el('readerPause').click(); assert.equal(h.probe.state.playing, false);
  await h.el('finishRestart').click();
  assert.equal(h.probe.state.ended, false); assert.equal(h.probe.state.playing, true);
  assert.equal(h.probe.state.elapsedMs, 0); assert.equal(h.el('readerScroller').scrollTop, 0);
  assert.equal(h.el('readingPosition').value, '0');
  assert.equal(h.el('finishLayer').classList.contains('show'), false);
});

test('100% finishes even when native scroll geometry clamps below the theoretical endpoint', async () => {
  const h = await reader({ paceMode: 'duration' }); await pause(h);
  const scroller = h.el('readerScroller'); let position = 0;
  const physicalEnd = h.probe.state.endScroll - .013;
  Object.defineProperty(scroller, 'scrollTop', { get: () => position, set: value => { position = Math.max(0, Math.min(value, physicalEnd)); } });
  await seek(h, 100);
  assert.equal(h.probe.state.ended, true); assert.equal(h.probe.state.playing, false);
  assert.equal(h.el('readerProgressBar').style.width, '100%');
  assert.equal(h.el('readingPositionValue').textContent, '100%');
  assert.equal(h.el('remainingDisplay').textContent, '0:00');
  h.windowEvents.resize(); await scroller.fire('scroll');
  assert.equal(h.el('readerProgressBar').style.width, '100%');
  assert.equal(h.el('remainingDisplay').textContent, '0:00');
});

test('manual scroll to a fractionally clamped physical bottom also finishes', async () => {
  const h = await reader({ paceMode: 'duration' }); await pause(h);
  const scroller = h.el('readerScroller'), physicalEnd = h.probe.state.endScroll - .013;
  scroller.scrollHeight = physicalEnd + scroller.clientHeight;
  scroller.scrollTop = physicalEnd; await scroller.fire('scroll');
  assert.equal(h.probe.state.ended, true); assert.equal(h.el('remainingDisplay').textContent, '0:00');
  assert.equal(h.el('readingPositionValue').textContent, '100%');
});

test('99% on a short script remains paused even within one pixel of the end', async () => {
  const h = await reader({ text: '短文', paceMode: 'duration' }); await pause(h);
  h.el('readerContent').scrollHeight = 880; h.el('readerScroller').scrollHeight = 880; h.windowEvents.resize();
  await seek(h, 99);
  assert.equal(h.probe.state.ended, false); assert.equal(h.probe.state.playing, false);
  assert.equal(h.el('readingPositionValue').textContent, '99%'); assert.equal(h.el('remainingDisplay').textContent, '2:00');
});

test('expired target retains the existing five-second floor after seek', async () => {
  const h = await reader({ paceMode: 'duration', duration: 60 }); await pause(h, 70000); await seek(h, 75);
  near(h.probe.state.pxPerSec, h.probe.state.endScroll * .25 / 5);
  assert.equal(h.el('remainingDisplay').textContent, '0:05'); assert.equal(h.probe.state.elapsedMs, 70000);
});

test('short script, clamped manual scroll and finished resize remain bounded', async () => {
  const h = await reader({ text: '短文😀', paceMode: 'duration' }); await pause(h, 0);
  h.el('readerContent').scrollHeight = 810; h.windowEvents.resize();
  await seek(h, 75); assert.equal(h.probe.state.ended, false);
  h.el('readerScroller').scrollTop = -30; await h.el('readerScroller').fire('scroll');
  assert.equal(h.el('readerScroller').scrollTop, 0);
  h.el('readerScroller').scrollTop = h.probe.state.endScroll + 100;
  await h.el('readerScroller').fire('scroll'); assert.equal(h.probe.state.ended, true);
  const oldEnd = h.probe.state.endScroll; h.el('readerContent').scrollHeight += oldEnd; h.windowEvents.resize();
  assert.equal(h.el('readerProgressBar').style.width, '100%'); assert.equal(h.probe.state.ended, true);
});

test('fractional-pixel distance still honors remaining target time before the endpoint', async () => {
  const h = await reader({ text: '短', paceMode: 'duration', duration: 180 }); await pause(h);
  h.el('readerContent').scrollHeight = 800.1; h.windowEvents.resize();
  assert.ok(h.probe.state.endScroll < 2);
  await seek(h, 75);
  assert.equal(h.el('remainingDisplay').textContent, '2:00');
  near(h.probe.state.pxPerSec, h.probe.state.endScroll * .25 / 120);
  assert.equal(h.probe.state.ended, false);
});

test('range keyboard input and position-area clicks never trigger reader shortcuts/tap playback', async () => {
  const h = await reader(); await pause(h);
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'r', 'f']) {
    assert.equal(await h.key(key, { target: h.el('readingPosition') }), false, key);
  }
  assert.equal(h.probe.state.playing, false); assert.equal(h.probe.state.elapsedMs, 60000); assert.equal(h.probe.state.speed, 1);
  for (const target of ['readingPosition', 'readingPositionLabel', 'readerNavigation']) {
    await h.el('readerView').fire('click', { target: h.el(target), clientX: 500 });
    assert.equal(h.probe.state.playing, false);
  }
  for (const target of ['scriptInput', 'fileNameInput']) assert.equal(await h.key('r', { target: h.el(target) }), false);
  assert.equal(await h.key('r', { isComposing: true }), false);
  assert.equal(await h.key('r', { ctrlKey: true }), false);
  assert.equal(h.probe.state.elapsedMs, 60000);
  assert.equal(await h.key('ArrowRight'), true); assert.equal(h.probe.state.speed, 1.1);
  assert.equal(await h.key(' '), true); assert.equal(h.probe.state.playing, true);
  assert.equal(await h.key('r'), true); assert.equal(h.probe.state.elapsedMs, 0);
});

test('keyboard Start moves focus into the reader; buttons keep native activation and other shortcuts', async () => {
  const h = loadApp({ text: script }); h.el('startButton').focus();
  await h.el('startButton').click(); h.frame();
  assert.equal(h.document.activeElement, h.el('readerView'));
  assert.equal(h.el('readerView').attrs.tabindex, '-1');
  assert.equal(await h.key(' ', { target: h.document.activeElement }), true);
  assert.equal(h.probe.state.playing, false);
  h.el('readerPause').focus();
  assert.equal(await h.key(' ', { target: h.document.activeElement }), false);
  assert.equal(await h.key('Enter', { target: h.document.activeElement }), false);
  assert.equal(await h.key('ArrowRight', { target: h.document.activeElement }), true);
  assert.equal(h.probe.state.speed, 1.1);
  assert.equal(await h.key('r', { target: h.document.activeElement }), true);
  assert.equal(h.probe.state.playing, true);
  await h.key('Escape', { target: h.document.activeElement });
  assert.equal(h.probe.state.readerOpen, false); assert.equal(h.document.activeElement, h.el('startButton'));
});

test('startup/countdown cannot seek or shortcut into playing; closed startup cannot resume a newer session', async () => {
  const h = loadApp({ text: script, countdown: true });
  const first = h.el('startButton').click(); h.frame();
  assert.equal(h.el('readingPosition').disabled, true); assert.equal(h.el('readerNavigation').hidden, true);
  await seek(h, 75); await h.el('readerPause').click(); await h.key('r'); await h.key(' ');
  assert.equal(h.el('readerScroller').scrollTop, 0); assert.equal(h.probe.state.playing, false);
  await h.el('readerExit').click();
  assert.equal(h.el('countdownLayer').classList.contains('show'), false);
  h.probe.state.countdown = false;
  await h.el('startButton').click(); h.frame(); await pause(h, 12000);
  await h.advanceCountdown(); await first;
  assert.equal(h.probe.state.playing, false); assert.equal(h.probe.state.elapsedMs, 12000);
  assert.equal(h.el('readingPosition').disabled, false);
});

test('normal countdown and delayed fullscreen keep position disabled until playback starts', async () => {
  const h = loadApp({ text: script, countdown: true, fullscreen: true });
  let resolve; h.document.documentElement.requestFullscreen = () => new Promise(r => { resolve = r; });
  const start = h.el('startButton').click();
  assert.equal(h.el('readingPosition').disabled, true); await seek(h, 50);
  assert.equal(h.probe.state.playing, false); resolve(); await Promise.resolve(); await Promise.resolve();
  for (let n = 0; n < 3; n++) await h.advanceCountdown(); await start;
  assert.equal(h.probe.state.playing, true); assert.equal(h.el('readingPosition').disabled, true);
  await pause(h, 0); assert.equal(h.el('readingPosition').disabled, false);
});

test('exit/reopen and import/Clear preserve literal text, settings, file behavior and storage shape', async () => {
  const h = await reader({ mirror: true, align: 'center', speed: 1.2 }); await pause(h); await seek(h, 50);
  assert.equal(h.el('readerContent').textContent, script);
  assert.equal(h.el('readerContent').classList.contains('mirror'), true);
  assert.equal(h.el('readerContent').classList.contains('center'), true);
  await h.el('readerExit').click(); await h.el('startButton').click(); h.frame();
  assert.equal(h.probe.state.elapsedMs, 0); assert.equal(h.el('readerScroller').scrollTop, 0);
  await h.el('readerExit').click(); await h.select(file('置換 😀', 'new.txt')); await h.el('replaceCancel').click();
  assert.equal(h.el('scriptInput').value, script);
  await h.select(file('置換 😀', 'new.txt')); await h.el('replaceOk').click();
  assert.equal(h.el('scriptInput').value, '置換 😀'); assert.equal(h.saved().speed, 1.2); assert.equal(h.saved().mirror, true);
  assert.equal(h.el('fileNameInput').value, 'new.txt');
  await h.el('clearButton').click(); await h.el('confirmCancel').click(); assert.equal(h.el('scriptInput').value, '置換 😀');
  await h.el('clearButton').click(); await h.el('confirmOk').click(); assert.equal(h.el('scriptInput').value, '');
  assert.equal(h.el('fileNameInput').value, 'pocket-teleprompter.txt');
  assert.deepEqual(Object.keys(h.saved()).sort(), ['lang','text','paceMode','speed','duration','fontSize','align','mirror','cue','countdown','wake','fullscreen'].sort());
});
