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
  assert.ok(status.candidates > 0, 'concepts do exist — they are simply not bound');

  // ⚠️ PARTIAL, NOT PRESENT. VA-012 closes the plan requirement and nothing
  // else: EVS-5 §3 also asks for state frames, character treatments,
  // instrument states and the two transitions, and none exists. Reporting
  // "present" because one item arrived would be the status claiming more than
  // the content holds.
  assert.equal(status.designPackage, 'partial-candidate-generated');

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

test('★ EVS-5A — the place is COMPLETE WITHOUT THE IMAGE, now that there is one', () => {
  // ⚠️ THIS TEST CHANGED MEANING, AND THAT IS THE POINT. Before VA-012 it
  // asserted no `<img>` existed, which was easy and proved nothing about
  // parity. Now there is a picture, so parity has to be earned: every location,
  // tier, state and route must be readable in words, and the plan's own
  // paragraph must stand alone.
  const b = bundle();
  const run = playThrough(b);
  const html = drawPlace({ run, scenes: CHAPTER_1.scenes });

  // Strip every image and see what a participant on the text path still has.
  const withoutArt = html.replace(/<figure[\s\S]*?<\/figure>/g, '');
  for (const location of LOCATIONS) {
    assert.ok(withoutArt.includes(location.name), `${location.id} exists only in the picture`);
    assert.ok(withoutArt.includes(location.what.slice(0, 40)), `${location.id} is named but not described`);
  }
  for (const tier of TIERS) assert.ok(withoutArt.includes(t(`tier.${tier.id}`)));
  assert.ok(withoutArt.includes(t('place.routes_to')), 'the connections exist only in the picture');
  assert.ok(withoutArt.includes(t('place.what_changed')), 'world memory exists only in the picture');

  // ★ AND NOTHING WAS FAKED. One real candidate, and no drawing stood in for
  // the frames that still do not exist.
  assert.ok(!html.includes('<svg'), 'a handcrafted drawing appeared');
  assert.equal((html.match(/<img/g) ?? []).length, 1, 'more images than the one candidate');
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

// --- the plan itself: declared, empty, and its text equivalent already written ---

test('★ the PLAN has a slot, and it is held to the same rules a scene\'s slot is', async () => {
  // ⚠️ ONE SHAPE. EVS-5 spent a breaking release removing a second slot shape;
  // giving the plan its own would rebuild the defect somewhere new.
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  assert.equal(PLAN_SLOT.id, 'slot.plan.bimaristan-cutaway');
  assert.equal(PLAN_SLOT.kind, 'plan');
  assert.ok(PLAN_SLOT.max_bytes > 0, 'the budget is declared before the art exists');
  assert.ok(en[PLAN_SLOT.alt_key], 'the text equivalent is declared before the art exists');
  assert.equal(PLAN_SLOT.candidate_ref, 'VA-012');
});

test('★ EVS-5A — the plan is MADE and STILL NOT BOUND, and both are reported', async () => {
  // Two different facts. A status that collapsed them would let "the picture
  // exists" be read as "the picture is canon", which is exactly what Q10 is
  // for — the story record says the same in its own words: incidental details
  // do not become canon by appearing in an image.
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  const status = visualBindingStatus(CHAPTER_1.scenes);

  assert.equal(status.plan.made, true, 'VA-012 was generated');
  assert.equal(status.plan.file, '/scenes/bimaristan-cutaway.jpg');
  assert.equal(status.plan.candidate, 'VA-012');

  assert.equal(status.plan.reviewed, false);
  assert.equal(PLAN_SLOT.inclusion_reviewed, false);
  assert.equal(PLAN_SLOT.reviewed_by, null);
  assert.equal(status.blocked, true, 'the gate must stay held while Q10 is open');
  assert.equal(status.blockedBy, 'Q10');

  // The plan counts toward the tally. Leaving it out would report a binding
  // status that looks closer to done than it is.
  assert.equal(status.slots, 9);
});

test('★ EVS-5A — the derivative EXISTS and is inside the budget the slot declared FIRST', async () => {
  // ⚠️ The budget was declared before the image existed, which is the whole
  // reason it means anything: a budget agreed after the art arrives is a budget
  // the art sets.
  const { statSync } = await import('node:fs');
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  const file = new URL(`../public${PLAN_SLOT.candidate_file}`, import.meta.url);

  const bytes = statSync(file).size;
  assert.ok(bytes > 0, 'the slot names a file that is not there');
  assert.ok(bytes <= PLAN_SLOT.max_bytes,
    `the derivative is ${bytes} bytes against a declared ceiling of ${PLAN_SLOT.max_bytes}`);
});

test('★ EVS-5A — a false review claim is refused', async () => {
  // The one mutation that would matter: a slot asserting Q10 gave a review it
  // has not given. `assertPlayableWithoutArt` refuses an unattributed one.
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  const scene = { ...CHAPTER_1.scenes[0], asset_slots: [{ ...PLAN_SLOT, inclusion_reviewed: true, reviewed_by: null }] };
  assert.throws(() => assertPlayableWithoutArt(scene),
    (e) => e.refusal === 'asset-slot-claims-unattributed-review');
});

test('★ THE TEXT EQUIVALENT IS COMPLETE, AND IT WAS NEVER A PLACEHOLDER', async () => {
  // EVS-5 §3 requires the plan AND its text equivalent. It was written before
  // the image existed, because the second half never depended on the first —
  // and now that the image is here the paragraph stays whole beside it rather
  // than shrinking into an alt attribute.
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  const alt = en[PLAN_SLOT.alt_key];
  assert.ok(alt.length > 800, 'a one-line alt text is not an equivalent for a whole-building plan');

  // It must name all four tiers, or it is not a description of this plan.
  for (const tier of ['Crown', 'Houses', 'Commons', 'Underworks']) {
    assert.ok(alt.includes(tier), `the text equivalent does not mention the ${tier}`);
  }
  // ...and the two dependencies the picture exists to make visible.
  assert.match(alt, /sealed arch/i, 'the electrical dependency is missing');
  assert.match(alt, /taut wire|water-driven clock/i, 'the timekeeping dependency is missing');

  const html = drawPlace({ run: null, scenes: CHAPTER_1.scenes });
  assert.ok(html.includes(alt.slice(0, 80)), 'the text equivalent is not on the page');
  // ...and it is the image's alt too, so a reader who never sees the picture
  // gets the same words rather than a shorter summary of them.
  assert.ok(html.includes(`alt="${alt.slice(0, 60)}`), 'the image carries different words');
});

test('the derive script reads the budget from the CONTENT, never from an argument', async () => {
  // A budget that can be passed in is a budget the person in a hurry chooses.
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync('node',
    [new URL('../scripts/lib/slot-lookup.mjs', import.meta.url).pathname, 'slot.plan.bimaristan-cutaway'],
    { encoding: 'utf8' }).trim().split(' ');
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  assert.equal(Number(out[0]), PLAN_SLOT.max_bytes);
  assert.equal(out[2], PLAN_SLOT.alt_key);

  const script = readFileSync(new URL('../scripts/derive-asset.sh', import.meta.url), 'utf8');
  assert.ok(!/BUDGET="?\$[123]/.test(script), 'the budget must not come from the command line');
  assert.match(script, /inclusion_reviewed: false/, 'the script must not imply it binds anything');
});

// --- EVS-5A: the composition the BROWSER runs ------------------------------------

test('★ the PRODUCTION place route renders the candidate at its EXACT declared path', async () => {
  // ⚠️ FIFTH APPEARANCE OF ONE SHAPE. `main.jsx` cannot be executed by a test,
  // and the `here` computation — which locations are marked "you are here" —
  // lived there. `PlaceRoute` owns it now, and this renders the same component
  // the browser mounts.
  const { PlaceRoute } = await import('../src/features/place/PlaceRoute.jsx');
  const { PLAN_SLOT } = await import('../src/engine/place.js');
  const b = bundle();
  const run = startRun({ bundle: b, config: { role: LEAD } });

  const html = renderToStaticMarkup(createElement(PlaceRoute, {
    run, bundle: b, scenes: CHAPTER_1.scenes,
  }));

  // The exact path, from the slot. There is no second inventory of the art.
  assert.ok(html.includes(`src="${PLAN_SLOT.candidate_file}"`), 'the candidate is not rendered');
  assert.equal(PLAN_SLOT.candidate_file, '/scenes/bimaristan-cutaway.jpg');
  assert.ok(html.includes('width="1600"') && html.includes('height="1066"'),
    'no intrinsic size — the page will jump when the image lands');
  assert.ok(html.includes('loading="lazy"'), 'the audience is on slow connections');

  // ★ Provisional, on the image itself.
  assert.ok(html.includes(`data-provisional="${t('provisional.badge')}"`));
  assert.ok(html.includes(t('place.plan_provisional')));
  assert.ok(html.includes('VA-012'), 'the candidate is not identified');

  // ★ And the localised alt is the whole text equivalent, not a summary.
  assert.ok(html.includes(t(PLAN_SLOT.alt_key).slice(0, 60)));
});

test('★ the route computes WHERE YOU ARE — the line that lived in main.jsx', async () => {
  const { PlaceRoute } = await import('../src/features/place/PlaceRoute.jsx');
  const b = bundle();
  const props = { bundle: b, scenes: CHAPTER_1.scenes };

  const atStart = renderToStaticMarkup(createElement(PlaceRoute, {
    ...props, run: startRun({ bundle: b, config: { role: LEAD } }),
  }));
  assert.ok(atStart.includes('data-here="true"'));
  assert.ok(atStart.includes(t('place.you_are_here')));

  // A completed run is nowhere in particular — marking a location would claim
  // the participant is still standing in it.
  const finished = playThrough(b);
  const atEnd = renderToStaticMarkup(createElement(PlaceRoute, { ...props, run: finished }));
  assert.ok(!atEnd.includes('data-here="true"'));

  // ...and with no run at all the place is still readable.
  const noRun = renderToStaticMarkup(createElement(PlaceRoute, { ...props, run: null }));
  assert.ok(noRun.includes(t('place.title')));
});

test('★ the old "not made" line is GONE — a stale status is a lie the page tells', async () => {
  const en = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'));
  assert.equal(en['place.plan_not_yet_made'], undefined,
    'the string that said the plan was unmade still exists');

  const { PlaceRoute } = await import('../src/features/place/PlaceRoute.jsx');
  const b = bundle();
  const html = renderToStaticMarkup(createElement(PlaceRoute, {
    run: null, bundle: b, scenes: CHAPTER_1.scenes,
  }));
  assert.ok(!/not been made|not yet made/i.test(html));

  // ⚠️ AND THE HOLD IS STILL ON THE PAGE. The plan arriving did not pass the
  // gate; the rest of the package is still missing and Q10 is still open.
  assert.ok(html.includes(t('place.binding_hold')));
  assert.ok(html.includes('Q10'));
});
