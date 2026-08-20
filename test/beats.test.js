/**
 * EVS-2 — the runtime chronology, as an EVENT TRACE.
 *
 * ============================================================================
 * THE QUESTION THIS SESSION EXISTS TO ANSWER
 * ============================================================================
 * Does the player investigate and commit BEFORE seeing the turn, the state
 * delta or the residue?
 *
 * Before EVS-2 the answer was no, in the plainest possible way: the renderer
 * emitted all six authored movements as one ordered document, and
 * `chooseAndAdvance` applied the effects and moved to the next scene in a
 * single call — so the response beat had nowhere to happen at all.
 *
 * The trace below is the proof. It records the beat at every step of a whole
 * chapter and asserts the ORDER, rather than asserting that each piece exists
 * somewhere.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { PHASES } from '../src/engine/staging.js';
import {
  bundleFrom, startRun, view, commit, advance, currentSceneId,
  serialise, deserialise, RunRefusal,
} from '../src/engine/run.js';

const bundle = () => bundleFrom(CHAPTER_1);
const sceneOf = (id) => CHAPTER_1.scenes.find((s) => s.id === id);

/**
 * ⚠️ EVS-3 — A RUN REQUIRES A PLAYABLE ROLE. There is no roleless run any more:
 * `!role` used to satisfy every authority gate, which is why every test in this
 * file passed through those gates without exercising one.
 */
const EVS = { role: 'role.resilience-lead' };


/** Walk the whole chapter, recording every beat entered and what it carried. */
function trace(b, pick = (v) => v.presented.options[0].id) {
  let run = startRun({ bundle: b, config: EVS });
  const events = [];
  let guard = 0;

  while (!run.complete && guard++ < 100) {
    const v = view(run, b);
    events.push({
      scene: currentSceneId(run),
      phase: v.phase,
      hasDecision: Boolean(v.presented),
      hasResponse: Boolean(v.response),
      movements: v.presents.map((p) => p.movement),
    });

    if (v.phase === 'interactive') {
      run = commit(run, b, pick(v)).run;
    } else {
      run = advance(run, b);
    }
  }
  return { run, events };
}

test('★ THE ORDER: encounter -> decision -> response -> residue -> the next scene', () => {
  const b = bundle();
  const { events } = trace(b);

  const firstScene = events.filter((e) => e.scene === 'sc-01-01').map((e) => e.phase);
  assert.deepEqual(firstScene, [...PHASES],
    'a scene must be walked in the contract\'s phase order, with none skipped');

  // ...and the chapter is four of those, in the bundle's order.
  const scenes = [...new Set(events.map((e) => e.scene))];
  assert.deepEqual(scenes, ['sc-01-01', 'sc-01-02', 'sc-01-03', 'sc-01-04']);
  assert.equal(events.length, 16, 'four scenes, four beats each');
});

test('★ FPE-01 — the turn and the residue are ABSENT from every pre-commit beat', () => {
  // Not hidden. Absent. `view()` projects the current phase, so a surface at
  // `pre_commit` has no `turn` in its props to draw by accident.
  const b = bundle();
  const { events } = trace(b);

  for (const e of events) {
    if (e.phase === 'pre_commit' || e.phase === 'interactive') {
      assert.ok(!e.movements.includes('turn'), `${e.scene} presents the turn at ${e.phase}`);
      assert.ok(!e.movements.includes('residue'), `${e.scene} presents the residue at ${e.phase}`);
      assert.equal(e.hasResponse, false, `${e.scene} carries a response at ${e.phase}`);
    }
  }

  // And they DO arrive, or the assertion above would pass on a runner that
  // never showed them at all.
  const turns = events.filter((e) => e.movements.includes('turn'));
  const residues = events.filter((e) => e.movements.includes('residue'));
  assert.equal(turns.length, 4, 'every scene shows its turn, at post_commit');
  assert.ok(turns.every((e) => e.phase === 'post_commit'));
  assert.equal(residues.length, 4, 'every scene shows its residue, at scene_exit');
  assert.ok(residues.every((e) => e.phase === 'scene_exit'));
});

test('★ FPE-02 — the response exists BEFORE the run leaves the scene', () => {
  const b = bundle();
  const { events } = trace(b);
  const responses = events.filter((e) => e.hasResponse);
  assert.equal(responses.length, 4);
  assert.ok(responses.every((e) => e.phase === 'post_commit'));

  // The scene the response belongs to is still the scene it happened in.
  for (const e of responses) {
    const withinSameScene = events.filter((x) => x.scene === e.scene);
    assert.equal(withinSameScene.at(-1).phase, 'scene_exit',
      'the run must not leave the scene at the moment of the response');
  }
});

test('★ the decision exists ONLY at `interactive` — one beat, not four', () => {
  const b = bundle();
  const { events } = trace(b);
  const withDecision = events.filter((e) => e.hasDecision);
  assert.equal(withDecision.length, 4);
  assert.ok(withDecision.every((e) => e.phase === 'interactive'));
});

// --- committing and advancing are two acts -------------------------------------

test('★ committing does NOT advance the scene', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const after = commit(b && atDecision, b, view(atDecision, b).presented.options[0].id).run;

  assert.equal(currentSceneId(after), 'sc-01-01', 'the commitment happened here, and stays here');
  assert.equal(after.phase, 'post_commit');
  assert.ok(after.response, 'and the response exists');
});

test('★ a commitment out of turn is refused BY THE ENGINE', () => {
  // The surface not drawing a button is not enforcement. A decision accepted
  // while the encounter is still on screen is FPE-01 broken, and it would be
  // held only by every caller behaving.
  const b = bundle();
  const atEncounter = startRun({ bundle: b, config: EVS });
  assert.equal(atEncounter.phase, 'pre_commit');

  assert.throws(() => commit(atEncounter, b, 'dec-01-gate-access.assign-owner'),
    (e) => e instanceof RunRefusal && e.refusal === 'commitment-out-of-turn');

  // ...and it is accepted one beat later, so the refusal is about the beat.
  const atDecision = advance(atEncounter, b);
  assert.ok(commit(atDecision, b, 'dec-01-gate-access.assign-owner').run);
});

test('★ you cannot walk PAST a decision without making one', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  assert.throws(() => advance(atDecision, b),
    (e) => e.refusal === 'cannot-advance-past-an-undecided-commitment');
});

// --- resume lands on the beat, not near it -------------------------------------

test('★ a run saved AT THE RESPONSE resumes at the response, not past it', () => {
  // The failure this prevents: reload after choosing, and the response the
  // player has not read yet is gone. The chapter would have answered them
  // while they were not looking.
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const committed = commit(atDecision, b, view(atDecision, b).presented.options[0].id).run;

  const resumed = deserialise(serialise(committed), b);
  assert.equal(resumed.phase, 'post_commit');
  assert.equal(currentSceneId(resumed), 'sc-01-01');
  assert.equal(resumed.response.optionId, committed.response.optionId);
  assert.deepEqual(view(resumed, b).response, view(committed, b).response);
});

test('every beat of every scene round-trips through serialise', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  let guard = 0;
  while (!run.complete && guard++ < 100) {
    const resumed = deserialise(serialise(run), b);
    assert.equal(resumed.phase, run.phase);
    assert.equal(currentSceneId(resumed), currentSceneId(run));
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  assert.equal(run.complete, true);
});

test('★ a response beat saved with NO response is refused by name', () => {
  // ⚠️ This renders as a page that says a choice was made and shows nothing it
  // did — worse than a crash, because it looks like a finished screen.
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const committed = commit(atDecision, b, view(atDecision, b).presented.options[0].id).run;

  const broken = JSON.stringify({ ...committed, response: null });
  assert.throws(() => deserialise(broken, b),
    (e) => e.refusal === 'resumed-response-beat-has-no-response');
});

test('an unknown beat is refused rather than defaulted', () => {
  const b = bundle();
  const run = startRun({ bundle: b, config: EVS });
  const broken = JSON.stringify({ ...run, phase: 'whenever' });
  assert.throws(() => deserialise(broken, b), (e) => e.refusal === 'unknown-phase');
});

// --- what the response is made of ---------------------------------------------

test('★ the response names the chosen option and what moved', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const optionId = view(atDecision, b).presented.options[0].id;
  const { response, changes } = commit(atDecision, b, optionId);

  assert.equal(response.optionId, optionId);
  assert.ok(response.label.key, 'the option is named, not merely identified');
  assert.deepEqual(response.changes, changes);
  assert.ok(response.changes.length > 0, 'a decision that moved nothing is a formality');
});

test('a derived narrative cites the effects when the content declares them', () => {
  const b = bundle();
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const { response } = commit(atDecision, b, 'dec-01-gate-access.assign-owner');

  assert.equal(response.narrative.provenance, 'derived');
  assert.deepEqual(response.narrative.from, ['protects', 'risks', 'effects']);
  assert.equal(response.narrative.citesChanges, true);
});

test('★ a DERIVED narrative uses ONLY the sources the content declares', () => {
  // ⚠️ ON A MUTATED BUNDLE, DELIBERATELY. Every shipped option declares all
  // three sources, because canon supplies all three for all eleven — so no
  // shipped content exercises the restriction, and bending one option's
  // declaration to give this test something to find would be authoring content
  // for a test's benefit. The mutation is honest about what it is.
  //
  // Honouring `derived_from` is what makes it a contract rather than a comment,
  // and a comment could not be tested at all.
  const scenes = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-01') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.immediate_effect.responses[0].derived_from = ['protects'];
    return copy;
  });
  const b = bundleFrom({ ...CHAPTER_1, scenes });
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const { response } = commit(atDecision, b, scenes[0].immediate_effect.responses[0].option_id);

  assert.deepEqual(response.narrative.from, ['protects']);
  assert.ok(response.narrative.protects, 'the declared source is used');
  assert.equal(response.narrative.risks, null, 'an undeclared source is not');
  assert.equal(response.narrative.citesChanges, false,
    'the account must not cite effects it did not declare');
  // ...while the state moves are still SHOWN, because they are what happened.
  // The restriction is on the account, not on the record.
  assert.ok(response.changes.length > 0);
});

test('a response with nothing to derive from is refused, not rendered blank', async () => {
  const { ResponseRefusal } = await import('../src/engine/response.js');
  const scenes = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-01') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.immediate_effect.responses[0].derived_from = [];
    return copy;
  });
  const b = bundleFrom({ ...CHAPTER_1, scenes });
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  assert.throws(
    () => commit(atDecision, b, scenes[0].immediate_effect.responses[0].option_id),
    (e) => e instanceof ResponseRefusal && e.refusal === 'nothing-to-derive-the-response-from',
  );
});

test('★ Scene 4 carries canon\'s characters VERBATIM, and nowhere else invents one', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: EVS });
  const seen = [];

  let guard = 0;
  while (!run.complete && guard++ < 100) {
    if (run.phase === 'interactive') {
      const step = commit(run, b, view(run, b).presented.options[0].id);
      seen.push({ scene: currentSceneId(run), response: step.response });
      run = step.run;
    } else {
      run = advance(run, b);
    }
  }

  for (const { scene, response } of seen) {
    if (scene === 'sc-01-04') {
      assert.equal(response.charactersProvenance, 'authored');
      assert.ok(response.characters.length >= 2, 'canon reacts in more than one voice here');
      const fadl = response.characters.find((c) => c.character_id === 'Fadl');
      assert.ok(fadl, 'Fadl acts on every closure pathway in canon');
      // Verbatim: the string is the content's, not something assembled from
      // the option. Nothing is prefixed, suffixed or summarised.
      const authored = sceneOf('sc-01-04').immediate_effect.responses
        .find((r) => r.option_id === response.optionId);
      assert.deepEqual(response.characters, authored.character_response);
    } else {
      assert.deepEqual(response.characters, [], `${scene} invented a character reaction`);
      assert.equal(response.charactersProvenance, 'canon-silent');
    }
  }
});

test('★ an AUTHORED narrative takes precedence over the derived composition', () => {
  // Nothing authors one yet, so this proves the branch on a mutated bundle
  // rather than on shipped content. Without it, "authored wins" is a sentence
  // in a comment: the derived path is the only one anything has executed.
  const scenes = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-01') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.immediate_effect.responses[0].narrative_response = { key: 'scene.01.01.orientation' };
    return copy;
  });
  const b = bundleFrom({ ...CHAPTER_1, scenes });
  const atDecision = advance(startRun({ bundle: b, config: EVS }), b);
  const { response } = commit(atDecision, b, scenes[0].immediate_effect.responses[0].option_id);

  assert.equal(response.narrative.provenance, 'authored');
  assert.equal(response.narrative.key, 'scene.01.01.orientation');
  assert.equal(response.narrative.protects, undefined, 'the derived fields are not also assembled');
});
