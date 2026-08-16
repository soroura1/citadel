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
    // A slot may be EMPTY — the art is commissioned later. It may not be
    // REQUIRED, because that makes play depend on an image.
    if (slot.required === true) {
      throw new AssetRefusal('asset-slot-marked-required', `${scene.id}:${slot.id ?? '?'}`);
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
  const missingFallback = [];

  for (const scene of scenes) {
    if (!scene.static_fallback) missingFallback.push(scene.id);
    for (const slot of scene.asset_slots ?? []) {
      const where = `${scene.id}:${slot.id ?? slot.slot_id ?? '?'}`;
      (slot.asset_id ? filled : unfilled).push(where);
    }
  }

  return {
    scenes: scenes.length,
    filled,
    // ⚠️ An unfilled slot is an HONEST state — the art is not commissioned yet.
    // It is not the same as a scene that cannot be played, which is why
    // missingFallback is reported separately.
    unfilled,
    missingFallback,
    // Q10 gates BINDING a candidate as canonical, never building against slots.
    // Candidates may exist as watermarked, non-canonical material; calling one
    // approved is what is forbidden.
    bindingBlockedBy: unfilled.length ? 'Q10' : null,
  };
}
