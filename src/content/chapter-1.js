/**
 * Chapter 1 as an importable bundle — R3, until Phase D's pipeline serves it.
 *
 * ⚠️ THE ORDER IS DECLARED HERE, not inferred from the filenames. Sorting
 * identifiers is an inference dressed as a rule: it breaks silently the first
 * time a scene is inserted or renamed.
 */
import s1 from './scenes/sc-01-01.json' with { type: 'json' };
import s2 from './scenes/sc-01-02.json' with { type: 'json' };
import s3 from './scenes/sc-01-03.json' with { type: 'json' };
import s4 from './scenes/sc-01-04.json' with { type: 'json' };
import d1 from './decisions/dec-01-closure-characterization.json' with { type: 'json' };
import d2 from './decisions/dec-01-critical-path.json' with { type: 'json' };
import d3 from './decisions/dec-01-gate-access.json' with { type: 'json' };
import d4 from './decisions/dec-01-power-pressure.json' with { type: 'json' };

export const CHAPTER_1 = {
  // ⚠️ BUMPED AT EVS-1, from v0.1. The scenes gained `staging` and
  // `immediate_effect`, which change WHEN their material is presented. A run
  // saved under v0.1 must not resume into a chapter that is staged differently
  // from the one it played -- `resume()` refuses the mismatch by design, and
  // that refusal is the whole reason the version is pinned into the save.
  //
  // ⚠️ v0.5 -> v0.6 AT SG1-2, AND THE RULE IS THE SAME ONE.
  //
  // The gold decision gained `commits`, `transfers_pressure_to` and a
  // per-pathway `residue`, and the record now reads all three -- so a run saved
  // under v0.5 would resume into a chapter whose RECORD OF WHAT IT DID is
  // different from the one it played: a residue it never saw, a cost it was
  // never shown. Scene 2's cast list also changed, from a paraphrase back to
  // canon's own names.
  //
  // No production run has ever been saved (the application never calls
  // `saveRun`), so nothing is stranded today. The bump is not for today: it is
  // so the version keeps meaning what the pinning says it means, on the day
  // `E14` wires the store up.
  version: 'v0.6',
  scenes: [s1, s2, s3, s4],
  decisions: [d1, d2, d3, d4],
  order: ["sc-01-01", "sc-01-02", "sc-01-03", "sc-01-04"],
};
