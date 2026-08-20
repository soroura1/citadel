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
  version: 'v0.3',
  scenes: [s1, s2, s3, s4],
  decisions: [d1, d2, d3, d4],
  order: ["sc-01-01", "sc-01-02", "sc-01-03", "sc-01-04"],
};
