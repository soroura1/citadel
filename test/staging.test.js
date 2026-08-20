/**
 * EVS-1 — the staged runtime contract, on the content that has to carry it.
 *
 * ============================================================================
 * THE SCHEMA CANNOT SEE TWO DOCUMENTS AT ONCE. THAT IS WHAT IS TESTED HERE.
 * ============================================================================
 * `contracts@v0.5.0` refuses a movement in the wrong phase, a post-commit
 * phase with no immediate effect in it, and a null narrative response that
 * declares no gap. Each of those is one document, so JSON Schema can do it.
 *
 * What it cannot do is look across the four phases at once (a movement staged
 * twice, or dropped from all of them) or at a scene and its decision together
 * (an option with no response). Those live in `src/engine/staging.js`, and
 * every one of them is proven here by REFUSING and by PERMITTING the
 * corrected form — a rule only tested by rejection passes perfectly while
 * rejecting everything.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import {
  PHASES, phasesOf, phaseOf, stagingRefusals, assertStaged, StagingRefusal,
} from '../src/engine/staging.js';

const sceneOf = (id) => CHAPTER_1.scenes.find((s) => s.id === id);
const decisionFor = (scene) => CHAPTER_1.decisions.find((d) => d.id === scene.choice_or_discovery);
const copy = (s) => JSON.parse(JSON.stringify(s));

// --- the shipped content -------------------------------------------------------

test('★ every Chapter 1 scene is staged, and its staging holds against its decision', () => {
  for (const scene of CHAPTER_1.scenes) {
    assert.deepEqual(stagingRefusals(scene, decisionFor(scene)), [], `${scene.id} is not cleanly staged`);
  }
  assert.equal(CHAPTER_1.scenes.length, 4);
});

test('★ FPE-01 — nothing post-commitment is staged before the commitment', () => {
  // The rule that made this session necessary. Stated over the SHIPPED content
  // rather than over a fixture, because a fixture proves the schema and this
  // proves the chapter.
  for (const scene of CHAPTER_1.scenes) {
    assert.equal(phaseOf(scene, 'turn'), 'post_commit', `${scene.id} stages its turn early`);
    assert.equal(phaseOf(scene, 'residue'), 'scene_exit', `${scene.id} stages its residue early`);
  }
});

test('the phase sequence is a constant — a scene cannot reorder it', () => {
  assert.deepEqual(PHASES, ['pre_commit', 'interactive', 'post_commit', 'scene_exit']);
  const walked = phasesOf(sceneOf('sc-01-01')).map((p) => p.phase);
  assert.deepEqual(walked, [...PHASES], 'the walk follows the constant, not the JSON key order');
});

test('an unstaged scene walks to null rather than to an empty plan', () => {
  // ⚠️ null and [] are different answers. [] reads as "staged, presents
  // nothing", which is a scene a renderer would happily draw as blank.
  assert.equal(phasesOf({ id: 'x' }), null);
  assert.equal(phaseOf({ id: 'x' }, 'turn'), null);
});

// --- the cross-document rules, each refusing AND permitting ---------------------

test('★ a movement staged TWICE is refused — the schema cannot see across phases', () => {
  const s = copy(sceneOf('sc-01-01'));
  s.staging.scene_exit = ['residue'];
  s.staging.pre_commit = ['orientation', 'desire', 'friction'];
  s.staging.interactive = ['choice_or_discovery', 'friction'];   // friction, again

  const refusals = stagingRefusals(s).map((r) => r.refusal);
  assert.ok(refusals.includes('movement-staged-twice'), JSON.stringify(refusals));

  s.staging.interactive = ['choice_or_discovery'];
  assert.deepEqual(stagingRefusals(s), []);
});

test('★ a movement staged NOWHERE is refused — it would simply never be shown', () => {
  const s = copy(sceneOf('sc-01-02'));
  s.staging.pre_commit = ['orientation', 'desire'];              // friction dropped

  const failure = stagingRefusals(s).find((r) => r.refusal === 'movement-not-staged');
  assert.ok(failure, 'a dropped movement must be named');
  assert.match(failure.detail, /friction/);

  s.staging.pre_commit = ['orientation', 'desire', 'friction'];
  assert.deepEqual(stagingRefusals(s), []);
});

test('★ an option with no immediate effect is refused — a choice that did nothing', () => {
  const scene = copy(sceneOf('sc-01-03'));
  const decision = decisionFor(scene);
  const dropped = scene.immediate_effect.responses.pop();

  const failure = stagingRefusals(scene, decision).find((r) => r.refusal === 'option-has-no-immediate-effect');
  assert.ok(failure, 'an unanswered option must be named');
  assert.equal(failure.detail, dropped.option_id);

  scene.immediate_effect.responses.push(dropped);
  assert.deepEqual(stagingRefusals(scene, decision), []);
});

test('★ a response naming an option that does not exist is refused', () => {
  // The mirror of the rule above, and the one a rename produces: the option id
  // changes, the response keeps the old one, and every option still looks
  // answered because the COUNT matches.
  const scene = copy(sceneOf('sc-01-03'));
  const decision = decisionFor(scene);
  scene.immediate_effect.responses[0].option_id = 'dec-01-critical-path.ed-hold-RENAMED';

  const refusals = stagingRefusals(scene, decision).map((r) => r.refusal);
  assert.ok(refusals.includes('immediate-effect-names-unknown-option'), JSON.stringify(refusals));
  assert.ok(refusals.includes('option-has-no-immediate-effect'), 'and the real option is now unanswered');
});

test('⚠️ without a decision the option check SKIPS rather than passing', () => {
  // A check that reports success on absent input is the shape that produced the
  // owner-connection isolation test and the migration runner that printed "ok"
  // while applying nothing.
  const scene = copy(sceneOf('sc-01-03'));
  scene.immediate_effect.responses = [];                          // answers nothing at all
  assert.deepEqual(stagingRefusals(scene), [], 'no decision given, so no claim is made');

  const failures = stagingRefusals(scene, decisionFor(scene));
  assert.equal(failures.length, 3, 'given the decision, all three options are unanswered');
});

test('★ an unstaged scene is refused, and says why in one sentence', () => {
  const s = copy(sceneOf('sc-01-01'));
  delete s.staging;
  assert.deepEqual(stagingRefusals(s).map((r) => r.refusal), ['scene-not-staged']);
});

test('a staged scene with no immediate effect is refused by the engine as well as the schema', () => {
  // Belt and braces on purpose: the schema refuses the document, and the engine
  // refuses the object. A bundle assembled in code never passes through Ajv.
  const s = copy(sceneOf('sc-01-04'));
  delete s.immediate_effect;
  assert.ok(stagingRefusals(s).some((r) => r.refusal === 'immediate-effect-missing'));
});

test('assertStaged throws a NAMED refusal, not a boolean', () => {
  const s = copy(sceneOf('sc-01-01'));
  delete s.staging;
  assert.throws(() => assertStaged(s), (e) => {
    assert.ok(e instanceof StagingRefusal);
    assert.equal(e.refusal, 'scene-not-staged');
    assert.equal(e.where, 'sc-01-01');
    return true;
  });
  assert.ok(assertStaged(sceneOf('sc-01-01'), decisionFor(sceneOf('sc-01-01'))));
});

// --- what canon does and does not supply ---------------------------------------

test('★ no response prose was invented — every null one declares what is owed', () => {
  // Canon authors the operational consequence and the state change per pathway.
  // It authors no post-commitment narration. The distinction between "canon is
  // silent" and "nobody wrote it" only exists if the silence is recorded.
  let nulls = 0;
  for (const scene of CHAPTER_1.scenes) {
    for (const r of scene.immediate_effect.responses) {
      if (r.narrative_response !== null) continue;
      nulls++;
      assert.ok(r.derived_from?.length, `${r.option_id} has nothing to derive the beat from`);
      assert.ok(
        r.unresolved?.some((u) => u.field === 'narrative_response' && u.why.trim().length > 20),
        `${r.option_id} does not say why its narration is absent`,
      );
    }
  }
  assert.equal(nulls, 11, 'every authored option is accounted for');
});

test('★ where canon DOES author a reaction, it is recorded — Scene 4, in three voices', () => {
  // Recording "canon is silent" where canon speaks is the exact inverse of the
  // rule, and would be just as wrong.
  const closure = sceneOf('sc-01-04');
  for (const r of closure.immediate_effect.responses) {
    assert.ok(Array.isArray(r.character_response) && r.character_response.length >= 2,
      `${r.option_id} drops canon's named reactions`);
    assert.ok(r.character_response.some((c) => c.character_id === 'Fadl'),
      'Fadl acts on every closure pathway in canon');
  }

  // And the three scenes where canon is silent say so rather than inventing one.
  for (const id of ['sc-01-01', 'sc-01-02', 'sc-01-03']) {
    for (const r of sceneOf(id).immediate_effect.responses) {
      assert.equal(r.character_response, null, `${r.option_id} invented a reaction`);
      assert.ok(r.unresolved.some((u) => u.field === 'character_response'),
        `${r.option_id} is silent without saying so`);
    }
  }
});

test('the state change is never restated in a scene — one authority, the option effects', () => {
  for (const scene of CHAPTER_1.scenes) {
    assert.equal(scene.immediate_effect.state_change_source, 'decision_effects', scene.id);
  }
});
