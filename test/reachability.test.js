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

// ---------------------------------------------------------------------------
// ★ THE FOURTH ASSERTION IS MISSING, AND THIS IS WHERE IT WOULD GO.
//
// Routing, navigation inventory and deployed bytes ALL PASSED while the
// production page was BLANK. <Navigation> used TanStack Router's <Link>, R0
// mounts no RouterProvider, and the Link threw
// `Cannot read properties of null (reading 'stores')` during render.
//
// Every assertion here is about whether a surface CAN be reached. None
// EXECUTES it. "Routed, listed and shipped" is not "renders".
//
// ⚠️ WHY THERE IS NO RENDER TEST: `node --test` cannot import `.jsx` --
// ERR_UNKNOWN_FILE_EXTENSION. There is no JSX transform in this repo's test
// path, which is exactly why no test has ever rendered a component. Adding one
// (a loader, or an SSR build step before the tests) is a real change and is
// OWED -- see citadel/CLAUDE.md.
//
// Until then the static guard below catches this defect class, and H5 -- a
// human opening the page -- remains the only thing that executes it. That is
// not a shortfall in H5; it is the reason the plan specifies it.
// ---------------------------------------------------------------------------

test('★ no surface imports a router Link while R0 mounts no RouterProvider', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const src = new URL('../src/', import.meta.url).pathname;

  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

  const mountsRouter = walk(src).some((f) =>
    /\.jsx?$/.test(f) && /RouterProvider/.test(readFileSync(f, 'utf8')));

  if (mountsRouter) return;   // R3 mounts one; the guard retires itself

  for (const f of walk(src).filter((f) => /\.jsx?$/.test(f))) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!/@tanstack\/react-router/.test(text),
      `${f} imports @tanstack/react-router, but nothing mounts a RouterProvider — ` +
      `its hooks read a null router context and throw during render`);
  }
});

// ---------------------------------------------------------------------------
// ★ THE DEFAULT CONSTRUCTOR PATH — the one production uses, and the one no
//   test ever ran.
//
// `fetchImpl = fetch` captured the unbound native function. Calling it as
// `this.#fetch(...)` set `this` to the gateway, and the browser refused with
// "Illegal invocation". The item screen was dead in production while every
// test passed -- because every test injects a fake fetchImpl.
//
// A default parameter is production code. Test it like production code.
// ---------------------------------------------------------------------------
test('★ the gateway does not call fetch with itself as `this`', async () => {
  const { HttpCatalogueGateway } = await import('../src/gateways/catalogue-gateway.js');

  const original = globalThis.fetch;
  let sawThis = 'never called';
  globalThis.fetch = function (...args) {
    sawThis = this;
    return Promise.resolve({ ok: true, json: async () => ({ id: 'X' }), headers: new Map() });
  };

  try {
    // No fetchImpl -- exactly what main.jsx does.
    const gateway = new HttpCatalogueGateway({ baseUrl: '/api/content' });
    await gateway.getItem('1.0.0', 'X');
    assert.notEqual(sawThis, 'never called', 'global fetch was never reached');
    assert.ok(
      sawThis === globalThis || sawThis === undefined,
      `fetch was invoked with \`this\` = ${sawThis?.constructor?.name ?? sawThis} — ` +
      'a browser refuses that with "Illegal invocation"',
    );
  } finally {
    globalThis.fetch = original;
  }
});

// --- R3 F10: the inventory tracks what R3 built --------------------------------

test('★ F10 — Setup and Play are REACHABLE, and no longer merely planned', async () => {
  const { SURFACES, PLANNED_SURFACES, reachableSurfaces } = await import('../src/surfaces.js');
  for (const id of ['setup', 'play']) {
    const s = SURFACES.find((x) => x.id === id);
    assert.ok(s, `${id} is not in the inventory`);
    assert.equal(s.status, 'reachable');
    assert.ok(!PLANNED_SURFACES.some((p) => p.id === id),
      `${id} is both built and still listed as planned — two states for one surface`);
  }
  // ⚠️ COUNTED, so adding a surface is a deliberate act rather than a drift.
  // Seven since EVS-6: entry, item, setup, play, place, record, observation.
  assert.equal(reachableSurfaces().length, 7);
  for (const id of ['record', 'observation']) {
    assert.ok(!PLANNED_SURFACES.some((p) => p.id === id),
      `${id} is built and still listed as planned — two states for one surface`);
  }
  assert.ok(SURFACES.find((x) => x.id === 'place')?.inNavigation,
    'the Bimaristan must be findable without leaving the scene to look for it');
});

test('★ no surface sits at "routed but not reachable" without a dated justification', async () => {
  const { SURFACES } = await import('../src/surfaces.js');
  for (const s of SURFACES) {
    if (s.status !== 'reachable') {
      assert.ok(s.reason && /\d{4}/.test(s.reason),
        `${s.id} is not reachable and its justification carries no date — ` +
        'the prior attempt shipped six screens nobody could reach');
    }
  }
});

test('every reachable surface is in navigation, or says why not', async () => {
  const { SURFACES } = await import('../src/surfaces.js');
  for (const s of SURFACES.filter((x) => x.status === 'reachable' && !x.inNavigation)) {
    assert.ok(s.reason?.length > 20, `${s.id} is reachable, absent from navigation, and unexplained`);
  }
});
