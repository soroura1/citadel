/**
 * The eleven season variables — `V1`–`V11`.
 *
 * ============================================================================
 * THESE MAP 1:1 TO CANON. AN INVENTED NAME IS A BUILD FAILURE. (R3 C3)
 * ============================================================================
 * `check-plan.sh` asserts eleven canon threads against eleven variables, and
 * that check exists because a plan revision once SPLIT one thread and DROPPED
 * "cast relationships" entirely — V10, the variable most of the season's
 * dialogue reads.
 *
 * The engine holds the same line: a variable the canon does not name cannot be
 * moved, and the attempt is refused by name rather than silently creating one.
 */

export const SEASON_VARIABLES = Object.freeze({
  V1:  'internal-trust',
  V2:  'external-trust',
  V3:  'workforce-capacity',
  V4:  'essential-service-continuity',
  V5:  'evidence-integrity',
  V6:  'implementation-completion',
  V7:  'distributed-authority',
  V8:  'harm-and-transferred-risk',
  V9:  'access-and-supply',
  V10: 'cast-relationships',
  V11: 'public-recognition',
});

/**
 * Bands, ordered weakest to strongest.
 *
 * ★ A BAND, NEVER A NUMBER SHOWN TO THE PLAYER.
 *
 * Numbers invite optimisation, and optimising a resilience state is exactly the
 * behaviour this product must not teach (`DEC-005`: gamify the learning
 * behaviour, never the safety state). Bands are also stable under retuning —
 * changing a weight must not invalidate authored content.
 */
export const BANDS = Object.freeze(['critical', 'strained', 'adequate', 'strong']);

export const isSeasonVariable = (id) => Object.hasOwn(SEASON_VARIABLES, id);

/** V8 is HARM. "Up" is worse, and the engine must never assume otherwise. */
export const HIGHER_IS_WORSE = Object.freeze(['V8']);

export function initialState({ startingBand = 'adequate' } = {}) {
  if (!BANDS.includes(startingBand)) {
    throw new Error(`unknown band: ${startingBand}`);
  }
  return Object.fromEntries(Object.keys(SEASON_VARIABLES).map((v) => [v, startingBand]));
}

/** Move a band by steps, clamped. Returns the new band. */
export function moveBand(band, steps) {
  const i = BANDS.indexOf(band);
  if (i === -1) throw new Error(`unknown band: ${band}`);
  return BANDS[Math.min(BANDS.length - 1, Math.max(0, i + steps))];
}
