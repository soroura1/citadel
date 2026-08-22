/**
 * R0-C02 — SEEDED, DETERMINISTIC PSEUDO-RANDOMNESS.
 *
 * ★ THE SAME SEED MUST PRODUCE THE SAME MORNING, FOREVER. `Math.random()` would
 * make replay impossible, make a bug unreproducible and make the debrief's
 * causal chain unfalsifiable — the participant could not test another approach
 * against the same conditions, which is R0-S5's whole acceptance.
 *
 * mulberry32: small, fast, and adequate for bounded ordinary variation. It is
 * not cryptographic and nothing here needs it to be.
 *
 * ⚠️ THE GENERATOR IS PART OF THE STATE, NOT A MODULE GLOBAL. Two runs open in
 * one browser must not share a cursor, and a replay must start where the
 * original started.
 */
export function rng(seed) {
  let a = (seed >>> 0) + 0x6d2b79f5;
  return {
    /** Next float in [0, 1). */
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** The cursor, so a save can resume the same sequence. */
    cursor: () => a >>> 0,
  };
}

/**
 * A bounded jitter around a centre, in units of `spread`.
 *
 * ⚠️ BOUNDED IS THE POINT. `gameplay-and-state.md` § 12: "Randomness never
 * removes required evidence or makes rules unknowable." Ordinary variation
 * makes two runs feel alive; it may not move a state across the band boundary
 * that a participant is being asked to read.
 */
export function jitter(generator, centre, spread) {
  return centre + (generator.next() - 0.5) * 2 * spread;
}
