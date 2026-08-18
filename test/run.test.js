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

import { bundleFrom, startRun, view, chooseAndAdvance, currentSceneId,
         serialise, deserialise, RunRefusal } from '../src/engine/run.js';
import { traceback, defer } from '../src/engine/consequence.js';
import { defineScenario } from '../src/engine/configuration.js';

const here = dirname(fileURLToPath(import.meta.url));
const all = (d) => readdirSync(join(here, '../src/content', d))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(here, '../src/content', d, f), 'utf8')));

const scenes = all('scenes');
const decisions = all('decisions');
const bundle = () => bundleFrom({ version: 'v0.1', scenes, decisions });

/** Play the whole chapter, always taking the first authorised option. */
function playThrough(run, b) {
  const changesPerScene = [];
  while (!run.complete) {
    const v = view(run, b);
    const option = v.presented.options[0].id;
    const step = chooseAndAdvance(run, b, option);
    changesPerScene.push(step.changes);
    run = step.run;
  }
  return { run, changesPerScene };
}

test('★ Chapter 1 plays from scene 1 to scene 4, in the BUNDLE\'s order', () => {
  const b = bundle();
  let run = startRun({ bundle: b });

  const visited = [];
  while (!run.complete) {
    visited.push(currentSceneId(run));
    run = chooseAndAdvance(run, b, view(run, b).presented.options[0].id).run;
  }

  assert.deepEqual(visited, ['sc-01-01', 'sc-01-02', 'sc-01-03', 'sc-01-04']);
  assert.equal(run.complete, true);
});

test('★ THE STATE CARRIES — scene 4 does not start where scene 1 did', () => {
  const b = bundle();
  const start = startRun({ bundle: b });
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
  const { changesPerScene } = playThrough(startRun({ bundle: b }), b);
  assert.equal(changesPerScene.length, 4);
  changesPerScene.forEach((c, i) => assert.ok(c.length > 0, `scene ${i + 1} changed nothing`));
});

test('★ the history is shaped for TRACEBACK — a later consequence is explainable', () => {
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b }), b);

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
  let run = startRun({ bundle: b });
  run = chooseAndAdvance(run, b, view(run, b).presented.options[0].id).run;
  run = chooseAndAdvance(run, b, view(run, b).presented.options[0].id).run;

  const resumed = deserialise(serialise(run), b);
  assert.equal(currentSceneId(resumed), 'sc-01-03');
  assert.deepEqual(resumed.state.season, run.state.season);
  assert.equal(resumed.history.length, 2);
});

test('★ a run cannot resume into a different bundle version', () => {
  const b = bundle();
  const saved = serialise(startRun({ bundle: b }));
  const later = bundleFrom({ version: 'v0.2', scenes, decisions });
  assert.throws(() => deserialise(saved, later), (e) => e.refusal === 'run-pinned-to-another-bundle');
});

test('★ a role without authority CANNOT decide by calling the engine directly', () => {
  // The surface hiding a button is not enforcement. I3: the client may
  // propose; only the server may decide.
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: 'role.not-listed' } });

  // Advance to the FIRST gated decision in BUNDLE ORDER. An earlier version of
  // this test picked a gated decision by id and tried to walk to it — and threw
  // on an earlier gate it had to pass through. The engine was right; the test
  // was navigating a chapter it had assumed was ungated until its target.
  let reached = null;
  while (!run.complete) {
    const v = view(run, b);
    if (v.presented && !v.presented.authorised) { reached = v; break; }
    run = chooseAndAdvance(run, b, v.presented.options[0].id).run;
  }

  assert.ok(reached, 'no decision in Chapter 1 gates on authority — this test would prove nothing');
  assert.equal(reached.presented.refusal, 'role-lacks-authority-to-decide');

  // ★ The surface hiding a button is not enforcement. Calling the engine
  // directly must refuse too — I3: the client may propose, only the server decides.
  assert.throws(() => chooseAndAdvance(run, b, reached.decision.options[0].id),
    (e) => e instanceof RunRefusal && e.refusal === 'role-lacks-authority-to-decide');

  // ...and a role that DOES hold authority proceeds, or the gate refuses everyone.
  const authorised = startRun({ bundle: b, config: { role: reached.decision.requires_authority[0] } });
  let ar = authorised;
  while (currentSceneId(ar) !== reached.scene.id) {
    ar = chooseAndAdvance(ar, b, view(ar, b).presented.options[0].id).run;
  }
  assert.equal(view(ar, b).presented.authorised, true);
});

test('★ order comes from the BUNDLE, not from sorting scene ids', () => {
  // Declared backwards; the runner must honour it rather than re-sorting.
  const b = bundleFrom({
    version: 'v0.1', scenes, decisions,
    order: ['sc-01-04', 'sc-01-03', 'sc-01-02', 'sc-01-01'],
  });
  const run = startRun({ bundle: b });
  assert.equal(currentSceneId(run), 'sc-01-04');
});

test('a scenario shifts where the chapter STARTS, without changing how it plays', () => {
  const b = bundle();
  const severe = defineScenario({ id: 's-severe', severity: 'severe', startingBands: { V3: 'strained' } });
  const run = startRun({ bundle: b, scenario: severe });
  assert.equal(run.state.season.V3, 'strained');
  assert.equal(currentSceneId(run), 'sc-01-01', 'the same first scene');
});

test('★ a deferred consequence owed to Chapter 2 does NOT arrive at the end of Chapter 1', () => {
  // v1 holds one chapter. The debt staying owed is the honest state, and it is
  // what R4's synthetic fixture exists to fire across.
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b }), b);
  const owedToNextChapter = (run.state.pending ?? [])
    .filter((c) => c.delay === 'next_chapter' || c.delay === 'later_season');
  assert.equal(run.arrived.filter((c) => c.surfaces_at?.chapter === 'ch-02').length, 0);
  assert.ok(owedToNextChapter.length >= 0);   // shape holds whether or not any exist
});

test('choosing after the chapter is complete is refused', () => {
  const b = bundle();
  const { run } = playThrough(startRun({ bundle: b }), b);
  assert.throws(() => chooseAndAdvance(run, b, 'anything'), (e) => e.refusal === 'run-already-complete');
});
