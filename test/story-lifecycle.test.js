/**
 * R3 Phase D — the story-content pipeline.
 *
 * DEC-023 created this phase because R3 previously shipped an engine with
 * nothing able to feed it. Every rule below reuses R1's rules against R3's own
 * tables — same rules, own tables.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { approveScene, transitionScene, buildBundle, contentManifest, StoryRefusal }
  from '../src/engine/story-lifecycle.js';

const here = dirname(fileURLToPath(import.meta.url));
const scenes = readdirSync(join(here, '../src/content/scenes'))
  .map((f) => JSON.parse(readFileSync(join(here, '../src/content/scenes', f), 'utf8')));

const row = (over = {}) => ({
  scene_id: 'sc-01-01', version: '1.0.0', chapter: 'ch-01',
  lifecycle_state: 'in-review',
  editorial: { editors: ['author-a'], submittedBy: 'author-a' },
  document: scenes[0],
  ...over,
});

test('★ D8 — a reviewer who EDITED the version is refused; an independent one is not', () => {
  assert.throws(() => approveScene(row(), 'author-a'),
    (e) => e.refusal === 'reviewer-may-not-approve-own-version');
  // ...and somebody else CAN, which is what proves the refusal meant something.
  assert.deepEqual(approveScene(row(), 'reviewer-b'), { ok: true, from: 'in-review', to: 'approved' });
});

test('★ an EMPTY editor list is refused — that is how R1 made this rule vacuous', () => {
  // canApprove returns ok for anyone when the list is empty. B1 shipped that,
  // and the rule guaranteeing an independent reviewer guaranteed nothing.
  assert.throws(() => approveScene(row({ editorial: { editors: [], submittedBy: null } }), 'anyone'),
    (e) => e instanceof StoryRefusal && e.refusal === 'no-editor-recorded');
});

test('the lifecycle uses R1 rules — an illegal transition is refused', () => {
  assert.throws(() => transitionScene(row({ lifecycle_state: 'draft' }), 'approved'));
  assert.ok(transitionScene(row({ lifecycle_state: 'draft' }), 'in-review').ok);
});

test('★ D9 — an unapproved scene cannot enter a bundle', () => {
  const draft = row({ lifecycle_state: 'draft' });
  assert.throws(
    () => buildBundle({ version: 'v0.1', catalogueVersion: '1.0.0', scenes: [draft], builtBy: 'x' }),
    (e) => e.refusal === 'bundle-contains-unapproved-scene');

  const approved = row({ lifecycle_state: 'approved' });
  const bundle = buildBundle({ version: 'v0.1', catalogueVersion: '1.0.0', scenes: [approved], builtBy: 'x' });
  assert.equal(bundle.scenes.length, 1);
});

test('★ E3 — a bundle with no catalogue version is refused; bindings could not be pinned', () => {
  assert.throws(
    () => buildBundle({ version: 'v0.1', scenes: [row({ lifecycle_state: 'approved' })], builtBy: 'x' }),
    (e) => e.refusal === 'bundle-has-no-catalogue-version');
});

test('★ D12 — the manifest is DERIVED, and separates unbound from broken', () => {
  const m = contentManifest(
    [row({ lifecycle_state: 'approved' }), row({ scene_id: 'sc-01-02', lifecycle_state: 'draft' })],
    { bindingManifest: { unbound: [{ where: 'sc-a/d1' }], broken: [{ where: 'sc-c/d3' }] } },
  );
  assert.equal(m.scenes, 2);
  assert.deepEqual(m.unreviewed, ['sc-01-02@1.0.0'], 'one scene is not approved');
  assert.deepEqual(m.unboundTransfers, ['sc-a/d1'], 'the catalogue is thin — honest');
  assert.deepEqual(m.brokenTransfers, ['sc-c/d3'], 'a named block that does not resolve — different');
});

test('the manifest reports nothing when there is nothing — no hand-maintained rows', () => {
  const m = contentManifest([]);
  assert.equal(m.scenes, 0);
  assert.deepEqual(m.unreviewed, []);
});

test('every real Chapter 1 scene carries a text equivalent — the text path is not optional', () => {
  const m = contentManifest(scenes.map((d) => ({ scene_id: d.id, version: '1.0.0', document: d, lifecycle_state: 'approved' })));
  assert.deepEqual(m.missingTextEquivalent, [], 'a scene with no text equivalent excludes a whole access path');
});

// --- R3 G1, G2: art is additive ------------------------------------------------
import { assertPlayableWithoutArt, assetManifest, AssetRefusal } from '../src/engine/assets.js';

test('★ G2 — every real Chapter 1 scene is playable without any art', () => {
  for (const s of scenes) assert.ok(assertPlayableWithoutArt(s), s.id);
});

test('★ a scene with no text equivalent is REFUSED — that removes an access path', () => {
  const s = { ...scenes[0] }; delete s.text_equivalent;
  assert.throws(() => assertPlayableWithoutArt(s),
    (e) => e instanceof AssetRefusal && e.refusal === 'scene-has-no-text-equivalent');
});

test('★ a REQUIRED asset slot is refused — play must never depend on an image', () => {
  const s = { ...scenes[0], asset_slots: [{ id: 'key-art', required: true }] };
  assert.throws(() => assertPlayableWithoutArt(s), (e) => e.refusal === 'asset-slot-marked-required');
  // An optional slot, filled or not, is fine.
  assert.ok(assertPlayableWithoutArt({ ...scenes[0], asset_slots: [{ id: 'key-art' }] }));
});

test('★ G1 — the asset manifest is DERIVED, and unfilled is honest, not broken', () => {
  const m = assetManifest([
    { id: 'a', static_fallback: 'x', text_equivalent: 't', asset_slots: [{ id: 's1', asset_id: 'img-1' }] },
    { id: 'b', static_fallback: 'x', text_equivalent: 't', asset_slots: [{ id: 's2' }] },
  ]);
  assert.deepEqual(m.filled, ['a:s1']);
  assert.deepEqual(m.unfilled, ['b:s2']);
  assert.equal(m.bindingBlockedBy, 'Q10', 'binding a candidate as canonical needs the reviewer');
  assert.deepEqual(m.missingFallback, []);
});
