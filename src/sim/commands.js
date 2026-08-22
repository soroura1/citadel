/**
 * R0-C01 — COMMANDS, AND THE REASONS THEY ARE REFUSED.
 *
 * ============================================================================
 * PLAYER INTENT ENTERS AS A TYPED COMMAND, AND THE RULES DECIDE
 * ============================================================================
 * `technical-design.md` § 4: "Player intent enters as a typed command. The rules
 * layer either refuses it with a reason or emits events." That is what makes
 * authority, chronology, accessibility parity and debrief traceback testable —
 * a button that is merely hidden proves nothing, because a script, a keyboard
 * path or a facilitated table can still reach the act.
 *
 * ★ A REFUSAL IS A NAMED REASON, NEVER A SILENT NO-OP. A control that declines
 * without saying why is indistinguishable from a broken one, and the
 * participant learns that the interface is unreliable rather than that the act
 * was not theirs to take.
 *
 * ⛔ AND A REFUSED COMMAND MUST NOT TOUCH THE WORLD. That is tested directly:
 * the world before and after a refusal must be the same object.
 */

export const COMMANDS = Object.freeze({
  SET_CLOCK_MODE: 'set-clock-mode',
  SET_SPEED: 'set-speed',
  ADVANCE_CYCLE: 'advance-cycle',
  INSPECT_PLACE: 'inspect-place',
  OPEN_PREPARATION_WINDOW: 'open-preparation-window',
});

export const COMMAND_IDS = Object.freeze(Object.values(COMMANDS));

/**
 * The refusal vocabulary. Registered here so a reason cannot be invented at the
 * call site as a string nobody else knows about — the same discipline the
 * refusal registry gave the wider platform.
 */
export const REFUSALS = Object.freeze({
  UNKNOWN_COMMAND: 'unknown-command',
  UNKNOWN_CLOCK_MODE: 'unknown-clock-mode',
  SPEED_OUT_OF_BOUNDS: 'speed-out-of-bounds',
  SPEED_WHILE_PAUSED: 'speed-cannot-be-set-while-paused',
  CANNOT_ADVANCE_WHILE_PAUSED: 'cannot-advance-fictional-time-while-paused',
  UNKNOWN_PLACE: 'unknown-place',
  PREPARATION_WINDOW_NOT_EARNED: 'preparation-window-needs-two-ordinary-cycles',
  PREPARATION_WINDOW_ALREADY_OPEN: 'preparation-window-is-already-open',
  ORDINARY_CYCLES_COMPLETE: 'the-ordinary-morning-has-already-run-its-cycles',
});

/**
 * ★ BOUNDED SPEED. `gameplay-and-state.md` § 3 permits pause and speed control;
 * it does not permit a speed that turns the morning into a reaction test.
 *
 * ⚠️ AND SPEED IS NOT DIFFICULTY. Whatever a participant selects, the same two
 * cycles produce the same events in the same order — speed changes how long a
 * transition takes on screen, never what happens. The non-timed control exists
 * beside it for exactly that reason.
 */
export const SPEEDS = Object.freeze([1, 2, 4]);

export const CLOCK_MODES = Object.freeze(['paused', 'running', 'act-advanced']);

/** A command is a plain, serialisable record. It is part of the save. */
export function command(type, payload = {}) {
  return Object.freeze({ type, ...payload });
}

/**
 * Shape validation only — whether the command is *well formed*. Whether it is
 * *permitted right now* is the rules layer's decision, because that depends on
 * the world and this does not.
 */
export function commandProblem(cmd) {
  if (!cmd || typeof cmd !== 'object') return REFUSALS.UNKNOWN_COMMAND;
  if (!COMMAND_IDS.includes(cmd.type)) return REFUSALS.UNKNOWN_COMMAND;

  switch (cmd.type) {
    case COMMANDS.SET_CLOCK_MODE:
      return CLOCK_MODES.includes(cmd.mode) ? null : REFUSALS.UNKNOWN_CLOCK_MODE;
    case COMMANDS.SET_SPEED:
      return SPEEDS.includes(cmd.speed) ? null : REFUSALS.SPEED_OUT_OF_BOUNDS;
    default:
      return null;
  }
}
