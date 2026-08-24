/**
 * R0-C05B-A — THE ARRIVAL, AND WHETHER IT SURVIVES BEING PLAYED.
 *
 * ============================================================================
 * WHAT THESE TESTS ARE FOR
 * ============================================================================
 * The owner walked the deployed build without a briefing and found three
 * things: the first act fell below the viewport, one command could be reached
 * from several regions, and the human response returned above the participant's
 * scroll position. Two of those three are geometry, and no assertion here can
 * see geometry — the evidence for that is a screenshot at 1440×900 and it is
 * recorded as such.
 *
 * What the assertions below CAN hold is everything the geometry rests on:
 *
 *   - the arrival is derived, so replaying one world yields one arrival;
 *   - Bishr says only what canon has him say, and is not a mentor who is absent;
 *   - exactly one enabled control owns the act, in both modes and both
 *     guidance states;
 *   - the act is specific enough to answer "where does this go?" before it is
 *     pressed;
 *   - the large treatment retracts, and the world's answer is what replaces it;
 *   - removing every image leaves the arrival complete; and
 *   - C01–C05A still hold, because a flow correction that changed a rule would
 *     be building past the gate.
 *
 * ⚠️ AND NONE OF THEM REPLACES OPENING THE PAGE. Twelve rendering faults have
 * shipped past green suites in this repository, every one with a correct DOM,
 * and this increment found four more the same way — including a card that
 * claimed to stand at the Gate while sitting 180px away from it, and a
 * highlighted route that the panel naming it was drawn on top of.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { startRun, dispatchAll, replay } from '../src/sim/engine.js';
import { command, COMMANDS, COMMAND_IDS } from '../src/sim/commands.js';
import { project } from '../src/projections/project.js';
import { projectGuidance, OWNERS, GuidanceRefusal } from '../src/projections/guidance.js';
import { projectNarrative } from '../src/projections/narrative.js';
import { beatRefusals, ARRIVAL, fillState, stateTokens } from '../src/content/beats.js';
import { SLOTS, portraitSlot } from '../src/projections/slots.js';
import CONTENT from '../src/content/chapter01-beats.json' with { type: 'json' };

import { LivingMorning } from '../src/App.jsx';
import { ArrivalGuide, GuidanceToggle } from '../src/features/guidance/ArrivalGuide.jsx';
import { GuidanceStructured } from '../src/features/guidance/GuidanceStructured.jsx';
import { HowPlayWorks } from '../src/features/guidance/HowPlayWorks.jsx';

const SEED = 20260822;
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const slotIds = Object.keys(SLOTS);

const textOf = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const withoutRasters = (markup) => markup.replace(/<img\b[^>]*>/g, '');

/** The one act the arrival owns: walking the Gate–Emergency route. */
const WALK = command(COMMANDS.INSPECT_PLACE, { place: 'gate' });

const guidanceOf = (run) => {
  const narrative = projectNarrative(run.world, run.events);
  return projectGuidance(run.world, run.events, narrative);
};

/** The whole operate surface, as a participant meets it. */
const surface = (props = {}) =>
  renderToStaticMarkup(createElement(LivingMorning, { structured: false, onReachPreparation() {}, ...props }));

/**
 * ★ ENABLED CONTROLS ONLY.
 *
 * § 0.4C's rule is about what is *enabled* in two regions. A disabled control
 * is a different fault (it competes for attention) and is checked separately —
 * conflating them would let a real duplicate hide behind a `disabled` attribute
 * nobody noticed.
 */
function enabledButtons(markup) {
  return [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .filter(([, attrs]) => !/\bdisabled\b/.test(attrs))
    .map(([, , inner]) => textOf(inner).trim());
}

// =============================================================================
// 1. THE ARRIVAL IS DERIVED — there is no tutorial stage anywhere
// =============================================================================

test('★ replaying one world produces one arrival, byte for byte', () => {
  const played = dispatchAll(startRun(SEED), [command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' })]);
  const again = replay(SEED, played.events.filter((event) => event.type !== 'command-refused'));
  assert.deepEqual(
    JSON.stringify(guidanceOf(played)),
    JSON.stringify(guidanceOf(again)),
    'the same world and the same events produced two different arrivals');
});

test('⛔ no tutorial stage is stored anywhere in the world', () => {
  const run = dispatchAll(startRun(SEED), [WALK]);
  const serialised = JSON.stringify(run.world);
  for (const forbidden of ['tutorial', 'guidance', 'arrival', 'onboard', 'step:', 'howPlayWorks']) {
    assert.ok(!serialised.includes(forbidden),
      `the world stores "${forbidden}" — § 0.4C forbids a second story with state attached`);
  }
  // And the surface holds only the participant's own preference.
  const source = read('src/App.jsx');
  const stateful = [...source.matchAll(/useState\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(!stateful.some((initial) => /phase|beat|stage|step/i.test(initial)),
    `a surface useState initialises something that looks like a stage: ${stateful.join(', ')}`);
});

test('★ the arrival phase is a reading of the beat, and it moves on when the world does', () => {
  let run = startRun(SEED);
  assert.equal(guidanceOf(run).phase, 'arrival');
  assert.equal(guidanceOf(run).owner, OWNERS.ARRIVAL);
  assert.equal(guidanceOf(run).ownsProgression, true);

  run = dispatchAll(run, [WALK]);
  assert.equal(guidanceOf(run).phase, 'returning', 'walking the route must retract the arrival');
  assert.equal(guidanceOf(run).owner, OWNERS.TRAY);

  run = dispatchAll(run, [
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' }),
    command(COMMANDS.ADVANCE_CYCLE),
  ]);
  assert.equal(guidanceOf(run).phase, 'in-play', 'the arrival must not follow the morning into cycle one');
  assert.equal(guidanceOf(run).ownsProgression, false,
    'once the arrival is over, progression goes back to the controls it belongs to');
});

// =============================================================================
// 2. BISHR IS CANON'S, AND HE IS NOT THE MENTOR WHO IS ABSENT
// =============================================================================

test('★ the guide is the canonical Guide of the Ways, with a canonical source', () => {
  const guide = guidanceOf(startRun(SEED)).guide;
  assert.equal(guide.name, 'Bishr');
  assert.equal(guide.title, 'Guide of the Ways');
  // ⛔ The office on the first screen must be keyed to canon, not chosen.
  assert.match(ARRIVAL.title.source, /^canon:/);
  assert.match(ARRIVAL.title.source, /naming-canon/);
  assert.equal(CONTENT.characters.bishr.portraitSlot, guide.portraitSlot);
  assert.ok(portraitSlot(guide.portraitSlot), 'the guide names a slot nothing occupies');
});

test('⛔ THE LEAGUE OF CARE DOES NOT APPEAR — the chapter matrix\'s eighth rule', () => {
  // Canon: "The League of Care is absent and is not considered a source of help
  // in Chapters 1-3", and the chapter contract's Mentor row is "No League
  // presence, hints, guidance, or intervention".
  //
  // ⚠️ Read from the CONTENT, not from the components. A component comment
  // explaining the boundary would trip a grep over source text, and a guard
  // that its own explanation breaks is a guard that gets deleted.
  const words = JSON.stringify({ arrival: ARRIVAL, beats: CONTENT.beats, characters: CONTENT.characters });
  for (const forbidden of ['League', 'mentor', 'Visitor']) {
    assert.ok(!new RegExp(`\\b${forbidden}\\b`, 'i').test(words),
      `governed Chapter 1 content names "${forbidden}"`);
  }
});

test('⛔ and he orients without claiming knowledge the chapter has not revealed', () => {
  const spoken = [
    ...ARRIVAL.intro.map((para) => para.text),
    ARRIVAL.objective.text,
    ...ARRIVAL.howPlayWorks.steps.map((step) => step.text),
  ].join(' ');
  // Scene 2's electrical fault is discovered, not announced by the guide at
  // first light. Nor does he command another portfolio or decide for the player.
  for (const forbidden of ['electric', 'circuit', 'changeover', 'transfer chamber', 'generator',
                           'I have decided', 'you must', 'order the']) {
    assert.ok(!new RegExp(forbidden, 'i').test(spoken),
      `the arrival says "${forbidden}" — Bishr is orienting, not disclosing Scene 2`);
  }
});

test('★ every arrival line carries a canonical source, and two paragraphs is the limit', () => {
  assert.equal(ARRIVAL.intro.length, 2, '§ 23.2 allows two short paragraphs, and no lore dump');
  for (const para of ARRIVAL.intro) assert.match(para.source, /^canon:/);
});

// =============================================================================
// 3. THE CONTRADICTION IS READ FROM THE WORLD, NOT WRITTEN INTO THE COPY
// =============================================================================

test('★ THE 8-AND-6 CONTRADICTION IS INTERPOLATED FROM STATE, never baked', () => {
  const run = startRun(SEED);
  const { intro } = guidanceOf(run);
  const icu = run.world.services.icu;
  const said = intro.join(' ');
  assert.ok(said.includes(String(icu.physicalPositions)), 'the physical count is not on the first screen');
  assert.ok(said.includes(String(icu.staffedPositions)), 'the staffed count is not on the first screen');

  // ⛔ AND THE SOURCE CARRIES A PATH, NOT A NUMBER. This is the assertion that
  // matters: a copy edit that typed "eight" would pass the two checks above
  // today and quietly outlive the state tomorrow.
  const authored = ARRIVAL.intro.map((para) => para.text).join(' ');
  assert.ok(stateTokens(authored).includes('services.icu.physicalPositions'));
  assert.ok(stateTokens(authored).includes('services.icu.staffedPositions'));
  assert.ok(!/\b(eight|six|8|6)\b/i.test(authored),
    `a capacity number is baked into arrival copy: ${authored}`);
});

test('★ and a world with different capacity says something different', () => {
  const run = startRun(SEED);
  const altered = { ...run.world, services: { ...run.world.services,
    icu: { ...run.world.services.icu, staffedPositions: 4 } } };
  const said = fillState(ARRIVAL.intro[0].text, altered);
  assert.ok(said.includes('4'), `the arrival did not follow the world: ${said}`);
  assert.ok(!said.includes('6'), 'the arrival kept the old number');
});

test('⛔ an unresolvable interpolation throws rather than rendering a hole', () => {
  assert.throws(() => fillState('The board shows {services.icu.nothingLikeThis} places.', startRun(SEED).world),
    /content-interpolates-an-unresolvable-state/);
});

// =============================================================================
// 4. THE NEW CONTENT REFUSALS, EXERCISED ON MUTATED FIXTURES
// =============================================================================
// An unexercised refusal is indistinguishable from one that cannot fire. Each
// case below breaks the content in one specific way and names what must be said
// about it.

const mutate = (change) => {
  const copy = structuredClone(CONTENT);
  change(copy);
  return copy;
};
const refusalsFor = (content) =>
  beatRefusals(startRun(SEED).world, slotIds, content).map((entry) => entry.refusal);

test('★ the real content refuses nothing', () => {
  assert.deepEqual(beatRefusals(startRun(SEED).world, slotIds), []);
});

for (const [name, change, expected] of [
  ['no arrival at all', (c) => { delete c.arrival; }, 'no-governed-arrival'],
  ['an unknown guide', (c) => { c.arrival.carrier = 'somebody'; }, 'arrival-carrier-is-not-a-known-character'],
  ['a place the world lacks', (c) => { c.arrival.place = 'rooftop'; }, 'arrival-is-anchored-to-no-real-place'],
  ['an office with no canon behind it', (c) => { delete c.arrival.title.source; }, 'arrival-title-states-no-canonical-source'],
  ['a third paragraph', (c) => { c.arrival.intro.push({ text: 'And another thing.', source: 'canon:x' }); },
    'arrival-is-not-two-short-paragraphs'],
  ['a paragraph with no source', (c) => { delete c.arrival.intro[1].source; }, 'arrival-paragraph-states-no-canonical-source'],
  ['a baked capacity number', (c) => { c.arrival.intro[0].text = 'The board shows eight places; six are staffed.'; },
    'arrival-does-not-read-the-capacity-contradiction-from-state'],
  ['a paragraph naming a state that is not there',
    (c) => { c.arrival.intro[1].text = 'Walk with me at {services.icu.imaginary}.'; },
    'copy-interpolates-an-unresolvable-state'],
  ['a route the world does not run', (c) => { c.arrival.route.id = 'gate-rooftop'; },
    'arrival-names-a-route-the-world-does-not-have'],
  ['a route that starts elsewhere', (c) => { c.arrival.route.from = 'icu'; }, 'arrival-route-starts-somewhere-else'],
  ['a route that ends elsewhere', (c) => { c.arrival.route.to = 'power'; }, 'arrival-route-ends-somewhere-else'],
  ['an unnamed endpoint', (c) => { delete c.arrival.route.fromLabel; }, 'arrival-route-endpoint-has-no-label'],
  ['a five-part loop', (c) => { c.arrival.loop.push({ key: 'x', label: 'X', gloss: 'g', command: 'advance-cycle' }); },
    'the-play-loop-is-not-four-parts'],
  ['a loop part reaching no command', (c) => { c.arrival.loop[0].command = 'contemplate'; },
    'play-loop-part-names-no-command'],
  ['an objective keyed to nothing', (c) => { c.arrival.objective = { text: 'Do something' }; },
    'operational-claim-names-no-state-or-event'],
  ['an instruction for a control that does not exist',
    (c) => { c.arrival.howPlayWorks.steps[0].command = 'open-the-ledger'; },
    'how-play-works-describes-a-command-that-does-not-exist'],
  ['no word on what turning guidance off keeps', (c) => { delete c.arrival.howPlayWorks.guidanceNote; },
    'how-play-works-does-not-say-what-turning-guidance-off-keeps'],
  ['a toggle with no label', (c) => { delete c.arrival.guidance.offLabel; }, 'guidance-toggle-has-no-label'],
]) {
  test(`⛔ refuses ${name}`, () => {
    assert.ok(refusalsFor(mutate(change)).includes(expected),
      `expected ${expected}, got: ${refusalsFor(mutate(change)).join(', ') || '(nothing)'}`);
  });
}

test('⛔ and the projection refuses an arrival whose act would change the world', () => {
  const run = startRun(SEED);
  const narrative = projectNarrative(run.world, run.events);
  const lying = { ...narrative, act: { label: 'Go', command: COMMANDS.ADVANCE_CYCLE } };
  assert.throws(() => projectGuidance(run.world, run.events, lying), GuidanceRefusal);
  // ★ The arrival's whole promise is that the route will be READ. An act that
  // advanced the morning instead would make the preview false before it was
  // written, which is the one thing a fair preview cannot be.
});

// =============================================================================
// 5. ONE COMMAND, ONE OWNER — the audit's second finding
// =============================================================================

test('★ EXACTLY ONE ENABLED CONTROL OWNS THE ROUTE ACT, at the arrival', () => {
  const html = surface();
  const label = 'Walk the Gate–Emergency route with Bishr';
  const owners = enabledButtons(html).filter((text) => text.includes(label));
  assert.equal(owners.length, 1, `${owners.length} enabled controls offer the route act`);
  // And the tray that carries it in every other beat is ABSENT here, not hidden.
  assert.ok(!html.includes('nar-tray'),
    'the commitment tray is rendered beside the arrival; two surfaces would own one command');
});

test('★ and the same holds in the structured reading', () => {
  const html = surface({ structured: true });
  const owners = enabledButtons(html).filter((text) => text.includes('Walk the Gate–Emergency route'));
  assert.equal(owners.length, 1, `${owners.length} enabled controls offer the route act in structured mode`);
});

test('⛔ NO SECOND PROGRESSION LABEL WHILE THE ARRIVAL OWNS PROGRESSION', () => {
  // The clock's advance control borrows the narrative's label when there is a
  // meaningful next act. Through the arrival beat it must not: the audit found
  // one command presented by several regions, and a participant reading the
  // same sentence twice cannot tell which one is the game.
  const html = surface();
  assert.ok(html.includes('Let the morning work on'),
    'the time control should read as a clock while the arrival owns progression');
  const advanceLabels = [...html.matchAll(/Let the morning work through First Bell/g)];
  assert.equal(advanceLabels.length, 0,
    'the narrative advance label appears while the arrival owns the next act');
});

test('★ the act is specific: a reviewer can say where it goes before pressing it', () => {
  const { act, objective, preview } = guidanceOf(startRun(SEED));
  // Verb, target and companion — never a bare progression verb.
  assert.match(act.label, /^Walk\b/, 'the act does not begin with what the participant does');
  assert.match(act.label, /Gate–Emergency route/, 'the act does not name where it goes');
  for (const generic of ['Continue', 'Advance one cycle', 'Next', 'Proceed', 'Start']) {
    assert.ok(!new RegExp(`^${generic}`, 'i').test(act.label), `the act reads as "${generic}"`);
  }
  assert.equal(act.command, COMMANDS.INSPECT_PLACE);
  assert.equal(act.place, objective.route.from);
  // ⛔ The preview promises a reading, not a revelation.
  assert.match(preview.protects, /reading/i);
  assert.ok(preview.unknown.length > 0, 'the act must say what it will NOT settle');
});

// =============================================================================
// 6. THE ROUTE RESPONDS, AND THE GUIDE RETRACTS
// =============================================================================

test('★ the highlighted route is the WHOLE corridor, and it is the one the act names', () => {
  const { objective } = guidanceOf(startRun(SEED));
  const run = startRun(SEED);
  assert.equal(objective.route.id, 'gate-ed');
  assert.equal(run.world.routes['gate-ed'].from, objective.route.from);
  assert.equal(run.world.routes['gate-ed'].to, objective.route.to);
  // § anchors.js: "A ROUTE IS THE WHOLE PATH, ALWAYS." Lighting only the
  // occupied head would say the corridor ends where the queue does.
  assert.ok(objective.route.path.length >= 2);
  assert.deepEqual(objective.route.path[0], [objective.route.fromAnchor.x, objective.route.fromAnchor.y]);
});

test('★ THE ACT NEVER APPEARS TO DO NOTHING: the world answers and the guide retracts', () => {
  const before = surface();
  assert.ok(before.includes('guide-arrival'), 'the arrival should be on screen before the act');

  const run = dispatchAll(startRun(SEED), [WALK]);
  const after = guidanceOf(run);
  assert.equal(after.phase, 'returning');
  assert.equal(after.act, null, 'the arrival still offers its act after the act was taken');

  // All four parts § 23.3 asks for, in order.
  assert.equal(after.return.speaker.name, 'Bishr');
  assert.ok(after.return.observation.length > 0, 'Bishr says nothing about the route he just walked');
  assert.ok(after.return.fact.length > 0, 'the world reports no change');
  assert.match(after.return.question, /Next question/, 'nothing is left open');

  // ★ And what he says is the beat's own canonical response, not a new line.
  const beat = CONTENT.beats.find((entry) => entry.beat === 'entry');
  assert.equal(after.return.observation, beat.response.line);
  assert.match(beat.response.source, /^canon:/);
});

test('★ the retraction is a real change of treatment, not a restyle', () => {
  const run = dispatchAll(startRun(SEED), [WALK]);
  const html = renderToStaticMarkup(createElement(LivingMorning, {
    structured: false, onReachPreparation() {},
  }));
  assert.ok(html.includes('guide-arrival'), 'sanity: a fresh surface starts at the arrival');

  // The projection is what the surface reads, so assert on it: the large
  // treatment has no act to render and the compact card has a speaker.
  const guidance = guidanceOf(run);
  const narrative = projectNarrative(run.world, run.events);
  assert.equal(guidance.phase, 'returning');
  assert.equal(narrative.acted, true);
  assert.equal(narrative.place, 'gate', 'Bishr must retract to the place he is actually standing in');
});

test('★ the four-part grammar advances by reading the log, and never claims a percentage', () => {
  const fresh = guidanceOf(startRun(SEED));
  assert.equal(fresh.loop.find((part) => part.key === 'observe').state, 'current');
  for (const key of ['decide', 'watch', 'respond']) {
    assert.equal(fresh.loop.find((part) => part.key === key).state, 'ahead');
  }
  const walked = guidanceOf(dispatchAll(startRun(SEED), [WALK]));
  assert.equal(walked.loop.find((part) => part.key === 'observe').state, 'done');
  assert.equal(walked.steps[0].state, 'done');
  assert.equal(walked.steps[1].state, 'current');

  // ⛔ No ring, no percentage, no "3 of 4 complete" — R0-C05's rule, applied to
  // guidance: a proportion cannot say which of two different things happened.
  //
  // ⚠️ ASSERTED ON WHAT IS RENDERED, NOT ON THE SOURCE. The first version of
  // this grepped the component files and failed on PlayLoop's own comment
  // explaining why there is no progress bar. A guard that its own explanation
  // breaks is a guard somebody deletes.
  //
  // ⚠️ AND SCOPED TO THE GUIDANCE SURFACE. Grepping the whole page failed on
  // the structured world's own "nothing is progressing", which is a true
  // statement about a paused clock and none of this rule's business. A guard
  // that fires on unrelated correct text gets widened until it fires on
  // nothing.
  const guidance = guidanceOf(startRun(SEED));
  const props = { guidance, onAct() {}, onHowPlayWorks() {}, howButtonRef: null, guidanceToggle: null };
  const rendered = textOf(renderToStaticMarkup(createElement(ArrivalGuide, props)))
    + textOf(renderToStaticMarkup(createElement(GuidanceStructured, props)));
  for (const forbidden of ['progress', '%', 'percent', ' of 4 ']) {
    assert.ok(!new RegExp(forbidden, 'i').test(rendered),
      `the guidance surface shows "${forbidden}"`);
  }
});

// =============================================================================
// 7. EQUIVALENCE — the same projection, the same command, no thinner game
// =============================================================================

test('★ visual and structured modes consume ONE projection and reach ONE command', () => {
  const guidance = guidanceOf(startRun(SEED));
  const props = { guidance, onAct() {}, onHowPlayWorks() {}, howButtonRef: null, guidanceToggle: null };
  const visual = textOf(renderToStaticMarkup(createElement(ArrivalGuide, props)));
  const structured = textOf(renderToStaticMarkup(createElement(GuidanceStructured, props)));

  for (const said of [guidance.guide.name, guidance.guide.title, guidance.objective.text,
                      guidance.act.label, guidance.preview.protects, guidance.preview.unknown,
                      ...guidance.intro]) {
    assert.ok(visual.includes(said), `the visual arrival omits: ${said}`);
    assert.ok(structured.includes(said), `the structured arrival omits: ${said}`);
  }
  // ★ The structured reading also names the endpoints in words, because a
  // participant without the map has nothing else to read the highlight from.
  assert.ok(structured.includes(guidance.objective.route.fromLabel));
  assert.ok(structured.includes(guidance.objective.route.toLabel));
});

test('★ REMOVE EVERY IMAGE AND THE ARRIVAL IS STILL COMPLETE', () => {
  const guidance = guidanceOf(startRun(SEED));
  const html = renderToStaticMarkup(createElement(ArrivalGuide, {
    guidance, onAct() {}, onHowPlayWorks() {}, howButtonRef: null, guidanceToggle: null,
  }));
  const bare = textOf(withoutRasters(html));
  for (const said of [guidance.guide.name, guidance.guide.title, guidance.act.label,
                      guidance.objective.text, ...guidance.intro]) {
    assert.ok(bare.includes(said), `raster-free play loses: ${said}`);
  }
});

test('★ turning guidance off hands the act back rather than taking it away', () => {
  // The toggle is presentational, so the proof is structural: with guidance off
  // the surface falls through to the commitment tray that has carried this act
  // since R0-C05A, and the projection it reads is unchanged.
  const source = read('src/App.jsx');
  assert.match(source, /guided\s*=\s*guidanceOn && guidance\.phase !== "in-play"/,
    'guidance-off must be a presentational branch, not a state change');
  assert.match(source, /arriving\s*\n?\s*\?\s*null\s*\n?\s*:\s*narrative\.act/s,
    'with the arrival gone the tray must own the act again');
  // ⚠️ THE PROJECTION'S SHAPE, NOT THE CONTENT'S. `projectGuidance` maps
  // onLabel/offLabel to on/off; handing the component the raw content block
  // rendered an empty button — which is how this assertion first failed, and a
  // fair reminder that a component's props are worth reading rather than
  // assuming.
  const toggle = textOf(renderToStaticMarkup(createElement(GuidanceToggle, {
    on: true, labels: guidanceOf(startRun(SEED)).labels, onToggle() {},
  })));
  assert.ok(toggle.includes('Guidance: On'), `the toggle rendered: "${toggle.trim()}"`);
});

test('★ How play works explains the controls that exist, and can be closed', () => {
  const guidance = guidanceOf(startRun(SEED));
  const html = renderToStaticMarkup(createElement(HowPlayWorks, {
    how: guidance.howPlayWorks, onClose() {},
  }));
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby="guide-how-title"/);
  assert.ok(textOf(html).includes('Close'), 'a dialog with no way out');
  // Escape and the focus cycle are behaviour, so they are asserted on the
  // handler rather than on the markup a static render can produce.
  const source = read('src/features/guidance/HowPlayWorks.jsx');
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.shiftKey/, 'the focus trap must cycle backwards too');
  assert.match(read('src/App.jsx'), /howButton\.current\?\.focus\(\)/,
    'closing must return focus to the control that opened it');
});

// =============================================================================
// 8. THE GUIDANCE FEATURE OWNS ITS PREFIX, AND OFFERS NO CLINICAL ACT
// =============================================================================

test('the guidance feature owns its own class prefix and borrows none', () => {
  const files = readdirSync(new URL('src/features/guidance', root));
  const sources = files.filter((name) => name.endsWith('.jsx'))
    .map((name) => read(`src/features/guidance/${name}`)).join('\n');
  for (const match of sources.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const literal = (match[1] ?? match[2]).replace(/\S*\$\{[^}]*\}\S*/g, ' ');
    for (const token of literal.split(/\s+/).filter(Boolean)) {
      assert.ok(token.startsWith('guide-') || token === 'visually-hidden',
        `"${token}" is not this feature's to use`);
    }
  }
});

test('⛔ no guidance surface offers a clinical or live-command act', () => {
  const files = readdirSync(new URL('src/features/guidance', root))
    .filter((name) => name.endsWith('.jsx'))
    .map((name) => read(`src/features/guidance/${name}`));
  const sources = [...files, JSON.stringify(ARRIVAL)].join('\n');
  for (const forbidden of ['triage', 'prescribe', 'dispatch ambulance', 'admit patient']) {
    assert.ok(!new RegExp(forbidden, 'i').test(sources), `a guidance surface offers "${forbidden}"`);
  }
});

test('★ the arrival portrait size is DECLARED, not chosen by the component', () => {
  const slot = portraitSlot('R0-SL08A');
  assert.ok(slot.render.arrival, 'the guide slot declares no arrival size');
  const [w, h] = slot.render.arrival;
  const [pw, ph] = slot.pixels.standard;
  // § 18.2: a master is never enlarged beyond its source.
  assert.ok(w <= pw && h <= ph, `the arrival renders at ${w}×${h} from a ${pw}×${ph} derivative`);
  // And no other slot pretends to have one.
  for (const [id, entry] of Object.entries(SLOTS)) {
    if (entry.kind === 'portrait' && id !== 'R0-SL08A') {
      assert.ok(!entry.render.arrival, `${id} declares an arrival size but nobody arrives`);
    }
  }
});

// =============================================================================
// 9. NO REGRESSION — C01–C05A are untouched by a flow correction
// =============================================================================

test('C01–C05A hold: capacity, contention, complete ≠ verified, parity, refusals', () => {
  const OPEN = [
    command(COMMANDS.SET_CLOCK_MODE, { mode: 'act-advanced' }),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.ADVANCE_CYCLE),
    command(COMMANDS.INSPECT_PLACE, { place: 'icu' }),
  ];
  let run = dispatchAll(startRun(SEED), [
    ...OPEN,
    command(COMMANDS.SCHEDULE_PROJECT, { project: 'power-trace' }),
    command(COMMANDS.SCHEDULE_PROJECT, { project: 'mobile-reserve' }),
  ]);
  // capacity two, still enforced by the engine
  const third = dispatchAll(run, [command(COMMANDS.SCHEDULE_PROJECT, { project: 'message-route' })]);
  assert.equal(third.world.projects['message-route'].state, 'available');
  assert.ok(third.lastRefusal);

  // physical and staffed capacity are still separate fields
  const view = project(run, { selectedPlace: 'icu' });
  assert.notEqual(view.strip.find((item) => item.id === 'icu').value.indexOf('staffed'), -1);
  assert.match(view.strip.find((item) => item.id === 'icu').value, /\d+ staffed · \d+ physical/);

  // the narrative still follows the projects the participant actually took
  assert.ok(view.narrative.requests.length === 4, 'all four requests must remain visible');

  // ★ AND THE GUIDANCE RIDES IN THE SAME PASS, so it cannot describe another
  // world. The proof is that its phase agrees with the beat the narrative
  // derived — not that it names the same person, which it must NOT: the guide
  // is always Bishr and the requests beat speaks for Maha, Yasin, Rami and
  // Fadl. Comparing those two was this test's own first mistake.
  assert.equal(view.guidance.phase, 'in-play');
  assert.equal(view.guidance.guide.name, 'Bishr');
  assert.notEqual(view.narrative.beat, 'entry');
  assert.equal(view.guidance.act, null, 'the arrival must own no act once the morning has moved on');

  // time still never reaches `verified` on its own
  for (let i = 0; i < 6; i++) run = dispatchAll(run, [command(COMMANDS.ADVANCE_CYCLE)]);
  assert.equal(run.world.projects['power-trace'].state, 'complete');
});

test('⛔ the arrival adds no command to the vocabulary', () => {
  // A flow correction that needed a new command would be a rule change, and
  // § 0.4B permits one only against a named contradiction. This is not one.
  assert.deepEqual([...COMMAND_IDS].sort(),
    ['advance-cycle', 'inspect-place', 'open-preparation-window', 'schedule-project',
     'set-clock-mode', 'set-speed', 'verify-project'].sort());
});

test('⛔ and no production label reached the arrival', () => {
  const html = textOf(surface());
  for (const forbidden of ['R0-C05B', 'Q10', 'candidate', 'Experience Prototype', 'VA-018', 'slot']) {
    assert.ok(!new RegExp(forbidden, 'i').test(html), `the arrival shows the build label "${forbidden}"`);
  }
});
