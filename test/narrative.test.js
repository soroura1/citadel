/**
 * R0-C05A — THE FIRST TEN MINUTES, AND WHETHER THEY SAY ANYTHING.
 *
 * ============================================================================
 * WHAT THESE TESTS ARE FOR
 * ============================================================================
 * The owner's finding was not that a rule was wrong. Every rule was right: the
 * world was deterministic, capacity was two, contention was derived, `complete`
 * was not `verified`. The finding was that a participant could play all of it
 * and be told none of it.
 *
 * So the assertions below are mostly about MEANING rather than mechanism, and
 * they are written to fail in the ways this specific correction can fail:
 *
 *   - a sentence that sounds true and is keyed to nothing;
 *   - a story that narrates the project the proof used rather than the project
 *     the participant chose;
 *   - an identity that stops working when its image does not load; and
 *   - production labels leaking back into participant play.
 *
 * ⚠️ AND NONE OF THEM REPLACES OPENING THE PAGE. Seven rendering faults have
 * shipped past green suites in this repository, every one with a correct DOM.
 * § 0.8 step 5 is explicit: the browser walk means reading the picture.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { startRun, dispatchAll, replay } from '../src/sim/engine.js';
import { command, COMMANDS } from '../src/sim/commands.js';
import { project } from '../src/projections/project.js';
import { projectNarrative, classifyBeat, NarrativeRefusal } from '../src/projections/narrative.js';
import { beatRefusals } from '../src/content/beats.js';
import { SLOTS, PORTRAIT_SLOTS } from '../src/projections/slots.js';
import { PROJECTS } from '../src/sim/projects.js';
import CONTENT from '../src/content/chapter01-beats.json' with { type: 'json' };

import { MissionRibbon } from '../src/features/narrative/MissionRibbon.jsx';
import { PlaceCard } from '../src/features/narrative/PlaceCard.jsx';
import { CommitmentTray, OutcomeBar } from '../src/features/narrative/CommitmentTray.jsx';
import { NarrativeStructured } from '../src/features/narrative/NarrativeStructured.jsx';
import { RecordOverlay } from '../src/features/narrative/RecordOverlay.jsx';
import { PreparednessPanel } from '../src/features/preparedness/PreparednessPanel.jsx';

const SEED = 20260822;
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const slotIds = Object.keys(SLOTS);

/** Visible words only. A class name is not something a participant reads. */
const textOf = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
/** Everything the page says with every image removed — § 18.5's low-bandwidth row. */
const withoutRasters = (markup) => markup.replace(/<img\b[^>]*>/g, '');

/** Reach the four-request window: two cycles, then read the contradiction. */
const OPEN_WINDOW = [
  command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' }),
  command(COMMANDS.ADVANCE_CYCLE),
  command(COMMANDS.ADVANCE_CYCLE),
  command(COMMANDS.INSPECT_PLACE, { place: 'icu' }),
];
const commissioning = (...ids) => ids.map((id) => command(COMMANDS.SCHEDULE_PROJECT, { project: id }));

/** Play a pair to the end of the slice, following the acts the story offers. */
function playOut(...ids) {
  let run = dispatchAll(startRun(SEED), [...OPEN_WINDOW, ...commissioning(...ids)]);
  const beats = [];
  for (let guard = 0; guard < 12; guard++) {
    const narrative = projectNarrative(run.world, run.events);
    beats.push(narrative);
    if (!narrative.next) break;
    run = dispatchAll(run, [command(narrative.next.command,
      narrative.next.project ? { project: narrative.next.project } : {})]);
  }
  return { run, beats };
}

// =============================================================================
// C05A.1 — governed content refuses rather than reading plausibly
// =============================================================================

test('★ the shipped beat content states a source or a state key for every claim', () => {
  assert.deepEqual(beatRefusals(startRun(SEED).world, slotIds), []);
});

test('★ a fictional line with no canonical source is REFUSED', () => {
  const broken = structuredClone(CONTENT);
  delete broken.beats[0].request.source;
  const reasons = beatRefusals(startRun(SEED).world, slotIds, broken).map((r) => r.refusal);
  assert.ok(reasons.includes('fictional-line-states-no-canonical-source'), reasons.join(', '));
});

test('★ an operational assertion keyed to NOTHING is refused — the central rule', () => {
  // This is the sentence that reads perfectly and cannot be wrong about
  // anything, which is precisely why it must not render.
  const broken = structuredClone(CONTENT);
  broken.beats[1].purpose = { text: 'The morning is under control.' };
  const reasons = beatRefusals(startRun(SEED).world, slotIds, broken).map((r) => r.refusal);
  assert.ok(reasons.includes('operational-claim-names-no-state-or-event'), reasons.join(', '));
});

test('★ and a state key that does not RESOLVE is refused, not merely present', () => {
  const broken = structuredClone(CONTENT);
  broken.beats[2].now = { text: 'Coverage is fine.', stateKey: 'services.icu.everythingIsFine' };
  const reasons = beatRefusals(startRun(SEED).world, slotIds, broken).map((r) => r.refusal);
  assert.ok(reasons.includes('operational-claim-names-an-unresolvable-state'), reasons.join(', '));
});

test('★ an event type that cannot happen is refused', () => {
  const broken = structuredClone(CONTENT);
  broken.beats[0].now = { text: 'The generator started.', eventType: 'generator-started' };
  const reasons = beatRefusals(startRun(SEED).world, slotIds, broken).map((r) => r.refusal);
  assert.ok(reasons.includes('operational-claim-names-an-event-that-cannot-happen'), reasons.join(', '));
});

test('★ carriers and projects must match in BOTH directions', () => {
  const missing = structuredClone(CONTENT);
  delete missing.projectCarriers['message-route'];
  assert.ok(beatRefusals(startRun(SEED).world, slotIds, missing)
    .some((r) => r.refusal === 'project-has-no-situated-carrier'));

  const surplus = structuredClone(CONTENT);
  surplus.projectCarriers['a-project-nobody-added'] = surplus.projectCarriers['power-trace'];
  assert.ok(beatRefusals(startRun(SEED).world, slotIds, surplus)
    .some((r) => r.refusal === 'carrier-names-a-project-that-does-not-exist'));
});

test('★ every ladder state a participant can reach has somebody who answers for it', () => {
  const broken = structuredClone(CONTENT);
  delete broken.projectCarriers['mobile-reserve'].disrupted;
  assert.ok(beatRefusals(startRun(SEED).world, slotIds, broken)
    .some((r) => r.refusal === 'fictional-line-is-missing'));
});

test('a character cannot name a portrait slot that nothing occupies', () => {
  const broken = structuredClone(CONTENT);
  broken.characters.rami.portraitSlot = 'R0-SL99Z';
  assert.ok(beatRefusals(startRun(SEED).world, slotIds, broken)
    .some((r) => r.refusal === 'character-names-a-slot-that-does-not-exist'));
});

test('an act that reaches no command is refused', () => {
  const broken = structuredClone(CONTENT);
  broken.beats[0].act = { label: 'Fix the hospital', command: 'fix-the-hospital' };
  assert.ok(beatRefusals(startRun(SEED).world, slotIds, broken)
    .some((r) => r.refusal === 'beat-action-reaches-no-command'));
});

// =============================================================================
// C05A.2 — one derived projection, and the same seed tells the same story
// =============================================================================

test('★ the same seed and commands produce a byte-identical NARRATIVE, not only a world', () => {
  // R0-I1 asserted determinism on events and world, which is not what a
  // participant sees. The projection is.
  const commands = [...OPEN_WINDOW, ...commissioning('power-trace', 'message-route'),
    command(COMMANDS.ADVANCE_CYCLE), command(COMMANDS.ADVANCE_CYCLE)];
  const a = replay(SEED, commands);
  const b = replay(SEED, commands);
  assert.equal(
    JSON.stringify(projectNarrative(a.world, a.events)),
    JSON.stringify(projectNarrative(b.world, b.events)));
});

test('the narrative rides in the SAME projection pass as the map and the structured world', () => {
  const view = project(startRun(SEED));
  assert.ok(view.narrative, 'a surface would have to fetch the story separately');
  assert.ok(view.units.length && view.structured.length);
});

test('⛔ nothing writes a beat name into the world — the beat is read', () => {
  const { run } = playOut('power-trace', 'message-route');
  const serialised = JSON.stringify(run.world);
  for (const beat of ['entry', 'cycle-one', 'cycle-two', 'requests', 'project-working']) {
    assert.ok(!serialised.includes(beat), `"${beat}" was stored in the world`);
  }
});

test('⛔ a project state with no governed line REFUSES rather than inventing prose', () => {
  const run = dispatchAll(startRun(SEED), [...OPEN_WINDOW, ...commissioning('power-trace')]);
  const impossible = { ...run.world, projects: { ...run.world.projects,
    'power-trace': { ...run.world.projects['power-trace'], state: 'abandoned' } } };
  const events = [...run.events, { type: 'project-state-changed', project: 'power-trace',
    sequence: 999, minute: 40, cycle: 2, state: 'abandoned', because: 'x' }];
  assert.throws(() => classifyBeat(impossible, events), NarrativeRefusal);
});

// =============================================================================
// C05A.3 — the story follows the participant's own choice
// =============================================================================

test('★ the six beats arrive in order, each with a person, an act and a cost', () => {
  let run = startRun(SEED);
  const seen = [];
  const step = (...commands) => { run = dispatchAll(run, commands); };

  for (const [expected, commands] of [
    ['entry', []],
    ['cycle-one', [command(COMMANDS.INSPECT_PLACE, { place: 'gate' }),
                   command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' }), command(COMMANDS.ADVANCE_CYCLE)]],
    ['cycle-two', [command(COMMANDS.INSPECT_PLACE, { place: 'ed' }), command(COMMANDS.ADVANCE_CYCLE)]],
    ['requests', [command(COMMANDS.INSPECT_PLACE, { place: 'icu' })]],
  ]) {
    step(...commands);
    const narrative = projectNarrative(run.world, run.events);
    assert.equal(narrative.beat, expected);
    seen.push(narrative.speaker.name);
    // Every one of the eight parts, present before the act is taken.
    assert.ok(narrative.now && narrative.purpose && narrative.title);
    assert.ok(narrative.speaker.name && narrative.speaker.office && narrative.line);
    assert.ok(narrative.act?.label, `${expected} offers no act`);
    for (const part of ['protects', 'costs', 'unknown']) {
      assert.ok(narrative.preview[part], `${expected} previews no ${part}`);
    }
  }
  assert.deepEqual(seen, ['Bishr', 'Ayyash', 'Fadl', 'Maha']);
});

test('★ the act is an ACTOR AND A PURPOSE, never a progression verb', () => {
  const narrative = projectNarrative(startRun(SEED).world, startRun(SEED).events);
  assert.match(narrative.act.label, /Bishr/);
  for (const generic of ['Advance one cycle', 'Continue', 'Next', 'Proceed']) {
    assert.notEqual(narrative.act.label, generic);
  }
});

test('★ A COMPATIBLE PAIR: nobody is disrupted, and only the chosen people speak', () => {
  const { run, beats } = playOut('mobile-reserve', 'message-route');
  const states = Object.fromEntries(Object.entries(run.world.projects).map(([id, e]) => [id, e.state]));
  assert.equal(states['mobile-reserve'], 'verified');
  assert.equal(states['message-route'], 'verified');
  assert.equal(states['power-trace'], 'available');
  assert.equal(states['restoration-ownership'], 'available');

  assert.ok(!beats.some((beat) => beat.beat === 'project-disrupted'), 'a compatible pair was disrupted');
  // ⛔ THE CENTRAL CHOICE-RESPONSIVENESS ASSERTION. The accepted proof narrates
  // Rami in the Underworks; this participant never sent him there, so Rami must
  // not appear as a performer and the power route must not be narrated.
  const spoken = beats.map((beat) => `${beat.speaker.name} ${beat.line} ${beat.worldChange ?? ''}`).join(' ');
  assert.ok(!/Underworks/.test(spoken), 'the power trace was narrated to a participant who did not commission it');
  assert.ok(!beats.some((beat) => beat.featured === 'power-trace'));
  assert.ok(/Yasin/.test(spoken) && /Maha/.test(spoken));
});

test('★ A CONTENDING PAIR: the disruption is spoken, and it names what holds the resource', () => {
  const { run, beats } = playOut('power-trace', 'message-route');
  const disrupted = beats.find((beat) => beat.beat === 'project-disrupted');
  assert.ok(disrupted, 'two projects sharing the technical team produced no disruption beat');
  assert.equal(disrupted.featured, 'message-route');
  // Derived from the world: the earlier commitment keeps the resource, and the
  // narrative says WHICH project that is rather than "something else".
  assert.match(disrupted.worldChange, /technical-team/);
  assert.match(disrupted.return, /Trace the critical-power path/);
  assert.equal(run.world.projects['power-trace'].state, 'verified');
  assert.equal(run.world.projects['message-route'].state, 'verified');
});

test('★ and the contending pair COSTS MORE BEATS than the compatible one', () => {
  // The measurable opportunity cost R0-C05 established, now visible in the
  // story rather than only in the ladder.
  assert.ok(playOut('power-trace', 'message-route').beats.length
          > playOut('mobile-reserve', 'message-route').beats.length);
});

test('★ all four requests stay visible, each with its person and its cost', () => {
  const run = dispatchAll(startRun(SEED), OPEN_WINDOW);
  const { requests } = projectNarrative(run.world, run.events);
  assert.equal(requests.length, PROJECTS.length);
  for (const request of requests) {
    assert.ok(request.carrier.name && request.carrier.office);
    assert.ok(request.request && request.protects && request.costs && request.unknown);
    assert.match(request.commissionAct, new RegExp(request.carrier.name));
  }
  // Even after commissioning two, the two that could not be staffed are still
  // listed with what they would have protected.
  const after = dispatchAll(run, commissioning('mobile-reserve', 'message-route'));
  const still = projectNarrative(after.world, after.events).requests
    ?? project(after).narrative.requests;
  assert.ok(project(after).preparedness.projects.length === 4);
  assert.ok(still === null || still.length === 4);
});

test('★ all four projects stay ON THE PAGE after the commissioned work starts', () => {
  // The regression a browser walk found and no assertion had: gating the panel
  // on the requests beat removed the ladder, the residue and the two projects
  // not taken as soon as work began.
  const app = read('src/App.jsx');
  assert.match(app, /\{ready && \(\s*\n?\s*<PreparednessPanel/,
    'the preparedness panel is gated on something narrower than the open window');
  assert.ok(!/beat === "requests" && \(\s*\n?\s*<PreparednessPanel/.test(app));
});

test('the four-request beat keeps every requester visible, then reduces to the responder', () => {
  const run = dispatchAll(startRun(SEED), OPEN_WINDOW);
  assert.equal(projectNarrative(run.world, run.events).speakers.length, 4);
  const after = dispatchAll(run, commissioning('mobile-reserve'));
  const narrative = projectNarrative(after.world, after.events);
  assert.equal(narrative.speakers.length, 1);
  assert.equal(narrative.speakers[0].name, 'Maha');
});

// =============================================================================
// C05A.5 — candidate identity, safely bound
// =============================================================================

test('★ every derived portrait is inside the byte ceiling its slot declared FIRST', () => {
  for (const slot of PORTRAIT_SLOTS) {
    for (const [file, ceiling] of [[slot.file, slot.maxBytes], [slot.lowBandwidth, slot.lowBandwidthMaxBytes]]) {
      const path = new URL(`public${file}`, root);
      assert.ok(existsSync(path), `${slot.id}: ${file} was never derived`);
      const bytes = statSync(path).size;
      assert.ok(bytes <= ceiling, `${slot.id} ${file} is ${bytes} bytes against a declared ${ceiling}`);
    }
  }
});

test('⛔ a 2 MB review master cannot reach the runtime', () => {
  for (const slot of PORTRAIT_SLOTS) {
    assert.ok(!slot.file.includes('v05b-'), `${slot.id} points at a master filename`);
    assert.ok(statSync(new URL(`public${slot.file}`, root)).size < 100_000);
  }
  // And the six masters were not copied into the deployable tree.
  const source = read('src/projections/slots.js');
  assert.ok(!/public\/.*v05b/.test(source));
});

test('⛔ every portrait slot is candidate and unreviewed while Q10 is open', () => {
  for (const slot of PORTRAIT_SLOTS) {
    assert.equal(slot.reviewed, false, `${slot.id} claims review`);
    assert.equal(slot.reviewGate, 'Q10');
    assert.match(slot.candidateRef, /^VA-0(1[89]|2[0-3])$/);
  }
  assert.equal(PORTRAIT_SLOTS.length, 6);
});

test('★ THE CLUE, THE IDENTITY AND THE ACT SURVIVE WITH EVERY IMAGE REMOVED', () => {
  const run = dispatchAll(startRun(SEED), OPEN_WINDOW);
  const narrative = projectNarrative(run.world, run.events);
  const markup = renderToStaticMarkup(createElement(PlaceCard, { narrative, placeLabel: 'Coordination Room' }))
    + renderToStaticMarkup(createElement(CommitmentTray, { narrative, onAct() {}, onOpenRecord() {} }));
  const stripped = textOf(withoutRasters(markup));

  assert.ok(!/<img/.test(withoutRasters(markup)), 'the strip did not work');
  for (const name of ['Rami', 'Yasin', 'Fadl', 'Maha']) assert.match(stripped, new RegExp(name));
  assert.match(stripped, /Copyist/);                       // the office
  assert.match(stripped, /All four requests stay on the record/); // the request
  assert.match(stripped, /Protects/);                      // the fair preview
  assert.match(stripped, /Compare the four requests/);      // the act
});

// =============================================================================
// C05A.6 — the structured path is the same play, not a thinner one
// =============================================================================

test('★ the map-anchored card and the structured reading carry the SAME beat', () => {
  const run = dispatchAll(startRun(SEED), [command(COMMANDS.INSPECT_PLACE, { place: 'gate' })]);
  const narrative = projectNarrative(run.world, run.events);
  const visual = textOf(renderToStaticMarkup(createElement(PlaceCard, { narrative, placeLabel: 'Gate' })));
  const structured = textOf(renderToStaticMarkup(createElement(NarrativeStructured, { narrative, placeLabel: 'Gate' })));
  assert.ok(visual.includes(narrative.line) && structured.includes(narrative.line));
  assert.ok(visual.includes(narrative.speaker.name) && structured.includes(narrative.speaker.name));
});

test('the structured mode reaches the same act, so nobody is routed to a lesser path', () => {
  const app = read('src/App.jsx');
  // One tray, rendered outside the map/structured branch, so both modes get it.
  assert.match(app, /structured\s*\?\s*<MorningStructured/);
  assert.match(app, /narrative\.act\s*\n?\s*\?\s*<CommitmentTray/);
});

test('★ the record opens OVER the same world and creates no second state', () => {
  const run = dispatchAll(startRun(SEED), OPEN_WINDOW);
  const view = project(run);
  const markup = renderToStaticMarkup(createElement(RecordOverlay, { view, onClose() {} }));
  assert.match(markup, /aria-modal="true"/);
  assert.match(textOf(markup), /The morning is underneath and has not moved/);
  // It shows the same four projects the panel shows — not a second inventory.
  for (const project of PROJECTS) assert.ok(markup.includes(project.name));
});

test('the drawer discloses technical detail; the tray does not open with it', () => {
  const run = dispatchAll(startRun(SEED), OPEN_WINDOW);
  const view = project(run);
  const tray = textOf(renderToStaticMarkup(createElement(CommitmentTray,
    { narrative: view.narrative, onAct() {}, onOpenRecord() {} })));
  const drawer = textOf(renderToStaticMarkup(createElement(RecordOverlay, { view, onClose() {} })));
  assert.ok(!/service access window/i.test(tray), 'access detail is open by default');
  assert.match(drawer, /service access window/i);
});

// =============================================================================
// C05A.7 — no rule regressed, and no production label leaked
// =============================================================================

test('⛔ NO BUILD, REVIEW OR SCHEMA LABEL APPEARS IN PARTICIPANT PLAY', () => {
  const run = dispatchAll(startRun(SEED), [...OPEN_WINDOW, ...commissioning('mobile-reserve', 'message-route')]);
  const view = project(run);
  const surfaces = [
    createElement(MissionRibbon, { mission: view.narrative.mission }),
    createElement(PlaceCard, { narrative: view.narrative, placeLabel: 'Coordination Room' }),
    createElement(OutcomeBar, { narrative: view.narrative, onAct() {}, onOpenRecord() {} }),
    createElement(NarrativeStructured, { narrative: view.narrative, placeLabel: 'Coordination Room' }),
    createElement(RecordOverlay, { view, onClose() {} }),
    createElement(PreparednessPanel, {
      preparedness: view.preparedness, requests: view.narrative.requests, residue: view.residue,
      onSchedule() {}, onVerify() {}, onAdvance() {}, canAdvance: true,
    }),
  ].map((element) => textOf(renderToStaticMarkup(element))).join(' ');

  for (const leaked of ['XP0', 'R0-', 'R0 ', 'Q10', 'candidate', 'unreviewed', 'name_key',
                        'SL07', 'SL08', 'schema', 'reviewGate', 'Experience Prototype']) {
    assert.ok(!new RegExp(leaked, 'i').test(surfaces), `participant play still says "${leaked}"`);
  }
});

test('⛔ and the entry surface stopped calling itself a prototype', async () => {
  // ⚠️ ASSERTED ON WHAT IS RENDERED, not on the source. The first version of
  // this test read `src/App.jsx` and failed on the COMMENT recording why the
  // label was removed — a check that cannot tell an explanation from the thing
  // it explains would have to be weakened or the comment deleted, and neither
  // is the right answer.
  const { App } = await import('../src/App.jsx');
  const entry = textOf(renderToStaticMarkup(createElement(App)));
  assert.ok(!/Experience Prototype/i.test(entry), entry.slice(0, 200));
  assert.ok(!/facilitator-controlled state/i.test(entry));
  assert.match(entry, /Preparedness exercise only/i);   // the safety line stays
  // ★ MOVED, NOT DELETED. Q10 is open and the owner must still be able to see
  // it — removing the statement would make the build look further along.
  const panel = read('src/features/narrative/BuildPanel.jsx');
  assert.match(panel, /Q10/);
  assert.match(panel, /build.*===.*'1'|get\('build'\)/s);
});

test('C01–C05 rules are untouched: capacity, contention, displacement, complete ≠ verified', () => {
  const { run } = playOut('power-trace', 'mobile-reserve');
  // capacity two, enforced by the rules and not by this increment's surface
  const third = dispatchAll(run, commissioning('message-route'));
  assert.equal(third.world.projects['message-route'].state, 'available');
  assert.ok(third.lastRefusal);
  // displaced work persists as residue
  assert.equal(run.world.residue.length, 2);
  // `verified` was reached only through the responsible function's act
  for (const id of ['power-trace', 'mobile-reserve']) {
    assert.ok(run.world.projects[id].entered.includes('complete'));
    assert.equal(run.world.projects[id].state, 'verified');
    assert.ok(run.world.projects[id].verifiedAt != null);
  }
});

test('⛔ time never reaches `verified` on its own, however long the narrative runs', () => {
  let run = dispatchAll(startRun(SEED), [...OPEN_WINDOW, ...commissioning('mobile-reserve')]);
  for (let i = 0; i < 8; i++) run = dispatchAll(run, [command(COMMANDS.ADVANCE_CYCLE)]);
  assert.equal(run.world.projects['mobile-reserve'].state, 'complete');
});

test('⛔ no participant narrative surface offers a clinical or live-command act', () => {
  const sources = ['src/features/narrative/MissionRibbon.jsx', 'src/features/narrative/PlaceCard.jsx',
    'src/features/narrative/CommitmentTray.jsx', 'src/features/narrative/RecordOverlay.jsx',
    'src/features/narrative/NarrativeStructured.jsx', 'src/content/chapter01-beats.json']
    .map(read).join('\n');
  for (const forbidden of ['triage', 'prescribe', 'diagnos', 'dispatch ambulance', 'admit patient']) {
    assert.ok(!new RegExp(forbidden, 'i').test(sources), `a surface offers "${forbidden}"`);
  }
});

test('★ every class the narrative components use has a rule in the stylesheet', () => {
  // The guard that caught `.visually-hidden` painting six state names across
  // the ladder. Extended here because R0-C05 also proved a class collision is
  // invisible to every assertion over the DOM.
  const css = read('src/styles.css');
  const missing = [];
  for (const rel of ['MissionRibbon', 'PlaceCard', 'CommitmentTray', 'RecordOverlay',
                     'NarrativeStructured', 'Portrait', 'BuildPanel']) {
    const source = read(`src/features/narrative/${rel}.jsx`);
    for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const literal = (match[1] ?? match[2]).replace(/\S*\$\{[^}]*\}\S*/g, ' ');
      for (const token of literal.split(/\s+/).filter(Boolean)) {
        if (!new RegExp('\\.' + token.replace(/-/g, '\\-') + '(?![\\w-])').test(css)) missing.push(`${rel}: .${token}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('★ and the classes built by array-join carry rules too', () => {
  // `PlaceCard` composes its class list in JS, so the regex above cannot see
  // it. Named explicitly rather than left to a guard that would silently skip.
  const css = read('src/styles.css');
  for (const token of ['nar-card', 'nar-card-response', 'nar-card-request',
                       'nar-card-flip', 'nar-card-low', 'nar-card-many',
                       'nar-portrait-single', 'nar-portrait-stack', 'nar-portrait-absent']) {
    assert.match(css, new RegExp('\\.' + token.replace(/-/g, '\\-') + '(?![\\w-])'), `.${token} has no rule`);
  }
});

test('the narrative feature owns its own class prefix and borrows none', () => {
  const sources = ['MissionRibbon', 'PlaceCard', 'CommitmentTray', 'RecordOverlay',
    'NarrativeStructured', 'Portrait', 'BuildPanel']
    .map((name) => read(`src/features/narrative/${name}.jsx`)).join('\n');
  for (const match of sources.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const literal = (match[1] ?? match[2]).replace(/\S*\$\{[^}]*\}\S*/g, ' ');
    for (const token of literal.split(/\s+/).filter(Boolean)) {
      assert.ok(token.startsWith('nar-'), `"${token}" is not this feature's to use`);
    }
  }
});

test('★ narrow reflow moves the card OUT of the map\'s coordinate space', () => {
  // The 390×844 collision V05B found: an absolutely positioned card and a
  // bottom tray overlap on a short viewport whatever the anchor.
  const css = read('src/styles.css');
  const narrow = css.slice(css.lastIndexOf('@media (max-width: 620px)'));
  assert.match(narrow, /\.nar-card \{[^}]*position: static/);
  assert.match(narrow, /\.nar-tray \{[^}]*grid-template-columns: 1fr/);
});
