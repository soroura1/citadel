/**
 * ⛔ SCAFFOLDING. THIS PROVES THE HARNESS RUNS, AND NOTHING ELSE.
 *
 * The repository was reset to infrastructure on 2026-08-21 and every test of
 * the game was deleted with it. This file exists so that `npm test` — a
 * required step in the pipeline — has something to find.
 *
 * ⚠️ IT ASSERTS NOTHING ABOUT ANY BEHAVIOUR, AND IT MUST NOT BE ALLOWED TO
 * LOOK LIKE IT DOES. A green suite of one trivial test beside an empty `src`
 * is exactly the shape this project has learned to distrust: a check that
 * passes because there is nothing to check certifies nothing. The first real
 * test replaces it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('the test harness runs', () => {
  assert.equal(1, 1);
});

test('⚠️ and there is still nothing here — this fails the day a real module lands', () => {
  // Deliberately brittle. When someone adds the first engine module or
  // component, this test fails and forces them to delete the scaffolding
  // rather than leave it sitting under real code pretending to cover it.
  const src = readdirSync(new URL('../src', import.meta.url));
  assert.deepEqual(src, ['main.jsx'],
    'src/ has grown — delete test/smoke.test.js and write a real test for what you added');
});

test('the vite entry named by index.html exists', () => {
  // The one thing worth checking while the repo is empty: the build has an
  // entry to build. A missing entry fails the pipeline at `npm run build`
  // with an error that points at vite rather than at this.
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const entry = html.match(/src="(\/src\/[^"]+)"/)?.[1];
  assert.ok(entry, 'index.html names no module entry');
  assert.ok(readFileSync(new URL(`..${entry}`, import.meta.url), 'utf8').length > 0);
});
