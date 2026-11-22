'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {loadApp} = require('./helpers/reader-harness.cjs');

function lock() {
  return {
    released: 0,
    addEventListener(event, callback) { if (event === 'release') this.onRelease = callback; },
    release() { this.released++; this.onRelease?.(); return Promise.resolve(); }
  };
}
async function drain() { for (let i = 0; i < 6; i++) await Promise.resolve(); }

test('failed auto-save is announced in Japanese and English and .txt export still works', async () => {
  const h = loadApp({text:'original'}, true);
  await h.edit('new original');
  h.windowEvents.pagehide();
  assert.match(h.el('saveStatus').textContent, /Auto-save failed/);
  await h.el('languageButton').click();
  assert.match(h.el('saveStatus').textContent, /自動保存できません/);
  await h.el('saveTextButton').click();
  assert.equal(await h.downloads[0].blob.text(), 'new original');
});

test('pagehide persists edits that have not reached the debounce deadline', async () => {
  const h = loadApp({text:'old'});
  await h.edit('a newer script');
  assert.equal(h.saved().text, 'old');
  h.windowEvents.pagehide();
  assert.equal(h.saved().text, 'a newer script');
  assert.equal(h.probe.state.dirty, false);
});

test('save failure can recover after storage becomes available again', async () => {
  const h = loadApp({text:'old'});
  h.blockStorage();
  await h.edit('modified');
  h.windowEvents.pagehide();
  assert.match(h.el('saveStatus').textContent, /Auto-save failed/);
  h.allowStorage();
  h.windowEvents.pagehide();
  assert.equal(h.saved().text, 'modified');
  assert.doesNotMatch(h.el('saveStatus').textContent, /failed/);
});

test('wake lock is released on pause/finish and reacquired on resume/restart', async () => {
  const locks=[];
  const h = loadApp({text:'hello', wake:true}, false, {wakeRequest:async()=>{const x=lock();locks.push(x);return x}});
  await h.el('startButton').click(); await drain();
  assert.equal(locks.length,1); assert.equal(h.probe.state.wakeLock,locks[0]);
  await h.el('readerPause').click(); await drain();
  assert.equal(locks[0].released,1); assert.equal(h.probe.state.wakeLock,null);
  await h.el('readerPause').click(); await drain();
  assert.equal(locks.length,2);
  h.probe.finishReader(); await drain();
  assert.equal(locks[1].released,1);
  await h.el('restartButton').click(); await drain();
  assert.equal(locks.length,3); assert.equal(h.probe.state.wakeLock,locks[2]);
  await h.el('readerExit').click(); await drain();
  assert.equal(locks[2].released,1);
});

test('a wake lock granted after exit is released instead of leaking', async () => {
  let resolveWake;
  const promise=new Promise(resolve=>{resolveWake=resolve});
  const h=loadApp({text:'hello',wake:true},false,{wakeRequest:()=>promise});
  await h.el('startButton').click();
  assert.equal(h.probe.state.wakeRequestPending,true);
  await h.el('readerExit').click();
  const stale=lock();resolveWake(stale);await drain();
  assert.equal(stale.released,1);
  assert.equal(h.probe.state.wakeLock,null);
  assert.equal(h.probe.state.readerOpen,false);
});

test('hidden tab pauses playback and releases wake lock without counting hidden time', async () => {
  const locks=[];
  const h=loadApp({text:'hello',wake:true},false,{wakeRequest:async()=>{const x=lock();locks.push(x);return x}});
  await h.el('startButton').click();await drain();
  h.probe.tick(200);
  const elapsed=h.probe.state.elapsedMs;
  h.document.visibilityState='hidden';
  h.documentEvents.visibilitychange();
  assert.equal(h.probe.state.playing,false);
  assert.equal(locks[0].released,1);
  h.probe.tick(10000);
  assert.equal(h.probe.state.elapsedMs,elapsed);
});

test('slow frame contributes its full foreground time to progress, not 80ms', async () => {
  for(const mode of ['speed','duration']){
    const h=loadApp({text:'A long passage',paceMode:mode,duration:180});
    await h.el('startButton').click();
    const pxPerSec=h.probe.state.pxPerSec;
    h.probe.tick(200);
    assert.equal(h.probe.state.elapsedMs,200,mode);
    assert.ok(Math.abs(h.el('readerScroller').scrollTop-pxPerSec*.2)<1e-5,mode);
  }
});

test('reader CSS prevents scroll gestures while playing and restores them while paused', () => {
  const h=loadApp();
  assert.match(h.source,/\.reader-view\.playing \.reader-scroller\{pointer-events:none;touch-action:none;overflow:hidden\}/);
});

test('backgrounding during countdown cancels pending autoplay but leaves the reader resumable', async () => {
  const h=loadApp({text:'hello',countdown:true});
  const pending=h.el('startButton').click();
  assert.equal(h.probe.state.starting,true);
  h.document.visibilityState='hidden';
  h.documentEvents.visibilitychange();
  assert.equal(h.probe.state.starting,false);
  assert.equal(h.probe.state.readerOpen,true);
  assert.equal(h.probe.state.playing,false);
  assert.equal(h.el('countdownLayer').classList.contains('show'),false);
  await h.advanceTime(3500);await pending;
  assert.equal(h.probe.state.playing,false);
  h.document.visibilityState='visible';
  await h.el('readerPause').click();
  assert.equal(h.probe.state.playing,true);
});

test('Clear warns instead of claiming success if persistent storage is blocked', async () => {
  const h=loadApp({text:'private notes'},true);
  await h.el('clearButton').click();
  await h.el('confirmOk').click();
  assert.equal(h.el('scriptInput').value,'');
  assert.match(h.el('fileStatus').textContent,/saved copy could not be updated/);
  assert.equal(h.saved().text,'private notes');
  assert.equal(h.el('toast').textContent,'');
});
