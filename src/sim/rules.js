/**
 * R0-C02 — THE RULES. A COMMAND IS REFUSED WITH A REASON, OR IT EMITS EVENTS.
 *
 * ★ THE RULES DECIDE; THE INTERFACE ASKS. `technical-design.md` invariant 2:
 * authority is enforced here, not by hiding a button. A hidden control is still
 * reachable from a keyboard path, a facilitated table or a replayed command
 * log, and a rule that only exists as a disabled attribute is not a rule.
 *
 * ⛔ A REFUSAL MUST NOT MUTATE. `decide` returns either `{refused}` or
 * `{events}` and touches nothing either way, so "a rejected command does not
 * silently change state" is true by construction rather than by discipline.
 */
import { COMMANDS, REFUSALS, commandProblem } from './commands.js';
import { EVENTS, domainEvent } from './events.js';
import { ORDINARY_CYCLES, cycleEvents } from './heartbeat.js';
import { PLACE_IDS } from './world.js';

/**
 * @returns {{refused:string, detail?:string}|{events:object[]}}
 */
export function decide(world, cmd, generator, at) {
  const malformed = commandProblem(cmd);
  if (malformed) return { refused: malformed, detail: cmd?.type ?? String(cmd) };

  let sequence = at.sequence;
  const stamp = () => ({ sequence: ++sequence, minute: world.time.minute, cycle: world.time.cycle });

  switch (cmd.type) {
    case COMMANDS.SET_CLOCK_MODE: {
      if (cmd.mode === world.time.mode) return { events: [] };
      return { events: [domainEvent(EVENTS.CLOCK_MODE_CHANGED, stamp(), {
        mode: cmd.mode,
        changed: 'the clock',
        because: cmd.mode === 'paused'
          ? 'the participant paused the morning'
          : `the participant selected ${cmd.mode} time`,
      })] };
    }

    case COMMANDS.SET_SPEED: {
      // ⚠️ Speed is meaningless while paused, and accepting it silently would
      // leave the participant believing they had changed something.
      if (world.time.mode === 'paused') return { refused: REFUSALS.SPEED_WHILE_PAUSED };
      return { events: [domainEvent(EVENTS.SPEED_CHANGED, stamp(), {
        speed: cmd.speed,
        changed: 'clock speed',
        because: 'the participant changed how quickly fictional time passes',
      })] };
    }

    case COMMANDS.ADVANCE_CYCLE: {
      // ⛔ PAUSE STOPS THE WORLD. This is the refusal that makes the pause
      // control mean what it says.
      if (world.time.mode === 'paused') return { refused: REFUSALS.CANNOT_ADVANCE_WHILE_PAUSED };
      if (world.time.cycle >= ORDINARY_CYCLES) return { refused: REFUSALS.ORDINARY_CYCLES_COMPLETE };
      // ★ ONE PATH FOR BOTH MODES. `running` and `act-advanced` produce exactly
      // these events — the non-timed participant is not playing a summary.
      return { events: cycleEvents(world, generator, { sequence }) };
    }

    case COMMANDS.INSPECT_PLACE: {
      if (!PLACE_IDS.includes(cmd.place)) return { refused: REFUSALS.UNKNOWN_PLACE, detail: cmd.place };
      return { events: [domainEvent(EVENTS.PLACE_INSPECTED, stamp(), {
        place: cmd.place,
        changed: 'what you have looked at',
        because: 'the participant inspected a place',
      })] };
    }

    case COMMANDS.OPEN_PREPARATION_WINDOW: {
      if (world.status === 'preparation-window') return { refused: REFUSALS.PREPARATION_WINDOW_ALREADY_OPEN };
      if (world.time.cycle < ORDINARY_CYCLES) return { refused: REFUSALS.PREPARATION_WINDOW_NOT_EARNED };
      return { events: [domainEvent(EVENTS.PREPARATION_WINDOW_OPENED, stamp(), {
        changed: 'the preparation window',
        because: 'the ordinary morning completed its cycles',
      })] };
    }

    default:
      return { refused: REFUSALS.UNKNOWN_COMMAND, detail: cmd.type };
  }
}
