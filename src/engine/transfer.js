/**
 * ★ THE TRANSFER WEAVE — R3 Phase E.
 *
 * ============================================================================
 * THIS IS THE PRODUCT'S PROPOSITION EXPRESSED AS SOFTWARE.
 * ============================================================================
 * Without it the fiction, the catalogue and the output system can each work
 * perfectly and the player still receives NO CREDIBLE ROUTE from recognising
 * something in the Bimaristan to doing something in their own hospital.
 *
 * A binding is: scene decision -> capability block -> a section of the player's
 * own output, plus the question they are asked about THEIR hospital.
 */

export class TransferRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * Resolve a binding against the live catalogue. (E2, E3)
 *
 * ⚠️ AN UNRESOLVABLE REFERENCE FAILS THE BUILD, NOT THE PLAYER.
 *
 * A binding that breaks at play time breaks in front of a hospital
 * professional, in the moment the product is asking them to trust it.
 */
export function resolveBinding(binding, catalogue) {
  const ref = binding.capability_block_ref;
  if (!ref?.block_id) throw new TransferRefusal('binding-has-no-block', binding.from?.decision_id);

  const block = catalogue.block(ref.block_id, ref.block_version);
  if (!block) {
    throw new TransferRefusal(
      'capability-block-not-found',
      `${ref.block_id}@${ref.block_version} in catalogue ${catalogue.version}`,
    );
  }

  return {
    ...binding,
    resolved: {
      block_id: block.id,
      block_version: block.version,
      // ★ E3: THE CATALOGUE VERSION IS PINNED AT PUBLICATION.
      //
      // Unpinned, the tool can change under a published scene and the player's
      // output stops meaning what it meant. An output must mean in a year what
      // it meant when it was written.
      catalogue_version: catalogue.version,
      // ★ E6: THE REFERENCE, NEVER A COPY.
      //
      // Copying the block's text into the output creates a second source of
      // truth that ages alone -- and the copy is the one the player keeps.
      // What travels is the identity; the text is resolved when read.
      title_key: block.title?.key ?? null,
    },
  };
}

/**
 * Identity of a resolved reference.
 *
 * ⚠️ `tool_id` IS DELIBERATELY ABSENT (contracts v0.3.1). A block is shared
 * across tools; keying identity by tool would give one block two identities and
 * a facility doing one piece of work would be credited twice or not at all.
 */
export const refIdentity = (r) => `${r.block_id}@${r.block_version}#${r.catalogue_version}`;

/**
 * The bridge prompt. (E4)
 *
 * ⚠️ The question is about THEIR hospital, not the Bimaristan. A prompt that
 * asks about the fiction produces an observation about the fiction, which is
 * exactly the thing this product must not deliver.
 */
export function bridgePrompt(binding, t) {
  const key = binding.bridge_prompt?.key;
  if (!key) throw new TransferRefusal('binding-has-no-bridge-prompt', binding.from?.decision_id);
  return { key, text: t ? t(key) : null, aboutTheirHospital: true };
}

/**
 * Build the output section a binding lands in. (E5, E6)
 *
 * ★ E7: `citadel` AWARDS NO CAPABILITY CREDIT, AND THIS IS WHERE IT WOULD.
 *
 * If a player's work qualifies as evidence it is submitted against the SAME
 * block in `checklist-api`, which stays the single calculator. Two surfaces
 * crediting one piece of work is the parallel-credit failure -- a facility
 * credited once, twice, or not at all depending which surface it opened.
 *
 * So the returned section carries a REFERENCE and an observation, and no
 * completion, score, percentage or award of any kind.
 */
export function outputSection(binding, { observation, decisionId, roleId } = {}) {
  if (!binding.resolved) throw new TransferRefusal('binding-not-resolved', binding.from?.decision_id);

  return Object.freeze({
    section_id: binding.to?.section_id ?? null,
    template_id: binding.to?.output_template_id ?? null,
    from: { scene_id: binding.from?.scene_id, decision_id: decisionId ?? binding.from?.decision_id, role_id: roleId ?? null },
    // Provenance travels as identity, resolved at read time.
    capability_reference: binding.resolved,
    // What the participant said about their OWN hospital.
    observation: observation ?? null,
    // Named so the absence is greppable, and so a later engineer who adds a
    // score has to delete a line that says why they must not.
    credit: null,
    creditIsCalculatedBy: 'checklist-api',
  });
}

/**
 * The computed binding manifest. (E8, D12)
 *
 * ⚠️ `unbound_transfer` is an HONEST state while the catalogue is thin — it is
 * NOT the same as an author forgetting, and the manifest says which is which.
 * The bindings cannot be authored before the tools exist: batch B1 is one tool.
 */
export function bindingManifest(scenes, catalogue) {
  const bound = [];
  const unbound = [];
  const broken = [];

  for (const scene of scenes) {
    for (const binding of scene.transfer_bindings ?? []) {
      const where = `${scene.id}/${binding.from?.decision_id ?? '?'}`;
      if (!binding.capability_block_ref?.block_id) {
        unbound.push({ where, reason: 'unbound_transfer', note: 'no block named yet — the catalogue is thin, not the author absent' });
        continue;
      }
      try {
        bound.push({ where, ref: refIdentity(resolveBinding(binding, catalogue).resolved) });
      } catch (e) {
        broken.push({ where, refusal: e.refusal, detail: e.detail });
      }
    }
  }
  return { bound, unbound, broken, generatedAt: null };
}
