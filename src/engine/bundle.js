/**
 * Bundle loading and validation. (R3 C1, C12)
 *
 * ★ VALIDATION HAPPENS AT LOAD, AND NAMES THE FIELD.
 *
 * "Invalid bundle" is not an error message, it is an apology. A content author
 * needs to know which scene and which field, or the three-stage validation the
 * authoring model promises collapses into one unusable stage.
 */

import { assertSceneShape, assertRevealsReachable } from './scene.js';
import { assertDecisionIsReal } from './decision.js';
import { evidenceRefusals, unreachableRevealsByRole } from './evidence.js';

export class BundleRefusal extends Error {
  constructor(refusal, where, detail) {
    super(`${refusal} at ${where}${detail ? `: ${detail}` : ''}`);
    this.refusal = refusal;
    this.where = where;
    this.detail = detail;
  }
}

export function loadBundle({ version, scenes = [], decisions = [] }) {
  if (!version) throw new BundleRefusal('bundle-has-no-version', 'bundle');

  const byId = new Map();
  for (const scene of scenes) {
    try {
      assertSceneShape(scene);
      assertRevealsReachable(scene);
      // ★ EVS-4 — AN ACTION POINTING AT EVIDENCE THAT DOES NOT EXIST FAILS
      // HERE, not when a participant clicks it. Same rule as a scene pointing
      // at an absent decision: a content author needs the field named, and a
      // player must never be the one who finds a dangling reference.
      const broken = evidenceRefusals(scene);
      if (broken.length) {
        const e = new Error(broken[0].detail);
        e.refusal = broken[0].refusal;
        e.detail = broken.map((b) => `${b.refusal}: ${b.detail}`).join('; ');
        throw e;
      }
    } catch (e) {
      throw new BundleRefusal(e.refusal ?? 'scene-invalid', scene.id ?? '(unnamed scene)', e.detail ?? e.message);
    }
    byId.set(scene.id, scene);
  }

  const decisionsById = new Map();
  for (const decision of decisions) {
    try {
      assertDecisionIsReal(decision);
    } catch (e) {
      throw new BundleRefusal(e.refusal ?? 'decision-invalid', decision.id ?? '(unnamed decision)', e.detail ?? e.message);
    }
    decisionsById.set(decision.id, decision);
  }

  // A scene pointing at a decision that is not in the bundle fails HERE, not
  // when a player reaches it.
  for (const scene of scenes) {
    const ref = scene.choice_or_discovery;
    if (typeof ref === 'string' && ref.startsWith('dec-') && !decisionsById.has(ref)) {
      throw new BundleRefusal('scene-references-unknown-decision', scene.id, ref);
    }
  }

  // ★ THE GUARANTEE IS A LOAD-TIME PROPERTY, NOT A TEST-TIME ONE. (EVS-4)
  //
  // Canon: "A required mystery clue may be encountered through different roles,
  // but IT CANNOT DISAPPEAR BECAUSE OF ROLE SELECTION." Once actions carry
  // `visible_to_roles` a reveal can become genuinely unreachable for one role,
  // and it looks correct in review because the other role reaches it. A bundle
  // that breaks the promise must not load at all.
  const unreachable = unreachableRevealsByRole(scenes);
  if (unreachable.length) {
    throw new BundleRefusal('required-reveal-unreachable-for-role',
      unreachable[0].detail.split('/')[0], unreachable.map((u) => u.detail).join('; '));
  }

  return {
    version,
    scenes: byId,
    decisions: decisionsById,
    scene: (id) => byId.get(id),
    decision: (id) => decisionsById.get(id),
  };
}

/**
 * Save and resume, PINNED TO THE BUNDLE VERSION. (C12)
 *
 * ⚠️ A participant mid-run keeps the version they played.
 *
 * The authoring model is explicit: someone who played Chapter 1 under an
 * earlier bundle must keep the Chapter 1 they played. Resuming them into a
 * corrected bundle would rewrite their history — the scene they remember would
 * no longer be the scene that happened, and every later reference to it becomes
 * a lie the player can detect.
 */
export function save(run) {
  return JSON.stringify({
    bundleVersion: run.bundleVersion,
    sceneId: run.sceneId,
    role: run.role,
    state: run.state,
    savedAt: run.savedAt ?? null,
  });
}

export function resume(serialised, bundle) {
  const run = JSON.parse(serialised);
  if (run.bundleVersion !== bundle.version) {
    // Not an error to swallow — the caller must decide, and the honest options
    // are "load the pinned bundle" or "tell them their run cannot continue".
    // Silently continuing is the one option that is never right.
    const e = new BundleRefusal('run-pinned-to-another-bundle', run.sceneId,
      `run is ${run.bundleVersion}, bundle is ${bundle.version}`);
    e.runVersion = run.bundleVersion;
    throw e;
  }
  return run;
}
