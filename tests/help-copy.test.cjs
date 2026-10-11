const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { gunzipSync } = require('node:zlib');

const rejected = [
  "左右反転はハーフミラー式のテレプロンプター向けです。視線ガイドは読み位置をカメラ寄りに保つための補助線です。全画面が使えないブラウザーでも固定の本番画面は動作します。ダイアログを開いている間は背景のスクロールが止まります。",
  "Horizontal mirror mode is for beam-splitter rigs. The eye-line guide helps keep your reading position near the camera. The fixed reader works even if the browser cannot enter fullscreen. Background scrolling is paused while a dialog is open."
];

test('help contains user guidance rather than implementation or layout audit prose', () => {
  const root = path.join(__dirname, '..');
  const files = ['src/index.template.html', 'dist/index.html', 'dist/index.self-extract.html',
    ...fs.readdirSync(root).filter(name => name.endsWith('.html'))];
  for (const file of files) {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) continue;
    let html = fs.readFileSync(filename, 'utf8');
    const payload = html.match(/<script id="self-extract-payload"[^>]*>([\s\S]*?)<\/script>/) || html.match(/const b='([A-Za-z0-9+/=]+)'/);
    if (payload) html = gunzipSync(Buffer.from(payload[1].replace(/\s/g, ''), 'base64')).toString('utf8');
    for (const copy of rejected) assert.ok(!html.includes(copy), `${file}: remove internal-facing help copy: ${copy}`);
  }
});
