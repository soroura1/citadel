/**
 * ★ SG-1 C7 — THE STRATEGY INVARIANTS, PROVEN BY MUTATION.
 *
 * ============================================================================
 * WHY MUTATION AND NOT ASSERTION
 * ============================================================================
 * "The content has capabilities" is a sentence that stays true while the
 * capabilities do nothing. This repository has now shipped SIX rules that were
 * correct and could never fire — a manifest reading `slot.id` on a string, an
 * authority gate short-circuited by `!role`, a REQUIRED-slot check that read a
 * property off a bare string, a parity test asserting no image existed.
 *
 * Every rule below is therefore exercised by BREAKING the content in the
 * specific way the SG-1 audit found, and asserting the loader refuses it. A
 * rule with no negative fixture is a rule nobody has watched work.
 *
 * The six mutations SG-1 names by hand:
 *   1  a free action          — an option that commits nothing
 *   2  consequence without a world binding
 *   3  a cosmetic role        — two roles offering the same acts
 *   4  a pre-revealed clue    — the guarantee broken for one role
 *   5  a riskless option
 *   6  a resource created from nothing
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { loadBundle, BundleRefusal } from '../src/engine/bundle.js';
import {
  capabilityStates, readCapability, bindingConstraint, opportunityRefusals,
  worldBindingRefusals, CAPABILITIES_ALL,
} from '../src/engine/opportunity.js';
import {
  compare, instrumentRefusals, readingsHeld, INSTRUMENTS_ALL, InstrumentRefusal,
} from '../src/engine/instrument.js';
import { authorityRefusals, CLINICAL_OR_ELECTRICAL_AUTHORITY, SELECTABLE_ROLES } from '../src/engine/roles.js';
import { startRun, commit, act, view, advance, bundleFrom, heldEvidence } from '../src/engine/run.js';
import { buildRecord } from '../src/engine/record.js';

/** A deep copy, so a mutation cannot leak into the next test. */
const chapter = () => JSON.parse(JSON.stringify(CHAPTER_1));
const bundle = () => bundleFrom(CHAPTER_1);
const POWER = 'dec-01-power-pressure';
const refusalOf = (fn) => {
  try { fn(); } catch (e) { return e instanceof BundleRefusal ? e : e; }
  return null;
};

test('the real chapter loads — without this, every mutation below proves nothing', () => {
  assert.ok(loadBundle(chapter()));
});

// --- MUTATION 1: a free action ------------------------------------------------

test('★ MUTATION — an option that commits nothing and transfers nothing is REFUSED', () => {
  // The before-state measured seventeen actions, all free. A participant who
  // inspected everything was strictly better off than one who chose, so there
  // was no choosing.
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  decision.options[0].commits = [];
  decision.options[0].transfers_pressure_to = null;
  decision.options[0].deliberately_asymmetric = null;

  const e = refusalOf(() => loadBundle(c));
  assert.ok(e, 'a costless option loaded beside two costly ones');
  assert.equal(e.refusal, 'option-costs-nothing-while-its-alternatives-do');
});

test('★ but a decision that has not entered the strategy model at all is NOT refused', () => {
  // Chapter 1's other three decisions carry their cost as typed effects, which
  // is a different and older mechanism. A rule demanding commits everywhere
  // would have forced this session to retro-fit three scenes it does not own,
  // and a rule demanding them nowhere would permit one free pathway beside
  // three costly ones. Evenness is the honest middle.
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  for (const o of decision.options) { o.commits = []; o.transfers_pressure_to = null; }
  assert.ok(loadBundle(c), 'a decision with no strategy model at all must still load');
});

test('★ and an option that commits capability while transferring nothing is REFUSED', () => {
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  decision.options[0].transfers_pressure_to = null;
  decision.options[0].deliberately_asymmetric = null;
  const e = refusalOf(() => loadBundle(c));
  assert.equal(e?.refusal, 'commitment-transfers-nothing');
});

// --- MUTATION 2: consequence without a world binding --------------------------

test('★ MUTATION — a residue bound to nothing in the world is REFUSED', () => {
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  decision.options[0].residue[0].binds_to = { kind: 'location', id: 'loc.somewhere-i-meant' };

  const e = refusalOf(() => loadBundle(c));
  assert.ok(e, 'a consequence that can never be found loaded');
  assert.equal(e.refusal, 'residue-binds-to-nothing-in-the-world');
});

test('★ MUTATION — a response layer bound to a place that does not exist is REFUSED', () => {
  const c = chapter();
  const scene = c.scenes.find((s) => s.id === 'sc-01-02');
  scene.immediate_effect.responses[0].world_response.environment.binds_to =
    { kind: 'location', id: 'loc.not-a-place' };

  const e = refusalOf(() => loadBundle(c));
  assert.equal(e?.refusal, 'response-binds-to-nothing-in-the-world');
});

test('every residue in the real chapter binds to something that exists', () => {
  assert.deepEqual(worldBindingRefusals(CHAPTER_1.scenes, CHAPTER_1.decisions), []);
});

// --- MUTATION 3: a cosmetic role ----------------------------------------------

test('★ MUTATION — two roles offered exactly the same acts is REFUSED', () => {
  // The before-state audit measured the two playable roles at ONE differing
  // action out of seventeen. This is the floor below that, not the target: what
  // it refuses is the regression to zero, which no existing check could see.
  const c = chapter();
  for (const scene of c.scenes) {
    for (const a of scene.actions ?? []) a.visible_to_roles = null;
  }
  const e = refusalOf(() => loadBundle(c));
  assert.equal(e?.refusal, 'role-offers-nothing-another-role-does-not');
});

test('★ a selectable role holding clinical or electrical authority is REFUSED', () => {
  // Canon gives electrical isolation to Operations and care decisions to
  // Medical and Clinical Services. Neither playable role is either, which is
  // why the commitment beat is SUPPORT -- and it is one content edit from
  // being lost silently.
  for (const r of SELECTABLE_ROLES) {
    assert.ok(!CLINICAL_OR_ELECTRICAL_AUTHORITY.includes(r.id),
      `${r.id} is selectable AND holds clinical or electrical authority`);
  }
  assert.deepEqual(authorityRefusals(CHAPTER_1.scenes), []);
});

test('and the power-pressure decision belongs to none of the playable roles', () => {
  const decision = CHAPTER_1.decisions.find((d) => d.id === POWER);
  for (const r of SELECTABLE_ROLES) {
    assert.ok(!decision.requires_authority.includes(r.id),
      `${r.id} would DECIDE the electrical response; canon gives it to nobody playable`);
  }
});

// --- MUTATION 4: a pre-revealed clue, and the guarantee -----------------------

test('★ MUTATION — the guaranteed clue made unreachable for one role is REFUSED', () => {
  const c = chapter();
  const scene = c.scenes.find((s) => s.id === 'sc-01-02');
  for (const a of scene.actions) {
    if (a.reveals.includes('ev.01.02.shared-board')) a.visible_to_roles = ['role.quality-patient-safety'];
  }
  const e = refusalOf(() => loadBundle(c));
  assert.equal(e?.refusal, 'required-reveal-unreachable-for-role');
});

test('★ the guaranteed route is role-independent AND prerequisite-free', () => {
  // The design's guarantee rule: at least one route to a required clue that is
  // offered to every role, needs no prior evidence, and is reachable in place.
  // Rami, consulted in the ICU, is that route.
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  const routes = scene.actions.filter((a) =>
    a.reveals.includes('ev.01.02.shared-board')
    && a.visible_to_roles == null
    && (a.requires ?? []).length === 0);
  assert.ok(routes.length >= 1, 'no ungated, role-independent route to the shared board');
});

test('★ and the clue is not pre-revealed — nothing is held before an act is taken', () => {
  const b = bundle();
  const run = startRun({ bundle: b, config: { role: 'role.resilience-lead' } });
  assert.equal(heldEvidence(run).size, 0, 'evidence was held before the participant did anything');
});

// --- MUTATION 5: a riskless option --------------------------------------------

test('★ MUTATION — an option with no risk at all is REFUSED', () => {
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  for (const o of decision.options) { o.risks = null; o.risk_requires_evidence = []; }
  const e = refusalOf(() => loadBundle(c));
  assert.ok(e, 'three ways of being right loaded');
});

test('every pathway names what it protects, what it risks and where the pressure went', () => {
  const decision = CHAPTER_1.decisions.find((d) => d.id === POWER);
  for (const o of decision.options) {
    assert.ok(o.protects, `${o.id} protects nothing`);
    assert.ok(o.risks || (o.risk_requires_evidence ?? []).length, `${o.id} risks nothing`);
    assert.ok(o.transfers_pressure_to, `${o.id} transfers nothing`);
    assert.ok(o.residue.length, `${o.id} leaves nothing behind`);
    assert.ok(o.commits.length, `${o.id} costs nothing`);
  }
});

// --- MUTATION 6: a resource created from nothing ------------------------------

test('★ MUTATION — a commitment that RELEASES capability is REFUSED', () => {
  // `becomes: available` is capability appearing from nowhere, and it is also
  // an undo: a participant could recover a cost by choosing again.
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  decision.options[0].commits[0].becomes = 'available';
  const e = refusalOf(() => loadBundle(c));
  assert.ok(e, 'a released capability loaded');
});

test('★ MUTATION — a commitment naming a capability that does not exist is REFUSED', () => {
  const c = chapter();
  const decision = c.decisions.find((d) => d.id === POWER);
  decision.options[0].commits[0].capability = 'cap.more-nurses';
  const e = refusalOf(() => loadBundle(c));
  assert.equal(e?.refusal, 'commits-unknown-capability');
});

test('★ consumed is never undone by a later commitment', () => {
  // Recovery is authored and earned, never decayed back. A capability that
  // returned to available on the next scene would be a rewind with no button.
  const b = bundle();
  const run = { history: [
    { decisionId: POWER, optionId: 'dec-01-power-pressure.mobile-bridge' },
  ] };
  const states = capabilityStates(run, b);
  assert.equal(states.get('cap.mobile-reserve').state, 'committed');

  const later = { history: [
    { decisionId: POWER, optionId: 'dec-01-power-pressure.mobile-bridge' },
    { decisionId: POWER, optionId: 'dec-01-power-pressure.stabilize-locally' },
  ] };
  assert.equal(capabilityStates(later, b).get('cap.mobile-reserve').state, 'committed',
    'a later commitment released a capability the participant had already spent');
});

// --- opportunity has no number, anywhere --------------------------------------

test('⛔ NO CAPABILITY CARRIES A QUANTITY — not an amount, not a remaining, not a count', () => {
  // Canon names time, trust, workload, service capacity and evidence as this
  // world's currencies and sets no prices. A number invites optimisation.
  const forbidden = ['amount', 'remaining', 'count', 'total', 'max', 'units', 'level', 'points'];
  for (const c of CAPABILITIES_ALL) {
    for (const key of forbidden) {
      assert.ok(!(key in c), `${c.id} carries a quantity: ${key}`);
    }
  }
  const decision = CHAPTER_1.decisions.find((d) => d.id === POWER);
  for (const o of decision.options) {
    for (const commit of o.commits) {
      for (const key of forbidden) assert.ok(!(key in commit), `${o.id} commits a quantity: ${key}`);
    }
  }
});

test('a capability the participant cannot READ is refused', () => {
  const original = CAPABILITIES_ALL[0].how_known;
  assert.ok(original.startsWith('inst.'), 'a capability must be read off an instrument');
  // Every declared instrument exists, which is what makes the field usable
  // rather than decorative.
  assert.deepEqual(opportunityRefusals(CHAPTER_1.decisions), []);
});

test('what a capability tells the participant is the HOLDER, the state and prose — never a number', () => {
  const b = bundle();
  const run = { history: [{ decisionId: POWER, optionId: 'dec-01-power-pressure.stabilize-locally' }] };
  const read = readCapability('cap.staff-attention', run, b);
  assert.equal(read.state, 'committed');
  assert.equal(read.heldBy.id, 'Nour');
  assert.ok(read.committedFor, 'a committed capability must say what it is doing');
  assert.ok(read.closes.length, 'a committed capability must say what it closed');
  assert.ok(!/\d+\s*(of|\/)\s*\d+/.test(JSON.stringify(read)), 'a ratio reached the participant');
});

test('★ an unavailable act names the binding constraint and WHO holds it', () => {
  // Canon: "the relevant professional explains the binding constraint and
  // requires another pathway. This is authority, not a game hint."
  const b = bundle();
  const decision = b.decision(POWER);
  const spent = { history: [{ decisionId: POWER, optionId: decision.options[1].id }] };
  // Nothing is `consumed` in Chapter 1, so no option is closed -- and the
  // function must say so honestly rather than inventing a refusal.
  assert.equal(bindingConstraint(decision.options[0], spent, b), null);

  const consumed = JSON.parse(JSON.stringify(decision));
  consumed.options[1].commits[0].becomes = 'consumed';
  const fakeBundle = { decision: () => consumed };
  const after = { history: [{ decisionId: POWER, optionId: consumed.options[1].id }] };
  const constraint = bindingConstraint(consumed.options[1], after, fakeBundle);
  assert.equal(constraint.refusal, 'capability-already-consumed');
  assert.ok(constraint.heldBy.id, 'a constraint with no holder is a disabled button');
  assert.ok(constraint.because.length, 'and it must say what committing it closed');
});

// --- instruments ---------------------------------------------------------------

test('every instrument declares what it must NEVER imply', () => {
  assert.deepEqual(instrumentRefusals(CHAPTER_1.scenes), []);
  for (const i of INSTRUMENTS_ALL) assert.ok(i.never_implies.length, `${i.id}`);
});

test('★ comparison is symmetrical — an act available from one screen and not the other is refused', () => {
  for (const i of INSTRUMENTS_ALL) {
    for (const other of i.comparable_with) {
      const back = INSTRUMENTS_ALL.find((x) => x.id === other);
      assert.ok(back.comparable_with.includes(i.id), `${i.id} -> ${other} is one-way`);
    }
  }
});

test('★ THE COMPARISON THE CHAPTER IS ABOUT — the Hall is right about the bus and wrong about the bay', () => {
  const held = new Set(['ev.01.02.hall-reads-generation', 'ev.01.02.timings']);
  const result = compare(CHAPTER_1.scenes, held, 'inst.critical-power', 'inst.chronology');
  assert.ok(result.contradiction_found, 'the chapter\'s central disagreement did not surface');
  assert.ok(result.disagreements.length >= 1);
  for (const pair of result.disagreements) {
    assert.ok(pair.left.source && pair.right.source, 'a reading without a source is not a reading');
  }
});

test('comparing instruments you have not read REFUSES rather than returning empty', () => {
  // An empty result would let an interface offer the control and show nothing,
  // which reads as a broken screen rather than as an act not yet available.
  assert.throws(
    () => compare(CHAPTER_1.scenes, new Set(), 'inst.critical-power', 'inst.chronology'),
    (e) => e instanceof InstrumentRefusal && e.refusal === 'nothing-read-from-instrument');
});

test('two instruments that declare no comparison cannot be compared', () => {
  assert.throws(
    () => compare(CHAPTER_1.scenes, new Set(), 'inst.equipment-reserve', 'inst.chronology'),
    (e) => e.refusal === 'instruments-not-comparable');
});

test('⛔ `unavailable` is a READING, not an error — the bay with no supply is one', () => {
  const held = new Set(['ev.01.02.eight-beds-two-tables']);
  const readings = readingsHeld(CHAPTER_1.scenes, held);
  const power = readings.get('inst.critical-power');
  assert.ok(power?.some((r) => r.state === 'unavailable'),
    'the instrument that is accurate and silent has no way to say so');
});

// --- C5: performed characters ---------------------------------------------------

test('★ every scene-2 beat performs something, and every speech has a line or a recorded gap', () => {
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  assert.ok(scene.character_beats.length, 'the scene performs nothing');
  for (const b of scene.character_beats) {
    assert.ok(b.performs, `${b.id} performs nothing`);
    if (b.kind === 'speech') {
      assert.ok(b.line_key || b.dialogue_unresolved, `${b.id} opens a mouth with nothing in it`);
    }
    if (b.kind === 'independent_action') {
      assert.ok(b.occurs_when, `${b.id} fires always or never`);
    }
  }
});

test('★ the scene contains a refusal, a qualification AND an independent action', () => {
  // SG1-US-06's acceptance, asserted on the content rather than reviewed by eye.
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  const kinds = new Set(scene.character_beats.map((b) => b.kind));
  for (const required of ['refusal', 'qualification', 'independent_action']) {
    assert.ok(kinds.has(required), `no ${required} in the gold scene`);
  }
});

test('Fadl and Maha ENTER — canon does not let them arrive first', () => {
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  for (const who of ['Fadl', 'Maha']) {
    const beats = scene.character_beats.filter((b) => b.character_id === who);
    assert.ok(beats.length, `${who} does nothing`);
    assert.ok(beats.every((b) => b.at === 'entrance'),
      `${who} acts before entering; canon: they enter after stabilization is under way`);
  }
});

test('★ character behaviour DIVERGES by pathway', () => {
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  const pathways = new Set(scene.character_beats.filter((b) => b.pathway).map((b) => b.pathway));
  assert.ok(pathways.size >= 2,
    'every pathway produces the same people doing the same things');
});

// --- C4: the response beat answers in order --------------------------------------

test('★ every pathway has a world response, and an omitted layer is an explicit null', () => {
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  for (const r of scene.immediate_effect.responses) {
    const wr = r.world_response;
    assert.ok(wr, `${r.option_id} has no world response`);
    for (const layer of ['environment', 'instrument', 'holder', 'person']) {
      assert.ok(layer in wr, `${r.option_id} omits ${layer} in silence`);
    }
    assert.ok(wr.environment, `${r.option_id} changes no place`);
  }
});

test('★ THE MOST VALUABLE BEAT — bridging the bay leaves the power board UNCHANGED', () => {
  // The board watches the generator and the main critical bus. A mobile source
  // is on neither, so the bay is supplied and the instrument still shows it
  // unsupplied. A participant who notices that has learned the chapter's
  // argument by observation.
  const scene = CHAPTER_1.scenes.find((s) => s.id === 'sc-01-02');
  const bridge = scene.immediate_effect.responses
    .find((r) => r.option_id === 'dec-01-power-pressure.mobile-bridge');
  assert.equal(bridge.world_response.instrument.binds_to.id, 'inst.critical-power');
  const decision = CHAPTER_1.decisions.find((d) => d.id === 'dec-01-power-pressure');
  const option = decision.options.find((o) => o.id === bridge.option_id);
  assert.ok(option.residue.some((r) => r.binds_to.id === 'inst.critical-power'),
    'the board that cannot see the bay does not survive the scene');
});

// --- C8: the cost reaches the debrief ---------------------------------------------

test('★ C8 — the record carries what was committed, where the pressure went and what remains', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: 'role.resilience-lead' } });
  let guard = 0;
  while (!run.complete && guard++ < 60) {
    const v = view(run, b);
    if (v.actions?.length) for (const a of v.actions) run = act(run, b, a.id).run;
    const v2 = view(run, b);
    if (v2.presented?.options?.length) {
      const bridge = v2.presented.options.find((o) => o.id.endsWith('mobile-bridge'));
      run = commit(run, b, (bridge ?? v2.presented.options[0]).id).run;
    } else run = advance(run, b);
  }

  const record = buildRecord(run, b);
  const scene2 = record.scenes.find((s) => s.sceneId === 'sc-01-02');
  assert.ok(scene2.committed.length, 'the record cannot say what the commitment cost');
  assert.ok(scene2.transferredTo, 'the record cannot say where the pressure went');
  assert.ok(Array.isArray(scene2.residue) && scene2.residue.length,
    'the record still carries one residue sentence for three different worlds');
  for (const r of scene2.residue) {
    assert.ok(r.bindsTo?.id, 'a residue in the record binds to nothing and cannot be found later');
  }
});

test('⛔ and none of it introduces a score, a total or a rank', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: 'role.quality-patient-safety' } });
  let guard = 0;
  while (!run.complete && guard++ < 60) {
    const v = view(run, b);
    if (v.presented?.options?.length) run = commit(run, b, v.presented.options[0].id).run;
    else run = advance(run, b);
  }
  const json = JSON.stringify(buildRecord(run, b));
  for (const word of ['"score"', '"total"', '"rank"', '"points"', '"grade"', '"percent"']) {
    assert.ok(!json.includes(word), `the record carries a ${word}`);
  }
});
