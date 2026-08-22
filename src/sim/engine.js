/**
 * R0-C01/C02 — THE RUN: WORLD, COMMAND LOG, EVENT LOG, REPLAY.
 *
 * ============================================================================
 * ★ A RUN IS ITS COMMAND HISTORY. EVERYTHING ELSE IS DERIVED.
 * ============================================================================
 * `replay(seed, commands)` rebuilds the identical world and the identical event
 * log. That is what makes R0-S5 possible — a participant can test another
 * approach against the same morning — and it is what makes a defect
 * reproducible instead of anecdotal.
 *
 * ⚠️ THE GENERATOR IS CARRIED IN THE RUN. A module-level generator would make
 * two runs in one browser interfere, and would make a replay start from
 * wherever the previous one stopped.
 */
import { initialWorld, validateWorld, worldProblems } from './world.js';
import { assertChronological, domainEvent, refusalEvent, EVENTS } from './events.js';
import { decide } from './rules.js';
import { reduceAll } from './reduce.js';
import { rng } from './rng.js';

export function startRun(seed) {
  const world = validateWorld(initialWorld(seed));
  const started = domainEvent(EVENTS.RUN_STARTED, { sequence: 1, minute: 0, cycle: 0 }, {
    seed,
    changed: 'the run',
    because: 'the participant entered the morning shift',
  });
  return Object.freeze({
    seed,
    world,
    events: Object.freeze([started]),
    commands: Object.freeze([]),
    generator: rng(seed),
    lastRefusal: null,
  });
}

/**
 * Apply one command.
 *
 * ⛔ ON REFUSAL THE WORLD OBJECT IS RETURNED UNCHANGED — the same reference, so
 * a test can assert identity rather than deep equality and a stray mutation
 * cannot hide behind a structural match.
 */
export function dispatch(run, cmd) {
  const at = { sequence: lastSequence(run) };
  const decision = decide(run.world, cmd, run.generator, at);

  if ('refused' in decision) {
    const event = refusalEvent(
      { sequence: at.sequence + 1, minute: run.world.time.minute, cycle: run.world.time.cycle },
      cmd?.type ?? 'unknown', decision.refused, decision.detail ?? null,
    );
    return Object.freeze({
      ...run,
      world: run.world,                       // the SAME object, deliberately
      events: Object.freeze([...run.events, event]),
      commands: Object.freeze([...run.commands, cmd]),
      lastRefusal: { command: cmd?.type ?? 'unknown', reason: decision.refused, detail: decision.detail ?? null },
    });
  }

  const events = decision.events;
  const world = validateWorld(reduceAll(run.world, events));
  const allEvents = [...run.events, ...events];
  assertChronological(allEvents);

  return Object.freeze({
    ...run,
    world,
    events: Object.freeze(allEvents),
    commands: Object.freeze([...run.commands, cmd]),
    lastRefusal: null,
  });
}

export const dispatchAll = (run, commands) => commands.reduce(dispatch, run);

/** Rebuild a run from its seed and command history. */
export const replay = (seed, commands) => dispatchAll(startRun(seed), commands);

/** Events that changed something a participant could see. */
export const visibleChanges = (run) =>
  run.events.filter((event) => event.changed && event.type !== EVENTS.COMMAND_REFUSED);

export const problems = (run) => worldProblems(run.world);

const lastSequence = (run) => run.events.length ? run.events[run.events.length - 1].sequence : 0;
