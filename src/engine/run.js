/**
 * ★ THE CHAPTER RUNNER — the loop that makes a chapter a chapter.
 *
 * ============================================================================
 * WHAT DID NOT EXIST BEFORE THIS FILE
 * ============================================================================
 * The engine could load a bundle, present a decision, apply effects, hold a
 * deferred consequence and save a run. Nothing SEQUENCED scenes. PlayScreen is
 * a pure component handed one scene; four scenes and a state that carries
 * between them is a different thing, and it is the thing a chapter is.
 *
 * A run is: a position in an ordered bundle, the state accumulated so far, and
 * the history that makes a later consequence explainable.
 */

import { loadBundle } from './bundle.js';
import { initialState } from './season-variables.js';
import { choose as decide, presentOptions } from './decision.js';
import { assertSceneShape } from './scene.js';
import { fireDue } from './consequence.js';
import { startingStateFor } from './configuration.js';

export class RunRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ⚠️ ORDER COMES FROM THE BUNDLE, NEVER FROM THE SCENE IDS.
 *
 * `sc-01-01 … sc-01-04` sorts correctly today, and sorting identifiers is an
 * inference dressed as a rule: it breaks silently the first time a scene is
 * inserted, renamed, or ordered differently for a scenario. The bundle is
 * already the pin — an ordered list there is a DECLARATION.
 *
 * The scenes' own `begins_after` / `ends_before` are prose. They describe the
 * boundary for a human; they do not name a successor, and treating them as if
 * they did would be reading a sentence as a pointer.
 */
export function startRun({ bundle, config = {}, scenario = null }) {
  if (!bundle?.version) throw new RunRefusal('run-needs-a-bundle');

  const order = bundle.order ?? [...bundle.scenes.keys()];
  if (order.length === 0) throw new RunRefusal('bundle-has-no-scenes', bundle.version);

  const state = scenario
    ? startingStateFor(scenario, initialState())
    : { season: initialState(), chapter: {}, log: [], pending: [] };

  return Object.freeze({
    bundleVersion: bundle.version,
    order,
    index: 0,
    role: config.role ?? null,
    displayName: config.displayName ?? null,
    scenarioId: scenario?.id ?? null,
    state,
    // ★ Shaped for traceback() deliberately. R4 must answer "why did this
    // happen" three chapters later, and that answer is only constructible if
    // the link was recorded WHEN THE DECISION WAS MADE.
    history: [],
    // ⚠️ TWO DIFFERENT THINGS, DELIBERATELY NOT ONE LIST.
    //
    //   state.pending  — held EFFECTS. A state change whose moment has not
    //                    come. Produced by applyOption from an option's own
    //                    effects.
    //   deferred       — deferred CONSEQUENCES. A narrative event with a cause,
    //                    a relationship, and both an emotional and an
    //                    operational account.
    //
    // They were both called "pending" until this runner made them meet, and the
    // collision surfaced as a TypeError three frames inside shouldFire.
    deferred: [],
    arrived: [],          // consequences that have surfaced
    complete: false,
  });
}

export const currentSceneId = (run) => run.order[run.index] ?? null;

export function currentScene(run, bundle) {
  const id = currentSceneId(run);
  const scene = id ? bundle.scene(id) : null;
  if (id && !scene) throw new RunRefusal('scene-not-in-bundle', id);
  return scene;
}

export function currentDecision(run, bundle) {
  const scene = currentScene(run, bundle);
  const ref = scene?.choice_or_discovery;
  if (typeof ref !== 'string' || !ref.startsWith('dec-')) return null;
  const decision = bundle.decision(ref);
  // loadBundle already refuses a scene pointing at an absent decision, so this
  // can only fire if a bundle was assembled by hand.
  if (!decision) throw new RunRefusal('decision-not-in-bundle', ref);
  return decision;
}

/** What the surface should render, assembled once so the component stays pure. */
export function view(run, bundle) {
  const scene = currentScene(run, bundle);
  if (!scene) return { scene: null, decision: null, complete: true };
  const decision = currentDecision(run, bundle);
  return {
    scene,
    decision,
    presented: decision ? presentOptions(decision, { role: run.role }) : null,
    state: run.state,
    position: { index: run.index, of: run.order.length },
    complete: false,
  };
}

/**
 * Choose, apply, and move on — carrying the state.
 *
 * ★ THE STATE IS THE POINT. A chapter whose scenes each start fresh is four
 * short stories; the decision in scene 2 matters because scene 1 already
 * happened to the same person.
 */
export function chooseAndAdvance(run, bundle, optionId) {
  if (run.complete) throw new RunRefusal('run-already-complete');

  const scene = currentScene(run, bundle);
  const decision = currentDecision(run, bundle);
  if (!decision) throw new RunRefusal('scene-has-no-decision', scene?.id);

  const presented = presentOptions(decision, { role: run.role });
  if (!presented.authorised) {
    // A role without authority observes. It must not be able to decide by
    // calling this directly -- the surface hiding a button is not enforcement.
    throw new RunRefusal(presented.refusal, `${run.role} on ${decision.id}`);
  }

  const { state, changes } = decide(run.state, decision, optionId);

  const history = [...run.history, {
    sequence: run.history.length + 1,
    sceneId: scene.id,
    sceneTitle: scene.id,          // the surface resolves the title from locale
    decisionId: decision.id,
    optionId,
  }];

  const index = run.index + 1;
  const complete = index >= run.order.length;

  // At the chapter boundary, anything owed and due arrives. In v1 there is no
  // Chapter 2, so a next_chapter consequence stays pending -- which is the
  // honest state, and is what R4's synthetic fixture exists to exercise.
  const { fired, pending: stillOwed } = complete
    ? fireDue(run.deferred, {
        chapter: 'ch-01-complete',
        season: state.season,
        decisionsTaken: history.map((h) => h.optionId),
      })
    : { fired: [], pending: run.deferred };

  return {
    run: Object.freeze({
      ...run,
      index,
      complete,
      state,                       // held EFFECTS stay where applyOption put them
      deferred: stillOwed,         // deferred CONSEQUENCES, still owed
      history,
      arrived: [...run.arrived, ...fired],
    }),
    changes,
    arrived: fired,
  };
}

/** Serialise. The bundle version is pinned, so a run resumes into what it played. */
export function serialise(run) {
  return JSON.stringify(run);
}

export function deserialise(text, bundle) {
  const run = JSON.parse(text);
  if (run.bundleVersion !== bundle.version) {
    throw new RunRefusal('run-pinned-to-another-bundle',
      `run is ${run.bundleVersion}, bundle is ${bundle.version}`);
  }
  return Object.freeze(run);
}

/** Build a bundle from loose scene and decision documents, in a declared order. */
export function bundleFrom({ version, scenes, decisions, order }) {
  for (const s of scenes) assertSceneShape(s);
  const bundle = loadBundle({ version, scenes, decisions });
  return {
    ...bundle,
    // An explicit order, or the order the scenes were given in. Never sorted.
    order: order ?? scenes.map((s) => s.id),
  };
}
