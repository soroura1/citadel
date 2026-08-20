/**
 * EVS-6 — can the participant reconstruct what happened, and carry a bounded
 * private insight into their own hospital?
 *
 * ============================================================================
 * ★ THE FAILURE THIS CLOSES WAS NAMED IN THE CONTRACT'S OWN TABLE
 * ============================================================================
 * FPE-04: *"the specific option chosen is permanently readable in the record"*,
 * and its failure column reads *"a chapter end that lists only scene titles."*
 * That is what `ChapterEnd` did, verbatim. It was flagged at EVS-2 as owed to
 * this session.
 *
 * ⚠️ AND THE RECORD IS THE SECOND COPY, BY DESIGN. The run holds what happened;
 * the record is a view of it for a person. The price of a second copy is
 * proving it agrees with the first, which `recordRefusals` exists to do — a
 * record that says one thing while the state says another is worse than no
 * record, because the participant debriefs from one and the next chapter runs
 * from the other.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { bundleFrom, startRun, view, act, commit, advance } from '../src/engine/run.js';
import { buildRecord, recordRefusals, assertRecordAgrees, RecordRefusal } from '../src/engine/record.js';
import {
  buildObservation, observationRefusals, assertObservationIsBounded,
  EXPORT_LABEL, VISIBILITY, SECTIONS, PROMPT_KEYS, ObservationRefusal, newParticipantRef,
} from '../src/engine/observation.js';
import {
  buildReflection, reflectionRefusals, reflectionPrompts, ReflectionRefusal,
} from '../src/engine/reflection.js';
import { observationAsText, observationAsJson } from '../src/engine/export.js';
import * as store from '../src/engine/local-store.js';
import { RecordView } from '../src/features/record/RecordView.jsx';
import { ObservationScreen } from '../src/features/record/ObservationScreen.jsx';
import { t } from '../src/locales/index.js';

const bundle = () => bundleFrom(CHAPTER_1);
const LEAD = 'role.resilience-lead';

/** Play the whole chapter, taking every action. */
function playAll(b, { pick } = {}) {
  let run = startRun({ bundle: b, config: { role: LEAD } });
  let guard = 0;
  while (!run.complete && guard++ < 200) {
    if (run.phase === 'interactive') {
      let g = 0;
      while (view(run, b).actions.length > 0 && g++ < 20) run = act(run, b, view(run, b).actions[0].id).run;
      const options = view(run, b).presented.options;
      run = commit(run, b, (pick && options.find((o) => o.id === pick))?.id ?? options[0].id).run;
    } else run = advance(run, b);
  }
  return run;
}

const ANSWERS = {
  service: 'The intensive care unit.',
  undocumentedDependency: 'One porter knows which lift takes a bed with a ventilator on it.',
  notSureAbout: 'Whether anyone else on the night shift knows that route.',
  questionToAsk: 'I would ask the portering supervisor how it is covered on a Sunday night.',
};

// --- FPE-04: the record says what you did --------------------------------------

test('★ FPE-04 — the record names the SPECIFIC OPTION, not the scene it was in', () => {
  const b = bundle();
  const record = buildRecord(playAll(b), b);
  assert.equal(record.scenes.length, 4);
  for (const scene of record.scenes) {
    assert.ok(scene.option?.id, `${scene.sceneId} records no option`);
    assert.ok(scene.option.labelKey, 'the option is identified but not named');
    assert.ok(['decision', 'support'].includes(scene.committedAs));
  }
});

test('★ the record carries WHAT WAS KNOWN at the commitment, with provenance', () => {
  const b = bundle();
  const record = buildRecord(playAll(b), b);
  const last = record.scenes.at(-1);
  assert.ok(last.evidenceConsulted.length > 0);
  for (const e of last.evidenceConsulted) {
    assert.ok(e.source?.id, 'a fact from nowhere');
    assert.ok(e.via, 'a fact with no act behind it');
  }
});

test('★ THE RECORD AND THE WORLD AGREE — the price of a second copy', () => {
  const b = bundle();
  const run = playAll(b);
  const record = buildRecord(run, b);
  assert.deepEqual(recordRefusals(record, run, b), []);
  assert.ok(assertRecordAgrees(record, run, b));
});

test('★ and the agreement check FIRES when they disagree', () => {
  const b = bundle();
  const run = playAll(b, { pick: 'dec-01-critical-path.ed-hold' });
  const record = buildRecord(run, b);

  // Tamper with one entry: the record now claims a pathway the world did not take.
  const tampered = {
    ...record,
    scenes: record.scenes.map((s) => (s.sceneId !== 'sc-01-03' ? s
      : { ...s, option: { ...s.option, id: 'dec-01-critical-path.network-transfer' } })),
  };
  const failures = recordRefusals(tampered, run, b);
  assert.ok(failures.some((f) => f.refusal === 'record-disagrees-with-world-state'), JSON.stringify(failures));
  assert.throws(() => assertRecordAgrees(tampered, run, b), (e) => e instanceof RecordRefusal);
});

test('★ a history entry with NO CHANGES is refused, not defaulted to "nothing happened"', () => {
  // ⚠️ Runs saved before bundle v0.5 carry no `changes`. `?? []` would render
  // "nothing changed" for a commitment that changed something — FPE-04 broken
  // quietly, which is worse than broken loudly.
  const b = bundle();
  const run = playAll(b);
  const old = { ...run, history: run.history.map(({ changes, ...rest }) => rest) };
  assert.throws(() => buildRecord(old, b), (e) => e.refusal === 'history-entry-has-no-changes');
});

test('the record renders the option, the act and the provenance', () => {
  const b = bundle();
  const record = buildRecord(playAll(b), b);
  const html = renderToStaticMarkup(createElement(RecordView, { record }));

  assert.ok(html.includes(t('record.title')));
  assert.ok(html.includes(t(record.scenes[0].option.labelKey)), 'the chosen option is not on the page');
  assert.ok(html.includes(t('record.you_supported')) || html.includes(t('record.you_decided')));
  assert.ok(html.includes(t('record.what_you_knew')));
  // ⚠️ B3-adjacent: nothing on this page congratulates or totals.
  assert.ok(!/\b\d+%|complete!|well done/i.test(html));
});

// --- the observation, and its six boundaries -----------------------------------

test('★ the four prompts are canon\'s own, transcribed from the definition of done', () => {
  for (const section of SECTIONS) {
    const prompt = t(PROMPT_KEYS[section]);
    assert.ok(prompt.length > 40, `${section}'s prompt is too short to be the authored one`);
    assert.ok(!prompt.startsWith('⟨'), `${section} has no string`);
  }
  // Row two is the product delivered once, and it asks about THEIR hospital.
  assert.match(t(PROMPT_KEYS.undocumentedDependency), /your service running that is not written down/i);
  assert.match(t(PROMPT_KEYS.service), /your hospital/i);
});

test('★ B1 — the observation is participant-private, and keyed to a person not a facility', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  assert.equal(o.visibility, VISIBILITY);
  assert.equal(o.visibility, 'participant-private');
  assert.equal(o.participantRef, 'p-1');
  assert.ok(!JSON.stringify(o).includes('facility'), 'a facility reference reached the record');
});

test('★ participantRef is an OPAQUE ID, never the display name', () => {
  // A name identifies a person, and this record is about their hospital. Keyed
  // by a name it becomes a document about a named professional's workplace.
  const ref = newParticipantRef();
  assert.ok(ref.length > 8);
  assert.ok(!/sorour/i.test(ref));

  const b = bundle();
  const run = startRun({ bundle: b, config: { role: LEAD, displayName: 'Sorour', stake: 'a stake' } });
  const o = buildObservation({ participantRef: ref, answers: ANSWERS, run });
  assert.ok(!JSON.stringify(o).includes('Sorour'), 'the display name reached the observation');
  assert.ok(!JSON.stringify(o).includes('a stake'), 'the private stake reached the observation');
});

test('★ B2 and B3 — no review, approval, completeness, credit, recognition or flag', () => {
  // Enforced by ABSENCE plus additionalProperties:false in the schema, so such
  // a record is unrepresentable. This catches one assembled without it.
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  for (const forbidden of ['reviewState', 'approvedBy', 'completeness', 'evidenceStatus',
                           'capabilityCredit', 'recognition', 'flag', 'score']) {
    assert.ok(!(forbidden in o), `${forbidden} is on the record`);
    const mutated = { ...o, [forbidden]: 'anything' };
    assert.ok(observationRefusals(mutated)
      .some((r) => r.refusal === 'observation-carries-a-status-it-may-not-have'),
      `${forbidden} was accepted`);
  }
});

test('★ B4 — uncertainty and a follow-up question are REQUIRED, and refusing is what makes it real', () => {
  // Without them it asserts an assessed dependency, which is the artifact canon
  // prohibits with a new noun on it.
  for (const missing of ['notSureAbout', 'questionToAsk']) {
    const answers = { ...ANSWERS, [missing]: '   ' };
    assert.throws(() => buildObservation({ participantRef: 'p-1', answers }),
      (e) => e instanceof ObservationRefusal && e.refusal === 'observation-section-is-empty');
  }
  assert.ok(buildObservation({ participantRef: 'p-1', answers: ANSWERS }));
});

test('★ B5 — the label is verbatim and cannot be softened', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  assert.equal(o.exportLabel, 'unverified personal preparedness observation — not an assessment');
  const softened = { ...o, exportLabel: 'personal preparedness observation' };
  assert.ok(observationRefusals(softened).some((r) => r.refusal === 'observation-label-was-altered'));
  assert.throws(() => assertObservationIsBounded(softened), (e) => e instanceof ObservationRefusal);
});

test('★ B6 — promotion is null, and claiming one before Q19 is refused', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  assert.equal(o.promotion, null);
  const promoted = { ...o, promotion: { confirmedByParticipant: true, correctedAt: 'x', promotedTo: 'y' } };
  assert.ok(observationRefusals(promoted).some((r) => r.refusal === 'observation-claims-promotion-before-Q19'));
});

// --- reflection: open, unscored, theirs ----------------------------------------

test('★ reflection is OPEN TEXT — three prompts, no options anywhere', () => {
  const b = bundle();
  const prompts = reflectionPrompts(buildRecord(playAll(b), b));
  assert.equal(prompts.length, 3);
  for (const p of prompts) {
    assert.ok(!('options' in p), 'a reflection prompt offered a choice');
    assert.ok(t(p.key).length > 20, `${p.key} has no authored question`);
  }
  // One is derived and names the participant's own last commitment; two are
  // written, and say so.
  assert.equal(prompts.filter((p) => p.derived).length, 1);
  for (const p of prompts.filter((p) => !p.derived)) {
    assert.ok(p.wording_unresolved, `${p.key} does not record that its wording is owed`);
    assert.match(p.derivedFrom, /definition-of-done/);
  }
});

test('⛔ nothing enumerates what the participant did NOT find out', () => {
  // The undiscovered evidence is knowable and it would be easy to list. A list
  // of your gaps at the end of a chapter is a mark, whatever sentence surrounds
  // it. DEC-005.
  const b = bundle();
  const prompts = reflectionPrompts(buildRecord(playAll(b), b));
  const text = prompts.map((p) => t(p.key)).join(' ');
  assert.ok(!/missed|failed|did not find|you should have/i.test(text));
});

test('★ a reflection is never scored — and the shape has no room for it', () => {
  const r = buildReflection({ participantRef: 'p-1', answers: { 'reflection.principle.prompt': 'A principle.' } });
  assert.equal(r.quality, null);
  assert.ok(!('score' in r));
  assert.ok(reflectionRefusals({ ...r, score: 4 }).some((x) => x.refusal === 'reflection-was-scored'));
  assert.ok(reflectionRefusals({ ...r, quality: { rubricVersion: '1', assessedBy: 'x' } })
    .some((x) => x.refusal === 'reflection-claims-quality-before-Q20'));
});

test('★ the record stores promptKey and THEIR words — never ours beside theirs', () => {
  // "A reflection assembled from our sentences reflects us."
  const r = buildReflection({ participantRef: 'p-1', answers: { 'reflection.principle.prompt': 'Mine.' } });
  assert.deepEqual(Object.keys(r.responses[0]).sort(), ['promptKey', 'text']);
  assert.ok(reflectionRefusals({ ...r, responses: [{ ...r.responses[0], prompt: 'ours' }] })
    .some((x) => x.refusal === 'reflection-carries-our-words'));
});

test('an empty reflection is refused rather than stored as evidence one happened', () => {
  assert.throws(() => buildReflection({ participantRef: 'p-1', answers: { a: '  ' } }),
    (e) => e instanceof ReflectionRefusal && e.refusal === 'reflection-is-empty');
});

// --- export: it must work with no platform later --------------------------------

test('★ both exports carry B5 AND the scope boundary, verbatim', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  const text = observationAsText(o, t);
  const json = observationAsJson(o);

  assert.ok(text.includes(EXPORT_LABEL.toUpperCase()));
  assert.ok(text.includes(t('boundary.statement')));
  assert.ok(JSON.parse(json).exportLabel === EXPORT_LABEL);

  // Every answer, and every prompt, so it is readable by someone who was not there.
  for (const section of SECTIONS) {
    assert.ok(text.includes(ANSWERS[section]), `${section}'s answer is missing from the text export`);
    assert.ok(text.includes(t(PROMPT_KEYS[section])), `${section}'s question is missing`);
  }
});

test('★ an export needs nothing but itself — no id, no url, no endpoint', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  const text = observationAsText(o, t);
  assert.ok(!/https?:\/\//.test(text), 'the export points somewhere');
  assert.ok(!/sign in|log in|open in citadel/i.test(text), 'the export needs the platform to be read');
});

test('a mutated observation cannot be exported at all', () => {
  const o = buildObservation({ participantRef: 'p-1', answers: ANSWERS });
  const bad = { ...o, visibility: 'facility' };
  assert.throws(() => observationAsText(bad, t), (e) => e.refusal === 'observation-is-not-private');
  assert.throws(() => observationAsJson(bad), (e) => e.refusal === 'observation-is-not-private');
});

// --- save, resume, delete --------------------------------------------------------

test('★ save, reload and resume land on the exact beat', () => {
  const b = bundle();
  const s = store.memoryStore();
  let run = startRun({ bundle: b, config: { role: LEAD, stake: 'why I am here' } });
  run = advance(run, b);
  run = act(run, b, view(run, b).actions[0].id).run;
  run = commit(run, b, view(run, b).presented.options[0].id).run;

  store.saveRun(s, run);
  const resumed = store.loadRun(s, b);
  assert.equal(resumed.phase, 'post_commit');
  assert.equal(resumed.stake, 'why I am here');
  assert.deepEqual(resumed.discovered, run.discovered);
  assert.deepEqual(resumed.history, run.history);
});

test('a store with no run returns null rather than inventing one', () => {
  assert.equal(store.loadRun(store.memoryStore(), bundle()), null);
});

test('★ DELETE REMOVES EVERYTHING, INCLUDING THE IDENTIFIER', () => {
  // ⚠️ A delete control that leaves the id behind has not deleted anything that
  // matters: the observation is keyed by it, and leaving it leaves the thread
  // tying a future record to the same person.
  const b = bundle();
  const s = store.memoryStore();
  store.saveRun(s, playAll(b));
  store.saveObservation(s, buildObservation({ participantRef: store.participantRef(s, newParticipantRef), answers: ANSWERS }));
  store.saveReflection(s, buildReflection({ participantRef: 'p-1', answers: { 'reflection.principle.prompt': 'x' } }));

  assert.equal(s.keys().length, 4, 'the run, the observation, the reflection and the id');
  const removed = store.deleteEverything(s);
  assert.equal(removed.length, 4);
  // ★ ENUMERATED, not assumed. A deletion test that cannot list what remains is
  // asserting that the delete call did not throw.
  assert.deepEqual(s.keys(), []);
});

test('the delete list is DERIVED from the keys, so a key added later cannot be forgotten', () => {
  const s = store.memoryStore();
  for (const key of Object.values(store.KEYS)) s.setItem(key, 'x');
  store.deleteEverything(s);
  assert.deepEqual(s.keys(), []);
});

// --- the surface -----------------------------------------------------------------

test('★ the observation screen is ALL OPEN TEXT, and nothing on it congratulates', () => {
  const b = bundle();
  const html = renderToStaticMarkup(createElement(ObservationScreen, {
    record: buildRecord(playAll(b), b),
  }));

  // Seven fields: three reflection prompts and four observation sections.
  assert.equal((html.match(/<textarea/g) ?? []).length, 7);
  assert.ok(!html.includes('<select'), 'a dropdown appeared on a page that must not offer options');
  assert.ok(!/type="radio"|type="checkbox"/.test(html), 'an answer key appeared');

  // ★ B5 on the page, not only on the export.
  assert.ok(html.includes(EXPORT_LABEL));
  assert.ok(html.includes(t('boundary.statement')));
  // ★ B3 — nothing congratulates.
  assert.ok(!/well done|complete!|congratulat|✓|★/i.test(html));
  // ...and the delete control is on the page, not buried in a settings screen.
  assert.ok(html.includes(t('observation.delete')));
});

test('the export controls refuse until all four answers exist', () => {
  const b = bundle();
  const html = renderToStaticMarkup(createElement(ObservationScreen, {
    record: buildRecord(playAll(b), b),
  }));
  assert.ok(html.includes('disabled'), 'an empty observation could be exported');
  assert.ok(html.includes(t('observation.export_needs_all_four')));
});

test('no locale key reaches the record or the observation screen', () => {
  const b = bundle();
  const record = buildRecord(playAll(b), b);
  for (const html of [
    renderToStaticMarkup(createElement(RecordView, { record })),
    renderToStaticMarkup(createElement(ObservationScreen, { record })),
  ]) assert.ok(!html.includes('⟨'));
});
