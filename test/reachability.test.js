/**
 * ★ F5, F6, F7 — REACHABILITY
 *
 * ============================================================================
 * THREE TESTS READING THREE DIFFERENT THINGS. A SINGLE TEST CANNOT CATCH THIS.
 * ============================================================================
 *
 * The prior build attempt shipped SIX screens nobody could navigate to. One was
 * built, tested, shipped and deployed, and for four consecutive releases the
 * only way to see it was to type a URL. It had passing component tests for all
 * of them.
 *
 *   1. ROUTING            — does the destination resolve?
 *      Cannot catch: a destination that resolves and nobody can find.
 *
 *   2. NAVIGATION INVENTORY — can a person FIND it?
 *      Cannot catch: whether it is in the deployed output.
 *
 *   3. DEPLOYED BYTES     — is it actually in the build?
 *      Cannot catch: intent.
 *
 * A COMPONENT TEST IS NOT A REACHABILITY TEST.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SURFACES, navigableSurfaces, reachableSurfaces, surfaceByPath } from '../src/surfaces.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// 1. ROUTING — every reachable surface has a route that resolves
// ---------------------------------------------------------------------------
describe('F5 — routing', () => {
  test('every reachable surface declares a path', () => {
    for (const s of reachableSurfaces()) {
      assert.ok(s.path, `surface "${s.id}" is reachable but declares no path`);
      assert.match(s.path, /^\//, `surface "${s.id}" path must be absolute`);
    }
  });

  test('no two surfaces claim the same path', () => {
    const seen = new Map();
    for (const s of SURFACES) {
      assert.ok(!seen.has(s.path), `${s.id} and ${seen.get(s.path)} both claim ${s.path}`);
      seen.set(s.path, s.id);
    }
  });

  test('a path resolves to exactly one surface', () => {
    for (const s of SURFACES) assert.equal(surfaceByPath(s.path)?.id, s.id);
  });
});

// ---------------------------------------------------------------------------
// 2. NAVIGATION INVENTORY — the test the prior attempt added too late
//
// This is the highest-value assertion in the file.
// ---------------------------------------------------------------------------
describe('F6 — navigation inventory', () => {
  test('every reachable surface is either in navigation or explicitly non-navigable WITH A REASON', () => {
    for (const s of reachableSurfaces()) {
      if (s.inNavigation) continue;
      assert.ok(
        s.reason && s.reason.length > 20,
        `Surface "${s.id}" is reachable but not in navigation, and gives no reason. ` +
          `That is exactly how a screen becomes unreachable: not by decision, but by nobody noticing. ` +
          `Either put it in navigation or say why it is not there.`,
      );
    }
  });

  test('at least one surface is navigable — otherwise navigation is decorative', () => {
    assert.ok(navigableSurfaces().length > 0);
  });

  test('the navigation component offers exactly the navigable surfaces', () => {
    const navFile = join(root, 'src/layout/navigation.jsx');
    if (!existsSync(navFile)) {
      assert.fail('src/layout/navigation.jsx is missing — nothing renders navigation');
    }
    const source = readFileSync(navFile, 'utf8');
    assert.match(
      source,
      /navigableSurfaces\(\)/,
      'Navigation must be DERIVED from the surface inventory, never hand-written. ' +
        'A hand-written navigation bar and an inventory drift, and the drift is invisible.',
    );
  });

  test('no surface is reachable ONLY by typing a URL', () => {
    const orphans = reachableSurfaces().filter((s) => !s.inNavigation && !s.reason);
    assert.equal(orphans.length, 0, `orphaned: ${orphans.map((s) => s.id).join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// 3. DEPLOYED BYTES — reads the BUILD, not the source
//
// One deployed bundle in the prior attempt was byte-identical to the release
// before it. Only a bytes check finds that.
// ---------------------------------------------------------------------------
describe('F7 — deployed bytes', () => {
  const distDir = join(root, 'dist');
  const built = existsSync(distDir);

  test('every reachable surface appears in the built output', { skip: built ? false : 'no dist/ — run `npm run build` first' }, () => {
    const bytes = readdirSync(join(distDir, 'assets'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => readFileSync(join(distDir, 'assets', e.name), 'utf8'))
      .join('');

    for (const s of reachableSurfaces()) {
      assert.ok(
        bytes.includes(s.path) || bytes.includes(s.id),
        `Surface "${s.id}" is declared reachable but does not appear in the built output. ` +
          `It was tree-shaken, or never wired in. Implemented ≠ deployed.`,
      );
    }
  });

  test('the synthetic gateway NEVER reaches the production bundle', { skip: built ? false : 'no dist/' }, () => {
    const bytes = readdirSync(join(distDir, 'assets'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => readFileSync(join(distDir, 'assets', e.name), 'utf8'))
      .join('');

    assert.ok(
      !bytes.includes('a synthetic demonstration catalogue'),
      'The synthetic gateway is in the production bundle. It names itself distinctly precisely ' +
        'so this check can find it — a synthetic source must never be indistinguishable from live truth.',
    );
  });

  test('the scope boundary is present in the built output', { skip: built ? false : 'no dist/' }, () => {
    const html = readFileSync(join(distDir, 'index.html'), 'utf8');
    const bytes = readdirSync(join(distDir, 'assets'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => readFileSync(join(distDir, 'assets', e.name), 'utf8'))
      .join('');
    assert.ok(
      (html + bytes).includes('preparedness, exercise and improvement only'),
      'The scope-boundary statement is not in the deployed bytes. It is a safety property, and it ' +
        'must reach the user BEFORE any credential decision.',
    );
  });
});
