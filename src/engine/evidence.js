/**
 * ★ WHAT CAN BE LEARNED, FROM WHOM, AND BY WHICH ROLE. (EVS-4)
 *
 * ============================================================================
 * THE PARTICIPANT WAS READING PROSE AND CHOOSING FROM A MENU
 * ============================================================================
 * Through EVS-3 a scene presented its authored movements and then its options.
 * Nothing was found; everything was told. Canon asks for the opposite twice, by
 * name:
 *
 *   "place detailed timings in OPTIONAL INSPECTION or the later review rather
 *    than long crisis dialogue"
 *   "The selected role supplies one direct authority. The player must SEEK
 *    OTHER JUDGMENTS from named clinical, nursing, operational, safety,
 *    information, and city partners."
 *
 * So `inspect` and `consult` were transcribed rather than designed, and the
 * third action — commit — already existed.
 *
 * ============================================================================
 * ★ EVIDENCE HAS A SOURCE, BECAUSE THE CHAPTER TURNS ON THAT
 * ============================================================================
 * Chapter 1's whole shape is two people reading accurate information in
 * different rooms and reaching different conclusions: the Hall reads "backup
 * generation active", which is true, while eight ICU beds have no supply, which
 * is also true. A run that holds one world state cannot express that. A run
 * that holds WHO SAID WHAT can — so a discovery records the action it came
 * through and the person, instrument, place or record behind it.
 */

import { SELECTABLE_ROLES } from './roles.js';

export class EvidenceRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

export const evidenceIndex = (scene) =>
  new Map((scene.evidence ?? []).map((e) => [e.id, e]));

export const actionIndex = (scene) =>
  new Map((scene.actions ?? []).map((a) => [a.id, a]));

/** Is this action offered to this role at all? Null visibility means everyone. */
export const visibleTo = (action, role) =>
  action.visible_to_roles == null || action.visible_to_roles.includes(role);

/**
 * The actions a participant can take right now.
 *
 * ⚠️ TAKEN ACTIONS DO NOT REAPPEAR. An action offered again after it has been
 * taken invites clicking everything twice, which teaches that the actions are
 * scenery. `requires` is checked against what is HELD, not against what has
 * been done — the sealed arch opens because the shared board is known, and it
 * would open just the same if that were learned another way.
 */
export function availableActions(scene, { role, held = new Set(), taken = new Set() } = {}) {
  return (scene.actions ?? []).filter((a) =>
    visibleTo(a, role)
    && !taken.has(a.id)
    && (a.requires ?? []).every((id) => held.has(id)));
}

/**
 * Everything wrong with a scene's actions and evidence, NAMED.
 *
 * The schema governs one document. These need two things at once — an action
 * and the evidence it claims to reveal — or the whole content set.
 */
export function evidenceRefusals(scene) {
  const out = [];
  const evidence = evidenceIndex(scene);

  for (const action of scene.actions ?? []) {
    for (const id of action.reveals) {
      if (!evidence.has(id)) out.push({ refusal: 'action-reveals-unknown-evidence', detail: `${action.id} -> ${id}` });
    }
    for (const id of action.requires ?? []) {
      if (!evidence.has(id)) out.push({ refusal: 'action-requires-unknown-evidence', detail: `${action.id} -> ${id}` });
    }
    // ⚠️ Only a person can decline. An `inspect` carrying a response would be a
    // room answering back, which is a different mechanic wearing this one's name.
    if (action.type === 'inspect' && action.response) {
      out.push({ refusal: 'inspection-cannot-respond', detail: action.id });
    }
    if (action.type === 'consult' && action.target.kind !== 'person') {
      out.push({ refusal: 'consult-must-address-a-person', detail: `${action.id} -> ${action.target.kind}` });
    }
  }

  // ★ Evidence nothing reveals is evidence nobody can reach.
  const revealed = new Set((scene.actions ?? []).flatMap((a) => a.reveals));
  for (const e of scene.evidence ?? []) {
    if (!revealed.has(e.id)) out.push({ refusal: 'evidence-no-action-reveals', detail: e.id });
  }

  // A reveal wired to evidence that is not in this scene.
  for (const r of scene.required_reveals ?? []) {
    for (const id of r.evidence_ids ?? []) {
      if (!evidence.has(id)) out.push({ refusal: 'reveal-names-unknown-evidence', detail: `${r.id} -> ${id}` });
    }
  }

  return out;
}

/**
 * ★ THE GUARANTEE, RE-PROVEN NOW THAT EVIDENCE IS ROLE-FILTERED. (EVS-4)
 *
 * ============================================================================
 * CANON: "A required mystery clue may be encountered through different roles,
 * but IT CANNOT DISAPPEAR BECAUSE OF ROLE SELECTION."
 * ============================================================================
 * EVS-3's check was that every role had a route SENTENCE for every reveal. That
 * was true of prose and said nothing about play. The moment an action carries
 * `visible_to_roles`, a reveal can become genuinely unreachable for one role —
 * and it looks completely correct in review, because the other role reaches it.
 *
 * ⚠️ `requires` MUST BE FOLLOWED, NOT IGNORED. An action gated behind evidence
 * only helps if that evidence is itself reachable by the same role, so this
 * closes over the chain rather than checking one step.
 */
export function reachableEvidenceFor(scene, role) {
  const held = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const a of scene.actions ?? []) {
      if (!visibleTo(a, role)) continue;
      if (!(a.requires ?? []).every((id) => held.has(id))) continue;
      for (const id of a.reveals) if (!held.has(id)) { held.add(id); grew = true; }
    }
  }
  return held;
}

export function unreachableRevealsByRole(scenes, roles = SELECTABLE_ROLES.map((r) => r.id)) {
  const out = [];
  for (const scene of scenes) {
    for (const reveal of scene.required_reveals ?? []) {
      const wanted = reveal.evidence_ids ?? [];
      if (wanted.length === 0) continue;
      for (const role of roles) {
        const reachable = reachableEvidenceFor(scene, role);
        const missing = wanted.filter((id) => !reachable.has(id));
        if (missing.length) {
          out.push({
            refusal: 'required-reveal-unreachable-for-role',
            detail: `${scene.id}/${reveal.id} unreachable for ${role}: ${missing.join(', ')}`,
          });
        }
      }
    }
  }
  return out;
}

export function assertRevealsReachableByEveryRole(scenes, roles) {
  const failures = unreachableRevealsByRole(scenes, roles);
  if (failures.length) {
    throw new EvidenceRefusal('required-reveal-unreachable-for-role',
      failures.map((f) => f.detail).join('; '));
  }
  return true;
}
