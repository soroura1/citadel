/**
 * ★ WHEN each movement is presented. (EVS-1)
 *
 * ============================================================================
 * THE INTERFACE WAS SPOILING ITS OWN DRAMA, AND NO RULE COULD OBJECT.
 * ============================================================================
 * `PlayScreen` renders all six movements as one ordered document, so `turn`
 * and `residue` — what the commitment CAUSES and what it LEAVES — are on the
 * page before the player has chosen anything. The Final Product Experience
 * Contract's first presentation invariant, FPE-01, forbids exactly that.
 *
 * It survived because the contract had no field saying when anything is shown.
 * The six authored movements are SOURCE MATERIAL; the schema treated them as a
 * display list. The usual failure in this project is a rule that is correct and
 * cannot fire — this was a rule that could not be written.
 *
 * ⚠️ THIS FILE DOES NOT CHANGE WHAT RENDERS. EVS-2 does that. What lands here
 * is the vocabulary EVS-2 consumes, and the checks the schema cannot make.
 *
 * ============================================================================
 * WHY THESE RULES ARE HERE AND NOT IN `contracts`
 * ============================================================================
 * `VERSIONING.md`: "citadel's rules live in citadel… publishing a rule no other
 * service consumes costs a tag-and-pin cycle per change and buys nothing"
 * (`DEC-009`). Only citadel loads scenes. What `contracts` owns is the SHAPE —
 * which movement may sit in which phase, and that a staged scene owes an
 * immediate effect. What is here is everything that needs to look at two
 * documents at once, which JSON Schema cannot do.
 */

import { MOVEMENTS } from './scene.js';

/**
 * ⚠️ THE SEQUENCE IS A CONSTANT, NOT CONTENT.
 *
 * A scene declares which movement sits in which phase. It does not declare the
 * order of the phases, because a scene that could reorder them could put the
 * response before the choice — and there is no authored reason to want that.
 * Making it unrepresentable is cheaper than refusing it.
 */
export const PHASES = Object.freeze(['pre_commit', 'interactive', 'post_commit', 'scene_exit']);

/** Not a movement. It is the response beat's own material, staged beside `turn`. */
const NOT_A_MOVEMENT = new Set(['immediate_effect']);

export class StagingRefusal extends Error {
  constructor(refusal, where, detail) {
    super(`${refusal} at ${where}${detail ? `: ${detail}` : ''}`);
    this.refusal = refusal;
    this.where = where;
    this.detail = detail;
  }
}

/** Ordered phases with the movements each presents. What a staged renderer walks. */
export function phasesOf(scene) {
  const staging = scene?.staging;
  if (!staging) return null;
  return PHASES.map((phase) => ({ phase, presents: staging[phase] ?? [] }));
}

/** The phase a movement is presented in, or null if the scene is unstaged. */
export function phaseOf(scene, movement) {
  const staging = scene?.staging;
  if (!staging) return null;
  return PHASES.find((p) => (staging[p] ?? []).includes(movement)) ?? null;
}

/**
 * Everything wrong with a scene's staging, NAMED. Never a bare boolean.
 *
 * `decision` is optional: pass it and the immediate effect is checked against
 * the options it claims to answer. Without it that check is SKIPPED rather than
 * silently passed — a check that reports success on absent input is the shape
 * that has cost this project three defects.
 */
export function stagingRefusals(scene, decision = null) {
  const out = [];
  const staging = scene?.staging;

  if (!staging) {
    out.push({ refusal: 'scene-not-staged', detail: 'no staging; every movement would render at once' });
    return out;
  }

  // --- Every movement staged EXACTLY once. --------------------------------
  //
  // The schema constrains which movement may appear in which phase, one phase
  // at a time. It cannot see across the four, so a movement staged twice — or
  // dropped from all of them and therefore never shown — validates cleanly.
  const seen = new Map();
  for (const phase of PHASES) {
    for (const m of staging[phase] ?? []) {
      if (NOT_A_MOVEMENT.has(m)) continue;
      seen.set(m, [...(seen.get(m) ?? []), phase]);
    }
  }
  for (const [m, phases] of seen) {
    if (phases.length > 1) {
      out.push({ refusal: 'movement-staged-twice', detail: `${m} in ${phases.join(' and ')}` });
    }
  }
  for (const m of MOVEMENTS) {
    if (!seen.has(m)) out.push({ refusal: 'movement-not-staged', detail: `${m} would never be shown` });
  }

  // --- The response beat must answer every option. -------------------------
  //
  // ★ AN OPTION WITH NO RESPONSE IS A CHOICE THAT DID NOTHING.
  //
  // FPE-02 requires a commitment to receive an immediate causal response before
  // navigation advances. If the scene answers two of three options, the third
  // is the one a participant picks and gets a blank beat for — and it looks
  // complete in review, because the other two are there.
  const ie = scene.immediate_effect;
  if (!ie) {
    out.push({ refusal: 'immediate-effect-missing', detail: 'a staged scene owes its response beat' });
  } else if (decision) {
    const answered = new Set(ie.responses.map((r) => r.option_id));
    const options = new Set(decision.options.map((o) => o.id));
    for (const id of options) {
      if (!answered.has(id)) out.push({ refusal: 'option-has-no-immediate-effect', detail: id });
    }
    for (const id of answered) {
      if (!options.has(id)) out.push({ refusal: 'immediate-effect-names-unknown-option', detail: id });
    }
  }

  return out;
}

export function assertStaged(scene, decision = null) {
  const failures = stagingRefusals(scene, decision);
  if (failures.length) {
    throw new StagingRefusal(
      failures[0].refusal,
      scene?.id ?? '(unnamed scene)',
      failures.map((f) => `${f.refusal}: ${f.detail}`).join('; '),
    );
  }
  return true;
}
