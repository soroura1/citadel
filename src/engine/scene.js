/**
 * The scene state machine — the six movements. (R3 C2)
 *
 * A scene is not a screen. It is an ordered shape, and a scene missing a
 * movement is not a short scene — it is a broken one.
 */

export const MOVEMENTS = Object.freeze([
  'orientation',        // what matters now
  'desire',             // who wants what — at least one character
  'friction',           // what is in the way
  'choice_or_discovery',// the decision, or the thing learned
  'turn',               // what changes
  'residue',            // what is left behind, and which thread advanced
]);

export class SceneRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ★ A scene with only orientation is REJECTED. (C2)
 *
 * This is the failure mode of a serious game written under deadline: the setup
 * gets authored, the cost does not, and what ships is a briefing wearing a
 * scene's name. Refusing at load time means it cannot reach a player.
 */
export function assertSceneShape(scene) {
  const missing = MOVEMENTS.filter((m) => {
    const v = scene[m];
    if (v === undefined || v === null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'string') return v.trim() === '';
    return false;
  });
  if (missing.length) {
    throw new SceneRefusal('scene-missing-movements', missing.join(', '));
  }
  return true;
}

/** Movements in canon order, for a renderer that must not reorder them. */
export const movementsOf = (scene) => MOVEMENTS.map((m) => ({ movement: m, content: scene[m] }));

/**
 * ★ REQUIRED-REVEAL REACHABILITY. (C11)
 *
 * Canon guarantees the clue REGARDLESS OF ROLE. That promise is only worth
 * something if it is mechanically held — a reveal reachable on three of four
 * role paths is a promise broken for one player in four, and it is invisible in
 * review because each path looks complete on its own.
 *
 * The candidate schema carries `reachable_on_all_role_paths` as a field the
 * author sets. A self-declaration is not a check; this is the check.
 */
export function unreachableReveals(scene) {
  const reveals = scene.required_reveals ?? [];
  const roles = (scene.role_variants ?? []).map((r) => r.role ?? r.role_id ?? r.id).filter(Boolean);
  if (reveals.length === 0) return [];
  // With no role variants every path is the same path, so every reveal is reached.
  if (roles.length === 0) return [];

  const failures = [];
  for (const reveal of reveals) {
    const id = reveal.id ?? reveal;
    // A reveal may name the roles it is withheld from. Any such naming is a
    // canon violation for a GUARANTEED reveal -- that is the point.
    const withheld = reveal.withheld_from ?? [];
    const reachedBy = roles.filter((r) => !withheld.includes(r));
    if (reachedBy.length !== roles.length) {
      failures.push({ reveal: id, unreachableFor: roles.filter((r) => withheld.includes(r)) });
    }
  }
  return failures;
}

export function assertRevealsReachable(scene) {
  const failures = unreachableReveals(scene);
  if (failures.length) {
    throw new SceneRefusal(
      'required-reveal-unreachable',
      failures.map((f) => `${f.reveal} unreachable for ${f.unreachableFor.join(', ')}`).join('; '),
    );
  }
  return true;
}
