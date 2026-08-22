/**
 * R0-C02 — THE FICTIONAL CLOCK.
 *
 * ============================================================================
 * ⛔ PAUSE MUST ACTUALLY STOP THE WORLD
 * ============================================================================
 * `gameplay-and-state.md` § 2: "The world may be paused, but it does not wait
 * for a dialogue choice." The inverse is this file's job — when the participant
 * pauses, fictional time and every operational process stop. Not slowed, not
 * hidden: stopped. A paused world that keeps advancing behind a frozen picture
 * is the one thing a pause control must never do, and it is testable directly.
 *
 * ============================================================================
 * ★ THE NON-TIMED PATH IS NOT A LESSER MODE
 * ============================================================================
 * `accessibility-and-play-modes.md` § 2 requires an act-advanced mode that
 * "preserves opportunity costs", and § 1 forbids a strategically easier or
 * thinner game. So `act-advanced` and `running` reach the SAME cycle through
 * the SAME command and produce the SAME events. The only difference is what
 * moves the clock: a timer, or the participant deciding they are ready.
 *
 * That is why there is one `ADVANCE_CYCLE` command rather than two. Two paths
 * would be two behaviours to keep in step, and this project has already learned
 * what happens to two shapes that must agree.
 */
import { CLOCK_MODES, SPEEDS } from './commands.js';

/** Fictional minutes one ordinary heartbeat cycle occupies. */
export const CYCLE_MINUTES = 20;

/** How many ordinary cycles the morning runs before the preparation window. */
export const ORDINARY_CYCLES = 2;

export const isPaused = (world) => world.time.mode === 'paused';

/** Time only moves when the world is not paused. */
export const timeMayAdvance = (world) => !isPaused(world);

/**
 * The bell a fictional minute falls in. Canon tells position in bells, not in
 * minutes past midnight — "First Bell to shortly after the Third Bell".
 */
export function bellAt(minute) {
  if (minute < 40) return 'first';
  if (minute < 80) return 'second';
  return 'third';
}

export const clockModes = () => [...CLOCK_MODES];
export const speeds = () => [...SPEEDS];
