/**
 * ★ NOTHING LEAVES THE CLIENT. (EVS-6)
 *
 * ============================================================================
 * THIS IS THE PROMISE THE WHOLE GATE RESTS ON, SO IT IS OVER-PROVED.
 * ============================================================================
 * The EVS gate's privacy condition: *"the real-hospital observation is
 * participant-controlled paper or local-only data for this gate. It is not
 * written to a production service, shown to an employer/facility surface, or
 * retained by the project."*
 *
 * A hospital professional is being asked to write down something true about
 * their own workplace that is not written down anywhere else. If that reached a
 * server, the product would have taken the one thing it promised not to — and
 * "we did not mean to" is not a control.
 *
 * ⚠️ FOUR EXITS, NOT ONE. A test that spies only on `fetch` proves nothing about
 * `sendBeacon`, which exists precisely to send data on the way out of a page
 * and is the API someone reaches for when adding analytics. All four are
 * replaced with throwing spies for the whole flow.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import { bundleFrom, startRun, view, act, commit, advance } from '../src/engine/run.js';
import { buildRecord } from '../src/engine/record.js';
import { buildObservation, newParticipantRef } from '../src/engine/observation.js';
import { buildReflection } from '../src/engine/reflection.js';
import { observationAsText, observationAsJson } from '../src/engine/export.js';
import * as store from '../src/engine/local-store.js';
import { t } from '../src/locales/index.js';

const ANSWERS = {
  service: 'The intensive care unit.',
  undocumentedDependency: 'One porter knows which lift takes a bed with a ventilator on it.',
  notSureAbout: 'Whether anyone else on the night shift knows that route.',
  questionToAsk: 'The portering supervisor, about Sunday nights.',
};

/**
 * Replace every way out of a page with something that records the attempt and
 * then throws. Throwing matters: a spy that returns quietly lets the code carry
 * on and the test discover the call only at the end, by which point the stack
 * that made it is gone.
 */
function sealTheExits() {
  const attempts = [];
  const saved = {
    fetch: globalThis.fetch,
    XMLHttpRequest: globalThis.XMLHttpRequest,
    WebSocket: globalThis.WebSocket,
    navigator: globalThis.navigator,
  };
  const trap = (name) => (...args) => {
    attempts.push({ name, args: args.map(String) });
    throw new Error(`${name} was called — nothing in this flow may leave the client`);
  };

  globalThis.fetch = trap('fetch');
  globalThis.XMLHttpRequest = function () { trap('XMLHttpRequest')(); };
  globalThis.WebSocket = function () { trap('WebSocket')(); };
  // `navigator` is a getter on some runtimes, so define rather than assign.
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { sendBeacon: trap('sendBeacon') },
  });

  return {
    attempts,
    restore() {
      globalThis.fetch = saved.fetch;
      globalThis.XMLHttpRequest = saved.XMLHttpRequest;
      globalThis.WebSocket = saved.WebSocket;
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: saved.navigator });
    },
  };
}

test('★ THE WHOLE FLOW RUNS WITH EVERY EXIT SEALED — play, reflect, observe, export, delete', () => {
  const sealed = sealTheExits();
  try {
    const b = bundleFrom(CHAPTER_1);
    const s = store.memoryStore();

    // Play the chapter, taking every action.
    let run = startRun({ bundle: b, config: { role: 'role.resilience-lead', stake: 'a night with no lights' } });
    let guard = 0;
    while (!run.complete && guard++ < 200) {
      if (run.phase === 'interactive') {
        let g = 0;
        while (view(run, b).actions.length > 0 && g++ < 20) run = act(run, b, view(run, b).actions[0].id).run;
        run = commit(run, b, view(run, b).presented.options[0].id).run;
      } else run = advance(run, b);
      store.saveRun(s, run);
    }

    // Reconstruct, reflect, observe, export, resume, delete.
    const record = buildRecord(run, b);
    assert.equal(record.scenes.length, 4);

    const ref = store.participantRef(s, newParticipantRef);
    store.saveReflection(s, buildReflection({
      participantRef: ref,
      answers: { 'reflection.principle.prompt': 'Capacity is not the same as capability.' },
    }));
    const observation = buildObservation({ participantRef: ref, answers: ANSWERS, run });
    store.saveObservation(s, observation);

    assert.ok(observationAsText(observation, t).includes(ANSWERS.undocumentedDependency));
    assert.ok(observationAsJson(observation).includes(ANSWERS.questionToAsk));
    assert.ok(store.loadRun(s, b));
    assert.deepEqual(store.deleteEverything(s).length, 4);
  } finally {
    sealed.restore();
  }

  assert.deepEqual(sealed.attempts, [],
    'something in the observation flow tried to leave the client');
});

test('★ the exits really were sealed — or the test above proves nothing', () => {
  // A sealed-exit test that would pass with the seal removed is a test of
  // nothing. This proves the trap fires.
  const sealed = sealTheExits();
  try {
    assert.throws(() => globalThis.fetch('https://example.invalid'), /fetch was called/);
    assert.throws(() => new globalThis.XMLHttpRequest(), /XMLHttpRequest was called/);
    assert.throws(() => new globalThis.WebSocket('wss://example.invalid'), /WebSocket was called/);
    assert.throws(() => globalThis.navigator.sendBeacon('/x', '{}'), /sendBeacon was called/);
  } finally {
    sealed.restore();
  }
  assert.equal(sealed.attempts.length, 4);
});

test('★ the private modules import NO gateway, and name no URL', () => {
  // Belt and braces on the runtime proof: a module that holds an endpoint is
  // one refactor from using it, and the refactor would look like a tidy-up.
  // ⚠️ COMMENTS STRIPPED FIRST. These modules NAME the four exits in their
  // documentation, because saying which ones are sealed is the point of the
  // comment — and a check that cannot tell a comment from a call would force
  // the explanation out of the file to make itself pass. `styles.test.js`
  // strips for the same reason.
  const here = (f) => readFileSync(new URL(`../src/engine/${f}`, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  for (const file of ['observation.js', 'reflection.js', 'local-store.js', 'export.js', 'record.js']) {
    const src = here(file);
    assert.ok(!/gateway|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(src),
      `${file} reaches for a network API`);
    assert.ok(!/https?:\/\/(?!json-schema|citadel\.contracts)/.test(src), `${file} names a URL`);
    assert.ok(!/VITE_API|import\.meta\.env/.test(src), `${file} reads an API base`);
  }
});

test('★ the observation never carries the participant\'s NAME or STAKE', () => {
  // Both are collected at setup and both identify. The observation is about a
  // hospital; keyed or annotated with a person it becomes a document about a
  // named professional's workplace, which is B1 breached from a direction that
  // is not facility visibility.
  const b = bundleFrom(CHAPTER_1);
  const run = startRun({
    bundle: b,
    config: { role: 'role.quality-patient-safety', displayName: 'Sorour', stake: 'my own hospital lost power' },
  });
  const o = buildObservation({ participantRef: newParticipantRef(), answers: ANSWERS, run });
  const serialised = JSON.stringify(o);
  assert.ok(!serialised.includes('Sorour'));
  assert.ok(!serialised.includes('my own hospital lost power'));
  assert.ok(!serialised.includes('role.quality-patient-safety'),
    'the role is a professional identity and does not belong on a private note');
});

test('the reflection carries no identity either, beyond the local opaque id', () => {
  const r = buildReflection({
    participantRef: 'p-opaque',
    answers: { 'reflection.principle.prompt': 'Something I would tell a colleague.' },
  });
  assert.deepEqual(Object.keys(r).sort(), ['participantRef', 'quality', 'responses']);
  assert.equal(r.participantRef, 'p-opaque');
});
