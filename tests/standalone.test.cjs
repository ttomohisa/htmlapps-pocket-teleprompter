const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
test('both generated release variants contain the actual source runtime and offline CSP', () => {
  const source = read('src/index.template.html'), readable = read('dist/index.html'), wrapper = read('dist/index.self-extract.html');
  const decoded = zlib.gunzipSync(Buffer.from(wrapper.match(/const b='([^']+)'/)[1], 'base64')).toString('utf8');
  assert.equal(decoded, readable);
  assert.equal(read('pocket-teleprompter.html'), readable, 'root download must match the canonical readable release');
  const runtime = html => html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  assert.equal(runtime(source), runtime(readable)); new vm.Script(runtime(readable));
  for (const html of [readable, decoded]) { assert.match(html, /connect-src 'none'/); assert.doesNotMatch(html, /__APP_CONFIG_JSON__|__BUILD_MANIFEST_JSON__|__EMBEDDED_ASSET_BUNDLE_BASE64__/); assert.doesNotMatch(html, /<(?:script|link|iframe)[^>]*(?:src|href)=["']https?:/i); }
});
