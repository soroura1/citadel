/**
 * ★ THE EVS WALK — the whole slice, both roles, both paths. (EVS-7)
 *
 * ============================================================================
 * IS THE INTEGRATED SLICE READY FOR AN UNASSISTED HOSPITAL PROFESSIONAL?
 * ============================================================================
 * Every session before this one proved its own layer. This one runs the arc a
 * participant runs — setup, four scenes with every action taken, the response
 * beat, the residue, the record, the reflection, the private observation, the
 * export, a reload in the middle, and the delete — and asserts on the MARKUP
 * the browser would produce, through the production routes.
 *
 * ⚠️ IT WALKS THE ROUTES, NOT THE COMPONENTS. `main.jsx` cannot be executed by
 * a test, and this build has paid six times for wiring that lived there alone.
 * Every surface now has a route; this file is what makes that pay.
 *
 * ★ AND IT IS PARAMETERISED BY ROLE AND BY PATH, so nothing here can be true of
 * one configuration and asserted of all four.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHAPTER_1 } from '../src/content/chapter-1.js';
import {
  bundleFrom, startRun, view, act, commit, advance, currentSceneId, heldEvidence,
} from '../src/engine/run.js';
import { PHASES } from '../src/engine/staging.js';
import { buildRecord } from '../src/engine/record.js';
import { buildObservation, newParticipantRef, SECTIONS } from '../src/engine/observation.js';
import { buildReflection } from '../src/engine/reflection.js';
import * as store from '../src/engine/local-store.js';
import { PlayRoute } from '../src/features/play/PlayRoute.jsx';
import { PlaceRoute } from '../src/features/place/PlaceRoute.jsx';
import { ObservationRoute } from '../src/features/record/ObservationRoute.jsx';
import { SetupRoute } from '../src/features/setup/SetupRoute.jsx';
import { t, setLocale, getLocale, directionFor } from '../src/locales/index.js';
import ATTESTATION from '../src/content/attestation.json' with { type: 'json' };

const ROLES = ['role.resilience-lead', 'role.quality-patient-safety'];
const PATHS = [false, true];                       // visual, text
const bundle = () => bundleFrom(CHAPTER_1);
const sceneOf = (id) => CHAPTER_1.scenes.find((s) => s.id === id);

const ANSWERS = {
  service: 'The intensive care unit on the older side of the building.',
  undocumentedDependency: 'One porter knows which lift takes a bed with a ventilator on it.',
  notSureAbout: 'Whether anyone on the night shift knows that route.',
  questionToAsk: 'The portering supervisor, about how Sunday nights are covered.',
};

const drawPlay = (run, b, textPath) => renderToStaticMarkup(
  createElement(PlayRoute, { run, bundle: b, attestation: ATTESTATION, textPath }));

/**
 * Walk the whole chapter, recording the markup of every beat.
 *
 * ⚠️ IT SAVES AND RESUMES AT EVERY BEAT. "The slice can be run unassisted from a
 * clean local start" includes closing the tab in the middle of a scene, which is
 * what a hospital professional interrupted by their actual job will do.
 */
function walk(b, { role, textPath, local = store.memoryStore() }) {
  let run = startRun({
    bundle: b,
    config: { role, stake: 'a night with no lights', displayName: 'A participant' },
  });
  const beats = [];
  let guard = 0;

  while (!run.complete && guard++ < 200) {
    // Save, drop everything, and come back — at every beat, not only at the end.
    store.saveRun(local, run);
    const resumed = store.loadRun(local, b);
    assert.equal(resumed.phase, run.phase, 'a reload changed the beat');
    assert.equal(currentSceneId(resumed), currentSceneId(run), 'a reload changed the scene');
    run = resumed;

    const v = view(run, b);
    beats.push({
      scene: currentSceneId(run),
      phase: v.phase,
      html: drawPlay(run, b, textPath),
      actions: v.actions.map((a) => a.type),
    });

    if (run.phase === 'interactive') {
      let inner = 0;
      while (view(run, b).actions.length > 0 && inner++ < 20) {
        run = act(run, b, view(run, b).actions[0].id).run;
      }
      run = commit(run, b, view(run, b).presented.options[0].id).run;
    } else {
      run = advance(run, b);
    }
  }

  return { run, beats, local };
}

// --- a clean local start ---------------------------------------------------------

test('★ A CLEAN LOCAL START — nothing stored, and the participant can begin', () => {
  // Every other test builds its own run. This asserts the first screen a person
  // sees with an empty device works, through the composition the browser mounts.
  const b = bundle();
  const local = store.memoryStore();
  assert.deepEqual(local.keys(), []);
  assert.equal(store.loadRun(local, b), null, 'an empty device must not fabricate a run');

  let started = null;
  const onStarted = Object.assign((run) => { started = run; }, { bundle: b });
  const element = createElement(SetupRoute, {
    scenes: CHAPTER_1.scenes, onStarted, applyLocale: () => {},
  });
  const html = renderToStaticMarkup(element);

  assert.ok(html.includes(t('setup.title')));
  assert.ok(html.includes(t('role.resilience-lead.title')));
  assert.ok(!html.includes('⟨'));

  // ...and beginning produces a run at the first beat of the first scene.
  const run = element.type(element.props).props.onBegin({ role: ROLES[0], locale: 'en' });
  assert.equal(run.phase, PHASES[0]);
  assert.equal(currentSceneId(run), 'sc-01-01');
  assert.equal(started.role, ROLES[0]);
});

test('★ the language applies BEFORE the next screen renders — the line no test ran', () => {
  const b = bundle();
  const applied = [];
  const element = createElement(SetupRoute, {
    scenes: CHAPTER_1.scenes,
    onStarted: Object.assign(() => {}, { bundle: b }),
    applyLocale: (l) => applied.push(l),
  });
  element.type(element.props).props.onBegin({ role: ROLES[0], locale: 'ar' });
  assert.deepEqual(applied, ['ar'], 'the locale was collected and discarded again');
});

test('a run with no role is refused at setup, not defaulted', () => {
  const b = bundle();
  const element = createElement(SetupRoute, {
    scenes: CHAPTER_1.scenes,
    onStarted: Object.assign(() => {}, { bundle: b }),
    applyLocale: () => {},
  });
  assert.throws(() => element.type(element.props).props.onBegin({ role: null, locale: 'en' }),
    (e) => e.refusal === 'run-has-no-role');
});

// --- the walk, four ways ---------------------------------------------------------

for (const role of ROLES) {
  for (const textPath of PATHS) {
    const name = `${role.replace('role.', '')} · ${textPath ? 'text' : 'visual'}`;

    test(`★ THE WALK COMPLETES — ${name}`, () => {
      const b = bundle();
      const { run, beats } = walk(b, { role, textPath });

      assert.equal(run.complete, true, 'the chapter did not finish');
      assert.equal(beats.length, 16, 'four scenes, four beats each');
      assert.deepEqual([...new Set(beats.map((x) => x.scene))],
        ['sc-01-01', 'sc-01-02', 'sc-01-03', 'sc-01-04']);
      for (const scene of CHAPTER_1.scenes) {
        assert.deepEqual(beats.filter((x) => x.scene === scene.id).map((x) => x.phase), [...PHASES]);
      }
      assert.equal(run.history.length, 4);
    });

    test(`★ FPE-01 holds across the whole walk — ${name}`, () => {
      const b = bundle();
      const { beats } = walk(b, { role, textPath });
      for (const beat of beats) {
        const scene = sceneOf(beat.scene);
        const turn = scene.turn.slice(0, 60);
        const residue = scene.residue.slice(0, 60);
        if (beat.phase === 'pre_commit' || beat.phase === 'interactive') {
          assert.ok(!beat.html.includes(turn), `${beat.scene}/${beat.phase}: the turn arrived early`);
          assert.ok(!beat.html.includes(residue), `${beat.scene}/${beat.phase}: the residue arrived early`);
        }
        if (beat.phase === 'post_commit') assert.ok(beat.html.includes(turn));
        if (beat.phase === 'scene_exit') assert.ok(beat.html.includes(residue));
      }
    });

    test(`★ all three action types occur, before the commitment — ${name}`, () => {
      const b = bundle();
      const { beats, run } = walk(b, { role, textPath });
      const interactive = beats.filter((x) => x.phase === 'interactive');
      assert.equal(interactive.length, 4);
      for (const beat of interactive) {
        assert.ok(beat.actions.length > 0, `${beat.scene} offers nothing to do before deciding`);
      }
      const types = new Set(run.actionsTaken.map((a) => a.type));
      assert.deepEqual([...types].sort(), ['consult', 'inspect']);
      assert.equal(run.history.length, 4, '...and the third type, commit, four times');
    });

    test(`★ every setup field reaches an observable beat — ${name}`, () => {
      const b = bundle();
      const { beats, run } = walk(b, { role, textPath });

      // ROLE: the variant renders, and it is this role's.
      const variantEvidence = CHAPTER_1.scenes[0].role_variants
        .find((v) => v.role_id === role).starting_position;
      assert.ok(beats[0].html.includes(variantEvidence), 'the role changed nothing visible');

      // STAKE and NAME: acknowledged once, privately, and nowhere else.
      const withStake = beats.filter((x) => x.html.includes('a night with no lights'));
      assert.equal(withStake.length, 1, 'the stake appears more or less than once');
      assert.equal(withStake[0].phase, 'pre_commit');
      assert.equal(withStake[0].scene, 'sc-01-01');
      assert.ok(withStake[0].html.includes('data-private="true"'));

      // LOCALE is exercised by the Arabic walk below; the run carries it.
      assert.equal(run.locale, 'en');
    });

    test(`★ the response is causal, and the world remembers — ${name}`, () => {
      const b = bundle();
      const { run, beats } = walk(b, { role, textPath });

      for (const beat of beats.filter((x) => x.phase === 'post_commit')) {
        assert.ok(beat.html.includes(t('play.response')), `${beat.scene} has no response beat`);
      }
      // World memory outlives the scene that made it.
      const place = renderToStaticMarkup(createElement(PlaceRoute, {
        run, bundle: b, scenes: CHAPTER_1.scenes,
      }));
      assert.ok(!place.includes(t('place.nothing_changed_yet')), 'the Bimaristan remembers nothing');
      assert.ok(place.includes('locked out for repair and testing'), 'the ICU did not stay changed');
    });

    test(`★ the arc ends in a record, a reflection and a note they keep — ${name}`, () => {
      const b = bundle();
      const { run, local } = walk(b, { role, textPath });

      const record = buildRecord(run, b);
      assert.equal(record.scenes.length, 4);
      for (const scene of record.scenes) assert.ok(scene.option?.id);

      const ref = store.participantRef(local, newParticipantRef);
      store.saveReflection(local, buildReflection({
        participantRef: ref, answers: { 'reflection.principle.prompt': 'Capacity is not capability.' },
      }));
      store.saveObservation(local, buildObservation({ participantRef: ref, answers: ANSWERS, run }));

      const html = renderToStaticMarkup(createElement(ObservationRoute, {
        run, bundle: b, local, t,
      }));
      for (const section of SECTIONS) assert.ok(html.includes(ANSWERS[section]));
      assert.ok(html.includes('Capacity is not capability.'));

      // ...and they can take it all back.
      assert.ok(store.deleteEverything(local).length >= 3);
      assert.deepEqual(local.keys(), []);
    });
  }
}

// --- the two roles are different, and the two paths are not ----------------------

test('★ ROLE INTEGRITY — the two roles are told and offered different things', () => {
  const b = bundle();
  const lead = walk(b, { role: ROLES[0], textPath: false });
  const quality = walk(b, { role: ROLES[1], textPath: false });

  assert.notEqual(lead.beats[0].html, quality.beats[0].html);

  // Different people consulted — canon pairs Quality with Fadl by name.
  const consulted = (r) => new Set(r.run.actionsTaken.map((a) => a.target.id));
  assert.ok(consulted(quality).has('Fadl'));
  assert.ok(!consulted(lead).has('Fadl'));
  assert.ok(consulted(lead).has('the duty nursing leader'));

  // ...and both reach the guaranteed clue, which is canon's own promise.
  for (const r of [lead, quality]) {
    assert.ok(heldEvidence(r.run).has('ev.01.02.shared-board'),
      'a role lost the clue canon says cannot disappear');
  }
});

test('★ TEXT PARITY — from the decision onward the two paths differ only by the art', () => {
  // ⚠️ ASSERTED AS A DIFF, NOT AS A CLAIM. The text path substitutes the
  // authored equivalent at `pre_commit` — that is the designed difference. From
  // `interactive` onward the two must be the same page minus its pictures, or
  // something reaches one path and not the other and nobody would notice.
  const b = bundle();
  const visual = walk(b, { role: ROLES[0], textPath: false });
  const text = walk(b, { role: ROLES[0], textPath: true });
  const strip = (html) => html.replace(/<figure[\s\S]*?<\/figure>/g, '');

  for (let i = 0; i < visual.beats.length; i++) {
    const a = visual.beats[i];
    const c = text.beats[i];
    assert.equal(a.phase, c.phase);
    if (a.phase === 'pre_commit') continue;          // the designed substitution
    assert.equal(strip(a.html), strip(c.html),
      `${a.scene}/${a.phase}: the paths diverge somewhere other than the art`);
  }
});

test('★ the text path\'s encounter is the AUTHORED equivalent, not a shorter one', () => {
  const b = bundle();
  const text = walk(b, { role: ROLES[0], textPath: true });
  for (const scene of CHAPTER_1.scenes) {
    const beat = text.beats.find((x) => x.scene === scene.id && x.phase === 'pre_commit');
    const authored = t(scene.text_equivalent.key);
    assert.ok(beat.html.includes(authored.slice(0, 80)), `${scene.id}'s text path is not the authored one`);
    assert.ok(authored.length > 400);
  }
});

// --- nothing leaves, on every path -----------------------------------------------

test('★ the whole walk runs with every network exit sealed, for BOTH roles', () => {
  // privacy.test.js proves the observation flow. This proves the SLICE — the
  // play surfaces, the place, the record and the note — because a beacon added
  // to a scene renderer would not be caught by a test that only walks the note.
  const saved = {
    fetch: globalThis.fetch, XMLHttpRequest: globalThis.XMLHttpRequest,
    WebSocket: globalThis.WebSocket, navigator: globalThis.navigator,
  };
  const attempts = [];
  const trap = (name) => () => { attempts.push(name); throw new Error(`${name} was called`); };
  globalThis.fetch = trap('fetch');
  globalThis.XMLHttpRequest = function () { trap('XMLHttpRequest')(); };
  globalThis.WebSocket = function () { trap('WebSocket')(); };
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true, value: { sendBeacon: trap('sendBeacon') },
  });

  try {
    const b = bundle();
    for (const role of ROLES) for (const textPath of PATHS) walk(b, { role, textPath });
  } finally {
    globalThis.fetch = saved.fetch;
    globalThis.XMLHttpRequest = saved.XMLHttpRequest;
    globalThis.WebSocket = saved.WebSocket;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: saved.navigator });
  }
  assert.deepEqual(attempts, [], 'something in the slice tried to leave the client');
});

// --- right to left ----------------------------------------------------------------

test('★ THE WALK COMPLETES IN ARABIC, and the direction goes with it', () => {
  // ⚠️ `t()` FALLS BACK TO ENGLISH, so this passing does NOT mean the slice is
  // translated. It means the slice does not BREAK in Arabic — direction, layout
  // and every beat still reached. The translation gap is recorded as a
  // limitation in the evidence pack, with its computed number.
  const before = getLocale();
  try {
    setLocale('ar');
    assert.equal(directionFor(getLocale()), 'rtl');
    const b = bundle();
    for (const role of ROLES) {
      const { run, beats } = walk(b, { role, textPath: false });
      assert.equal(run.complete, true, `${role} cannot finish the chapter in Arabic`);
      for (const beat of beats) {
        assert.ok(!beat.html.includes('⟨'), 'a key with no string in either catalogue');
      }
    }
  } finally {
    setLocale(before);
  }
  assert.equal(getLocale(), before, 'the locale leaked out of the test');
});
