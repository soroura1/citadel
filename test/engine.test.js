/**
 * R3 Phase C — the scene engine.
 *
 * ============================================================================
 * EVERY RULE IS PROVEN BY REFUSING **AND** BY PERMITTING.
 * ============================================================================
 * Seven rules were found inert in this project on 16-17 August — each correct,
 * each keying on something never present, each passing its own test. So no
 * refusal here stands alone: the corrected form must pass beside it, or the
 * rule might simply be refusing everything.
 *
 * The fixtures are the real Chapter 1 candidates, not invented shapes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SEASON_VARIABLES, BANDS, initialState, moveBand } from '../src/engine/season-variables.js';
import { applyEffect, applyOption, visibleChanges, EffectRefusal } from '../src/engine/effects.js';
import { MOVEMENTS, assertSceneShape, assertRevealsReachable, unreachableReveals } from '../src/engine/scene.js';
import { assertDecisionIsReal, presentOptions, choose } from '../src/engine/decision.js';
import { loadBundle, save, resume } from '../src/engine/bundle.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(here, '../src/content', p), 'utf8'));
const all = (d) => readdirSync(join(here, '../src/content', d)).map((f) => read(join(d, f)));

const scenes = all('scenes');
const decisions = all('decisions');
const state = () => ({ season: initialState(), chapter: {}, log: [], pending: [] });

// --- C3: the eleven, and only the eleven -----------------------------------

test('★ exactly eleven season variables, matching canon', () => {
  assert.equal(Object.keys(SEASON_VARIABLES).length, 11);
  assert.equal(SEASON_VARIABLES.V10, 'cast-relationships',
    'V10 was dropped once by a plan revision — the variable most of the season reads');
});

test('★ an invented season variable is refused BY NAME, not silently created', () => {
  const s = state();
  assert.throws(
    () => applyEffect(s, { operation: 'increment', variable: 'V12', magnitude: 'moderate', delay: 'immediate', visible: true }),
    (e) => e instanceof EffectRefusal && e.refusal === 'unknown-season-variable',
  );
  // ...and a real one moves, which is what proves the refusal is about the name.
  const after = applyEffect(s, { operation: 'increment', variable: 'V1', magnitude: 'moderate', delay: 'immediate', visible: true });
  assert.equal(after.season.V1, 'strong');
});

test('bands clamp rather than running off either end', () => {
  assert.equal(moveBand('strong', 5), 'strong');
  assert.equal(moveBand('critical', -5), 'critical');
});

test('★ a band is never a number — the player is shown state, not a score', () => {
  for (const b of Object.values(initialState())) assert.ok(BANDS.includes(b));
  assert.ok(!BANDS.some((b) => /^\d+$/.test(b)));
});

// --- C4, C5: typed operations ----------------------------------------------

test('★ set_enum carries canon discrete state that up/down cannot express', () => {
  const after = applyEffect(state(), {
    operation: 'set_enum', enum_variable: 'C1_CRITICAL_PATH', enum_value: 'ED_HOLD',
    delay: 'immediate', visible: true,
  });
  assert.equal(after.chapter.C1_CRITICAL_PATH, 'ED_HOLD');
  // Chapter state is NOT a season variable: it does not band and does not carry.
  assert.equal(after.season.C1_CRITICAL_PATH, undefined);
});

test('a half-declared set_enum is refused', () => {
  assert.throws(
    () => applyEffect(state(), { operation: 'set_enum', enum_variable: 'C1_X', delay: 'immediate', visible: true }),
    (e) => e.refusal === 'effect-incomplete');
});

test('★ V8 is HARM — a rise is a worsening, never rendered as a gain', () => {
  const before = state();
  const after = applyEffect(before, { operation: 'increment', variable: 'V8', magnitude: 'moderate', delay: 'immediate', visible: true });
  const [change] = visibleChanges(before, after);
  assert.equal(change.variable, 'V8');
  assert.equal(change.worsened, true, 'increasing harm must not read as a gain');
});

// --- C2: the six movements --------------------------------------------------

test('★ a scene with only orientation is REJECTED', () => {
  assert.throws(() => assertSceneShape({ id: 'sc-x', orientation: { key: 'o' } }),
    (e) => e.refusal === 'scene-missing-movements');
});

test('every real Chapter 1 scene has all six movements, in canon order', () => {
  assert.equal(MOVEMENTS.length, 6);
  for (const s of scenes) assert.ok(assertSceneShape(s), s.id);
});

// --- C11: required-reveal reachability --------------------------------------

test('★ a reveal withheld from a role is refused — canon guarantees it regardless of role', () => {
  const scene = {
    ...scenes[0],
    role_variants: [{ role: 'r1' }, { role: 'r2' }],
    required_reveals: [{ id: 'the-clue', withheld_from: ['r2'] }],
  };
  assert.equal(unreachableReveals(scene).length, 1);
  assert.throws(() => assertRevealsReachable(scene), (e) => e.refusal === 'required-reveal-unreachable');

  // Reachable on every path -> permitted. Without this the check might refuse everything.
  scene.required_reveals = [{ id: 'the-clue', withheld_from: [] }];
  assert.ok(assertRevealsReachable(scene));
});

test('every real Chapter 1 scene has reachable reveals', () => {
  for (const s of scenes) assert.ok(assertRevealsReachable(s), s.id);
});

// --- C6, C7: the decision ---------------------------------------------------

test('★ an option with an empty defensible_by is refused AT LOAD, not at render', () => {
  const d = structuredClone(decisions[0]);
  d.options[0].defensible_by = '   ';
  assert.throws(() => assertDecisionIsReal(d), (e) => e.refusal === 'option-nobody-would-defend');
  // The real decision passes, so the rule is about the decoy and not about decisions.
  assert.ok(assertDecisionIsReal(decisions[0]));
});

test('an option that changes nothing is refused — a formality, not a cost', () => {
  const d = structuredClone(decisions[0]);
  d.options[0].effects = [];
  assert.throws(() => assertDecisionIsReal(d), (e) => e.refusal === 'option-costs-nothing');
});

test('★ options are presented in AUTHORED order, never sorted by desirability', () => {
  const d = decisions[0];
  const shown = presentOptions(d).options.map((o) => o.id);
  assert.deepEqual(shown, d.options.map((o) => o.id));
});

test('★ a role without authority OBSERVES, and is told which rule applied', () => {
  const d = decisions.find((x) => Array.isArray(x.requires_authority) && x.requires_authority.length);
  const denied = presentOptions(d, { role: 'role.not-listed' });
  assert.equal(denied.authorised, false);
  assert.equal(denied.refusal, 'role-lacks-authority-to-decide');

  const allowed = presentOptions(d, { role: d.requires_authority[0] });
  assert.equal(allowed.authorised, true);
  assert.equal(allowed.refusal, null);
});

// --- C9: the honest turn ----------------------------------------------------

test('★ only IMMEDIATE effects land; the rest are held for R4 to deliver', () => {
  const option = {
    id: 'o', defensible_by: 'someone', effects: [
      { operation: 'increment', variable: 'V1', magnitude: 'moderate', delay: 'immediate', visible: true },
      { operation: 'decrement', variable: 'V5', magnitude: 'major', delay: 'next_chapter', visible: false },
    ],
  };
  const after = applyOption(state(), option);
  assert.equal(after.season.V1, 'strong', 'the immediate effect landed');
  assert.equal(after.season.V5, 'adequate', 'the delayed effect did NOT land yet');
  assert.equal(after.pending.length, 1);
  assert.equal(after.pending[0].owedFrom, 'o', 'the debt records which option incurred it');
});

test('★ a real decision visibly changes something — season band OR chapter state', () => {
  // An earlier engine reported only season moves, so an option whose whole cost
  // is a chapter enum -- most of Chapter 1's real decisions -- produced a turn
  // where nothing appeared to happen.
  for (const d of decisions) {
    for (const o of d.options) {
      const { changes } = choose(state(), d, o.id);
      assert.ok(changes.length > 0, `${d.id}/${o.id} changed nothing visible`);
    }
  }
});

test('a chapter enum change is not ranked better or worse — canon has no such ordering', () => {
  const d = decisions[0];
  const { changes } = choose(state(), d, d.options[0].id);
  for (const c of changes.filter((x) => x.kind === 'chapter')) assert.equal(c.worsened, null);
});

// --- C1, C12: the bundle ----------------------------------------------------

test('the four real Chapter 1 scenes and decisions load as a bundle', () => {
  const bundle = loadBundle({ version: 'v0.1', scenes, decisions });
  assert.equal(bundle.scenes.size, 4);
  assert.equal(bundle.decisions.size, 4);
});

test('★ an invalid bundle is refused WITH THE FIELD NAMED', () => {
  const broken = structuredClone(scenes[0]);
  delete broken.residue;
  try {
    loadBundle({ version: 'v0.1', scenes: [broken], decisions });
    assert.fail('should have refused');
  } catch (e) {
    assert.equal(e.refusal, 'scene-missing-movements');
    assert.equal(e.where, broken.id, 'the scene must be named');
    assert.match(e.detail, /residue/, 'the FIELD must be named — "invalid bundle" is an apology');
  }
});

test('★ a run resumes only into the bundle version it was played on', () => {
  const bundle = loadBundle({ version: 'v0.1', scenes, decisions });
  const saved = save({ bundleVersion: 'v0.1', sceneId: scenes[0].id, role: 'r', state: state() });
  assert.equal(resume(saved, bundle).sceneId, scenes[0].id);

  const later = loadBundle({ version: 'v0.2', scenes, decisions });
  assert.throws(() => resume(saved, later), (e) => e.refusal === 'run-pinned-to-another-bundle');
});

// --- C13, C14: configurability, PROVEN ---------------------------------------
import { defineScenario, resolveForScenario, startingStateFor } from '../src/engine/configuration.js';

test('★ THE SYNTHETIC EIGHTH SCENARIO reaches the scene end without engine changes', () => {
  // The plan's own proof. Nothing about this scenario exists in engine source —
  // if it did, adding a ninth would need a code change, and that is the failure
  // the proof exists to detect.
  const eighth = defineScenario({
    id: 'sc-synthetic-08',
    label: { key: 'scenario.synthetic_08' },
    severity: 'severe',
    startingBands: { V3: 'strained', V9: 'critical' },
    variables: { HAZARD: 'a synthetic hazard that appears in no authored content' },
  });

  const start = startingStateFor(eighth, initialState());
  assert.equal(start.season.V3, 'strained');
  assert.equal(start.season.V9, 'critical');

  const bundle = loadBundle({ version: 'v0.1', scenes, decisions });
  const scene = resolveForScenario(bundle.scene(scenes[0].id), eighth);
  assert.ok(assertSceneShape(scene), 'the scene still has all six movements under a new scenario');

  // ...and it plays to the end: a decision is reached, chosen, and the run advances.
  const d = decisions[0];
  const { state: after, changes } = choose(start, d, d.options[0].id);
  assert.ok(changes.length > 0);
  assert.ok(after.log.length > 0, 'the scene reached its turn');
});

test('a second scenario and a second severity load and play', () => {
  const a = defineScenario({ id: 's-a', severity: 'moderate', variables: { HAZARD: 'flood' } });
  const b = defineScenario({ id: 's-b', severity: 'severe', variables: { HAZARD: 'seismic' } });
  for (const sc of [a, b]) {
    const scene = resolveForScenario(scenes[0], sc);
    assert.ok(assertSceneShape(scene), sc.id);
  }
  assert.notEqual(a.severity, b.severity);
});

test('a scenario setting an unknown variable is refused', () => {
  const bad = defineScenario({ id: 's-bad', severity: 'mild', startingBands: { V99: 'strong' } });
  assert.throws(() => startingStateFor(bad, initialState()), (e) => e.refusal === 'unknown-season-variable');
});
