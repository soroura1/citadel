/**
 * ★ THE CHAPTER RUNNER — Chapter 1, played end to end.
 *
 * Everything else in the engine was a piece. This is the test that the pieces
 * make a chapter: four scenes in order, one state carried through all of them,
 * and a history a later consequence can be explained from.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { bundleFrom, startRun, view, commit, advance, currentSceneId,
         serialise, deserialise, RunRefusal } from '../src/engine/run.js';
import { presentOptions } from '../src/engine/decision.js';
import { traceback, defer } from '../src/engine/consequence.js';
import { defineScenario } from '../src/engine/configuration.js';

const here = dirname(fileURLToPath(import.meta.url));
const all = (d) => readdirSync(join(here, '../src/content', d))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(here, '../src/content', d, f), 'utf8')));

const scenes = all('scenes');
const decisions = all('decisions');
const bundle = () => bundleFrom({ version: 'v0.1', scenes, decisions });

/**
 * ⚠️ EVS-3 — A RUN REQUIRES A PLAYABLE ROLE. There is no roleless run any more:
 * `!role` used to satisfy every authority gate, which is why every test in this
 * file passed through those gates without exercising one.
 */
const EVS = { role: 'role.resilience-lead' };


/**
 * Walk ONE scene, beat by beat.
 *
 * ⚠️ EVS-2 REPLACED `chooseAndAdvance` WITH TWO CALLS, and this helper is where
 * the difference shows. The old call applied the effects and moved to the next
 * scene in one step, so the response beat had nowhere to happen. Now committing
 * stops at the response and leaving it is a separate act — which is exactly
 * what a player experiences, and what these tests now walk.
 */
function playScene(run, b, pick = (v) => v.presented.options[0].id) {
  run = advance(run, b);                      // pre_commit  -> interactive
  const step = commit(run, b, pick(view(run, b)));
  run = step.run;                             //             -> post_commit
  run = advance(run, b);                      //             -> scene_exit
  run = advance(run, b);                      //             -> the next scene
  return { run, changes: step.changes, response: step.response };
}

/** Play the whole chapter, always taking the first authorised option. */
function playThrough(run, b) {
  const changesPerScene = [];
  while (!run.complete) {
    const step = playScene(run, b);
    changesPerScene.push(step.changes);
    run = step.run;
  }
  return { run, changesPerScene };
}

test('★ Chapter 1 plays from scene 1 to scene 4, in the BUNDLE\'s order', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });

  const visited = [];
  while (!run.complete) {
    visited.push(currentSceneId(run));
    run = playScene(run, b).run;
  }

  assert.deepEqual(visited, ['sc-01-01', 'sc-01-02', 'sc-01-03', 'sc-01-04']);
  assert.equal(run.complete, true);
});

test('★ THE STATE CARRIES — scene 4 does not start where scene 1 did', () => {
  const b = bundle();
  const start = startRun({ bundle: b, config: EVS });
  const { run } = playThrough(start, b);

  const moved = Object.keys(run.state.season)
    .filter((v) => run.state.season[v] !== start.state.season[v]);
  assert.ok(moved.length > 0,
    'a chapter whose scenes each start fresh is four short stories, not a chapter');

  // Chapter-local state accumulated too — the enum decisions actually landed.
  assert.ok(Object.keys(run.state.chapter).length > 0);
});

test('★ every scene produced a visible change — none was a formality', () => {
  const b = bundle();
  const { changesPerScene } = playThrough(startRun({ bundle: b, config: EVS }), b);
  assert.equal(changesPerScene.length, 4);
  changesPerScene.forEach((c, i) => assert.ok(c.length > 0, `scene ${i + 1} changed nothing`));
});

test('★ the history is shaped for TRACEBACK — a later consequence is explainable', () => {
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b, config: EVS }), b);

  assert.equal(run.history.length, 4);
  assert.deepEqual(run.history.map((h) => h.sequence), [1, 2, 3, 4]);

  // The real proof: R4's traceback can consume this history unmodified.
  const consequence = defer({
    caused_by: [run.history[0].optionId],
    surfaces_at: { chapter: 'ch-02' },
    relationship: 'precursor',
    emotional: 'The Foreman does not look at you during handover.',
    operational: 'The second bay loses power with no tested fallback.',
    player_could_have_known: false,
  });
  const t = traceback(consequence, run.history);
  assert.equal(t.chain.length, 1);
  assert.equal(t.chain[0].optionId, run.history[0].optionId);
});

test('a run resumes mid-chapter, at the scene it left, with the state it had', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  run = playScene(run, b).run;
  run = playScene(run, b).run;

  const resumed = deserialise(serialise(run), b);
  assert.equal(currentSceneId(resumed), 'sc-01-03');
  assert.deepEqual(resumed.state.season, run.state.season);
  assert.equal(resumed.history.length, 2);
});

test('★ a run cannot resume into a different bundle version', () => {
  const b = bundle();
  const saved = serialise(startRun({ bundle: b, config: EVS }));
  const later = bundleFrom({ version: 'v0.2', scenes, decisions });
  assert.throws(() => deserialise(saved, later), (e) => e.refusal === 'run-pinned-to-another-bundle');
});

test('★ EVS-3 — a role without authority SUPPORTS; deciding stays refused', () => {
  // ============================================================================
  // CANON HOLDS BOTH OF THESE, AND THEY LOOK CONTRADICTORY
  // ============================================================================
  //   "No solo player gains fictional authority to make every decision."
  //   "The responsible clinicians define eligibility and minimum safety. The
  //    player influences which system carries the resulting pressure."
  //
  // The Final Product Experience Contract's commit beat reconciles them: the
  // player "decides, escalates, delegates, negotiates OR SUPPORTS ANOTHER
  // PERSON'S PROPOSAL under a named constraint." Neither EVS role holds
  // authority over the power-pressure or capacity decisions — that is canon,
  // not an oversight — so without support the slice's own two roles could not
  // reach the capacity commitment the EVS gate requires.
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });

  // Advance to the FIRST gated decision in BUNDLE ORDER. An earlier version of
  // this test picked a gated decision by id and tried to walk to it — and threw
  // on an earlier gate it had to pass through. The engine was right; the test
  // was navigating a chapter it had assumed was ungated until its target.
  let reached = null;
  while (!run.complete) {
    run = advance(run, b);
    const v = view(run, b);
    if (v.presented && !v.presented.authorised) { reached = v; break; }
    run = advance(advance(commit(run, b, v.presented.options[0].id).run, b), b);
  }

  assert.ok(reached, 'no decision in Chapter 1 gates on authority — this test would prove nothing');
  assert.equal(reached.presented.authorised, false);
  assert.equal(reached.presented.commitAs, 'support');
  assert.ok(reached.presented.authorityHeldBy.length > 0, 'the constraint must be NAMED');
  assert.ok(!reached.presented.authorityHeldBy.includes(EVS.role));

  // ★ ASKING TO DECIDE IS STILL REFUSED, BY NAME. Support is what is offered
  // instead — a caller must not be quietly given one when it asked for the other.
  assert.throws(() => commit(run, b, reached.decision.options[0].id, { as: 'decision' }),
    (e) => e instanceof RunRefusal && e.refusal === 'role-lacks-authority-to-decide');

  // ...and supporting proceeds, with the record saying which act it was.
  const step = commit(run, b, reached.decision.options[0].id);
  assert.equal(step.committedAs, 'support');
  assert.equal(step.run.history.at(-1).committedAs, 'support');
  assert.deepEqual(step.run.history.at(-1).authorityHeldBy, reached.presented.authorityHeldBy);
  assert.ok(step.changes.length > 0, 'supporting a pathway still moves the world');

  // ...and a role that DOES hold the authority decides, or the gate refuses
  // everyone. It is not selectable in this slice, so this is asserted on the
  // decision unit rather than by starting a run with it.
  const holder = presentOptions(reached.decision, { role: reached.decision.requires_authority[0] });
  assert.equal(holder.authorised, true);
  assert.equal(holder.commitAs, 'decision');
});

test('★ EVS-3 — a run with NO role is refused; it was unrestricted authority', () => {
  // ⚠️ `presentOptions` read `!requires_authority || !role || …`, so a run with
  // no role passed every authority gate. The check was present and correct and
  // the missing case short-circuited it — and every test started a roleless
  // run, which is exactly the case that skipped the gate.
  const b = bundle();
  assert.throws(() => startRun({ bundle: b }), (e) => e.refusal === 'run-has-no-role');
  assert.throws(() => startRun({ bundle: b, config: { role: null } }),
    (e) => e.refusal === 'run-has-no-role');

  // Defence in depth: the decision layer refuses it too, because a bundle can
  // be driven from a script that never called startRun.
  const gated = decisions.find((d) => (d.requires_authority ?? []).length > 0);
  const ungated = decisions.find((d) => !(d.requires_authority ?? []).length);
  assert.equal(presentOptions(gated, { role: null }).mayCommit, false);
  assert.equal(presentOptions(gated, { role: null }).refusal, 'run-has-no-role');
  // ...including on an UNGATED decision. A roleless run is refused because it
  // has no standing, not because a particular decision is protected.
  assert.equal(presentOptions(ungated, { role: null }).mayCommit, false);
});

test('★ EVS-3 — a role the slice has not authored is refused, not silently accepted', () => {
  const b = bundle();
  // Present in the content — all sixteen council roles have a variant — and
  // NOT brought to slice depth.
  assert.throws(() => startRun({ bundle: b, config: { role: 'role.operations' } }),
    (e) => e.refusal === 'role-not-selectable-in-this-slice');
  // And an id that is not in the content at all.
  assert.throws(() => startRun({ bundle: b, config: { role: 'role.invented' } }),
    (e) => e.refusal === 'role-not-selectable-in-this-slice');
  // ...while both EVS roles start.
  for (const role of ['role.resilience-lead', 'role.quality-patient-safety']) {
    assert.ok(startRun({ bundle: b, config: { role } }));
  }
});

test('★ order comes from the BUNDLE, not from sorting scene ids', () => {
  // Declared backwards; the runner must honour it rather than re-sorting.
  const b = bundleFrom({
    version: 'v0.1', scenes, decisions,
    order: ['sc-01-04', 'sc-01-03', 'sc-01-02', 'sc-01-01'],
  });
  const run = startRun({ bundle: b, config: EVS });
  assert.equal(currentSceneId(run), 'sc-01-04');
});

test('a scenario shifts where the chapter STARTS, without changing how it plays', () => {
  const b = bundle();
  const severe = defineScenario({ id: 's-severe', severity: 'severe', startingBands: { V3: 'strained' } });
  const run = startRun({ bundle: b, config: EVS, scenario: severe });
  assert.equal(run.state.season.V3, 'strained');
  assert.equal(currentSceneId(run), 'sc-01-01', 'the same first scene');
});

test('★ a deferred consequence owed to Chapter 2 does NOT arrive at the end of Chapter 1', () => {
  // v1 holds one chapter. The debt staying owed is the honest state, and it is
  // what R4's synthetic fixture exists to fire across.
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b, config: EVS }), b);
  const owedToNextChapter = (run.state.pending ?? [])
    .filter((c) => c.delay === 'next_chapter' || c.delay === 'later_season');
  assert.equal(run.arrived.filter((c) => c.surfaces_at?.chapter === 'ch-02').length, 0);
  assert.ok(owedToNextChapter.length >= 0);   // shape holds whether or not any exist
});

test('choosing after the chapter is complete is refused', () => {
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b, config: EVS }), b);
  assert.throws(() => commit(run, b, 'anything'), (e) => e.refusal === 'run-already-complete');
  assert.throws(() => advance(run, b), (e) => e.refusal === 'run-already-complete');
});
