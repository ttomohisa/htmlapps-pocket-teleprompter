'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('target time range and version are consistent across code and release documentation', () => {
  const config = JSON.parse(read('app.config.json'));
  const app = read('src/index.template.html');
  const spec = read('APP_SPEC.md');
  const changelog = read('CHANGELOG.md');
  assert.match(app, /id="durationRange"[^>]*min="30" max="1200" step="30"/);
  assert.match(spec, /between 30 seconds and 20 minutes/);
  assert.match(read('README.md'), /30 seconds and 20 minutes/);
  assert.match(read('README.ja.md'), /30秒〜20分/);
  assert.match(changelog, /Target time minimum to 30 seconds/);
  assert.match(changelog, new RegExp('## ' + config.version.replace(/\./g, '\\.') + ' - '));
  assert.ok(app.includes('id="versionBadge">v' + config.version + '</span>'));
});

test('script-clearing semantics, import/export placement and mobile badge docs match implementation', () => {
  const app = read('src/index.template.html');
  const spec = read('APP_SPEC.md');
  const en = read('README.md');
  const ja = read('README.ja.md');
  assert.match(app, /<details class="download-details" id="downloadDetails"><summary[^>]*>テキストを保存<\/summary>/);
  assert.match(spec, /saved reading preferences remain/);
  assert.match(spec, /hidden at 820px or less/);
  assert.match(en, /Expand \*\*Save script as text\*\*/);
  assert.match(ja, /\*\*テキストを保存\*\*/);
  assert.match(ja, /原稿を消去しても読み上げ設定は残ります/);
  assert.match(read('VERIFY_OFFLINE.md'), /Replace outdated images before publication/);
});
