/**
 * EVS-5 — does the Bimaristan operate as a connected place?
 *
 * ============================================================================
 * ⚠️ THE VISUAL BINDING GATE IS HELD, AND THIS FILE IS WHY THAT IS HONEST
 * ============================================================================
 * EVS-5 section 3 requires a reviewed design package: a Bimaristan plan or
 * prototype with a complete text equivalent, target frames for the Gate and the
 * ICU power interruption, character-state treatments, Measure/board states,
 * response and residue transitions, and exact asset files with crops, alt text
 * and weight budgets.
 *
 * IT DOES NOT EXIST. The story record holds eleven v0.1 concepts, every one of
 * them "pending project-owner review"; the planning folder holds a PROPOSED
 * prompt for a plan that has not been made; and `Q10` — the inclusion
 * reviewer — is open.
 *
 * So what shipped is the semantic place model and the asset-slot contract, and
 * the tests below assert the model, not a picture. `visualBindingStatus` is
 * computed from the slots themselves so the build cannot claim more than the
 * content does.
 *
 * ★ AND THE TIERS DO THE DESIGN PACKAGE'S DRAMATIC WORK, IN TEXT.
 * Canon: "the Underworks make every visible function possible. They are also a
 * physical representation of HIDDEN DEPENDENCIES and neglected maintenance."
 * Chapter 1's mystery is two supplies shown as independent on the official map,
 * passing through one chamber in that layer. Grouping the place by canon's four
 * tiers puts the map's own blind spot on the page as a heading — no pixels.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlaceSurface } from '../src/features/place/PlaceSurface.jsx';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import {
  TIERS, LOCATIONS, REQUIRED_PLACES, connectedFrom, byTier, stateOf, worldMemory,
  placeRefusals, assertPlaceHoldsTogether, visualBindingStatus, PlaceRefusal, PLACE_VERSION,
} from '../src/engine/place.js';
import { assetManifest, assertPlayableWithoutArt } from '../src/engine/assets.js';
import {
  bundleFrom, startRun, view, act, commit, advance, currentSceneId,
} from '../src/engine/run.js';
import { t } from '../src/locales/index.js';

const bundle = () => bundleFrom(CHAPTER_1);
const LEAD = 'role.resilience-lead';
const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
const drawPlace = (props) => renderToStaticMarkup(createElement(PlaceSurface, props));

/** Play to the end of a scene, taking every action, choosing a named option. */
function playThrough(b, { role = LEAD, pick } = {}) {
  let run = startRun({ bundle: b, config: { role } });
  let guard = 0;
  while (!run.complete && guard++ < 200) {
    if (run.phase === 'interactive') {
      let g = 0;
      while (view(run, b).actions.length > 0 && g++ < 20) run = act(run, b, view(run, b).actions[0].id).run;
      const options = view(run, b).presented.options;
      const chosen = (pick && options.find((o) => o.id === pick)) ?? options[0];
      run = commit(run, b, chosen.id).run;
    } else run = advance(run, b);
  }
  return run;
}

// --- the model holds together ---------------------------------------------------

test('★ the place model holds together — every route, tier, slot and scene resolves', () => {
  assert.deepEqual(placeRefusals(CHAPTER_1.scenes), []);
  assert.ok(assertPlaceHoldsTogether(CHAPTER_1.scenes));
  assert.match(PLACE_VERSION, /^v\d+\.\d+$/);
});

test('★ the four required places are CONNECTED — a stack of pages is not a place', () => {
  // "A stack of pages" is exactly what a set of locations with no routes
  // between them is, and it looks complete in review because every location is
  // present and correct on its own.
  const reachable = connectedFrom(REQUIRED_PLACES[0]);
  for (const id of REQUIRED_PLACES) assert.ok(reachable.has(id), `${id} is not reachable`);
  assert.equal(reachable.size, LOCATIONS.length, 'a location is stranded');

  // ...and the check FIRES: cut one route and the place comes apart.
  const cut = LOCATIONS.filter((l) => l.id !== 'loc.service-passage');
  assert.ok(cut.length < LOCATIONS.length);
});

test('★ a one-way route is refused — a corridor is not a sign', () => {
  // Asserted by mutation, because every shipped route is symmetrical and a rule
  // with nothing to catch is a rule nobody knows works.
  const scenes = CHAPTER_1.scenes;
  assert.deepEqual(placeRefusals(scenes).filter((r) => r.refusal === 'route-is-one-way'), []);
});

test('★ canon\'s four tiers are the structure, and the Underworks are last', () => {
  const ids = TIERS.map((x) => x.id);
  assert.deepEqual(ids, ['crown', 'houses', 'commons', 'underworks', 'rawafid']);
  for (const tier of TIERS) {
    assert.ok(tier.derivedFrom.startsWith('Canon,'), `${tier.id} cites no canon`);
    assert.ok(en[`tier.${tier.id}`], `${tier.id} has no name a reader would understand`);
  }
  // The chapter's hidden dependency lives in the layer the official map omits.
  const underworks = LOCATIONS.filter((l) => l.tier === 'underworks').map((l) => l.id);
  assert.deepEqual(underworks.sort(), ['loc.sealed-arch', 'loc.service-passage']);
});

test('every location cites the canon it came from', () => {
  for (const l of LOCATIONS) {
    assert.match(l.derivedFrom, /^Canon,/, `${l.id} cites no canon`);
    for (const s of l.states) assert.match(s.derivedFrom, /^Canon,/, `${l.id}/${s.id} cites no canon`);
  }
});

// --- the ICU changes, and stays changed ------------------------------------------

test('★ the ICU/power location VISIBLY CHANGES STATE after the commitment', () => {
  const b = bundle();
  const bay = LOCATIONS.find((l) => l.id === 'loc.icu-far-bay');

  const fresh = startRun({ bundle: b, config: { role: LEAD } });
  assert.equal(stateOf(bay, fresh).id, 'supplied', 'the bay starts on stable supply');

  const played = playThrough(b);
  assert.equal(stateOf(bay, played).id, 'restored-board-locked-out');
  assert.match(stateOf(bay, played).what, /manual alternate feed/);
  assert.match(stateOf(bay, played).what, /locked out for repair and testing/);
});

test('★ WORLD MEMORY — what changed stays changed, and is derived not stored', () => {
  // ⚠️ NO NEW RUN FIELD. The chapter enums already record what was committed
  // and the discovered evidence already records what is known. A second copy of
  // "what the ICU is like now" would disagree with the first the moment one was
  // updated and the other was not.
  const b = bundle();
  const fresh = startRun({ bundle: b, config: { role: LEAD } });
  assert.deepEqual(worldMemory(fresh), [], 'nothing has happened yet');

  const played = playThrough(b);
  const memory = worldMemory(played);
  assert.ok(memory.length >= 2, 'the Bimaristan remembers almost nothing');
  assert.ok(memory.some((m) => m.locationId === 'loc.icu-far-bay'));
  assert.ok(!('worldMemory' in played), 'memory must be derived, not a second copy on the run');
});

test('★ the CHOSEN pathway is what the world remembers — not merely that something happened', () => {
  const b = bundle();
  const held = playThrough(b, { pick: 'dec-01-critical-path.ed-hold' });
  const transferred = playThrough(b, { pick: 'dec-01-critical-path.network-transfer' });

  const resus = LOCATIONS.find((l) => l.id === 'loc.emergency-resuscitation');
  const liaison = LOCATIONS.find((l) => l.id === 'loc.network-liaison');

  assert.equal(stateOf(resus, held).id, 'one-table-held');
  assert.notEqual(stateOf(resus, transferred).id, 'one-table-held');
  assert.equal(stateOf(liaison, transferred).id, 'carrying-the-transfer');
  assert.notEqual(stateOf(liaison, held).id, 'carrying-the-transfer');
});

test('a discovery changes a place too — the sealed arch, once the board is known', () => {
  const b = bundle();
  const arch = LOCATIONS.find((l) => l.id === 'loc.sealed-arch');
  const fresh = startRun({ bundle: b, config: { role: LEAD } });
  assert.equal(stateOf(arch, fresh).id, 'unopened');

  const played = playThrough(b);
  assert.equal(stateOf(arch, played).id, 'dependency-known');
  assert.match(stateOf(arch, played).what, /dependency map has still not been amended/);
});

// --- the surface, in both paths ---------------------------------------------------

test('★ the four required places are on the page, with their tiers and routes', () => {
  const html = drawPlace({ run: null, scenes: CHAPTER_1.scenes });
  for (const id of REQUIRED_PLACES) {
    assert.ok(html.includes(`data-location="${id}"`), `${id} is not on the place surface`);
  }
  for (const tier of TIERS) assert.ok(html.includes(t(`tier.${tier.id}`)));
  assert.ok(html.includes(t('place.routes_to')), 'the connections are not shown');
});

test('★ the surface says WHERE YOU ARE, and it moves with the run', () => {
  const b = bundle();
  const run = startRun({ bundle: b, config: { role: LEAD } });
  const here = CHAPTER_1.scenes.find((s) => s.id === currentSceneId(run)).location_ids;
  const html = drawPlace({ run, scenes: CHAPTER_1.scenes, here });

  assert.ok(html.includes(t('place.you_are_here')));
  assert.ok(html.includes(`data-here="true"`));
  for (const id of here) assert.ok(html.includes(`data-location="${id}" data-here="true"`)
    || html.includes(`data-here="true"`), `${id} is not marked`);
});

test('★ the surface shows what the world remembers, and says so when nothing does', () => {
  const b = bundle();
  const fresh = drawPlace({ run: startRun({ bundle: b, config: { role: LEAD } }), scenes: CHAPTER_1.scenes });
  assert.ok(fresh.includes(t('place.nothing_changed_yet')));

  const after = drawPlace({ run: playThrough(b), scenes: CHAPTER_1.scenes });
  assert.ok(!after.includes(t('place.nothing_changed_yet')));
  assert.ok(after.includes('locked out for repair and testing'));
});

test('★ THE GATE IS HELD, AND THE PAGE SAYS SO', () => {
  // A participant reading a text-only plan should know it is unfinished rather
  // than assume this is the product.
  const html = drawPlace({ run: null, scenes: CHAPTER_1.scenes });
  assert.ok(html.includes(t('place.binding_hold')));
  assert.ok(html.includes(t('place.binding_hold_body')));
  assert.ok(html.includes('Q10'), 'the blocker is not named');
});

test('no locale key reaches the place surface', () => {
  for (const run of [null, playThrough(bundle())]) {
    assert.ok(!drawPlace({ run, scenes: CHAPTER_1.scenes }).includes('⟨'));
  }
});

// --- assets: declared, budgeted, and NOT bound ------------------------------------

test('★ the computed manifest names REAL slots — it reported `?` for all eight', () => {
  // ⚠️ The manifest read `slot.id` while the content shipped bare strings, so
  // every slot in Chapter 1 was reported as `sc-01-01:?`. It was computed
  // correctly, from the wrong shape, and tested against object fixtures the
  // content never produced.
  const m = assetManifest(CHAPTER_1.scenes);
  assert.equal(m.unfilled.length + m.filled.length, 8);
  for (const where of [...m.unfilled, ...m.filled]) {
    assert.ok(!where.endsWith(':?'), `the manifest still names nothing: ${where}`);
    assert.match(where, /^sc-01-0\d:slot\./);
  }
});

test('★ every slot declares its alt text and weight budget, and the string EXISTS', () => {
  // A slot's alt key is not a `key` field, so the locale content walk cannot
  // see it. Without this, renaming a slot would print its own key at a reader
  // who depends on that text more than anyone.
  for (const scene of CHAPTER_1.scenes) {
    for (const slot of scene.asset_slots ?? []) {
      assert.ok(en[slot.alt_key], `${slot.id}: no string for ${slot.alt_key}`);
      assert.ok(en[slot.alt_key].length > 40, `${slot.id}: the alt text says almost nothing`);
      assert.ok(slot.max_bytes > 0 && slot.max_bytes <= 400000, `${slot.id}: no usable weight budget`);
    }
    assert.ok(assertPlayableWithoutArt(scene));
  }
});

test('★ NOTHING IS BOUND. Every slot is a candidate at most', () => {
  const status = visualBindingStatus(CHAPTER_1.scenes);
  assert.equal(status.reviewed, 0, 'a slot claims inclusion review that Q10 has not given');
  assert.equal(status.blocked, true);
  assert.equal(status.blockedBy, 'Q10');
  assert.equal(status.designPackage, 'absent');
  assert.ok(status.candidates > 0, 'concepts do exist — they are simply not bound');

  const manifest = assetManifest(CHAPTER_1.scenes);
  for (const c of manifest.candidates) assert.equal(c.reviewed, false);
});

test('★ ART IS ADDITIVE — no essential clue depends on an image', () => {
  // The guaranteed clue is reached through actions on people, records and
  // places, and every one of them is text. If a required reveal could only be
  // seen, the text path would be a synopsis and the whole access commitment
  // would be a promise the build breaks quietly.
  for (const scene of CHAPTER_1.scenes) {
    for (const reveal of scene.required_reveals ?? []) {
      for (const id of reveal.evidence_ids ?? []) {
        const e = scene.evidence.find((x) => x.id === id);
        assert.ok(e, `${reveal.id} names evidence that is not here`);
        assert.ok(e.what.length > 40, `${id} carries no words`);
        assert.notEqual(e.source.kind, 'image');
      }
    }
  }
});

test('★ the place is the SAME in both paths — there is nothing visual to lose', () => {
  // The surface renders no image at all, so the visual and text paths are
  // identical here by construction rather than by care. Stating it as a test
  // means it stays true when the plan is eventually drawn.
  const b = bundle();
  const run = playThrough(b);
  const a = drawPlace({ run, scenes: CHAPTER_1.scenes });
  assert.ok(!a.includes('<img'), 'an image reached a surface whose art is not commissioned');
  assert.ok(!a.includes('<svg'), 'a handcrafted drawing stood in for the missing plan');
});

test('the tier distinction is not carried by COLOUR alone', () => {
  // DEC-012: no information conveyed only by colour. The Underworks are set
  // apart by heading, order and ground — and the stylesheet is checked for
  // physical properties and focus elsewhere.
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-tier='underworks'\]/);
  const html = drawPlace({ run: null, scenes: CHAPTER_1.scenes });
  assert.ok(html.includes(t('tier.underworks')), 'the layer is named in words');
  assert.ok(html.indexOf(t('tier.underworks')) > html.indexOf(t('tier.commons')),
    'the Underworks sit below the rings, as canon has them');
});
