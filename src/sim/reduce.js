/**
 * R0-C02 — EVENTS BECOME STATE. NOTHING ELSE WRITES.
 *
 * ★ ONE DIRECTION, ALWAYS: command → rules → events → state → projections.
 * `technical-design.md` invariant 1 is "one source of state drives visual and
 * structured projections", and the way to keep that true is to leave exactly
 * one function able to produce a new world.
 *
 * ⚠️ THE REDUCER IS PURE AND THE WORLD IS FROZEN. A projection that tries to
 * write throws rather than silently creating a second truth that renders
 * correctly and replays wrong.
 */
import { EVENTS } from './events.js';
import { bellAt } from './clock.js';
import { deepFreeze } from './world.js';

export function reduce(world, event) {
  switch (event.type) {
    case EVENTS.CLOCK_MODE_CHANGED:
      return next(world, { time: { ...world.time, mode: event.mode } });

    case EVENTS.SPEED_CHANGED:
      return next(world, { time: { ...world.time, speed: event.speed } });

    case EVENTS.TIME_ADVANCED: {
      const minute = world.time.minute + event.minutes;
      return next(world, { time: { ...world.time, minute, bell: bellAt(minute) } });
    }

    case EVENTS.DEMAND_CHANGED:
      return next(world, {
        demand: { ...world.demand, band: event.band, reach: event.reach, retained: event.retained },
      });

    case EVENTS.COVERAGE_CHANGED: {
      const service = world.services[event.service];
      return next(world, {
        services: {
          ...world.services,
          // ★ `physicalPositions` is deliberately NOT spread over. Coverage
          // events move staffed capacity; the spaces that physically exist are
          // not something a shift change can create or remove.
          [event.service]: {
            ...service,
            staffedPositions: event.staffedPositions,
            borrowedSupport: event.borrowedSupport ?? service.borrowedSupport,
          },
        },
        staff: event.staffRoute
          ? { ...world.staff, clinical: { ...world.staff.clinical, route: event.staffRoute, workload: 'stretched' } }
          : world.staff,
      });
    }

    case EVENTS.SUPPLY_MOVED:
    case EVENTS.RESERVE_MOVED: {
      const unit = world.supply[event.unit];
      return next(world, {
        supply: {
          ...world.supply,
          [event.unit]: {
            ...unit,
            place: event.place,
            status: event.status,
            destination: event.destination ?? unit.destination,
            waiting: event.waiting ?? unit.waiting,
            // ⛔ `origin` and `custody` are NOT spread from the event, and that
            // is the invariant. Moving a reserve must never erase where it came
            // from or who holds it — otherwise the empty origin the visual
            // contract requires has nothing to render, and the donating service
            // silently stops having lost anything.
            origin: unit.origin,
            custody: unit.custody,
          },
        },
      });
    }

    case EVENTS.TECHNICAL_ASSIGNED:
      return next(world, {
        technical: {
          ...world.technical,
          teams: world.technical.teams.map((team) => team.id === event.team
            // ★ status AND assignment AND place move together. A team recorded
            // as assigned while still standing at the workshop is the shape
            // §18.3 forbids by name, and `worldProblems` refuses it.
            ? { ...team, status: 'assigned', assignment: event.assignment, place: event.place, route: event.route ?? null }
            : team),
        },
      });

    case EVENTS.WORK_STARTED:
      return next(world, {
        work: [...world.work, {
          id: event.id,
          responsibleFunction: event.responsibleFunction,
          place: event.place,
          needs: event.needs,
          startedAtMinute: event.minute,
          status: 'active',
        }],
      });

    case EVENTS.EVIDENCE_RECORDED:
      return next(world, {
        evidence: [...world.evidence, {
          id: event.id,
          claim: event.claim,
          source: event.source,
          confidence: event.confidence,
          accessibility: event.accessibility,
          atMinute: event.minute,
        }],
      });

    case EVENTS.CYCLE_COMPLETED:
      return next(world, { time: { ...world.time, cycle: event.cycle } });

    case EVENTS.PREPARATION_WINDOW_OPENED:
      return next(world, { status: 'preparation-window' });

    case EVENTS.PLACE_INSPECTED:
      // Inspection changes what the participant knows, not what is true. It is
      // recorded in the log — the debrief must be able to say what was looked
      // at — and it moves no operational state.
      return world;

    case EVENTS.RUN_STARTED:
    case EVENTS.COMMAND_REFUSED:
      return world;

    default:
      return world;
  }
}

export const reduceAll = (world, events) => events.reduce(reduce, world);

const next = (world, patch) => deepFreeze({ ...world, ...patch });
