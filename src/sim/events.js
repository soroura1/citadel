/**
 * R0-C01 — DOMAIN EVENTS, IN ORDER.
 *
 * ============================================================================
 * EVENTS ARE THE ONLY WAY THE WORLD CHANGES
 * ============================================================================
 * Commands are refused or they emit events; events update state and drive every
 * projection. Nothing else writes. That is what makes the debrief a
 * reconstruction rather than a second story: the causal history already exists,
 * because it is how the world got here.
 *
 * ★ EVERY EVENT CARRIES ITS FICTIONAL TIME AND A SEQUENCE NUMBER. Chronology is
 * a property of the log, not of the order a renderer happens to read it in, and
 * `assertChronological` is what stops an out-of-order append from becoming a
 * debrief that lies.
 *
 * ★ AND EVERY EVENT CARRIES `changed` — WHAT A PARTICIPANT COULD SEE. R0-S1's
 * acceptance is "I can identify what changed and why", so the answer is
 * recorded when the change happens rather than inferred afterwards by diffing
 * two snapshots and guessing which difference mattered.
 */

export const EVENTS = Object.freeze({
  RUN_STARTED: 'run-started',
  CLOCK_MODE_CHANGED: 'clock-mode-changed',
  SPEED_CHANGED: 'speed-changed',
  TIME_ADVANCED: 'time-advanced',
  DEMAND_CHANGED: 'demand-changed',
  COVERAGE_CHANGED: 'coverage-changed',
  SUPPLY_MOVED: 'supply-moved',
  RESERVE_MOVED: 'reserve-moved',
  TECHNICAL_ASSIGNED: 'technical-assigned',
  WORK_STARTED: 'work-started',
  EVIDENCE_RECORDED: 'evidence-recorded',
  PLACE_INSPECTED: 'place-inspected',
  CYCLE_COMPLETED: 'cycle-completed',
  PREPARATION_WINDOW_OPENED: 'preparation-window-opened',
  COMMAND_REFUSED: 'command-refused',
});

export const EVENT_IDS = Object.freeze(Object.values(EVENTS));

/**
 * @param {string} type
 * @param {{sequence:number, minute:number, cycle:number}} at
 * @param {object} detail  what changed, in the world's own terms
 */
export function domainEvent(type, at, detail = {}) {
  return Object.freeze({
    type,
    sequence: at.sequence,
    minute: at.minute,
    cycle: at.cycle,
    ...detail,
  });
}

export class ChronologyRefusal extends Error {
  constructor(detail) {
    super(`events-out-of-order: ${detail}`);
    this.reason = 'events-out-of-order';
    this.detail = detail;
  }
}

/**
 * ★ SEQUENCE STRICTLY INCREASES; FICTIONAL TIME NEVER RUNS BACKWARDS.
 *
 * Two separate rules, deliberately. Several events can share one fictional
 * minute — a cycle completing moves demand, supply and technical work "at once"
 * — so time is non-decreasing while sequence is strictly increasing. Collapsing
 * them into one rule would either forbid simultaneous change or permit a
 * reordered log.
 */
export function assertChronological(events) {
  for (let i = 1; i < events.length; i++) {
    const previous = events[i - 1];
    const current = events[i];
    if (current.sequence <= previous.sequence) {
      throw new ChronologyRefusal(`sequence ${current.sequence} follows ${previous.sequence}`);
    }
    if (current.minute < previous.minute) {
      throw new ChronologyRefusal(`minute ${current.minute} follows ${previous.minute}`);
    }
  }
  return true;
}

/** A refusal is itself an event: it happened, and the record must show it. */
export function refusalEvent(at, commandType, reason, detail = null) {
  return domainEvent(EVENTS.COMMAND_REFUSED, at, { commandType, reason, detail });
}
