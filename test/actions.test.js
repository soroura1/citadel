/**
 * EVS-4 — is the participant doing systems work with people?
 *
 * ============================================================================
 * THE ANSWER BEFORE THIS SESSION WAS NO, AND IT WAS NOT SUBTLE
 * ============================================================================
 * A scene presented its authored movements and then its options. Nothing was
 * found out; everything was told. The participant read prose and chose from a
 * menu, which is the failure the Final Product Experience Contract names in its
 * own words: "A final-quality chapter may not consist only of prose followed by
 * option buttons."
 *
 * ★ THE TWO NEW ACTION TYPES ARE CANON'S, NOT A GAMES CHECKLIST'S.
 *
 *   "place detailed timings in OPTIONAL INSPECTION or the later review rather
 *    than long crisis dialogue"
 *   "The selected role supplies one direct authority. The player must SEEK
 *    OTHER JUDGMENTS from named clinical, nursing, operational, safety,
 *    information, and city partners."
 *
 * So they were transcribed. Every action and every piece of evidence in the
 * content carries the canon passage it came from, and the schema refuses one
 * that does not.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import {
  bundleFrom, startRun, view, act, commit, advance, currentSceneId,
  serialise, deserialise, heldEvidence, RunRefusal,
} from '../src/engine/run.js';
import {
  evidenceRefusals, unreachableRevealsByRole, reachableEvidenceFor,
  availableActions, visibleTo, assertRevealsReachableByEveryRole, EvidenceRefusal,
} from '../src/engine/evidence.js';
import { presentOptions } from '../src/engine/decision.js';
import { SELECTABLE_ROLES } from '../src/engine/roles.js';

const bundle = () => bundleFrom(CHAPTER_1);
const LEAD = 'role.resilience-lead';
const QUALITY = 'role.quality-patient-safety';
const sceneOf = (id) => CHAPTER_1.scenes.find((s) => s.id === id);
const atDecision = (role) => {
  const b = bundle();
  return { b, run: advance(startRun({ bundle: b, config: { role } }), b) };
};

// --- the content holds together -------------------------------------------------

test('★ every action reveals real evidence, and every fact has an action that reaches it', () => {
  for (const scene of CHAPTER_1.scenes) {
    assert.deepEqual(evidenceRefusals(scene), [], `${scene.id}`);
  }
});

test('★ nothing was invented — every action and fact cites the canon it came from', () => {
  let actions = 0; let evidence = 0;
  for (const scene of CHAPTER_1.scenes) {
    for (const a of scene.actions) {
      actions++;
      assert.match(a.derivedFrom, /^Canon, chapter-01/, `${a.id} does not cite canon`);
      assert.ok(a.derivedFrom.length > 60, `${a.id}'s citation is too thin to check`);
    }
    for (const e of scene.evidence) {
      evidence++;
      assert.match(e.derivedFrom, /^Canon, chapter-01/, `${e.id} does not cite canon`);
    }
  }
  assert.equal(actions, 17);
  assert.equal(evidence, 21);
});

test('★ an inspection cannot answer back, and a consultation must address a person', () => {
  // Only a person can decline. An `inspect` carrying a response would be a room
  // answering, which is a different mechanic wearing this one's name.
  const scene = JSON.parse(JSON.stringify(sceneOf('sc-01-01')));
  const inspection = scene.actions.find((a) => a.type === 'inspect');
  inspection.response = { character_id: 'nobody', does: 'speaks' };
  assert.ok(evidenceRefusals(scene).some((r) => r.refusal === 'inspection-cannot-respond'));

  const scene2 = JSON.parse(JSON.stringify(sceneOf('sc-01-01')));
  const consult = scene2.actions.find((a) => a.type === 'consult');
  consult.target = { kind: 'instrument', id: 'a board' };
  assert.ok(evidenceRefusals(scene2).some((r) => r.refusal === 'consult-must-address-a-person'));
});

// --- three action types, three state transitions --------------------------------

test('★ three action types, with distinct controls and distinct transitions', () => {
  const { b, run } = atDecision(LEAD);
  const v = view(run, b);

  const types = new Set(v.actions.map((a) => a.type));
  assert.deepEqual([...types].sort(), ['consult', 'inspect']);

  // INSPECT — evidence, no person, no response.
  const inspection = act(run, b, 'inspect.01.01.handover-board');
  assert.equal(inspection.response, null, 'a board does not answer back');
  assert.equal(inspection.found.length, 2);
  assert.equal(inspection.run.discovered.length, 2);
  assert.equal(inspection.run.actionsTaken.at(-1).type, 'inspect');

  // CONSULT — evidence AND a person doing something.
  const consult = act(run, b, 'consult.01.01.nour');
  assert.ok(consult.response, 'a person must respond');
  assert.equal(consult.response.character_id, 'Nour');
  assert.equal(consult.run.actionsTaken.at(-1).type, 'consult');

  // COMMIT — the third, and the only one that moves the beat.
  const committed = commit(run, b, v.presented.options[0].id);
  assert.equal(committed.run.phase, 'post_commit');
  assert.equal(inspection.run.phase, 'interactive', 'investigating does not advance the beat');
  assert.equal(consult.run.phase, 'interactive');
});

test('★ at least one action is available BEFORE the commitment, in every scene', () => {
  // FPE: "at least three materially different action types, and ONE MUST OCCUR
  // BEFORE THE MAIN COMMITMENT."
  const b = bundle();
  for (const role of [LEAD, QUALITY]) {
    let run = startRun({ bundle: b, config: { role } });
    while (!run.complete) {
      if (run.phase === 'interactive') {
        const v = view(run, b);
        assert.ok(v.actions.length > 0,
          `${currentSceneId(run)} offers ${role} nothing to do before deciding`);
        assert.ok(v.presented, 'and the commitment is in the same beat');
        run = commit(run, b, v.presented.options[0].id).run;
      } else run = advance(run, b);
    }
  }
});

test('★ an action out of turn is refused — investigating after deciding is chronology backwards', () => {
  const { b, run } = atDecision(LEAD);
  const encounter = startRun({ bundle: b, config: { role: LEAD } });
  assert.throws(() => act(encounter, b, 'inspect.01.01.handover-board'),
    (e) => e instanceof RunRefusal && e.refusal === 'action-out-of-turn');

  // ...and after the commitment, where it would mean learning something and
  // having it count as though it were known before.
  const after = commit(run, b, view(run, b).presented.options[0].id).run;
  assert.throws(() => act(after, b, 'inspect.01.01.handover-board'),
    (e) => e.refusal === 'action-out-of-turn');
});

test('an action taken twice is refused, and it stops being offered', () => {
  const { b, run } = atDecision(LEAD);
  const once = act(run, b, 'consult.01.01.ayyash').run;
  assert.ok(!view(once, b).actions.some((a) => a.id === 'consult.01.01.ayyash'));
  assert.throws(() => act(once, b, 'consult.01.01.ayyash'),
    (e) => e.refusal === 'action-already-taken');
});

test('★ an action gated behind evidence is unavailable until the evidence is held', () => {
  // The one chain canon narrates: Rami demonstrates the shared board, and the
  // sealed arch is reachable because the board is known.
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: LEAD } });
  run = advance(advance(advance(commit(advance(run, b), b,
    view(advance(run, b), b).presented.options[0].id).run, b), b), b);
  assert.equal(currentSceneId(run), 'sc-01-02');

  assert.ok(!view(run, b).actions.some((a) => a.id === 'inspect.01.02.sealed-arch'));
  assert.throws(() => act(run, b, 'inspect.01.02.sealed-arch'),
    (e) => e.refusal === 'action-requires-evidence-not-held');

  const afterRami = act(run, b, 'consult.01.02.rami').run;
  assert.ok(view(afterRami, b).actions.some((a) => a.id === 'inspect.01.02.sealed-arch'),
    'the arch opens because the board is known');
  assert.ok(act(afterRami, b, 'inspect.01.02.sealed-arch').found.length > 0);
});

// --- provenance and partiality --------------------------------------------------

test('★ every discovery records WHO OR WHAT said it, and which act it came through', () => {
  // Chapter 1 turns on two people reading accurate information in different
  // rooms. A run holding one world state cannot express that.
  const { b, run } = atDecision(LEAD);
  const { run: after, found } = act(run, b, 'consult.01.01.nour');

  for (const d of found) {
    assert.ok(d.source.kind && d.source.id, 'a fact from nowhere');
    assert.equal(d.via, 'consult.01.01.nour');
    assert.equal(d.sceneId, 'sc-01-01');
    assert.equal(typeof d.partial, 'boolean');
  }
  assert.deepEqual(view(after, b).discoveries.map((d) => d.source.id), ['Nour', 'Nour']);
});

test('★ two true readings disagree, and the run holds BOTH with their sources', () => {
  // The Hall reads two beds free; the bedside says the roster covers 28 of the
  // 30 already occupied. Both are accurate. The engine keeps them apart.
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: LEAD } });
  while (currentSceneId(run) !== 'sc-01-03') {
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  run = advance(run, b);
  run = act(run, b, 'inspect.01.03.hall-report').run;
  run = act(run, b, 'consult.01.03.critical-care-lead').run;

  const here = view(run, b).discoveries;
  const hall = here.find((d) => d.evidenceId === 'ev.01.03.hall-says-two-free');
  const bedside = here.find((d) => d.evidenceId === 'ev.01.03.bedside-position');
  assert.equal(hall.source.kind, 'instrument');
  assert.equal(bedside.source.kind, 'person');
  assert.equal(hall.partial, true, 'the Hall reading is true and is not the whole truth');
  assert.equal(bedside.partial, false);
});

// --- role filtering, and the guarantee that survives it -------------------------

test('★ evidence is role-filtered, in BOTH directions', () => {
  const b = bundle();
  const toScene2 = (role) => {
    let run = startRun({ bundle: b, config: { role } });
    while (currentSceneId(run) !== 'sc-01-02') {
      run = run.phase === 'interactive'
        ? commit(run, b, view(run, b).presented.options[0].id).run
        : advance(run, b);
    }
    return advance(run, b);
  };

  const lead = view(toScene2(LEAD), b).actions.map((a) => a.id);
  const quality = view(toScene2(QUALITY), b).actions.map((a) => a.id);

  // Canon pairs the Quality role with Fadl BY NAME; the lead's own first
  // evidence is the absence of a coordinating owner.
  assert.ok(quality.includes('consult.01.02.fadl'));
  assert.ok(!lead.includes('consult.01.02.fadl'));
  assert.ok(lead.includes('consult.01.02.nursing-leader'));
  assert.ok(!quality.includes('consult.01.02.nursing-leader'));

  // ...and both share the actions canon gives to everyone.
  for (const shared of ['consult.01.02.rami', 'inspect.01.02.electrical-sequence']) {
    assert.ok(lead.includes(shared) && quality.includes(shared));
  }
});

test('★ the engine refuses an action the role cannot take — not just the surface', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: LEAD } });
  while (currentSceneId(run) !== 'sc-01-02') {
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  run = advance(run, b);
  assert.throws(() => act(run, b, 'consult.01.02.fadl'),
    (e) => e.refusal === 'action-not-available-to-this-role');
});

test('★ THE GUARANTEE SURVIVES ROLE FILTERING — canon says the clue cannot disappear', () => {
  // ============================================================================
  // "A required mystery clue may be encountered through different roles, but IT
  // CANNOT DISAPPEAR BECAUSE OF ROLE SELECTION."
  // ============================================================================
  // EVS-3's check was that every role had a route SENTENCE. That was true of
  // prose and said nothing about play. The moment an action carries
  // `visible_to_roles`, a reveal can become genuinely unreachable for one role —
  // and it looks correct in review, because the other role reaches it.
  assert.deepEqual(unreachableRevealsByRole(CHAPTER_1.scenes), []);
  assert.ok(assertRevealsReachableByEveryRole(CHAPTER_1.scenes));

  // ...and the check FIRES. Hide Rami from the quality role and scene 2's
  // guaranteed clue vanishes for them.
  const broken = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-02') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.actions.find((a) => a.id === 'consult.01.02.rami').visible_to_roles = [LEAD];
    return copy;
  });
  const failures = unreachableRevealsByRole(broken);
  assert.ok(failures.length > 0);
  assert.match(failures[0].detail, /sc-01-02.*quality-patient-safety/);
  assert.throws(() => assertRevealsReachableByEveryRole(broken),
    (e) => e instanceof EvidenceRefusal);
});

test('the reachability walk FOLLOWS chains rather than checking one step', () => {
  // The sealed arch is gated behind Rami's board. A check that looked at
  // `reveals` alone would call the emblem reachable for a role that cannot
  // reach the board — which is the failure this closure exists to prevent.
  const scene = sceneOf('sc-01-02');
  assert.ok(reachableEvidenceFor(scene, LEAD).has('ev.01.02.emblem-match'));

  const cut = JSON.parse(JSON.stringify(scene));
  cut.actions.find((a) => a.id === 'consult.01.02.rami').visible_to_roles = [QUALITY];
  assert.ok(!reachableEvidenceFor(cut, LEAD).has('ev.01.02.emblem-match'),
    'the gated action must not be counted reachable when its requirement is not');
});

// --- FPE-05: the decision shows what the participant could know -----------------

test('★ a risk that had to be found out is WITHHELD until it is', () => {
  const b = bundle();
  let run = startRun({ bundle: b, config: { role: LEAD } });
  while (currentSceneId(run) !== 'sc-01-03') {
    run = run.phase === 'interactive'
      ? commit(run, b, view(run, b).presented.options[0].id).run
      : advance(run, b);
  }
  run = advance(run, b);

  const before = view(run, b).presented.options;
  const redeploy = before.find((o) => o.id === 'dec-01-critical-path.redeploy');
  assert.equal(redeploy.risks, null, 'the donor cost was given away before it was found');
  assert.deepEqual(redeploy.riskRequires, ['ev.01.03.donor-cost']);

  const after = view(act(run, b, 'consult.01.03.critical-care-lead').run, b).presented.options;
  const known = after.find((o) => o.id === 'dec-01-critical-path.redeploy');
  assert.ok(known.risks, 'consulting the lead must make the cost knowable');
  assert.deepEqual(known.riskRequires, []);
});

test('★ a participant who investigates NOTHING still faces a real trade-off', () => {
  // ⚠️ FPE-03 FROM THE OTHER SIDE. If every risk were gated, a participant who
  // inspected nothing would meet three options with no costs at all — which
  // reads as three ways of being right. At least one risk stays ungated in
  // every decision, and `protects` is never withheld.
  for (const decision of CHAPTER_1.decisions) {
    const presented = presentOptions(decision, { role: LEAD, held: new Set() });
    const withRisk = presented.options.filter((o) => o.risks);
    assert.ok(withRisk.length > 0,
      `${decision.id} shows no risk at all to a participant who found nothing out`);
    for (const o of presented.options) {
      assert.ok(o.protects, `${o.id} withheld what it protects — an unweighable option`);
    }
  }
});

test('the decision is still TAKEABLE with nothing discovered', () => {
  const { b, run } = atDecision(LEAD);
  const step = commit(run, b, view(run, b).presented.options[0].id);
  assert.equal(step.run.phase, 'post_commit');
  assert.deepEqual(step.run.history.at(-1).evidenceHeld, [],
    'and the record says plainly that nothing was known');
});

test('★ the record says what was KNOWN when the commitment was made', () => {
  const { b, run } = atDecision(LEAD);
  const informed = act(act(run, b, 'inspect.01.01.handover-board').run, b, 'consult.01.01.nour').run;
  const step = commit(informed, b, view(informed, b).presented.options[0].id);
  assert.equal(step.run.history.at(-1).evidenceHeld.length, 4);
  assert.ok(step.run.history.at(-1).evidenceHeld.includes('ev.01.01.thirty-eight-of-fifty'));
});

// --- the people --------------------------------------------------------------

test('★ three characters hold distinct positions, and each has a LIMIT', () => {
  // Canon's fail-forward: "the professional owner states the binding limit and
  // acts within existing authority." A consult with no limit is a vending
  // machine with a face on it.
  const withLimits = CHAPTER_1.scenes
    .flatMap((s) => s.actions)
    .filter((a) => a.response?.withholds);

  const named = new Set(withLimits.map((a) => a.response.character_id));
  assert.ok(named.size >= 3, `only ${named.size} characters refuse anything`);
  assert.ok(named.has('Rami') && named.has('Fadl') && named.has('Maha'));

  // ...and the limits are different limits, not one sentence repeated.
  const limits = new Set(withLimits.map((a) => a.response.withholds));
  assert.equal(limits.size, withLimits.length, 'a limit was reused, so it is not a position');
});

test('★ Fadl keeps his quality function and does NOT become a narrator', () => {
  // The prompt guards this explicitly, and canon states both halves: he
  // classifies the patient-safety event AND does not take clinical or
  // electrical authority.
  const fadl = sceneOf('sc-01-02').actions.find((a) => a.response?.character_id === 'Fadl');
  assert.match(fadl.response.does, /classifies|quality follow-up/i);
  assert.match(fadl.response.withholds, /clinical or electrical authority/i);
  assert.match(fadl.response.withholds, /second command structure/i);

  // He explains nothing about the electrical event — that is Rami's material
  // and Qays's, and a quality lead who narrates the outage is a narrator.
  assert.ok(!/generator|circuit|transfer board|bus/i.test(fadl.response.does));
  assert.deepEqual(fadl.reveals, ['ev.01.02.near-miss-entry']);
});

test('★ one character ACTS INDEPENDENTLY — canon has Rami isolate under existing authority', () => {
  const rami = sceneOf('sc-01-02').actions.find((a) => a.response?.character_id === 'Rami');
  assert.equal(rami.response.acts_independently, true);
  assert.match(rami.response.does, /under existing authority/i);
  assert.match(rami.response.withholds, /will not energize/i);

  const independent = CHAPTER_1.scenes.flatMap((s) => s.actions)
    .filter((a) => a.response?.acts_independently);
  assert.equal(independent.length, 1, 'canon assigns this to Rami and to nobody else');
});

test('★ Nour QUALIFIES — and the correction fires on the ACT, not on arriving', () => {
  // Canon's state-effects row: "Treats all 50 physical places as capacity | the
  // nursing leader corrects the interpretation." A correction printed on scene
  // load is exposition; a correction that answers an act is a person.
  const { b, run } = atDecision(LEAD);
  assert.equal(view(run, b).lastResponse, null, 'nobody has said anything yet');

  const after = act(run, b, 'consult.01.01.nour').run;
  const response = view(after, b).lastResponse;
  assert.equal(response.character_id, 'Nour');
  assert.match(response.does, /corrects the reading/i);
});

test('no dialogue was written where canon writes none', () => {
  // Canon authors the ACT — "Fadl classifies the patient-safety event", "the
  // nursing leader corrects the interpretation" — and not the line. Turning
  // those into speech would be writing the script.
  for (const scene of CHAPTER_1.scenes) {
    for (const a of scene.actions) {
      if (!a.response) continue;
      assert.ok(!('says' in a.response), `${a.id} put words in ${a.response.character_id}'s mouth`);
      assert.ok(a.response.dialogue_unresolved,
        `${a.id} does not record that the line is still owed`);
    }
  }
});

// --- costs are notes, never quantities ------------------------------------------

test('★ a cost is a declared note in canon\'s own currency, and nothing sums it', () => {
  const b = bundle();
  const { run } = atDecision(LEAD);
  const after = act(run, b, 'consult.01.01.ayyash').run;

  assert.equal(after.costsIncurred.length, 1);
  const cost = after.costsIncurred[0];
  assert.equal(cost.currency, 'time');
  assert.ok(cost.what.length > 20);
  assert.ok(!('amount' in cost), 'a quantity would be a score with the word removed');

  // Nothing anywhere adds them up.
  const all = CHAPTER_1.scenes.flatMap((s) => s.actions).filter((a) => a.cost);
  assert.ok(all.length >= 3);
  for (const a of all) assert.deepEqual(Object.keys(a.cost).sort(), ['currency', 'what']);
});

// --- resume ---------------------------------------------------------------------

test('★ a run saved MID-INVESTIGATION resumes with exactly what it had found', () => {
  const b = bundle();
  const { run } = atDecision(QUALITY);
  const found = act(act(run, b, 'inspect.01.01.sorting-court').run, b, 'consult.01.01.ayyash').run;

  const resumed = deserialise(serialise(found), b);
  assert.deepEqual([...heldEvidence(resumed)], [...heldEvidence(found)]);
  assert.deepEqual(resumed.actionsTaken, found.actionsTaken);
  assert.deepEqual(resumed.costsIncurred, found.costsIncurred);
  assert.equal(resumed.phase, 'interactive');

  // ...and the taken actions are still not offered again.
  assert.deepEqual(view(resumed, b).actions.map((a) => a.id), view(found, b).actions.map((a) => a.id));
});

test('evidence carries ACROSS scenes — a chapter is one investigation', () => {
  const b = bundle();
  let run = advance(startRun({ bundle: b, config: { role: LEAD } }), b);
  run = act(run, b, 'consult.01.01.ayyash').run;
  const carried = [...heldEvidence(run)];
  run = advance(advance(commit(run, b, view(run, b).presented.options[0].id).run, b), b);

  assert.equal(currentSceneId(run), 'sc-01-02');
  for (const id of carried) assert.ok(heldEvidence(run).has(id), `${id} was forgotten at the scene boundary`);
  // ...while the scene's own view shows only what was found HERE.
  assert.deepEqual(view(advance(run, b), b).discoveries, []);
});

test('★ a bundle that breaks the guarantee DOES NOT LOAD', () => {
  // Stronger than a test asserting the content is fine: the promise is enforced
  // where the bundle is built, so no assembly of Chapter 1 can serve a scene
  // whose guaranteed clue one selectable role cannot reach.
  const scenes = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-02') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.actions.find((a) => a.id === 'consult.01.02.rami').visible_to_roles = [LEAD];
    return copy;
  });
  assert.throws(() => bundleFrom({ ...CHAPTER_1, scenes }),
    (e) => e.refusal === 'required-reveal-unreachable-for-role');
});

test('★ an action pointing at evidence that does not exist fails AT LOAD', () => {
  // Same rule as a scene pointing at an absent decision: the field is named,
  // and a participant is never the one who finds a dangling reference.
  const scenes = CHAPTER_1.scenes.map((s) => {
    if (s.id !== 'sc-01-01') return s;
    const copy = JSON.parse(JSON.stringify(s));
    copy.actions[0].reveals = ['ev.01.01.does-not-exist'];
    return copy;
  });
  assert.throws(() => bundleFrom({ ...CHAPTER_1, scenes }),
    (e) => e.refusal === 'action-reveals-unknown-evidence');
});

test('★ a resumed run holding evidence the bundle does not know is refused', () => {
  // ⚠️ Held evidence feeds the risk gate, so a save carrying an id the pinned
  // bundle no longer knows would silently unlock — or silently withhold — a
  // trade-off the participant never earned. The version pin makes this rare and
  // not impossible: a save can be hand-edited, and a bundle rebuilt from loose
  // documents need not match the one it was played on.
  const b = bundle();
  const { run } = atDecision(LEAD);
  const found = act(run, b, 'consult.01.01.nour').run;

  assert.ok(deserialise(serialise(found), b), 'the honest save still resumes');

  const tampered = JSON.stringify({
    ...found,
    discovered: [...found.discovered, { ...found.discovered[0], evidenceId: 'ev.01.01.invented' }],
  });
  assert.throws(() => deserialise(tampered, b),
    (e) => e.refusal === 'resumed-run-holds-unknown-evidence');
});
