import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('the entry mounts the XP0 application rather than reset scaffolding', () => {
  const entry = read('src/main.jsx');
  assert.match(entry, /import \{ App \} from '\.\/App\.jsx'/);
  assert.match(entry, /<App\s*\/>/);
  assert.doesNotMatch(entry, /data-scaffolding/);
});

test('the XP0 source contains the complete ordinary-to-debrief walk', () => {
  const source = read('src/App.jsx');
  for (const phase of ['operate', 'incident', 'recovery', 'debrief']) {
    assert.match(source, new RegExp(`${phase}:`), `missing ${phase} phase`);
  }
  assert.match(source, /selected\.length !== 2/);
  assert.match(source, /Commit within authority/);
  assert.match(source, /Which essential service in your own hospital/);
  assert.match(source, /StructuredView/);
});

test('every participant-visible image exists in the deployable public tree', () => {
  const source = read('src/App.jsx');
  const paths = [...source.matchAll(/src=(?:\{|)["'](\/scenes\/[^"']+)["']/g)].map((match) => match[1]);
  const conditionalPaths = [...source.matchAll(/["'](\/scenes\/bimaristan-sector-[^"']+)["']/g)].map((match) => match[1]);
  const all = new Set([...paths, ...conditionalPaths]);
  assert.ok(all.size >= 4, 'expected arrival, character and two sector-state assets');
  for (const path of all) assert.ok(existsSync(new URL(`public${path}`, root)), `${path} is missing`);
});

test('operational map derivatives stay within their declared XP0 delivery ceiling', () => {
  for (const name of ['bimaristan-sector-ordinary-v0.1.jpg', 'bimaristan-sector-outage-v0.1.jpg']) {
    const bytes = statSync(new URL(`public/scenes/${name}`, root)).size;
    assert.ok(bytes <= 600_000, `${name} is ${bytes} bytes; XP0 ceiling is 600000`);
  }
});

test('the safety boundary remains visible without JavaScript', () => {
  const html = read('index.html');
  assert.match(html, /preparedness, exercise and improvement only/i);
  assert.match(html, /not live incident command/i);
});
