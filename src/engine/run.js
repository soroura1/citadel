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
 * A run is: a position in an ordered bundle, the BEAT within that position, the
 * state accumulated so far, and the history that makes a later consequence
 * explainable.
 *
 * ============================================================================
 * ★ EVS-2 — THE BEAT IS THE STAGING PHASE. THERE IS NO SECOND VOCABULARY.
 * ============================================================================
 * The session plan names seven beats: arrive/setup, pre-commit encounter,
 * interactive discovery, commitment, immediate response, residue, and
 * reflection/exit. They are not seven things this file tracks. Two of them are
 * RUN-LEVEL and already exist as their own surfaces:
 *
 *   arrive / setup      -> SetupScreen, before the run starts
 *   reflection / exit   -> ChapterEnd, after the last scene
 *
 * The rest are PER SCENE, and they are exactly the four phases EVS-1 put in
 * the scene contract:
 *
 *   pre_commit   encounter — orientation, desire, friction
 *   interactive  discovery and the decision itself
 *   post_commit  commitment's response — the turn and the immediate effect
 *   scene_exit   residue
 *
 * ⚠️ A SECOND ENUM SYNCHRONISED TO THOSE FOUR WOULD BE TWO DEFINITIONS OF ONE
 * SEQUENCE. This project has already paid for that shape twice — two phase
 * tables in one release document, and a rule expressed in two places that
 * diverged. The beat IS the phase. `PHASES` in `staging.js` is the only list.
 *
 * ============================================================================
 * ★ AND `view()` PROJECTS — IT DOES NOT HAND OVER THE WHOLE SCENE
 * ============================================================================
 * FPE-01 says `turn`, the immediate effect, the state delta and `residue` are
 * not rendered before commitment. A surface that RECEIVES them and is trusted
 * not to draw them is one careless edit from breaking that. So the view carries
 * only what the current phase presents: at `pre_commit` the turn is not hidden,
 * it is ABSENT.
 */

import { loadBundle } from './bundle.js';
import { initialState } from './season-variables.js';
import { choose as decide, presentOptions } from './decision.js';
import { assertSceneShape } from './scene.js';
import { fireDue } from './consequence.js';
import { startingStateFor } from './configuration.js';
import { PHASES, phasesOf } from './staging.js';
import { composeResponse } from './response.js';
import { assertRoleIsPlayable, variantFor } from './roles.js';

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

  // ★ EVS-3 — A RUN WITHOUT A ROLE IS REFUSED, NOT DEFAULTED.
  //
  // ⚠️ The default this codebase had was "authorised for everything":
  // `presentOptions` read `!role` as satisfying every authority gate. Refusing
  // here and refusing there are not redundant — the surface can be bypassed,
  // and a bundle can be driven from a script.
  assertRoleIsPlayable(config.role);

  const order = bundle.order ?? [...bundle.scenes.keys()];
  if (order.length === 0) throw new RunRefusal('bundle-has-no-scenes', bundle.version);

  const state = scenario
    ? startingStateFor(scenario, initialState())
    : { season: initialState(), chapter: {}, log: [], pending: [] };

  return Object.freeze({
    bundleVersion: bundle.version,
    order,
    index: 0,
    // Every scene opens on its encounter. Nothing post-commitment exists yet.
    phase: PHASES[0],
    // The response to THIS scene's commitment, once it has been made. Cleared
    // when the run moves to the next scene, because it belongs to that scene.
    response: null,
    role: config.role,
    // ★ The participant's own words, carried through the run and the save.
    // Private: acknowledged back to them at the beat canon names ("confirms
    // role and personal stake"), and never spoken by a character or shown on
    // a board.
    displayName: config.displayName ?? null,
    stake: config.stake ?? null,
    locale: config.locale ?? 'en',
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

/**
 * The movements this phase presents, with their content.
 *
 * ⚠️ `immediate_effect` is staged in `post_commit` beside `turn`, and it is not
 * a movement — its content is the composed response, which lives on the run and
 * not on the scene. It is filtered out here and supplied separately.
 */
function presentedIn(scene, phase) {
  const plan = phasesOf(scene);
  if (!plan) throw new RunRefusal('scene-not-staged', scene.id);
  const movements = plan.find((p) => p.phase === phase)?.presents ?? [];

  return movements
    .filter((movement) => {
      // Not a movement: its content is the composed response, which lives on
      // the run rather than on the scene, and the view supplies it separately.
      if (movement === 'immediate_effect') return false;

      // ⚠️ `choice_or_discovery` HOLDS A DECISION ID, NOT PROSE. It reached the
      // screen once as "dec-01-gate-access" — an internal name shown to someone
      // who has no use for it, the same class of failure as a locale key on
      // screen. The decision is supplied as `presented`, with its prompt and
      // options; this movement is the POINTER to it, and a pointer is not
      // something a person reads.
      //
      // It is dropped HERE rather than in the component, because a projection
      // is where "what may be shown" belongs. A discovery scene whose
      // `choice_or_discovery` is prose rather than a reference still presents —
      // which is what EVS-4 will need.
      const content = scene[movement];
      if (movement === 'choice_or_discovery' && typeof content === 'string' && content.startsWith('dec-')) {
        return false;
      }
      return true;
    })
    .map((movement) => ({ movement, content: scene[movement] }));
}

/**
 * What the surface should render, assembled once so the component stays pure.
 *
 * ★ ONLY THE CURRENT PHASE. The scene object is passed for its chrome — id,
 * title, bell, register, art — and the movement content comes from `presents`,
 * which is projected. A component that reads `scene.turn` directly is reaching
 * past this projection, and the render tests assert the turn's PROSE is absent
 * from pre-commit markup so that reach cannot go unnoticed.
 */
export function view(run, bundle) {
  const scene = currentScene(run, bundle);
  if (!scene || run.complete) return { scene: null, decision: null, complete: true };

  const decision = currentDecision(run, bundle);
  const atDecision = run.phase === 'interactive';

  return {
    scene,
    phase: run.phase,
    presents: presentedIn(scene, run.phase),
    // ★ WHAT THIS ROLE SEES AND MAY CONTRIBUTE. Canon: "Every role plays the
    // same four scenes. Each receives a distinct first fact and one direct
    // contribution." Before EVS-3 the role reached the engine and nothing
    // rendered it, so choosing one changed nothing a participant could point at.
    roleVariant: variantFor(scene, run.role),
    // ★ THE STAKE, ACKNOWLEDGED PRIVATELY, AT THE BEAT CANON NAMES.
    //
    // Scene 1's playable actions open with "confirms role and personal stake".
    // It is shown back to the participant once, on their own encounter screen —
    // never in scene prose, never spoken by a character, never on a board. The
    // rule lives here rather than in the component so it is testable.
    acknowledgeStake: run.index === 0 && run.phase === 'pre_commit'
      ? { displayName: run.displayName, stake: run.stake }
      : null,
    // ★ The decision exists only where it is staged. Handing it to the surface
    // at `pre_commit` would let an encounter screen draw the options, which is
    // the commitment happening before the encounter has finished.
    decision: atDecision ? decision : null,
    presented: atDecision && decision ? presentOptions(decision, { role: run.role }) : null,
    // The response is the post-commitment material. Absent until it exists.
    response: run.phase === 'post_commit' ? run.response : null,
    state: run.state,
    position: { index: run.index, of: run.order.length },
    complete: false,
  };
}

/**
 * ★ COMMIT. Apply, compose the response, and STOP.
 *
 * ============================================================================
 * THIS REPLACES `chooseAndAdvance`, WHICH WAS DELETED RATHER THAN KEPT.
 * ============================================================================
 * The old call applied the effects and moved to the next scene in one step, so
 * the response beat had nowhere to happen — the player chose and received
 * another page. Leaving it beside `commit` as a convenience would have left a
 * second, shorter path that skips FPE-02 entirely, and `main.jsx` was one
 * refactor from calling it. Two active specifications for one act is the defect
 * this project has already corrected twice in documents; it is worse in code.
 *
 * ★ THE STATE IS THE POINT. A chapter whose scenes each start fresh is four
 * short stories; the decision in scene 2 matters because scene 1 already
 * happened to the same person.
 */
export function commit(run, bundle, optionId, { as = null } = {}) {
  if (run.complete) throw new RunRefusal('run-already-complete');

  // ⚠️ Refused BY THE ENGINE, not merely by the surface not drawing a button.
  // A commitment accepted at `pre_commit` is a decision taken while the
  // encounter is still on screen, and FPE-01 would then hold only as long as
  // every caller behaved.
  if (run.phase !== 'interactive') {
    throw new RunRefusal('commitment-out-of-turn', `phase is ${run.phase}, not interactive`);
  }

  const scene = currentScene(run, bundle);
  const decision = currentDecision(run, bundle);
  if (!decision) throw new RunRefusal('scene-has-no-decision', scene?.id);

  const presented = presentOptions(decision, { role: run.role });

  // ★ EVS-3 — COMMITTING IS TWO THINGS, AND THE RECORD SAYS WHICH.
  //
  // A role that holds the authority DECIDES. A role that does not SUPPORTS a
  // pathway — the Final Product Experience Contract's own commit beat: "the
  // player decides, escalates, delegates, negotiates or supports another
  // person's proposal under a named constraint."
  //
  // ⚠️ Deciding is still refused for a role without authority. The surface
  // hiding a button is not enforcement, and a caller that asks to DECIDE is
  // told which rule applied rather than quietly being given support instead.
  if (!presented.mayCommit) {
    throw new RunRefusal(presented.refusal, `${run.role} on ${decision.id}`);
  }
  if (as === 'decision' && presented.commitAs !== 'decision') {
    throw new RunRefusal('role-lacks-authority-to-decide', `${run.role} on ${decision.id}`);
  }

  const { state, changes } = decide(run.state, decision, optionId);
  // ★ The record must be able to say DECIDED or SUPPORTED. A response that
  // cannot tell them apart cannot answer "what did my role change?".
  const response = Object.freeze({
    ...composeResponse({ scene, decision, optionId, changes }),
    committedAs: presented.commitAs,
    authorityHeldBy: presented.authorityHeldBy,
  });

  const history = [...run.history, {
    sequence: run.history.length + 1,
    sceneId: scene.id,
    sceneTitle: scene.id,          // the surface resolves the title from locale
    decisionId: decision.id,
    optionId,
    // ★ Decided, or supported. Two different acts, and a record that cannot
    // tell them apart cannot answer "what did my role change?" -- which is the
    // question EVS-3 exists to make answerable.
    committedAs: presented.commitAs,
    authorityHeldBy: presented.authorityHeldBy,
    // ★ FPE-04 wants the specific option permanently readable. Recording HOW
    // the response was told is what stops a thin derived beat from later being
    // mistaken for authored narrative in the record.
    responseProvenance: response.narrative.provenance,
  }];

  return {
    run: Object.freeze({ ...run, phase: 'post_commit', response, state, history }),
    changes,
    response,
    committedAs: presented.commitAs,
  };
}

/**
 * Move to the next beat. A SEPARATE ACT from committing.
 *
 * The phases are walked in the order `PHASES` declares. Leaving the last one
 * leaves the scene.
 */
export function advance(run, bundle) {
  if (run.complete) throw new RunRefusal('run-already-complete');

  const here = PHASES.indexOf(run.phase);
  if (here < 0) throw new RunRefusal('unknown-phase', run.phase);

  // ⚠️ You cannot walk PAST a decision without making one. Advancing from
  // `interactive` would carry the player into the response beat of a
  // commitment that never happened.
  if (run.phase === 'interactive' && currentDecision(run, bundle)) {
    throw new RunRefusal('cannot-advance-past-an-undecided-commitment', currentSceneId(run));
  }

  if (here < PHASES.length - 1) {
    return Object.freeze({ ...run, phase: PHASES[here + 1] });
  }

  // --- leaving the scene -------------------------------------------------
  const index = run.index + 1;
  const complete = index >= run.order.length;

  // At the chapter boundary, anything owed and due arrives. In v1 there is no
  // Chapter 2, so a next_chapter consequence stays pending -- which is the
  // honest state, and is what R4's synthetic fixture exists to exercise.
  const { fired, pending: stillOwed } = complete
    ? fireDue(run.deferred, {
        chapter: 'ch-01-complete',
        season: run.state.season,
        decisionsTaken: run.history.map((h) => h.optionId),
      })
    : { fired: [], pending: run.deferred };

  return Object.freeze({
    ...run,
    index,
    phase: PHASES[0],
    response: null,               // the response belonged to the scene just left
    complete,
    deferred: stillOwed,
    arrived: [...run.arrived, ...fired],
  });
}

/** Serialise. The bundle version is pinned, so a run resumes into what it played. */
export function serialise(run) {
  return JSON.stringify(run);
}

/**
 * ★ RESUME AT THE EXACT BEAT, or refuse by name.
 *
 * ⚠️ A run stored at `post_commit` with no response would render an EMPTY
 * response beat — a page that says a choice was made and shows nothing it did.
 * That is worse than a crash, because it looks like a finished screen.
 */
export function deserialise(text, bundle) {
  const run = JSON.parse(text);
  if (run.bundleVersion !== bundle.version) {
    throw new RunRefusal('run-pinned-to-another-bundle',
      `run is ${run.bundleVersion}, bundle is ${bundle.version}`);
  }
  if (!PHASES.includes(run.phase)) {
    throw new RunRefusal('unknown-phase', String(run.phase));
  }
  // ⚠️ A save from before the slice narrowed its roles carries a role that is
  // no longer playable. Resuming it would put a participant back into a
  // configuration the build cannot honour.
  assertRoleIsPlayable(run.role);
  if (run.phase === 'post_commit' && !run.response) {
    throw new RunRefusal('resumed-response-beat-has-no-response', currentSceneId(run) ?? '(no scene)');
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
