const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/reader-harness.cjs');
const script = 'A synthetic rehearsal script.\n'.repeat(30);
const pausePath = 'M8 6h3v12H8zM13 6h3v12h-3z';
const playPath = 'm9 7 8 5-8 5V7Z';

function accessibleName(h, id) {
  const el = h.el(id);
  return el.attrs['aria-labelledby']
    ? el.attrs['aria-labelledby'].split(/\s+/).map(ref => h.el(ref).textContent).join(' ')
    : el.attrs['aria-label'];
}

for (const lang of ['ja', 'en']) test(`playback action stays truthful through click, Space, finish and restart (${lang})`, async () => {
  const h = loadApp({ text: script, lang });
  await h.el('startButton').click(); h.frame();
  const expectAction = playing => {
    const label = lang === 'ja' ? (playing ? '一時停止' : '再開') : (playing ? 'Pause' : 'Resume');
    assert.equal(h.probe.state.playing, playing);
    assert.equal(accessibleName(h, 'readerPause'), label);
    assert.equal(h.el('readerPause').attrs.title, label);
    assert.equal(h.el('readerPause').disabled, false);
    assert.equal(h.el('readerPausePath').attrs.d, playing ? pausePath : playPath);
  };
  expectAction(true);
  await h.el('readerPause').click(); expectAction(false);
  await h.key(' '); expectAction(true);
  await h.key(' '); expectAction(false);
  await h.el('readerPause').click(); expectAction(true);
  await h.el('readerPause').click(); expectAction(false);
  h.el('readingPosition').value = '100'; await h.el('readingPosition').fire('input');
  assert.equal(h.el('readerPause').disabled, true);
  assert.equal(accessibleName(h, 'readerPause'), lang === 'ja' ? '最後まで到達しました' : 'Reached the end');
  await h.el('finishRestart').click(); expectAction(true);
  await h.el('readerExit').click(); assert.equal(h.el('readerPause').disabled, true);
  await h.el('startButton').click(); h.frame(); expectAction(true);
});

test('countdown and interrupted startup never expose an enabled Resume action', async () => {
  const h = loadApp({ text: script, countdown: true, lang: 'en' });
  const started = h.el('startButton').click(); h.frame();
  assert.equal(h.el('readerPause').disabled, true);
  assert.equal(accessibleName(h, 'readerPause'), 'Starting…');
  await h.el('readerExit').click();
  await h.advanceTime(3000); await started;
  assert.equal(h.el('readerPause').disabled, true);
  assert.equal(h.probe.state.playing, false);
});

for (const initial of ['ja', 'en']) test(`editor, settings and icon-control names follow repeated language changes from ${initial}`, async () => {
  const h = loadApp({ text: script, lang: initial });
  for (let n = 0; n < 4; n++) {
    const ja = h.probe.state.lang === 'ja';
    const expected = {
      scriptInput: ja ? '原稿' : 'Script', speedRange: ja ? '速度' : 'Speed',
      durationRange: ja ? '目標時間' : 'Target time', fontRange: ja ? '文字サイズ' : 'Text size',
      mirrorToggle: ja ? '左右反転' : 'Mirror horizontally', cueToggle: ja ? '視線ガイド' : 'Eye-line guide',
      countdownToggle: ja ? '3秒カウントダウン' : '3-second countdown', wakeToggle: ja ? '画面を消さない' : 'Keep screen awake',
      fullscreenToggle: ja ? '全画面を試す' : 'Try fullscreen',
      helpClose: ja ? '閉じる' : 'Close', confirmClose: ja ? '閉じる' : 'Close', replaceClose: ja ? '閉じる' : 'Close',
      readerExit: ja ? '原稿へ戻る' : 'Back to editor', restartButton: ja ? '最初から' : 'Restart'
    };
    for (const [id, name] of Object.entries(expected)) assert.equal(accessibleName(h, id), name, id);
    const ariaElements = h.document.querySelectorAll('[data-i18n-aria-label]');
    for (const [key, expectedName] of Object.entries(ja
      ? { decreaseSpeed: '速度を下げる', increaseSpeed: '速度を上げる', decreaseDuration: '目標時間を短くする', increaseDuration: '目標時間を長くする', decreaseFont: '文字を小さくする', increaseFont: '文字を大きくする' }
      : { decreaseSpeed: 'Decrease speed', increaseSpeed: 'Increase speed', decreaseDuration: 'Shorten target time', increaseDuration: 'Lengthen target time', decreaseFont: 'Decrease text size', increaseFont: 'Increase text size' })) {
      const el = ariaElements.find(el => el.dataset.i18nAriaLabel === key);
      assert.ok(el, `Missing control ${key}`); assert.equal(el.attrs['aria-label'], expectedName);
    }
    assert.match(h.el('scriptInput').attrs['aria-describedby'], /scriptHelp/);
    await h.el('languageButton').click();
  }
});

for (const lang of ['ja', 'en']) test(`Help documents existing reader shortcuts and their exceptions (${lang})`, () => {
  const h = loadApp({ lang });
  const help = h.source.match(/<dialog id="helpDialog"[\s\S]*?<\/dialog>/)[0];
  const keys = ['helpKeyboardTitle', 'helpKeyboardContext', 'helpKeyboardSpace', 'helpKeyboardArrows', 'helpKeyboardRestart', 'helpKeyboardFullscreen', 'helpKeyboardEscape', 'helpKeyboardControls'];
  const translated = h.document.querySelectorAll('[data-i18n]');
  const text = keys.map(key => {
    assert.ok(help.includes(`data-i18n="${key}"`), `Help is missing ${key}`);
    const el = translated.find(el => el.dataset.i18n === key);
    assert.ok(el?.textContent && el.textContent !== key, `Missing translation: ${key}`);
    return el.textContent;
  }).join('\n');
  for (const key of ['Space', '←', '→', 'R', 'F', 'Esc']) assert.ok(text.includes(key), key);
  assert.match(text, lang === 'ja' ? /スライダー/ : /slider/);
  assert.match(text, lang === 'ja' ? /もう一度/ : /again/);
});
