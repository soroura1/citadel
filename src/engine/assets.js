/**
 * Asset slots and the computed asset manifest. (R3 G1, G2)
 *
 * ★ ART IS ADDITIVE. PLAY NEVER DEPENDS ON AN IMAGE.
 *
 * A scene that cannot be played without its illustration excludes every
 * participant on a slow connection, every screen-reader user, and every printed
 * or facilitated session. `static_fallback` and `text_equivalent` are not
 * degradations — they are the floor the art sits on top of.
 */

export class AssetRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * ⚠️ A scene missing its text equivalent is REFUSED, not warned about.
 *
 * `DEC-012` and the text path (`F7`) both depend on it, and a scene that ships
 * without one has quietly removed an access path that nobody will notice is
 * missing until somebody needs it.
 */
export function assertPlayableWithoutArt(scene) {
  if (!scene.text_equivalent) {
    throw new AssetRefusal('scene-has-no-text-equivalent', scene.id);
  }
  for (const slot of scene.asset_slots ?? []) {
    // ⚠️ A STRING IS REFUSED. Until contracts v0.7.0 the content shipped bare
    // strings while this file read `slot.required`, `slot.id` and
    // `slot.asset_id` — so the REQUIRED check below could never fire and the
    // manifest reported every slot as `?`. Both were tested, on object fixtures
    // the content never produced. Refusing the old shape by name is what stops
    // it drifting back.
    if (typeof slot !== 'object' || slot === null) {
      throw new AssetRefusal('asset-slot-is-not-declared', `${scene.id}:${String(slot)}`);
    }
    // A slot may be EMPTY — the art is commissioned later. It may not be
    // REQUIRED, because that makes play depend on an image.
    if (slot.required === true) {
      throw new AssetRefusal('asset-slot-marked-required', `${scene.id}:${slot.id ?? '?'}`);
    }
    // ★ Declared BEFORE anything fills it. An image with no text equivalent
    // removes an access path nobody notices is missing until somebody needs it;
    // a budget agreed after the art arrives is a budget the art sets.
    if (!slot.alt_key) throw new AssetRefusal('asset-slot-has-no-alt-text', `${scene.id}:${slot.id}`);
    if (!(slot.max_bytes > 0)) throw new AssetRefusal('asset-slot-has-no-weight-budget', `${scene.id}:${slot.id}`);
    // ⚠️ A CANDIDATE IS NOT A BINDING. Claiming review without a named reviewer
    // is the shape `canApprove` refuses one repository over.
    if (slot.inclusion_reviewed && !slot.reviewed_by) {
      throw new AssetRefusal('asset-slot-claims-unattributed-review', `${scene.id}:${slot.id}`);
    }
  }
  return true;
}

/**
 * ★ THE COMPUTED ASSET MANIFEST. (G1)
 *
 * ============================================================================
 * DERIVED FROM THE SCENES. NEVER HAND-MAINTAINED.
 * ============================================================================
 * A scene names slot ids; an unfilled slot appears here rather than being
 * tracked in a document beside the content. The prior attempt maintained a
 * campaign matrix by hand and it carried four incorrect counts and a right
 * total — every row looked like an answer.
 */
export function assetManifest(scenes) {
  const filled = [];
  const unfilled = [];
  const candidates = [];
  const missingFallback = [];

  for (const scene of scenes) {
    if (!scene.static_fallback) missingFallback.push(scene.id);
    for (const slot of scene.asset_slots ?? []) {
      // ⚠️ `slot.id`, and it is now REALLY THERE. This read
      // `slot.id ?? slot.slot_id ?? '?'` against bare strings, so all eight of
      // Chapter 1's slots were reported as `sc-01-01:?` — a manifest that named
      // nothing, computed correctly, from the wrong shape.
      const where = `${scene.id}:${slot.id}`;
      (slot.asset_id ? filled : unfilled).push(where);
      if (slot.candidate_ref) candidates.push({ where, candidate: slot.candidate_ref, reviewed: Boolean(slot.inclusion_reviewed) });
    }
  }

  return {
    scenes: scenes.length,
    filled,
    // ⚠️ An unfilled slot is an HONEST state — the art is not commissioned yet.
    // It is not the same as a scene that cannot be played, which is why
    // missingFallback is reported separately.
    unfilled,
    // ★ A CANDIDATE IS NOT A BINDING. Six of Chapter 1's eight slots name a
    // concept in the story record; none has been through inclusion review, and
    // the record itself calls all eleven assets "v0.1 concepts pending
    // project-owner review".
    candidates,
    missingFallback,
    // Q10 gates BINDING a candidate as canonical, never building against slots.
    // Candidates may exist as watermarked, non-canonical material; calling one
    // approved is what is forbidden.
    bindingBlockedBy: unfilled.length ? 'Q10' : null,
  };
}
