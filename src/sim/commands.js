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
  SCHEDULE_PROJECT: 'schedule-project',
  VERIFY_PROJECT: 'verify-project',
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
  UNKNOWN_PROJECT: 'unknown-project',
  PREPARATION_WINDOW_NOT_OPEN: 'the-preparation-window-is-not-open',
  PROJECT_CAPACITY_REACHED: 'only-two-projects-can-be-undertaken',
  PROJECT_ALREADY_COMMITTED: 'that-project-is-already-under-way',
  NOTHING_TO_VERIFY: 'a-project-must-be-complete-before-it-can-be-verified',
  ALREADY_VERIFIED: 'that-project-has-already-been-verified',
});

/**
 * ★ BOUNDED SPEED. `gameplay-and-state.md` § 3 permits pause and speed control;
 * it does not permit a speed that turns the morning into a reaction test.
 *
 * ⚠️ AND SPEED IS NOT DIFFICULTY. Whatever a participant selects, the same two
 * cycles produce the same events in the same order — speed changes how long a
 * transition takes on screen, never what happens. The non-timed control exists
 * beside it for exactly that reason.
 *
 * ⛔ KNOWN LIMITATION, RECORDED RATHER THAN HIDDEN: in R0-I1 the selection is
 * accepted, validated, refused while paused and stored on the clock — and it
 * has NO OBSERVABLE EFFECT, because the morning advances per committed act and
 * there is no continuous ticker for a multiplier to act on. The control is
 * therefore honest about its bounds and currently silent about its result,
 * which is a shape this project distrusts. It becomes real when continuous
 * fictional time arrives; until then the ledger carries it as a limitation.
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
