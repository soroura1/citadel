/**
 * R0-C03 — THE ORDINARY HOSPITAL HEARTBEAT.
 *
 * ============================================================================
 * THE INSTITUTION IS ALREADY WORKING, AND IT DOES NOT WAIT FOR A BUTTON
 * ============================================================================
 * `gameplay-and-state.md` § 2 names the smallest repeatable cycle: arrivals and
 * demand, staff assignment and handover, service work, supply movement,
 * technical inspection and maintenance. "Each continues when nothing dramatic is
 * happening."
 *
 * XP0 showed an ordinary morning as a fixed picture with a *narration button*
 * under it. This file is the correction: one cycle emits the operational events
 * that move demand, coverage, supply, the reserve and technical capacity, and
 * the picture follows from them.
 *
 * ============================================================================
 * ★ THE THREE ACCEPTED STATES ARE NOT SCENE NAMES
 * ============================================================================
 * `ordinary-steady`, `ordinary-high-stable` and `ordinary-rising` are the
 * accepted visual states (`visual-and-interaction-bible.md` § 19.1) — and they
 * are **derived** from demand, staffed coverage, custody and technical
 * assignment, never stored and never selected by name. `classifyOrdinary` in
 * the projection layer reads the world; nothing writes a state label into it.
 *
 * If a future cycle produced high demand with both carts at origin and both
 * teams available, the projection would honestly call it high-stable. The
 * states are a reading of the world, which is what makes them worth reading.
 *
 * ⛔ AND THE CYCLE IS BOUNDED. Two ordinary cycles open the preparation window;
 * a third is refused. R0-I1 is the living morning, not an idle simulator, and
 * `R0-C05` owns what the participant then does with the window.
 */
import { EVENTS, domainEvent } from './events.js';
import { CYCLE_MINUTES, ORDINARY_CYCLES } from './clock.js';
import { jitter } from './rng.js';
import { FUNCTIONS, PLACES } from './world.js';
import { advanceState } from './projects.js';
import { reduce } from './reduce.js';

export { ORDINARY_CYCLES };

/**
 * ★ ONE CYCLE, AS A LIST OF EVENTS.
 *
 * Pure: it reads the world and the generator and returns events. It writes
 * nothing. The reducer applies them, which keeps "what happened" and "what is
 * true now" in one direction and makes replay a matter of re-running this.
 *
 * The two cycles are authored rather than emergent, and that is deliberate for
 * R0-I1: `R0-P03` froze the accepted transition as *ordinary state → cycle one
 * → cycle two → preparation window*, and the visual contract froze what each
 * cycle must look like. Emergent demand curves arrive with the pressure
 * director at `R0-C06`; inventing one here would produce a morning the accepted
 * visual states could not describe.
 */
export function cycleEvents(world, generator, at) {
  const events = [];
  const cycle = world.time.cycle + 1;
  const minute = world.time.minute + CYCLE_MINUTES;
  let sequence = at.sequence;
  const stamp = () => ({ sequence: ++sequence, minute, cycle });

  events.push(domainEvent(EVENTS.TIME_ADVANCED, stamp(), {
    minutes: CYCLE_MINUTES,
    changed: 'fictional time',
    because: 'an ordinary heartbeat cycle completed',
  }));

  // --- 1. arrivals and demand ---------------------------------------------
  // Bounded jitter: the reach moves within its band, never across it.
  if (cycle === 1) {
    events.push(domainEvent(EVENTS.DEMAND_CHANGED, stamp(), {
      band: 'high-stable',
      reach: round(jitter(generator, 0.45, 0.02)),
      retained: true,
      changed: 'ED demand',
      because: 'arrivals continued while the threshold cleared more slowly than they came',
    }));
  } else {
    events.push(domainEvent(EVENTS.DEMAND_CHANGED, stamp(), {
      band: 'rising',
      reach: round(jitter(generator, 0.62, 0.02)),
      retained: true,
      changed: 'ED demand',
      because: 'retained arrivals advanced past the ED threshold instead of clearing',
    }));
  }

  // --- 2. staff assignment, handover and service work ----------------------
  // ★ Coverage thins in cycle two. The PHYSICAL positions do not change, which
  // is the contradiction the participant is meant to be able to inspect.
  if (cycle === 2) {
    events.push(domainEvent(EVENTS.COVERAGE_CHANGED, stamp(), {
      service: 'icu',
      staffedPositions: 5,
      borrowedSupport: true,
      staffRoute: 'icu-support',
      changed: 'ICU staffed coverage',
      because: 'a bedside team moved to borrowed support; the eight physical positions remain',
    }));
  }

  // --- 3. supply movement ---------------------------------------------------
  if (cycle === 1) {
    events.push(domainEvent(EVENTS.SUPPLY_MOVED, stamp(), {
      unit: 'ordinaryCart',
      place: PLACES.ED,
      status: 'in-transit',
      destination: PLACES.ED,
      waiting: false,
      changed: 'ordinary supply',
      because: 'the routine stores delivery left for the emergency department',
    }));
  } else {
    events.push(domainEvent(EVENTS.SUPPLY_MOVED, stamp(), {
      unit: 'ordinaryCart',
      place: PLACES.ED,
      status: 'in-transit',
      destination: PLACES.ED,
      waiting: true,
      changed: 'ordinary supply',
      because: 'the delivery is holding on the centre route while the reserve moves',
    }));
    // ★ The reserve leaves its origin — and the origin stays in the record.
    events.push(domainEvent(EVENTS.RESERVE_MOVED, stamp(), {
      unit: 'mobileReserve',
      place: PLACES.ICU,
      status: 'committed',
      destination: PLACES.ICU,
      changed: 'mobile reserve custody',
      because: 'the critical-care reserve was committed to intensive care',
      donatingService: 'ed',
    }));
  }

  // --- 4. technical inspection and maintenance ------------------------------
  if (cycle === 1) {
    events.push(domainEvent(EVENTS.TECHNICAL_ASSIGNED, stamp(), {
      team: 'tech-a',
      place: PLACES.ED,
      assignment: 'service-route inspection',
      route: 'workshop-service',
      changed: 'technical capacity',
      because: 'one team took the routine service-route inspection',
    }));
  } else {
    events.push(domainEvent(EVENTS.TECHNICAL_ASSIGNED, stamp(), {
      team: 'tech-a',
      place: PLACES.UNDERWORKS,
      assignment: 'underworks maintenance round',
      route: 'workshop-underworks',
      changed: 'technical capacity',
      because: 'the inspection continued into the Underworks maintenance round',
    }));
    events.push(domainEvent(EVENTS.WORK_STARTED, stamp(), {
      id: 'work-underworks-round',
      responsibleFunction: FUNCTIONS.FACILITIES,
      place: PLACES.UNDERWORKS,
      needs: 'service access window',
      changed: 'active work',
      because: 'a maintenance round occupies the Underworks work site',
    }));
    // ⚠️ Evidence, not a clue reveal. This records only that the official and
    // observed routes have not been compared — `not investigated`, which § 6 of
    // the mechanics authority keeps distinct from `unknown`. The dependency
    // discovery itself belongs to R0-C06.
    events.push(domainEvent(EVENTS.EVIDENCE_RECORDED, stamp(), {
      id: 'ev-power-path-uninspected',
      claim: 'The declared critical-power route to the ICU has not been walked this morning.',
      source: 'facilities round sheet',
      confidence: 'not-investigated',
      accessibility: 'available on request',
      changed: 'evidence',
      because: 'the maintenance round passed the power path without comparing it',
    }));
  }

  events.push(domainEvent(EVENTS.CYCLE_COMPLETED, stamp(), {
    cycle,
    changed: 'the ordinary cycle',
    because: 'every ordinary process completed one turn',
  }));

  // ★ Exactly two cycles open the window. Named as a rule, not a magic literal
  // buried in a conditional.
  if (cycle >= ORDINARY_CYCLES) {
    events.push(domainEvent(EVENTS.PREPARATION_WINDOW_OPENED, stamp(), {
      changed: 'the preparation window',
      because: `the ordinary morning completed ${ORDINARY_CYCLES} cycles`,
    }));
  }

  return events;
}

const round = (value) => Math.round(value * 1000) / 1000;

/**
 * ★ R0-C05 — ONE CYCLE OF PREPAREDNESS WORK.
 *
 * The ordinary heartbeat does not stop when the window opens; preparedness work
 * happens *inside* the working morning, which is the point. Each cycle advances
 * every project that is scheduled, working or disrupted, using the ladder in
 * `projects.js`.
 *
 * ⛔ NOTHING HERE REACHES `verified`. Time performs work; only a responsible
 * function can test it. That separation is the entire reason the ladder has six
 * states rather than five, and putting verification on a timer would erase it
 * while every test still passed.
 *
 * ⚠️ AND A DISRUPTED PROJECT STAYS DISRUPTED UNTIL ITS CONTENTION CLEARS. It
 * does not fail, and it does not quietly resume: the unfinished site remains
 * and the cost already paid is not refunded.
 */
export function preparationCycleEvents(world, generator, at) {
  const events = [];
  const minute = world.time.minute + CYCLE_MINUTES;
  let sequence = at.sequence;
  const stamp = () => ({ sequence: ++sequence, minute, cycle: world.time.cycle });

  events.push(domainEvent(EVENTS.TIME_ADVANCED, stamp(), {
    minutes: CYCLE_MINUTES,
    changed: 'fictional time',
    because: 'a cycle of preparedness work passed',
  }));

  // ⚠️ ADVANCE AGAINST A MOVING WORLD, not a snapshot. Each project's state is
  // decided against the world as it stands after the previous project moved —
  // otherwise two projects could both "win" the same resource in one cycle
  // because each was compared with a world in which the other had not yet acted.
  let current = world;
  for (const id of Object.keys(world.projects)) {
    const step = advanceState(current, id);
    if (!step) continue;
    const event = domainEvent(EVENTS.PROJECT_STATE_CHANGED, stamp(), {
      project: id,
      state: step.state,
      changed: `${id.replace(/-/g, ' ')}`,
      because: step.because,
    });
    events.push(event);
    current = reduce(current, event);
  }

  return events;
}
