/**
 * ★ THE RECORD — what happened, reconstructable. (EVS-6)
 *
 * ============================================================================
 * FPE-04: "THE SPECIFIC OPTION CHOSEN IS PERMANENTLY READABLE IN THE RECORD."
 * ============================================================================
 * Its stated failure is *"a chapter end that lists only scene titles"*, and that
 * is exactly what `ChapterEnd` did — flagged at EVS-2, owned by this session.
 * A participant who cannot say what they did cannot debrief, and a debrief they
 * cannot ground is a quiz about a story.
 *
 * ============================================================================
 * ⚠️ BUILT FROM HISTORY. NOTHING IS RECOMPUTED.
 * ============================================================================
 * The record is a SECOND VIEW of what the run already holds, and a second view
 * is a second copy the moment it derives anything for itself. `commit()` writes
 * the evidence held and the changes applied at the moment they happen; this
 * reads them.
 *
 * The price of holding a second copy is proving it agrees with the first, which
 * is what `recordRefusals` is for.
 */

import { worldMemory } from './place.js';

export class RecordRefusal extends Error {
  constructor(refusal, detail) {
    super(detail ? `${refusal}: ${detail}` : refusal);
    this.refusal = refusal;
    this.detail = detail;
  }
}

/**
 * The whole chapter, as the participant lived it.
 *
 * ⚠️ A HISTORY ENTRY WITHOUT `changes` IS REFUSED, NOT DEFAULTED. Runs saved
 * before bundle v0.5 have none, and `?? []` would render "nothing changed" for
 * a commitment that changed something — FPE-04 broken quietly, which is worse
 * than broken loudly.
 */
export function buildRecord(run, bundle) {
  const byId = new Map((run.discovered ?? []).map((d) => [d.evidenceId, d]));

  const scenes = run.history.map((entry) => {
    if (!Array.isArray(entry.changes)) {
      throw new RecordRefusal('history-entry-has-no-changes', `${entry.sceneId} (a run saved before bundle v0.5)`);
    }
    const scene = bundle.scene(entry.sceneId);
    const decision = bundle.decision(entry.decisionId);
    const option = decision?.options.find((o) => o.id === entry.optionId);

    return Object.freeze({
      sequence: entry.sequence,
      sceneId: entry.sceneId,
      bell: scene?.bell ?? null,

      // ★ WHAT THEY HAD FOUND OUT WHEN THEY COMMITTED — with its provenance,
      // so a debrief can ask where a belief came from rather than treating
      // every held fact as equally sound.
      evidenceConsulted: (entry.evidenceHeld ?? [])
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((d) => ({ evidenceId: d.evidenceId, what: d.what, source: d.source, via: d.via })),

      // ★ FPE-04 — the option itself, not the scene it was in.
      option: option ? { id: option.id, labelKey: option.label.key, protects: option.protects } : null,
      committedAs: entry.committedAs,
      authorityHeldBy: entry.authorityHeldBy,

      // What improved, and what was consumed or transferred. Both, in the same
      // list, unranked — the record does not sort a cost below a benefit.
      changes: entry.changes,

      // ★ SG-1 C8 — WHAT THIS COMMITMENT COST, AND WHERE IT WENT.
      //
      // ⚠️ THE SCENE'S RESIDUE WAS THE SAME SENTENCE WHATEVER THEY CHOSE.
      // Three pathways leave three genuinely different worlds behind, and the
      // record described all three identically — so the debrief could not
      // reconstruct a cost, because the cost was not in it.
      //
      // Per-option residue is preferred and the scene's is the fallback, so a
      // scene whose options carry none still reads as it did.
      committed: (option?.commits ?? []).map((c) => ({
        capability: c.capability, becomes: c.becomes, forWhat: c.for ?? null,
      })),
      transferredTo: option?.transfers_pressure_to ?? null,
      residue: (option?.residue ?? []).length
        ? option.residue.map((r) => ({ what: r.what, bindsTo: r.binds_to }))
        : (scene?.residue ?? null),
    });
  });

  return Object.freeze({
    bundleVersion: run.bundleVersion,
    role: run.role,
    scenes,
    // What the Bimaristan is still carrying, and what is still owed to a
    // chapter that does not exist yet. Named, never counted — a number here
    // would be a score.
    worldMemory: worldMemory(run),
    owed: run.state.pending ?? [],
    arrived: run.arrived ?? [],
  });
}

/**
 * ★ THE RECORD AND THE WORLD MUST AGREE. (EVS-6)
 *
 * ============================================================================
 * THE RECORD IS THE SECOND COPY, BY DESIGN. THIS IS THE PRICE OF THAT.
 * ============================================================================
 * A record that says one thing while the state says another is worse than no
 * record: the participant debriefs from the record, and the next chapter runs
 * from the state. They would diverge silently and the divergence would surface
 * as a story that stopped making sense.
 */
export function recordRefusals(record, run, bundle) {
  const out = [];
  const chapter = run.state?.chapter ?? {};

  for (const scene of record.scenes) {
    if (!scene.option) {
      out.push({ refusal: 'record-names-no-option', detail: scene.sceneId });
      continue;
    }
    const decision = bundle.decision(run.history.find((h) => h.sequence === scene.sequence)?.decisionId);
    const option = decision?.options.find((o) => o.id === scene.option.id);
    for (const effect of option?.effects ?? []) {
      if (effect.operation !== 'set_enum' || effect.delay !== 'immediate') continue;
      if (chapter[effect.enum_variable] !== effect.enum_value) {
        out.push({
          refusal: 'record-disagrees-with-world-state',
          detail: `${scene.sceneId}: ${effect.enum_variable} is ${chapter[effect.enum_variable]}, the record says ${effect.enum_value}`,
        });
      }
    }
  }

  if (record.bundleVersion !== run.bundleVersion) {
    out.push({ refusal: 'record-pinned-to-another-bundle', detail: record.bundleVersion });
  }
  return out;
}

export function assertRecordAgrees(record, run, bundle) {
  const failures = recordRefusals(record, run, bundle);
  if (failures.length) {
    throw new RecordRefusal(failures[0].refusal, failures.map((f) => f.detail).join('; '));
  }
  return true;
}
