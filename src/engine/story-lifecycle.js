/**
 * The story-content lifecycle. (R3 D3, D8, D9, D12)
 *
 * ★ REUSES R1'S RULES, NOT R1'S TABLES.
 *
 * `canTransition`, `canApprove` and the rest live in `@citadel/contracts`
 * precisely so a second content kind can obey the same rules without
 * inheriting a schema that does not fit it.
 */

import { canTransition, canApprove } from '@citadel/contracts/rules';

export class StoryRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ★ EDITOR SEPARATION, AND THE EMPTY-LIST TRAP. (D8)
 *
 * `canApprove` refuses only if the approver is IN the editor list. With an
 * empty list it returns ok for ANYONE — including whoever wrote the scene.
 * R1's batch B1 shipped exactly that, and the rule that guarantees an
 * independent reviewer guaranteed nothing while appearing enforced.
 *
 * So an approval on a version with NO recorded editors is refused here. "Nobody
 * edited this" is not a state a reviewable version can be in.
 */
export function approveScene(scene, reviewerId) {
  const editors = scene.editorial?.editors ?? [];
  if (editors.length === 0) {
    throw new StoryRefusal(
      'no-editor-recorded',
      `${scene.scene_id}@${scene.version} has an empty editor list — separation cannot be checked`,
    );
  }
  const verdict = canApprove(
    { lifecycleState: scene.lifecycle_state, editorial: scene.editorial },
    reviewerId,
  );
  if (!verdict.ok) throw new StoryRefusal(verdict.refusal, `${scene.scene_id}@${scene.version}`);
  return { ok: true, from: scene.lifecycle_state, to: 'approved' };
}

export function transitionScene(scene, to) {
  const verdict = canTransition(scene.lifecycle_state, to);
  if (!verdict.ok) throw new StoryRefusal(verdict.refusal, `${scene.lifecycle_state} -> ${to}`);
  return { ok: true, from: scene.lifecycle_state, to };
}

/**
 * The bundle builder. (D9, D10)
 *
 * ⚠️ ONLY APPROVED SCENES ENTER A BUNDLE. The authoring model requires
 * approved-only runtime reads, and a bundle is what the runtime reads.
 */
export function buildBundle({ version, catalogueVersion, scenes, builtBy }) {
  if (!version) throw new StoryRefusal('bundle-has-no-version');
  if (!catalogueVersion) {
    // Without it, transfer bindings cannot be pinned and an output stops
    // meaning what it meant. E3.
    throw new StoryRefusal('bundle-has-no-catalogue-version', version);
  }

  const notApproved = scenes.filter((s) => s.lifecycle_state !== 'approved');
  if (notApproved.length) {
    throw new StoryRefusal(
      'bundle-contains-unapproved-scene',
      notApproved.map((s) => `${s.scene_id}@${s.version} is ${s.lifecycle_state}`).join('; '),
    );
  }

  return {
    version,
    catalogueVersion,
    builtBy,
    scenes: scenes.map((s) => ({ scene_id: s.scene_id, scene_version: s.version })),
  };
}

/**
 * ★ THE COMPUTED CONTENT MANIFEST. (D12)
 *
 * ============================================================================
 * DERIVED FROM THE CONTENT. NEVER HAND-MAINTAINED.
 * ============================================================================
 * Same reasoning as the governance manifest and the asset manifest: a mapping
 * document maintained beside the data is a mapping document that drifts, and
 * the drift is invisible because each half reads fine alone.
 */
export function contentManifest(scenes, { bindingManifest } = {}) {
  const missingTextEquivalent = [];
  const unreviewed = [];
  const unfilledSlots = [];

  for (const s of scenes) {
    const doc = s.document ?? s;
    const id = `${s.scene_id ?? doc.id}@${s.version ?? '-'}`;
    if (!doc.text_equivalent) missingTextEquivalent.push(id);
    if ((s.lifecycle_state ?? 'draft') !== 'approved') unreviewed.push(id);
    for (const slot of doc.asset_slots ?? []) {
      if (!slot.asset_id) unfilledSlots.push(`${id}:${slot.id ?? slot.slot_id ?? '?'}`);
    }
  }

  return {
    scenes: scenes.length,
    unreviewed,
    missingTextEquivalent,
    unfilledSlots,
    // Bindings that name nothing yet — honest while the catalogue is thin.
    unboundTransfers: bindingManifest?.unbound?.map((u) => u.where) ?? [],
    // Bindings that name something which does not resolve — a different thing.
    brokenTransfers: bindingManifest?.broken?.map((b) => b.where) ?? [],
  };
}
