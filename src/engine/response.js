/**
 * ★ THE RESPONSE BEAT — what the commitment CAUSED. (EVS-2)
 *
 * ============================================================================
 * FPE-02: A COMMITMENT RECEIVES AN IMMEDIATE CAUSAL RESPONSE BEFORE
 * NAVIGATION ADVANCES.
 * ============================================================================
 * Until EVS-2 the runner applied the effects and moved to the next scene in one
 * call. The player chose, and got another page. This module assembles what they
 * should have got instead: the option they chose, what moved, and how the world
 * answered.
 *
 * ============================================================================
 * ⚠️ WHAT IS AUTHORED AND WHAT IS COMPOSED — THE DISTINCTION IS THE POINT
 * ============================================================================
 * EVS-1 established what Chapter 1 canon actually contains: the operational
 * consequence and state change for each pathway, NO post-commitment narration
 * anywhere, and character reactions for EXACTLY ONE decision — Scene 4, where
 * Fadl, Maha and Rami each act differently per pathway.
 *
 * So this module has two modes, and never blurs them:
 *
 *   AUTHORED  `narrative_response` / `character_response` are rendered as
 *             written. Nothing is added to them and nothing is inferred.
 *   DERIVED   `narrative_response` is null, so a THIN response is composed from
 *             the option's own `protects`, `risks` and visible effects —
 *             restricted to the sources `derived_from` declares.
 *
 * ★ AND A CHARACTER REACTION IS NEVER DERIVED. There is no honest way to
 * compose one: `protects` and `risks` are the option's properties, not a
 * person's, and putting a name in front of them would be inventing a
 * performance. Where canon is silent the response carries no character, and
 * says so through provenance rather than through a sentence nobody wrote.
 *
 * The derived form is sufficient to prove EVS-2's chronology. It is NOT
 * production-complete narrative content, and `provenance` is what keeps that
 * visible instead of letting a thin beat pass for a finished one.
 */

export class ResponseRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/** The only sources a derived narrative may draw on. `contracts` owns the enum. */
const DERIVABLE = new Set(['protects', 'risks', 'effects']);

/**
 * Assemble the response to one committed option.
 *
 * `changes` comes from `choose()` — the visible state moves. They are passed in
 * rather than recomputed here, because the response must describe the SAME
 * application the run recorded. Recomputing would be a second evaluation of
 * something that already happened, and the two would eventually disagree.
 */
export function composeResponse({ scene, decision, optionId, changes = [] }) {
  const option = decision?.options?.find((o) => o.id === optionId);
  if (!option) throw new ResponseRefusal('unknown-option', optionId);

  const ie = scene?.immediate_effect;
  if (!ie) throw new ResponseRefusal('scene-has-no-immediate-effect', scene?.id);

  const authored = ie.responses.find((r) => r.option_id === optionId);
  // EVS-1's engine rule refuses a scene whose responses do not cover every
  // option, so reaching here means a bundle was assembled by hand.
  if (!authored) throw new ResponseRefusal('option-has-no-immediate-effect', optionId);

  const narrative = authored.narrative_response
    ? { provenance: 'authored', key: authored.narrative_response.key }
    : derive(authored, option, changes);

  return Object.freeze({
    optionId,
    label: option.label,
    narrative,
    // ★ Verbatim, or empty. Never composed.
    characters: authored.character_response ?? [],
    charactersProvenance: authored.character_response ? 'authored' : 'canon-silent',
    // The state moves, kept SEPARATE from the narrative. A derived narrative may
    // be forbidden from citing the effects (sc-01-01's keep-schedule declares
    // only protects and risks) while the changes themselves are still shown —
    // they are what happened, not a way of describing it.
    changes,
    turn: scene.turn,
    unresolved: authored.unresolved ?? [],
  });
}

/**
 * The thin composition. Restricted to the sources the content DECLARES.
 *
 * ⚠️ `derived_from` is not decoration. `dec-01-gate-access.keep-schedule`
 * declares ['protects', 'risks'] and not 'effects', so its narrative must not
 * cite the state moves. Honouring the declaration is what makes it a contract
 * rather than a comment — and it is testable, which a comment is not.
 */
function derive(authored, option, changes) {
  const from = authored.derived_from ?? [];
  for (const source of from) {
    if (!DERIVABLE.has(source)) throw new ResponseRefusal('underivable-source', source);
  }
  if (from.length === 0) {
    // EVS-1's schema refuses this shape. If it arrives, the beat would be blank.
    throw new ResponseRefusal('nothing-to-derive-the-response-from', option.id);
  }

  return {
    provenance: 'derived',
    from,
    // FPE-03: the response names BOTH the protected value and the cost. Both
    // come from the option, both were visible before the commitment, and
    // showing them again after it is a restatement rather than a revelation —
    // which is exactly why this is thin and marked as such.
    protects: from.includes('protects') ? option.protects : null,
    risks: from.includes('risks') ? option.risks : null,
    citesChanges: from.includes('effects') && changes.length > 0,
  };
}
